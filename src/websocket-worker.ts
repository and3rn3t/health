// Simple test worker to deploy just the WebSocket functionality
import { Hono } from 'hono';
import { SimpleHealthWebSocket } from './SimpleHealthWebSocket';

interface Env {
  HEALTH_WEBSOCKET: DurableObjectNamespace;
}

const app = new Hono<{ Bindings: Env }>();

// Basic health check
app.get('/health', (c) => {
  return c.json({
    ok: true,
    service: 'VitalSense WebSocket Service',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// WebSocket endpoint
app.get('/ws', async (c) => {
  const upgradeHeader = c.req.header('upgrade');

  // If this is a probe (no upgrade) return metadata
  if (upgradeHeader !== 'websocket') {
    const host = new URL(c.req.url).host;
    const body = {
      ok: true,
      upgradeRequired: true,
      message: 'Use WebSocket upgrade to establish a realtime session',
      url: `${c.req.url.startsWith('https') ? 'wss' : 'ws'}://${host}/ws`,
      supportedMessageTypes: [
        'connection_established',
        'ping',
        'pong',
        'error',
      ],
      timestamp: new Date().toISOString(),
    };
    return c.json(body, 200);
  }

  if (!c.env.HEALTH_WEBSOCKET) {
    return c.text('WebSocket service not available', 503);
  }

  try {
    const id = c.env.HEALTH_WEBSOCKET.newUniqueId();
    const obj = c.env.HEALTH_WEBSOCKET.get(id);
    return obj.fetch(c.req.raw);
  } catch (error) {
    console.error('WebSocket handler error:', error);
    return c.text(
      `WebSocket error: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
});

export default app;
export { SimpleHealthWebSocket as HealthWebSocket };
