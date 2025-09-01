/**
 * Cloudflare Workers entry point for the Health App
 * This file handles the worker logic and serves the built application
 */

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
    const body = await resp.json().catch(() => ({ ok: false }));
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
  if (c.env.ENVIRONMENT !== 'production') return true;
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) return false;
  const jwksUrl = c.env.API_JWKS_URL;
  if (jwksUrl) {
    const check = await verifyJwtWithJwks(token, {
      iss: c.env.API_ISS,
      aud: c.env.API_AUD,
      jwksUrl,
    });
    return check.ok;
  }
  const check = await validateBearerJWT(token, {
    iss: c.env.API_ISS,
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

  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'", // Tailwind inlined
    "script-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
  ].join('; ');

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
  const key = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, key)))
    return c.json({ error: 'rate_limited' }, 429);
  if (!(await requireAuth(c))) return c.json({ error: 'unauthorized' }, 401);
  return next();
});

// Serve static assets via Wrangler [assets] binding; fallback to next on 404
app.use('/*', async (c, next) => {
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

// WebSocket endpoint for real-time health data (not implemented in Worker yet)
app.get('/ws', (c) => {
  return c.text(
    'WebSocket endpoint not available on Worker. Use local bridge server.',
    426
  );
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
    const body = await resp.json().catch(() => ({ ok: false }));
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
  // In production require upstream authentication before minting
  if (!(await requireAuth(c))) return c.json({ error: 'unauthorized' }, 401);
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
    console.log('[DEBUG] Device auth request body:', JSON.stringify(json));
    const res = bodySchema.safeParse(json);
    if (!res.success) {
      console.log('[DEBUG] Validation failed:', res.error.flatten());
      return c.json(
        { error: 'validation_error', details: res.error.flatten() },
        400
      );
    }
    parsed = res.data;
  } catch (e) {
    console.log('[DEBUG] JSON parse failed:', e.message);
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

// API routes for health data
app.get('/api/health-data', async (c) => {
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
    // KV not bound or missing methods in this environment
    return c.json({ ok: true, data: [] });
  }
  const prefix = metric ? `health:${metric}:` : 'health:';
  try {
    const listing = await kv.list({ prefix, limit, cursor });
    const encKeyB64 = c.env.ENC_KEY;
    const keyObj = encKeyB64 ? await getAesKey(encKeyB64) : null;
    const rows: Array<ProcessedHealthData> = [];
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
      // Filter by from/to on processedAt
      if (from) {
        if (new Date(obj.processedAt).getTime() < new Date(from).getTime())
          continue;
      }
      if (to) {
        if (new Date(obj.processedAt).getTime() > new Date(to).getTime())
          continue;
      }
      rows.push(obj);
      if (rows.length >= limit) break;
    }
    // Sort by processedAt desc (KV list returns lexicographic by key; keep consistent ordering)
    rows.sort((a, b) => (a.processedAt < b.processedAt ? 1 : -1));
    // Include pagination hints; keep backwards compatibility with data[] shape
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

// SPA fallback to index.html using ASSETS binding
app.get('*', async (c) => {
  const url = new URL('/index.html', c.req.url);
  if (!c.env.ASSETS) return c.text('Not Found', 404);
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
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

// Durable Object: HealthWebSocket (stub to satisfy binding; actual WS served by local Node bridge)
// This DO currently returns 426 to indicate WS not available in the Worker.
// When ready to migrate WS to Workers Durable Objects, implement upgrade handling here.
export class HealthWebSocket {
  constructor(_state: DurableObjectState, _env?: Env) {}
  async fetch(_request: Request): Promise<Response> {
    return new Response(
      'WebSocket not available on Worker. Use local bridge.',
      {
        status: 426,
        headers: { 'content-type': 'text/plain' },
      }
    );
  }
}
