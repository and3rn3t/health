import type { Hono } from 'hono';
import {
  corsHeaders,
  deriveRateLimitKey,
  getAuthSub,
  log,
  pushAnalytics,
  rateLimitDO,
  requireAuth,
  shouldSample,
} from './helpers';
import type { Env } from './types';

/**
 * Register global middleware on the Hono app instance.
 * Must be called before route registration so middleware applies to all routes.
 */
export function registerMiddleware(app: Hono<{ Bindings: Env }>) {
  // -----------------------------------------------------------------------
  // Preflight and security headers
  // -----------------------------------------------------------------------
  app.use('*', async (c, next) => {
    const start = Date.now();
    const origin = c.req.header('Origin') || null;
    const allowed = (c.env?.ALLOWED_ORIGINS || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const correlationId = crypto.randomUUID();

    if (c.req.method === 'OPTIONS') {
      const h = corsHeaders(origin, allowed);
      h.set('X-Correlation-Id', correlationId);
      return c.newResponse(null, { status: 204, headers: h });
    }

    await next();
    let resp = c.res ?? new Response(null);

    const path = new URL(c.req.url).pathname;
    const isLoginPage = path === '/login' || path.startsWith('/login/');
    const isDemoPage = path === '/demo' || path.startsWith('/demo/');
    const isDocsPage = path.startsWith('/api/docs');

    let csp: string;
    const auth0DomainRaw =
      (c.env && (c.env as { AUTH0_DOMAIN?: string }).AUTH0_DOMAIN) || '';
    const auth0Origin = auth0DomainRaw
      ? `https://${auth0DomainRaw}`
      : 'https://*.auth0.com';
    const baseOrigin = c.env?.BASE_URL || new URL(c.req.url).origin;
    const wssOrigin = baseOrigin.replace(/^http/, 'ws');
    if (isLoginPage) {
      csp = [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' https://cdn.auth0.com",
        `connect-src 'self' ${auth0Origin} ${wssOrigin}`,
        "frame-ancestors 'none'",
      ].join('; ');
    } else if (isDemoPage) {
      csp = [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "script-src 'self' 'unsafe-inline'",
        `connect-src 'self' ${wssOrigin}`,
        "frame-ancestors 'none'",
      ].join('; ');
    } else if (isDocsPage) {
      csp = [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline' https://unpkg.com",
        "script-src 'self' 'unsafe-inline' https://unpkg.com",
        "connect-src 'self'",
        "frame-ancestors 'none'",
      ].join('; ');
    } else {
      csp = [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
        "font-src 'self' https://fonts.gstatic.com",
        "script-src 'self'",
        `connect-src 'self' ${auth0Origin} ${wssOrigin}`,
        `frame-src 'self' ${auth0Origin} https://*.auth0.com`,
        "frame-ancestors 'none'",
      ].join('; ');
    }

    if (resp.status !== 101) {
      const newHeaders = new Headers(resp.headers);
      newHeaders.set(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains; preload'
      );
      newHeaders.set('X-Content-Type-Options', 'nosniff');
      newHeaders.set('X-Frame-Options', 'DENY');
      newHeaders.set('Referrer-Policy', 'no-referrer');
      newHeaders.set('Cross-Origin-Opener-Policy', 'same-origin');
      newHeaders.set('Cross-Origin-Embedder-Policy', 'credentialless');
      newHeaders.set(
        'Permissions-Policy',
        'geolocation=(), microphone=(), camera=()'
      );
      newHeaders.set('Content-Security-Policy', csp);
      if (!newHeaders.has('X-Correlation-Id')) {
        newHeaders.set('X-Correlation-Id', correlationId);
      }
      const cors = corsHeaders(origin, allowed);
      cors.forEach((v, k) => newHeaders.set(k, v));
      resp = new Response(resp.body, {
        status: resp.status,
        headers: newHeaders,
      });
    }
    c.res = resp;
    try {
      if (resp.headers.get('X-Error-Logged') === '1') return resp;
      const urlObj = new URL(c.req.url);
      const reqPath = urlObj.pathname;
      const method = c.req.method;
      const status = resp.status;
      const durMs = Date.now() - start;
      if ((reqPath.startsWith('/api/') && shouldSample(c)) || status >= 500) {
        const sub = getAuthSub(c);
        log.info('http_request', {
          path: reqPath,
          method,
          status,
          durMs,
          correlationId,
          hasSub: Boolean(sub),
        });
        await pushAnalytics(c, {
          path: reqPath,
          method,
          status,
          durMs,
          correlationId,
          sub,
        });
      }
    } catch {
      // ignore
    }
  });

  // -----------------------------------------------------------------------
  // API-wide middleware: rate limiting and auth
  // -----------------------------------------------------------------------
  app.use('/api/*', async (c, next) => {
    const url = new URL(c.req.url);
    const pathname = url.pathname;
    const publicInfo =
      c.req.method === 'GET' &&
      (pathname === '/api/ws-url' ||
        pathname === '/api/ws-device-token' ||
        pathname === '/api/ws-user-id' ||
        pathname === '/api/ws-live-enabled' ||
        pathname.startsWith('/api/docs'));

    const key = deriveRateLimitKey(c);
    if (!(await rateLimitDO(c, key)))
      return c.json({ error: 'rate_limited' }, 429);

    if (!publicInfo && !(await requireAuth(c))) {
      return c.json({ error: 'unauthorized' }, 401);
    }
    await next();

    // API responses must never be cached by browsers or intermediaries
    if (c.res && c.res.status !== 101) {
      const h = new Headers(c.res.headers);
      h.set('Cache-Control', 'no-store');
      c.res = new Response(c.res.body, { status: c.res.status, headers: h });
    }
  });

  // -----------------------------------------------------------------------
  // Serve static assets via Wrangler [assets] binding
  // -----------------------------------------------------------------------
  app.use('/*', async (c, next) => {
    if (c.req.method !== 'GET') return next();
    const urlObj = new URL(c.req.url);
    const p = urlObj.pathname;
    if (p === '/app-config.js') return next();
    const hasCode = urlObj.searchParams.has('code');
    const hasState = urlObj.searchParams.has('state');
    if ((hasCode || hasState) && p !== '/callback') {
      return c.redirect(`/callback${urlObj.search}`, 302);
    }
    if (p === '/login' || p.startsWith('/login/') || p === '/callback')
      return next();

    const res = await c.env.ASSETS?.fetch(c.req.raw);
    if (!res || res.status === 404) return next();

    try {
      const env = c.env.ENVIRONMENT || 'development';
      const pathname = urlObj.pathname;
      const isHtml = pathname.endsWith('.html') || pathname === '/';
      const isJs = /\.(m?js)(?:\?.*)?$/.test(pathname);
      const isCss = /\.(css)(?:\?.*)?$/.test(pathname);
      const isFont = /\.(woff2?|ttf|otf)(?:\?.*)?$/.test(pathname);
      const isImg = /\.(png|svg|jpg|jpeg|gif|webp|ico)(?:\?.*)?$/.test(
        pathname
      );
      const cloneWith = (mutate: (h: Headers) => void) => {
        const h = new Headers(res.headers);
        mutate(h);
        return new Response(res.body, { status: res.status, headers: h });
      };
      if (env === 'production') {
        if (isHtml) {
          return cloneWith((h) => {
            h.set('Cache-Control', 'no-cache, must-revalidate');
          });
        }
        if (isJs || isCss || isFont || isImg) {
          return cloneWith((h) => {
            h.set('Cache-Control', 'public, max-age=31536000, immutable');
          });
        }
      } else if (isHtml || isJs || isCss) {
        return cloneWith((h) => {
          h.set('Cache-Control', 'no-store, must-revalidate');
          h.delete('ETag');
          h.delete('Last-Modified');
        });
      }
    } catch {
      // fall through with original response
    }

    return res;
  });
}
