/**
 * Cloudflare Workers entry point for the Health App
 * This file handles the worker logic and serves the built application
 */

// Cloudflare Worker types
declare global {
  // WebSocketPair is already declared in @cloudflare/workers-types
}

interface DurableObjectNamespace {
  get(id: DurableObjectId): DurableObjectStub;
  idFromName(name: string): DurableObjectId;
  idFromString(id: string): DurableObjectId;
  newUniqueId(): DurableObjectId;
}

interface DurableObjectId {
  toString(): string;
  equals(other: DurableObjectId): boolean;
}

interface DurableObjectStub {
  fetch(request: Request): Promise<Response>;
}

interface CloudflareWebSocket extends WebSocket {
  accept(): void;
}

import { HealthDataProcessor } from '@/lib/enhancedHealthProcessor';
import {
  getTtlSecondsForType,
  purgeOldHealthData,
  type KVNamespaceLite,
} from '@/lib/retention';
import {
  corsHeaders,
  decodeJwtPayload,
  decryptJSON,
  encryptJSON,
  getAesKey,
  log,
  signJwtHS256,
  validateBearerJWT,
  verifyJwtWithJwks,
  writeAudit,
} from '@/lib/security';
import {
  healthMetricBatchSchema,
  healthMetricSchema,
  processedHealthDataSchema,
  type ProcessedHealthData,
} from '@/schemas/health';
import { Hono, type Context } from 'hono';
import { z } from 'zod';

type Env = {
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string; // comma-separated
  ENC_KEY?: string; // base64 32 bytes
  API_ISS?: string;
  API_AUD?: string;
  API_JWKS_URL?: string;
  DEVICE_JWT_SECRET?: string; // HS256 secret for device-issued tokens (dev/edge)
  HEALTH_KV?: {
    put: (
      key: string,
      value: string,
      options?: { expirationTtl?: number }
    ) => Promise<void>;
    get?: (key: string) => Promise<string | null>;
    list?: (opts: {
      prefix?: string;
      limit?: number;
      cursor?: string;
    }) => Promise<{
      keys: Array<{ name: string }>;
      list_complete?: boolean;
      cursor?: string;
    }>;
    delete?: (key: string) => Promise<void>;
  };
  HEALTH_STORAGE?: {
    put: (
      key: string,
      data: string | ReadableStream | ArrayBuffer,
      opts?: { httpMetadata?: { contentType?: string } }
    ) => Promise<unknown>;
    get: (
      key: string,
      opts?: { range?: { offset: number; length?: number } }
    ) => Promise<{ body?: ReadableStream | null } | null>;
    list: (opts?: { prefix?: string; limit?: number }) => Promise<{
      objects: Array<{ key: string; uploaded?: string | Date }>;
    }>;
  };
  ASSETS?: {
    fetch: (req: Request) => Promise<Response>;
  };
  RATE_LIMITER?: {
    idFromName: (name: string) => unknown;
    get: (id: unknown) => {
      fetch: (req: Request | string) => Promise<Response>;
    };
  };
  AUTH0_DOMAIN?: string;
  AUTH0_CLIENT_ID?: string;
  BASE_URL?: string;
  WEBSOCKET_URL?: string;
  HEALTH_WEBSOCKET?: DurableObjectNamespace; // Durable Object namespace
};

const app = new Hono<{ Bindings: Env }>();

// Simple token-bucket rate limiter (per IP in-memory, acceptable for single isolate; use Durable Objects for distributed)
const buckets = new Map<string, { tokens: number; last: number }>();
function rateLimit(ip: string, limit = 60, intervalMs = 60_000): boolean {
  const now = Date.now();
  const b = buckets.get(ip) || { tokens: limit, last: now };
  const elapsed = now - b.last;
  const refill = Math.floor(elapsed / intervalMs) * limit;
  b.tokens = Math.min(limit, b.tokens + refill);
  b.last = now;
  if (b.tokens <= 0) {
    buckets.set(ip, b);
    return false;
  }
  b.tokens -= 1;
  buckets.set(ip, b);
  return true;
}

async function rateLimitDO(
  c: Context<{ Bindings: Env }>,
  key: string,
  limit = 60,
  intervalMs = 60_000
): Promise<boolean> {
  try {
    if (!c.env.RATE_LIMITER) return rateLimit(key, limit, intervalMs);
    const id = c.env.RATE_LIMITER.idFromName(key);
    const stub = c.env.RATE_LIMITER.get(id);
    const u = new URL('https://do.local/consume');
    u.searchParams.set('key', key);
    u.searchParams.set('limit', String(limit));
    u.searchParams.set('intervalMs', String(intervalMs));
    const resp = await stub.fetch(new Request(u.toString()));
    if (!resp.ok) return false;
    const body = (await resp.json().catch(() => ({ ok: false }))) as {
      ok?: boolean;
    };
    return Boolean(body.ok);
  } catch {
    // Fallback to in-memory limiter on errors
    return rateLimit(key, limit, intervalMs);
  }
}

function deriveRateLimitKey(c: Context<{ Bindings: Env }>): string {
  // Prefer per-user limit from JWT sub, fallback to IP
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const sub = token
    ? (decodeJwtPayload(token)?.sub as string | undefined)
    : undefined;
  return sub || c.req.header('CF-Connecting-IP') || 'anon';
}

async function requireAuth(c: Context<{ Bindings: Env }>): Promise<boolean> {
  // Allow requests from demo page without auth
  const referer = c.req.header('Referer') || '';
  const isDemoRequest =
    referer.includes('/demo') || c.req.header('X-Demo-Mode') === 'true';

  if (c.env.ENVIRONMENT !== 'production' || isDemoRequest) return true;

  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  const jwksUrl =
    c.env.API_JWKS_URL ||
    (c.env.AUTH0_DOMAIN
      ? `https://${c.env.AUTH0_DOMAIN}/.well-known/jwks.json`
      : undefined);
  if (jwksUrl) {
    const check = await verifyJwtWithJwks(token, {
      iss:
        c.env.API_ISS ||
        (c.env.AUTH0_DOMAIN ? `https://${c.env.AUTH0_DOMAIN}/` : undefined),
      aud: c.env.API_AUD,
      jwksUrl,
    });
    return check.ok;
  }
  const check = await validateBearerJWT(token, {
    iss:
      c.env.API_ISS ||
      (c.env.AUTH0_DOMAIN ? `https://${c.env.AUTH0_DOMAIN}/` : undefined),
    aud: c.env.API_AUD,
  });
  return check.ok;
}

// Preflight and security headers
app.use('*', async (c, next) => {
  const origin = c.req.header('Origin') || null;
  const allowed = (c.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  const correlationId = crypto.randomUUID();

  if (c.req.method === 'OPTIONS') {
    const h = corsHeaders(origin, allowed);
    h.set('X-Correlation-Id', correlationId);
    return c.newResponse(null, { status: 204, headers: h });
  }

  // Run downstream handler; Hono sets c.res
  await next();
  const baseResp = c.res ?? new Response(null);

  // Use relaxed CSP for login page to allow Auth0 scripts, and for demo page to allow Google Fonts
  const path = new URL(c.req.url).pathname;
  const isLoginPage = path === '/login' || path.startsWith('/login/');
  const isDemoPage = path === '/demo' || path.startsWith('/demo/');

  let csp: string;
  if (isLoginPage) {
    csp = [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline'",
      "script-src 'self' 'unsafe-inline' https://cdn.auth0.com https://static.cloudflareinsights.com",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
    ].join('; ');
  } else if (isDemoPage) {
    csp = [
      "default-src 'self'",
      "img-src 'self' data: https:",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "script-src 'self' 'unsafe-inline' https://static.cloudflareinsights.com",
      "connect-src 'self' https: wss:",
      "frame-ancestors 'none'",
    ].join('; ');
  } else {
    const auth0 = c.env.AUTH0_DOMAIN
      ? `https://${c.env.AUTH0_DOMAIN}`
      : 'https://*.auth0.com';
    csp = [
      "default-src 'self'",
      // Allow local and external images (e.g., icons, remote logos)
      "img-src 'self' data: https:",
      // Allow inlined styles and Google Fonts CSS for branding
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Allow Google Fonts files
      "font-src 'self' https://fonts.gstatic.com",
      // App scripts are self only
      "script-src 'self'",
      // API/WebSocket connections
      "connect-src 'self' https: wss:",
      // Allow Auth0 silent auth iframes and keep clickjacking protection
      `frame-src 'self' ${auth0} https://*.auth0.com`,
      "frame-ancestors 'none'",
    ].join('; ');
  }

  try {
    const h = baseResp.headers;
    h.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
    h.set('X-Content-Type-Options', 'nosniff');
    h.set('X-Frame-Options', 'DENY');
    h.set('Referrer-Policy', 'no-referrer');
    h.set('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    h.set('Content-Security-Policy', csp);
    h.set('X-Correlation-Id', correlationId);
    const cors = corsHeaders(origin, allowed);
    cors.forEach((v, k) => h.set(k, v));
  } catch (e) {
    log.warn('header_injection_failed', { error: (e as Error).message });
  }
  return baseResp;
});

// API-wide middleware: rate limiting and auth (auth is a no-op in non-production)
app.use('/api/*', async (c, next) => {
  const url = new URL(c.req.url);
  const pathname = url.pathname;
  // Allowlist harmless info endpoints for unauthenticated GETs
  const publicInfo =
    c.req.method === 'GET' &&
    (pathname === '/api/ws-url' ||
      pathname === '/api/ws-device-token' ||
      pathname === '/api/ws-user-id' ||
      pathname === '/api/ws-live-enabled');

  const key = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, key)))
    return c.json({ error: 'rate_limited' }, 429);

  if (!publicInfo && !(await requireAuth(c))) {
    return c.json({ error: 'unauthorized' }, 401);
  }
  return next();
});

// Serve static assets via Wrangler [assets] binding; fallback to next on 404
app.use('/*', async (c, next) => {
  // Only try to serve assets for GET requests to avoid consuming request body
  if (c.req.method !== 'GET') return next();
  // Bypass ASSETS for server-rendered pages like /login and /callback
  const urlObj = new URL(c.req.url);
  const p = urlObj.pathname;
  // Normalize Auth0 callback on any asset request
  const hasCode = urlObj.searchParams.has('code');
  const hasState = urlObj.searchParams.has('state');
  if ((hasCode || hasState) && p !== '/callback') {
    return c.redirect(`/callback${urlObj.search}`, 302);
  }
  if (p === '/login' || p.startsWith('/login/') || p === '/callback') {
    return next();
  }

  const res = await c.env.ASSETS?.fetch(c.req.raw);
  if (!res || res.status === 404) return next();
  return res;
});

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown',
  });
});

// Note: The custom /login page is defined later with full HTML and headers

// Runtime config for SPA: exposes safe public variables
app.get('/app-config.js', (c) => {
  const domain = c.env.AUTH0_DOMAIN || '';
  const clientId = c.env.AUTH0_CLIENT_ID || '';
  const baseUrl = c.env.BASE_URL || new URL(c.req.url).origin;
  const redirectUri = `${baseUrl}/callback`;
  const kvMode =
    (c.env.ENVIRONMENT || 'unknown') === 'production' ? 'local' : 'network';
  const js = `// Runtime app config (loaded before app bundle)
window.__VITALSENSE_CONFIG__ = ${JSON.stringify({
    environment: c.env.ENVIRONMENT || 'unknown',
    auth0: {
      domain,
      clientId,
      redirectUri,
      audience: 'https://vitalsense-health-api',
      scope:
        'openid profile email read:health_data write:health_data manage:emergency_contacts',
    },
  })};

// KV mode hint: 'local' => client-only storage; 'network' => use server endpoint
window.__VITALSENSE_KV_MODE = ${JSON.stringify(kvMode)};

// Compatibility for @github/spark/hooks (expects a global var, not just window prop)
var BASE_KV_SERVICE_URL = ${JSON.stringify(kvMode === 'network' ? '/api' : '')};
// also expose on window for code that reads from window
window.BASE_KV_SERVICE_URL = BASE_KV_SERVICE_URL;
`;
  return new Response(js, {
    headers: { 'content-type': 'application/javascript; charset=utf-8' },
  });
});

// Auth callback: serve SPA index at /callback so Auth0 SDK can complete the flow
app.get('/callback', async (c) => {
  try {
    // If this is accessed without OAuth params, redirect home
    const current = new URL(c.req.url);
    const hasCode = current.searchParams.has('code');
    const hasState = current.searchParams.has('state');
    if (!hasCode && !hasState) {
      // Heuristic: if Auth0 SPA session cookie exists, assume authenticated
      const cookie = c.req.header('Cookie') || '';
      if (cookie.includes('auth0.is.authenticated=true')) {
        return c.redirect('/', 302);
      }
      return c.redirect('/', 302);
    }
    // Serve the app shell (index.html) while preserving the /callback path
    const url = new URL(c.req.url);
    const indexUrl = new URL('/index.html', url.origin);
    const req = new Request(indexUrl.toString(), { method: 'GET' });
    const res = await c.env.ASSETS?.fetch(req);
    if (!res || res.status === 404) {
      return c.text('Callback handler unavailable (index.html not found)', 500);
    }
    return res;
  } catch (_err) {
    try {
      console.error('callback_handler_error', _err);
    } catch {
      /* noop */
    }
    return c.text('Callback handler error', 500);
  }
});

// WebSocket configuration endpoints
app.get('/api/ws-url', (c) => {
  const protocol = c.req.url.startsWith('https') ? 'wss' : 'ws';
  const host = new URL(c.req.url).host;
  return c.json({
    url: `${protocol}://${host}/ws`,
    fallback: c.env.WEBSOCKET_URL || `${protocol}://${host}/ws`,
  });
});

app.get('/api/ws-device-token', (c) => {
  // For demo mode, return a mock token
  const referer = c.req.header('Referer') || '';
  if (referer.includes('/demo')) {
    return c.json({ token: 'demo-device-token' });
  }
  // In production, this would generate a real device token
  return c.json({ token: 'device-token-placeholder' });
});

app.get('/api/ws-user-id', (c) => {
  // For demo mode, return the demo user ID
  const referer = c.req.header('Referer') || '';
  if (referer.includes('/demo')) {
    return c.json({ userId: 'demo-user-vitalsense' });
  }
  // In production, this would extract user ID from JWT
  return c.json({ userId: 'user-id-placeholder' });
});

// Whether live updates should be enabled by default (public info)
app.get('/api/ws-live-enabled', (c) => {
  // In production, default to enabled; clients may still disable locally
  return c.json({ enabled: true });
});

// User emergency contacts persistence
// GET returns user's saved emergency contacts (empty array if none)
app.get('/api/user/emergency-contacts', async (c) => {
  try {
    const kv = c.env.HEALTH_KV;
    if (!kv || typeof kv.get !== 'function') {
      return c.json({ contacts: [] }, 200);
    }
    const auth = c.req.header('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = token ? decodeJwtPayload(token) : null;
    const sub = (payload?.sub as string | undefined) || null;
    if (!sub) return c.json({ error: 'unauthorized' }, 401);
    const key = `user:contacts:${encodeURIComponent(sub)}`;
    const raw = await kv.get(key);
    if (!raw) return c.json({ contacts: [], updatedAt: null }, 200);

    // Decrypt if ENC_KEY is configured, otherwise parse JSON
    const encKeyB64 = c.env.ENC_KEY;
    let obj: Record<string, unknown> | null = null;
    try {
      if (encKeyB64) {
        const keyObj = await getAesKey(encKeyB64);
        obj = await decryptJSON<Record<string, unknown>>(keyObj, raw);
      } else {
        obj = JSON.parse(raw);
      }
    } catch (e) {
      log.error('contacts_read_parse_failed', { error: (e as Error).message });
      return c.json({ error: 'contacts_parse_failed' }, 500);
    }
    const contacts = Array.isArray(obj?.contacts)
      ? (obj.contacts as string[])
      : [];
    const updatedAt = (obj?.updatedAt as string | undefined) || null;
    return c.json({ contacts, updatedAt }, 200);
  } catch (e) {
    log.error('contacts_read_failed', { error: (e as Error).message });
    return c.json({ error: 'contacts_read_failed' }, 500);
  }
});

// PUT saves user's emergency contacts; requires manage:emergency_contacts permission
app.put('/api/user/emergency-contacts', async (c) => {
  try {
    const kv = c.env.HEALTH_KV;
    if (!kv || typeof kv.put !== 'function') {
      return c.json({ error: 'storage_unavailable' }, 503);
    }
    const auth = c.req.header('Authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    const payload = token ? decodeJwtPayload(token) : null;
    const sub = (payload?.sub as string | undefined) || null;
    if (!sub) return c.json({ error: 'unauthorized' }, 401);

    // Permission check: Auth0 may include permissions[] or scope string
    const perms = (payload?.permissions as string[] | undefined) || [];
    const scope = (payload?.scope as string | undefined) || '';
    const hasManagePerm =
      perms.includes('manage:emergency_contacts') ||
      scope.split(' ').includes('manage:emergency_contacts');
    if (!hasManagePerm) return c.json({ error: 'forbidden' }, 403);

    const body = await c.req.json().catch(() => null as unknown);
    const schema = z.object({
      contacts: z.array(z.string().min(1).max(256)).max(50),
    });
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: 'invalid_body', details: parsed.error.flatten() },
        400
      );
    }
    // dedupe + normalize whitespace
    const contacts = Array.from(
      new Set(parsed.data.contacts.map((s) => s.trim()).filter(Boolean))
    );
    const key = `user:contacts:${encodeURIComponent(sub)}`;
    const valueObj = {
      version: 1,
      updatedAt: new Date().toISOString(),
      contacts,
    };
    let toStore: string;
    const encKeyB64 = c.env.ENC_KEY;
    if (encKeyB64) {
      const keyObj = await getAesKey(encKeyB64);
      toStore = await encryptJSON(keyObj, valueObj);
    } else {
      toStore = JSON.stringify(valueObj);
    }
    await kv.put(key, toStore);
    await writeAudit(c.env, {
      type: 'update_contacts',
      actor: sub,
      resource: 'kv:user:contacts',
      meta: { count: contacts.length },
    });
    return c.json({ ok: true, updatedAt: valueObj.updatedAt }, 200);
  } catch (e) {
    log.error('contacts_write_failed', { error: (e as Error).message });
    return c.json({ error: 'contacts_write_failed' }, 500);
  }
});

// WebSocket endpoint for real-time health data
app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  if (!c.env.HEALTH_WEBSOCKET) {
    return c.text('WebSocket service not available', 503);
  }

  // Get or create Durable Object instance
  const id = c.env.HEALTH_WEBSOCKET.newUniqueId();
  const obj = c.env.HEALTH_WEBSOCKET.get(id);

  // Forward the request to the Durable Object
  return obj.fetch(c.req.raw);
});
// Non-production self-test for crypto/auth
app.get('/api/_selftest', async (c) => {
  if (c.env.ENVIRONMENT === 'production')
    return c.json({ error: 'not_available' }, 404);
  const results: Record<string, unknown> = {};
  try {
    const encKeyB64 = c.env.ENC_KEY;
    if (encKeyB64) {
      const key = await getAesKey(encKeyB64);
      const sample = { hello: 'world', at: Date.now() };
      const ct = await encryptJSON(key, sample);
      results.aes_gcm = { ok: true, ciphertextLength: ct.length };
    } else {
      results.aes_gcm = { ok: false, reason: 'no_key' };
    }
  } catch (e) {
    results.aes_gcm = { ok: false, error: (e as Error).message };
  }
  // JWT negative check
  try {
    const bogus =
      'eyJhbGciOiJSUzI1NiJ9.eyJpc3MiOiJiYSIsImF1ZCI6ImF1ZCIsImV4cCI6MX0.signature';
    const jwks = c.env.API_JWKS_URL;
    if (jwks) {
      const res = await verifyJwtWithJwks(bogus, {
        iss: 'ba',
        aud: 'aud',
        jwksUrl: jwks,
      });
      results.jwt_jwks_negative = { ok: !res.ok };
    } else {
      results.jwt_claims_negative = {
        ok: !(await validateBearerJWT(bogus)).ok,
      };
    }
  } catch (e) {
    results.jwt_error = { ok: false, error: (e as Error).message };
  }
  return c.json({ ok: true, results });
});

// Dev-only: rate limit remaining probe (does not consume)
app.get('/api/_ratelimit', async (c) => {
  if (c.env.ENVIRONMENT === 'production')
    return c.json({ error: 'not_available' }, 404);
  const key =
    new URL(c.req.url).searchParams.get('key') || deriveRateLimitKey(c);
  try {
    if (!c.env.RATE_LIMITER) return c.json({ error: 'no_rate_limiter' }, 500);
    const id = c.env.RATE_LIMITER.idFromName(key);
    const stub = c.env.RATE_LIMITER.get(id);
    const u = new URL('https://do.local/consume');
    u.searchParams.set('key', key);
    u.searchParams.set('probe', '1');
    const resp = await stub.fetch(new Request(u.toString()));
    const body = (await resp.json().catch(() => ({ ok: false }))) as {
      remaining?: number;
    };
    return c.json({ ok: true, key, remaining: body.remaining ?? null });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500);
  }
});

// Dev-only: simple audit viewer (lists recent events from R2)
app.get('/api/_audit', async (c) => {
  if (c.env.ENVIRONMENT === 'production')
    return c.json({ error: 'not_available' }, 404);
  if (!c.env.HEALTH_STORAGE) return c.json({ error: 'no_storage' }, 500);
  const url = new URL(c.req.url);
  const limit = Math.max(
    1,
    Math.min(100, Number(url.searchParams.get('limit') || 20))
  );
  const withBodies = url.searchParams.get('withBodies') === '1';
  try {
    const listing = await c.env.HEALTH_STORAGE.list({
      prefix: 'audit/events/',
      limit: 1000,
    });
    const objects = (listing.objects || [])
      .sort((a, b) => (a.key < b.key ? 1 : -1))
      .slice(0, limit);

    if (!withBodies) {
      return c.json({
        ok: true,
        count: objects.length,
        keys: objects.map((o) => o.key),
      });
    }

    const events: Array<{ key: string; line?: string }> = [];
    for (const obj of objects) {
      const got = await c.env.HEALTH_STORAGE.get(obj.key);
      if (got?.body) {
        const text = await new Response(got.body).text();
        // Only include a single line (as written by writeAudit)
        const line = text.split('\n')[0];
        events.push({ key: obj.key, line });
      } else {
        events.push({ key: obj.key });
      }
    }
    return c.json({ ok: true, count: events.length, events });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500);
  }
});

// Issue short-lived JWTs for device/WebSocket auth
app.post('/api/device/auth', async (c) => {
  // Authentication is already handled by middleware
  const secret = c.env.DEVICE_JWT_SECRET;
  if (!secret) return c.json({ error: 'not_configured' }, 500);

  const bodySchema = z.object({
    userId: z.string().min(1),
    clientType: z.enum(['ios_app', 'web_dashboard']).default('ios_app'),
    ttlSec: z.coerce
      .number()
      .min(60)
      .max(60 * 60)
      .optional(),
  });
  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await c.req.json();
    const res = bodySchema.safeParse(json);
    if (!res.success) {
      return c.json(
        { error: 'validation_error', details: res.error.flatten() },
        400
      );
    }
    parsed = res.data;
  } catch (error) {
    log.error('device_token_parse_failed', { error: (error as Error).message });
    return c.json({ error: 'invalid_json' }, 400);
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = parsed.ttlSec ?? 10 * 60; // 10 minutes by default
  const claims = {
    iss: c.env.API_ISS || 'health-app',
    aud: c.env.API_AUD || 'ws-device',
    sub: parsed.userId,
    iat: now,
    nbf: now,
    exp: now + ttl,
    scope: `device:${parsed.clientType}`,
  } as const;

  try {
    const token = await signJwtHS256(
      claims as unknown as Record<string, unknown>,
      secret
    );
    return c.json({ ok: true, token, expiresIn: ttl });
  } catch (e) {
    log.error('device_token_sign_failed', { error: (e as Error).message });
    return c.json({ error: 'server_error' }, 500);
  }
});

// Dev-only purge trigger
app.post('/api/_purge', async (c) => {
  if (c.env.ENVIRONMENT === 'production')
    return c.json({ error: 'not_available' }, 404);
  const url = new URL(c.req.url);
  const limit = Math.max(
    1,
    Math.min(2000, Number(url.searchParams.get('limit') || 1000))
  );
  const prefix = url.searchParams.get('prefix') || 'health:';
  const kv = c.env.HEALTH_KV as unknown as KVNamespaceLite | undefined;
  if (!kv || typeof kv.list !== 'function' || typeof kv.delete !== 'function')
    return c.json({ ok: true, scanned: 0, deleted: 0 });
  const res = await purgeOldHealthData(c.env, kv, { limit, prefix });
  return c.json({ ok: true, ...res });
});

// Enhanced health data processing endpoints

// Process raw health metrics with analytics
app.post('/api/health-data/process', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const parsed = healthMetricSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  }

  try {
    // Get historical data for context
    const historicalData = await getHistoricalData(
      c,
      parsed.data.type,
      parsed.data.userId
    );

    // Process the metric with enhanced analytics
    const processedData = await HealthDataProcessor.processHealthMetric(
      parsed.data,
      historicalData
    );

    // Store the processed data
    const kv = c.env.HEALTH_KV;
    if (kv) {
      const key = `health:${processedData.type}:${processedData.processedAt}`;
      const encKey = c.env.ENC_KEY ? await getAesKey(c.env.ENC_KEY) : null;
      const payload = encKey
        ? await encryptJSON(encKey, processedData)
        : JSON.stringify(processedData);
      const ttl = getTtlSecondsForType(processedData.type, c.env.ENVIRONMENT);
      await kv.put(key, payload, { expirationTtl: ttl });
    }

    // Audit trail
    const corr = c.res.headers.get('X-Correlation-Id') || '';
    await writeAudit(c.env as unknown as Parameters<typeof writeAudit>[0], {
      type: 'health_data_processed',
      actor: 'enhanced_processor',
      resource: 'kv:health',
      meta: {
        type: processedData.type,
        correlationId: corr,
        healthScore: processedData.healthScore,
        fallRisk: processedData.fallRisk,
        hasAlert: !!processedData.alert,
      },
    });

    return c.json(
      {
        ok: true,
        data: processedData,
        analytics: {
          healthScore: processedData.healthScore,
          fallRisk: processedData.fallRisk,
          anomalyScore: processedData.anomalyScore,
          dataQuality: processedData.dataQuality,
          alert: processedData.alert,
        },
      },
      201
    );
  } catch (error) {
    log.error('Health data processing failed', {
      error: (error as Error).message,
      metric: parsed.data.type,
    });
    return c.json({ error: 'processing_failed' }, 500);
  }
});

// Process batch of health metrics
app.post('/api/health-data/batch', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const parsed = healthMetricBatchSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  }

  try {
    const batchResults: ProcessedHealthData[] = [];
    const errors: string[] = [];

    for (const metric of parsed.data.metrics) {
      try {
        // Get historical data for each metric type
        const historicalData = await getHistoricalData(
          c,
          metric.type,
          metric.userId
        );

        // Process the metric
        const processedData = await HealthDataProcessor.processHealthMetric(
          metric,
          historicalData
        );

        // Store the processed data
        const kv = c.env.HEALTH_KV;
        if (kv) {
          const key = `health:${processedData.type}:${processedData.processedAt}`;
          const encKey = c.env.ENC_KEY ? await getAesKey(c.env.ENC_KEY) : null;
          const payload = encKey
            ? await encryptJSON(encKey, processedData)
            : JSON.stringify(processedData);
          const ttl = getTtlSecondsForType(
            processedData.type,
            c.env.ENVIRONMENT
          );
          await kv.put(key, payload, { expirationTtl: ttl });
        }

        batchResults.push(processedData);
      } catch (metricError) {
        errors.push(`${metric.type}: ${(metricError as Error).message}`);
      }
    }

    // Audit trail for batch
    const corr = c.res.headers.get('X-Correlation-Id') || '';
    await writeAudit(c.env as unknown as Parameters<typeof writeAudit>[0], {
      type: 'health_data_batch_processed',
      actor: 'enhanced_processor',
      resource: 'kv:health',
      meta: {
        correlationId: corr,
        totalMetrics: parsed.data.metrics.length,
        successCount: batchResults.length,
        errorCount: errors.length,
      },
    });

    return c.json(
      {
        ok: true,
        processed: batchResults.length,
        total: parsed.data.metrics.length,
        data: batchResults,
        errors: errors.length > 0 ? errors : undefined,
      },
      201
    );
  } catch (error) {
    log.error('Batch processing failed', {
      error: (error as Error).message,
      batchSize: parsed.data.metrics.length,
    });
    return c.json({ error: 'batch_processing_failed' }, 500);
  }
});

// Get health analytics summary
// Helper function to parse KV data with encryption support
async function parseKVData(
  raw: string,
  keyObj: CryptoKey | null
): Promise<unknown> {
  if (keyObj) {
    try {
      return await decryptJSON<unknown>(keyObj, raw);
    } catch {
      return null;
    }
  } else {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return null;
    }
  }
}

// Helper function to fetch user health data from KV
async function fetchUserHealthData(
  kv: Env['HEALTH_KV'],
  userId: string,
  keyObj: CryptoKey | null
): Promise<ProcessedHealthData[]> {
  if (!kv || typeof kv.list !== 'function' || typeof kv.get !== 'function') {
    return [];
  }

  const prefix = 'health:';
  const listing = await kv.list({ prefix, limit: 100 });
  const recentData: ProcessedHealthData[] = [];

  for (const k of listing.keys) {
    const raw = await kv.get(k.name);
    if (!raw) continue;

    const objUnknown = await parseKVData(raw, keyObj);
    if (!objUnknown) continue;

    const parsedRow = processedHealthDataSchema.safeParse(objUnknown);
    if (!parsedRow.success) continue;

    const obj = parsedRow.data;
    if (obj.source.userId === userId) {
      recentData.push(obj);
    }
  }

  return recentData;
}

app.get('/api/health-data/analytics/:userId', async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'user_id_required' }, 400);
  }

  // Check if this is a demo mode request
  const referer = c.req.header('Referer') || '';
  const isDemoRequest =
    referer.includes('/demo') || c.req.header('X-Demo-Mode') === 'true';

  if (isDemoRequest && userId === 'demo-user-vitalsense') {
    // Return demo analytics data
    const demoAnalytics = {
      totalDataPoints: 42,
      last24Hours: 8,
      last7Days: 42,
      averageHealthScore: 87.5,
      alerts: {
        critical: 0,
        warning: 1,
        total: 1,
      },
      fallRiskDistribution: {
        low: 40,
        moderate: 2,
        high: 0,
        critical: 0,
      },
      metricTypes: ['heart_rate', 'steps', 'sleep', 'blood_pressure'],
      dataQualityScore: 94.2,
      lastUpdated: new Date().toISOString(),
    };

    return c.json({ ok: true, analytics: demoAnalytics });
  }

  try {
    const kv = c.env.HEALTH_KV;
    if (!kv || typeof kv.list !== 'function' || typeof kv.get !== 'function') {
      return c.json({ ok: true, analytics: null });
    }

    const encKeyB64 = c.env.ENC_KEY;
    const keyObj = encKeyB64 ? await getAesKey(encKeyB64) : null;

    // Get recent health data for analytics
    const recentData = await fetchUserHealthData(kv, userId, keyObj);

    // Calculate analytics summary
    const analytics = calculateHealthAnalytics(recentData);

    return c.json({ ok: true, analytics });
  } catch (error) {
    log.error('Analytics calculation failed', {
      error: (error as Error).message,
      userId,
    });
    return c.json({ error: 'analytics_failed' }, 500);
  }
});

// Helper function to get historical data
async function getHistoricalData(
  c: Context<{ Bindings: Env }>,
  metricType: string,
  userId?: string
): Promise<ProcessedHealthData[]> {
  const kv = c.env.HEALTH_KV;
  if (
    !kv ||
    !userId ||
    typeof kv.list !== 'function' ||
    typeof kv.get !== 'function'
  )
    return [];

  try {
    const prefix = `health:${metricType}:`;
    const listing = await kv.list({ prefix, limit: 30 }); // Last 30 readings
    const encKeyB64 = c.env.ENC_KEY;
    const keyObj = encKeyB64 ? await getAesKey(encKeyB64) : null;

    const historicalData: ProcessedHealthData[] = [];
    for (const k of listing.keys) {
      const raw = await kv.get(k.name);
      if (!raw) continue;

      const objUnknown = keyObj
        ? await (async () => {
            try {
              return await decryptJSON<unknown>(keyObj, raw);
            } catch {
              return null;
            }
          })()
        : (() => {
            try {
              return JSON.parse(raw) as unknown;
            } catch {
              return null;
            }
          })();

      if (!objUnknown) continue;

      const parsedRow = processedHealthDataSchema.safeParse(objUnknown);
      if (!parsedRow.success) continue;

      const obj = parsedRow.data;
      if (obj.source.userId === userId) {
        historicalData.push(obj);
      }
    }

    return historicalData.sort(
      (a, b) =>
        new Date(b.processedAt).getTime() - new Date(a.processedAt).getTime()
    );
  } catch {
    return [];
  }
}

// Helper function to calculate health analytics summary
function calculateHealthAnalytics(data: ProcessedHealthData[]) {
  const now = Date.now();
  const last24h = data.filter(
    (d) => now - new Date(d.processedAt).getTime() < 24 * 60 * 60 * 1000
  );
  const last7d = data.filter(
    (d) => now - new Date(d.processedAt).getTime() < 7 * 24 * 60 * 60 * 1000
  );

  const averageHealthScore =
    data.length > 0
      ? data
          .filter((d) => d.healthScore !== undefined)
          .reduce((sum, d) => sum + (d.healthScore || 0), 0) /
        data.filter((d) => d.healthScore !== undefined).length
      : 0;

  const criticalAlerts = data.filter(
    (d) => d.alert?.level === 'critical'
  ).length;
  const warningAlerts = data.filter((d) => d.alert?.level === 'warning').length;

  const fallRiskDistribution = {
    low: data.filter((d) => d.fallRisk === 'low').length,
    moderate: data.filter((d) => d.fallRisk === 'moderate').length,
    high: data.filter((d) => d.fallRisk === 'high').length,
    critical: data.filter((d) => d.fallRisk === 'critical').length,
  };

  const metricTypes = [...new Set(data.map((d) => d.type))];
  const dataQualityAverage =
    data.length > 0 && data.some((d) => d.dataQuality)
      ? data
          .filter((d) => d.dataQuality)
          .reduce(
            (sum, d) =>
              sum +
              (d.dataQuality!.completeness +
                d.dataQuality!.accuracy +
                d.dataQuality!.timeliness +
                d.dataQuality!.consistency) /
                4,
            0
          ) / data.filter((d) => d.dataQuality).length
      : 0;

  return {
    totalDataPoints: data.length,
    last24Hours: last24h.length,
    last7Days: last7d.length,
    averageHealthScore: Math.round(averageHealthScore * 10) / 10,
    alerts: {
      critical: criticalAlerts,
      warning: warningAlerts,
      total: criticalAlerts + warningAlerts,
    },
    fallRiskDistribution,
    metricTypes,
    dataQualityScore: Math.round(dataQualityAverage * 10) / 10,
    lastUpdated:
      data.length > 0
        ? [...data].sort(
            (a, b) =>
              new Date(b.processedAt).getTime() -
              new Date(a.processedAt).getTime()
          )[0].processedAt
        : null,
  };
}

// API routes for KV storage
app.get('/api/kv/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const kv = c.env.HEALTH_KV;

    if (!kv?.get) {
      return c.json({ error: 'KV storage not available' }, 503);
    }

    const value = await kv.get(key);
    return c.json({ key, value });
  } catch (error) {
    console.error('KV get error:', error);
    return c.json({ error: 'Failed to get value' }, 500);
  }
});

app.put('/api/kv/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const body = await c.req.json();
    const kv = c.env.HEALTH_KV;

    if (!kv) {
      return c.json({ error: 'KV storage not available' }, 503);
    }

    await kv.put(key, JSON.stringify(body.value));
    return c.json({ success: true, key });
  } catch (error) {
    console.error('KV put error:', error);
    return c.json({ error: 'Failed to save value' }, 500);
  }
});

app.delete('/api/kv/:key', async (c) => {
  try {
    const key = c.req.param('key');
    const kv = c.env.HEALTH_KV;

    if (!kv?.delete) {
      return c.json({ error: 'KV storage not available' }, 503);
    }

    await kv.delete(key);
    return c.json({ success: true, key });
  } catch (error) {
    console.error('KV delete error:', error);
    return c.json({ error: 'Failed to delete value' }, 500);
  }
});

// Helper function to generate demo health data
function generateDemoHealthData() {
  const now = new Date();
  const demoData = [];

  // Generate last 7 days of demo data
  for (let i = 0; i < 7; i++) {
    const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

    demoData.push({
      id: `demo-heart-rate-${i}`,
      type: 'heart_rate',
      value: 70 + Math.floor(Math.random() * 10),
      unit: 'bpm',
      timestamp: date.toISOString(),
      processedAt: date.toISOString(),
      source: {
        userId: 'demo-user-vitalsense',
        deviceId: 'demo-device',
        appVersion: '1.0.0-demo',
      },
      healthScore: 85 + Math.floor(Math.random() * 10),
      fallRisk: 'low',
      anomalyScore: 0.1 + Math.random() * 0.2,
      dataQuality: {
        completeness: 0.95,
        accuracy: 0.98,
        timeliness: 0.92,
        consistency: 0.96,
      },
    });

    demoData.push({
      id: `demo-steps-${i}`,
      type: 'steps',
      value: 8000 + Math.floor(Math.random() * 3000),
      unit: 'count',
      timestamp: date.toISOString(),
      processedAt: date.toISOString(),
      source: {
        userId: 'demo-user-vitalsense',
        deviceId: 'demo-device',
        appVersion: '1.0.0-demo',
      },
      healthScore: 88 + Math.floor(Math.random() * 8),
      fallRisk: 'low',
      anomalyScore: 0.05 + Math.random() * 0.15,
      dataQuality: {
        completeness: 0.98,
        accuracy: 0.95,
        timeliness: 0.9,
        consistency: 0.94,
      },
    });
  }

  // Sort data by timestamp (newest first) - create a copy to avoid mutation
  const sortedData = [...demoData].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return sortedData;
}

// API routes for health data
app.get('/api/health-data', async (c) => {
  // Check if this is a demo mode request
  const referer = c.req.header('Referer') || '';
  const isDemoRequest =
    referer.includes('/demo') || c.req.header('X-Demo-Mode') === 'true';

  if (isDemoRequest) {
    // Return demo health data
    const demoData = generateDemoHealthData();
    return c.json({
      ok: true,
      data: demoData,
      hasMore: false,
    });
  }

  // Validate query params
  const querySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    metric: healthMetricSchema.shape.type.optional(),
    limit: z.coerce.number().min(1).max(500).optional(),
    cursor: z.string().optional(),
  });

  const url = new URL(c.req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parsed = querySchema.safeParse(params);
  if (!parsed.success) {
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  }

  const { from, to, metric, cursor } = parsed.data;
  const limit = parsed.data.limit ?? 100;
  const kv = c.env.HEALTH_KV;
  if (!kv || typeof kv.list !== 'function' || typeof kv.get !== 'function') {
    return c.json({ ok: true, data: [] });
  }
  const prefix = metric ? `health:${metric}:` : 'health:';

  try {
    const listing = await kv.list({ prefix, limit, cursor });
    const encKeyB64 = c.env.ENC_KEY;
    const keyObj = encKeyB64 ? await getAesKey(encKeyB64) : null;

    const filterByDate = (obj: ProcessedHealthData) => {
      const processedAt = new Date(obj.processedAt).getTime();
      if (from && processedAt < new Date(from).getTime()) return false;
      if (to && processedAt > new Date(to).getTime()) return false;
      return true;
    };

    async function parseKVItem(
      k: { name: string },
      keyObj: CryptoKey | null,
      kvStore: typeof kv
    ): Promise<ProcessedHealthData | null> {
      if (!kvStore || typeof kvStore.get !== 'function') return null;
      const raw = await kvStore.get(k.name);
      if (!raw) return null;
      let objUnknown: unknown;
      if (keyObj) {
        try {
          objUnknown = await decryptJSON<unknown>(keyObj, raw);
        } catch {
          return null;
        }
      } else {
        try {
          objUnknown = JSON.parse(raw) as unknown;
        } catch {
          return null;
        }
      }
      const parsedRow = processedHealthDataSchema.safeParse(objUnknown);
      if (!parsedRow.success) return null;
      return parsedRow.data;
    }

    const rows: Array<ProcessedHealthData> = [];
    for (const k of listing.keys) {
      const obj = await parseKVItem(k, keyObj, kv);
      if (!obj) continue;
      if (!filterByDate(obj)) continue;
      rows.push(obj);
      if (rows.length >= limit) break;
    }

    rows.sort((a, b) => (a.processedAt < b.processedAt ? 1 : -1));
    return c.json({
      ok: true,
      data: rows,
      nextCursor: listing.list_complete ? undefined : listing.cursor,
      hasMore: listing.list_complete === false,
    });
  } catch (e) {
    log.error('KV read failed', { error: (e as Error).message });
    return c.json({ error: 'server_error' }, 500);
  }
});

app.post('/api/health-data', async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }

  const parsed = processedHealthDataSchema.safeParse(body);
  if (!parsed.success) {
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  }

  // Optionally persist if KV is bound (application-encrypted when ENC_KEY is set)
  try {
    const kv = c.env.HEALTH_KV;
    if (kv) {
      const key = `health:${parsed.data.type}:${parsed.data.processedAt}`;
      const encKey = c.env.ENC_KEY ? await getAesKey(c.env.ENC_KEY) : null;
      const payload = encKey
        ? await encryptJSON(encKey, parsed.data)
        : JSON.stringify(parsed.data);
      const ttl = getTtlSecondsForType(parsed.data.type, c.env.ENVIRONMENT);
      await kv.put(key, payload, { expirationTtl: ttl });
    }
    const corr = c.res.headers.get('X-Correlation-Id') || '';
    await writeAudit(c.env as unknown as Parameters<typeof writeAudit>[0], {
      type: 'health_data_created',
      actor: 'api',
      resource: 'kv:health',
      meta: { type: parsed.data.type, correlationId: corr },
    });
  } catch (e) {
    log.error('KV write failed', { error: (e as Error).message });
    // Fail closed without leaking sensitive data
    return c.json({ error: 'server_error' }, 500);
  }

  return c.json({ ok: true, data: parsed.data }, 201);
});

// GitHub Spark compatibility endpoint
app.post('/_spark/loaded', async (c) => {
  return c.json({ ok: true, status: 'loaded' });
});

// Demo mode route - bypasses auth and serves the app with demo user
app.get('/demo', async (c) => {
  // Get the main index.html using a simple request
  if (!c.env.ASSETS) {
    return c.text('Assets not available', 500);
  }

  const assetResp = await c.env.ASSETS.fetch(
    new Request(`${new URL(c.req.url).origin}/index.html`)
  );
  if (!assetResp.ok) {
    return c.text(
      `App not available: ${assetResp.status} ${assetResp.statusText}`,
      500
    );
  }

  let html = await assetResp.text();

  // Inject demo user data into the HTML
  const demoUser = {
    id: 'demo-user-vitalsense',
    name: 'Demo User',
    email: 'demo@vitalsense.health',
    picture: 'https://via.placeholder.com/64x64/2563eb/ffffff?text=VT',
    authenticated: true,
    mode: 'demo',
  };

  // Inject demo mode in the head section before any scripts load
  const demoHeadScript = `
    <meta name="vitalsense-demo-mode" content="true">
    <meta name="vitalsense-demo-user" content='${JSON.stringify(demoUser)}'>
    <script>
      // CRITICAL: Patch Array.prototype.slice IMMEDIATELY before anything else loads
      (function() {
        const originalSlice = Array.prototype.slice;
        Array.prototype.slice = function(...args) {
          // If 'this' is null, undefined, or not array-like, return empty array
          if (this == null || typeof this !== 'object') {
            console.warn('slice() called on non-array:', this);
            return [];
          }
          // If 'this' doesn't have a length property, return empty array
          if (typeof this.length !== 'number') {
            console.warn('slice() called on object without length:', this);
            return [];
          }
          try {
            return originalSlice.apply(this, args);
          } catch (e) {
            console.warn('slice() failed, returning empty array:', e);
            return [];
          }
        };
      })();

      // VitalSense Demo Mode - Set immediately before any other scripts
      window.VITALSENSE_DEMO_MODE = true;
      window.VITALSENSE_DEMO_USER = ${JSON.stringify(demoUser)};
      window.vitalsense_demo_mode = true;
      window.vitalsense_demo_user = ${JSON.stringify(demoUser)};
      window.vitalsense_bypass_auth = true;

      // Global error handlers that run before React loads
      window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('slice is not a function')) {
          console.error('CRITICAL: slice error caught before React:', e);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        if (e.message && e.message.includes('is not a function')) {
          console.error('CRITICAL: function error caught:', e);
          // Don't prevent - let React error boundary handle it
        }
      });

      window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.message && e.reason.message.includes('slice is not a function')) {
          console.error('CRITICAL: slice promise rejection caught:', e);
          e.preventDefault();
        }
      });

      // Override fetch to add demo mode header for API requests
      const originalFetch = window.fetch;
      window.fetch = function(input, init = {}) {
        if (typeof input === 'string' && input.includes('/api/')) {
          init.headers = {
            ...init.headers,
            'X-Demo-Mode': 'true',
            'X-Demo-User': 'demo-user-vitalsense'
          };
        }
        return originalFetch(input, init);
      };

  // Define missing environment variables for demo mode
  // Provide as both global var and window property for broad compatibility
  var BASE_KV_SERVICE_URL = '/api';
  window.BASE_KV_SERVICE_URL = BASE_KV_SERVICE_URL;
      window.GITHUB_RUNTIME_PERMANENT_NAME = 'vitalsense-demo';

  // Disable WebSocket connections in demo mode (read by client hook)
  window.VITALSENSE_DISABLE_WEBSOCKET = true;

      // Defensive array helper for .slice() errors
      window.safeSlice = function(arr, ...args) {
        if (!Array.isArray(arr)) return [];
        return arr.slice(...args);
      };

      // Global error handler for unhandled array issues
      window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('slice is not a function')) {
          console.warn('Array slice error caught and handled:', e);
          e.preventDefault();
          return false;
        }
      });

      // Patch Array prototype temporarily for safety
      const originalArraySlice = Array.prototype.slice;
      Array.prototype.slice = function(...args) {
        if (this == null) {
          console.warn('slice called on null/undefined, returning empty array');
          return [];
        }
        return originalArraySlice.apply(this, args);
      };

      // Override WebSocket constructor to prevent connections to localhost
      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = function(url, protocols) {
        console.log('🛡️ Demo mode: WebSocket connection blocked to', url);
        // Return a mock WebSocket that doesn't actually connect
        const mockWS = new EventTarget();
        mockWS.url = url;
        mockWS.readyState = 0; // CONNECTING
        mockWS.send = function() { console.log('🛡️ Demo mode: WebSocket.send() blocked'); };
        mockWS.close = function() { console.log('🛡️ Demo mode: WebSocket.close() called'); };

        // Simulate connection failure after a short delay
        setTimeout(() => {
          const errorEvent = new Event('error');
          mockWS.dispatchEvent(errorEvent);
          mockWS.readyState = 3; // CLOSED
        }, 100);

        return mockWS;
      };

      // Store in localStorage for persistence
      try {
        localStorage.setItem('vitalsense_demo_mode', 'true');
        localStorage.setItem('vitalsense_demo_user', JSON.stringify(${JSON.stringify(demoUser)}));
        localStorage.setItem('VITALSENSE_DEMO_MODE', 'true');
        localStorage.setItem('auth_bypass', 'demo');
      } catch(e) { console.warn('localStorage not available:', e); }

      console.log('🚀 VitalSense Demo Mode Activated!', window.vitalsense_demo_user);

      // Override any auth redirects globally
      const originalAssign = Location.prototype.assign;
      const originalReplace = Location.prototype.replace;

      Location.prototype.assign = function(url) {
        if (url.includes('/login') || url.includes('/auth')) {
          console.log('🛡️ Demo mode: blocking auth redirect to', url);
          return;
        }
        return originalAssign.call(this, url);
      };

      Location.prototype.replace = function(url) {
        if (url.includes('/login') || url.includes('/auth')) {
          console.log('🛡️ Demo mode: blocking auth redirect to', url);
          return;
        }
        return originalReplace.call(this, url);
      };
    </script>
  `;

  // Inject in head section
  html = html.replace('</head>', demoHeadScript + '</head>');

  // Also inject at the end of body as fallback
  const demoBodyScript = `
    <script>
      // Fallback demo mode injection
      if (!window.VITALSENSE_DEMO_MODE) {
        window.VITALSENSE_DEMO_MODE = true;
        window.VITALSENSE_DEMO_USER = ${JSON.stringify(demoUser)};
        window.vitalsense_demo_mode = true;
        window.vitalsense_demo_user = ${JSON.stringify(demoUser)};
        console.log('📦 Fallback: VitalSense Demo Mode Activated!');
      }
    </script>
  `;

  html = html.replace('</body>', demoBodyScript + '</body>');

  // Return response (CSP will be handled by middleware)
  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=UTF-8',
    },
  });
});

// Convenience: disable demo mode (clears flags and redirects to /)
app.get('/demo/disable', async (c) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Disable Demo</title></head><body>
  <script>
    try {
      localStorage.removeItem('vitalsense_demo_mode');
      localStorage.removeItem('vitalsense_demo_user');
      localStorage.removeItem('VITALSENSE_DEMO_MODE');
      localStorage.removeItem('auth_bypass');
      // reset any custom flags used earlier
      localStorage.removeItem('vitalsense_bypass_auth');
      sessionStorage.clear();
    } catch (e) { /* ignore */ }
    // Hard reload root without cache
    location.replace('/');
  </script>
  </body></html>`;
  return c.html(html);
});

// Convenience: enable demo mode (sets flags and redirects to /demo)
app.get('/demo/enable', async (c) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Enable Demo</title></head><body>
  <script>
    try {
      localStorage.setItem('vitalsense_demo_mode', 'true');
      localStorage.setItem('VITALSENSE_DEMO_MODE', 'true');
      localStorage.setItem('auth_bypass', 'demo');
    } catch (e) { /* ignore */ }
    location.replace('/demo');
  </script>
  </body></html>`;
  return c.html(html);
});

// Static demo page - completely bypasses React app authentication
app.get('/demo-static', async (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VitalSense Demo - Health Dashboard</title>
    <style>
        :root {
            --vs-primary: #2563eb;
            --vs-secondary: #0891b2;
            --vs-background: #ffffff;
            --vs-foreground: #0f172a;
            --vs-card: #f8fafc;
            --vs-border: #e2e8f0;
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--vs-primary) 0%, var(--vs-secondary) 100%);
            min-height: 100vh;
            color: var(--vs-foreground);
        }

        .demo-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .demo-header {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            text-align: center;
        }

        .demo-header h1 {
            color: var(--vs-primary);
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .demo-header p {
            color: #64748b;
            font-size: 1.1rem;
        }

        .demo-badge {
            background: var(--vs-secondary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 1rem;
        }

        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .demo-card {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .demo-card h3 {
            color: var(--vs-primary);
            margin-bottom: 1rem;
            font-size: 1.25rem;
        }

        .demo-metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--vs-border);
        }

        .demo-metric:last-child {
            border-bottom: none;
        }

        .demo-value {
            font-weight: 600;
            color: var(--vs-secondary);
        }

        .demo-actions {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }

        .demo-button {
            background: var(--vs-primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            margin: 0 0.5rem;
            transition: background-color 0.2s;
        }

        .demo-button:hover {
            background: #1d4ed8;
        }

        .demo-button.secondary {
            background: var(--vs-secondary);
        }

        .demo-button.secondary:hover {
            background: #0e7490;
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <div class="demo-header">
            <div class="demo-badge">🚀 DEMO MODE</div>
            <h1>VitalSense Health Dashboard</h1>
            <p>Your Personal Health Intelligence Platform</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: #64748b;">
                Welcome, <strong>Demo User</strong> (demo@vitalsense.health)
            </p>
        </div>

        <div class="demo-grid">
            <div class="demo-card">
                <h3>📊 Health Metrics</h3>
                <div class="demo-metric">
                    <span>Heart Rate</span>
                    <span class="demo-value">72 BPM</span>
                </div>
                <div class="demo-metric">
                    <span>Steps Today</span>
                    <span class="demo-value">8,247</span>
                </div>
                <div class="demo-metric">
                    <span>Sleep Score</span>
                    <span class="demo-value">85/100</span>
                </div>
                <div class="demo-metric">
                    <span>Blood Pressure</span>
                    <span class="demo-value">120/80</span>
                </div>
            </div>

            <div class="demo-card">
                <h3>🛡️ Fall Risk Analysis</h3>
                <div class="demo-metric">
                    <span>Risk Level</span>
                    <span class="demo-value" style="color: #10b981;">Low</span>
                </div>
                <div class="demo-metric">
                    <span>Balance Score</span>
                    <span class="demo-value">92/100</span>
                </div>
                <div class="demo-metric">
                    <span>Activity Level</span>
                    <span class="demo-value">Active</span>
                </div>
                <div class="demo-metric">
                    <span>Last Assessment</span>
                    <span class="demo-value">Today</span>
                </div>
            </div>

            <div class="demo-card">
                <h3>🤖 AI Insights</h3>
                <div style="padding: 1rem 0;">
                    <p style="margin-bottom: 1rem;">
                        <strong>💡 Today's Recommendation:</strong><br>
                        Your activity levels are excellent! Consider adding 10 minutes of balance exercises to further reduce fall risk.
                    </p>
                    <p style="margin-bottom: 1rem;">
                        <strong>📈 Trend Analysis:</strong><br>
                        Sleep quality has improved 15% over the past week. Great progress!
                    </p>
                    <p>
                        <strong>⚠️ Alert:</strong><br>
                        No health alerts at this time. All metrics are within normal ranges.
                    </p>
                </div>
            </div>

            <div class="demo-card">
                <h3>👥 Caregiver Dashboard</h3>
                <div class="demo-metric">
                    <span>Connected Caregivers</span>
                    <span class="demo-value">2</span>
                </div>
                <div class="demo-metric">
                    <span>Emergency Contacts</span>
                    <span class="demo-value">3</span>
                </div>
                <div class="demo-metric">
                    <span>Last Check-in</span>
                    <span class="demo-value">2 hours ago</span>
                </div>
                <div class="demo-metric">
                    <span>Sharing Status</span>
                    <span class="demo-value" style="color: #10b981;">Active</span>
                </div>
            </div>
        </div>

        <div class="demo-actions">
            <h3 style="margin-bottom: 1.5rem; color: var(--vs-primary);">Demo Actions</h3>
            <button class="demo-button" onclick="alert('📱 iOS App integration would sync your Apple Health data here!')">
                Connect iOS App
            </button>
            <button class="demo-button secondary" onclick="alert('🚨 Emergency alert system activated! Caregivers would be notified.')">
                Test Emergency Alert
            </button>
            <button class="demo-button" onclick="window.location.href='/login'">
                Exit Demo → Login
            </button>
        </div>

        <div style="text-align: center; padding: 2rem; color: white;">
            <p>🔒 This is a demo environment. No real health data is stored or processed.</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">
                VitalSense • Your Health Intelligence Platform • Demo Mode
            </p>
        </div>
    </div>

    <script>
        console.log('🚀 VitalSense Static Demo Loaded!');

        // Simulate real-time updates
        setInterval(() => {
            const heartRate = document.querySelector('.demo-metric .demo-value');
            if (heartRate && heartRate.textContent.includes('BPM')) {
                const rate = 70 + Math.floor(Math.random() * 6);
                heartRate.textContent = rate + ' BPM';
            }
        }, 5000);
    </script>
</body>
</html>`;

  return c.html(html);
});

// Auth0 custom login page - inline VitalSense branding for custom domain
app.get('/login', async (c) => {
  // Serve dynamic login page with Auth0 config injected
  const auth0Domain = c.env.AUTH0_DOMAIN || '';
  const auth0ClientId = c.env.AUTH0_CLIENT_ID || '';

  // Use the current domain for callback
  const baseUrl =
    c.env.BASE_URL ||
    new URL(c.req.url).origin ||
    'https://health.andernet.dev';
  const redirectUri = `${baseUrl}/callback`;

  // Inline VitalSense login page
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VitalSense Health - Secure Sign In</title>
    <style>
        :root {
            --vs-primary: #2563eb;
            --vs-primary-foreground: #ffffff;
            --vs-secondary: #0891b2;
            --vs-background: #ffffff;
            --vs-foreground: #0f172a;
            --vs-card: #f8fafc;
            --vs-border: #e2e8f0;
            --vs-input: #ffffff;
            --vs-ring: #2563eb;
            --vs-radius: 0.5rem;
        }

        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--vs-primary) 0%, var(--vs-secondary) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--vs-foreground);
        }

        .login-container {
            background: var(--vs-background);
            padding: 2rem;
            border-radius: var(--vs-radius);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            border: 1px solid var(--vs-border);
        }

        .logo {
            text-align: center;
            margin-bottom: 2rem;
        }

        .logo h1 {
            color: var(--vs-primary);
            font-size: 2rem;
            font-weight: 700;
            margin-bottom: 0.5rem;
        }

        .logo p {
            color: #64748b;
            font-size: 0.875rem;
        }

        .login-button {
            width: 100%;
            background: var(--vs-primary);
            color: var(--vs-primary-foreground);
            border: none;
            padding: 0.75rem 1rem;
            border-radius: calc(var(--vs-radius) - 2px);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-bottom: 1rem;
        }

        .login-button:hover {
            background: #1d4ed8;
        }

        .login-button:focus {
            outline: 2px solid var(--vs-ring);
            outline-offset: 2px;
        }

        .divider {
            text-align: center;
            margin: 1.5rem 0;
            position: relative;
            color: #64748b;
            font-size: 0.875rem;
        }

        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--vs-border);
        }

        .divider span {
            background: var(--vs-background);
            padding: 0 1rem;
        }

        .features {
            text-align: center;
            font-size: 0.875rem;
            color: #64748b;
            line-height: 1.5;
        }

        .security-note {
            margin-top: 1rem;
            padding: 0.75rem;
            background: var(--vs-card);
            border-radius: calc(var(--vs-radius) - 2px);
            font-size: 0.75rem;
            color: #64748b;
            border: 1px solid var(--vs-border);
        }

        @media (max-width: 480px) {
            .login-container {
                margin: 1rem;
                padding: 1.5rem;
            }
        }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>VitalSense</h1>
            <p>Your Health Intelligence Platform</p>
        </div>

        <button class="login-button" onclick="loginWithAuth0()">
            Sign In with VitalSense
        </button>

        <div class="divider">
            <span>or</span>
        </div>

        <button class="login-button" onclick="loginDemo()" style="background: var(--vs-secondary);">
            Try Demo Mode
        </button>

        <button class="login-button" onclick="window.open('/demo-static', '_blank')" style="background: #059669; margin-top: 0.5rem;">
            Quick Demo Access (New Tab)
        </button>

        <button class="login-button" onclick="alert('Redirecting to static demo...'); setTimeout(() => window.location.href='/demo-static', 1000);" style="background: #dc2626; margin-top: 0.5rem;">
            Debug Demo Redirect
        </button>

        <div class="divider">
            <span>Secure Authentication</span>
        </div>

        <div class="features">
            <p>• Privacy-first health monitoring</p>
            <p>• AI-powered insights</p>
            <p>• Emergency fall detection</p>
        </div>

        <div class="security-note">
            🔒 Your health data is encrypted and secure. We use industry-standard authentication.
        </div>
    </div>

    <script src="https://cdn.auth0.com/js/auth0/9.23.2/auth0.min.js"></script>
    <script>
        // Wait for Auth0 to load before initializing
        function initializeAuth0() {
            if (typeof auth0 === 'undefined') {
                console.log('⏳ Waiting for Auth0 to load...');
                setTimeout(initializeAuth0, 100);
                return;
            }

            console.log('🔐 Initializing Auth0 WebAuth...');

            window.vitalsenseAuth = new auth0.WebAuth({
                domain: '${auth0Domain}',
                clientID: '${auth0ClientId}',
                redirectUri: '${redirectUri}',
                responseType: 'code',
                scope: 'openid profile email'
            });

            console.log('✅ Auth0 WebAuth initialized successfully');
        }

        // Start initialization
        initializeAuth0();

    function loginWithAuth0() {
      console.log('🔐 Auth0 login button clicked');
      const domain = '${auth0Domain}';
      const clientId = '${auth0ClientId}';
      if (!domain || !clientId) {
        console.log('⚠️ Missing Auth0 config, using demo mode...');
        loginDemo();
        return;
      }
      if (!window.vitalsenseAuth) {
        console.log('⚠️ Auth0 not initialized yet, trying demo mode...');
        loginDemo();
        return;
      }
      fetch('https://' + domain + '/.well-known/openid-configuration')
        .then(response => {
          if (response.ok) {
            console.log('✅ Auth0 configuration valid, starting authorization...');
            window.vitalsenseAuth.authorize();
          } else {
            console.log('⚠️ Auth0 configuration invalid (' + response.status + '), using demo mode...');
            loginDemo();
          }
        })
        .catch(error => {
          console.log('❌ Auth0 not accessible, using demo mode...', error);
          loginDemo();
        });
    }

        function loginDemo() {
            console.log('Demo login clicked!');

            // Simple redirect to static demo route
            const button = event.target;
            button.textContent = 'Launching Demo...';
            button.disabled = true;

            setTimeout(() => {
                console.log('Redirecting to static demo...');
                window.location.href = '/demo-static';
            }, 500);
        }

        // Auto-redirect if already logged in (after Auth0 is initialized)
        function checkExistingAuth() {
            if (window.vitalsenseAuth) {
                window.vitalsenseAuth.parseHash((err, authResult) => {
                    if (authResult && authResult.accessToken) {
                        console.log('✅ User already authenticated, redirecting...');
                        window.location.href = '/';
                    }
                });
            }
        }

        // Check for existing auth after a short delay to ensure Auth0 is loaded
        setTimeout(checkExistingAuth, 1000);
    </script>
    <!-- VS-CUSTOM-LOGIN:1 -->
    <div style="text-align:center;margin-top:1rem;color:#94a3b8;font-size:10px;">Custom Login Page</div>
</body>
</html>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      pragma: 'no-cache',
      'x-robots-tag': 'noindex',
      'x-page-id': 'vs-custom-login',
    },
  });
});

// (Removed duplicate callback redirect handler; SPA-serving callback defined earlier)

// Diagnostics: Verify Auth0/OpenID configuration for the configured domain
app.get('/api/auth0/health', async (c) => {
  const domain = c.env.AUTH0_DOMAIN || '';
  const clientId = c.env.AUTH0_CLIENT_ID || '';
  const issuerUrl = domain ? `https://${domain}/` : null;
  const openIdCfgUrl = domain
    ? `https://${domain}/.well-known/openid-configuration`
    : null;
  const out: Record<string, unknown> = {
    ok: false,
    domain,
    clientIdSet: Boolean(clientId),
    issuer: null as string | null,
    jwks_uri: null as string | null,
    authorization_endpoint: null as string | null,
    error: null as string | null,
  };
  try {
    if (!openIdCfgUrl) throw new Error('AUTH0_DOMAIN not set');
    const res = await fetch(openIdCfgUrl);
    if (!res.ok) throw new Error(`openid-configuration ${res.status}`);
    const cfg = (await res.json()) as Record<string, unknown>;
    out.ok = true;
    out.issuer = (cfg.issuer as string) || issuerUrl;
    out.jwks_uri = cfg.jwks_uri as string;
    out.authorization_endpoint = cfg.authorization_endpoint as string;
    return c.json(out, 200);
  } catch (e) {
    out.ok = false;
    out.error = (e as Error).message;
    return c.json(out, 200);
  }
});

// Public diagnostics (non-API path) to validate Auth0 config without API auth
app.get('/auth0/health', async (c) => {
  const domain = c.env.AUTH0_DOMAIN || '';
  const clientId = c.env.AUTH0_CLIENT_ID || '';
  const issuerUrl = domain ? `https://${domain}/` : null;
  const openIdCfgUrl = domain
    ? `https://${domain}/.well-known/openid-configuration`
    : null;
  const out: Record<string, unknown> = {
    ok: false,
    domain,
    clientIdSet: Boolean(clientId),
    issuer: null as string | null,
    jwks_uri: null as string | null,
    authorization_endpoint: null as string | null,
    error: null as string | null,
  };
  try {
    if (!openIdCfgUrl) throw new Error('AUTH0_DOMAIN not set');
    const res = await fetch(openIdCfgUrl);
    if (!res.ok) throw new Error(`openid-configuration ${res.status}`);
    const cfg = (await res.json()) as Record<string, unknown>;
    out.ok = true;
    out.issuer = (cfg.issuer as string) || issuerUrl;
    out.jwks_uri = cfg.jwks_uri as string;
    out.authorization_endpoint = cfg.authorization_endpoint as string;
    return c.json(out, 200);
  } catch (e) {
    out.ok = false;
    out.error = (e as Error).message;
    return c.json(out, 200);
  }
});

// Support alternative auth path for backward compatibility
app.get('/auth/login', async (c) => {
  return c.redirect('/login', 302);
});

// Explicit force-login path to avoid any front-end routing interference
app.get('/_force-login', async (c) => {
  const ts = Date.now();
  return c.redirect(`/login?ts=${ts}`, 302);
});

// SPA fallback to index.html using ASSETS binding
app.get('*', async (c) => {
  const reqUrl = new URL(c.req.url);
  const path = reqUrl.pathname;
  // Normalize Auth0 redirects: if code/state are present on a non-callback path, redirect to /callback
  try {
    const hasCode = reqUrl.searchParams.has('code');
    const hasState = reqUrl.searchParams.has('state');
    if ((hasCode || hasState) && path !== '/callback') {
      return c.redirect(`/callback${reqUrl.search}`, 302);
    }
  } catch {
    // no-op
  }
  if (!c.env.ASSETS) return c.text('Not Found', 404);
  // Do not serve SPA index for custom server routes handled by Hono
  if (
    path === '/login' ||
    path.startsWith('/login/') ||
    path === '/callback' ||
    path === '/demo' ||
    path.startsWith('/demo/') ||
    path === '/auth0/health' ||
    path === '/api/auth0/health'
  ) {
    return c.text('Not Found', 404);
  }
  const indexUrl = new URL('/index.html', c.req.url);
  return c.env.ASSETS.fetch(new Request(indexUrl.toString(), c.req.raw));
});

export default app;

// Scheduled purge entry (Cloudflare Cron Triggers)
export async function scheduled(
  _controller: { cron: string; scheduledTime: number },
  env: Env,
  ctx: { waitUntil: (p: Promise<unknown>) => void }
) {
  const kv = env.HEALTH_KV as unknown as KVNamespaceLite | undefined;
  if (!kv) return;
  ctx.waitUntil(purgeOldHealthData(env, kv));
}

// Durable Object: RateLimiter (exported for Wrangler binding)
type DOStorage = {
  get: (key: string) => Promise<unknown>;
  put: (key: string, value: unknown) => Promise<void>;
};
type DurableObjectState = { storage: DOStorage };
export class RateLimiter {
  private readonly storage: DOStorage;
  constructor(state: DurableObjectState) {
    this.storage = state.storage;
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key') || 'anon';
    const limit = Number(url.searchParams.get('limit') || 60);
    const interval = Number(url.searchParams.get('intervalMs') || 60_000);
    const probe = url.searchParams.get('probe') === '1';

    const now = Date.now();
    const saved = (await this.storage.get(key)) as
      | { tokens: number; last: number }
      | undefined;
    const record: { tokens: number; last: number } =
      saved &&
      typeof saved.tokens === 'number' &&
      typeof saved.last === 'number'
        ? { tokens: saved.tokens, last: saved.last }
        : { tokens: limit, last: now };
    const elapsed = now - record.last;
    const refill = Math.floor(elapsed / interval) * limit;
    record.tokens = Math.min(limit, record.tokens + refill);
    record.last = now;
    if (!probe && record.tokens <= 0) {
      await this.storage.put(key, record);
      return new Response(JSON.stringify({ ok: false }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      });
    }
    if (!probe) {
      record.tokens -= 1;
      await this.storage.put(key, record);
    }
    return new Response(
      JSON.stringify({ ok: true, remaining: record.tokens }),
      { status: 200, headers: { 'content-type': 'application/json' } }
    );
  }
}

// Durable Object: HealthWebSocket - Enhanced real-time health data streaming
export class HealthWebSocket {
  private readonly state: DurableObjectState;
  private readonly env?: Env;
  private readonly sessions: Map<WebSocket, SessionInfo>;
  private heartbeatInterval?: ReturnType<typeof setInterval>;

  constructor(state: DurableObjectState, env?: Env) {
    this.state = state;
    this.env = env;
    this.sessions = new Map();
    this.startHeartbeat();
  }

  async fetch(request: Request): Promise<Response> {
    const upgradeHeader = request.headers.get('Upgrade');
    if (upgradeHeader !== 'websocket') {
      return new Response('Expected WebSocket Upgrade', { status: 426 });
    }

    try {
      // Create WebSocket pair
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair) as [
        WebSocket,
        WebSocket,
      ];

      // Parse connection parameters
      const url = new URL(request.url);
      const userId = url.searchParams.get('userId') || `user_${Date.now()}`;
      const deviceId =
        url.searchParams.get('deviceId') || `device_${Date.now()}`;
      const token = url.searchParams.get('token') || 'anonymous';

      // Accept WebSocket connection
      (server as CloudflareWebSocket).accept();

      // Create session info
      const sessionInfo: SessionInfo = {
        userId,
        deviceId,
        token,
        connectedAt: new Date(),
        lastActivity: new Date(),
        messageCount: 0,
        bytesReceived: 0,
        bytesSent: 0,
        latency: 0,
      };

      this.sessions.set(server, sessionInfo);

      // Set up event handlers
      server.addEventListener('message', async (event: MessageEvent) => {
        await this.handleMessage(server, event, sessionInfo);
      });

      server.addEventListener('close', (event: CloseEvent) => {
        this.handleDisconnection(server, sessionInfo, event);
      });

      server.addEventListener('error', (event: Event) => {
        console.error('WebSocket error:', event);
        this.sessions.delete(server);
      });

      // Send welcome message
      await this.sendMessage(server, {
        type: 'connection_established',
        message: 'Connected to VitalSense WebSocket',
        userId,
        deviceId,
        serverTime: new Date().toISOString(),
        sessionId: this.generateSessionId(),
      });

      console.log(`WebSocket connected: ${userId} from ${deviceId}`);

      // Return successful WebSocket upgrade
      return new Response(null, {
        status: 101,
        webSocket: client,
      } as ResponseInit & { webSocket: WebSocket });
    } catch (error) {
      console.error('WebSocket connection error:', error);
      return new Response('WebSocket connection failed', { status: 500 });
    }
  }

  private async handleMessage(
    ws: WebSocket,
    event: MessageEvent,
    session: SessionInfo
  ) {
    try {
      // Update session activity
      session.lastActivity = new Date();
      session.messageCount++;
      session.bytesReceived += new Blob([event.data]).size;

      const data = JSON.parse(event.data as string);
      console.log(`Message from ${session.userId}:`, data.type);

      switch (data.type) {
        case 'health_data':
          await this.processHealthData(ws, data, session);
          break;

        case 'health_batch':
          await this.processHealthBatch(ws, data, session);
          break;

        case 'ping':
          await this.handlePing(ws, data, session);
          break;

        case 'client_info':
          await this.updateClientInfo(ws, data, session);
          break;

        case 'get_status':
          await this.sendStatus(ws, session);
          break;

        default:
          await this.sendMessage(ws, {
            type: 'error',
            message: `Unknown message type: ${data.type}`,
            timestamp: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('Message handling error:', error);
      await this.sendMessage(ws, {
        type: 'error',
        message: 'Failed to process message',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async processHealthData(
    ws: WebSocket,
    data: unknown,
    session: SessionInfo
  ) {
    try {
      // Validate health data
      const healthData = data as { metrics?: unknown[]; timestamp?: string };
      if (!healthData.metrics || !Array.isArray(healthData.metrics)) {
        throw new Error('Invalid health data format - missing metrics array');
      }

      // Process each metric
      const processedMetrics: Record<string, unknown>[] = [];
      for (const metric of healthData.metrics) {
        const metricObj = metric as Record<string, unknown>;
        processedMetrics.push({
          ...metricObj,
          userId: session.userId,
          deviceId: session.deviceId,
          receivedAt: new Date().toISOString(),
          sessionId: this.generateSessionId(),
        });
      }

      // Store in KV with optimized batching
      if (this.env?.HEALTH_KV && processedMetrics.length > 0) {
        const batchKey = `health:${session.userId}:${Date.now()}`;
        const batchData = {
          userId: session.userId,
          deviceId: session.deviceId,
          metrics: processedMetrics,
          processedAt: new Date().toISOString(),
          metricCount: processedMetrics.length,
        };

        await this.env.HEALTH_KV.put(
          batchKey,
          JSON.stringify(batchData),
          { expirationTtl: 86400 } // 24 hours
        );
      }

      // Send acknowledgment with performance stats
      await this.sendMessage(ws, {
        type: 'health_data_ack',
        message: 'Health data processed successfully',
        metricsProcessed: processedMetrics.length,
        processingTime:
          Date.now() - new Date(healthData.timestamp || Date.now()).getTime(),
        timestamp: new Date().toISOString(),
      });

      // Broadcast to other sessions if needed
      await this.broadcastToUserSessions(session.userId, {
        type: 'live_health_update',
        userId: session.userId,
        deviceId: session.deviceId,
        metricsCount: processedMetrics.length,
        lastMetric: processedMetrics[processedMetrics.length - 1],
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Health data processing error:', error);
      await this.sendMessage(ws, {
        type: 'health_data_error',
        message: 'Failed to process health data',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async processHealthBatch(
    ws: WebSocket,
    data: unknown,
    session: SessionInfo
  ) {
    try {
      const batchData = data as { batch?: unknown[] };
      if (!batchData.batch || !Array.isArray(batchData.batch)) {
        throw new Error('Invalid batch format');
      }

      const processedBatches: Record<string, unknown>[] = [];
      let totalMetrics = 0;

      for (const batchItem of batchData.batch) {
        const batchItemObj = batchItem as { metrics?: unknown[] };
        if (batchItemObj.metrics && Array.isArray(batchItemObj.metrics)) {
          totalMetrics += batchItemObj.metrics.length;
          processedBatches.push({
            ...(batchItem as Record<string, unknown>),
            userId: session.userId,
            deviceId: session.deviceId,
            processedAt: new Date().toISOString(),
          });
        }
      }

      // Optimized batch storage
      if (this.env?.HEALTH_KV && processedBatches.length > 0) {
        const batchKey = `health:batch:${session.userId}:${Date.now()}`;
        await this.env.HEALTH_KV.put(
          batchKey,
          JSON.stringify({
            userId: session.userId,
            deviceId: session.deviceId,
            batches: processedBatches,
            totalMetrics,
            processedAt: new Date().toISOString(),
          }),
          { expirationTtl: 86400 } // 24 hours
        );
      }

      await this.sendMessage(ws, {
        type: 'health_batch_ack',
        message: 'Health batch processed successfully',
        batchesProcessed: processedBatches.length,
        totalMetrics,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Health batch processing error:', error);
      await this.sendMessage(ws, {
        type: 'health_batch_error',
        message: 'Failed to process health batch',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handlePing(ws: WebSocket, data: unknown, session: SessionInfo) {
    const now = Date.now();
    const pingData = data as { timestamp?: string };
    const pingTime = pingData.timestamp
      ? new Date(pingData.timestamp).getTime()
      : now;
    const latency = now - pingTime;

    session.latency = latency;

    await this.sendMessage(ws, {
      type: 'pong',
      timestamp: new Date().toISOString(),
      latency,
      serverTime: now,
    });
  }

  private async updateClientInfo(
    ws: WebSocket,
    data: unknown,
    session: SessionInfo
  ) {
    // Update session with client information
    const clientData = data as {
      deviceInfo?: Record<string, unknown>;
      appVersion?: string;
    };
    if (clientData.deviceInfo) {
      session.deviceInfo = clientData.deviceInfo;
    }
    if (clientData.appVersion) {
      session.appVersion = clientData.appVersion;
    }

    await this.sendMessage(ws, {
      type: 'client_info_ack',
      message: 'Client information updated',
      timestamp: new Date().toISOString(),
    });
  }

  private async sendStatus(ws: WebSocket, session: SessionInfo) {
    const sessionCount = this.sessions.size;
    const uptime = Date.now() - session.connectedAt.getTime();

    await this.sendMessage(ws, {
      type: 'status_response',
      sessionInfo: {
        userId: session.userId,
        deviceId: session.deviceId,
        connectedAt: session.connectedAt.toISOString(),
        uptime,
        messageCount: session.messageCount,
        bytesReceived: session.bytesReceived,
        bytesSent: session.bytesSent,
        latency: session.latency,
      },
      serverInfo: {
        activeSessions: sessionCount,
        serverTime: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async sendMessage(ws: WebSocket, message: Record<string, unknown>) {
    if (ws.readyState === 1) {
      // WebSocket.OPEN
      const messageStr = JSON.stringify(message);
      ws.send(messageStr);

      // Update bytes sent
      const session = this.sessions.get(ws);
      if (session) {
        session.bytesSent += new Blob([messageStr]).size;
      }
    }
  }

  private async broadcastToUserSessions(
    userId: string,
    message: Record<string, unknown>
  ) {
    for (const [ws, session] of this.sessions) {
      if (session.userId === userId && ws.readyState === 1) {
        await this.sendMessage(ws, message);
      }
    }
  }

  private handleDisconnection(
    ws: WebSocket,
    session: SessionInfo,
    event: CloseEvent
  ) {
    console.log(
      `WebSocket disconnected: ${session.userId} (${event.code}: ${event.reason})`
    );
    this.sessions.delete(ws);
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private startHeartbeat() {
    // Clean up inactive sessions every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();
      for (const [ws, session] of this.sessions) {
        const inactiveTime = now - session.lastActivity.getTime();
        if (inactiveTime > 300000) {
          // 5 minutes of inactivity
          console.log(`Closing inactive session: ${session.userId}`);
          ws.close(1000, 'Session timeout');
          this.sessions.delete(ws);
        }
      }
    }, 30000);
  }
}

// Type definitions for enhanced WebSocket messages
interface SessionInfo {
  userId: string;
  deviceId: string;
  token: string;
  connectedAt: Date;
  lastActivity: Date;
  messageCount: number;
  bytesReceived: number;
  bytesSent: number;
  latency: number;
  deviceInfo?: Record<string, unknown>;
  appVersion?: string;
}
