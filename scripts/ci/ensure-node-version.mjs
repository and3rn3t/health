#!/usr/bin/env node
/**
 * ensure-node-version.mjs
 * Fails fast if the active Node.js version does not satisfy the repo's expected version.
 * Uses .nvmrc (authoritative) plus package.json engines.node for redundancy.
 */
import { readFileSync, existsSync } from 'node:fs';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const cwd = process.cwd();

function readNvmrcVersion() {
  const nvmrcPath = path.join(cwd, '.nvmrc');
  if (!existsSync(nvmrcPath)) return null;
  return readFileSync(nvmrcPath, 'utf8').trim();
}

function readPackageEngine() {
  try {
    const pkg = JSON.parse(readFileSync(path.join(cwd, 'package.json'), 'utf8'));
    return pkg.engines?.node || null;
  } catch {
    return null;
  }
}

function simpleSatisfies(actual, range) {
  // Minimal semver check — handles ^x.y.z, >=x.y.z, and exact matches.
  if (!range) return true;
  const [majAct, minAct, patchAct] = actual.replace(/^v/, '').split('.').map(Number);

  if (range.startsWith('>=')) {
    const base = range.slice(2);
    const [majReq, minReq, patchReq = 0] = base.split('.').map(Number);
    if (majAct !== majReq) return majAct > majReq;
    if (minAct !== minReq) return minAct > minReq;
    return patchAct >= patchReq;
  }

  if (range.startsWith('^')) {
    const base = range.slice(1);
    const [majReq, minReq] = base.split('.').map(Number);
    return majAct === majReq && minAct >= minReq;
  }

  // Exact or prefix match
  return actual.replace(/^v/, '').startsWith(range.replace(/^v/, ''));
}

const nodeVersion = process.version; // e.g. v20.18.1
const nvmrc = readNvmrcVersion();
const engineRange = readPackageEngine();

let ok = true;
const messages = [];

if (nvmrc) {
  // Allow patch version differences - only check major.minor matches
  const [majReq, minReq] = nvmrc.split('.').map(Number);
  const [majAct, minAct] = nodeVersion.replace(/^v/, '').split('.').map(Number);
  if (majAct !== majReq || minAct !== minReq) {
    ok = false;
    messages.push(`Active Node.js ${nodeVersion} does not match required .nvmrc ${nvmrc} (major.minor must match)`);
  }
}

if (engineRange && !simpleSatisfies(nodeVersion, engineRange)) {
  ok = false;
  messages.push(`Active Node.js ${nodeVersion} does not satisfy engines.node ${engineRange}`);
}

if (!ok) {
  console.error('\u274c Node version check failed');
  for (const m of messages) console.error(' - ' + m);
  console.error('\nRemediation:');
  console.error(`  1. Install matching Node version (nvm use ${nvmrc || 'lts'} OR check .nvmrc)`);
  console.error('  2. Remove node_modules and reinstall (pnpm install or npm ci)');
  process.exit(1);
} else {
  console.log(`\u2705 Node version OK (${nodeVersion})`);
}
