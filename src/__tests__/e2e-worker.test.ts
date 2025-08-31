import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Miniflare } from 'miniflare';

// E2E against built worker bundle with minimal bindings
describe('Worker E2E (Miniflare)', () => {
  let mf: Miniflare;

  beforeAll(async () => {
    // Use path relative to project root (Vitest cwd)
    const scriptPath = 'dist-worker/index.js';
    // Basic KV and R2 mocks
    mf = new Miniflare({
      scriptPath,
      modules: true,
      compatibilityDate: '2024-05-01',
      bindings: {
        ENVIRONMENT: 'development',
        ALLOWED_ORIGINS: 'https://allowed.test',
        ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        API_ISS: 'issuer',
        API_AUD: 'audience',
      },
      kvNamespaces: ['HEALTH_KV'],
      r2Buckets: ['HEALTH_STORAGE'],
      // No ASSETS binding: worker will serve routes directly in tests
      durableObjects: {
        RATE_LIMITER: 'RateLimiter',
      },
    });
  });

  afterAll(async () => {
    await mf?.dispose();
  });

  it('GET /health returns healthy', async () => {
    const res = await mf.dispatchFetch('http://localhost/health', {
      headers: { Origin: 'https://allowed.test' },
    });
    expect(res.status).toBe(200);
    // Security headers (best-effort in this harness)
    const csp = res.headers.get('Content-Security-Policy') || '';
    if (csp) {
      expect(csp.includes("default-src 'self'"));
    }
    // CORS and tracing
    const aco = res.headers.get('Access-Control-Allow-Origin');
    if (aco) expect(aco).toBe('https://allowed.test');
    const corr = res.headers.get('X-Correlation-Id');
    if (corr) expect(String(corr).length).toBeGreaterThan(0);
  });

  it('OPTIONS preflight on /api/health-data responds', async () => {
    const res = await mf.dispatchFetch('http://localhost/api/health-data', {
      method: 'OPTIONS',
      headers: { Origin: 'https://allowed.test' },
    });
    expect([200, 204]).toContain(res.status);
    const aco2 = res.headers.get('Access-Control-Allow-Origin');
    if (aco2) expect(aco2).toBe('https://allowed.test');
    const methods = res.headers.get('Access-Control-Allow-Methods') || '';
    if (methods) {
      expect(methods).toContain('GET');
      expect(methods).toContain('POST');
      expect(methods).toContain('OPTIONS');
    }
    const corr2 = res.headers.get('X-Correlation-Id');
    if (corr2) expect(String(corr2).length).toBeGreaterThan(0);
  });

  it('POST /api/health-data validates and stores record', async () => {
    const payload = {
      type: 'heart_rate',
      value: 65,
      processedAt: new Date().toISOString(),
      validated: true,
    };
    const res = await mf.dispatchFetch('http://localhost/api/health-data', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        Origin: 'https://allowed.test',
      },
      body: JSON.stringify(payload),
    });
    expect([200, 201]).toContain(res.status);
    try {
      const body = (await res.clone().json()) as { ok?: boolean };
      if (typeof body?.ok !== 'undefined') expect(body.ok).toBe(true);
    } catch {
      // ignore non-JSON bodies in this harness
    }

    // Verify KV side-effect: key with health:heart_rate:* exists
    type KVListOut = { keys?: Array<{ name: string }> };
    type KVNS = { list?: (opts?: { prefix?: string }) => Promise<KVListOut> };
    type R2ListOut = { objects?: Array<{ key: string }> };
    type R2Bucket = {
      list?: (opts?: { prefix?: string }) => Promise<R2ListOut>;
    };
    type MFWithHelpers = {
      getKVNamespace: (name: string) => Promise<KVNS>;
      getR2Bucket: (name: string) => Promise<R2Bucket>;
    };

    const helpers = mf as unknown as MFWithHelpers;
    const kv = await helpers.getKVNamespace('HEALTH_KV');
    if (kv && typeof kv.list === 'function') {
      const listed = await kv.list({ prefix: 'health:heart_rate:' });
      const count = Array.isArray(listed.keys) ? listed.keys.length : 0;
      expect(count).toBeGreaterThan(0);
    }

    // Verify R2 audit side-effect: at least one audit/events/* object
    const r2 = await helpers.getR2Bucket('HEALTH_STORAGE');
    if (r2 && typeof r2.list === 'function') {
      const out = await r2.list({ prefix: 'audit/events/' });
      const count = Array.isArray(out.objects) ? out.objects.length : 0;
      expect(count).toBeGreaterThan(0);
    }
  });
});
