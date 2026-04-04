import { Hono } from 'hono';
import { GAIT_ANALYTICS_VERSION } from '@/lib/gaitConfig';
import { FALL_RISK_ANALYTICS_VERSION } from '@/lib/fallRiskConfig';
import { getAuthSub, log } from '../helpers';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// WebSocket endpoint for real-time health data
route.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('upgrade');

  // If this is a probe (no upgrade) return metadata instead of 426 to aid health checks & test runner.
  if (upgradeHeader !== 'websocket') {
    const host = new URL(c.req.url).host;
    const body = {
      ok: true,
      upgradeRequired: true,
      message: 'Use WebSocket upgrade to establish a realtime session',
      url: `${c.req.url.startsWith('https') ? 'wss' : 'ws'}://${host}/ws`,
      supportedMessageTypes: [
        'connection_established',
        'live_health_update',
        'historical_data_update',
        'client_presence',
        'pong',
        'error',
      ],
      // Surface current analytics config versions so clients can decide whether to re-fetch static config artifacts
      analyticsVersions: {
        gait: GAIT_ANALYTICS_VERSION,
        fallRisk: FALL_RISK_ANALYTICS_VERSION,
      },
      timestamp: new Date().toISOString(),
      // Debug info
      debug: {
        hasWebSocketBinding: !!c.env.HEALTH_WEBSOCKET,
        environment: c.env.ENVIRONMENT,
        webSocketPairAvailable: typeof WebSocketPair !== 'undefined',
      },
    };
    const res = c.json(body, 200);
    // Strengthen caching semantics: this is informational & near-real-time (contains timestamp) so disable caching
    res.headers.set('Cache-Control', 'no-store, max-age=0');
    return res;
  }

  log.info('WebSocket upgrade request received');

  if (!c.env.HEALTH_WEBSOCKET) {
    log.warn('HEALTH_WEBSOCKET binding not available');
    return c.text('WebSocket service not available', 503);
  }

  try {
    // Authenticate: require a valid sub in production, fall back to IP for non-prod
    const sub = getAuthSub(c);
    const isProduction = c.env.ENVIRONMENT === 'production';
    if (isProduction && !sub) {
      return c.text('Unauthorized – provide a valid Bearer token', 401);
    }
    const identity = sub || c.req.header('CF-Connecting-IP') || 'anon';

    log.info('Creating Durable Object instance');
    const id = c.env.HEALTH_WEBSOCKET.idFromName(identity);
    log.info('Durable Object ID created', { id: id.toString() });

    const obj = c.env.HEALTH_WEBSOCKET.get(id);
    log.info('Durable Object instance obtained');

    log.info('Forwarding request to Durable Object');
    const response = await obj.fetch(c.req.raw);
    log.info('Response received from Durable Object', {
      status: response.status,
    });

    return response;
  } catch (error) {
    log.error('Error in WebSocket handler', {
      error: error instanceof Error ? error.message : String(error),
    });
    return c.text(
      `WebSocket error: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
});

export { route as wsRoutes };
