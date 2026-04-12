import SwaggerParser from '@apidevtools/swagger-parser';
import { beforeEach, describe, expect, it, vi } from 'vitest';
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

describe('worker: openapi routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // GET /api/docs/openapi.json
  // -----------------------------------------------------------------------

  it('returns valid OpenAPI 3.1 JSON', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    expect(res.status).toBe(200);
    const spec = (await res.json()) as {
      openapi: string;
      info: { title: string; version: string };
      paths: Record<string, unknown>;
      components: { schemas: Record<string, unknown> };
    };
    expect(spec.openapi).toBe('3.1.0');
    expect(spec.info.title).toBe('VitalSense API');
    expect(spec.info.version).toBe('1.0.0');
  });

  it('spec contains all core paths', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      paths: Record<string, unknown>;
    };
    const paths = Object.keys(spec.paths);

    // Core routes that MUST be documented
    const requiredPaths = [
      '/health',
      '/api/live/gait',
      '/api/live/gait/batch',
      '/api/live/balance/progress',
      '/api/live/balance/result',
      '/api/health-data/process',
      '/api/health-data/batch',
      '/api/health-data/analytics/{userId}',
      '/api/kv/{key}',
      '/api/user/2fa/status',
      '/api/user/export',
      '/api/device/auth',
      '/ws',
      '/api/client-error',
      '/api/ws-telemetry',
      '/api/_perf_ingest',
      '/api/ws-url',
      '/api/ws-live-enabled',
    ];

    for (const p of requiredPaths) {
      expect(paths, `missing path: ${p}`).toContain(p);
    }
  });

  it('spec contains all component schemas', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      components: { schemas: Record<string, unknown> };
    };
    const schemaNames = Object.keys(spec.components.schemas);

    const requiredSchemas = [
      'HealthMetricType',
      'HealthMetric',
      'HealthMetricBatch',
      'LiveGaitSnapshot',
      'LiveGaitSnapshotBatch',
      'LiveBalanceProgress',
      'LiveBalanceResult',
      'ProcessedHealthData',
      'ErrorResponse',
      'SuccessResponse',
      'ClientError',
      'WebSocketTelemetry',
    ];

    for (const s of requiredSchemas) {
      expect(schemaNames, `missing schema: ${s}`).toContain(s);
    }
  });

  it('uses server URL from BASE_URL env', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv({ BASE_URL: 'https://health.andernet.dev' })
    );
    const spec = (await res.json()) as {
      servers: Array<{ url: string }>;
    };
    expect(spec.servers[0]!.url).toBe('https://health.andernet.dev');
  });

  it('falls back to request origin when BASE_URL unset', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv({ BASE_URL: undefined })
    );
    const spec = (await res.json()) as {
      servers: Array<{ url: string }>;
    };
    expect(spec.servers[0]!.url).toBe('https://x.test');
  });

  it('has bearerAuth security scheme', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      components: {
        securitySchemes: Record<string, { type: string; scheme: string }>;
      };
    };
    const bearer = spec.components.securitySchemes['bearerAuth'];
    expect(bearer).toBeDefined();
    expect(bearer!.type).toBe('http');
    expect(bearer!.scheme).toBe('bearer');
  });

  it('public endpoints have empty security array', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      paths: Record<string, Record<string, { security?: unknown[] }>>;
    };

    // Health check should be public
    const healthGet = spec.paths['/health']!['get'];
    expect(healthGet!.security).toEqual([]);

    // Config endpoints should be public
    const gaitGet = spec.paths['/api/gait-config-version']!['get'];
    expect(gaitGet!.security).toEqual([]);
  });

  it('authenticated endpoints have bearerAuth security', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      paths: Record<
        string,
        Record<string, { security?: Array<Record<string, unknown[]>> }>
      >;
    };

    const gaitPost = spec.paths['/api/live/gait']!['post'];
    expect(gaitPost!.security).toEqual([{ bearerAuth: [] }]);
  });

  it('spec has all expected tags', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      tags: Array<{ name: string }>;
    };
    const tagNames = spec.tags.map((t) => t.name);

    expect(tagNames).toContain('System');
    expect(tagNames).toContain('Configuration');
    expect(tagNames).toContain('Live Health Data');
    expect(tagNames).toContain('Health Data Processing');
    expect(tagNames).toContain('User Settings');
    expect(tagNames).toContain('Authentication');
    expect(tagNames).toContain('WebSocket');
    expect(tagNames).toContain('Telemetry');
  });

  it('HealthMetricType enum matches known metric types', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      components: { schemas: { HealthMetricType: { enum: string[] } } };
    };
    const types = spec.components.schemas.HealthMetricType.enum;
    expect(types).toContain('heart_rate');
    expect(types).toContain('gait_speed');
    expect(types).toContain('fall_event');
    expect(types.length).toBeGreaterThanOrEqual(20);
  });

  // -----------------------------------------------------------------------
  // GET /api/docs
  // -----------------------------------------------------------------------

  it('serves Swagger UI HTML page', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs'),
      makeEnv()
    );
    expect(res.status).toBe(200);
    const html = await res.text();
    expect(html).toContain('swagger-ui');
    expect(html).toContain('/api/docs/openapi.json');
    expect(html).toContain('VitalSense API Documentation');
  });

  // -----------------------------------------------------------------------
  // Docs endpoints bypass auth
  // -----------------------------------------------------------------------

  it('docs endpoints do not require auth', async () => {
    // No auth headers, no HEALTH_KV, no DEVICE_JWT_SECRET — should still 200
    const jsonRes = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    expect(jsonRes.status).toBe(200);

    const htmlRes = await app.fetch(
      new Request('https://x.test/api/docs'),
      makeEnv()
    );
    expect(htmlRes.status).toBe(200);
  });

  // -----------------------------------------------------------------------
  // Spec validation (swagger-parser)
  // -----------------------------------------------------------------------

  it('passes swagger-parser structural validation', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = await res.json();

    // swagger-parser.validate resolves all $ref pointers and validates
    // the spec against the OpenAPI 3.x JSON Schema. Throws on invalid.
    await expect(
      SwaggerParser.validate(structuredClone(spec) as never)
    ).resolves.toBeDefined();
  });

  it('all $ref targets resolve to defined schemas', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = await res.json();

    // dereference resolves every $ref — throws if any are broken
    await expect(
      SwaggerParser.dereference(structuredClone(spec) as never)
    ).resolves.toBeDefined();
  });

  it('all operationIds are unique', async () => {
    const res = await app.fetch(
      new Request('https://x.test/api/docs/openapi.json'),
      makeEnv()
    );
    const spec = (await res.json()) as {
      paths: Record<string, Record<string, { operationId?: string }>>;
    };

    const ids: string[] = [];
    for (const methods of Object.values(spec.paths)) {
      for (const op of Object.values(methods)) {
        if (op.operationId) ids.push(op.operationId);
      }
    }

    const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
    expect(dupes, `duplicate operationIds: ${dupes.join(', ')}`).toEqual([]);
  });
});
