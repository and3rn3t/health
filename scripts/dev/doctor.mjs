#!/usr/bin/env node
/**
 * doctor.mjs
 * Verifies all prerequisites for local VitalSense development.
 * Run this whenever something feels broken, or after checking out a new branch.
 *
 * Usage:  node scripts/dev/doctor.mjs
 *         pnpm doctor
 */
import { execSync, execFileSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
let failures = 0;
let warnings = 0;

function check(label, fn) {
  try {
    const result = fn();
    if (result === 'warn') {
      warnings++;
      console.log(`  ⚠️  ${label}`);
    } else {
      console.log(`  ✅ ${label}`);
    }
  } catch (e) {
    failures++;
    console.log(`  ❌ ${label}`);
    console.log(`     → ${e.message}`);
  }
}

function commandVersion(cmd, args = ['--version']) {
  return execFileSync(cmd, args, { encoding: 'utf8', timeout: 10_000 }).trim();
}

function semverMajor(v) {
  const m = v.match(/(\d+)\.\d+/);
  return m ? parseInt(m[1], 10) : 0;
}

console.log('\n🩺 VitalSense Development Doctor\n');

// ── Node.js ──────────────────────────────────────────────────
console.log('Runtime:');

check('Node.js version', () => {
  const actual = process.version;
  const expected = readFileSync(resolve(repoRoot, '.nvmrc'), 'utf8').trim();
  if (!actual.startsWith('v' + expected.split('.')[0])) {
    throw new Error(`Expected Node ${expected}, got ${actual}. Run: nvm use`);
  }
  return `Node.js ${actual} (expected ${expected})`;
});

check('pnpm installed', () => {
  const v = commandVersion('pnpm');
  if (semverMajor(v) < 8) throw new Error(`pnpm ${v} is too old, need ≥8`);
});

// ── Dependencies ─────────────────────────────────────────────
console.log('\nDependencies:');

check('node_modules present', () => {
  if (!existsSync(resolve(repoRoot, 'node_modules'))) {
    throw new Error('Run: pnpm install');
  }
});

check('lockfile in sync', () => {
  try {
    execFileSync('pnpm', ['install', '--frozen-lockfile', '--dry-run'], {
      cwd: repoRoot,
      stdio: 'pipe',
      timeout: 30_000,
    });
  } catch {
    throw new Error('Lockfile out of sync. Run: pnpm install');
  }
});

// ── Tooling ──────────────────────────────────────────────────
console.log('\nTooling:');

check('TypeScript compiler', () => commandVersion('npx', ['tsc', '--version']));

check('Wrangler CLI', () => {
  try {
    commandVersion('npx', ['wrangler', '--version']);
  } catch {
    throw new Error('Wrangler not found. Run: pnpm add -D wrangler');
  }
});

check('Playwright browsers', () => {
  try {
    // Check if chromium is installed by looking at the cache
    execFileSync('npx', ['playwright', 'install', '--dry-run'], {
      cwd: repoRoot,
      stdio: 'pipe',
      timeout: 15_000,
    });
  } catch {
    return 'warn';
  }
});

// ── Config files ─────────────────────────────────────────────
console.log('\nConfig files:');

const requiredFiles = [
  '.nvmrc',
  'tsconfig.json',
  'vite.config.ts',
  'vite.worker.config.ts',
  'wrangler.toml',
  'eslint.config.js',
  'vitest.config.ts',
  'playwright.config.ts',
];

for (const file of requiredFiles) {
  check(file, () => {
    if (!existsSync(resolve(repoRoot, file))) {
      throw new Error(`Missing: ${file}`);
    }
  });
}

// ── Generated artifacts ──────────────────────────────────────
console.log('\nGenerated artifacts:');

check('Gait config export', () => {
  if (!existsSync(resolve(repoRoot, 'src/fixtures/gait-config-export.json'))) {
    throw new Error('Missing. Run: pnpm gait:sync');
  }
});

check('Fall risk config export', () => {
  if (!existsSync(resolve(repoRoot, 'src/fixtures/fall-risk-config-export.json'))) {
    throw new Error('Missing. Run: pnpm fallrisk:sync');
  }
});

// ── Git hooks ────────────────────────────────────────────────
console.log('\nGit hooks:');

check('Husky pre-commit hook', () => {
  if (!existsSync(resolve(repoRoot, '.husky/pre-commit'))) {
    throw new Error('Missing. Run: pnpm prepare');
  }
});

// ── Summary ──────────────────────────────────────────────────
console.log('\n' + '─'.repeat(44));
if (failures === 0 && warnings === 0) {
  console.log('🎉 All checks passed! Ready to develop.\n');
} else {
  if (warnings > 0) console.log(`⚠️  ${warnings} warning(s)`);
  if (failures > 0) console.log(`❌ ${failures} issue(s) found. Fix them and re-run.\n`);
  if (failures > 0) process.exit(1);
}
