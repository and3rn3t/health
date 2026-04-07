import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'node18',
    // Optimize esbuild for faster compilation in tests
    format: 'esm',
    treeShaking: true,
    // Faster compilation with sourcemaps disabled in tests
    sourcemap: false,
  },
  test: {
    environment: 'jsdom', // For React component testing
    // Discover tests colocated with code and in __tests__ folders
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
      'src/**/*integration*.test.ts', // Exclude integration tests that require running servers
    ],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    // Memory optimization: use forks pool for better memory isolation (prevents OOM)
    // Forks pool isolates each test file in its own process, allowing better memory cleanup
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: false,
        isolate: true,
        maxForks: process.env.CI ? 1 : 4, // 4 locally for faster feedback, 1 in CI for memory safety
        minForks: 1,
      },
    },
    // Test timeout optimization - increased to accommodate tests with multiple waitFor calls
    // Tests use waitFor with 2-3s timeouts, so we need higher global timeout
    testTimeout: process.env.CI ? 20000 : 15000, // Increased: 15s locally, 20s in CI
    hookTimeout: process.env.CI ? 10000 : 5000, // Increased hook timeouts
    teardownTimeout: process.env.CI ? 10000 : 5000, // Increased teardown timeout
    // Enable bail mode in CI to fail fast, but not locally for full test coverage
    bail: process.env.CI ? 1 : 0, // Stop after first failure in CI, continue locally
    // Optimize test execution: maximize parallelism in local dev for speed
    sequence: {
      shuffle: false, // Disable shuffle for faster execution and deterministic order
      concurrent: false, // Disabled: tests within a file share global state (fetch mocks, window globals, timers)
    },
    // Memory optimization: reduce concurrency to prevent memory exhaustion
    maxConcurrency: process.env.CI ? 1 : 4, // Match maxForks for consistent local parallelism
    fileParallelism: true, // Enable file-level parallelism but limited by maxConcurrency
    // Enable test retries for flaky tests (faster than manual reruns)
    retry: process.env.CI ? 1 : 0, // Retry once in CI, but not locally to save time
    // Coverage is only collected when --coverage flag is used
    coverage: {
      provider: 'v8',
      // Added 'json-summary' so CI coverage gate (expects coverage/coverage-summary.json)
      // succeeds; previously only 'json' produced coverage-final.json causing gate failure.
      // In CI, use minimal reporters to reduce memory usage (json-summary is sufficient for gate)
      reporter: process.env.CI
        ? ['json-summary', 'json', 'lcov'] // lcov needed for SonarCloud coverage import
        : ['text', 'json', 'json-summary', 'lcov'], // Full reporters when coverage is enabled
      reportsDirectory: 'coverage',
      // Memory optimization: only collect coverage for tested files (not all source files)
      all: false, // Reduces memory usage by not processing untested files
      // Regression guard: fail if overall coverage drops below these floors
      thresholds: {
        lines: 30,
        branches: 25,
        functions: 30,
        statements: 30,
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
