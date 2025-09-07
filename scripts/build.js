#!/usr/bin/env node

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

// Build CSS with PostCSS and Tailwind
console.log('🎨 Building VitalSense CSS with PostCSS + Tailwind...');
try {
  // Try with minification first
  try {
    execSync(
      `npx postcss ${resolve(projectRoot, 'src/main.css')} -o ${resolve(projectRoot, 'dist/main.css')} --minify`,
      {
        stdio: 'inherit',
        cwd: projectRoot,
      }
    );
    console.log('✅ CSS build completed with minification');
  } catch (minifyError) {
    console.log('⚠️  Minification failed, trying without minify flag...');
    // Fallback without minification if lightningcss is not available
    execSync(
      `npx postcss ${resolve(projectRoot, 'src/main.css')} -o ${resolve(projectRoot, 'dist/main.css')}`,
      {
        stdio: 'inherit',
        cwd: projectRoot,
      }
    );
    console.log('✅ CSS build completed without minification');
  }
} catch (error) {
  console.error('❌ CSS build failed:', error.message);
  process.exit(1);
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
      'process.env.NODE_ENV': '"production"',
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true',
      'import.meta.env.VITE_AUTH0_DOMAIN':
        '"dev-qjdpc81dzr7xrnlu.us.auth0.com"',
      'import.meta.env.VITE_AUTH0_CLIENT_ID':
        '"YyCHkHZ11713YG7QsB518lHrCFE3bW1s"',
      'import.meta.env.VITE_AUTH0_REDIRECT_URI':
        '"https://health.andernet.dev/callback"',
      'import.meta.env.VITE_AUTH0_LOGOUT_URI':
        '"https://health.andernet.dev/login"',
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

  // Copy index.html template and update script reference
  const indexHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>VitalSense - Apple Health Insights & Fall Risk Monitor</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link
      href="https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap"
      rel="stylesheet"
    />
    <!-- Styles are imported via modules in src/main.tsx and bundled by ESBuild -->
    <script>
      (function () {
        try {
          var u = new URL(window.location.href);
          var hasCode = u.searchParams.has('code');
          var hasState = u.searchParams.has('state');
          if ((hasCode || hasState) && u.pathname !== '/callback') {
            window.location.replace('/callback' + u.search);
          }
        } catch (e) {
          // swallow early redirect normalization errors but log
          try {
            console.debug(
              'redirect-normalize failed',
              e && e.message ? e.message : e
            );
          } catch {}
        }
      })();
    </script>
    <script>
      // Load runtime app config without letting Vite try to bundle it
      (function () {
        try {
          var s = document.createElement('script');
          s.src = '/app-config.js';
          s.async = true;
          document.head.appendChild(s);
        } catch (e) {
          try {
            console.debug(
              'app-config loader failed',
              e && e.message ? e.message : e
            );
          } catch {}
        }
      })();
    </script>
    <script>
      // Inline fallbacks to avoid race conditions before app-config.js loads
      (function () {
        try {
          // Prefer local KV mode by default; /app-config.js may override
          // eslint-disable-next-line no-var
          var BASE_KV_SERVICE_URL = '';
          // Expose on window for libraries that read from globals
          window.BASE_KV_SERVICE_URL = BASE_KV_SERVICE_URL;
          window.__VITALSENSE_KV_MODE = 'local';
          // Auto-disable WS on demo routes
          if (location.pathname.indexOf('/demo') === 0) {
            window.VITALSENSE_DISABLE_WEBSOCKET = true;
          }
        } catch (e) {
          try {
            console.debug(
              'inline-fallback failed',
              e && e.message ? e.message : e
            );
          } catch {}
        }
      })();
    </script>
    <script type="module" src="/main.js?v=${Date.now()}"></script>
    <link rel="stylesheet" href="/main.css?v=${Date.now()}">
  </head>

  <body>
    <div id="spark-app" class="min-h-screen bg-background text-foreground">
      <div id="root"></div>
    </div>
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
