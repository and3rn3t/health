#!/usr/bin/env node
/**
 * Evaluate rollup against SLO budgets (p90) and emit reports/perf-eval.json
 * Exits 0 always (soft) unless --strict supplied.
 */
import fs from 'fs';
import path from 'path';

const root = process.cwd();
const reportsDir = path.join(root, 'reports');
const rollupPath = path.join(reportsDir, 'perf-rollup.json');
const sloPath = path.join(root, 'slo.config.json');
const strict = process.argv.includes('--strict');

function readJson(p, fb){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return fb; } }

const rollup = readJson(rollupPath, null);
const slo = readJson(sloPath, {});
const budgets = slo.performanceBudgets || {};

const result = { timestamp: new Date().toISOString(), status: 'unknown', findings: [] };
if(!rollup){
  result.status = 'no_data';
} else {
  const sum = rollup.summary || {};
  const checks = [
    ['lcp','p90', budgets.lcpP90Ms],
    ['ttfb','p90', budgets.ttfbP90Ms],
    ['hydration','p90', budgets.hydrationP90Ms],
    ['wsConnect','p90', budgets.wsConnectP90Ms],
    ['lidarIngestInterval','p95', budgets.lidarIngestIntervalP95Ms],
    ['lidarObstacleDistanceMin','p90', budgets.lidarObstacleDistanceMinP90],
  ];
  let degraded = false;
  for(const [metric, field, budget] of checks){
    if(!budget) continue;
    const val = sum?.[metric]?.[field];
    if(typeof val === 'number'){
      const ok = val <= budget;
      result.findings.push({ metric, stat: field, value: val, budget, ok });
      if(!ok) degraded = true;
    }
  }
  result.status = degraded ? 'degraded' : 'pass';
}

fs.mkdirSync(reportsDir,{recursive:true});
fs.writeFileSync(path.join(reportsDir,'perf-eval.json'), JSON.stringify(result,null,2));
console.log('🧮 perf-eval status='+result.status);
if(strict && result.status === 'degraded') process.exit(1);
