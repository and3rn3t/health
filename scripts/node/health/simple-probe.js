#!/usr/bin/env node

/**
 * Simple probe wrapper - redirects to the actual script location
 * This maintains compatibility with VS Code tasks
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Redirect to the actual script location
const actualScript = join(__dirname, '..', '..', 'testing', 'simple-probe.js');
const args = process.argv.slice(2);

const child = spawn('node', [actualScript, ...args], {
  stdio: 'inherit',
  cwd: process.cwd()
});

child.on('exit', (code) => {
  process.exit(code || 0);
});