/**
 * Health analytics & historical data helpers.
 *
 * Endpoints:
 *  GET /api/health-data/analytics/:userId
 *
 * Exported helpers (used by other route files):
 *  - parseKVData
 *  - getHistoricalData
 */
import { Hono, type Context } from 'hono';
import { generateDemoHealthData } from '@/lib/demo-data';
import { decryptJSON, getAesKey } from '@/lib/security';
import {
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
// KV helpers for health data
// ---------------------------------------------------------------------------

export async function parseKVData(
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

  // Batch KV reads with concurrency limit to avoid N+1 pattern
  const CONCURRENCY = 5;
  const allResults: (ProcessedHealthData | null)[] = [];
  for (let i = 0; i < listing.keys.length; i += CONCURRENCY) {
    const batch = listing.keys.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(
      batch.map(async (k) => {
        const raw = await kv.get!(k.name);
        if (!raw) return null;
        const objUnknown = await parseKVData(raw, keyObj);
        if (!objUnknown) return null;
        const parsedRow = processedHealthDataSchema.safeParse(objUnknown);
        if (!parsedRow.success) return null;
        return parsedRow.data.source.userId === userId ? parsedRow.data : null;
      })
    );
    for (const r of results) {
      allResults.push(r.status === 'fulfilled' ? r.value : null);
    }
  }
  return allResults.filter((v): v is ProcessedHealthData => v !== null);
}

// ---------------------------------------------------------------------------
// Historical data helper (exported for use by batch routes)
// ---------------------------------------------------------------------------

export async function getHistoricalData(
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

    // Batch KV reads with concurrency limit
    const CONCURRENCY = 5;
    const allResults: (ProcessedHealthData | null)[] = [];
    for (let i = 0; i < listing.keys.length; i += CONCURRENCY) {
      const batch = listing.keys.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        batch.map(async (k) => {
          const raw = await kv.get!(k.name);
          if (!raw) return null;
          const objUnknown = await parseKVData(raw, keyObj);
          if (!objUnknown) return null;
          const parsedRow = processedHealthDataSchema.safeParse(objUnknown);
          if (!parsedRow.success) return null;
          return parsedRow.data.source.userId === userId ? parsedRow.data : null;
        })
      );
      for (const r of results) {
        allResults.push(r.status === 'fulfilled' ? r.value : null);
      }
    }
    const historicalData = allResults.filter((v): v is ProcessedHealthData => v !== null);
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

function accumulateMetric(
  d: ProcessedHealthData,
  acc: {
    last24h: number; last7d: number;
    healthScoreSum: number; healthScoreCount: number;
    criticalAlerts: number; warningAlerts: number;
    fallRisk: Record<string, number>;
    metricTypeSet: Set<string>;
    dqSum: number; dqCount: number;
    latestTime: number; latestProcessedAt: string | null;
  },
  now: number
) {
  const DAY_MS = 86_400_000;
  const age = now - new Date(d.processedAt).getTime();
  if (age < DAY_MS) acc.last24h++;
  if (age < 7 * DAY_MS) acc.last7d++;
  if (d.healthScore !== undefined) {
    acc.healthScoreSum += d.healthScore || 0;
    acc.healthScoreCount++;
  }
  if (d.alert?.level === 'critical') acc.criticalAlerts++;
  else if (d.alert?.level === 'warning') acc.warningAlerts++;
  if (d.fallRisk && d.fallRisk in acc.fallRisk) acc.fallRisk[d.fallRisk]++;
  acc.metricTypeSet.add(d.type);
  if (d.dataQuality) {
    acc.dqSum +=
      (d.dataQuality.completeness + d.dataQuality.accuracy +
       d.dataQuality.timeliness + d.dataQuality.consistency) / 4;
    acc.dqCount++;
  }
  const t = new Date(d.processedAt).getTime();
  if (t > acc.latestTime) {
    acc.latestTime = t;
    acc.latestProcessedAt = d.processedAt;
  }
}

function calculateHealthAnalytics(data: ProcessedHealthData[]) {
  const now = Date.now();
  const acc = {
    last24h: 0, last7d: 0,
    healthScoreSum: 0, healthScoreCount: 0,
    criticalAlerts: 0, warningAlerts: 0,
    fallRisk: { low: 0, moderate: 0, high: 0, critical: 0 } as Record<string, number>,
    metricTypeSet: new Set<string>(),
    dqSum: 0, dqCount: 0,
    latestTime: 0, latestProcessedAt: null as string | null,
  };

  for (const d of data) accumulateMetric(d, acc, now);

  const averageHealthScore =
    acc.healthScoreCount > 0 ? acc.healthScoreSum / acc.healthScoreCount : 0;

  return {
    totalDataPoints: data.length,
    last24Hours: acc.last24h,
    last7Days: acc.last7d,
    averageHealthScore: Math.round(averageHealthScore * 10) / 10,
    alerts: {
      critical: acc.criticalAlerts,
      warning: acc.warningAlerts,
      total: acc.criticalAlerts + acc.warningAlerts,
    },
    fallRiskDistribution: acc.fallRisk,
    metricTypes: [...acc.metricTypeSet],
    dataQualityScore:
      acc.dqCount > 0 ? Math.round((acc.dqSum / acc.dqCount) * 10) / 10 : 0,
    lastUpdated: acc.latestProcessedAt,
  };
}

// ---------------------------------------------------------------------------
// Health analytics summary route
// ---------------------------------------------------------------------------

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
    const res = c.json({ ok: true, analytics });
    res.headers.set('Cache-Control', 'private, max-age=60');
    return res;
  } catch (error) {
    log.error('Analytics calculation failed', {
      error: (error as Error).message,
      userId,
    });
    return c.json({ error: 'analytics_failed' }, 500);
  }
});

export { route as analyticsRoutes };
