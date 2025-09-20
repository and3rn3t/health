#!/usr/bin/env node
/**
 * compare-bundle-drift.mjs
 * Compares current branch bundle gzip sizes vs main branch baseline.
 * Strategy:
 *  1. Assume current working copy already built (dist exists) OR build if missing.
 *  2. Create a temporary worktree for origin/main, install, build, measure.
 *  3. Use verify-bundle-threshold logic (inline minimal) to compute gzip totals (JS, CSS) for both.
 *  4. Produce JSON report: reports/bundle-drift.json
 *  5. Fail if deltas exceed thresholds (defaults: JS +15KB, CSS +5KB) unless improvements (negative) or allowed via flags.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = Object.fromEntries(process.argv.slice(2).map(a=>{const [k,v='']=a.replace(/^--/,'').split('=');return [k,v];}));
function parseSize(s, d){ if(!s) return d; const m=/^(\+?-?\d+)(KB|MB|B)?$/i.exec(s); if(!m) return d; let n=parseInt(m[1],10); const u=(m[2]||'B').toUpperCase(); if(u==='KB') n*=1024; if(u==='MB') n*=1024*1024; return n; }

const jsDeltaMax = parseSize(args['js-delta-max'], 15*1024);
const cssDeltaMax = parseSize(args['css-delta-max'], 5*1024);
const projectRoot = process.cwd();
const reportsDir = path.join(projectRoot,'reports');
fs.mkdirSync(reportsDir,{recursive:true});

function gzipSize(buf){ return zlib.gzipSync(buf).length; }
function collectGzipTotals(distDir){
  const jsExts=['.js','.mjs','.cjs'];
  let js=0, css=0;
  if(!fs.existsSync(distDir)) return { js, css };
  const stack=[distDir];
  while(stack.length){
    const d=stack.pop();
    for(const e of fs.readdirSync(d,{withFileTypes:true})){
      const full=path.join(d,e.name);
      if(e.isDirectory()) stack.push(full); else {
        if(jsExts.some(x=>full.endsWith(x))) js+=gzipSize(fs.readFileSync(full));
        else if(full.endsWith('.css')) css+=gzipSize(fs.readFileSync(full));
      }
    }
  }
  return { js, css };
}

function ensureBuilt(){
  if(!fs.existsSync('dist')){
    console.log('🛠️  No dist/ found – building current branch');
    execSync('npm run build',{stdio:'inherit'});
  }
}

function setupMainWorktree(){
  console.log('📥 Fetching origin/main…');
  try { execSync('git fetch --depth=1 origin main', {stdio:'inherit'}); } catch(e){ console.error('❌ git fetch failed', e.message); process.exit(2);} 
  const tmp='.tmp-main-worktree';
  if(fs.existsSync(tmp)) fs.rmSync(tmp,{recursive:true,force:true});
  execSync(`git worktree add ${tmp} origin/main`, {stdio:'inherit'});
  return tmp;
}

function buildIn(dir){
  console.log('🏗️  Building main worktree…');
  // Prefer pnpm (project standard). Fallback to npm if pnpm not available.
  const usePnpm = (() => {
    try { execSync('pnpm --version', {stdio:'ignore'}); return true; } catch { return false; }
  })();
  if(usePnpm){
    try {
      execSync('pnpm install --frozen-lockfile', {cwd:dir, stdio:'inherit'});
    } catch(e){
      console.warn('[lockfile] Drift detected in baseline worktree → non-frozen install (bundle_drift baseline)');
      execSync('pnpm install --no-frozen-lockfile', {cwd:dir, stdio:'inherit'});
    }
    execSync('pnpm run build', {cwd:dir, stdio:'inherit'});
  } else {
    // Legacy fallback (should rarely be used). npm ci will fail if no package-lock, so fallback to npm install.
    try {
      execSync('npm ci --prefer-offline', {cwd:dir, stdio:'inherit'});
    } catch {
      execSync('npm install', {cwd:dir, stdio:'inherit'});
    }
    execSync('npm run build', {cwd:dir, stdio:'inherit'});
  }
}

async function main(){
  console.log('🧪 Bundle Drift Guard');
  ensureBuilt();
  const current = collectGzipTotals('dist');
  const worktreeDir = setupMainWorktree();
  try { buildIn(worktreeDir); } catch(e){ console.error('❌ Failed to build main:', e.message); cleanup(worktreeDir); process.exit(2);} 
  const baseline = collectGzipTotals(path.join(worktreeDir,'dist'));

  const delta = { js: current.js - baseline.js, css: current.css - baseline.css };
  const report = { timestamp:new Date().toISOString(), baseline, current, delta, limits:{ jsDeltaMax, cssDeltaMax } };
  fs.writeFileSync(path.join(reportsDir,'bundle-drift.json'), JSON.stringify(report,null,2));
  console.log('📄 Report: reports/bundle-drift.json');
  const fmt = n=> (n/1024).toFixed(2)+' KB';
  console.log(`Baseline JS: ${fmt(baseline.js)} | Current: ${fmt(current.js)} | Δ ${fmt(delta.js)}`);
  console.log(`Baseline CSS: ${fmt(baseline.css)} | Current: ${fmt(current.css)} | Δ ${fmt(delta.css)}`);
  let fail=false;
  if(delta.js > jsDeltaMax){ console.error(`❌ JS drift ${fmt(delta.js)} exceeds +${fmt(jsDeltaMax)}`); fail=true; }
  if(delta.css > cssDeltaMax){ console.error(`❌ CSS drift ${fmt(delta.css)} exceeds +${fmt(cssDeltaMax)}`); fail=true; }
  if(!fail){
    console.log('✅ Drift within limits (or improvements)');
  }
  cleanup(worktreeDir);
  if(fail) process.exit(1);
}

function cleanup(dir){
  try { execSync(`git worktree remove ${dir} --force`, {stdio:'ignore'}); }
  catch { /* ignore cleanup errors */ }
}

main().catch(e=>{ console.error('❌ Unexpected error', e); process.exit(1); });
