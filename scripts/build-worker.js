#!/usr/bin/env node

import { build } from 'esbuild';
import { existsSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Ensure dist-worker directory exists
if (!existsSync(resolve(projectRoot, 'dist-worker'))) {
  mkdirSync(resolve(projectRoot, 'dist-worker'), { recursive: true });
}

// Simple alias plugin to resolve "@/" to the local src directory
const aliasAtPlugin = {
  name: 'alias-at',
  setup(buildCtx) {
    buildCtx.onResolve({ filter: /^@\// }, (args) => {
      const rel = args.path.slice(2); // remove '@/'
      const base = resolve(projectRoot, 'src', rel);
      // Try common file extensions and index files so bare imports work
      const candidates = [
        base,
        `${base}.ts`,
        `${base}.tsx`,
        `${base}.js`,
        `${base}.mjs`,
        resolve(base, 'index.ts'),
        resolve(base, 'index.tsx'),
        resolve(base, 'index.js'),
        resolve(base, 'index.mjs'),
      ];
      for (const p of candidates) {
        if (existsSync(p)) return { path: p };
      }
      // Fall back to base path (let esbuild report the missing file clearly)
      return { path: base };
    });
  },
};

// Build worker
try {
  await build({
    entryPoints: [resolve(projectRoot, 'src/worker.ts')],
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'esm',
    target: ['es2022'],
    platform: 'neutral',
    outfile: resolve(projectRoot, 'dist-worker/index.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    loader: {
      '.ts': 'ts',
    },
    external: [],
    plugins: [aliasAtPlugin],
  });

  console.log('✅ Worker build completed successfully');
} catch (error) {
  console.error('❌ Worker build failed:', error);
  process.exit(1);
}
