#!/usr/bin/env node
/**
 * check-openapi-drift.mjs
 *
 * Validates that the OpenAPI spec served by the Worker matches all
 * registered Hono routes. Detects undocumented routes that may have
 * been added without updating the spec.
 *
 * Usage:
 *   node scripts/ci/check-openapi-drift.mjs
 *
 * Exits non-zero if any public routes are missing from the spec.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const routesDir = resolve(repoRoot, 'src/worker/routes');

/**
 * Extract route paths from Hono route files by scanning for
 * route.get/post/put/delete('/path', ...) patterns.
 */
function extractRoutePaths(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const routes = [];
  // Match route.METHOD('/path' or route.METHOD("/path
  const regex = /route\.(get|post|put|delete|patch)\(\s*['"]([^'"]+)['"]/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    routes.push({ method: match[1].toUpperCase(), path: match[2] });
  }
  return routes;
}

/**
 * Extract documented paths from the OpenAPI spec file.
 */
function extractSpecPaths(filePath) {
  const content = readFileSync(filePath, 'utf-8');
  const documented = new Set();

  // Match property keys in buildPaths() — lines like: '/api/live/gait': {
  const pathRegex = /['"](\/(api\/|health|ws|callback)[^'"]*)['"]\s*:\s*\{/g;
  let match;
  while ((match = pathRegex.exec(content)) !== null) {
    // Normalize: /api/kv/{key} <-> /api/kv/:key
    const normalized = match[1].replace(/\{([^}]+)\}/g, ':$1');
    documented.add(normalized);
  }
  return documented;
}

// Routes intentionally excluded from OpenAPI documentation
const EXCLUDED_ROUTES = new Set([
  // Dev-only diagnostics
  '/api/_selftest',
  '/api/_error',
  '/api/_analytics_ping',
  '/api/_diagnostics',
  '/api/_ratelimit',
  '/api/_audit',
  '/api/_purge',
  '/api/_debug/version-mismatch-events',
  // Demo mode (not an API)
  '/demo',
  '/demo/enable',
  '/demo/disable',
  '/demo-static',
  // Internal auth callback / redirects
  '/callback',
  '/login',
  '/auth/login',
  '/_force-login',
  '/api/auth0/health',
  '/auth0/health',
  // OpenAPI docs themselves
  '/api/docs',
  '/api/docs/openapi.json',
  // Internal app config (loaded via <script>)
  '/app-config.js',
  // Internal WS helpers (auth-derived, not public API)
  '/api/ws-device-token',
  '/api/ws-user-id',
  // LiDAR (internal iOS bridge)
  '/api/lidar/ingest',
  // Client analytics (internal)
  '/api/client-analytics/version-mismatch',
  // Legacy endpoints
  '/api/health-data',
  '/_spark/loaded',
]);

// Collect all routes from route files
const routeFiles = readdirSync(routesDir).filter(
  (f) => f.endsWith('.ts') && f !== 'openapi.ts'
);

const allRoutes = [];
for (const file of routeFiles) {
  const routes = extractRoutePaths(resolve(routesDir, file));
  allRoutes.push(...routes.map((r) => ({ ...r, file })));
}

// Get documented paths from the spec
const specFile = resolve(routesDir, 'openapi.ts');
const documented = extractSpecPaths(specFile);

// Check for undocumented routes
let hasErrors = false;
const undocumented = [];

for (const route of allRoutes) {
  if (EXCLUDED_ROUTES.has(route.path)) continue;
  // Normalize Hono :param to OpenAPI {param} style
  const normalized = route.path;
  if (!documented.has(normalized)) {
    undocumented.push(route);
    hasErrors = true;
  }
}

if (undocumented.length > 0) {
  console.error('\n❌ OpenAPI spec drift detected!\n');
  console.error('The following routes are not documented in the OpenAPI spec:\n');
  for (const r of undocumented) {
    console.error(`  ${r.method.padEnd(7)} ${r.path}  (${r.file})`);
  }
  console.error(
    '\nAdd these to src/worker/routes/openapi.ts or to the EXCLUDED_ROUTES'
  );
  console.error('set in scripts/ci/check-openapi-drift.mjs if intentionally omitted.\n');
} else {
  console.log('✅ OpenAPI spec covers all public routes');
  console.log(`   ${documented.size} paths documented, ${allRoutes.length} routes scanned`);
}

process.exit(hasErrors ? 1 : 0);
