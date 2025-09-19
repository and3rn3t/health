#!/usr/bin/env node
/**
 * CI Wrapper for iOS Localization Audit
 * Provides consistent JSON + text output and exit codes for pipelines.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

const script = join(process.cwd(), 'ios', 'scripts', 'localization-audit.js');
if (!existsSync(script)) {
  console.error('❌ localization-audit.js not found at expected path:', script);
  process.exit(2);
}

const result = spawnSync('node', [script], { encoding: 'utf8' });
const output = (result.stdout + '\n' + result.stderr).trim();

const passed = result.status === 0;

const report = {
  tool: 'localization-audit',
  status: passed ? 'pass' : 'fail',
  exitCode: result.status,
  timestamp: new Date().toISOString(),
  output
};

// Emit machine-readable JSON for artifact collection / future diffing
console.log(JSON.stringify(report, null, 2));

process.exit(result.status);
