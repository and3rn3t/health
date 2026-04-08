#!/usr/bin/env node
/**
 * smoke-test.mjs
 * Post-deploy health check for VitalSense Cloudflare Worker.
 * Hits critical endpoints and verifies expected responses.
 *
 * Usage:
 *   node scripts/deploy/smoke-test.mjs                         # defaults to dev
 *   node scripts/deploy/smoke-test.mjs --env production
 *   node scripts/deploy/smoke-test.mjs --url https://custom.example.com
 */
import { parseArgs } from 'node:util';

const { values } = parseArgs({
  options: {
    env: { type: 'string', default: 'development' },
    url: { type: 'string' },
    timeout: { type: 'string', default: '10000' },
  },
  strict: false,
});

const BASE_URLS = {
  development: 'https://health-app-dev.andernet.workers.dev',
  production: 'https://health.andernet.dev',
};

const baseUrl = values.url || BASE_URLS[values.env] || BASE_URLS.development;
const timeout = parseInt(values.timeout, 10);

let passed = 0;
let failed = 0;

async function probe(name, path, expect) {
  const url = `${baseUrl}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  try {
    const start = performance.now();
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'VitalSense-SmokeTest/1.0' },
    });
    const elapsed = Math.round(performance.now() - start);
    clearTimeout(timer);

    const body = res.headers.get('content-type')?.includes('json')
      ? await res.json()
      : await res.text();

    // Run assertions
    if (expect.status && res.status !== expect.status) {
      throw new Error(`Expected status ${expect.status}, got ${res.status}`);
    }
    if (expect.jsonField && body[expect.jsonField] !== expect.jsonValue) {
      throw new Error(`Expected ${expect.jsonField}="${expect.jsonValue}", got "${body[expect.jsonField]}"`);
    }
    if (expect.bodyIncludes && typeof body === 'string' && !body.includes(expect.bodyIncludes)) {
      throw new Error(`Response body missing "${expect.bodyIncludes}"`);
    }

    passed++;
    console.log(`  ✅ ${name} (${elapsed}ms)`);
  } catch (err) {
    clearTimeout(timer);
    failed++;
    const msg = err.name === 'AbortError' ? `Timeout after ${timeout}ms` : err.message;
    console.log(`  ❌ ${name}: ${msg}`);
  }
}

console.log(`\n🔍 Smoke testing ${baseUrl}\n`);

// ── Core endpoints ───────────────────────────────────────────
await probe('Health check', '/health', {
  status: 200,
  jsonField: 'status',
  jsonValue: 'healthy',
});

await probe('Static assets (index.html)', '/', {
  status: 200,
  bodyIncludes: 'VitalSense',
});

await probe('Auth0 diagnostics', '/api/auth0/health', {
  status: 200,
});

await probe('WebSocket probe (no upgrade)', '/ws', {
  status: 200,
});

// ── Security headers ─────────────────────────────────────────
{
  const url = `${baseUrl}/`;
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'VitalSense-SmokeTest/1.0' },
    });
    const csp = res.headers.get('content-security-policy');
    if (csp) {
      passed++;
      console.log('  ✅ CSP header present');
    } else {
      console.log('  ⚠️  CSP header missing (non-blocking)');
    }
  } catch {
    console.log('  ⚠️  Could not check security headers');
  }
}

// ── Summary ──────────────────────────────────────────────────
console.log(`\n${'─'.repeat(40)}`);
console.log(`  Passed: ${passed}  Failed: ${failed}`);

if (failed > 0) {
  console.error('\n❌ Smoke test failed. Check the deployment.\n');
  process.exit(1);
} else {
  console.log('\n🎉 All smoke tests passed!\n');
}
