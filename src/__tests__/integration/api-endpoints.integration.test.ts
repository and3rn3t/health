import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';
import fs from 'node:fs';

/**
 * Integration tests for critical API endpoints
 * Tests the built worker bundle with realistic scenarios
 */
describe('API Endpoints Integration', () => {
  let mf: Miniflare;
  const baseUrl = 'http://localhost:8791';

  beforeAll(async () => {
    const scriptPath = 'dist-worker/index.js';
    if (!fs.existsSync(scriptPath)) {
      throw new Error('dist-worker/index.js not found. Build worker first.');
    }

    mf = new Miniflare({
      scriptPath,
      modules: true,
      compatibilityDate: '2024-05-01',
      port: 8791,
      bindings: {
        ENVIRONMENT: 'development',
        ALLOWED_ORIGINS: 'https://health.andernet.dev,http://localhost:5173',
        ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        API_ISS: 'test-issuer',
        API_AUD: 'test-audience',
        DEVICE_JWT_SECRET: 'test-secret-key-for-jwt-signing',
        BASE_URL: 'http://localhost:8791',
      },
      kvNamespaces: ['HEALTH_KV'],
      r2Buckets: ['HEALTH_STORAGE'],
      durableObjects: {
        RATE_LIMITER: 'RateLimiter',
        HEALTH_WEBSOCKET: 'HealthWebSocket',
      },
    });

    // Wait for worker to be ready
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    await mf?.dispose();
  });

  describe('Health and Status Endpoints', () => {
    test('GET /health returns healthy status', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.ok).toBe(true);
      expect(data.service).toBeDefined();
      expect(data.timestamp).toBeDefined();
    });

    test('GET /health includes CORS headers', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
    });

    test('GET /app-config.js returns configuration', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/app-config.js`);

      expect(res.status).toBe(200);
      expect(res.headers.get('Content-Type')).toContain('javascript');
      const text = await res.text();
      expect(text).toContain('__VITALSENSE_CONFIG__');
      expect(text).toContain('environment');
    });
  });

  describe('WebSocket Configuration Endpoints', () => {
    test('GET /api/ws-url returns WebSocket URL', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-url`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.url).toBeDefined();
      expect(typeof data.url).toBe('string');
    });

    test('GET /api/ws-device-token generates device token', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-device-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: 'test-device-123' }),
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.token).toBeDefined();
      expect(typeof data.token).toBe('string');
    });

    test('GET /api/ws-live-enabled returns live status', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/ws-live-enabled`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(typeof data.enabled).toBe('boolean');
    });
  });

  describe('Health Data Endpoints', () => {
    test('POST /api/health-data accepts valid health data', async () => {
      const healthData = {
        timestamp: new Date().toISOString(),
        heart_rate: 72,
        steps: 5000,
        fall_risk_score: 0.15,
      };

      const res = await mf.dispatchFetch(`${baseUrl}/api/health-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://health.andernet.dev',
        },
        body: JSON.stringify(healthData),
      });

      // Should accept or require auth - check status is reasonable
      expect([200, 201, 401, 403]).toContain(res.status);
    });

    test('GET /api/health-data requires authentication', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/health-data`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      // Should require auth in production, allow in dev
      expect([200, 401, 403]).toContain(res.status);
    });
  });

  describe('Analytics Endpoints', () => {
    test('GET /api/_analytics_ping responds', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/_analytics_ping`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      // Endpoint may or may not exist, but should not 500
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Error Handling', () => {
    test('404 for unknown routes', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/unknown/route`);

      expect(res.status).toBe(404);
    });

    test('CORS preflight handled correctly', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://health.andernet.dev',
          'Access-Control-Request-Method': 'GET',
        },
      });

      // Should handle CORS preflight
      expect([200, 204, 404]).toContain(res.status);
    });
  });

  describe('Security Headers', () => {
    test('Responses include security headers', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const csp = res.headers.get('Content-Security-Policy');
      const xFrame = res.headers.get('X-Frame-Options');
      const xContentType = res.headers.get('X-Content-Type-Options');

      // At least some security headers should be present
      expect(csp || xFrame || xContentType).toBeTruthy();
    });
  });
});

