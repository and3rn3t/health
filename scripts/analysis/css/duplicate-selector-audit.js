#!/usr/bin/env node
/**
 * VitalSense CSS Duplicate Selector Audit
 * --------------------------------------
 * Scans the built (or source) CSS file for duplicate selector declarations
 * and reports a histogram + top offenders. Intended to be lightweight and
 * CI-friendly without extra dependencies.
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
let target = args[0];
if (!target) {
  // Default to src/main.css (pre-build). For built bundles, user can pass dist/main.css.
  target = path.join(process.cwd(), 'src', 'main.css');
}
if (!fs.existsSync(target)) {
  console.error(`❌ CSS file not found: ${target}`);
  process.exit(1);
}
const css = fs.readFileSync(target, 'utf8');

// Naive selector extraction: split on '{' and trim; ignore @ rules / keyframes bodies
const lines = css.split(/\n/);
const selectorCounts = new Map();
const duplicates = new Map();

for (const rawLine of lines) {
  const line = rawLine.trim();
  if (!line.endsWith('{')) continue;
  if (line.startsWith('@')) continue; // skip @media, @keyframes, etc.
  const selector = line.slice(0, -1).trim();
  if (!selector) continue;
  const count = (selectorCounts.get(selector) || 0) + 1;
  selectorCounts.set(selector, count);
  if (count === 2) {
    duplicates.set(selector, 2);
  } else if (count > 2) {
    duplicates.set(selector, count);
  }
}

const duplicateEntries = [...duplicates.entries()].sort((a, b) => b[1] - a[1]);

if (!duplicateEntries.length) {
  console.log(`✅ No duplicate selectors detected in ${path.basename(target)}`);
  process.exit(0);
}

console.log(`⚠️  Detected ${duplicateEntries.length} duplicate selectors in ${path.basename(target)}`);
console.log('Top duplicates:');
for (const [sel, count] of duplicateEntries.slice(0, 25)) {
  console.log(`  ${count}× \t ${sel}`);
}

const totalDupSelectors = duplicateEntries.reduce((acc, [, c]) => acc + (c - 1), 0);
console.log(`Total extra selector declarations beyond first occurrences: ${totalDupSelectors}`);

// Provide a non-zero exit code for CI if threshold exceeded
const threshold = parseInt(process.env.CSS_DUPLICATE_THRESHOLD || '0', 10);
if (threshold >= 0 && totalDupSelectors > threshold) {
  console.error(`❌ Duplicate selector count ${totalDupSelectors} exceeds threshold ${threshold}`);
  process.exit(2);
}

process.exit(0);
