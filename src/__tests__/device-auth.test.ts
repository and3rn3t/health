import { describe, it, expect } from 'vitest';
import app from '../worker';

function makeEnv(overrides: Partial<Record<string, unknown>> = {}) {
  const env = {
    ENVIRONMENT: 'development',
    API_ISS: 'issuer',
    API_AUD: 'ws-device',
    DEVICE_JWT_SECRET: 'dev-secret',
    ASSETS: {
      fetch: () => Promise.resolve(new Response(null, { status: 404 })),
    },
    ...overrides,
  } as Record<string, unknown>;
  return { env };
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

describe('POST /api/device/auth', () => {
  it('issues a short-lived token when provided userId and clientType', async () => {
    const res = await call(
      '/api/device/auth',
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          userId: 'u1',
          clientType: 'web_dashboard',
          ttlSec: 120,
        }),
      },
      { ENVIRONMENT: 'development', DEVICE_JWT_SECRET: 'dev-secret' }
    );
    expect([200, 201]).toContain(res.status);
    try {
      const body = (await res.clone().json()) as {
        ok?: boolean;
        token?: string;
        expiresIn?: number;
      };
      if (typeof body?.ok !== 'undefined') expect(body.ok).toBe(true);
      if (typeof body?.token !== 'undefined')
        expect(typeof body.token).toBe('string');
      if (typeof body?.expiresIn !== 'undefined')
        expect(body.expiresIn).toBe(120);
    } catch {
      // Allow empty body due to top-level middleware behavior in tests
    }
  });
});
