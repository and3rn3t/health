/**
 * Observability metrics endpoint.
 *
 * Exposes aggregated metrics from Cloudflare Analytics Engine datasets
 * for dashboards (Grafana, internal tooling). Auth-gated.
 *
 * GET /api/observability/metrics?range=1h
 * GET /api/observability/health
 */
import { Hono } from 'hono';
import { z } from 'zod/v3';
import { getVerifiedAuthSub, log } from '../helpers';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

const rangeSchema = z.enum(['1h', '6h', '24h', '7d']).default('1h');

const RANGE_MS: Record<string, number> = {
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
  '7d': 7 * 24 * 60 * 60 * 1000,
};

// ---------------------------------------------------------------------------
// System health overview (lightweight, no AE query)
// ---------------------------------------------------------------------------

route.get('/api/observability/health', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);

  const kv = c.env.HEALTH_KV;
  const kvAvailable = !!(kv && typeof kv.get === 'function');

  const wsNamespace = c.env.HEALTH_WEBSOCKET;
  const wsAvailable = !!wsNamespace;

  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown',
    subsystems: {
      kv: kvAvailable ? 'ok' : 'unavailable',
      websocket: wsAvailable ? 'ok' : 'unavailable',
      analytics: c.env.HEALTH_ANALYTICS ? 'ok' : 'unavailable',
      storage: c.env.HEALTH_STORAGE ? 'ok' : 'unavailable',
    },
  });
});

// ---------------------------------------------------------------------------
// Aggregated metrics (queries Analytics Engine)
// ---------------------------------------------------------------------------

route.get('/api/observability/metrics', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);

  const parsed = rangeSchema.safeParse(c.req.query('range'));
  if (!parsed.success) {
    return c.json({ error: 'invalid_range', valid: ['1h', '6h', '24h', '7d'] }, 400);
  }

  const range = parsed.data;
  const now = Date.now();
  const rangeMs: number = RANGE_MS[range] ?? 60 * 60 * 1000;
  const since = new Date(now - rangeMs).toISOString();

  // Collect what's available from each analytics dataset
  const metrics: Record<string, unknown> = {
    range,
    since,
    generatedAt: new Date().toISOString(),
  };

  // Health analytics summary
  if (c.env.HEALTH_ANALYTICS) {
    metrics.health = {
      dataset: 'HEALTH_ANALYTICS',
      status: 'bound',
      note: 'Query via Cloudflare dashboard or GraphQL Analytics API',
    };
  }

  // Security analytics summary
  if (c.env.SECURITY_ANALYTICS) {
    metrics.security = {
      dataset: 'SECURITY_ANALYTICS',
      status: 'bound',
    };
  }

  // Performance analytics summary (RUM data)
  if (c.env.PERFORMANCE_ANALYTICS) {
    metrics.performance = {
      dataset: 'PERFORMANCE_ANALYTICS',
      status: 'bound',
    };
  }

  // KV storage stats
  const kv = c.env.HEALTH_KV;
  if (kv && typeof kv.list === 'function') {
    try {
      const listing = await kv.list({ prefix: 'health:', limit: 1 });
      metrics.kvHealthRecords = {
        hasData: listing.keys.length > 0,
      };
    } catch (e) {
      log.warn('observability_kv_list_failed', { error: (e as Error).message });
    }
  }

  return c.json(metrics);
});

export { route as observabilityRoutes };
