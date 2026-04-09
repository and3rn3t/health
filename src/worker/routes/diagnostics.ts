import { Hono } from 'hono';
import {
  encryptJSON,
  getAesKey,
  validateBearerJWT,
  verifyJwtWithJwks,
} from '@/lib/security';
import { purgeOldHealthData, type KVNamespaceLite } from '@/lib/retention';
import {
  deriveRateLimitKey,
  VERSION_MISMATCH_BUFFER_SIZE,
  versionMismatchBuffer,
  writeAnalyticsPoint,
} from '../helpers';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Non-production self-test for crypto/auth
// ---------------------------------------------------------------------------

route.get('/api/_selftest', async (c) => {
  if (!c.env.ENVIRONMENT || c.env.ENVIRONMENT === 'production')
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

// Dev-only: intentional error endpoint to test error handling and analytics sampling
route.get('/api/_error', (c) => {
  if (!c.env.ENVIRONMENT || c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'not_available' }, 404);
  }
  throw new Error('intentional_test_error');
});

// Dev-only: analytics ping endpoint to verify Analytics Engine writes
route.get('/api/_analytics_ping', async (c) => {
  if (!c.env.ENVIRONMENT || c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'not_available' }, 404);
  }
  const env = c.env.ENVIRONMENT || 'development';
  const correlationId = crypto.randomUUID();
  let dataset: string | null = null;
  if (c.env.ANALYTICS) dataset = 'ANALYTICS';
  else if (c.env.HEALTH_ANALYTICS) dataset = 'HEALTH_ANALYTICS';
  else if (c.env.PERFORMANCE_ANALYTICS) dataset = 'PERFORMANCE_ANALYTICS';
  else if (c.env.SECURITY_ANALYTICS) dataset = 'SECURITY_ANALYTICS';
  try {
    const ok = writeAnalyticsPoint(
      c,
      [env, '/api/_analytics_ping', 'GET', '200', '0', correlationId],
      [0]
    );
    return c.json({ ok, dataset, correlationId, env });
  } catch (e) {
    return c.json({ ok: false, error: (e as Error).message }, 500);
  }
});

// Dev-only: diagnostics snapshot for UI (bindings, env, sampling)
route.get('/api/_diagnostics', (c) => {
  if (!c.env.ENVIRONMENT || c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'not_available' }, 404);
  }
  const env = c.env.ENVIRONMENT || 'development';
  const datasets = {
    ANALYTICS: Boolean(c.env.ANALYTICS),
    HEALTH_ANALYTICS: Boolean(c.env.HEALTH_ANALYTICS),
    PERFORMANCE_ANALYTICS: Boolean(c.env.PERFORMANCE_ANALYTICS),
    SECURITY_ANALYTICS: Boolean(c.env.SECURITY_ANALYTICS),
  };
  const body = {
    ok: true,
    env,
    logSampleRate: c.env.LOG_SAMPLE_RATE ?? null,
    logSampleRates: {
      ws:
        (c.env as Record<string, string | undefined>).LOG_WS_SAMPLE_RATE ??
        null,
      clientError:
        (c.env as Record<string, string | undefined>)
          .LOG_CLIENT_ERROR_SAMPLE_RATE ?? null,
    },
    analyticsVersionMismatch: {
      recentEventCount: versionMismatchBuffer.length,
      maxStored: VERSION_MISMATCH_BUFFER_SIZE,
      clientSampleRate:
        (c.env as Record<string, string | undefined>)
          .ANALYTICS_VERSION_MISMATCH_SAMPLE_RATE || '1.0',
      oldestEventAgeMs:
        versionMismatchBuffer.length > 0
          ? Date.now() - Date.parse(versionMismatchBuffer[0]!.ts)
          : 0,
    },
    datasets,
    hasKV: Boolean(c.env.HEALTH_KV),
    hasR2: Boolean(c.env.HEALTH_STORAGE),
    hasRateLimiter: Boolean(c.env.RATE_LIMITER),
    now: new Date().toISOString(),
    endpoints: [
      '/health',
      '/api/_diagnostics',
      '/api/_analytics_ping',
      '/api/_error',
      '/api/_ratelimit',
      '/api/_audit?limit=10&withBodies=1',
      '/api/client-error',
      '/api/ws-telemetry',
      '/api/ws-url',
      '/api/ws-live-enabled',
      '/api/ws-user-id',
      '/api/ws-device-token',
      '/api/auth0/health',
      '/auth0/health',
    ],
  } as const;
  return c.json(body, 200);
});

// Dev-only: rate limit remaining probe (does not consume)
route.get('/api/_ratelimit', async (c) => {
  if (!c.env.ENVIRONMENT || c.env.ENVIRONMENT === 'production')
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
route.get('/api/_audit', async (c) => {
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

// Dev-only purge trigger
route.post('/api/_purge', async (c) => {
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

export { route as diagnosticsRoutes };
