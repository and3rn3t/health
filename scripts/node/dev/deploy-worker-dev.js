#!/usr/bin/env node
/*
  Deploy the Cloudflare Worker to the development environment.
  Falls back to `npx wrangler` if `wrangler` is not in PATH.
*/

import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: 'inherit', shell: false });
  return res.status ?? 1;
}

function main() {
  // Ensure we're at repo root (best effort)
  const cwd = process.cwd();
  const wranglerToml = resolve(cwd, 'wrangler.toml');
  if (!existsSync(wranglerToml)) {
    console.warn('[deploy-worker-dev] wrangler.toml not found in CWD. Ensure you run from repo root. CWD:', cwd);
  }

  console.log('[deploy-worker-dev] Deploying Worker to development environment...');

  // Prefer wrangler if in PATH; otherwise use npx wrangler
  let status = run('wrangler', ['publish', '--env', 'development']);
  if (status !== 0) {
    console.log('[deploy-worker-dev] `wrangler` not found or failed, retrying with `npx wrangler`...');
    status = run('npx', ['--yes', 'wrangler', 'publish', '--env', 'development']);
  }

  if (status !== 0) {
    console.error('[deploy-worker-dev] Deployment failed.');
    process.exit(status);
  }
  console.log('[deploy-worker-dev] ✅ Deployment complete.');
}

main();
