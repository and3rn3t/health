#!/usr/bin/env node
/**
 * check-bundle-size.mjs
 * Builds the app + worker, then enforces per-entry size budget.
 * Stores a baseline in .bundle-budget.json for trend tracking.
 *
 * Usage:
 *   node scripts/ci/check-bundle-size.mjs              # check against budget
 *   node scripts/ci/check-bundle-size.mjs --update      # update baseline
 */
import { readdirSync, statSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const updateMode = process.argv.includes('--update');
const budgetPath = resolve(repoRoot, '.bundle-budget.json');

// Size budgets in bytes (adjust as needed)
const DEFAULT_BUDGETS = {
  'dist/':        2 * 1024 * 1024,   // 2 MB total app bundle
  'dist-worker/': 1 * 1024 * 1024,   // 1 MB worker
};

/** Recursively sum file sizes in a directory, filtering by extension. */
function dirSize(dir, extensions = null) {
  if (!existsSync(dir)) return 0;
  let total = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = resolve(dir, entry.name);
    if (entry.isDirectory()) {
      total += dirSize(full, extensions);
    } else if (!extensions || extensions.includes(extname(entry.name))) {
      total += statSync(full).size;
    }
  }
  return total;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

// Build both targets
console.log('📦 Building app + worker...');
try {
  execFileSync('npx', ['vite', 'build'], { cwd: repoRoot, stdio: 'pipe' });
  execFileSync('npx', ['vite', 'build', '--config', 'vite.worker.config.ts'], {
    cwd: repoRoot,
    stdio: 'pipe',
  });
} catch (err) {
  console.error('❌ Build failed:', err.stderr?.toString().trim() || err.message);
  process.exit(1);
}

// Measure
const sizes = {
  'dist/':        dirSize(resolve(repoRoot, 'dist'), ['.js', '.css', '.html']),
  'dist-worker/': dirSize(resolve(repoRoot, 'dist-worker'), ['.js']),
};

// Load previous baseline
const baseline = existsSync(budgetPath)
  ? JSON.parse(readFileSync(budgetPath, 'utf8'))
  : {};

const budgets = { ...DEFAULT_BUDGETS, ...baseline.budgets };

console.log('\n📊 Bundle Size Report');
console.log('─'.repeat(58));

let failed = false;

for (const [key, size] of Object.entries(sizes)) {
  const budget = budgets[key];
  const prev = baseline.sizes?.[key];
  const delta = prev != null ? size - prev : null;
  const deltaStr = delta != null
    ? ` (${delta >= 0 ? '+' : ''}${formatBytes(delta)})`
    : '';
  const overBudget = budget && size > budget;

  const icon = overBudget ? '❌' : '✅';
  const budgetStr = budget ? ` / ${formatBytes(budget)}` : '';
  console.log(`  ${icon} ${key.padEnd(15)} ${formatBytes(size).padStart(10)}${budgetStr}${deltaStr}`);

  if (overBudget) {
    failed = true;
    console.error(`     ⚠ Over budget by ${formatBytes(size - budget)}`);
  }
}

console.log('─'.repeat(58));

// Save baseline
if (updateMode || !existsSync(budgetPath)) {
  writeFileSync(budgetPath, JSON.stringify({ sizes, budgets, updatedAt: new Date().toISOString() }, null, 2) + '\n');
  console.log(`\n📝 Baseline saved to ${relative(repoRoot, budgetPath)}`);
}

if (failed) {
  console.error('\n❌ Bundle size limits exceeded. Optimize imports or adjust budgets in .bundle-budget.json.');
  process.exit(1);
} else {
  console.log('\n✅ All bundles within budget.');
}
