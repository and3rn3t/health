import { beforeEach, describe, expect, it, vi } from 'vitest';
import app from '../worker';

const ASSETS_404 = {
  fetch: async (_req: Request) =>
    new Response('not found', { status: 404 }),
};

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    ENVIRONMENT: 'development',
    ALLOWED_ORIGINS: 'https://allowed.test',
    ASSETS: ASSETS_404,
    ...overrides,
  };
}

describe('worker: diagnostics routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Production guard: all dev-only endpoints return 404 in production
  // -----------------------------------------------------------------------

  const devOnlyEndpoints = [
    { method: 'GET', path: '/api/_selftest' },
    { method: 'GET', path: '/api/_error' },
    { method: 'GET', path: '/api/_analytics_ping' },
    { method: 'GET', path: '/api/_diagnostics' },
    { method: 'GET', path: '/api/_ratelimit' },
    { method: 'GET', path: '/api/_audit' },
    { method: 'POST', path: '/api/_purge' },
  ];

  for (const { method, path } of devOnlyEndpoints) {
    it(`${method} ${path} is unreachable in production`, async () => {
      const res = await app.fetch(
        new Request(`https://x.test${path}`, { method }),
        makeEnv({ ENVIRONMENT: 'production' }),
      );
      // In production, auth middleware (401) may reject before route-level 404
      expect([401, 404]).toContain(res.status);
    });
  }

  // -----------------------------------------------------------------------
  // /api/_selftest
  // -----------------------------------------------------------------------

  it('GET /api/_selftest returns ok in development', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_selftest'),
      makeEnv({ ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=' }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      results: { aes_gcm: { ok: boolean } };
    };
    expect(json.ok).toBe(true);
    expect(json.results.aes_gcm.ok).toBe(true);
  });

  it('GET /api/_selftest reports no_key when ENC_KEY is missing', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_selftest'),
      makeEnv({ ENC_KEY: undefined }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      results: { aes_gcm: { ok: boolean; reason?: string } };
    };
    expect(json.ok).toBe(true);
    expect(json.results.aes_gcm.ok).toBe(false);
    expect(json.results.aes_gcm.reason).toBe('no_key');
  });

  // -----------------------------------------------------------------------
  // /api/_error
  // -----------------------------------------------------------------------

  it('GET /api/_error throws intentional error in development', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_error'),
      makeEnv(),
    );
    // Worker global error handler should catch and return 500
    expect(res.status).toBe(500);
  });

  // -----------------------------------------------------------------------
  // /api/_analytics_ping
  // -----------------------------------------------------------------------

  it('GET /api/_analytics_ping works with analytics binding', async () => {
    const writeDataPoint = vi.fn();
    const res = await app.fetch(
      new Request('https://x.test/api/_analytics_ping'),
      makeEnv({
        ANALYTICS: { writeDataPoint },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      dataset: string | null;
      correlationId: string;
    };
    expect(json.ok).toBe(true);
    expect(json.dataset).toBe('ANALYTICS');
    expect(json.correlationId).toBeTruthy();
  });

  it('GET /api/_analytics_ping works without analytics binding', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_analytics_ping'),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; dataset: string | null };
    // writeAnalyticsPoint returns false when no binding is available
    expect(json.dataset).toBeNull();
  });

  // -----------------------------------------------------------------------
  // /api/_diagnostics
  // -----------------------------------------------------------------------

  it('GET /api/_diagnostics returns snapshot in development', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_diagnostics'),
      makeEnv(),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      env: string;
      datasets: Record<string, boolean>;
      hasKV: boolean;
      hasR2: boolean;
      hasRateLimiter: boolean;
      endpoints: string[];
      now: string;
    };
    expect(json.ok).toBe(true);
    expect(json.env).toBe('development');
    expect(json.datasets).toBeDefined();
    expect(json.hasKV).toBe(false);
    expect(json.hasR2).toBe(false);
    expect(json.endpoints).toContain('/health');
    expect(json.endpoints).toContain('/api/_diagnostics');
    expect(new Date(json.now).getTime()).not.toBeNaN();
  });

  it('GET /api/_diagnostics reports bound resources', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_diagnostics'),
      makeEnv({
        HEALTH_KV: { put: vi.fn() },
        HEALTH_STORAGE: { put: vi.fn(), get: vi.fn(), list: vi.fn() },
        RATE_LIMITER: { idFromName: vi.fn(), get: vi.fn() },
        HEALTH_ANALYTICS: { writeDataPoint: vi.fn() },
      }),
    );
    const json = (await res.json()) as {
      hasKV: boolean;
      hasR2: boolean;
      hasRateLimiter: boolean;
      datasets: Record<string, boolean>;
    };
    expect(json.hasKV).toBe(true);
    expect(json.hasR2).toBe(true);
    expect(json.hasRateLimiter).toBe(true);
    expect(json.datasets.HEALTH_ANALYTICS).toBe(true);
  });

  // -----------------------------------------------------------------------
  // /api/_ratelimit
  // -----------------------------------------------------------------------

  it('GET /api/_ratelimit returns error when no rate limiter binding', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_ratelimit'),
      makeEnv({ RATE_LIMITER: undefined }),
    );
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('no_rate_limiter');
  });

  it('GET /api/_ratelimit probes rate limiter DO and returns remaining', async () => {
    const doResp = new Response(JSON.stringify({ remaining: 42 }), {
      headers: { 'content-type': 'application/json' },
    });
    // Use DO binding for both the middleware and the probe to avoid in-memory bucket exhaustion
    const consumeResp = new Response(JSON.stringify({ ok: true }), {
      headers: { 'content-type': 'application/json' },
    });
    const res = await app.fetch(
      new Request('https://x.test/api/_ratelimit?key=test-key', {
        headers: { 'CF-Connecting-IP': 'rl-probe-test' },
      }),
      makeEnv({
        RATE_LIMITER: {
          idFromName: (name: string) => ({ name }),
          get: () => ({
            fetch: async (req: Request | string) => {
              const url = typeof req === 'string' ? req : req.url;
              // Middleware /consume vs probe /consume?probe=1
              if (url.includes('probe=1')) return doResp;
              return consumeResp;
            },
          }),
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      key: string;
      remaining: number;
    };
    expect(json.ok).toBe(true);
    expect(json.key).toBe('test-key');
    expect(json.remaining).toBe(42);
  });

  // -----------------------------------------------------------------------
  // /api/_audit
  // -----------------------------------------------------------------------

  it('GET /api/_audit returns error when no storage binding', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_audit'),
      makeEnv({ HEALTH_STORAGE: undefined }),
    );
    expect(res.status).toBe(500);
    const json = (await res.json()) as { error: string };
    expect(json.error).toBe('no_storage');
  });

  it('GET /api/_audit lists audit keys from R2', async () => {
    const mockObjects = [
      { key: 'audit/events/2024-01-02-abc' },
      { key: 'audit/events/2024-01-01-xyz' },
    ];
    const res = await app.fetch(
      new Request('https://x.test/api/_audit'),
      makeEnv({
        HEALTH_STORAGE: {
          put: vi.fn(),
          get: vi.fn(),
          list: async () => ({ objects: mockObjects }),
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      ok: boolean;
      count: number;
      keys: string[];
    };
    expect(json.ok).toBe(true);
    expect(json.count).toBe(2);
    expect(json.keys).toContain('audit/events/2024-01-02-abc');
  });

  // -----------------------------------------------------------------------
  // /api/_purge
  // -----------------------------------------------------------------------

  it('POST /api/_purge returns ok with no KV binding', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/_purge', { method: 'POST' }),
      makeEnv({ HEALTH_KV: undefined }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean; scanned: number };
    expect(json.ok).toBe(true);
    expect(json.scanned).toBe(0);
  });

  it('POST /api/_purge calls purge with KV binding', async () => {
    const deleteFn = vi.fn().mockResolvedValue(undefined);
    const res = await app.fetch(
      new Request('https://x.test/api/_purge', { method: 'POST' }),
      makeEnv({
        HEALTH_KV: {
          put: vi.fn(),
          get: vi.fn(),
          list: async () => ({ keys: [], list_complete: true }),
          delete: deleteFn,
        },
      }),
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as { ok: boolean };
    expect(json.ok).toBe(true);
  });
});
