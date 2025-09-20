#!/usr/bin/env node
/**
 * auto-raise-coverage.mjs
 * Simple heuristic to bump coverage baseline (COVERAGE_MIN suggestion) when:
 *  - Current run passes
 *  - Lines coverage > existing baseline + 2% AND > configured floor
 * Writes suggestion to reports/coverage-suggestion.json (non-blocking).
 */
import fs from 'node:fs';

const baselineFile = 'coverage-baseline.json';
const summaryFile = 'coverage/coverage-summary.json';
const reportsDir = 'reports';
fs.mkdirSync(reportsDir, { recursive: true });

function readJson(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }
const baseline = readJson(baselineFile) || { linesPct: 0 };
const summary = readJson(summaryFile);
if(!summary){
  fs.writeFileSync(`${reportsDir}/coverage-suggestion.json`, JSON.stringify({ status:'no-summary' }, null,2));
  process.exit(0);
}
const cur = (summary.total || summary).lines?.pct ?? 0;
const prev = baseline.linesPct || 0;
const floor = Number(process.env.COVERAGE_AUTO_FLOOR || 10);
let suggestion = null;
if(cur > prev + 2 && cur >= floor){
  // Round down to nearest whole percent to avoid churn
  const target = Math.floor(cur);
  suggestion = { previous: prev, current: cur, suggestedMin: target, rationale: 'Increase by >2% and above floor', timestamp: new Date().toISOString() };
}
fs.writeFileSync(`${reportsDir}/coverage-suggestion.json`, JSON.stringify({ status:'ok', current:cur, baseline:prev, suggestion }, null,2));
process.exit(0);
