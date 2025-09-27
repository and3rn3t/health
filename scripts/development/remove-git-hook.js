#!/usr/bin/env node
/* Remove the post-push git hook created by install-git-hook.js */

import { rmSync } from 'node:fs';
import { resolve } from 'node:path';

function main() {
  const hookPath = resolve(process.cwd(), '.git', 'hooks', 'post-push');
  try {
    rmSync(hookPath, { force: true });
    console.log(`[remove-git-hook] ✅ Removed ${hookPath}`);
  } catch (err) {
    console.warn('[remove-git-hook] Nothing to remove or could not remove:', err?.message ?? String(err));
  }
}

main();
