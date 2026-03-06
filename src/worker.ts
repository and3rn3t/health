/**
 * Cloudflare Worker entry point.
 *
 * Route handlers, middleware, helpers, and types are split into focused modules
 * under `src/worker/`. This file wires them together and re-exports the
 * platform symbols that Wrangler / tests expect.
 */
import { Hono } from 'hono';
import { purgeOldHealthData, type KVNamespaceLite } from '@/lib/retention';
import { SimpleHealthWebSocket } from '@/SimpleHealthWebSocket';

import type { Env } from './worker/types';
import { registerMiddleware } from './worker/middleware';

// Route sub-apps
import { configRoutes } from './worker/routes/config';
import { telemetryRoutes } from './worker/routes/telemetry';
import { authRoutes } from './worker/routes/auth';
import { wsRoutes } from './worker/routes/ws';
import { diagnosticsRoutes } from './worker/routes/diagnostics';
import { healthDataRoutes } from './worker/routes/health-data';
import { demoRoutes } from './worker/routes/demo';

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
app.route('/', healthDataRoutes);
app.route('/', demoRoutes);

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
// Durable Object: RateLimiter (exported for Wrangler binding)
// ---------------------------------------------------------------------------

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

// Export the simple WebSocket implementation
export { SimpleHealthWebSocket as HealthWebSocket };
