import { defineConfig, type Plugin } from 'vite';
import { resolve } from 'node:path';

// Plugin to exclude client-side files from worker build
function excludeClientFiles(): Plugin {
  const excludedPatterns = [
    /[/\\]App\.tsx$/,
    /[/\\]main\.tsx$/,
    /[/\\]lazyLoading\.(ts|tsx)$/,
    /[/\\]navigationHelpers\.(ts|tsx)$/,
    /[/\\]components[/\\]/,
    /[/\\]hooks[/\\]/,
    /\.tsx$/, // Exclude all .tsx files - worker should only use .ts
  ];

  function shouldExclude(id: string): boolean {
    // Handle both relative and absolute paths
    const normalizedId = id.replaceAll('\\', '/');
    // Check if it's an absolute path and extract the relevant part
    const pathPart = normalizedId.includes('/src/')
      ? normalizedId.substring(normalizedId.indexOf('/src/'))
      : normalizedId;
    return excludedPatterns.some(pattern => pattern.test(pathPart));
  }

  return {
    name: 'exclude-client-files',
    enforce: 'pre',
    resolveId(id, importer) {
      const resolvedId = id.startsWith('.') && importer
        ? resolve(importer, '..', id).replaceAll('\\', '/')
        : id;

      if (shouldExclude(resolvedId) || shouldExclude(id)) {
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
      entry: resolve(import.meta.dirname, 'src/worker.ts'),
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
        // Single-file bundle — Miniflare cannot resolve chunk imports
        inlineDynamicImports: true,
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
        },
      },
    },
    outDir: 'dist-worker',
    sourcemap: process.env.CI !== 'true',
  },
  resolve: {
    alias: {
      '@': resolve(import.meta.dirname, 'src'),
    },
  },
  esbuild: {
    // Worker shouldn't have JSX - completely disable JSX processing
    // This will cause an error if JSX is found, which helps catch issues early
    jsx: 'preserve',
  },
  // Use esbuild for faster builds, but configure it properly
  optimizeDeps: {
    exclude: [
      'react',
      'react-dom',
      'src/App.tsx',
      'src/main.tsx',
      'src/lib/lazyLoading.ts',
      'src/lib/navigationHelpers.ts',
    ],
  },
});
