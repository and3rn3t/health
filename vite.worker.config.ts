import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// Plugin to exclude client-side files from worker build
function excludeClientFiles(): Plugin {
  return {
    name: 'exclude-client-files',
    enforce: 'pre', // Run before other plugins
    resolveId(id, importer) {
      // Exclude client-side files that shouldn't be in worker
      if (
        id.includes('/App.tsx') ||
        id.includes('/main.tsx') ||
        id.includes('/lazyLoading.ts') ||
        id.includes('/navigationHelpers.ts') ||
        id.includes('/components/') ||
        id.includes('/hooks/')
      ) {
        // Return a virtual empty module to prevent processing
        return { id: '\0virtual:empty', external: false };
      }
      return null;
    },
    load(id) {
      if (id === '\0virtual:empty') {
        return 'export {};';
      }
      return null;
    },
  };
}

export default defineConfig({
  plugins: [
    excludeClientFiles(),
    react({
      // Only transform JSX, don't include React runtime in worker
      jsxRuntime: 'classic',
      jsxImportSource: 'react',
      // Exclude client-side files that shouldn't be in worker
      exclude: [
        /src\/App\.tsx/,
        /src\/main\.tsx/,
        /src\/lib\/lazyLoading\.ts/,
        /src\/lib\/navigationHelpers\.ts/,
        /src\/components\//,
        /src\/hooks\//,
      ],
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
      external: (id) => {
        // Externalize React and Cloudflare Workers
        if (id === 'cloudflare:workers' || id === 'react' || id === 'react-dom') {
          return true;
        }
        // Externalize client-side files (they shouldn't be in worker)
        if (
          id.includes('/App.tsx') ||
          id.includes('/main.tsx') ||
          id.includes('/lazyLoading.ts') ||
          id.includes('/navigationHelpers.ts') ||
          id.includes('/components/') ||
          id.includes('/hooks/')
        ) {
          return true;
        }
        return false;
      },
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
