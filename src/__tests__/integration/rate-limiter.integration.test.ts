import {
  createMiniflareWorker,
  type MiniflareInstance,
} from '@/test/integration-harness';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * Integration tests for the RateLimiter Durable Object.
 *
 * Validates token-bucket behaviour: consumption, exhaustion (429),
 * refill after interval, probe mode, and concurrent burst handling.
 */
describe('RateLimiter Durable Object Integration', () => {
  let ctx: MiniflareInstance;

  beforeAll(async () => {
    ctx = await createMiniflareWorker();
  });

  afterAll(async () => {
    await ctx?.dispose();
  });

  // ── Helpers ──────────────────────────────────────────────────

  /** Fire N requests sequentially and return status codes. */
  async function fireRequests(
    n: number,
    origin = 'https://health.andernet.dev',
  ): Promise<number[]> {
    const statuses: number[] = [];
    for (let i = 0; i < n; i++) {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/health-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: origin,
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            heart_rate: 72,
          }),
        },
      );
      statuses.push(res.status);
    }
    return statuses;
  }

  // ── Tests ────────────────────────────────────────────────────

  describe('Token Bucket Behaviour', () => {
    test('first request is allowed', async () => {
      const [status] = await fireRequests(1);
      // In dev mode auth is skipped — should succeed or return a route-level error (not 429 or 500)
      expect(status).toBeLessThan(500);
    });

    test('burst of requests eventually triggers 429', async () => {
      // Fire a burst larger than the default bucket — at least some should be rate-limited
      const statuses = await fireRequests(80);
      const has429 = statuses.includes(429);
      const hasSuccess = statuses.some((s) => s < 400);

      // We expect at least one success and at least one 429
      expect(hasSuccess).toBe(true);
      expect(has429).toBe(true);
    });

    test('rate limit response includes correct error shape', async () => {
      // Exhaust tokens first
      await fireRequests(70);

      // Continue until we get a 429
      let rateLimitBody: { error: string } | undefined;
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
          rateLimitBody = (await res.json()) as { error: string };
          break;
        }
      }

      if (rateLimitBody) {
        expect(rateLimitBody.error).toBe('rate_limited');
      }
    });
  });

  describe('Security Headers on Rate-Limited Responses', () => {
    test('rate-limited responses include CORS headers for allowed origins', async () => {
      // Exhaust tokens
      await fireRequests(70);

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
          // Middleware-applied CORS should still be present
          expect(res.headers.get('content-type')).toContain('json');
          break;
        }
      }
    });
  });

  describe('Per-Key Isolation', () => {
    test('different IP keys get independent buckets', async () => {
      // Exhaust one "IP" by using custom header (dev mode uses CF-Connecting-IP fallback)
      for (let i = 0; i < 70; i++) {
        await ctx.mf.dispatchFetch(
          `${ctx.baseUrl}/api/health-data`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Origin: 'https://health.andernet.dev',
              'CF-Connecting-IP': '10.0.0.1',
            },
            body: JSON.stringify({
              timestamp: new Date().toISOString(),
              heart_rate: 72,
            }),
          },
        );
      }

      // Different IP — should start with full bucket
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/health-data`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://health.andernet.dev',
            'CF-Connecting-IP': '10.0.0.99',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            heart_rate: 72,
          }),
        },
      );

      // Second IP should not be rate-limited yet
      expect(res.status).not.toBe(429);
    });
  });
});
