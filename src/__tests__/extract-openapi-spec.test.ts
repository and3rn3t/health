/**
 * Helper "test" that extracts the OpenAPI spec JSON from the Worker.
 * Used by scripts/ci/generate-api-types.mjs — not a real test.
 */
import { writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { it } from 'vitest';
import app from '../worker';

const ASSETS_404 = {
  fetch: async () => new Response('not found', { status: 404 }),
};

it('extracts openapi spec to temp file', async () => {
  const res = await app.fetch(
    new Request('https://localhost/api/docs/openapi.json'),
    {
      ENVIRONMENT: 'development',
      ALLOWED_ORIGINS: '*',
      ASSETS: ASSETS_404,
    }
  );

  const spec = await res.json();
  const outPath = resolve(process.cwd(), '.openapi-spec.tmp.json');
  writeFileSync(outPath, JSON.stringify(spec, null, 2));
});
