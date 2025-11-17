import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';

// Plugin to exclude client-side files from worker build
function excludeClientFiles(): Plugin {
  const excludedPatterns = [
    /[\/\\]App\.tsx$/,
    /[\/\\]main\.tsx$/,
    /[\/\\]lazyLoading\.ts$/,
    /[\/\\]navigationHelpers\.ts$/,
    /[\/\\]components[\/\\]/,
    /[\/\\]hooks[\/\\]/,
  ];

  function shouldExclude(id: string): boolean {
    const normalizedId = id.replace(/\\/g, '/');
    return excludedPatterns.some(pattern => pattern.test(normalizedId));
  }

  return {
    name: 'exclude-client-files',
    enforce: 'pre', // Run before other plugins, especially before esbuild
    resolveId(id, importer) {
      if (shouldExclude(id)) {
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
    // Intercept transform to prevent esbuild from processing these files
    transform(code, id) {
      if (shouldExclude(id)) {
        // Return empty module to prevent processing
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
    // Disable JSX transformation - worker shouldn't have JSX
    // If JSX is found, it means client-side files are being included (which is an error)
    jsx: 'preserve', // Don't transform JSX - this will cause an error if JSX is present
    // Exclude client-side files from esbuild processing
    exclude: [
      '**/App.tsx',
      '**/main.tsx',
      '**/lazyLoading.ts',
      '**/navigationHelpers.ts',
      '**/components/**',
      '**/hooks/**',
    ],
    // Use loader to skip JSX files entirely
    loader: {
      '.tsx': 'ts', // Treat .tsx as .ts to skip JSX processing
    },
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
