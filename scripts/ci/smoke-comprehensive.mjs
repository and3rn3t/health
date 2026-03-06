#!/usr/bin/env node
/**
 * Comprehensive smoke test for the worker bundle
 * Tests critical endpoints and functionality
 */
import { Miniflare } from 'miniflare';
import fs from 'node:fs';

const entry = 'dist-worker/index.js';
if (!fs.existsSync(entry)) {
  console.error('❌ dist-worker/index.js not found. Build worker first.');
  process.exit(2);
}

async function wait(url, timeout = 20000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const r = await fetch(url);
      if (r.ok) return true;
    } catch {
      /* retry */
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function testEndpoint(mf, path, method = 'GET', body = null) {
  const base = 'http://127.0.0.1:8794';
  try {
    const options = {
      method,
      headers: {
        Origin: 'https://health.andernet.dev',
        ...(body && { 'Content-Type': 'application/json' }),
      },
    };
    if (body) {
      options.body = JSON.stringify(body);
    }
    const r = await fetch(base + path, options);
    return { path, status: r.status, ok: r.ok };
  } catch (e) {
    return { path, status: 0, ok: false, error: e.message };
  }
}

async function main() {
  console.log('🚀 Starting comprehensive worker smoke test');
  const mf = new Miniflare({
    scriptPath: entry,
    modules: true,
    port: 8794,
    bindings: {
      ENVIRONMENT: 'development',
      ALLOWED_ORIGINS: 'https://health.andernet.dev',
      ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
      API_ISS: 'test-issuer',
      API_AUD: 'test-audience',
      DEVICE_JWT_SECRET: 'ci-smoke-secret',
      BASE_URL: 'http://127.0.0.1:8794',
    },
    kvNamespaces: ['HEALTH_KV'],
    r2Buckets: ['HEALTH_STORAGE'],
    durableObjects: {
      RATE_LIMITER: 'RateLimiter',
      HEALTH_WEBSOCKET: 'HealthWebSocket',
    },
  });

  const base = 'http://127.0.0.1:8794';

  // Wait for worker to be ready
  const ok = await wait(base + '/health');
  if (!ok) {
    console.error('❌ /health unavailable');
    await mf.dispose();
    process.exit(1);
  }
  console.log('✅ /health');

  // Test critical endpoints
  const endpoints = [
    { path: '/health', method: 'GET' },
    { path: '/app-config.js', method: 'GET' },
    { path: '/api/ws-url', method: 'GET' },
    { path: '/api/ws-live-enabled', method: 'GET' },
    {
      path: '/api/ws-device-token',
      method: 'POST',
      body: { deviceId: 'smoke-test-device' },
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const endpoint of endpoints) {
    const result = await testEndpoint(mf, endpoint.path, endpoint.method, endpoint.body);
    if (result.ok || result.status < 500) {
      console.log(`✅ ${endpoint.method} ${endpoint.path} (${result.status})`);
      passed++;
    } else {
      console.log(`❌ ${endpoint.method} ${endpoint.path} (${result.status})`);
      if (result.error) {
        console.log(`   Error: ${result.error}`);
      }
      failed++;
    }
  }

  // Test analytics ping if available
  try {
    const r = await fetch(base + '/api/_analytics_ping');
    if (r.ok) {
      console.log('✅ /api/_analytics_ping');
      passed++;
    } else {
      console.log(`ℹ️  /api/_analytics_ping status ${r.status}`);
    }
  } catch {
    console.log('ℹ️  /api/_analytics_ping not present');
  }

  await mf.dispose();

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) {
    console.error('❌ Smoke test failed');
    process.exit(1);
  }
  console.log('🏁 Comprehensive smoke test complete');
}

main().catch((e) => {
  console.error('❌ Smoke test failed', e);
  process.exit(1);
});

