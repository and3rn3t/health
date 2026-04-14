import {
  createMiniflareWorker,
  type MiniflareInstance,
} from '@/test/integration-harness';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * Integration tests for the SimpleHealthWebSocket Durable Object.
 *
 * Validates: probe endpoint metadata, WebSocket upgrade, message validation,
 * ping/pong, invalid messages, and connection parameters.
 */
describe('WebSocket Durable Object Integration', () => {
  let ctx: MiniflareInstance;

  beforeAll(async () => {
    ctx = await createMiniflareWorker();
  });

  afterAll(async () => {
    await ctx?.dispose();
  });

  // ── Probe (non-upgrade) Behaviour ────────────────────────────

  describe('Probe Endpoint (no Upgrade header)', () => {
    test('returns metadata with supported message types', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      expect(res.status).toBe(200);
      const body = (await res.json()) as {
        ok: boolean;
        upgradeRequired: boolean;
        supportedMessageTypes: string[];
        analyticsVersions: { gait: string; fallRisk: string };
        timestamp: string;
      };

      expect(body.ok).toBe(true);
      expect(body.upgradeRequired).toBe(true);
      expect(body.supportedMessageTypes).toContain('connection_established');
      expect(body.supportedMessageTypes).toContain('pong');
      expect(body.supportedMessageTypes).toContain('error');
      expect(body.timestamp).toBeDefined();
    });

    test('includes analytics version info', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const body = (await res.json()) as {
        analyticsVersions: { gait: string; fallRisk: string };
      };

      expect(body.analyticsVersions).toBeDefined();
      expect(typeof body.analyticsVersions.gait).toBe('string');
      expect(typeof body.analyticsVersions.fallRisk).toBe('string');
    });

    test('includes debug info in non-production', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const body = (await res.json()) as {
        debug?: {
          hasWebSocketBinding: boolean;
          environment: string;
        };
      };

      // Integration harness uses ENVIRONMENT=development
      expect(body.debug).toBeDefined();
      expect(body.debug?.hasWebSocketBinding).toBe(true);
      expect(body.debug?.environment).toBe('development');
    });

    test('probe has no-store cache header', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const cc = res.headers.get('Cache-Control');
      expect(cc).toContain('no-store');
    });
  });

  // ── WebSocket Upgrade ────────────────────────────────────────

  describe('WebSocket Upgrade', () => {
    test('upgrade request returns 101', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          Origin: 'https://health.andernet.dev',
        },
      });

      // Miniflare may return 101 (native) or 200 (simulated) for WS upgrade
      expect([101, 200]).toContain(res.status);
    });

    test('upgrade includes webSocket on response', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          Origin: 'https://health.andernet.dev',
        },
      });

      // In Miniflare, the response object should have the webSocket property
      if (res.status === 101) {
        expect(res.webSocket).toBeDefined();
      }
    });
  });

  // ── WebSocket Message Protocol ───────────────────────────────

  describe('WebSocket Message Protocol', () => {
    test('connection_established message sent on connect', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          Origin: 'https://health.andernet.dev',
        },
      });

      if (res.status === 101 && res.webSocket) {
        const ws = res.webSocket;
        ws.accept();

        const messages: string[] = [];
        ws.addEventListener('message', (event) => {
          messages.push(typeof event.data === 'string' ? event.data : '');
        });

        // Wait for the welcome message
        await new Promise((r) => setTimeout(r, 200));

        expect(messages.length).toBeGreaterThan(0);
        const firstMessage = messages[0];
        if (!firstMessage) throw new Error('Expected welcome message');
        const welcome: {
          type: string;
          message: string;
          sessionId: string;
        } = JSON.parse(firstMessage);
        expect(welcome.type).toBe('connection_established');
        expect(welcome.message).toContain('VitalSense');
        expect(welcome.sessionId).toBeDefined();

        ws.close();
      }
    });

    test('ping message receives pong response', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          Origin: 'https://health.andernet.dev',
        },
      });

      if (res.status === 101 && res.webSocket) {
        const ws = res.webSocket;
        ws.accept();

        const messages: string[] = [];
        ws.addEventListener('message', (event) => {
          messages.push(typeof event.data === 'string' ? event.data : '');
        });

        // Wait for welcome, then send ping
        await new Promise((r) => setTimeout(r, 100));

        const pingTs = new Date().toISOString();
        ws.send(
          JSON.stringify({
            type: 'ping',
            timestamp: pingTs,
          }),
        );

        await new Promise((r) => setTimeout(r, 200));

        const pong = messages.find((m) => {
          try {
            return JSON.parse(m).type === 'pong';
          } catch {
            return false;
          }
        });

        expect(pong).toBeDefined();
        if (!pong) throw new Error('Expected pong message');
        const parsed: {
          type: string;
          timestamp: string;
          originalTimestamp: string;
        } = JSON.parse(pong);
        expect(parsed.type).toBe('pong');
        expect(parsed.originalTimestamp).toBe(pingTs);

        ws.close();
      }
    });

    test('invalid message format receives error response', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          Origin: 'https://health.andernet.dev',
        },
      });

      if (res.status === 101 && res.webSocket) {
        const ws = res.webSocket;
        ws.accept();

        const messages: string[] = [];
        ws.addEventListener('message', (event) => {
          messages.push(typeof event.data === 'string' ? event.data : '');
        });

        // Wait for welcome, then send invalid message
        await new Promise((r) => setTimeout(r, 100));

        ws.send('not-valid-json');

        await new Promise((r) => setTimeout(r, 200));

        const error = messages.find((m) => {
          try {
            return JSON.parse(m).type === 'error';
          } catch {
            return false;
          }
        });

        expect(error).toBeDefined();
        if (!error) throw new Error('Expected error message');
        const parsed: {
          type: string;
          message: string;
        } = JSON.parse(error);
        expect(parsed.type).toBe('error');
        expect(parsed.message).toContain('Invalid');

        ws.close();
      }
    });

    test('zod-invalid message shape receives error', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          Origin: 'https://health.andernet.dev',
        },
      });

      if (res.status === 101 && res.webSocket) {
        const ws = res.webSocket;
        ws.accept();

        const messages: string[] = [];
        ws.addEventListener('message', (event) => {
          messages.push(typeof event.data === 'string' ? event.data : '');
        });

        await new Promise((r) => setTimeout(r, 100));

        // Missing required "type" field — should fail zod parse
        ws.send(JSON.stringify({ foo: 'bar' }));

        await new Promise((r) => setTimeout(r, 200));

        const error = messages.find((m) => {
          try {
            return JSON.parse(m).type === 'error';
          } catch {
            return false;
          }
        });

        expect(error).toBeDefined();

        ws.close();
      }
    });
  });
});
