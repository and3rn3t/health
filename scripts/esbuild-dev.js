#!/usr/bin/env node

/**
 * ESBuild Development Server
 * Serves the app with hot reloading using esbuild + simple HTTP server
 */

import esbuild from 'esbuild';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import fs from 'fs';
import path from 'path';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

console.log('🚀 VitalSense Development Server (ESBuild)');
console.log('==========================================\n');

// Ensure dist directory exists
if (!existsSync(resolve(projectRoot, 'dist'))) {
  mkdirSync(resolve(projectRoot, 'dist'), { recursive: true });
}

// Build CSS function
async function buildCSS() {
  console.log('🎨 Building CSS...');
  try {
    execSync(
      `npx postcss ${resolve(projectRoot, 'src/main.css')} -o ${resolve(projectRoot, 'dist/main.css')}`,
      {
        stdio: 'inherit',
        cwd: projectRoot,
      }
    );
    console.log('✅ CSS build completed');
  } catch (error) {
    console.error('❌ CSS build failed:', error.message);
    throw error;
  }
}

// Build JS function
async function buildJS() {
  const buildOptions = {
    entryPoints: [resolve(projectRoot, 'src/main.tsx')],
    outfile: resolve(projectRoot, 'dist/main.js'), // Changed from outdir to outfile
    bundle: true,
    format: 'esm',
    target: 'es2020',
    sourcemap: true,
    minify: false,
    jsx: 'automatic',
    define: {
      'process.env.NODE_ENV': '"development"',
    },
    loader: {
      '.png': 'file',
      '.jpg': 'file',
      '.jpeg': 'file',
      '.gif': 'file',
      '.svg': 'file',
      '.woff': 'file',
      '.woff2': 'file',
      '.ttf': 'file',
      '.eot': 'file',
    },
    resolveExtensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      '@': resolve(projectRoot, 'src'),
    },
    plugins: [
      {
        name: 'rebuild-notify',
        setup(build) {
          build.onEnd((result) => {
            const now = new Date().toLocaleTimeString();
            if (result.errors.length > 0) {
              console.log(`[${now}] ❌ Build failed with ${result.errors.length} errors`);
            } else {
              console.log(`[${now}] ✅ Build completed successfully`);
            }
          });
        },
      },
    ],
  };

  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();
  return ctx;
}

// Copy HTML file and update paths
function copyHTML() {
  let htmlContent = readFileSync(resolve(projectRoot, 'index.html'), 'utf8');
  
  // Update the script src to point to the built file
  htmlContent = htmlContent.replace(
    '<script type="module" src="/src/main.tsx"></script>',
    '<script type="module" src="/main.js"></script>'
  );
  
  writeFileSync(resolve(projectRoot, 'dist/index.html'), htmlContent);
}

// Simple HTTP server
function createServer() {
  const server = http.createServer((req, res) => {
    let filePath = req.url === '/' ? '/index.html' : req.url;
    filePath = resolve(projectRoot, 'dist' + filePath);

    const extname = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html',
      '.js': 'text/javascript',
      '.css': 'text/css',
      '.json': 'application/json',
      '.png': 'image/png',
      '.jpg': 'image/jpg',
      '.gif': 'image/gif',
      '.svg': 'image/svg+xml',
      '.wav': 'audio/wav',
      '.mp4': 'video/mp4',
      '.woff': 'application/font-woff',
      '.ttf': 'application/font-ttf',
      '.eot': 'application/vnd.ms-fontobject',
      '.otf': 'application/font-otf',
      '.wasm': 'application/wasm'
    };

    const contentType = mimeTypes[extname] || 'application/octet-stream';

    fs.readFile(filePath, (error, content) => {
      if (error) {
        if (error.code === 'ENOENT') {
          // File not found, serve index.html for SPA routing
          fs.readFile(resolve(projectRoot, 'dist/index.html'), (error, content) => {
            if (error) {
              res.writeHead(500);
              res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
            } else {
              res.writeHead(200, { 'Content-Type': 'text/html' });
              res.end(content, 'utf-8');
            }
          });
        } else {
          res.writeHead(500);
          res.end('Sorry, check with the site admin for error: ' + error.code + ' ..\n');
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
  });

  return server;
}

// Kill any process using the port
async function killPortProcesses(port) {
  try {
    if (process.platform === 'win32') {
      // Windows approach - get PID and kill it
      console.log(`🔧 Checking for processes using port ${port}...`);
      const output = execSync(`netstat -ano | findstr :${port}`, { stdio: 'pipe', encoding: 'utf8' });
      const lines = output.split('\n').filter(line => line.trim());
      
      for (const line of lines) {
        const parts = line.trim().split(/\s+/);
        const pid = parts[parts.length - 1];
        if (pid && pid !== '0') {
          console.log(`🔧 Killing process ${pid} using port ${port}...`);
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'pipe' });
        }
      }
    } else {
      // Unix/Linux/Mac approach
      execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'pipe' });
    }
    console.log(`✅ Port ${port} cleared successfully`);
    // Wait a moment for the port to be fully released
    await new Promise(resolve => setTimeout(resolve, 1000));
  } catch (_error) {
    // No processes found on the port, which is fine
    console.log(`ℹ️  Port ${port} is available`);
  }
}

async function main() {
  try {
    // Initial build
    await buildCSS();
    copyHTML();
    
    // Copy app-config.js to dist
    const appConfigContent = readFileSync(resolve(projectRoot, 'app-config.js'), 'utf8');
    writeFileSync(resolve(projectRoot, 'dist/app-config.js'), appConfigContent);
    
    console.log('🏗️  Starting development build...\n');
    
    // Start esbuild in watch mode
    global.esbuildCtx = await buildJS();

    // Kill any processes using our port
    const port = process.env.PORT || 5173;
    await killPortProcesses(port);

    // Start HTTP server
    const server = createServer();
    
    server.listen(port, () => {
      console.log(`\n🎉 Development server started successfully!`);
      console.log(`🌐 Local: http://localhost:${port}`);
      console.log(`📁 Serving: ${resolve(projectRoot, 'dist')}`);
      console.log('\n💡 Development Features:');
      console.log('   • Auto-rebuild on file changes');
      console.log('   • Source maps available');
      console.log('   • SPA routing support');
      console.log('\n📝 Notes:');
      console.log('   • WebSocket server: ws://localhost:3001 (start separately if needed)');
      console.log('   • Press Ctrl+C to stop the server');
      console.log('\n🔄 Watching for changes...\n');
    });

    // Watch for CSS changes
    const chokidar = await import('chokidar');
    const cssWatcher = chokidar.watch(resolve(projectRoot, 'src/**/*.css'), {
      ignored: /(^|[/\\])\../,
      persistent: true
    });

    cssWatcher.on('change', (filePath) => {
      console.log(`🎨 CSS file changed: ${filePath.replace(projectRoot, '')}`);
      buildCSS().catch(console.error);
    });

    // Watch for HTML changes
    const htmlWatcher = chokidar.watch(resolve(projectRoot, 'index.html'), {
      persistent: true
    });

    htmlWatcher.on('change', () => {
      console.log(`📄 HTML file changed, copying to dist/`);
      copyHTML();
    });

  } catch (error) {
    console.error('❌ Failed to start development server:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down development server...');
  if (global.esbuildCtx) {
    await global.esbuildCtx.dispose();
  }
  process.exit(0);
});

main();
