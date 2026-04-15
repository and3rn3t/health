import {
  createMiniflareWorker,
  type MiniflareInstance,
} from '@/test/integration-harness';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/** Extract the shape of an object (keys + typeof values) recursively. */
function extractShape(obj: unknown, depth = 0): unknown {
  if (depth > 5) return typeof obj;
  if (obj === null) return 'null';
  if (Array.isArray(obj)) {
    return obj.length > 0
      ? [extractShape(obj[0], depth + 1)]
      : ['empty'];
  }
  if (typeof obj === 'object') {
    const shape: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
      shape[key] = extractShape(value, depth + 1);
    }
    return shape;
  }
  return typeof obj;
}

/**
 * API Contract / Schema tests.
 *
 * Snapshot the shape of Worker API responses to detect breaking changes
 * that would silently break the React frontend or iOS WebSocket bridge.
 *
 * These tests don't check values — they check that the response structure
 * (keys, types) matches the contract the clients depend on.
 */
describe('API Contract Tests', () => {
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

  // ── Health Check Contract ────────────────────────────────────

  describe('GET /health', () => {
    test('response shape matches contract', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/health`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      expect(res.ok).toBe(true);
      const body = await res.json();
      const shape = extractShape(body);

      expect(shape).toMatchInlineSnapshot(`
        {
          "environment": "string",
          "status": "string",
          "timestamp": "string",
        }
      `);
    });
  });

  // ── App Config Contract ──────────────────────────────────────

  describe('GET /app-config.js', () => {
    test('contains required config keys', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/app-config.js`);

      expect(res.ok).toBe(true);
      const text = await res.text();

      // The React app depends on these keys in __VITALSENSE_CONFIG__
      expect(text).toContain('__VITALSENSE_CONFIG__');
      expect(text).toContain('environment');
      expect(text).toContain('auth0');
      expect(text).toContain('domain');
      expect(text).toContain('clientId');
    });
  });

  // ── WebSocket URL Contract ───────────────────────────────────

  describe('GET /api/ws-url', () => {
    test('response shape matches contract', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/ws-url`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      expect(res.ok).toBe(true);
      const body = await res.json();
      const shape = extractShape(body);

      expect(shape).toMatchInlineSnapshot(`
        {
          "fallback": "string",
          "url": "string",
        }
      `);
    });
  });

  // ── WebSocket Live Enabled Contract ──────────────────────────

  describe('GET /api/ws-live-enabled', () => {
    test('response shape matches contract', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/ws-live-enabled`,
        { headers: { Origin: 'https://health.andernet.dev' } },
      );

      expect(res.ok).toBe(true);
      const body = await res.json();
      const shape = extractShape(body);

      expect(shape).toMatchInlineSnapshot(`
        {
          "enabled": "boolean",
        }
      `);
    });
  });

  // ── WebSocket Probe Contract ─────────────────────────────────

  describe('GET /ws (probe)', () => {
    test('response shape matches contract', async () => {
      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/ws`, {
        headers: { Origin: 'https://health.andernet.dev' },
      });

      expect(res.ok).toBe(true);
      const body = (await res.json()) as {
        ok: boolean;
        upgradeRequired: boolean;
        supportedMessageTypes: string[];
        analyticsVersions: { gait: string; fallRisk: string };
        timestamp: string;
      };

      // Validate required fields (the iOS bridge and React app depend on these)
      expect(body).toHaveProperty('ok');
      expect(body).toHaveProperty('upgradeRequired');
      expect(body).toHaveProperty('supportedMessageTypes');
      expect(body).toHaveProperty('analyticsVersions');
      expect(body).toHaveProperty('timestamp');

      // Validate analyticsVersions sub-shape
      expect(body.analyticsVersions).toHaveProperty('gait');
      expect(body.analyticsVersions).toHaveProperty('fallRisk');
      expect(typeof body.analyticsVersions.gait).toBe('string');
      expect(typeof body.analyticsVersions.fallRisk).toBe('string');

      // supportedMessageTypes must include types the iOS bridge relies on
      expect(body.supportedMessageTypes).toContain('connection_established');
      expect(body.supportedMessageTypes).toContain('live_health_update');
      expect(body.supportedMessageTypes).toContain('pong');
      expect(body.supportedMessageTypes).toContain('error');
    });
  });

  // ── Gait Config Contract ─────────────────────────────────────

  describe('GET /api/gait-config-version', () => {
    test('response has version field', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/gait-config-version`,
        { headers: { Origin: 'https://health.andernet.dev' } },
      );

      if (res.ok) {
        const body = await res.json();
        expect(body).toHaveProperty('version');
        expect(typeof (body as { version: string }).version).toBe('string');
      }
    });
  });

  // ── Fall Risk Config Contract ────────────────────────────────

  describe('GET /api/fall-risk-config-version', () => {
    test('response has version field', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/fall-risk-config-version`,
        { headers: { Origin: 'https://health.andernet.dev' } },
      );

      if (res.ok) {
        const body = await res.json();
        expect(body).toHaveProperty('version');
        expect(typeof (body as { version: string }).version).toBe('string');
      }
    });
  });

  // ── Combined Analytics Config Contract ───────────────────────

  describe('GET /api/analytics-config-versions', () => {
    test('response has gait and fallRisk sections', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/analytics-config-versions`,
        { headers: { Origin: 'https://health.andernet.dev' } },
      );

      if (res.ok) {
        const body = (await res.json()) as {
          gait: unknown;
          fallRisk: unknown;
        };
        expect(body).toHaveProperty('gait');
        expect(body).toHaveProperty('fallRisk');
      }
    });
  });

  // ── Rate Limited Response Contract ───────────────────────────

  describe('429 Rate Limited Response', () => {
    test('error shape matches contract', async () => {
      // Exhaust rate limit
      for (let i = 0; i < 70; i++) {
        await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/health-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://health.andernet.dev',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            heart_rate: 72,
          }),
        });
      }

      // Get a 429
      for (let i = 0; i < 30; i++) {
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

        if (res.status === 429) {
          const body = await res.json();
          const shape = extractShape(body);
          expect(shape).toMatchInlineSnapshot(`
            {
              "error": "string",
            }
          `);
          break;
        }
      }
    });
  });
});
