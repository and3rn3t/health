#!/usr/bin/env node

import { build } from 'esbuild';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🔍 Testing simplified App.tsx build...');

try {
  await build({
    entryPoints: [resolve(projectRoot, 'src/App.tsx')],
    bundle: false,
    minify: false,
    format: 'esm',
    target: ['es2020'],
    outfile: resolve(projectRoot, 'dist/App-test.js'),
    jsx: 'automatic',
    jsxImportSource: 'react',
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
    },
    logLevel: 'verbose',
  });

  console.log('✅ App.tsx build succeeded');
} catch (error) {
  console.error('❌ App.tsx build failed:', error);
  console.error('Error details:', JSON.stringify(error, null, 2));
}
