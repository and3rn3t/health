#!/usr/bin/env node
/**
 * privacy-log-guard.mjs - scan for logging of sensitive metrics.
 */
import fs from 'node:fs';
import path from 'node:path';

const METRICS = [
  'heart_rate',
  'walking_steadiness',
  'steps',
  'gait_speed',
  'cadence',
  'stride_length',
  'step_asymmetry',
  'double_support_time',
  'posture_angle',
  'stability_index',
  'sway_balance',
  'oxygen_saturation',
  'sleep_hours',
  'body_weight',
  'active_energy',
  'distance_walking',
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'body_temperature',
  'respiratory_rate',
  'fall_event',
];
const ALLOW = ['REDACTED', 'MASKED', 'ANON'];
const findings = [];

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx)$/.test(ent.name)) scan(full);
  }
}

function scan(file) {
  const lines = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  lines.forEach((line, i) => {
    if (!/console\.(log|info|warn|error)/.test(line)) return;
    const lower = line.toLowerCase();
    for (const m of METRICS) {
      if (lower.includes(m)) {
        if (!ALLOW.some((t) => line.includes(t))) {
          findings.push({ file, line: i + 1, metric: m, snippet: line.trim() });
        }
      }
    }
  });
}

if (fs.existsSync('src')) walk('src');

if (findings.length) {
  console.error('❌ Sensitive logs detected:');
  for (const f of findings) console.error(`${f.file}:${f.line} [${f.metric}] ${f.snippet}`);
  fs.mkdirSync('reports', { recursive: true });
  fs.writeFileSync('reports/privacy-log-findings.json', JSON.stringify(findings, null, 2));
  process.exit(1);
} else {
  console.log('✅ Privacy log guard passed');
}
