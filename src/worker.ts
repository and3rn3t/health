/**
 * Cloudflare Workers entry point for the Health App
 * This file handles the worker logic and serves the built application
 */

import { Hono } from 'hono';
import { z } from 'zod';
import {
  processedHealthDataSchema,
  healthMetricSchema,
} from '@/schemas/health';
import {
  applySecurityHeaders,
  corsHeaders,
  getAesKey,
  encryptJSON,
  log,
  validateBearerJWT,
  verifyJwtWithJwks,
  writeAudit,
  decodeJwtPayload,
} from '@/lib/security';
import { getTtlSecondsForType } from '@/lib/retention';

type Env = {
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string; // comma-separated
  ENC_KEY?: string; // base64 32 bytes
  API_ISS?: string;
  API_AUD?: string;
  API_JWKS_URL?: string;
  HEALTH_KV?: {
    put: (
      key: string,
      value: string,
      options?: { expirationTtl?: number }
    ) => Promise<void>;
  };
  HEALTH_STORAGE?: {
    put: (
      key: string,
      data: string | ReadableStream | ArrayBuffer,
      opts?: any
    ) => Promise<any>;
    get: (
      key: string,
      opts?: any
    ) => Promise<{ body?: ReadableStream | null } | null>;
    list: (opts?: {
      prefix?: string;
      limit?: number;
    }) => Promise<{
      objects: Array<{ key: string; uploaded?: string | Date }>;
    }>;
  };
  ASSETS?: {
    fetch: (req: Request) => Promise<Response>;
  };
  RATE_LIMITER?: {
    idFromName: (name: string) => any;
    get: (id: any) => { fetch: (req: Request | string) => Promise<Response> };
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
  c: any,
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

function deriveRateLimitKey(c: any): string {
  // Prefer per-user limit from JWT sub, fallback to IP
  const auth = c.req.header('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const sub = token
    ? (decodeJwtPayload(token)?.sub as string | undefined)
    : undefined;
  return sub || c.req.header('CF-Connecting-IP') || 'anon';
}

async function requireAuth(c: any): Promise<boolean> {
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
  c.res = c.newResponse(null); // initialize so we can set headers later

  if (c.req.method === 'OPTIONS') {
    const h = corsHeaders(origin, allowed);
    h.set('X-Correlation-Id', correlationId);
    return c.newResponse(null, { status: 204, headers: h });
  }

  await next();

  const csp = [
    "default-src 'self'",
    "img-src 'self' data:",
    "style-src 'self' 'unsafe-inline'", // Tailwind inlined
    "script-src 'self'",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
  ].join('; ');

  const resp = applySecurityHeaders(c.res, csp);
  const h = corsHeaders(origin, allowed);
  resp.headers.set('X-Correlation-Id', correlationId);
  h.forEach((v, k) => resp.headers.set(k, v));
  return resp;
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
  const assets = c.env.ASSETS;
  if (!assets || typeof assets.fetch !== 'function') return next();
  const res = await assets.fetch(c.req.raw);
  if (res.status === 404) return next();
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
      if (got && got.body) {
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

// API routes for health data
app.get('/api/health-data', async (c) => {
  // Validate query params
  const querySchema = z.object({
    from: z.string().datetime().optional(),
    to: z.string().datetime().optional(),
    metric: healthMetricSchema.shape.type.optional(),
  });

  const url = new URL(c.req.url);
  const params = Object.fromEntries(url.searchParams.entries());
  const parse = querySchema.safeParse(params);
  if (!parse.success) {
    return c.json(
      { error: 'validation_error', details: parse.error.flatten() },
      400
    );
  }

  // Stubbed response for now
  return c.json({
    ok: true,
    query: parse.data,
    data: [],
  });
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
    await writeAudit(c.env as any, {
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
  return c.env.ASSETS.fetch(new Request(url.toString(), c.req.raw));
});

export default app;

// Durable Object: RateLimiter (exported for Wrangler binding)
export class RateLimiter {
  private readonly storage: any;
  constructor(state: any) {
    this.storage = state.storage;
  }
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const key = url.searchParams.get('key') || 'anon';
    const limit = Number(url.searchParams.get('limit') || 60);
    const interval = Number(url.searchParams.get('intervalMs') || 60_000);
    const probe = url.searchParams.get('probe') === '1';

    const now = Date.now();
    const record = (await this.storage.get(key)) || {
      tokens: limit,
      last: now,
    };
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
