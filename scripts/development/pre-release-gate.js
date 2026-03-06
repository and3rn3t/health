#!/usr/bin/env node
/**
 * Pre-Release Gate
 * Unified orchestration script that executes the critical quality gates before a deploy.
 * Combines:
 *  1. Config validation
 *  2. Lint (TypeScript quick) + optional strict mode on flag
 *  3. Test suites (quick by default; --full to escalate)
 *  4. Bundle build + size budget enforcement (js/css gzip thresholds)
 *  5. Branding & rebrand residue audit
 *  6. WebSocket schema drift guard
 *  7. Performance SLO probe (optional, soft fail unless --strict)
 *  8. Analytics version mismatch / drift checks (if scripts exist)
 *  9. Security / privacy guard (log / privacy guard script if present)
 * Emits structured JSON + markdown summary to reports/pre-release-gate.*
 */
import { execa } from 'execa';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  writeInfo,
  writeSuccess,
  writeWarning,
  exitWithError,
  exitWithSuccess,
} from '../core/logger.js';

const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '../../..');
process.chdir(root);

// Simple argument parsing
const args = process.argv.slice(2);
const flags = new Set(args.filter(a => a.startsWith('--')));
function has(flag){ return flags.has(flag); }

const useFullTests = has('--full');
const strict = has('--strict');
const jsonOnly = has('--json');
const skipBuild = has('--skip-build');
const skipTests = has('--skip-tests');
const skipBranding = has('--skip-branding');
const skipWs = has('--skip-ws');
const skipPerf = has('--skip-perf');

const results = [];

async function runStep(id, description, cmd, opts = {}) {
  const start = Date.now();
  writeTaskStart(id, description);
  let status = 'PENDING';
  let error = null;
  let stdout = '';
  let stderr = '';
  try {
    const [command, ...commandArgs] = cmd;
    const res = await execa(command, commandArgs, { stdio: 'pipe', timeout: opts.timeout || 0 });
    stdout = res.stdout?.slice(0, 20000) || '';
    stderr = res.stderr?.slice(0, 8000) || '';
    status = 'PASS';
    writeTaskComplete(id, description);
  } catch (e) {
    status = (opts.softFail && !strict) ? 'SOFT_FAIL' : 'FAIL';
    error = e.shortMessage || e.message;
    stdout = (e.stdout || '').slice(0, 20000);
    stderr = (e.stderr || '').slice(0, 8000);
    if (status === 'FAIL') {
      writeTaskError(id, error);
    } else {
      writeWarning(`${id} soft failure: ${error}`);
    }
  }
  const durationMs = Date.now() - start;
  const record = { id, description, status, durationMs, error, stdout, stderr };
  results.push(record);
  return record;
}

async function main(){
  writeInfo('🔐 Running Pre-Release Gate');
  const steps = [];

  // 1. Config validation
  steps.push(() => runStep('config', 'Config validator', ['node','scripts/node/utils/config-validator.js']));

  // 2. Lint quick (strict if --strict)
  steps.push(() => runStep('lint', `Lint (quick${strict ? ' strict' : ''})`, ['node','scripts/node/dev/lint-runner.js','--typescript','--quick', ...(strict?['--strict']:[])]));

  // 3. Tests
  if(!skipTests){
  steps.push(() => runStep('tests', useFullTests ? 'Full test suite' : 'Quick test suite', ['node','scripts/node/test/test-runner.js', useFullTests?'--full':'--quick']));
  } else {
    writeWarning('Skipping tests per flag');
  }

  // 4. Build + bundle thresholds
  if(!skipBuild){
  steps.push(() => runStep('build', 'Production build', ['npm','run','build']));
  steps.push(() => runStep('bundle-threshold', 'Bundle threshold check (js/css gzip)', ['node','scripts/ci/verify-bundle-threshold.mjs']));
  } else {
    writeWarning('Skipping build per flag');
  }

  // 5. Branding audit
  if(!skipBranding){
  steps.push(() => runStep('branding', 'Branding + rebrand audit', ['node','scripts/node/branding/branding-audit.js','--local','--url=http://127.0.0.1:8789'], { softFail: true }));
  }

  // 6. WebSocket schema drift
  if(!skipWs){
  steps.push(() => runStep('ws-schema', 'WebSocket schema drift', ['node','scripts/ci/websocket-schema-drift.mjs'], { softFail: true }));
  }

  // 7. Performance SLO probe (soft fail unless strict)
  if(!skipPerf){
      // Synthetic perf sample first (soft)
      if (fs.existsSync('scripts/node/analysis/perf-slo-sampler.js')) {
        steps.push(() => runStep('perf-sample', 'Synthetic perf sample', ['node','scripts/node/analysis/perf-slo-sampler.js'], { softFail: true }));
      }
      if (fs.existsSync('scripts/node/analysis/perf-rollup.js')) {
        steps.push(() => runStep('perf-rollup', 'Perf rollup aggregation', ['node','scripts/node/analysis/perf-rollup.js'], { softFail: true }));
      }
      if (fs.existsSync('scripts/node/analysis/perf-eval.js')) {
        steps.push(() => runStep('perf-eval', 'Perf rollup evaluation', ['node','scripts/node/analysis/perf-eval.js', ...(strict?['--strict']:[])], { softFail: true }));
      }
    if (fs.existsSync('scripts/ci/performance-slo-probe.mjs')) {
  steps.push(() => runStep('perf-slo', 'Performance SLO probe', ['node','scripts/ci/performance-slo-probe.mjs'], { softFail: true }));
    }
  }

  // 8. Analytics mismatch events (soft)
  if(fs.existsSync('scripts/node/analytics/dump-version-mismatch.js')){
  steps.push(() => runStep('analytics-mismatch', 'Analytics version mismatch snapshot', ['node','scripts/node/analytics/dump-version-mismatch.js','--out','mismatch-events.json'], { softFail: true }));
  }

  // 9. Privacy / log guard (hard fail)
  if(fs.existsSync('scripts/ci/privacy-log-guard.mjs')){
  steps.push(() => runStep('privacy', 'Privacy log guard', ['node','scripts/ci/privacy-log-guard.mjs']));
  }

  for(const fn of steps){
    await fn();
  }

  // Aggregate
  const summary = {
    timestamp: new Date().toISOString(),
    strict,
    fullTests: useFullTests,
    results: results.map(r => ({ id: r.id, status: r.status, ms: r.durationMs, error: r.error })),
  };
  const pass = results.every(r => r.status === 'PASS' || r.status === 'SOFT_FAIL');
  summary.overallStatus = pass ? 'PASS' : 'FAIL';

  fs.mkdirSync('reports', { recursive: true });
  fs.writeJsonSync('reports/pre-release-gate.json', summary, { spaces: 2 });

  // Markdown
  let md = `# Pre-Release Gate Summary\n\nStatus: **${summary.overallStatus}**
Strict: ${strict}
Full Tests: ${useFullTests}\n\n| Step | Status | Duration (ms) | Error |\n|------|--------|--------------|-------|\n`;
  for(const r of results){
    md += `| ${r.id} | ${r.status} | ${r.durationMs} | ${r.error ? r.error.replace(/\|/g,'/') : ''} |\n`;
  }
  fs.writeFileSync('reports/pre-release-gate.md', md);
  if(!jsonOnly){
    console.log('\n'+md+'\n');
  }

  if(!pass){
    exitWithError('Pre-Release Gate FAILED');
  } else {
    writeSuccess('Pre-Release Gate passed');
    exitWithSuccess();
  }
}

main().catch(e => {
  writeTaskError('gate', e.message);
  exitWithError('Unhandled error running gate');
});
