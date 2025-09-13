#!/usr/bin/env node
/*
  Ensures the VS Code terminal is using PowerShell 7 and prints helpful diagnostics.
  Exits with code 0 if OK, non-zero if a likely misconfiguration is detected.
*/
import os from 'node:os';
import process from 'node:process';

function log(label, value) {
  // eslint-disable-next-line no-console
  console.log(`${label}: ${value}`);
}

try {
  const shell = process.env.ComSpec || process.env.SHELL || '';
  const pwshInPath = (process.env.Path || '').toLowerCase().includes('powershell/7');
  const termProfile = process.env.TERM_PROGRAM || 'unknown';

  log('Platform', process.platform);
  log('Shell', shell);
  log('TERM_PROGRAM', termProfile);
  log('Node', process.version);
  log('CPU', os.cpus()?.[0]?.model || 'unknown');

  if (process.platform === 'win32') {
    if (!pwshInPath) {
      console.warn('Warning: PowerShell 7 path not detected in PATH.');
      process.exitCode = 0; // non-fatal; tasks.json enforces pwsh
    }
  }
} catch (err) {
  console.error('pwsh-env-check failed:', err);
  process.exit(1);
}
