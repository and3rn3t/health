import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/workers/vitalsense-websocket-advanced.ts'),
      name: 'vitalsense-websocket-advanced',
      fileName: 'vitalsense-websocket-advanced-clean',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['cloudflare:workers'],
      output: {
        format: 'es',
        // Preserve both named and default exports
        exports: 'auto',
        // Ensure the class is exported
        preserveModules: false,
      },
    },
    outDir: 'dist-worker',
    sourcemap: true,
    // Ensure all exports are preserved
    minify: false, // Don't minify to preserve exports
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    // No JSX in this worker - it's pure TypeScript
    jsx: 'preserve',
    // Keep class names and exports
    keepNames: true,
  },
});
