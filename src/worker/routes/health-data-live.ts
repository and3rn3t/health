/**
 * Live gait & balance ingestion routes.
 *
 * Endpoints:
 *  POST /api/live/gait
 *  POST /api/live/gait/batch
 *  POST /api/live/balance/progress
 *  POST /api/live/balance/result
 *  GET  /api/live/gait/recent
 *  GET  /api/live/balance/recent
 */
import { summarizeGaitSnapshots } from '@/lib/liveGaitSummaries';
import {
  liveBalanceProgressSchema,
  liveBalanceResultSchema,
  liveGaitSnapshotBatchSchema,
  liveGaitSnapshotSchema,
  type LiveBalanceResult,
  type LiveGaitSnapshot,
  type LiveGaitSnapshotBatch,
} from '@/schemas/health';
import { Hono } from 'hono';
import {
  broadcastUserLiveEvent,
  deriveRateLimitKey,
  getVerifiedAuthSub,
  log,
  rateLimitDO,
  shouldSample,
} from '../helpers';
import type { BroadKV, Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Live gait snapshot ingestion
// ---------------------------------------------------------------------------

route.post('/api/live/gait', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const rlKey = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, `gait:${rlKey}`, 120)))
    return c.json({ error: 'rate_limited' }, 429);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const parsed = liveGaitSnapshotSchema.safeParse(body);
  if (!parsed.success)
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  const data = { ...parsed.data, userId: parsed.data.userId || sub };
  const kv = c.env.HEALTH_KV;
  if (kv) {
    const key = `live:gait:${data.userId || 'anon'}:${data.capturedAt}`;
    try {
      await kv.put(key, JSON.stringify(data), { expirationTtl: 3600 });
    } catch (e) {
      log.warn('kv_put_live_gait_failed', { error: (e as Error).message });
    }
  }
  if (shouldSample(c))
    log.info('live_gait_snapshot', {
      userId: '[redacted]',
      capturedAt: data.capturedAt,
    });
  try {
    await broadcastUserLiveEvent(c, sub, {
      type: 'live_health_update',
      subtype: 'gait_snapshot',
      snapshot: data,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    log.warn('ws_broadcast_gait_failed', { error: (e as Error).message });
  }
  return c.json({ ok: true });
});

// Batched gait snapshots
route.post('/api/live/gait/batch', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const rlKey = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, `gait-batch:${rlKey}`, 30)))
    return c.json({ error: 'rate_limited' }, 429);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const parsed = liveGaitSnapshotBatchSchema.safeParse(body);
  if (!parsed.success)
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  const batch: LiveGaitSnapshotBatch = parsed.data;
  const kv = c.env.HEALTH_KV;
  let stored = 0;
  if (kv) {
    const results = await Promise.allSettled(
      batch.snapshots.map((snap) => {
        const key = `live:gait:${sub}:${snap.capturedAt}`;
        return kv.put(key, JSON.stringify({ ...snap, userId: sub }), {
          expirationTtl: 3600,
        });
      })
    );
    stored = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;
    if (failed > 0) log.warn('kv_put_live_gait_batch_failed', { failed });
  }
  const last = batch.snapshots[batch.snapshots.length - 1];
  try {
    await broadcastUserLiveEvent(c, sub, {
      type: 'live_health_update',
      subtype: 'gait_batch',
      count: batch.snapshots.length,
      lastSnapshot: last,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    log.warn('ws_broadcast_gait_batch_failed', {
      error: (e as Error).message,
    });
  }
  return c.json({ ok: true, stored });
});

// Balance progress (live stream)
route.post('/api/live/balance/progress', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const rlKey = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, `balance:${rlKey}`, 120)))
    return c.json({ error: 'rate_limited' }, 429);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const parsed = liveBalanceProgressSchema.safeParse(body);
  if (!parsed.success)
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  const data = { ...parsed.data, userId: parsed.data.userId || sub };
  if (shouldSample(c))
    log.info('balance_progress', {
      capturedAt: data.capturedAt,
    });
  try {
    await broadcastUserLiveEvent(c, sub, {
      type: 'live_health_update',
      subtype: 'balance_progress',
      progress: data,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    log.warn('ws_broadcast_balance_progress_failed', {
      error: (e as Error).message,
    });
  }
  return c.json({ ok: true });
});

// Balance result (final score)
route.post('/api/live/balance/result', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const rlKey = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, `balance-result:${rlKey}`, 30)))
    return c.json({ error: 'rate_limited' }, 429);
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: 'invalid_json' }, 400);
  }
  const parsed = liveBalanceResultSchema.safeParse(body);
  if (!parsed.success)
    return c.json(
      { error: 'validation_error', details: parsed.error.flatten() },
      400
    );
  const data = { ...parsed.data, userId: parsed.data.userId || sub };
  const kv = c.env.HEALTH_KV;
  if (kv) {
    const key = `live:balance_result:${data.userId || 'anon'}:${data.capturedAt}`;
    try {
      await kv.put(key, JSON.stringify(data), {
        expirationTtl: 7 * 24 * 3600,
      });
    } catch (e) {
      log.warn('kv_put_balance_result_failed', {
        error: (e as Error).message,
      });
    }
  }
  if (shouldSample(c))
    log.info('balance_result', { capturedAt: data.capturedAt });
  try {
    await broadcastUserLiveEvent(c, sub, {
      type: 'live_health_update',
      subtype: 'balance_result',
      result: data,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    log.warn('ws_broadcast_balance_result_failed', {
      error: (e as Error).message,
    });
  }
  return c.json({ ok: true });
});

// ---------------------------------------------------------------------------
// KV helpers for fetching live data
// ---------------------------------------------------------------------------

async function fetchGaitSnapshots(kv: BroadKV, sub: string, limit: number) {
  if (!kv.list) return [] as LiveGaitSnapshot[];
  const list = await kv.list({ prefix: `live:gait:${sub}:`, limit });
  if (!kv.get) return [] as LiveGaitSnapshot[];
  const results = await Promise.allSettled(
    list.keys.map(async (k) => {
      const raw = await kv.get!(k.name);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LiveGaitSnapshot;
      return parsed && typeof parsed.capturedAt === 'string' ? parsed : null;
    })
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<LiveGaitSnapshot | null> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)
    .filter((v): v is LiveGaitSnapshot => v !== null);
}

route.get('/api/live/gait/recent', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const kv = c.env.HEALTH_KV as BroadKV | undefined;
  if (!kv) return c.json({ error: 'kv_unavailable' }, 503);
  const limit = Math.min(
    200,
    Number(new URL(c.req.url).searchParams.get('limit') || 50)
  );
  const snapshots = await fetchGaitSnapshots(kv, sub, limit);
  const summary = summarizeGaitSnapshots(snapshots);
  return c.json({
    ok: true,
    userId: sub,
    count: snapshots.length,
    snapshots: summary.ordered,
    rolling: summary.rolling,
    trend: summary.trend,
    trends: summary.trends,
  });
});

async function fetchBalanceResults(kv: BroadKV, sub: string, limit: number) {
  if (!kv.list) return [] as LiveBalanceResult[];
  const list = await kv.list({
    prefix: `live:balance_result:${sub}:`,
    limit,
  });
  if (!kv.get) return [] as LiveBalanceResult[];
  const results = await Promise.allSettled(
    list.keys.map(async (k) => {
      const raw = await kv.get!(k.name);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as LiveBalanceResult;
      return parsed && typeof parsed.capturedAt === 'string' ? parsed : null;
    })
  );
  return results
    .filter(
      (r): r is PromiseFulfilledResult<LiveBalanceResult | null> =>
        r.status === 'fulfilled'
    )
    .map((r) => r.value)
    .filter((v): v is LiveBalanceResult => v !== null);
}

route.get('/api/live/balance/recent', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const kv = c.env.HEALTH_KV as BroadKV | undefined;
  if (!kv) return c.json({ error: 'kv_unavailable' }, 503);
  const limit = Math.min(
    50,
    Number(new URL(c.req.url).searchParams.get('limit') || 20)
  );
  const results = await fetchBalanceResults(kv, sub, limit);
  const ordered = results
    .slice()
    .sort((a, b) => (b.capturedAt || '').localeCompare(a.capturedAt || ''));
  return c.json({ ok: true, userId: sub, results: ordered });
});

export { route as liveRoutes };
