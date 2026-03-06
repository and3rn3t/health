#!/usr/bin/env node
/**
 * Synthetic Performance SLO Sampler
 * Measures:
 *  - Gzipped JS + CSS sizes (reuse dist or soft-fail if missing and flag allows)
 *  - Dynamic import latency (proxy for module init cost)
 *  - Optional WebSocket initial connection latency (wss URL configurable)
 *  - Emits reports/perf-sample.json and appends to perf-sample-history.json
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { performance } from 'perf_hooks';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const reportsDir = path.join(root, 'reports');
const sloPath = path.join(root, 'slo.config.json');
const wsUrl = process.env.PERF_WS_URL || 'wss://health.andernet.dev/ws';
const args = new Set(process.argv.slice(2));

function readJson(p, fallback){
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return fallback; }
}

const slo = readJson(sloPath, { frontend: {} });
const budgets = slo.frontend || {};

function gzipSize(buf){ return zlib.gzipSync(buf).length; }

function collectBundles(){
  if(!fs.existsSync(distDir)) return null;
  const entries = fs.readdirSync(distDir);
  let jsGzip=0, cssGzip=0, jsFiles=0, cssFiles=0;
  for(const f of entries){
    const full = path.join(distDir,f);
    if(!fs.statSync(full).isFile()) continue;
    const buf = fs.readFileSync(full);
    if(f.endsWith('.js')) { jsGzip += gzipSize(buf); jsFiles++; }
    else if(f.endsWith('.css')) { cssGzip += gzipSize(buf); cssFiles++; }
  }
  return { jsGzipBytes: jsGzip, cssGzipBytes: cssGzip, jsFiles, cssFiles };
}

async function measureImportLatency(){
  const start = performance.now();
  try { await import(path.join(root,'src/main.tsx')); } catch { /* ignore */ }
  return +(performance.now() - start).toFixed(2);
}

async function measureWsConnect(){
  if(args.has('--no-ws')) return null;
  const start = performance.now();
  try {
    const { WebSocket } = await import('ws');
    await new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl, { handshakeTimeout: 4000 });
      let done=false;
      ws.on('open', ()=>{ done=true; ws.close(); resolve(); });
      ws.on('error', e=>{ if(!done) reject(e); });
      setTimeout(()=>{ if(!done){ try{ws.terminate();}catch{} reject(new Error('timeout')); } }, 5000);
    });
    return +(performance.now() - start).toFixed(2);
  } catch {
    return null; // treat as unavailable
  }
}

async function main(){
  fs.mkdirSync(reportsDir,{recursive:true});
  const bundles = collectBundles();
  const importLatencyMs = await measureImportLatency();
  const wsConnectMs = await measureWsConnect();

  const report = {
    timestamp: new Date().toISOString(),
    bundles,
    importLatencyMs,
    wsConnectMs,
    budgets,
    status: 'ok'
  };
  if(!bundles){
    if(slo.tolerances?.softFailOnMissingDist) report.status='soft-missing-dist'; else report.status='error';
  } else {
    if(bundles.jsGzipBytes > (budgets.jsGzipBudgetBytes||Infinity)) report.status='degraded';
    if(bundles.cssGzipBytes > (budgets.cssGzipBudgetBytes||Infinity)) report.status='degraded';
  }
  if(importLatencyMs && importLatencyMs > (budgets.importLatencyMs||Infinity)) report.status='degraded';
  if(wsConnectMs && wsConnectMs > (budgets.wsConnectMs||Infinity)) report.status='degraded';

  fs.writeFileSync(path.join(reportsDir,'perf-sample.json'), JSON.stringify(report,null,2));
  const histPath = path.join(reportsDir,'perf-sample-history.json');
  const hist = readJson(histPath, []);
  hist.push(report);
  fs.writeFileSync(histPath, JSON.stringify(hist.slice(-100), null, 2));
  console.log('📈 Wrote reports/perf-sample.json status='+report.status);
}

main().catch(e=>{ console.error('❌ perf-slo-sampler failed', e.message); process.exit(1); });
