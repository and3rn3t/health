import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  FALL_RISK_ANALYTICS_VERSION,
  fallRiskConfig,
} from '../lib/fallRiskConfig';
import { GAIT_ANALYTICS_VERSION, gaitConfig } from '../lib/gaitConfig';
import app from '../worker';

const ASSETS_404 = {
  fetch: async (_req: Request) => new Response('not found', { status: 404 }),
};

function makeEnv(overrides: Record<string, unknown> = {}) {
  return {
    ENVIRONMENT: 'development',
    ALLOWED_ORIGINS: 'https://allowed.test',
    ASSETS: ASSETS_404,
    ...overrides,
  };
}

const CONFIG_ETAG = `"cfg-${GAIT_ANALYTICS_VERSION}-${FALL_RISK_ANALYTICS_VERSION}"`;

describe('worker: config routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // /health
  // -----------------------------------------------------------------------

  it('GET /health returns healthy JSON with timestamp', async () => {
    const res = await app.fetch(
      new Request('https://x.test/health'),
      makeEnv()
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      status: string;
      timestamp: string;
      environment: string;
    };
    expect(json.status).toBe('healthy');
    expect(json.environment).toBe('development');
    expect(new Date(json.timestamp).getTime()).not.toBeNaN();
  });

  it('GET /health reflects ENVIRONMENT binding', async () => {
    const res = await app.fetch(
      new Request('https://x.test/health'),
      makeEnv({ ENVIRONMENT: 'production' })
    );
    const json = (await res.json()) as { environment: string };
    expect(json.environment).toBe('production');
  });

  // -----------------------------------------------------------------------
  // /api/gait-config-version
  // -----------------------------------------------------------------------

  it('GET /api/gait-config-version returns version and config', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/gait-config-version'),
      makeEnv()
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      version: string;
      config: typeof gaitConfig;
    };
    expect(json.version).toBe(GAIT_ANALYTICS_VERSION);
    expect(json.config).toEqual(gaitConfig);
  });

  it('GET /api/gait-config-version includes ETag and Cache-Control', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/gait-config-version'),
      makeEnv()
    );
    expect(res.headers.get('ETag')).toBe(CONFIG_ETAG);
    expect(res.headers.get('Cache-Control')).toContain('max-age=300');
    expect(res.headers.get('Cache-Control')).toContain(
      'stale-while-revalidate=60'
    );
  });

  it('GET /api/gait-config-version returns 304 when ETag matches', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/gait-config-version', {
        headers: { 'If-None-Match': CONFIG_ETAG },
      }),
      makeEnv()
    );
    expect(res.status).toBe(304);
  });

  // -----------------------------------------------------------------------
  // /api/fall-risk-config-version
  // -----------------------------------------------------------------------

  it('GET /api/fall-risk-config-version returns version and config', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/fall-risk-config-version'),
      makeEnv()
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      version: string;
      config: typeof fallRiskConfig;
    };
    expect(json.version).toBe(FALL_RISK_ANALYTICS_VERSION);
    expect(json.config).toEqual(fallRiskConfig);
  });

  it('GET /api/fall-risk-config-version returns 304 on matching ETag', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/fall-risk-config-version', {
        headers: { 'If-None-Match': CONFIG_ETAG },
      }),
      makeEnv()
    );
    expect(res.status).toBe(304);
  });

  // -----------------------------------------------------------------------
  // /api/analytics-config-versions
  // -----------------------------------------------------------------------

  it('GET /api/analytics-config-versions returns combined configs', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/analytics-config-versions'),
      makeEnv()
    );
    expect(res.status).toBe(200);
    const json = (await res.json()) as {
      gait: { version: string; config: typeof gaitConfig };
      fallRisk: { version: string; config: typeof fallRiskConfig };
    };
    expect(json.gait.version).toBe(GAIT_ANALYTICS_VERSION);
    expect(json.gait.config).toEqual(gaitConfig);
    expect(json.fallRisk.version).toBe(FALL_RISK_ANALYTICS_VERSION);
    expect(json.fallRisk.config).toEqual(fallRiskConfig);
  });

  it('GET /api/analytics-config-versions supports ETag 304', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/analytics-config-versions', {
        headers: { 'If-None-Match': CONFIG_ETAG },
      }),
      makeEnv()
    );
    expect(res.status).toBe(304);
  });

  // -----------------------------------------------------------------------
  // /app-config.js
  // -----------------------------------------------------------------------

  it('GET /app-config.js returns JS with window.__VITALSENSE_CONFIG__', async () => {
    const res = await app.fetch(
      new Request('https://x.test/app-config.js'),
      makeEnv({
        AUTH0_DOMAIN: 'test.auth0.com',
        AUTH0_CLIENT_ID: 'abc123',
        BASE_URL: 'https://vitalsense.test',
      })
    );
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('application/javascript');
    const body = await res.text();
    expect(body).toContain('window.__VITALSENSE_CONFIG__');
    expect(body).toContain('test.auth0.com');
    expect(body).toContain('abc123');
    expect(body).toContain('https://vitalsense.test');
  });

  it('GET /app-config.js sets no-store Cache-Control in dev', async () => {
    const res = await app.fetch(
      new Request('https://x.test/app-config.js'),
      makeEnv({ ENVIRONMENT: 'development' })
    );
    expect(res.headers.get('Cache-Control')).toContain('no-store');
  });

  it('GET /app-config.js does not set no-store in production', async () => {
    const res = await app.fetch(
      new Request('https://x.test/app-config.js'),
      makeEnv({ ENVIRONMENT: 'production' })
    );
    const cc = res.headers.get('Cache-Control') || '';
    expect(cc).not.toContain('no-store');
  });

  it('GET /app-config.js uses KV mode local in production', async () => {
    const res = await app.fetch(
      new Request('https://x.test/app-config.js'),
      makeEnv({ ENVIRONMENT: 'production' })
    );
    const body = await res.text();
    expect(body).toContain('"local"');
  });

  it('GET /app-config.js uses KV mode network in non-production', async () => {
    const res = await app.fetch(
      new Request('https://x.test/app-config.js'),
      makeEnv({ ENVIRONMENT: 'development' })
    );
    const body = await res.text();
    expect(body).toContain('"network"');
  });

  it('GET /app-config.js infers baseUrl from request when BASE_URL unset', async () => {
    const res = await app.fetch(
      new Request('https://my-host.test/app-config.js'),
      makeEnv({ BASE_URL: undefined })
    );
    const body = await res.text();
    expect(body).toContain('https://my-host.test');
  });
});
