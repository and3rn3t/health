#!/usr/bin/env node
/**
 * Generate simple SVG badges (shields‑style light clone) without external deps.
 * Reads ci-baselines/baselines.json and (optionally) history to produce badges:
 *  - coverage.svg (line coverage %)
 *  - eslint-errors.svg (error count)
 *  - eslint-warnings.svg (warning count)
 *  - perf-latency.svg (avg latency ms if available)
 *  - bundle-main.svg (main bundle KB if available)
 */

import fs from 'fs';
import path from 'path';

const BASE_DIR = 'ci-baselines';
const OUT_DIR = path.join(BASE_DIR, 'badges');

function readJSON(p) {
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return null; }
}

function ensureDir(p) { fs.mkdirSync(p, { recursive: true }); }

function colorScale(value, good, warn) {
  if (value >= good) return '#34d399'; // green
  if (value >= warn) return '#fbbf24'; // amber
  return '#ef4444'; // red
}

function badgeSVG(label, value, color) {
  const fontSize = 11;
  const padX = 6;
  const labelText = label;
  const valueText = value;
  const labelWidth = Math.round((labelText.length * 6) + padX * 2);
  const valueWidth = Math.round((valueText.length * 6) + padX * 2);
  const width = labelWidth + valueWidth;
  const height = 20;
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" role="img" aria-label="${labelText}: ${valueText}">\n  <linearGradient id="s" x2="0" y2="100%"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="0.1" stop-color="#eee" stop-opacity=".7"/><stop offset="1" stop-opacity=".7"/></linearGradient>\n  <mask id="m"><rect width="${width}" height="${height}" rx="3" fill="#fff"/></mask>\n  <g mask="url(#m)">\n    <rect width="${labelWidth}" height="${height}" fill="#555"/>\n    <rect x="${labelWidth}" width="${valueWidth}" height="${height}" fill="${color}"/>\n    <rect width="${width}" height="${height}" fill="url(#s)"/>\n  </g>\n  <g fill="#fff" text-anchor="middle" font-family="Verdana,DejaVu Sans,Geneva,sans-serif" font-size="${fontSize}">\n    <text x="${labelWidth/2}" y="14">${labelText}</text>\n    <text x="${labelWidth + valueWidth/2}" y="14">${valueText}</text>\n  </g>\n</svg>`;
}

function writeBadge(name, label, value, color) {
  const svg = badgeSVG(label, value, color);
  fs.writeFileSync(path.join(OUT_DIR, name), svg, 'utf8');
  console.log('Generated badge', name, value);
}

function main() {
  const baseline = readJSON(path.join(BASE_DIR, 'baselines.json')) || {};
  ensureDir(OUT_DIR);

  // Coverage
  const coveragePct = baseline.coverage?.linesPct ?? baseline.coverage?.total?.linesPct ?? baseline.coverage?.total?.lines?.pct;
  if (typeof coveragePct === 'number') {
    writeBadge('coverage.svg', 'coverage', coveragePct.toFixed(1) + '%', colorScale(coveragePct, 80, 60));
  }

  // ESLint
  const eslint = baseline.eslintSummary;
  if (eslint) {
    writeBadge('eslint-errors.svg', 'eslint errors', String(eslint.errors), eslint.errors === 0 ? '#34d399' : '#ef4444');
    writeBadge('eslint-warnings.svg', 'eslint warnings', String(eslint.warnings), eslint.warnings === 0 ? '#34d399' : '#fbbf24');
  }

  // Performance (avg latency if available)
  const lat = baseline.performance?.averageMs || baseline.performance?.avgMs || baseline.performance?.avg;
  if (typeof lat === 'number') {
    writeBadge('perf-latency.svg', 'latency', Math.round(lat) + 'ms', colorScale(Math.max(0, 300 - lat) / 3, 70, 40));
  }

  // Bundle size (main) if available
  const bundle = baseline.bundleSummary;
  let mainBytes;
  if (bundle?.bundles && Array.isArray(bundle.bundles)) {
    const main = bundle.bundles.find(b => /main/i.test(b.name || '')) || bundle.bundles[0];
    mainBytes = main?.bytes || main?.size;
  } else if (bundle?.totalBytes) {
    mainBytes = bundle.totalBytes;
  }
  if (typeof mainBytes === 'number') {
    const kb = mainBytes / 1024;
    writeBadge('bundle-main.svg', 'bundle', kb.toFixed(1) + 'KB', colorScale( Math.max(0, 250 - kb) / 2.5, 70, 40));
  }
}

main();
