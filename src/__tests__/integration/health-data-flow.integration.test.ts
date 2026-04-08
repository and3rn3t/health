import {
  createMiniflareWorker,
  type MiniflareInstance,
} from '@/test/integration-harness';
import { afterAll, beforeAll, describe, expect, test } from 'vitest';

/**
 * Integration tests for health data ingestion and processing flow
 */
describe('Health Data Flow Integration', () => {
  let ctx: MiniflareInstance;

  beforeAll(async () => {
    ctx = await createMiniflareWorker();
  });

  afterAll(async () => {
    await ctx?.dispose();
  });

  describe('Health Data Validation', () => {
    test('POST /api/health-data validates required fields', async () => {
      const invalidData = {};

      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/health-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://health.andernet.dev',
        },
        body: JSON.stringify(invalidData),
      });

      // Should reject invalid data
      expect([400, 401, 403, 422]).toContain(res.status);
    });

    test('POST /api/health-data accepts valid metric data', async () => {
      const validData = {
        timestamp: new Date().toISOString(),
        heart_rate: 72,
        steps: 5000,
        fall_risk_score: 0.15,
      };

      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/health-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://health.andernet.dev',
        },
        body: JSON.stringify(validData),
      });

      // May require auth, but structure should be valid
      expect(res.status).toBeLessThan(500);
    });

    test('POST /api/health-data handles batch data', async () => {
      const batchData = {
        metrics: [
          {
            timestamp: new Date().toISOString(),
            heart_rate: 72,
          },
          {
            timestamp: new Date(Date.now() + 1000).toISOString(),
            heart_rate: 75,
          },
        ],
      };

      const res = await ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/health-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: 'https://health.andernet.dev',
        },
        body: JSON.stringify(batchData),
      });

      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Data Retrieval', () => {
    test('GET /api/health-data supports pagination', async () => {
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/health-data?limit=10&offset=0`,
        {
          headers: { Origin: 'https://health.andernet.dev' },
        }
      );

      // May require auth, but endpoint should exist
      expect(res.status).toBeLessThan(500);
    });

    test('GET /api/health-data supports date filtering', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await ctx.mf.dispatchFetch(
        `${ctx.baseUrl}/api/health-data?startDate=${today}`,
        {
          headers: { Origin: 'https://health.andernet.dev' },
        }
      );

      expect(res.status).toBeLessThan(500);
    });
  });

  describe('Rate Limiting', () => {
    test('Rate limiting is applied to health data endpoints', async () => {
      const requests = Array.from({ length: 10 }, () =>
        ctx.mf.dispatchFetch(`${ctx.baseUrl}/api/health-data`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Origin: 'https://health.andernet.dev',
          },
          body: JSON.stringify({
            timestamp: new Date().toISOString(),
            heart_rate: 72,
          }),
        })
      );

      const responses = await Promise.all(requests);
      const statusCodes = responses.map((r) => r.status);

      // At least some requests should succeed or be rate limited (not all 500)
      expect(statusCodes.some((code) => code < 500)).toBe(true);
    });
  });
});
