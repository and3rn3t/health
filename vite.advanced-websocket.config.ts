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
        exports: 'named',
        // Ensure the class name is preserved
        generatedCode: {
          constBindings: false,
        },
      },
    },
    outDir: 'dist-worker',
    sourcemap: true,
    // Don't minify to preserve exports and class names
    minify: false,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    // No JSX in this worker - it's pure TypeScript
    jsx: 'preserve',
    // Keep class names and exports - critical for Cloudflare Durable Objects
    keepNames: true,
    // Target ES2022 for Cloudflare Workers
    target: 'es2022',
    // Don't add name helpers that might confuse Cloudflare
    minifyIdentifiers: false,
    minifySyntax: false,
    minifyWhitespace: false,
  },
});
