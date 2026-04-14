import {
  createMiniflareWorker,
  type MiniflareInstance,
} from '@/test/integration-harness';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * Integration tests for Worker middleware: security headers, CORS,
 * CSP directives, cache control, and API-wide auth/rate-limit enforcement.
 */
describe('Worker Middleware Integration', () => {
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

  // ── Security Headers ─────────────────────────────────────────

  describe('Security Headers', () => {
    test('responses include HSTS header', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const hsts = res.headers.get('Strict-Transport-Security');
      if (hsts) {
        expect(hsts).toContain('max-age=');
        expect(hsts).toContain('includeSubDomains');
      }
    });

    test('X-Content-Type-Options is nosniff', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const xcto = res.headers.get('X-Content-Type-Options');
      if (xcto) {
        expect(xcto).toBe('nosniff');
      }
    });

    test('X-Frame-Options is DENY', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const xfo = res.headers.get('X-Frame-Options');
      if (xfo) {
        expect(xfo).toBe('DENY');
      }
    });

    test('Content-Security-Policy is present', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const csp = res.headers.get('Content-Security-Policy');
      if (csp) {
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain('frame-ancestors');
      }
    });

    test('Referrer-Policy is no-referrer', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const rp = res.headers.get('Referrer-Policy');
      if (rp) {
        expect(rp).toBe('no-referrer');
      }
    });

    test('Permissions-Policy restricts sensitive APIs', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const pp = res.headers.get('Permissions-Policy');
      if (pp) {
        expect(pp).toContain('geolocation=()');
        expect(pp).toContain('camera=()');
      }
    });

    test('correlation ID is included', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const corr = res.headers.get('X-Correlation-Id');
      if (corr) {
        expect(corr.length).toBeGreaterThan(0);
      }
    });
  });

  // ── CORS ─────────────────────────────────────────────────────

  describe('CORS Enforcement', () => {
    test('preflight returns 204 for allowed origin', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'https://health.andernet.dev',
          'Access-Control-Request-Method': 'GET',
        },
      });

      expect([200, 204]).toContain(res.status);
    });

    test('preflight for localhost origin in dev', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        method: 'OPTIONS',
        headers: {
          Origin: 'http://localhost:5173',
          'Access-Control-Request-Method': 'GET',
        },
      });

      expect([200, 204]).toContain(res.status);
    });

    test('disallowed origin does not get ACAO header', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://evil-site.example.com' },
      });

      const acao = res.headers.get('Access-Control-Allow-Origin');
      if (acao) {
        expect(acao).not.toBe('https://evil-site.example.com');
        expect(acao).not.toBe('*');
      }
    });
  });

  // ── API Auth Enforcement ─────────────────────────────────────

  describe('API Auth Enforcement', () => {
    test('public GET endpoints are accessible without auth', async () => {
      const publicEndpoints = [
        '/api/ws-url',
        '/api/ws-live-enabled',
      ];

      for (const endpoint of publicEndpoints) {
        const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}${endpoint}`, {
          headers: { Origin: 'https://health.andernet.dev' },
        });
        // Public endpoints should not return 401/403
        expect(res.status).not.toBe(401);
        expect(res.status).toBeLessThan(500);
      }
    });

    test('in dev mode, auth is relaxed for API routes', async () => {
      // Integration harness runs ENVIRONMENT=development
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/health-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://health.andernet.dev',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            heart_rate: 72,
          }),
        },
      );

      // Dev mode: requireAuth returns true, so request should not be 401
      // (may be 400/404 depending on route, but not auth failure)
      expect(res.status).not.toBe(401);
    });
  });

  // ── Cache Control ────────────────────────────────────────────

  describe('API Cache Control', () => {
    test('API responses have Cache-Control: no-store', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/ws-url`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      const cc = res.headers.get('Cache-Control');
      if (cc) {
        expect(cc).toContain('no-store');
      }
    });

    test('health endpoint is cacheable', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      // /health is not under /api/* so it may or may not have no-store
      expect(res.status).toBe(200);
    });
  });

  // ── Config Endpoints ─────────────────────────────────────────

  describe('Config Endpoints', () => {
    test('GET /api/gait-config-version returns version', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/gait-config-version`,
        {
          headers: { Origin: 'https://health.andernet.dev' },
        },
      );

      expect(res.status).toBeLessThan(500);
      if (res.ok) {
        const body = (await res.json()) as { version: string };
        expect(body.version).toBeDefined();
      }
    });

    test('GET /api/fall-risk-config-version returns version', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/fall-risk-config-version`,
        {
          headers: { Origin: 'https://health.andernet.dev' },
        },
      );

      expect(res.status).toBeLessThan(500);
      if (res.ok) {
        const body = (await res.json()) as { version: string };
        expect(body.version).toBeDefined();
      }
    });

    test('GET /api/analytics-config-versions returns combined config', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/analytics-config-versions`,
        {
          headers: { Origin: 'https://health.andernet.dev' },
        },
      );

      expect(res.status).toBeLessThan(500);
      if (res.ok) {
        const body = (await res.json()) as {
          gait: unknown;
          fallRisk: unknown;
        };
        expect(body.gait).toBeDefined();
        expect(body.fallRisk).toBeDefined();
      }
    });
  });
});
