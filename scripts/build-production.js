#!/usr/bin/env node
// 📦 Production Build - No Source Maps
// Build VitalSense without source maps to measure true bundle size

import { build } from 'esbuild';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Ensure dist directory exists
if (!existsSync(resolve(projectRoot, 'dist'))) {
  mkdirSync(resolve(projectRoot, 'dist'), { recursive: true });
}

console.log('📦 Building VitalSense for Production (No Source Maps)...');
console.log('=====================================================');

// Build CSS
console.log('🎨 Building optimized CSS...');
try {
  execSync(
    `npx postcss ${resolve(projectRoot, 'src/main.css')} -o ${resolve(projectRoot, 'dist/main.css')}`,
    { stdio: 'inherit', cwd: projectRoot }
  );

  try {
    execSync(
      `npx cssnano ${resolve(projectRoot, 'dist/main.css')} ${resolve(projectRoot, 'dist/main.css')}`,
      { stdio: 'inherit', cwd: projectRoot }
    );
    console.log('✅ CSS minified with cssnano');
  } catch (minifyError) {
    console.log('⚠️  CSS minification failed, using unminified');
  }
} catch (error) {
  console.error('❌ CSS build failed:', error.message);
  process.exit(1);
}

// Build main app WITHOUT source maps
console.log('📱 Building main app bundle...');
try {
  await build({
    entryPoints: [resolve(projectRoot, 'src/main.tsx')],
    bundle: true,
    minify: true,
    sourcemap: false, // 🚫 No source maps for production measurement
    format: 'esm',
    target: ['es2020'],
    outdir: resolve(projectRoot, 'dist'), // Use outdir for splitting
    splitting: true, // Enable code splitting for lazy components
    define: {
      'process.env.NODE_ENV': '"production"',
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true',
      'import.meta.env.VITE_AUTH0_DOMAIN': '"dev-qjdpc81dzr7xrnlu.us.auth0.com"',
      'import.meta.env.VITE_AUTH0_CLIENT_ID': '"YyCHkHZ11713YG7QsB518lHrCFE3bW1s"',
      'import.meta.env.VITE_AUTH0_REDIRECT_URI': '"https://health.andernet.dev/callback"',
      'import.meta.env.VITE_AUTH0_LOGOUT_URI': '"https://health.andernet.dev/login"',
      'import.meta.env.VITE_AUTH0_AUDIENCE': '"https://vitalsense-health-api"',
      'import.meta.env.VITE_ENVIRONMENT': '"production"',
    },
    loader: {
      '.tsx': 'tsx',
      '.ts': 'ts',
      '.css': 'css',
    },
    external: [],
  });

  console.log('✅ App build completed');
} catch (error) {
  console.error('❌ App build failed:', error.message);
  process.exit(1);
}

// Build worker WITHOUT source maps
console.log('⚙️  Building worker bundle...');
try {
  await build({
    entryPoints: [resolve(projectRoot, 'src/worker.ts')],
    bundle: true,
    minify: true,
    sourcemap: false, // 🚫 No source maps
    format: 'esm',
    target: ['es2020'],
    outfile: resolve(projectRoot, 'dist-worker/index.js'),
    define: {
      'process.env.NODE_ENV': '"production"',
    },
    loader: {
      '.ts': 'ts',
    },
    external: [],
  });

  console.log('✅ Worker build completed');
} catch (error) {
  console.error('❌ Worker build failed:', error.message);
  process.exit(1);
}

console.log('🎉 Production build completed successfully!');
console.log('📊 Run bundle measurement to see true production sizes');
