#!/usr/bin/env node
/**
 * Fall risk config drift guard.
 * Mirrors gait-config-drift for parity.
 * Ensures JSON & Swift artifacts reflect TS source.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

const artifacts = [
  'src/fixtures/fall-risk-config-export.json',
  'ios/HealthKitBridge/Generated/FallRiskConfig.swift'
];

function ensureArtifactsExist(){
  let ok = true;
  for(const a of artifacts){
    if(!fs.existsSync(a)){
      console.error('❌ Missing artifact (run: npm run fallrisk:sync):', a);
      ok = false;
    }
  }
  if(!ok) process.exit(1);
}

function snapshot(){
  return new Map(artifacts.map(a => [a, fs.readFileSync(a,'utf8')]));
}

function runSync(){
  const res = spawnSync('node', ['scripts/node/fall/sync-fall-risk-config.js'], { stdio: 'inherit' });
  if(res.status !== 0){
    console.error('❌ fallrisk:sync failed');
    process.exit(res.status ?? 1);
  }
}

function compare(before){
  let drift = false;
  for(const a of artifacts){
    const after = fs.readFileSync(a,'utf8');
    if(after !== before.get(a)){
      console.error(`⚠️  Drift detected in ${a}`);
      drift = true;
    }
  }
  if(drift){
    console.error('❌ Fall risk config artifacts out of date.');
    console.error('   Run: npm run fallrisk:sync && git add src/fixtures/fall-risk-config-export.json ios/HealthKitBridge/Generated/FallRiskConfig.swift');
    process.exit(1);
  }
}

try {
  ensureArtifactsExist();
  const before = snapshot();
  runSync();
  compare(before);
  console.log('✅ Fall risk config artifacts are synchronized.');
} catch(e){
  console.error('❌ Unexpected error in fall-risk-config-drift guard:', e.message);
  process.exit(1);
}
