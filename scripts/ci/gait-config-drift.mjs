#!/usr/bin/env node
/**
 * Gait config drift guard.
 * Ensures that committed JSON & Swift parity artifacts match the TS source.
 * Strategy:
 * 1. Record git diff hash of target artifacts before sync
 * 2. Run gait:sync script (regenerates artifacts deterministically)
 * 3. Check git diff for those artifacts; if changed -> fail with guidance
 * Pass if no changes.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const artifacts = [
  'src/fixtures/gait-config-export.json',
  'ios/HealthKitBridge/Generated/GaitConfig.swift'
];

function git(args){
  // Use spawnSync with argument array to prevent injection
  const result = spawnSync('git', args, {
    encoding: 'utf8',
    stdio: 'pipe',
    shell: false, // Disable shell to prevent injection
  });

  if (result.error || result.status !== 0) {
    throw new Error(`Git command failed: ${result.stderr?.toString() || 'Unknown error'}`);
  }

  return result.stdout?.toString().trim() || '';
}

function ensureCleanIndex(){
  const status = git(['status','--porcelain']);
  if(status.split('\n').some(l => l && artifacts.some(a => l.endsWith(a)))){
    console.error('❌ Staged or modified gait config artifacts detected before drift check. Commit or stash first.');
    process.exit(2);
  }
}

function artifactExists(){
  let ok = true;
  for(const a of artifacts){
    if(!fs.existsSync(a)){
      console.error('❌ Missing artifact (run: npm run gait:sync):', a);
      ok = false;
    }
  }
  if(!ok) process.exit(1);
}

function snapshot(){
  const map = new Map();
  for(const a of artifacts){
    const content = fs.readFileSync(a, 'utf8');
    map.set(a, content);
  }
  return map;
}

function runSync(){
  const res = spawnSync('node', ['scripts/analysis/gait/sync-gait-config.js'], { stdio: 'inherit' });
  if(res.status !== 0){
    console.error('❌ gait:sync script failed');
    process.exit(res.status ?? 1);
  }
}

function compare(before){
  let drift = false;
  for(const a of artifacts){
    const after = fs.readFileSync(a, 'utf8');
    const beforeContent = before.get(a);
    if(beforeContent !== after){
      console.error(`⚠️  Drift detected in ${a}`);
      drift = true;
    }
  }
  if(drift){
    console.error('❌ Gait config artifacts out of date.');
    console.error('   Run: npm run gait:sync && git add src/fixtures/gait-config-export.json ios/HealthKitBridge/Generated/GaitConfig.swift');
    process.exit(1);
  }
}

try {
  artifactExists();
  ensureCleanIndex();
  const before = snapshot();
  runSync();
  compare(before);
  console.log('✅ Gait config artifacts are synchronized.');
} catch(e){
  console.error('❌ Unexpected error in gait-config-drift guard:', e.message);
  process.exit(1);
}
