#!/usr/bin/env node

/**
 * Simple health probe script - Node.js version
 * Replaces scripts/simple-probe.ps1
 */

import { program } from 'commander';
import {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  makeHttpRequest,
  exitWithError,
  exitWithSuccess,
} from '../core/logger.js';

program
  .name('simple-probe')
  .description('Simple health check for development servers')
  .option('-p, --port <port>', 'Port number to test', '8787')
  .option('-h, --host <host>', 'Host to test', '127.0.0.1')
  .option('-t, --timeout <timeout>', 'Timeout in seconds', '5')
  .option('-v, --verbose', 'Verbose output')
  .parse();

const options = program.opts();
const port = parseInt(options.port);
const host = options.host;
const timeout = parseInt(options.timeout) * 1000;

const url = `http://${host}:${port}/health`;

async function main() {
  writeTaskStart('Health Probe', `Testing endpoint: ${url}`);

  try {
    const result = await makeHttpRequest(url, {
      timeout,
      method: 'GET',
    });

    if (result.success) {
      console.log(JSON.stringify(result.data, null, 2));
      writeTaskComplete('Health Probe', 'Health check passed');
      exitWithSuccess();
    } else {
      const errorMsg = result.error || `HTTP ${result.status}`;
      writeTaskError('Health Probe', `Health check failed: ${errorMsg}`);
      exitWithError('Health check failed', 1);
    }
  } catch (error) {
    writeTaskError('Health Probe', `Unexpected error: ${error.message}`);
    exitWithError('Health check failed', 1);
  }
}

// Only run if this file is executed directly
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('Health Probe', error.message);
    process.exit(1);
  });
}
