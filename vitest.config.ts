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
    ],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
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
