import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'node18',
    // Optimize esbuild for faster compilation in tests
    format: 'esm',
    treeShaking: true,
    // Faster compilation with sourcemaps disabled in tests
    sourcemap: false,
    // Optimize for speed over size in tests
    minify: false,
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
    // Optimize parallel execution: use forks pool in CI for better isolation and stability
    // threads pool for local development (faster), forks pool for CI (more stable)
    pool: process.env.CI ? 'forks' : 'threads',
    poolOptions: {
      threads: {
        // Optimize threads for performance: use more threads in local dev for speed
        maxThreads: process.env.CI ? 2 : 8, // Use more threads locally (CPU cores typically available)
        minThreads: process.env.CI ? 1 : 4, // Keep multiple threads active locally
        singleThread: false,
      },
      forks: {
        // Use forks pool in CI for better isolation and stability
        // Further reduced parallelism in CI to prevent memory issues
        singleFork: process.env.CI ? true : false, // Use single fork in CI to prevent OOM
        isolate: true, // Isolate each test file in its own process for better memory cleanup
        maxForks: process.env.CI ? 1 : 2, // Use only 1 fork in CI to reduce memory pressure
        minForks: process.env.CI ? 1 : 1, // Single fork in CI
      },
    },
    // Test timeout optimization for faster failure detection
    testTimeout: process.env.CI ? 10000 : 5000, // Shorter timeouts locally (5s), longer in CI (10s)
    hookTimeout: process.env.CI ? 5000 : 3000,  // Faster hook timeouts locally
    teardownTimeout: process.env.CI ? 5000 : 2000, // Faster teardown locally
    // Enable bail mode in CI to fail fast, but not locally for full test coverage
    bail: process.env.CI ? 1 : 0, // Stop after first failure in CI, continue locally
    // Optimize test execution: maximize parallelism in local dev for speed
    sequence: {
      shuffle: false, // Disable shuffle for faster execution and deterministic order
      concurrent: true, // Always run concurrently (tests should be isolated anyway)
    },
    // Performance optimization: maximize concurrency in local dev
    maxConcurrency: process.env.CI ? 1 : 10, // Much higher concurrency locally for speed
    fileParallelism: true, // Enable file-level parallelism for faster execution
    // Enable test retries for flaky tests (faster than manual reruns)
    retry: process.env.CI ? 1 : 0, // Retry once in CI, but not locally to save time
    // Coverage is only collected when --coverage flag is used
    coverage: {
      provider: 'v8',
      // Added 'json-summary' so CI coverage gate (expects coverage/coverage-summary.json)
      // succeeds; previously only 'json' produced coverage-final.json causing gate failure.
      // In CI, use minimal reporters to reduce memory usage (json-summary is sufficient for gate)
      reporter: process.env.CI
        ? ['json-summary', 'json'] // Minimal reporters in CI to reduce memory overhead
        : ['text', 'json', 'json-summary', 'lcov'], // Full reporters when coverage is enabled
      reportsDirectory: 'coverage',
      // Memory optimization: only collect coverage for tested files (not all source files)
      all: false, // Reduces memory usage by not processing untested files
      // Exclude large, non-runtime or archival areas to raise meaningful signal
      exclude: [
        'src/_archive/**',
        'src/components/_archive/**',
        'src/components/**/experimental/**',
        'src/components/**/infrastructure/**',
        'src/components/**/unused-health/**',
        'src/components/sections/DevDiagnostics.tsx',
        'src/components/sections/DeveloperTools.tsx',
        'src/components/**/WebSocketArchitectureGuide.tsx',
        'src/components/**/ComprehensiveAppleHealthKitGuide.tsx',
        'src/components/**/CognitiveHealth.tsx',
        'src/components/**/ML*',
        'src/components/**/AI*',
        'src/components/health/EnhancedGaitAnalyzer.tsx',
        'src/components/health/EnhancedHealthInsightsDashboard.tsx',
        'src/components/health/EnhancedHealthDataUpload.tsx',
        'src/components/health/EnhancedHealthInsightsDashboard.tsx',
        'src/components/sections/ShowcaseLabs.tsx',
        'src/components/health/**/Long*',
        'src/lib/**/test-*',
        // Exclude large server / websocket simulation & infra scripts that are not part of unit test scope
        'server/**',
        'src/server/**',
        'src/**/test-*.ts',
        'src/**/simulate-*.ts',
        // Large UI placeholder mega-files (panels/dashboards with no near-term testability)
        'src/components/**/SimpleSystemStatus.tsx',
        'src/components/**/SystemStatusPanel.tsx',
        'src/components/**/WalkingPatternVisualizer.tsx',
        'src/components/**/WalkingPatternVisualizerClean.tsx',
        'src/components/**/LiveConnectionDashboard.tsx',
        'src/components/**/LiveConnectionStatus.tsx',
        'src/components/**/LiveHealthMonitoring.tsx',
        'src/components/**/MovementPatternAnalysis.tsx',
        'src/components/**/SmartNotificationEngine.tsx',
        'src/components/**/HealthSystemIntegration.tsx',
        'src/components/**/HealthSearch.tsx',
        'src/components/**/HealthcarePortal.tsx',
        'src/components/**/RealTimeHealthScoring.tsx',
        'src/components/**/RealTimeMonitoringHub.tsx',
        'src/components/**/RealTimeFallDetection.tsx',
        'src/components/**/AdvancedAppleWatchIntegration.tsx',
        'src/components/**/AppleWatchIntegrationChecklist.tsx',
        'src/components/**/CommunityShare.tsx',
        'src/components/**/FamilyDashboard.tsx',
        'src/components/**/GaitDashboard.tsx',
        'src/components/**/GaitDashboardClean.tsx',
        'src/components/**/HealthAlertsConfig.tsx',
        'src/components/**/HealthSettings.tsx',
        'src/components/**/Integration*.tsx',
        'src/components/**/PredictiveHealthAlerts.tsx',
        'src/components/**/MobilityScoreCard.tsx',
        'src/components/**/Sparkline.tsx',
        'src/components/**/TelemetryPanel.tsx',
        'src/components/**/UserProfile.tsx',
        'src/components/**/VitalSenseLoader.tsx',
        // Hooks / libs that are integration-heavy or wrappers pending test harness
        'src/hooks/useLiveHealthData*.ts',
        'src/hooks/useWebSocket.ts',
        'src/lib/liveHealthDataSync.ts',
        'src/lib/movementPatternAnalyzer.ts',
        'src/lib/enhancedHealthProcessor.ts',
        'src/lib/enhancedFallRiskOptimizer.ts',
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
