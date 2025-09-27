#!/usr/bin/env node
/**
 * Performance Rollup Aggregator
 * Sources:
 *  1. Cloudflare Analytics Engine dataset PERFORMANCE_ANALYTICS (last 60m)
 *  2. Fallback: local reports/perf-sample-history.json (synthetic)
 * Outputs: reports/perf-rollup.json with percentile summary
 */
import fs from 'fs';
import path from 'path';
import { execa } from 'execa';

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
fs.mkdirSync(reportsDir, { recursive: true });

function percentile(sorted, p) {
  if (!sorted.length) return null;
  const idx = Math.min(sorted.length - 1, Math.floor((p / 100) * (sorted.length - 1)));
  return sorted[idx];
}

async function fetchAnalytics() {
  try {
  // Extended schema: [0]=lcp,[1]=ttfb,[2]=hydration,[3]=wsConnect,[4]=lidarIngestInterval,[5]=lidarObstacleDistanceMin
  const sql = "SELECT doubles[0] AS lcp, doubles[1] AS ttfb, doubles[2] AS hydration, doubles[3] AS wsConnect, doubles[4] AS lidarIngestInterval, doubles[5] AS lidarObstacleDistanceMin, TIMESTAMP FROM PERFORMANCE_ANALYTICS WHERE TIMESTAMP > DATE_ADD('minute', -60, NOW()) LIMIT 5000";
    const { stdout } = await execa('wrangler', ['analytics-engine', 'query', 'PERFORMANCE_ANALYTICS', '--sql', sql], { timeout: 15000 });
    // Heuristic parsing: look for lines starting with digits (very environment dependent)
    const lines = stdout.split(/\r?\n/).filter(l => /^\d/.test(l.trim()));
    const rows = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 6) {
        const [lcp, ttfb, hydration, wsConnect, lidarIngestInterval, lidarObstacleDistanceMin] = parts.slice(0, 6).map(Number);
        rows.push({ lcp, ttfb, hydration, wsConnect, lidarIngestInterval, lidarObstacleDistanceMin });
      }
    }
    return rows;
  } catch {
    return null;
  }
}

function historyFallback() {
  const histPath = path.join(reportsDir, 'perf-sample-history.json');
  if (!fs.existsSync(histPath)) return [];
  try { return JSON.parse(fs.readFileSync(histPath, 'utf8')); } catch { return []; }
}

function summarize(records) {
  const buckets = { lcp: [], ttfb: [], hydration: [], wsConnect: [], lidarIngestInterval: [], lidarObstacleDistanceMin: [] };
  for (const r of records) {
    for (const k of Object.keys(buckets)) {
      const v = r[k];
      if (typeof v === 'number' && v >= 0) buckets[k].push(v);
    }
  }
  for (const k of Object.keys(buckets)) buckets[k].sort((a, b) => a - b);
  const out = {};
  for (const k of Object.keys(buckets)) {
    const arr = buckets[k];
    out[k] = {
      count: arr.length,
      p50: percentile(arr, 50),
      p90: percentile(arr, 90),
      p99: percentile(arr, 99),
      max: arr.length ? arr[arr.length - 1] : null,
    };
  }
  return out;
}

async function main() {
  const analytics = await fetchAnalytics();
  let source = 'history';
  let rows;
  if (analytics && analytics.length) {
    rows = analytics;
    source = 'analytics-engine';
  } else {
    const hist = historyFallback();
    rows = hist.map(h => ({
      lcp: h?.metrics?.lcp,
      ttfb: h?.metrics?.ttfb || h?.importLatencyMs,
      hydration: h?.metrics?.hydration,
      wsConnect: h?.metrics?.wsConnect || h?.wsConnectMs,
    }));
  }
  const rollup = { timestamp: new Date().toISOString(), source, summary: summarize(rows) };
  fs.writeFileSync(path.join(reportsDir, 'perf-rollup.json'), JSON.stringify(rollup, null, 2));
  console.log('🗜  perf-rollup source=' + source + ' written');
}

main().catch(e => { console.error('perf-rollup failed', e); process.exit(1); });
