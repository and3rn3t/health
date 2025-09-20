#!/usr/bin/env node
/**
 * Lightweight performance SLO probe.
 * Currently measures:
 *  - Total gzipped JS bundle size (re-uses dist if present, else builds)
 *  - Count + size of CSS bundle (gzipped)
 *  - Simple import latency timing for a representative module (src/main.tsx)
 * Produces reports/perf-slo.json for trend tracking.
 * Future: hook into synthetic page load via playwright, Core Web Vitals emulation.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { performance } from 'node:perf_hooks';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const distDir = path.join(root, 'dist');

function ensureBuild() {
  if (fs.existsSync(distDir) && fs.readdirSync(distDir).length > 0) {
    return;
  }
  console.log('🏗️  Building app (no existing dist)...');
  // Use pnpm exec to ensure the correct shim is used (avoids bash shebang parse issues on some runners)
  const res = spawnSync('pnpm', ['exec', 'vite', 'build'], { stdio: 'inherit' });
  if (res.status !== 0) {
    console.error('❌ Build failed');
    process.exit(res.status || 1);
  }
}

function gzipSize(buf) { return zlib.gzipSync(buf).length; }

function collectBundleMetrics() {
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist directory missing');
    process.exit(2);
  }
  const files = fs.readdirSync(distDir);
  let jsTotal = 0; let jsFiles = 0;
  let cssTotal = 0; let cssFiles = 0;
  for (const f of files) {
    const p = path.join(distDir, f);
    if (!fs.statSync(p).isFile()) continue;
    const content = fs.readFileSync(p);
    if (f.endsWith('.js')) { jsFiles++; jsTotal += gzipSize(content); }
    if (f.endsWith('.css')) { cssFiles++; cssTotal += gzipSize(content); }
  }
  return { jsFiles, jsGzipBytes: jsTotal, cssFiles, cssGzipBytes: cssTotal };
}

async function measureImportLatency() {
  const start = performance.now();
  try {
    await import(path.join(root, 'src/main.tsx'));
  } catch {
    // Ignore errors because Vite build output is ESM transpiled; runtime import may fail outside browser
  }
  return performance.now() - start;
}

async function run() {
  ensureBuild();
  const bundles = collectBundleMetrics();
  const importLatencyMs = await measureImportLatency();

  const historyPath = path.join(root, 'reports', 'perf-slo-history.json');
  let history = [];
  if(fs.existsSync(historyPath)){
    try { history = JSON.parse(fs.readFileSync(historyPath,'utf8')); if(!Array.isArray(history)) history = []; } catch { history = []; }
  }

  const prev = history.slice(-1)[0];

  const report = {
    timestamp: new Date().toISOString(),
    bundles,
    importLatencyMs: Number(importLatencyMs.toFixed(2)),
    slo: {
      jsGzipBudget: 400 * 1024,
      cssGzipBudget: 60 * 1024,
      importLatencyWarnMs: 1200
    },
    deltas: prev ? {
      jsGzipBytes: bundles.jsGzipBytes - (prev.bundles?.jsGzipBytes || 0),
      cssGzipBytes: bundles.cssGzipBytes - (prev.bundles?.cssGzipBytes || 0),
      importLatencyMs: Number((importLatencyMs - (prev.importLatencyMs || 0)).toFixed(2))
    } : null,
    status: 'ok'
  };
  if (bundles.jsGzipBytes > report.slo.jsGzipBudget) report.status = 'degraded';
  if (bundles.cssGzipBytes > report.slo.cssGzipBudget) report.status = 'degraded';
  if (importLatencyMs > report.slo.importLatencyWarnMs) report.status = 'degraded';

  const outDir = path.join(root, 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'perf-slo.json'), JSON.stringify(report, null, 2));
  history.push(report);
  // keep last 50 entries
  history = history.slice(-50);
  fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  console.log('💾 Wrote reports/perf-slo.json');
  console.log('📈 Updated reports/perf-slo-history.json (entries:', history.length, ')');
  console.log('Performance SLO Probe:', report);

  process.exit(0);
}

run().catch(e => {
  console.error('❌ Performance probe failed:', e);
  process.exit(1);
});
