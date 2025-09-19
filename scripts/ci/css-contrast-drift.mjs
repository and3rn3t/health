#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

// Compare current reports/contrast-report.json with a stored baseline (main branch reference).
// Baseline strategy: if baseline artifact not present, create one (soft). In CI you can seed baseline by
// committing a copy at scripts/ci/baselines/contrast-baseline.json or by caching from main.

const CURRENT_PATH = path.join(process.cwd(), 'reports', 'contrast-report.json');
const BASELINE_PATH = path.join(process.cwd(), 'scripts', 'ci', 'baselines', 'contrast-baseline.json');
const MAX_DELTA = parseFloat(process.env.CSS_CONTRAST_MAX_DELTA || '0.10');

let exitCode = 0;
function log(msg){ console.log(msg); }
function warn(msg){ console.warn(msg); }
function error(msg){ console.error(msg); }

function loadJSON(p){
  if(!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; }
}

const current = loadJSON(CURRENT_PATH);
if(!current){
  error('Current contrast report missing. Run guard first.');
  process.exit(1);
}

const baseline = loadJSON(BASELINE_PATH);
if(!baseline){
  warn('Baseline not found – creating new baseline (no drift check this run).');
  try {
    fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2));
    log('Baseline seeded at ' + BASELINE_PATH);
  } catch(e){ error('Failed to seed baseline: ' + e.message); }
  process.exit(0);
}

// Index pairs by theme+pair label
function indexPairs(rep){
  const map = new Map();
  for(const p of rep.pairs || []){
    map.set(`${p.theme}::${p.pair}`, p);
  }
  return map;
}

const baseIdx = indexPairs(baseline);
const curIdx = indexPairs(current);
const regressions = [];
for(const [key, cur] of curIdx.entries()){
  const base = baseIdx.get(key);
  if(!base) continue; // new pair – ignore for now
  const rBase = parseFloat(base.ratio);
  const rCur = parseFloat(cur.ratio);
  if(!Number.isFinite(rBase) || !Number.isFinite(rCur)) continue;
  const delta = rBase - rCur;
  if(delta > MAX_DELTA){
    regressions.push({ key, from: rBase, to: rCur, delta: parseFloat(delta.toFixed(2)) });
  }
}

if(regressions.length){
  error(`Contrast drift detected (> ${MAX_DELTA}):`);
  for(const r of regressions){
    error(`  - ${r.key} ${r.from} -> ${r.to} (Δ ${r.delta})`);
  }
  exitCode = 1;
} else {
  log('No contrast regression beyond threshold.');
}

// Optionally update baseline if env set (helps after intentional improvements)
if(process.env.CSS_UPDATE_BASELINE === 'true' && exitCode === 0){
  try {
    fs.writeFileSync(BASELINE_PATH, JSON.stringify(current, null, 2));
    log('Baseline updated (CSS_UPDATE_BASELINE=true).');
  } catch(e){ warn('Could not update baseline: ' + e.message); }
}

process.exit(exitCode);
