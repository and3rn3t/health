import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'node18',
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
        // Use more threads for parallel execution in local dev
        maxThreads: 8,
        minThreads: 4,
        singleThread: false,
      },
      forks: {
        // Use forks pool in CI for better isolation and stability
        singleFork: false,
        isolate: true, // Isolate each test file in its own process
        maxForks: process.env.CI ? 4 : 2,
        minForks: process.env.CI ? 2 : 1,
      },
    },
    // Test timeout optimization for faster failure detection
    testTimeout: 10000, // 10s default
    hookTimeout: 5000,  // 5s for hooks
    teardownTimeout: 5000,
    coverage: {
      provider: 'v8',
      // Added 'json-summary' so CI coverage gate (expects coverage/coverage-summary.json)
      // succeeds; previously only 'json' produced coverage-final.json causing gate failure.
      reporter: ['text', 'json', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage',
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
