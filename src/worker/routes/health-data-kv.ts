/**
 * KV CRUD (user-scoped settings) + legacy health-data endpoints + Spark compat.
 *
 * Endpoints:
 *  GET    /api/kv/:key
 *  PUT    /api/kv/:key
 *  DELETE /api/kv/:key
 *  GET    /api/health-data
 *  POST   /api/health-data
 *  POST   /_spark/loaded
 */
import { Hono } from 'hono';
import { z } from 'zod/v3';
import { generateDemoHealthData } from '@/lib/demo-data';
import { getTtlSecondsForType } from '@/lib/retention';
import {
  decryptJSON,
  encryptJSON,
  getAesKey,
  writeAudit,
} from '@/lib/security';
import {
  healthMetricSchema,
  processedHealthDataSchema,
  type ProcessedHealthData,
} from '@/schemas/health';
import {
  getVerifiedAuthSub,
  log,
} from '../helpers';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// KV CRUD (user-scoped settings)
// ---------------------------------------------------------------------------

const kvPutBodySchema = z.object({
  value: z.unknown(),
});

const ALLOWED_KV_KEYS = new Set([
  'preferences',
  'dashboard-layout',
  'alert-settings',
  'theme',
  'notification-settings',
]);

route.get('/api/kv/:key', async (c) => {
  try {
    const sub = await getVerifiedAuthSub(c);
    if (!sub) return c.json({ error: 'unauthorized' }, 401);
    const rawKey = c.req.param('key');
    if (!ALLOWED_KV_KEYS.has(rawKey))
      return c.json({ error: 'invalid_key' }, 400);
    const key = `user-settings:${sub}:${rawKey}`;
    const kv = c.env.HEALTH_KV;
    if (!kv?.get) {
      return c.json({ error: 'KV storage not available' }, 503);
    }
    const value = await kv.get(key);
    return c.json({ key: rawKey, value });
  } catch (error) {
    log.error('KV get error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'Failed to get value' }, 500);
  }
});

route.put('/api/kv/:key', async (c) => {
  try {
    const sub = await getVerifiedAuthSub(c);
    if (!sub) return c.json({ error: 'unauthorized' }, 401);
    const rawKey = c.req.param('key');
    if (!ALLOWED_KV_KEYS.has(rawKey))
      return c.json({ error: 'invalid_key' }, 400);
    let body: unknown;
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: 'invalid_json' }, 400);
    }
    const parsed = kvPutBodySchema.safeParse(body);
    if (!parsed.success)
      return c.json(
        { error: 'validation_error', details: parsed.error.flatten() },
        400
      );
    const key = `user-settings:${sub}:${rawKey}`;
    const kv = c.env.HEALTH_KV;
    if (!kv) {
      return c.json({ error: 'KV storage not available' }, 503);
    }
    await kv.put(key, JSON.stringify(parsed.data.value));
    return c.json({ success: true, key: rawKey });
  } catch (error) {
    log.error('KV put error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'Failed to save value' }, 500);
  }
});

route.delete('/api/kv/:key', async (c) => {
  try {
    const sub = await getVerifiedAuthSub(c);
    if (!sub) return c.json({ error: 'unauthorized' }, 401);
    const rawKey = c.req.param('key');
    if (!ALLOWED_KV_KEYS.has(rawKey))
      return c.json({ error: 'invalid_key' }, 400);
    const key = `user-settings:${sub}:${rawKey}`;
    const kv = c.env.HEALTH_KV;
    if (!kv?.delete) {
      return c.json({ error: 'KV storage not available' }, 503);
    }
    await kv.delete(key);
    return c.json({ success: true, key: rawKey });
  } catch (error) {
    log.error('KV delete error', {
      error: error instanceof Error ? error.message : String(error),
    });
    return c.json({ error: 'Failed to delete value' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Health data CRUD
// ---------------------------------------------------------------------------

route.get('/api/health-data', async (c) => {
  const referer = c.req.header('Referer') || '';
  const isDemoRequest =
    referer.includes('/demo') || c.req.header('X-Demo-Mode') === 'true';
  if (isDemoRequest) {
    const demoData = generateDemoHealthData();
    return c.json({ ok: true, data: demoData, hasMore: false });
  }
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

route.post('/api/health-data', async (c) => {
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
    return c.json({ error: 'server_error' }, 500);
  }
  return c.json({ ok: true, data: parsed.data }, 201);
});

// GitHub Spark compatibility endpoint
route.post('/_spark/loaded', async (c) => {
  return c.json({ ok: true, status: 'loaded' });
});

export { route as kvRoutes };
