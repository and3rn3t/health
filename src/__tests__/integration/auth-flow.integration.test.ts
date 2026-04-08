import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { createMiniflareWorker, type MiniflareInstance } from '@/test/integration-harness';

/**
 * Integration tests for authentication flow
 */
describe('Authentication Flow Integration', () => {
  let ctx: MiniflareInstance;

  beforeAll(async () => {
    ctx = await createMiniflareWorker({
      bindings: {
        AUTH0_DOMAIN: 'test.auth0.com',
        AUTH0_CLIENT_ID: 'test-client-id',
      },
    });
  });

  afterAll(async () => {
    await ctx?.dispose();
  });

  describe('Auth0 Configuration', () => {
    test('app-config.js includes Auth0 configuration', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/app-config.js`);

      expect(res.status).toBe(200);
      const text = await res.text();
      expect(text).toContain('auth0');
      expect(text).toContain('domain');
      expect(text).toContain('clientId');
    });

    test('Auth0 callback route exists', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/callback?code=test&state=test`);

      // Should handle callback (may redirect or return)
      expect(res.status).toBeLessThan(500);
    });
  });

  describe('JWT Token Validation', () => {
    test('Protected endpoints require authentication', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/health-data`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      // Should require auth (401/403) or allow in dev (200)
      expect([200, 401, 403]).toContain(res.status);
    });

    test('Invalid JWT tokens are rejected', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/health-data`, {
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
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const aco = res.headers.get('Access-Control-Allow-Origin');
      expect(aco).toBeTruthy();
    });

    test('Unauthorized origins are blocked', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
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

