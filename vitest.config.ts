import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'node22',
    format: 'esm',
    treeShaking: true,
    sourcemap: false,
  },
  test: {
    environment: 'jsdom',
    include: [
      'src/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'src/**/__tests__/e2e/**',
      'src/**/*e2e*.{test,spec}.{ts,tsx}',
      'src/**/*.{e2e-test,e2e.spec,e2e.test}.{ts,tsx}',
      'src/**/*integration*.test.ts',
    ],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Threads locally for speed, forks in CI for memory isolation
    pool: process.env.CI ? 'forks' : 'threads',
    isolate: true,
    maxWorkers: 4,
    testTimeout: 20_000,
    hookTimeout: 10_000,
    teardownTimeout: 10_000,
    // Retry in CI for flakiness resilience (no bail — let retry handle transients)
    bail: 0,
    sequence: {
      // Shuffle catches hidden order dependencies; seed is logged for reproducibility
      shuffle: true,
      concurrent: false,
    },
    maxConcurrency: process.env.CI ? 2 : 4,
    fileParallelism: true,
    retry: process.env.CI ? 2 : 0,
    // Inline reporter for GitHub Actions annotations on failures
    reporters: process.env.CI
      ? ['default', 'github-actions', 'junit']
      : ['default'],
    outputFile: process.env.CI
      ? { junit: 'test-results/junit.xml' }
      : undefined,
    coverage: {
      provider: 'v8',
      reporter: process.env.CI
        ? ['json-summary', 'json', 'lcov']
        : ['text', 'json', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      // Ratchet up: raise thresholds as coverage improves
      thresholds: {
        lines: 65,
        branches: 54,
        functions: 66,
        statements: 64,
      },
      // Exclude large, non-runtime or archival areas to raise meaningful signal
      exclude: [
        'src/components/**/AI*',
        // Exclude server / websocket simulation & infra scripts not part of unit test scope
        'server/**',
        'src/server/**',
        // Active UI components excluded from coverage (integration-heavy, pending test harness)
        'src/components/**/WalkingPatternVisualizerClean.tsx',
        'src/components/**/LiveConnectionStatus.tsx',
        'src/components/**/GaitDashboardClean.tsx',
        // Hooks / libs that are integration-heavy or wrappers pending test harness
        'src/hooks/useLiveHealthData*.ts',
        'src/hooks/useWebSocket.ts',
        // Keep existing general exclusions
        'scripts/**',
        'public/**',
        '**/*.d.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
