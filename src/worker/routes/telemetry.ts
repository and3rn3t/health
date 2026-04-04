import { Hono } from 'hono';
import { z } from 'zod';
import { normalizeBatch } from '@/sensors/lidar/normalize';
import {
  broadcastUserLiveEvent,
  getAuthSub,
  log,
  pushVersionMismatch,
  rateLimitDO,
  shouldSampleWithKey,
  VERSION_MISMATCH_BUFFER_SIZE,
  versionMismatchBuffer,
  versionMismatchIngestSchema,
  writeAnalyticsPoint,
} from '../helpers';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// Synthetic / RUM performance metrics ingestion (anonymized + sampled)
route.post('/api/_perf_ingest', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0';
    if (!(await rateLimitDO(c, `perf:${ip}`, 30, 60_000))) {
      return c.json({ ok: false, error: 'rate_limited' }, 429);
    }
    const raw: unknown = await c.req.json().catch(() => ({}));
    if (!raw || typeof raw !== 'object') {
      return c.json({ ok: false, error: 'invalid_payload' }, 400);
    }
    const rObj = raw as Record<string, unknown> & {
      metrics?: Record<string, unknown>;
    };
    const candidate =
      rObj.metrics && typeof rObj.metrics === 'object' ? rObj.metrics : rObj;
    const numeric = (v: unknown) =>
      typeof v === 'number' && Number.isFinite(v) && v >= 0 && v < 120_000;
    const allowed = ['lcp', 'ttfb', 'hydration', 'wsConnect', 'cls', 'inp'];
    const clean: Record<string, number> = {};
    for (const k of allowed) {
      const val = candidate[k];
      if (numeric(val)) clean[k] = Number(val);
    }
    if (Object.keys(clean).length === 0) {
      return c.json({ ok: false, error: 'no_metrics' }, 400);
    }
    const rumVersion = (raw as Record<string, unknown>).v;
    const appVersionRaw = (raw as Record<string, unknown>).appVersion;
    const record = {
      v: typeof rumVersion === 'number' ? rumVersion : 1,
      ts: Date.now(),
      appVersion:
        typeof appVersionRaw === 'string' ? appVersionRaw : 'unknown',
      metrics: clean,
      env: c.env.ENVIRONMENT || 'dev',
    };
    try {
      if (c.env.PERFORMANCE_ANALYTICS) {
        c.env.PERFORMANCE_ANALYTICS.writeDataPoint({
          blobs: [record.appVersion],
          doubles: [
            clean.lcp ?? -1,
            clean.ttfb ?? -1,
            clean.hydration ?? -1,
            clean.wsConnect ?? -1,
            -1,
            -1,
          ],
          indexes: [record.env],
        });
      }
    } catch {
      // swallow analytics errors
    }
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false, error: 'server_error' }, 500);
  }
});

// LiDAR derived metrics ingestion
route.post('/api/lidar/ingest', async (c) => {
  try {
    const ip = c.req.header('CF-Connecting-IP') || '0.0.0.0';
    if (!(await rateLimitDO(c, `lidar:${ip}`, 60, 60_000))) {
      return c.json({ ok: false, error: 'rate_limited' }, 429);
    }
    const raw = (await c.req.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const framesRaw = raw.frames || [];
    const frames = normalizeBatch(framesRaw as unknown[]);
    if (frames.length === 0)
      return c.json({ ok: false, error: 'no_valid_frames' }, 400);
    const last = frames.at(-1)!;
    const userId = getAuthSub(c);
    if (userId) {
      await broadcastUserLiveEvent(c, userId, {
        type: 'lidar_metrics',
        ts: last.ts,
        ...last.metrics,
      });
    }
    try {
      const ds =
        c.env.PERFORMANCE_ANALYTICS ||
        c.env.ANALYTICS ||
        c.env.HEALTH_ANALYTICS;
      if (ds) {
        const m = last.metrics;
        const ingestInterval =
          frames.length > 1 ? last.ts - frames[0].ts : -1;
        ds.writeDataPoint({
          blobs: [c.env.ENVIRONMENT || 'dev', 'lidar_ingest'],
          doubles: [-1, -1, -1, -1, ingestInterval >= 0 ? ingestInterval : -1, m.obstacle_distance_min ?? -1],
        });
      }
    } catch {
      /* ignore analytics failure */
    }
    return c.json({ ok: true, frames: frames.length });
  } catch {
    return c.json({ ok: false, error: 'ingest_failed' }, 500);
  }
});

// Client analytics: version mismatch ingestion
route.post('/api/client-analytics/version-mismatch', async (c) => {
  try {
    const raw = await c.req.json().catch(() => ({}));
    const parsed = versionMismatchIngestSchema.safeParse(raw);
    if (!parsed.success) {
      return c.json({ ok: false, error: 'invalid_payload' }, 400);
    }
    const body = parsed.data;
    const ts = body.ts || new Date().toISOString();
    const rec = {
      gaitLocal: body.gaitLocal ?? null,
      gaitRemote: body.gaitRemote ?? null,
      fallLocal: body.fallLocal ?? null,
      fallRemote: body.fallRemote ?? null,
      ts,
      sample: body.sample,
      seq: body.seq,
    };
    if (c.env.ENVIRONMENT !== 'production') {
      pushVersionMismatch(rec);
    }
    try {
      const ds =
        c.env.SECURITY_ANALYTICS ||
        c.env.ANALYTICS ||
        c.env.PERFORMANCE_ANALYTICS;
      if (ds) {
        ds.writeDataPoint({
          blobs: [
            c.env.ENVIRONMENT || 'development',
            'version_mismatch',
            rec.gaitLocal || '',
            rec.gaitRemote || '',
            rec.fallLocal || '',
            rec.fallRemote || '',
            typeof rec.sample === 'number' ? String(rec.sample) : '',
            typeof rec.seq === 'number' ? String(rec.seq) : '',
          ],
          doubles: [],
        });
      }
    } catch {
      /* ignore */
    }
    return c.json({ ok: true });
  } catch {
    return c.json({ ok: false, error: 'server_error' }, 400);
  }
});

// Debug: recent mismatch events (non-production)
route.get('/api/_debug/version-mismatch-events', (c) => {
  if (c.env.ENVIRONMENT === 'production') {
    return c.json({ error: 'not_available' }, 404);
  }
  return c.json({
    ok: true,
    events: versionMismatchBuffer.slice(-VERSION_MISMATCH_BUFFER_SIZE),
  });
});

// Client-side error telemetry
route.post('/api/client-error', async (c) => {
  try {
    const schema = z.object({
      message: z.string().min(1).max(2000),
      source: z
        .enum(['window.onerror', 'unhandledrejection', 'console.error'])
        .default('window.onerror'),
      route: z.string().max(512).optional(),
      sessionId: z.string().max(128).optional(),
      ua: z.string().max(512).optional(),
      stack: z.string().max(4000).optional(),
      meta: z.record(z.any()).optional(),
    });
    const body = await c.req.json().catch(() => null as unknown);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: 'validation_error', details: parsed.error.flatten() },
        400
      );
    }
    const data = parsed.data;
    const path = new URL(c.req.url).pathname;
    const correlationId = crypto.randomUUID();
    const durMs = 0;
    const sub = getAuthSub(c);

    if (shouldSampleWithKey(c, 'LOG_CLIENT_ERROR_SAMPLE_RATE')) {
      writeAnalyticsPoint(
        c,
        [
          c.env.ENVIRONMENT || 'development',
          path,
          'POST',
          '0',
          sub ? '1' : '0',
          correlationId,
          'client_error',
          data.source,
        ],
        [durMs]
      );
    }

    const { writeAudit } = await import('@/lib/security');
    await writeAudit(c.env, {
      type: 'client_error',
      resource: data.route || 'app',
      actor: sub ?? undefined,
      meta: {
        correlationId,
        message: data.message.slice(0, 256),
        source: data.source,
      },
    }).catch(() => void 0);

    return c.json({ ok: true, correlationId });
  } catch (err) {
    try {
      log.error('client_error_endpoint_failure', {
        error: (err as Error).message,
      });
    } catch {
      /* noop */
    }
    return c.json({ error: 'server_error' }, 500);
  }
});

// WebSocket telemetry ingestion (client-reported)
route.post('/api/ws-telemetry', async (c) => {
  try {
    const schema = z.object({
      event: z.enum([
        'connect_start',
        'connect_success',
        'connect_error',
        'close',
        'retry',
        'ping_timeout',
        'pong_received',
        'message_error',
      ]),
      url: z.string().max(2048).optional(),
      attempt: z.number().int().min(0).max(100).optional(),
      code: z.number().int().min(0).max(6000).optional(),
      reason: z.string().max(500).optional(),
      backoffMs: z.number().int().min(0).max(600000).optional(),
      sinceMs: z.number().int().min(0).max(600000).optional(),
      rttMs: z.number().int().min(0).max(120000).optional(),
      readyState: z.number().int().min(0).max(3).optional(),
    });
    const body = await c.req.json().catch(() => null as unknown);
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return c.json(
        { error: 'validation_error', details: parsed.error.flatten() },
        400
      );
    }
    const data = parsed.data;
    const env = c.env.ENVIRONMENT || 'development';
    const sub = getAuthSub(c);
    const correlationId = crypto.randomUUID();

    if (shouldSampleWithKey(c, 'LOG_WS_SAMPLE_RATE')) {
      writeAnalyticsPoint(
        c,
        [
          env,
          '/api/ws-telemetry',
          'POST',
          '0',
          sub ? '1' : '0',
          correlationId,
          'ws_telemetry',
          data.event,
          String(data.code ?? ''),
        ],
        [
          data.backoffMs ?? 0,
          data.rttMs ?? 0,
          data.sinceMs ?? 0,
          data.attempt ?? 0,
        ]
      );
    }

    if (
      data.event === 'connect_error' ||
      data.event === 'ping_timeout' ||
      (data.event === 'close' && (data.code ?? 1000) !== 1000)
    ) {
      const { writeAudit } = await import('@/lib/security');
      await writeAudit(c.env, {
        type: 'ws_event',
        resource: 'client_ws',
        actor: sub ?? undefined,
        meta: {
          event: data.event,
          code: data.code,
          reason: data.reason,
          attempt: data.attempt,
        },
      }).catch(() => void 0);
    }

    return c.json({ ok: true, correlationId });
  } catch (err) {
    try {
      log.error('ws_telemetry_failure', { error: (err as Error).message });
    } catch {
      /* noop */
    }
    return c.json({ error: 'server_error' }, 500);
  }
});

// WebSocket configuration endpoints
route.get('/api/ws-url', (c) => {
  const protocol = c.req.url.startsWith('https') ? 'wss' : 'ws';
  const host = new URL(c.req.url).host;
  return c.json({
    url: `${protocol}://${host}/ws`,
    fallback: c.env.WEBSOCKET_URL || `${protocol}://${host}/ws`,
  });
});

route.get('/api/ws-device-token', (c) => {
  const referer = c.req.header('Referer') || '';
  if (referer.includes('/demo')) {
    return c.json({ token: 'demo-device-token' }); // NOSONAR
  }
  return c.json({ token: 'device-token-placeholder' }); // NOSONAR
});

route.get('/api/ws-user-id', (c) => {
  const referer = c.req.header('Referer') || '';
  if (referer.includes('/demo')) {
    return c.json({ userId: 'demo-user-vitalsense' });
  }
  return c.json({ userId: 'user-id-placeholder' });
});

route.get('/api/ws-live-enabled', (c) => {
  return c.json({ enabled: true });
});

export { route as telemetryRoutes };
