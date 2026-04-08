#!/usr/bin/env node
/**
 * check-config-drift.mjs
 * Verifies that generated config artifacts (JSON + Swift) are up-to-date
 * with their TypeScript sources. Exits non-zero if any are stale.
 *
 * Usage:
 *   node scripts/ci/check-config-drift.mjs          # check only
 *   node scripts/ci/check-config-drift.mjs --fix     # regenerate stale files
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const fix = process.argv.includes('--fix');

/** SHA-256 of file contents, or null if missing. */
function fileHash(filePath) {
  if (!existsSync(filePath)) return null;
  return createHash('sha256').update(readFileSync(filePath)).digest('hex');
}

const configs = [
  {
    name: 'gait',
    script: resolve(repoRoot, 'scripts/analysis/gait/sync-gait-config.js'),
    outputs: [
      resolve(repoRoot, 'src/fixtures/gait-config-export.json'),
      resolve(repoRoot, 'ios/HealthKitBridge/Generated/GaitConfig.swift'),
    ],
  },
  {
    name: 'fall-risk',
    script: resolve(repoRoot, 'scripts/analysis/fall/sync-fall-risk-config.js'),
    outputs: [
      resolve(repoRoot, 'src/fixtures/fall-risk-config-export.json'),
      resolve(repoRoot, 'ios/HealthKitBridge/Generated/FallRiskConfig.swift'),
    ],
  },
];

let stale = false;

for (const cfg of configs) {
  // Snapshot current file hashes
  const before = cfg.outputs.map(fileHash);

  // Run the sync script in dry-run fashion (it only writes when content differs)
  try {
    execFileSync('node', [cfg.script], { cwd: repoRoot, stdio: 'pipe' });
  } catch (err) {
    console.error(`❌ ${cfg.name} sync script failed: ${err.stderr?.toString().trim() || err.message}`);
    process.exit(1);
  }

  // Compare
  const after = cfg.outputs.map(fileHash);
  const changed = cfg.outputs.filter((_, i) => before[i] !== after[i]);

  if (changed.length > 0) {
    stale = true;
    const files = changed.map((f) => f.replace(repoRoot + '/', '')).join(', ');
    if (fix) {
      console.log(`🔧 ${cfg.name}: regenerated ${files}`);
    } else {
      console.error(`❌ ${cfg.name}: stale artifacts → ${files}`);
      console.error(`   Run "pnpm ${cfg.name === 'gait' ? 'gait:sync' : 'fallrisk:sync'}" and commit the result.`);
    }
  } else {
    console.log(`✅ ${cfg.name}: up-to-date`);
  }
}

if (stale && !fix) {
  console.error('\nConfig drift detected. Run "pnpm analytics:sync" to fix.');
  process.exit(1);
}
