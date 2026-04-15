import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

/**
 * Separate config for integration tests (excluded from the main unit test run).
 * Usage: npx vitest run --config vitest.integration.config.ts
 */
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*integration*.test.{ts,tsx}'],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    pool: 'forks',
    // Each integration test creates its own Miniflare on an auto-assigned port.
    // CI runners have more headroom for parallel workers; keep serial locally
    // where Miniflare startup contention is higher.
    maxWorkers: process.env.CI ? 2 : 1,
    fileParallelism: !!process.env.CI,
    isolate: true,
    testTimeout: 30_000,
    hookTimeout: 30_000,
    retry: process.env.CI ? 1 : 0,
    reporters: process.env.CI
      ? ['default', 'github-actions', 'junit']
      : ['default'],
    outputFile: process.env.CI
      ? { junit: 'test-results/integration-junit.xml' }
      : undefined,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
