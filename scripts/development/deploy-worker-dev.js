#!/usr/bin/env node
/*
  Deploy the Cloudflare Worker to the development environment.
  Uses `wrangler deploy` (v4+). Falls back to `npx wrangler` if not in PATH.
*/

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: process.platform === 'win32' });
  return res.status ?? 1;
}

function findRepoRoot(startDir) {
  let dir = startDir;
  for (let i = 0; i < 6; i += 1) { // walk up max ~6 levels as a guard
    if (existsSync(resolve(dir, 'wrangler.toml'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (!parent || parent === dir) break;
    dir = parent;
  }
  return startDir;
}

function main() {
  // Ensure we run from repo root (where wrangler.toml lives)
  const here = dirname(fileURLToPath(import.meta.url));
  const assumedRepoRoot = resolve(here, '../../..'); // scripts/node/dev -> repo root
  const repoRoot = findRepoRoot(assumedRepoRoot);
  if (!existsSync(resolve(repoRoot, 'wrangler.toml'))) {
    console.warn('[deploy-worker-dev] wrangler.toml not found near', repoRoot, '\nProceeding anyway, Wrangler may fail.');
  } else if (repoRoot !== process.cwd()) {
    console.log('[deploy-worker-dev] Changing working directory to repo root:', repoRoot);
    process.chdir(repoRoot);
  }

  // Allow passing through any extra args (e.g., --var NAME:VALUE)
  const extraArgs = process.argv.slice(2);
  const baseArgs = ['deploy', '--env', 'development', ...extraArgs];

  console.log('[deploy-worker-dev] Running: wrangler', baseArgs.join(' '));

  // Prefer wrangler if in PATH; otherwise use npx wrangler
  let status = run('wrangler', baseArgs);
  if (status !== 0) {
    console.log('[deploy-worker-dev] `wrangler` not found or failed (code', status, '), retrying with `npx wrangler`...');
    status = run('npx', ['--yes', 'wrangler', ...baseArgs]);
  }

  if (status !== 0) {
    console.error('[deploy-worker-dev] Deployment failed with exit code', status);
    process.exit(status);
  }
  console.log('[deploy-worker-dev] ✅ Deployment complete.');
}

main();
