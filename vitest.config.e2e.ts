import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'node18',
  },
  test: {
    environment: 'jsdom',
    // Integration/E2E test discovery patterns
    include: [
      'src/**/__tests__/e2e/**/*.{test,spec}.{ts,tsx}',
      'src/**/__tests__/**/*e2e*.{test,spec}.{ts,tsx}',
      'src/**/*.{e2e-test,e2e.spec,e2e.test}.{ts,tsx}',
    ],
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
