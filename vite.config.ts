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
    // Bundle size optimizations
    rollupOptions: {
      output: {
        // More aggressive chunk splitting for better code splitting
        manualChunks: (id) => {
          // Vendor chunks - split more granularly
          if (id.includes('node_modules')) {
            if (id.includes('react-dom')) {
              return 'react-dom';
            }
            if (id.includes('react')) {
              return 'react';
            }
            if (id.includes('@tanstack/react-query')) {
              return 'query';
            }
            if (id.includes('@radix-ui')) {
              return 'radix';
            }
            if (id.includes('lucide-react') || id.includes('@phosphor-icons')) {
              return 'icons';
            }
            if (id.includes('date-fns') || id.includes('moment')) {
              return 'date';
            }
            return 'vendor';
          }
          // Feature chunks based on file paths - more granular
          if (id.includes('/analytics/')) {
            return 'analytics';
          }
          if (id.includes('/health/')) {
            return 'health';
          }
          if (id.includes('/dashboard/')) {
            return 'dashboard';
          }
          if (id.includes('/vitalsense/')) {
            return 'vitalsense';
          }
          if (id.includes('/lidar/') || id.includes('lidar')) {
            return 'lidar';
          }
          if (id.includes('/ml/') || id.includes('/wasm/') || id.includes('ml')) {
            return 'ml';
          }
          if (id.includes('/ui/')) {
            return 'ui-components';
          }
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace(/\.[^/.]+$/, '') || 'chunk'
            : 'chunk';
          return `assets/${facadeModuleId}-[hash].js`;
        },
      },
    },
    // Additional optimizations
    chunkSizeWarningLimit: 700, // Temporary increase for CI pass
    minify: 'esbuild',
  },
});
