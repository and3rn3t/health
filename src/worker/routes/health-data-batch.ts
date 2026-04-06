/**
 * Health data processing routes (single + batch).
 *
 * Endpoints:
 *  POST /api/health-data/process
 *  POST /api/health-data/batch
 */
import { HealthDataProcessor } from '@/lib/enhancedHealthProcessor';
import { getTtlSecondsForType } from '@/lib/retention';
import { encryptJSON, getAesKey, writeAudit } from '@/lib/security';
import {
  healthMetricBatchSchema,
  healthMetricSchema,
  type ProcessedHealthData,
} from '@/schemas/health';
import { Hono } from 'hono';
import { deriveRateLimitKey, log, rateLimitDO } from '../helpers';
import type { Env } from '../types';
import { getHistoricalData } from './health-data-analytics';

const route = new Hono<{ Bindings: Env }>();

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

export { route as batchRoutes };
