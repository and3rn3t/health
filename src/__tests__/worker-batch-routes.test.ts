import { describe, expect, it, vi, beforeEach } from 'vitest';
import app from '@/worker';
import { buildWorkerEnv, buildHealthMetric, buildHealthMetricBatch } from '@/test/factories';

function makeEnv(overrides: Record<string, unknown> = {}) {
  return buildWorkerEnv(overrides);
}

describe('health-data-batch routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ----- POST /api/health-data/process -----

  describe('POST /api/health-data/process', () => {
    it('returns 400 for invalid JSON body', async () => {
      const req = new Request('https://x.test/api/health-data/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'not-json',
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
    });

    it('returns 400 for invalid schema', async () => {
      const req = new Request('https://x.test/api/health-data/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ bad: true }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('validation_error');
    });

    it('returns 429 when rate limited', async () => {
      const limiterResp = new Response(JSON.stringify({ ok: false }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      });
      const env = makeEnv({
        RATE_LIMITER: {
          idFromName: (n: string) => ({ n }),
          get: () => ({ fetch: async () => limiterResp }),
        },
      });
      const req = new Request('https://x.test/api/health-data/process', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildHealthMetric()),
      });
      const res = await app.fetch(req, env);
      expect(res.status).toBe(429);
    });
  });

  // ----- POST /api/health-data/batch -----

  describe('POST /api/health-data/batch', () => {
    it('returns 400 for invalid JSON', async () => {
      const req = new Request('https://x.test/api/health-data/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{{bad',
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
    });

    it('returns 400 for missing metrics array', async () => {
      const req = new Request('https://x.test/api/health-data/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ notMetrics: true }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('validation_error');
    });

    it('returns 429 when rate limited', async () => {
      const limiterResp = new Response(JSON.stringify({ ok: false }), {
        status: 429,
        headers: { 'content-type': 'application/json' },
      });
      const env = makeEnv({
        RATE_LIMITER: {
          idFromName: (n: string) => ({ n }),
          get: () => ({ fetch: async () => limiterResp }),
        },
      });
      const req = new Request('https://x.test/api/health-data/batch', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(buildHealthMetricBatch(2)),
      });
      const res = await app.fetch(req, env);
      expect(res.status).toBe(429);
    });
  });
});
