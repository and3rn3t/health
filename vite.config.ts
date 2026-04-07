import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';
import { defineConfig } from 'vite';

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;
const isDev =
  process.env.NODE_ENV !== 'production' &&
  process.env.BUILD !== 'production' &&
  process.env.CI !== 'true';

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(
      process.env.npm_package_version || '0.0.0-dev'
    ),
    // Disable RUM in dev to avoid 404s for /api/_perf_ingest
    __RUM_SAMPLE_RATE__: JSON.stringify(
      process.env.RUM_SAMPLE_RATE || (isDev ? '0' : '1')
    ),
  },
  plugins: [react()],
  // Suppress PostCSS warnings in CI/production (known harmless warning about 'from' option)
  logLevel: process.env.CI === 'true' ? 'error' : 'warn',
  esbuild: {
    drop: process.env.CI === 'true' ? ['console', 'debugger'] : [],
    legalComments: 'none',
    // More aggressive minification
    minifyWhitespace: true,
    minifyIdentifiers: true,
    minifySyntax: true,
    // Tree-shaking optimizations
    treeShaking: true,
    // Better compression in production
    ...(process.env.CI === 'true' && {
      pure: ['console.log', 'console.info', 'console.debug', 'console.warn'],
      keepNames: false, // Don't keep function names for smaller bundle
    }),
  },
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
    // Disable source maps in CI/production to reduce bundle size
    sourcemap: process.env.CI !== 'true',
    // Aggressive bundle size optimizations for CI compliance
    rollupOptions: {
      output: {
        // Very aggressive chunk splitting to keep each chunk under 200KB (reduced from 400KB)
        // This ensures faster initial load by splitting large libraries into separate chunks
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React ecosystem — 2 chunks
            if (id.includes('react-dom')) return 'react-dom';
            if (id.includes('react')) return 'react';

            // UI primitives — 1 chunk
            if (id.includes('@radix-ui')) return 'radix-ui';

            // Data & state
            if (id.includes('@tanstack/react-query')) return 'react-query';

            // Charts (large, lazy-loaded)
            if (id.includes('recharts')) return 'recharts';

            // Icons
            if (id.includes('lucide-react')) return 'lucide-icons';

            // Utilities
            if (id.includes('date-fns')) return 'date-utils';
            if (id.includes('zod')) return 'validation';

            return 'vendor';
          }

          // Feature chunks — align with React.lazy boundaries in App.tsx
          if (id.includes('lidar') || id.includes('LiDAR')) return 'lidar';
          if (id.includes('gait') || id.includes('Gait')) return 'health-gait';
          if (id.includes('fall') || id.includes('Fall')) return 'health-fall';
          if (id.includes('analytics') || id.includes('Analytics')) return 'analytics';
          if (id.includes('LandingPage') || id.includes('landing')) return 'landing';
          if (id.includes('SettingsPanel') || id.includes('settings')) return 'settings';
          if (id.includes('ml') || id.includes('/ml/')) return 'ml';
        },

        // Optimize chunk file names for caching
        chunkFileNames: 'js/[name]-[hash].js',

        // Optimize entry file names
        entryFileNames: 'js/[name]-[hash].js',

        // More aggressive minification in CI
        ...(process.env.CI === 'true' && {
          compact: true,
          generatedCode: {
            preset: 'es2015',
            constBindings: true,
          },
        }),
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name || 'asset';
          if (/\.(css)$/.test(name)) {
            return 'css/[name]-[hash].[ext]';
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(name)) {
            return 'img/[name]-[hash].[ext]';
          }
          return 'assets/[name]-[hash].[ext]';
        },
      },

      // Tree shaking optimizations
      treeshake: {
        moduleSideEffects: (id) => {
          // Allow side effects for some libraries that need them
          if (id.includes('polyfill')) {
            return true;
          }
          // Recharts should not have side effects in initial bundle
          if (id.includes('recharts')) {
            return false; // Force tree-shaking for recharts
          }
          return false;
        },
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        // More aggressive tree shaking
        preset: 'smallest',
        unknownGlobalSideEffects: false,
        // More aggressive tree shaking settings
        annotations: true,
      },
    },

    // Additional aggressive optimizations
    chunkSizeWarningLimit: 100, // Further reduced to enforce smaller chunks (was 150)
    minify: 'esbuild',
    target: 'esnext',

    // Inline small assets (< 4KB) as data URIs to reduce HTTP requests
    assetsInlineLimit: 4096,

    // Compression and optimization
    cssCodeSplit: true,

    // Report compressed sizes to help with optimization
    reportCompressedSize: true,


  },
});
