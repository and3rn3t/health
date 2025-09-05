import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

export default defineConfig({
  // Ensure Tailwind uses JS implementation (no native oxide binding)
  define: {
    'process.env.TAILWIND_DISABLE_OXIDE': JSON.stringify('1'),
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
  },
  // Avoid native lightningcss by using PostCSS + esbuild
  css: {
    transformer: 'postcss',
  },
  build: {
    cssMinify: 'esbuild',
    outDir: 'dist',
    sourcemap: true,
  },
});
