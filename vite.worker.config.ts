import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react({
      // Only transform JSX, don't include React runtime in worker
      jsxRuntime: 'classic',
      jsxImportSource: 'react',
    }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/worker.ts'),
      name: 'worker',
      fileName: 'index',
      formats: ['es'],
    },
    rollupOptions: {
      external: ['cloudflare:workers', 'react', 'react-dom'],
      output: {
        // Ensure React is externalized
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    outDir: 'dist-worker',
    sourcemap: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  esbuild: {
    // Configure JSX for esbuild (classic mode for worker compatibility)
    jsx: 'transform',
    jsxFactory: 'React.createElement',
    jsxFragment: 'React.Fragment',
  },
});
