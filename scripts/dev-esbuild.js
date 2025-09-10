#!/usr/bin/env node

import { context } from 'esbuild';
import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname, extname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🚀 Starting VitalSense esbuild Development Server...');

// Build CSS first
console.log('🎨 Building CSS with PostCSS + Tailwind...');
try {
  execSync(
    `npx postcss ${resolve(projectRoot, 'src/main.css')} -o ${resolve(projectRoot, 'dist/main.css')}`,
    {
      stdio: 'inherit',
      cwd: projectRoot,
    }
  );
  console.log('✅ CSS built successfully');
} catch (error) {
  console.error('❌ CSS build failed:', error.message);
  process.exit(1);
}

// Create esbuild context for watch mode
const ctx = await context({
  entryPoints: [resolve(projectRoot, 'src/main.tsx')],
  bundle: true,
  outdir: resolve(projectRoot, 'dist'),
  format: 'esm',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: false,
  loader: {
    '.png': 'file',
    '.jpg': 'file',
    '.jpeg': 'file',
    '.svg': 'file',
    '.gif': 'file',
    '.woff': 'file',
    '.woff2': 'file',
    '.eot': 'file',
    '.ttf': 'file',
  },
  define: {
    'process.env.NODE_ENV': '"development"',
  },
  jsxFactory: 'React.createElement',
  jsxFragment: 'React.Fragment',
  external: [],
});

// Watch for changes
await ctx.watch();
console.log('👀 Watching for file changes...');

// Simple HTTP server
const server = createServer((req, res) => {
  const url = req.url === '/' ? '/index.html' : req.url;
  const filePath = resolve(projectRoot, url.startsWith('/') ? url.slice(1) : url);

  // Handle specific routes
  if (url === '/index.html' || url === '/') {
    const indexPath = resolve(projectRoot, 'index.html');
    if (existsSync(indexPath)) {
      const content = readFileSync(indexPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(content);
      return;
    }
  }

  // Handle CSS
  if (url === '/main.css') {
    const cssPath = resolve(projectRoot, 'dist/main.css');
    if (existsSync(cssPath)) {
      const content = readFileSync(cssPath, 'utf-8');
      res.writeHead(200, { 'Content-Type': 'text/css' });
      res.end(content);
      return;
    }
  }

  // Handle JS
  if (url === '/src/main.tsx' || url === '/main.js') {
    const jsPath = resolve(projectRoot, 'dist/main.js');
    if (existsSync(jsPath)) {
      const content = readFileSync(jsPath, 'utf-8');
      res.writeHead(200, {
        'Content-Type': 'application/javascript',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(content);
      return;
    }
  }

  // Handle other static files
  if (existsSync(filePath)) {
    const content = readFileSync(filePath);
    const ext = extname(filePath);
    const contentType = {
      '.html': 'text/html',
      '.js': 'application/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.gif': 'image/gif',
    }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

const PORT = 5173;
server.listen(PORT, () => {
  console.log(`✅ VitalSense development server running at http://localhost:${PORT}`);
  console.log('🎯 Priority 3 iOS 26 Advanced Navigation should be accessible');
});

// Cleanup on exit
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down development server...');
  await ctx.dispose();
  server.close();
  process.exit(0);
});
