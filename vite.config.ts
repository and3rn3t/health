import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { defineConfig } from 'vite';

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname;
const isDev =
  process.env.NODE_ENV !== 'production' &&
  process.env.BUILD !== 'production' &&
  process.env.CI !== 'true';

export default defineConfig({
  // Ensure Tailwind uses JS implementation (no native oxide binding)
  define: {
    'process.env.TAILWIND_DISABLE_OXIDE': JSON.stringify('1'),
    __APP_VERSION__: JSON.stringify(
      process.env.npm_package_version || '0.0.0-dev'
    ),
    // Disable RUM in dev to avoid 404s for /api/_perf_ingest
    __RUM_SAMPLE_RATE__: JSON.stringify(
      process.env.RUM_SAMPLE_RATE || (isDev ? '0' : '1')
    ),
  },
  plugins: [react()],
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
      pure: ['console.log', 'console.info', 'console.debug'],
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
    sourcemap: process.env.CI === 'true' ? false : true,
    // Aggressive bundle size optimizations for CI compliance
    rollupOptions: {
      output: {
        // Very aggressive chunk splitting to keep each chunk under 200KB (reduced from 400KB)
        // This ensures faster initial load by splitting large libraries into separate chunks
        manualChunks: (id) => {
          // Vendor libraries - ultra-granular splitting
          if (id.includes('node_modules')) {
            // React ecosystem - extremely granular
            if (
              id.includes('react-dom/client') ||
              id.includes('react-dom/server')
            ) {
              return 'react-dom-client';
            }
            if (
              id.includes('react-dom/cjs/react-dom.production') ||
              id.includes('react-dom.production')
            ) {
              return 'react-dom-core';
            }
            if (id.includes('react-dom/cjs') || id.includes('react-dom/lib')) {
              return 'react-dom-internals';
            }
            if (id.includes('react-dom')) {
              return 'react-dom-misc';
            }
            if (
              id.includes('react/jsx-runtime') ||
              id.includes('react/jsx-dev-runtime')
            ) {
              return 'react-jsx';
            }
            if (id.includes('react/cjs') || id.includes('react.production')) {
              return 'react-core';
            }
            if (id.includes('react')) {
              return 'react-misc';
            }

            // UI Libraries
            if (
              id.includes('@radix-ui/react-dialog') ||
              id.includes('@radix-ui/react-alert-dialog')
            ) {
              return 'radix-dialogs';
            }
            if (
              id.includes('@radix-ui/react-select') ||
              id.includes('@radix-ui/react-dropdown-menu')
            ) {
              return 'radix-menus';
            }
            if (
              id.includes('@radix-ui/react-tabs') ||
              id.includes('@radix-ui/react-accordion')
            ) {
              return 'radix-navigation';
            }
            if (id.includes('@radix-ui')) {
              return 'radix-core';
            }

            // Data & State
            if (id.includes('@tanstack/react-query')) {
              return 'react-query';
            }
            if (id.includes('zustand') || id.includes('jotai')) {
              return 'state-mgmt';
            }

            // Large ML/Data Visualization Libraries - Split separately (VERY LARGE)
            // These should ideally be lazy-loaded and not in initial bundle
            if (id.includes('@tensorflow/tfjs')) {
              return 'tensorflow'; // TensorFlow is huge (~500KB+) - lazy load in ML features
            }
            if (id.includes('three')) {
              return 'three-js'; // Three.js is large (~200KB+) - lazy load in 3D visualizations
            }
            if (id.includes('recharts')) {
              return 'recharts-lazy'; // Recharts is large (~150KB+) - should be lazy-loaded
            }
            if (id.includes('/d3-') || id.includes('/d3/')) {
              return 'd3-lib'; // D3 is large (~150KB+) - lazy load for advanced charts
            }
            if (id.includes('framer-motion')) {
              return 'framer-motion'; // Framer Motion is medium-large (~100KB+) - lazy load
            }

            // Icons - separate large icon libraries (lucide-react is ~100KB+)
            // Consider using individual icon imports instead of full library
            if (id.includes('lucide-react')) {
              return 'lucide-icons'; // ~100KB+ - should use individual imports
            }
            if (id.includes('@phosphor-icons')) {
              return 'phosphor-icons'; // Large - consider removing if not used
            }
            if (id.includes('react-icons')) {
              return 'react-icons'; // Very large - consider removing if not used
            }
            if (id.includes('@heroicons/react')) {
              return 'heroicons'; // Large - consider individual imports
            }

            // Utilities
            if (
              id.includes('date-fns') ||
              id.includes('moment') ||
              id.includes('dayjs')
            ) {
              return 'date-utils';
            }
            if (id.includes('lodash') || id.includes('ramda')) {
              return 'fp-utils';
            }
            if (id.includes('zod') || id.includes('yup')) {
              return 'validation';
            }

            // Remaining vendor code
            return 'vendor-misc';
          }

          // Feature-based splitting - very granular
          if (
            id.includes('AdvancedAnalytics') ||
            id.includes('analytics/advanced')
          ) {
            return 'analytics-advanced';
          }
          if (id.includes('analytics') || id.includes('/analytics/')) {
            return 'analytics-core';
          }

          // Health features
          if (
            id.includes('HealthDashboard') ||
            id.includes('health/dashboard')
          ) {
            return 'health-dashboard';
          }
          if (id.includes('gait') || id.includes('Gait')) {
            return 'health-gait';
          }
          if (id.includes('fall') || id.includes('Fall')) {
            return 'health-fall';
          }
          if (id.includes('health') || id.includes('/health/')) {
            return 'health-core';
          }

          // Large application components - move out of main bundle
          if (id.includes('DeveloperTools') || id.includes('DevDiagnostics')) {
            return 'dev-tools';
          }
          if (id.includes('SettingsPanel') || id.includes('settings')) {
            return 'settings';
          }
          if (id.includes('LandingPage') || id.includes('landing')) {
            return 'landing';
          }
          if (id.includes('OnboardingFlow') || id.includes('onboarding')) {
            return 'onboarding';
          }
          if (id.includes('EmergencyContacts') || id.includes('emergency')) {
            return 'emergency';
          }
          if (id.includes('ExportData') || id.includes('export')) {
            return 'data-export';
          }
          if (id.includes('PrivacyControls') || id.includes('privacy')) {
            return 'privacy';
          }
          if (
            id.includes('NotificationCenter') ||
            id.includes('notifications')
          ) {
            return 'notifications';
          }
          if (id.includes('ConnectedDevices') || id.includes('devices')) {
            return 'devices';
          }

          // VitalSense features
          if (id.includes('VitalSense') || id.includes('/vitalsense/')) {
            return 'vitalsense';
          }

          // LiDAR and ML - these are typically large
          if (id.includes('CompleteLiDAR') || id.includes('EnhancedLiDAR')) {
            return 'lidar-advanced';
          }
          if (id.includes('lidar') || id.includes('/lidar/')) {
            return 'lidar-core';
          }
          if (id.includes('MLWasm') || id.includes('ml/wasm')) {
            return 'ml-wasm';
          }
          if (id.includes('ml') || id.includes('/ml/')) {
            return 'ml-core';
          }

          // UI Components
          if (id.includes('/ui/') && id.includes('vitalsense-components')) {
            return 'ui-vitalsense';
          }
          if (id.includes('/ui/')) {
            return 'ui-components';
          }

          // Utilities
          if (id.includes('/hooks/')) {
            return 'hooks';
          }
          if (id.includes('/lib/')) {
            return 'lib-utils';
          }

          // Default fallback
          return 'app-core';
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
          if (id.includes('@tensorflow') || id.includes('polyfill')) {
            return true;
          }
          return false;
        },
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        // More aggressive tree shaking
        preset: 'smallest',
        unknownGlobalSideEffects: false,
      },
    },

    // Additional aggressive optimizations
    chunkSizeWarningLimit: 150, // Further reduced to enforce smaller chunks (was 200)
    minify: 'esbuild',
    target: 'esnext',

    // Reduce asset inlining to allow better code splitting
    assetsInlineLimit: process.env.CI === 'true' ? 2048 : 4096,

    // Compression and optimization
    cssCodeSplit: true,

    // Report compressed sizes to help with optimization
    reportCompressedSize: true,

    // Enable terser-style minification for better compression
    terserOptions: process.env.CI === 'true' ? {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        passes: 3, // Multiple passes for better optimization
      },
      format: {
        comments: false,
      },
    } : undefined,
  },
});
