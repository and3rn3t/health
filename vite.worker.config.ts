import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import { readFileSync } from 'fs';

// Plugin to exclude client-side files from worker build
function excludeClientFiles(): Plugin {
  const excludedPatterns = [
    /[\/\\]App\.tsx$/,
    /[\/\\]main\.tsx$/,
    /[\/\\]lazyLoading\.(ts|tsx)$/,
    /[\/\\]navigationHelpers\.(ts|tsx)$/,
    /[\/\\]components[\/\\]/,
    /[\/\\]hooks[\/\\]/,
    /\.tsx$/, // Exclude all .tsx files - worker should only use .ts
  ];

  function shouldExclude(id: string): boolean {
    // Handle both relative and absolute paths
    const normalizedId = id.replace(/\\/g, '/');
    // Check if it's an absolute path and extract the relevant part
    const pathPart = normalizedId.includes('/src/')
      ? normalizedId.substring(normalizedId.indexOf('/src/'))
      : normalizedId;
    return excludedPatterns.some(pattern => pattern.test(pathPart));
  }

  return {
    name: 'exclude-client-files',
    enforce: 'pre', // Run before other plugins, especially before esbuild
    buildStart() {
      // Early interception - mark excluded files
      this.addWatchFile = () => {}; // Prevent watching excluded files
    },
    resolveId(id, importer) {
      // Handle both relative imports and absolute paths
      const resolvedId = id.startsWith('.') && importer
        ? resolve(importer, '..', id).replace(/\\/g, '/')
        : id;

      if (shouldExclude(resolvedId) || shouldExclude(id)) {
        // Return a virtual empty module to prevent processing
        return { id: '\0virtual:empty', external: false };
      }
      return null;
    },
    load(id) {
      if (id === '\0virtual:empty') {
        return 'export {};';
      }
      // Intercept file loading - return empty for excluded files
      // This prevents the file from being read from disk
      if (shouldExclude(id)) {
        return 'export {};';
      }
      return null;
    },
    // Intercept before load - this runs even earlier
    resolveDynamicImport(specifier, importer) {
      if (typeof specifier === 'string' && shouldExclude(specifier)) {
        return '\0virtual:empty';
      }
      return null;
    },
    // Intercept transform to prevent esbuild from processing these files
    // This MUST run before esbuild processes the file
    transform(code, id) {
      // Check both the id and try to resolve it
      const normalizedId = id.replace(/\\/g, '/');
      if (shouldExclude(normalizedId) || shouldExclude(id)) {
        // Return empty module to prevent processing
        // This should prevent esbuild from seeing the JSX
        return { code: 'export {};', map: null };
      }
      return null;
    },
    // Intercept module resolution to prevent these files from being loaded
    shouldTransformCachedModule({ id }) {
      if (shouldExclude(id)) {
        return false; // Don't transform excluded files
      }
      return undefined; // Let other plugins decide
    },
  };
}

export default defineConfig({
  plugins: [
    excludeClientFiles(),
    // Don't use React plugin for worker - worker shouldn't have JSX
    // react({
    //   jsxRuntime: 'classic',
    //   jsxImportSource: 'react',
    //   exclude: [
    //     /src\/App\.tsx/,
    //     /src\/main\.tsx/,
    //     /src\/lib\/lazyLoading\.ts/,
    //     /src\/lib\/navigationHelpers\.ts/,
    //     /src\/components\//,
    //     /src\/hooks\//,
    //   ],
    // }),
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/worker.ts'),
      name: 'worker',
      fileName: 'index',
      formats: ['es'],
    },
    // Exclude client-side files from being scanned
    commonjsOptions: {
      exclude: [
        '**/lazyLoading.ts',
        '**/navigationHelpers.ts',
        '**/components/**',
        '**/hooks/**',
      ],
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
          id.includes('/lazyLoading.') ||
          id.includes('/navigationHelpers.') ||
          id.includes('/components/') ||
          id.includes('/hooks/') ||
          id.endsWith('.tsx') // Exclude all .tsx files
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
    // Worker shouldn't have JSX - completely disable JSX processing
    // This will cause an error if JSX is found, which helps catch issues early
    jsx: 'preserve',
    // Exclude all .tsx files - worker should only use .ts
    exclude: [
      '**/*.tsx', // Exclude all .tsx files
    ],
  },
  // Use esbuild for faster builds, but configure it properly
  optimizeDeps: {
    exclude: ['react', 'react-dom'],
    esbuildOptions: {
      // Exclude client-side files from optimization
      exclude: [
        'src/App.tsx',
        'src/main.tsx',
        'src/lib/lazyLoading.ts',
        'src/lib/navigationHelpers.ts',
        'src/components/**',
        'src/hooks/**',
      ],
    },
  },
});
