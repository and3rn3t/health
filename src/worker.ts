/**
 * Cloudflare Worker entry point.
 *
 * Route handlers, middleware, helpers, and types are split into focused modules
 * under `src/worker/`. This file wires them together and re-exports the
 * platform symbols that Wrangler / tests expect.
 */
import { Hono } from 'hono';
import { purgeOldHealthData, type KVNamespaceLite } from '@/lib/retention';

import type { Env } from './worker/types';
import { registerMiddleware } from './worker/middleware';

// Route sub-apps
import { configRoutes } from './worker/routes/config';
import { telemetryRoutes } from './worker/routes/telemetry';
import { authRoutes } from './worker/routes/auth';
import { wsRoutes } from './worker/routes/ws';
import { diagnosticsRoutes } from './worker/routes/diagnostics';
import { liveRoutes } from './worker/routes/health-data-live';
import { batchRoutes } from './worker/routes/health-data-batch';
import { analyticsRoutes } from './worker/routes/health-data-analytics';
import { kvRoutes } from './worker/routes/health-data-kv';
import { demoRoutes } from './worker/routes/demo';
import { openapiRoutes } from './worker/routes/openapi';
import { captureException } from './worker/sentry';

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

export const app = new Hono<{ Bindings: Env }>();
export default app;

// Config routes (incl. /app-config.js) MUST be registered before the static
// asset middleware so they are not shadowed by the `ASSETS.fetch()` fallback.
app.route('/', configRoutes);

// Global middleware (CORS, auth, static assets)
registerMiddleware(app);

// Mount route modules
app.route('/', telemetryRoutes);
app.route('/', authRoutes);
app.route('/', wsRoutes);
app.route('/', diagnosticsRoutes);
app.route('/', liveRoutes);
app.route('/', batchRoutes);
app.route('/', analyticsRoutes);
app.route('/', kvRoutes);
app.route('/', demoRoutes);
app.route('/', openapiRoutes);

// ---------------------------------------------------------------------------
// Global error handler — reports unhandled exceptions to Sentry
// ---------------------------------------------------------------------------

app.onError((err, c) => {
  const dsn = c.env.SENTRY_DSN;
  if (dsn) {
    const promise = captureException(
      err instanceof Error ? err : new Error(String(err)),
      {
        dsn,
        environment: c.env.ENVIRONMENT || 'unknown',
        request: c.req.raw,
        tags: { path: new URL(c.req.url).pathname },
      }
    );
    try {
      c.executionCtx?.waitUntil(promise);
    } catch {
      // no execution context available
    }
  }
  return c.json({ error: 'internal_server_error' }, 500);
});

// ---------------------------------------------------------------------------
// SPA catch-all (MUST be last)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Scheduled purge entry (Cloudflare Cron Triggers)
// ---------------------------------------------------------------------------

export async function scheduled(
  _controller: { cron: string; scheduledTime: number },
  env: Env,
  ctx: { waitUntil: (p: Promise<unknown>) => void }
) {
  const kv = env.HEALTH_KV as unknown as KVNamespaceLite | undefined;
  if (!kv) return;
  ctx.waitUntil(purgeOldHealthData(env, kv));
}

// ---------------------------------------------------------------------------
// Durable Object: RateLimiter (re-exported for Wrangler binding)
// ---------------------------------------------------------------------------

export { RateLimiter } from '@/rateLimiter';

// Export the simple WebSocket implementation
export { SimpleHealthWebSocket as HealthWebSocket } from '@/SimpleHealthWebSocket';
