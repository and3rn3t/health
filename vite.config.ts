import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;

export default defineConfig({
  // Ensure Tailwind uses JS implementation (no native oxide binding)
  define: {
    'process.env.TAILWIND_DISABLE_OXIDE': JSON.stringify('1'),
    __APP_VERSION__: JSON.stringify(
      process.env.npm_package_version || '0.0.0-dev'
    ),
    __RUM_SAMPLE_RATE__: JSON.stringify(process.env.RUM_SAMPLE_RATE || '1'),
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
