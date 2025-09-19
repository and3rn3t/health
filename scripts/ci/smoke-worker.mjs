#!/usr/bin/env node
/**
 * smoke-worker.mjs - Miniflare based smoke test for the worker bundle.
 */
import { Miniflare } from 'miniflare';
import fs from 'node:fs';
import fetch from 'node-fetch';

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
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  return false;
}

async function main() {
  console.log('🚀 Starting Miniflare worker smoke');
  const mf = new Miniflare({
    scriptPath: entry,
    modules: true,
    port: 8790,
    bindings: { DEVICE_JWT_SECRET: 'ci-smoke' },
  });
  const base = 'http://127.0.0.1:8790';
  const ok = await wait(base + '/health');
  if (!ok) {
    console.error('❌ /health unavailable');
    await mf.dispose();
    process.exit(1);
  }
  console.log('✅ /health');
  try {
    const r = await fetch(base + '/api/_analytics_ping');
    if (r.ok) console.log('✅ /api/_analytics_ping'); else console.log('ℹ️  /api/_analytics_ping status', r.status);
  } catch {
    console.log('ℹ️  /api/_analytics_ping not present');
  }
  await mf.dispose();
  console.log('🏁 Smoke complete');
}

main().catch((e) => {
  console.error('❌ Smoke failed', e);
  process.exit(1);
});
