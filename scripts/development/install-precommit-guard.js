#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';

const repoRoot = process.cwd();
const hooksDir = path.join(repoRoot, '.git', 'hooks');
if (!fs.existsSync(path.join(repoRoot, '.git'))) {
  console.error('❌ Not a git repository (no .git directory)');
  process.exit(1);
}
fs.mkdirSync(hooksDir, { recursive: true });

const hookPath = path.join(hooksDir, 'pre-commit');
const hookScript = `#!/usr/bin/env bash
# Auto-generated VitalSense pre-commit guard
echo "🔍 Running VitalSense CSS guard..." >&2
node scripts/analysis/css/guard-main-css.js || exit 1
echo "✅ CSS guard passed" >&2
`;
fs.writeFileSync(hookPath, hookScript, { mode: 0o755 });

try {
  execSync('git config core.hooksPath', { stdio: 'ignore' });
} catch {
  // Leave default hooks path; user can customize later.
}

console.log('✅ Pre-commit hook installed: runs CSS guard');
