import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'node18',
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
      'src/__tests__/emergency-cancel.test.ts',
      'src/__tests__/branding/vitalsense-branding.test.tsx',
      'src/**/*integration*.test.ts',
    ],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Threads locally for speed, forks in CI for memory isolation
    pool: process.env.CI ? 'forks' : 'threads',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true,
        // GitHub Actions runners have 2+ cores — use them
        maxForks: 2,
        minForks: 1,
      },
      threads: {
        isolate: true,
        maxThreads: 4,
        minThreads: 1,
      },
    },
    testTimeout: process.env.CI ? 20000 : 15000,
    hookTimeout: process.env.CI ? 10000 : 5000,
    teardownTimeout: process.env.CI ? 10000 : 5000,
    // Retry in CI for flakiness resilience (no bail — let retry handle transients)
    bail: 0,
    sequence: {
      // Shuffle catches hidden order dependencies; seed is logged for reproducibility
      shuffle: true,
      concurrent: false,
    },
    maxConcurrency: process.env.CI ? 2 : 4,
    fileParallelism: true,
    retry: process.env.CI ? 1 : 0,
    // Inline reporter for GitHub Actions annotations on failures
    reporters: process.env.CI
      ? ['default', 'github-actions']
      : ['default'],
    coverage: {
      provider: 'v8',
      reporter: process.env.CI
        ? ['json-summary', 'json', 'lcov']
        : ['text', 'json', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
      all: false,
      // Ratchet up: raise thresholds as coverage improves
      thresholds: {
        lines: 35,
        branches: 30,
        functions: 35,
        statements: 35,
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
        'src/lib/liveHealthDataSync.ts',
        'src/lib/enhancedHealthProcessor.ts',
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
