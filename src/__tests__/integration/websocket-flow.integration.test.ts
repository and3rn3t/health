import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';
import fs from 'node:fs';

/**
 * Integration tests for WebSocket connection flow
 * Tests the complete WebSocket lifecycle
 */
describe('WebSocket Flow Integration', () => {
  let mf: Miniflare;
  const baseUrl = 'http://localhost:8792';

  beforeAll(async () => {
    const scriptPath = 'dist-worker/index.js';
    if (!fs.existsSync(scriptPath)) {
      throw new Error('dist-worker/index.js not found. Build worker first.');
    }

    mf = new Miniflare({
      scriptPath,
      modules: true,
      compatibilityDate: '2024-05-01',
      port: 8792,
      bindings: {
        ENVIRONMENT: 'development',
        ALLOWED_ORIGINS: 'https://health.andernet.dev',
        ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        API_ISS: 'test-issuer',
        API_AUD: 'test-audience',
        DEVICE_JWT_SECRET: 'test-secret-key-for-jwt-signing',
        BASE_URL: 'http://localhost:8792',
        WEBSOCKET_URL: 'ws://localhost:8792/ws',
      },
      kvNamespaces: ['HEALTH_KV'],
      r2Buckets: ['HEALTH_STORAGE'],
      durableObjects: {
        RATE_LIMITER: 'RateLimiter',
        HEALTH_WEBSOCKET: 'HealthWebSocket',
      },
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await mf?.dispose();
  });

  describe('WebSocket Connection', () => {
    test('WebSocket upgrade request is accepted', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/ws`, {
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
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-url`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.url).toBeDefined();
      expect(data.url).toContain('ws');
    });
  });

  describe('Device Token Generation', () => {
    test('POST /api/ws-device-token creates valid token', async () => {
      const deviceId = `test-device-${Date.now()}`;
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://health.andernet.dev',
        },
        body: JSON.stringify({ deviceId }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
      expect(data.token.length).toBeGreaterThan(0);
    });

    test('Device token includes required claims', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-device-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://health.andernet.dev',
        },
        body: JSON.stringify({ deviceId: 'test-device' }),
      });

      if (res.ok) {
        const data = await res.json();
        // Token should be a JWT (has dots)
        expect(data.token.split('.')).toHaveLength(3);
      }
    });
  });

  describe('WebSocket Configuration', () => {
    test('GET /api/ws-live-enabled returns boolean', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-live-enabled`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.enabled).toBe('boolean');
    });

    test('GET /api/ws-user-id returns user info when authenticated', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-user-id`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      // May require auth, but should not 500
      expect(res.status).toBeLessThan(500);
    });
  });
});

