import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

/**
 * Integration test configuration
 * Runs integration tests separately from unit tests
 */
export default defineConfig({
  esbuild: {
    target: 'node18',
  },
  test: {
    environment: 'node',
    include: [
      'src/**/*integration*.test.{ts,tsx}',
      'src/__tests__/integration/**/*.{test,spec}.{ts,tsx}',
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'dist-worker/**',
    ],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    testTimeout: 30000, // Integration tests may take longer
    hookTimeout: 30000,
    teardownTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'json-summary', 'lcov'],
      reportsDirectory: 'coverage/integration',
      exclude: [
        'src/_archive/**',
        'scripts/**',
        'public/**',
        '**/*.d.ts',
        '**/__tests__/**',
      ],
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});

