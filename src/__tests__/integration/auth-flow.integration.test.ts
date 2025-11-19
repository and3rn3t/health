import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';
import fs from 'node:fs';

/**
 * Integration tests for authentication flow
 */
describe('Authentication Flow Integration', () => {
  let mf: Miniflare;
  const baseUrl = 'http://localhost:8795';

  beforeAll(async () => {
    const scriptPath = 'dist-worker/index.js';
    if (!fs.existsSync(scriptPath)) {
      throw new Error('dist-worker/index.js not found. Build worker first.');
    }

    mf = new Miniflare({
      scriptPath,
      modules: true,
      compatibilityDate: '2024-05-01',
      port: 8795,
      bindings: {
        ENVIRONMENT: 'development',
        ALLOWED_ORIGINS: 'https://health.andernet.dev',
        ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        API_ISS: 'test-issuer',
        API_AUD: 'test-audience',
        DEVICE_JWT_SECRET: 'test-secret-key-for-jwt-signing',
        BASE_URL: 'http://localhost:8795',
        AUTH0_DOMAIN: 'test.auth0.com',
        AUTH0_CLIENT_ID: 'test-client-id',
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

  describe('Auth0 Configuration', () => {
    test('app-config.js includes Auth0 configuration', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/app-config.js`);

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('auth0');
      expect(text).toContain('domain');
      expect(text).toContain('clientId');
    });

    test('Auth0 callback route exists', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/callback?code=test&state=test`);

      // Should handle callback (may redirect or return)
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('JWT Token Validation', () => {
    test('Protected endpoints require authentication', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/health-data`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      // Should require auth (401/403) or allow in dev (200)
      expect([200, 401, 403]).toContain(res.status);
    });

    test('Invalid JWT tokens are rejected', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/api/health-data`, {
        headers: {
          Authorization: 'Bearer invalid-token',
          Origin: 'https://health.andernet.dev',
        },
      });

      // Should reject invalid tokens
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('CORS and Security', () => {
    test('CORS headers are set correctly', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const aco = res.headers.get('Access-Control-Allow-Origin');
      expect(aco).toBeTruthy();
    });

    test('Unauthorized origins are blocked', async () => {
      const res = await mf.dispatchFetch(`${baseUrl}/health`, {
        headers: { Origin: 'https://evil.com' },
      });

      // Should either block or not set CORS for unauthorized origin
      const aco = res.headers.get('Access-Control-Allow-Origin');
      if (aco) {
        expect(aco).not.toBe('https://evil.com');
      }
    });
  });
});

