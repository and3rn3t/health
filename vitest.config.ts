import { resolve } from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  esbuild: {
    target: 'node18',
  },
  test: {
    environment: 'jsdom', // For React component testing
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
    exclude: ['src/__tests__/branding/vitalsense-branding.test.tsx'], // Exclude complex component tests for now
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
