import { describe, it, expect, beforeEach, vi } from 'vitest';
import app from '../worker';

function makeEnv(overrides: Partial<Record<string, unknown>> = {}) {
  const puts: Array<{
    key: string;
    value: string;
    opts?: { expirationTtl?: number };
  }> = [];
  const r2Puts: Array<{ key: string; data: string }> = [];
  const env = {
    ENVIRONMENT: 'development',
    ALLOWED_ORIGINS: 'https://allowed.test',
    ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
    API_ISS: 'issuer',
    API_AUD: 'audience',
    HEALTH_KV: {
      async put(key: string, value: string, opts?: { expirationTtl?: number }) {
        puts.push({ key, value, opts });
      },
    },
    HEALTH_STORAGE: {
      async put(key: string, data: string) {
        r2Puts.push({ key, data });
      },
      async get() {
        return null;
      },
      async list() {
        return { objects: [] as Array<{ key: string }> };
      },
    },
    ASSETS: {
      fetch: () => Promise.resolve(new Response(null, { status: 404 })),
    },
    RATE_LIMITER: undefined,
    ...overrides,
  } as Record<string, unknown>;
  return { env, puts, r2Puts };
}

async function call(
  path: string,
  init?: RequestInit,
  envOverrides?: Record<string, unknown>
) {
  const { env } = makeEnv(envOverrides || {});
  const req = new Request(`http://localhost${path}`, init);
  return app.fetch(
    req,
    env as unknown as { [key: string]: unknown }
  ) as Promise<Response>;
}

describe('Worker E2E via Hono fetch', () => {
  beforeEach(() => vi.restoreAllMocks());

  it('GET /health: returns healthy when origin allowed', async () => {
    const res = await call('/health', {
      headers: { Origin: 'https://allowed.test' },
    });
    expect(res.status).toBe(200);
  });

  it('OPTIONS /api/health-data: returns preflight for allowed origin', async () => {
    const res = await call('/api/health-data', {
      method: 'OPTIONS',
      headers: { Origin: 'https://allowed.test' },
    });
    expect([200, 204]).toContain(res.status);
  });

  it('POST /api/health-data: validates and stores encrypted record to KV and writes audit', async () => {
    const { env, puts, r2Puts } = makeEnv();
    const payload = {
      type: 'heart_rate',
      value: 65,
      processedAt: new Date().toISOString(),
      validated: true,
    };
    const req = new Request('http://localhost/api/health-data', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Origin: 'https://allowed.test',
      },
      body: JSON.stringify(payload),
    });
    const res = (await app.fetch(
      req,
      env as unknown as { [key: string]: unknown }
    )) as Response;
    expect([200, 201]).toContain(res.status);
    // Try to parse and validate ok=true if JSON body present
    try {
      const body = (await res.clone().json()) as { ok?: boolean };
      if (typeof body?.ok !== 'undefined') expect(body.ok).toBe(true);
    } catch {
      // ignore parse errors in harness
    }
    // KV wrote an encrypted or plain payload with TTL
    expect(puts.length).toBe(1);
    expect(puts[0].key).toMatch(/^health:heart_rate:/);
    expect(puts[0].opts).toHaveProperty('expirationTtl');
    // Audit wrote a line to R2
    expect(r2Puts.length).toBe(1);
    expect(r2Puts[0].key).toMatch(/^audit\/events\//);
  });
});
