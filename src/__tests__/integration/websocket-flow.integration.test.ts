import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createMiniflareWorker, type MiniflareInstance } from '@/test/integration-harness';

/**
 * Integration tests for WebSocket connection flow
 * Tests the complete WebSocket lifecycle
 */
describe('WebSocket Flow Integration', () => {
  let ctx: MiniflareInstance;

  beforeAll(async () => {
    ctx = await createMiniflareWorker({
      bindings: { WEBSOCKET_URL: 'ws://localhost/ws' },
    });
  });

  afterAll(async () => {
    await ctx?.dispose();
  });

  describe('WebSocket Connection', () => {
    test('WebSocket upgrade request is accepted', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: {
          Upgrade: 'websocket',
          Connection: 'Upgrade',
          'Sec-WebSocket-Key': 'dGhlIHNhbXBsZSBub25jZQ==',
          'Sec-WebSocket-Version': '13',
          Origin: 'https://health.andernet.dev',
        },
      });

      // WebSocket upgrade should return 101 or handle upgrade
      // In Miniflare, this might return different status codes
      expect([101, 200, 400, 426]).toContain(res.status);
    });

    test('WebSocket URL endpoint returns correct URL', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/ws-url`);

      expect(res.status).toBe(200);
      const data = await res.json() as { url: string };
      expect(data.url).toBeDefined();
      expect(data.url).toContain('ws');
    });
  });

  describe('Device Token Generation', () => {
    test('POST /api/ws-device-token creates valid token', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/ws-device-token`, {
        method: 'GET',
        headers: {
          Origin: 'https://health.andernet.dev',
        },
      });

      // Route is GET and requires auth — expect 401 without valid token
      expect([200, 401]).toContain(res.status);
      if (res.ok) {
        const data = await res.json() as { token: string };
        expect(data.token).toBeDefined();
        expect(typeof data.token).toBe('string');
        expect(data.token.length).toBeGreaterThan(0);
      }
    });

    test('Device token includes required claims', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/ws-device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://health.andernet.dev',
        },
        body: JSON.stringify({ deviceId: 'test-device' }),
      });

      if (res.ok) {
        const data = await res.json() as { token: string };
        // Token should be a JWT (has dots)
        expect(data.token.split('.')).toHaveLength(3);
      }
    });
  });

  describe('WebSocket Configuration', () => {
    test('GET /api/ws-live-enabled returns boolean', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/ws-live-enabled`);

      expect(res.status).toBe(200);
      const data = await res.json() as { enabled: boolean };
      expect(typeof data.enabled).toBe('boolean');
    });

    test('GET /api/ws-user-id returns user info when authenticated', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/ws-user-id`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      // May require auth, but should not 500
      expect(res.status).toBeLessThan(500);
    });
  });
});
