#!/usr/bin/env node

/**
 * Development Server Starter - Node.js version
 * Replaces scripts/start-dev.ps1
 */

import { program } from 'commander';
import {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  writeInfo,
  writeSuccess,
  writeWarning,
  runCommand,
  fileExists,
  exitWithError,
  exitWithSuccess,
} from '../core/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

program
  .name('start-dev')
  .description('Start the development server for VitalSense Health App')
  .option('-p, --port <port>', 'Development server port', '5173')
  .option('-v, --verbose', 'Verbose output')
  .option('--skip-install', 'Skip npm install check')
  .parse();

const options = program.opts();

async function checkProjectRoot() {
  if (!(await fileExists('package.json'))) {
    writeTaskError('Start Dev', 'package.json not found!');
    writeWarning('Please run this script from the project root directory.');
    exitWithError('Not in project root', 1);
  }
  writeInfo('✓ Project root verified');
}

async function ensureDependencies() {
  if (options.skipInstall) {
    writeInfo('Skipping dependency check');
    return;
  }

  if (!(await fileExists('node_modules'))) {
    writeInfo('📦 Installing project dependencies...');
    const result = await runCommand('npm', ['install']);

    if (!result.success) {
      writeTaskError('Start Dev', 'Failed to install dependencies');
      exitWithError('npm install failed', result.exitCode);
    }
    writeSuccess('Dependencies installed successfully');
  } else {
    writeInfo('✓ Dependencies already installed');
  }
}

function showStartupInfo() {
  console.log('');
  writeSuccess(
    '🌐 Web dashboard will be available at: http://localhost:' + options.port
  );
  console.log('');
  writeInfo('💡 Make sure the WebSocket server is running on port 3001');
  writeInfo('   Use: node server/websocket-server.js in another terminal');
  writeInfo(
    "   Optionally: set window.__WS_DEVICE_TOKEN__='<jwt>' in DevTools"
  );
  console.log('');
  writeInfo('Press Ctrl+C to stop the development server');
  console.log('');
}

async function startDevServer() {
  showStartupInfo();

  writeTaskStart('Development Server', 'Starting Vite dev server...');

  const result = await runCommand('npm', ['run', 'dev'], {
    stdio: 'inherit',
    env: {
      ...process.env,
      PORT: options.port,
    },
  });

  if (!result.success) {
    writeTaskError('Development Server', 'Failed to start development server');
    exitWithError('Dev server failed', result.exitCode);
  }

  writeTaskComplete('Development Server', 'Server stopped');
}

async function main() {
  writeTaskStart(
    'VitalSense Dev Server',
    '🌐 Starting Health Monitoring Web Dashboard...'
  );

  try {
    await checkProjectRoot();
    await ensureDependencies();
    await startDevServer();

    exitWithSuccess();
  } catch (error) {
    writeTaskError('Start Dev', `Unexpected error: ${error.message}`);
    exitWithError('Development server failed', 1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('Start Dev', error.message);
    process.exit(1);
  });
}
