import { Hono, type Context } from 'hono';
import { z } from 'zod';
import { generateDemoHealthData } from '@/lib/demo-data';
import { HealthDataProcessor } from '@/lib/enhancedHealthProcessor';
import { getTtlSecondsForType } from '@/lib/retention';
import {
  decryptJSON,
  encryptJSON,
  getAesKey,
  writeAudit,
} from '@/lib/security';
import {
  healthMetricBatchSchema,
  healthMetricSchema,
  liveBalanceProgressSchema,
  liveBalanceResultSchema,
  liveGaitSnapshotBatchSchema,
  liveGaitSnapshotSchema,
  processedHealthDataSchema,
  type LiveBalanceResult,
  type LiveGaitSnapshot,
  type LiveGaitSnapshotBatch,
  type ProcessedHealthData,
} from '@/schemas/health';
import { summarizeGaitSnapshots } from '@/lib/liveGaitSummaries';
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
  const out: LiveGaitSnapshot[] = [];
  if (!kv.get) return out;
  for (const k of list.keys) {
    try {
      const raw = await kv.get(k.name);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as LiveGaitSnapshot;
      if (parsed && typeof parsed.capturedAt === 'string') out.push(parsed);
    } catch (e) {
      log.warn('kv_get_gait_failed', { error: (e as Error).message });
    }
  }
  return out;
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
  const out: LiveBalanceResult[] = [];
  if (!kv.get) return out;
  for (const k of list.keys) {
    try {
      const raw = await kv.get(k.name);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as LiveBalanceResult;
      if (parsed && typeof parsed.capturedAt === 'string') out.push(parsed);
    } catch (e) {
      log.warn('kv_get_balance_failed', { error: (e as Error).message });
    }
  }
  return out;
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

// ---------------------------------------------------------------------------
// Process raw health metrics with analytics
// ---------------------------------------------------------------------------

route.post('/api/health-data/process', async (c) => {
  const rlKey = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, `hd-process:${rlKey}`, 60)))
    return c.json({ error: 'rate_limited' }, 429);
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
    const historicalData = await getHistoricalData(
      c,
      parsed.data.type,
      parsed.data.userId
    );
    const processedData = await HealthDataProcessor.processHealthMetric(
      parsed.data,
      historicalData
    );
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
route.post('/api/health-data/batch', async (c) => {
  const rlKey = deriveRateLimitKey(c);
  if (!(await rateLimitDO(c, `hd-batch:${rlKey}`, 20)))
    return c.json({ error: 'rate_limited' }, 429);
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
    const results = await Promise.allSettled(
      parsed.data.metrics.map(async (metric) => {
        const historicalData = await getHistoricalData(
          c,
          metric.type,
          metric.userId
        );
        const processedData = await HealthDataProcessor.processHealthMetric(
          metric,
          historicalData
        );
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
        return processedData;
      })
    );
    const batchResults: ProcessedHealthData[] = [];
    const errors: string[] = [];
    for (let i = 0; i < results.length; i++) {
      const r = results[i];
      if (r.status === 'fulfilled') {
        batchResults.push(r.value);
      } else {
        errors.push(
          `${parsed.data.metrics[i].type}: ${r.reason instanceof Error ? r.reason.message : String(r.reason)}`
        );
      }
    }
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

// ---------------------------------------------------------------------------
// KV helpers for health data
// ---------------------------------------------------------------------------

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

// Health analytics summary
route.get('/api/health-data/analytics/:userId', async (c) => {
  const userId = c.req.param('userId');
  if (!userId) {
    return c.json({ error: 'user_id_required' }, 400);
  }

  // Demo bypass only in non-production
  const isProduction = c.env.ENVIRONMENT === 'production';
  if (!isProduction) {
    const referer = c.req.header('Referer') || '';
    const isDemoRequest =
      referer.includes('/demo') || c.req.header('X-Demo-Mode') === 'true';
    if (isDemoRequest && userId === 'demo-user-vitalsense') {
    const demoAnalytics = {
      totalDataPoints: 42,
      last24Hours: 8,
      last7Days: 42,
      averageHealthScore: 87.5,
      alerts: { critical: 0, warning: 1, total: 1 },
      fallRiskDistribution: { low: 40, moderate: 2, high: 0, critical: 0 },
      metricTypes: ['heart_rate', 'steps', 'sleep', 'blood_pressure'],
      dataQualityScore: 94.2,
      lastUpdated: new Date().toISOString(),
    };
    return c.json({ ok: true, analytics: demoAnalytics });
    }
  }

  // Ownership check: authenticated user can only access their own analytics
  const sub = await getVerifiedAuthSub(c);
  if (!sub || sub !== userId) {
    return c.json({ error: 'forbidden' }, 403);
  }

  try {
    const kv = c.env.HEALTH_KV;
    if (!kv || typeof kv.list !== 'function' || typeof kv.get !== 'function') {
      return c.json({ ok: true, analytics: null });
    }
    const encKeyB64 = c.env.ENC_KEY;
    const keyObj = encKeyB64 ? await getAesKey(encKeyB64) : null;
    const recentData = await fetchUserHealthData(kv, userId, keyObj);
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

// ---------------------------------------------------------------------------
// Historical data helper
// ---------------------------------------------------------------------------

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
    const listing = await kv.list({ prefix, limit: 30 });
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

// ---------------------------------------------------------------------------
// Health analytics calculator
// ---------------------------------------------------------------------------

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
  const warningAlerts = data.filter(
    (d) => d.alert?.level === 'warning'
  ).length;
  const fallRiskDistribution = {
    low: data.filter((d) => d.fallRisk === 'low').length,
    moderate: data.filter((d) => d.fallRisk === 'moderate').length,
    high: data.filter((d) => d.fallRisk === 'high').length,
    critical: data.filter((d) => d.fallRisk === 'critical').length,
  };
  const metricTypes = [...new Set(data.map((d) => d.type))];
  const dataQualityAverage =
    data.some((d) => d.dataQuality)
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

export { route as healthDataRoutes };
