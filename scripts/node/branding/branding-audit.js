#!/usr/bin/env node
/**
 * Combined VitalSense branding audit.
 * Runs:
 *  1. verify-production-branding.js (HTML markers)
 *  2. verify-vitalsense-rebrand.js (residual legacy terms)
 * Aggregates results, emits markdown summary to stdout and GITHUB_STEP_SUMMARY if available.
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const root = path.resolve(process.cwd());
const brandingScript = path.join(root, 'scripts/node/branding/verify-production-branding.js');
const rebrandScript = path.join(root, 'scripts/node/branding/verify-vitalsense-rebrand.js');

const args = process.argv.slice(2);
// Allow override: --url=... or --local
const urlArg = args.find(a => a.startsWith('--url='));
const local = args.includes('--local');
const url = urlArg ? urlArg.split('=')[1] : (local ? 'http://127.0.0.1:8787' : 'https://health.andernet.dev');

function runScript(nodeArgs) {
  const res = spawnSync(process.execPath, nodeArgs, { encoding: 'utf8' });
  return { code: res.status ?? 1, stdout: res.stdout || '', stderr: res.stderr || '' };
}

function section(title) { return `\n## ${title}\n`; }

console.log('🔎 Running combined VitalSense branding audit...');
if (!fs.existsSync(brandingScript) || !fs.existsSync(rebrandScript)) {
  console.error('❌ Required branding scripts not found.');
  process.exit(2);
}

const brandingRes = runScript([brandingScript, `--url=${url}`, local ? '--local' : '']);
const rebrandRes = runScript([rebrandScript]);

const allOutput = {
  branding: brandingRes.stdout.trim(),
  rebrand: rebrandRes.stdout.trim(),
  brandingErr: brandingRes.stderr.trim(),
  rebrandErr: rebrandRes.stderr.trim()
};

// Simple pass/fail inference
const brandingPass = brandingRes.code === 0;
const rebrandPass = rebrandRes.code === 0;
const overallPass = brandingPass && rebrandPass;

let summary = '# VitalSense Branding Audit\n';
summary += `**Target URL:** ${url}${local ? ' (local)' : ''}\n\n`;
summary += `| Check | Status | Exit Code |\n|-------|--------|-----------|\n`;
summary += `| HTML Branding | ${brandingPass ? '✅ Pass' : '❌ Fail'} | ${brandingRes.code} |\n`;
summary += `| Rebrand Residue | ${rebrandPass ? '✅ Pass' : '❌ Fail'} | ${rebrandRes.code} |\n`;
summary += `| Overall | ${overallPass ? '✅ PASS' : '❌ FAIL'} | ${overallPass ? 0 : 1} |\n`;

summary += section('HTML Branding Output') + '\n```text\n' + allOutput.branding.slice(0, 8000) + '\n```\n';
if (allOutput.brandingErr) {
  summary += '\n<details><summary>Branding stderr</summary>\n\n```text\n' + allOutput.brandingErr.slice(0, 4000) + '\n```\n</details>\n';
}

summary += section('Rebrand Scan Output') + '\n```text\n' + allOutput.rebrand.slice(0, 8000) + '\n```\n';
if (allOutput.rebrandErr) {
  summary += '\n<details><summary>Rebrand stderr</summary>\n\n```text\n' + allOutput.rebrandErr.slice(0, 4000) + '\n```\n</details>\n';
}

// Write to console
console.log('\n==== Combined Branding Audit Summary (Markdown) ====');
console.log(summary);

// GitHub Step Summary integration
if (process.env.GITHUB_STEP_SUMMARY) {
  try {
    fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary + os.EOL);
    console.log('📝 Appended branding audit summary to GITHUB_STEP_SUMMARY');
  } catch (e) {
    console.error('⚠️  Failed to write step summary:', e.message);
  }
}

// Create artifact file for optional upload
try {
  const outDir = path.join(root, 'reports');
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, 'branding-audit-summary.md'), summary);
  console.log('💾 Saved reports/branding-audit-summary.md');
} catch (e) {
  console.error('⚠️  Failed to write artifact file:', e.message);
}

process.exit(overallPass ? 0 : 1);
