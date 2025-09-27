#!/usr/bin/env node
/*
  Install a post-push git hook that triggers a development deployment.
  The hook calls our deploy script via Node for cross-platform compatibility.
*/

import { mkdirSync, writeFileSync, chmodSync } from 'node:fs';
import { resolve } from 'node:path';

function main() {
  const hookDir = resolve(process.cwd(), '.git', 'hooks');
  const hookPath = resolve(hookDir, 'post-push');

  mkdirSync(hookDir, { recursive: true });

  const script = `#!/usr/bin/env bash
set -euo pipefail
echo "[git hook] post-push: deploying development worker..."
node scripts/node/dev/deploy-worker-dev.js
`;

  writeFileSync(hookPath, script, { encoding: 'utf8' });
  try { chmodSync(hookPath, 0o755); } catch {}
  console.log(`[install-git-hook] ✅ Installed post-push hook at ${hookPath}`);
}

main();
