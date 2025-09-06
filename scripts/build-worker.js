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
  });

  console.log('✅ Worker build completed successfully');
} catch (error) {
  console.error('❌ Worker build failed:', error);
  process.exit(1);
}
