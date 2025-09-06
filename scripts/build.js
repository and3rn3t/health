#!/usr/bin/env node

import { build } from 'esbuild';
import { existsSync, mkdirSync, writeFileSync, copyFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Ensure dist directory exists
if (!existsSync(resolve(projectRoot, 'dist'))) {
  mkdirSync(resolve(projectRoot, 'dist'), { recursive: true });
}

// Build main app
try {
  await build({
    entryPoints: [resolve(projectRoot, 'src/main.tsx')],
    bundle: true,
    minify: true,
    sourcemap: true,
    format: 'esm',
    target: ['es2020'],
    outfile: resolve(projectRoot, 'dist/main.js'),
    define: {
      'process.env.NODE_ENV': '"production"'
    },
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css'
    },
    external: []
  });

  // Copy index.html and update script reference
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VitalSense Health Monitor</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.js"></script>
  </body>
</html>`;

  writeFileSync(resolve(projectRoot, 'dist/index.html'), indexHtml);

  console.log('✅ App build completed successfully');

  // Now build worker
  await import('./build-worker.js');

} catch (error) {
  console.error('❌ Build failed:', error);
  process.exit(1);
}
