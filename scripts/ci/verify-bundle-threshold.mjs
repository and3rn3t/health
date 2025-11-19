#!/usr/bin/env node
/**
 * verify-bundle-threshold.mjs
 * Simple bundle + css gzipped size thresholds.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = ''] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

function parseSize(val, fallback) {
  if (!val) return fallback;
  const m = /^([0-9]+)(B|KB|MB)?$/i.exec(val.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 10);
  const u = (m[2] || 'B').toUpperCase();
  if (u === 'MB') return n * 1024 * 1024;
  if (u === 'KB') return n * 1024;
  return n;
}

// Default budgets (gzip): JS < 420KB, CSS < 60KB
// Increased from 410KB to accommodate new features and tests
const distDir = args.dir || 'dist';
const jsMax = parseSize(args['js-max'], 420 * 1024);
const cssMax = parseSize(args['css-max'], 60 * 1024);
const failSoft = 'fail-soft' in args;

function gzipSize(buf) {
  return zlib.gzipSync(buf).length;
}

function collect(dir, exts) {
  const out = [];
  (function walk(p) {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory()) walk(full);
      else if (exts.some((x) => full.endsWith(x))) out.push(full);
    }
  })(dir);
  return out;
}

if (!fs.existsSync(distDir)) {
  console.error(`❌ dist directory not found: ${distDir}`);
  process.exit(2);
}

const jsFiles = collect(distDir, ['.js', '.mjs', '.cjs']);
const cssFiles = collect(distDir, ['.css']);
let jsGzip = 0;
let cssGzip = 0;
for (const f of jsFiles) jsGzip += gzipSize(fs.readFileSync(f));
for (const f of cssFiles) cssGzip += gzipSize(fs.readFileSync(f));

const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;
console.log('🧪 Bundle Threshold Check');
console.log(' JS  :', fmt(jsGzip), 'limit', fmt(jsMax), jsGzip <= jsMax ? '✅' : '❌');
console.log(' CSS :', fmt(cssGzip), 'limit', fmt(cssMax), cssGzip <= cssMax ? '✅' : '❌');

const report = {
  directory: distDir,
  totals: { jsGzip, cssGzip },
  limits: { jsMax, cssMax },
  counts: { js: jsFiles.length, css: cssFiles.length },
  timestamp: new Date().toISOString(),
};
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/bundle-threshold.json', JSON.stringify(report, null, 2));

if (jsGzip > jsMax || cssGzip > cssMax) {
  const msg = `Threshold exceeded (${jsGzip > jsMax ? 'JS ' : ''}${cssGzip > cssMax ? 'CSS' : ''})`;
  if (failSoft) {
    console.warn('⚠️  ' + msg);
  } else {
    console.error('❌ ' + msg);
    process.exit(1);
  }
} else {
  console.log('✅ All thresholds satisfied');
}
