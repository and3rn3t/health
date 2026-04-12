#!/usr/bin/env node
/**
 * coverage-ratchet.mjs
 *
 * Reads coverage-summary.json from the last test run and automatically
 * tightens vitest coverage thresholds so they can only go up (or stay flat).
 *
 * Usage:
 *   node scripts/ci/coverage-ratchet.mjs          # check thresholds, fail if regressed
 *   node scripts/ci/coverage-ratchet.mjs --update  # write new thresholds to vitest.config.ts
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const updateMode = process.argv.includes('--update');
const summaryPath = resolve(repoRoot, 'coverage/coverage-summary.json');
const configPath = resolve(repoRoot, 'vitest.config.ts');

const THRESHOLD_KEYS = ['lines', 'branches', 'functions', 'statements'];
const MARGIN = 1; // Allow 1% drop tolerance to avoid flappy thresholds

if (!existsSync(summaryPath)) {
  console.error('❌ No coverage summary found. Run `pnpm test:coverage` first.');
  process.exit(1);
}

const summary = JSON.parse(readFileSync(summaryPath, 'utf8'));
const totals = summary.total;

if (!totals) {
  console.error('❌ coverage-summary.json missing "total" key.');
  process.exit(1);
}

// Read current thresholds from vitest.config.ts
const configSource = readFileSync(configPath, 'utf8');

function extractThreshold(key) {
  const re = new RegExp(`${key}:\\s*(\\d+)`);
  const m = configSource.match(re);
  return m ? parseInt(m[1], 10) : 0;
}

const current = Object.fromEntries(
  THRESHOLD_KEYS.map((k) => [k, extractThreshold(k)])
);

const actual = Object.fromEntries(
  THRESHOLD_KEYS.map((k) => [k, Math.floor(totals[k]?.pct ?? 0)])
);

console.log('\n📊 Coverage Ratchet Report');
console.log('─'.repeat(55));
console.log('  Metric        Threshold   Actual   Status');
console.log('─'.repeat(55));

let failed = false;
const newThresholds = {};

for (const key of THRESHOLD_KEYS) {
  const thresh = current[key];
  const act = actual[key];
  // New threshold = max of current and (actual - margin), floored at current
  const proposed = Math.max(thresh, act - MARGIN);
  newThresholds[key] = proposed;

  const regressed = act < thresh;
  const improved = proposed > thresh;
  const icon = regressed ? '❌' : improved ? '⬆️' : '✅';
  const status = regressed
    ? `REGRESSED (↓${thresh - act}%)`
    : improved
      ? `CAN RATCHET → ${proposed}%`
      : 'OK';

  console.log(
    `  ${icon} ${key.padEnd(14)} ${String(thresh + '%').padEnd(10)} ${String(act + '%').padEnd(8)} ${status}`
  );

  if (regressed) failed = true;
}

console.log('─'.repeat(55));

if (updateMode) {
  let updatedConfig = configSource;
  for (const key of THRESHOLD_KEYS) {
    const re = new RegExp(`(${key}:\\s*)\\d+`);
    updatedConfig = updatedConfig.replace(re, `$1${newThresholds[key]}`);
  }
  if (updatedConfig !== configSource) {
    writeFileSync(configPath, updatedConfig);
    console.log('\n📝 Updated thresholds in vitest.config.ts:');
    for (const key of THRESHOLD_KEYS) {
      if (newThresholds[key] !== current[key]) {
        console.log(`   ${key}: ${current[key]}% → ${newThresholds[key]}%`);
      }
    }
  } else {
    console.log('\n✅ No threshold changes needed.');
  }
}

if (failed) {
  console.error('\n❌ Coverage regressed below thresholds. Add tests or run with --update to adjust.');
  process.exit(1);
} else {
  console.log('\n✅ Coverage is at or above thresholds.');
  if (!updateMode) {
    const canRatchet = THRESHOLD_KEYS.some((k) => newThresholds[k] > current[k]);
    if (canRatchet) {
      console.log('💡 Tip: Run `node scripts/ci/coverage-ratchet.mjs --update` to tighten thresholds.');
    }
  }
}
