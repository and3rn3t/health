/**
 * Cloudflare Workers entry point for the Health App
 * This file handles the worker logic and serves the built application
 */

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

  // Use relaxed CSP for login page to allow Auth0 scripts
  const isLoginPage = c.req.path === '/login';
  const csp = isLoginPage
    ? [
        "default-src 'self'",
        "img-src 'self' data: https:",
        "style-src 'self' 'unsafe-inline'",
        "script-src 'self' 'unsafe-inline' https://cdn.auth0.com https://static.cloudflareinsights.com",
        "connect-src 'self' https: wss:",
        "frame-ancestors 'none'",
      ].join('; ')
    : [
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
  // Only try to serve assets for GET requests to avoid consuming request body
  if (c.req.method !== 'GET') return next();

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
}); // WebSocket endpoint for real-time health data (not implemented in Worker yet)
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
  } catch (e) {
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
app.get('/api/health-data/analytics/:userId', async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'user_id_required' }, 400);
  }

  try {
    const kv = c.env.HEALTH_KV;
    if (!kv || typeof kv.list !== 'function' || typeof kv.get !== 'function') {
      return c.json({ ok: true, analytics: null });
    }

    // Get recent health data for analytics
    const prefix = 'health:';
    const listing = await kv.list({ prefix, limit: 100 });
    const encKeyB64 = c.env.ENC_KEY;
    const keyObj = encKeyB64 ? await getAesKey(encKeyB64) : null;

    const recentData: ProcessedHealthData[] = [];
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
        recentData.push(obj);
      }
    }

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
  const kv = (c.env as Env).HEALTH_KV;
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
    const encKeyB64 = (c.env as Env).ENC_KEY;
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
        ? data.sort(
            (a, b) =>
              new Date(b.processedAt).getTime() -
              new Date(a.processedAt).getTime()
          )[0].processedAt
        : null,
  };
}

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
      // VitalSense Demo Mode - Set immediately before any other scripts
      window.VITALSENSE_DEMO_MODE = true;
      window.VITALSENSE_DEMO_USER = ${JSON.stringify(demoUser)};
      window.vitalsense_demo_mode = true;
      window.vitalsense_demo_user = ${JSON.stringify(demoUser)};
      window.vitalsense_bypass_auth = true;

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
    </meta>
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
  const auth0Domain = c.env.AUTH0_DOMAIN || 'dev-qjdpc81dzr7xrnlu.us.auth0.com';
  const auth0ClientId =
    c.env.AUTH0_CLIENT_ID || '3SWqx7E8dFSIWapIikjppEKQ5ksNxRAQ';

  // Use the current domain for callback
  const baseUrl = c.env.BASE_URL || 'https://health.andernet.dev';
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
        const auth0 = new auth0.WebAuth({
            domain: '${auth0Domain}',
            clientID: '${auth0ClientId}',
            redirectUri: '${redirectUri}',
            responseType: 'code',
            scope: 'openid profile email'
        });

        function loginWithAuth0() {
            // Check if Auth0 is properly configured
            fetch('https://' + '${auth0Domain}' + '/.well-known/openid_configuration')
                .then(response => {
                    if (response.ok) {
                        // Auth0 is working, proceed with normal auth
                        auth0.authorize();
                    } else {
                        // Auth0 not configured, use demo mode
                        loginDemo();
                    }
                })
                .catch(() => {
                    // Auth0 not accessible, use demo mode
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
        }        // Auto-redirect if already logged in
        auth0.parseHash((err, authResult) => {
            if (authResult && authResult.accessToken) {
                window.location.href = '/';
            }
        });
    </script>
</body>
</html>`;

  return c.html(html);
});

// Auth0 callback handler - redirect back to main app after authentication
app.get('/callback', async (c) => {
  // Get the authorization code and state from Auth0
  const url = new URL(c.req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const error = url.searchParams.get('error');
  const demo = url.searchParams.get('demo');

  // Handle demo mode
  if (demo === 'true') {
    return c.redirect('https://health.andernet.dev/?demo=true', 302);
  }

  // If there's an error, redirect to main domain with error
  if (error) {
    return c.redirect(
      `https://health.andernet.dev/?auth_error=${encodeURIComponent(error)}`,
      302
    );
  }

  // If successful, redirect to main app with auth code
  if (code) {
    const params = new URLSearchParams();
    params.set('code', code);
    if (state) params.set('state', state);
    return c.redirect(`https://health.andernet.dev/?${params.toString()}`, 302);
  }

  // Fallback redirect to main app
  return c.redirect('https://health.andernet.dev/', 302);
});

// Support alternative auth path for backward compatibility
app.get('/auth/login', async (c) => {
  return c.redirect('/login', 302);
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
