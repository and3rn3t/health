/**
 * Zod ↔ OpenAPI schema drift test.
 *
 * Validates that the OpenAPI component schemas match the Zod schemas
 * in src/schemas/health.ts. Catches fields added to one but not the other.
 */
import { describe, expect, it } from 'vitest';
import app from '../worker';
import {
  healthMetricSchema,
  healthMetricBatchSchema,
  healthMetricTypeSchema,
  liveGaitSnapshotSchema,
  liveGaitSnapshotBatchSchema,
  liveBalanceProgressSchema,
  liveBalanceResultSchema,
  processedHealthDataSchema,
} from '../schemas/health';

const ASSETS_404 = {
  fetch: async () => new Response('not found', { status: 404 }),
};

function makeEnv() {
  return {
    ENVIRONMENT: 'development',
    ALLOWED_ORIGINS: '*',
    ASSETS: ASSETS_404,
  };
}

/** Extract top-level property names from a Zod object schema */
function zodFieldNames(schema: { shape?: Record<string, unknown> }): string[] {
  if (!schema.shape) return [];
  return Object.keys(schema.shape).sort();
}

/** Extract top-level property names from an OpenAPI object schema */
function openapiFieldNames(
  schema: { properties?: Record<string, unknown> } | undefined,
): string[] {
  if (!schema?.properties) return [];
  return Object.keys(schema.properties).sort();
}

async function getSpec() {
  const res = await app.fetch(
    new Request('https://x.test/api/docs/openapi.json'),
    makeEnv(),
  );
  return (await res.json()) as {
    components: {
      schemas: Record<string, { properties?: Record<string, unknown>; enum?: string[] }>;
    };
  };
}

describe('Zod ↔ OpenAPI schema drift', () => {
  it('HealthMetricType enum values match', async () => {
    const spec = await getSpec();
    const zodValues = healthMetricTypeSchema.options.slice().sort();
    const openapiValues = [...(spec.components.schemas.HealthMetricType?.enum ?? [])].sort();
    expect(zodValues).toEqual(openapiValues);
  });

  it('HealthMetric fields match', async () => {
    const spec = await getSpec();
    expect(zodFieldNames(healthMetricSchema)).toEqual(
      openapiFieldNames(spec.components.schemas.HealthMetric),
    );
  });

  it('HealthMetricBatch fields match', async () => {
    const spec = await getSpec();
    expect(zodFieldNames(healthMetricBatchSchema)).toEqual(
      openapiFieldNames(spec.components.schemas.HealthMetricBatch),
    );
  });

  it('LiveGaitSnapshot fields match', async () => {
    const spec = await getSpec();
    expect(zodFieldNames(liveGaitSnapshotSchema)).toEqual(
      openapiFieldNames(spec.components.schemas.LiveGaitSnapshot),
    );
  });

  it('LiveGaitSnapshotBatch fields match', async () => {
    const spec = await getSpec();
    expect(zodFieldNames(liveGaitSnapshotBatchSchema)).toEqual(
      openapiFieldNames(spec.components.schemas.LiveGaitSnapshotBatch),
    );
  });

  it('LiveBalanceProgress fields match', async () => {
    const spec = await getSpec();
    expect(zodFieldNames(liveBalanceProgressSchema)).toEqual(
      openapiFieldNames(spec.components.schemas.LiveBalanceProgress),
    );
  });

  it('LiveBalanceResult fields match', async () => {
    const spec = await getSpec();
    expect(zodFieldNames(liveBalanceResultSchema)).toEqual(
      openapiFieldNames(spec.components.schemas.LiveBalanceResult),
    );
  });

  it('ProcessedHealthData fields match', async () => {
    const spec = await getSpec();
    expect(zodFieldNames(processedHealthDataSchema)).toEqual(
      openapiFieldNames(spec.components.schemas.ProcessedHealthData),
    );
  });
});
