import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/worker.ts'),
      name: 'worker',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['cloudflare:workers'],
    },
    outDir: 'dist-worker',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
