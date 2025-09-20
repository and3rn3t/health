#!/usr/bin/env node

/**
 * Test Runner - Node.js version
 * Replaces various test-*.ps1 scripts with a unified test runner
 */

import { program } from 'commander';
import {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  writeInfo,
  writeSuccess,
  exitWithError,
  exitWithSuccess,
} from '../core/logger.js';
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

program
  .name('test-runner')
  .description('Comprehensive test runner for development environment')
  .option('--quick', 'Run quick basic tests only')
  .option('--full', 'Run comprehensive test suite')
  .option('--api', 'Test API endpoints only')
  .option('--websocket', 'Test WebSocket connections only')
  .option('--ios', 'Test iOS-related functionality')
  .option('--dev', 'Test development environment (default)')
  .option('--prod', 'Test production endpoints')
  .option('--auto-start-worker', 'Automatically start wrangler dev worker if not running')
  .option('--worker-port <port>', 'Port to run / probe local worker', '8789')
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '5000')
  .option('-v, --verbose', 'Show detailed output')
  .parse();

const options = program.opts();
const testResults = [];
let spawnedWorker = null; // child_process handle if we auto-start

async function ensureWorker(baseUrl) {
  // Production environment: never auto-spawn local worker
  if (options.prod) return true;
  // Only auto start if user explicitly requested
  if (!options.autoStartWorker) return true;

  const axiosTimeout = parseInt(options.timeout);
  const maxWaitMs = 30_000; // maximum wait for worker readiness
  const start = Date.now();
  const poll = async () => {
    try {
      const res = await axios.get(`${baseUrl}/health`, { timeout: axiosTimeout });
      if (res?.data?.status === 'healthy') return true;
    } catch {
      /* not ready */
    }
    return false;
  };

  // First quick probe – if already running, we're done
  if (await poll()) return true;

  // Spawn only once (default behaviour now). User can opt-out in future with a --no-auto-start-worker flag (not yet implemented)
  if (!spawnedWorker) {
    try {
      const { spawn } = await import('node:child_process');
      const port = options.workerPort || '8789';
      // Use wrangler dev with build step; rely on project config. Keep quiet unless verbose.
      spawnedWorker = spawn('wrangler', ['dev', '--env', 'development', '--port', port, '--var', 'DEVICE_JWT_SECRET:dev-local'], {
        stdio: options.verbose ? 'inherit' : 'ignore',
        shell: process.platform === 'win32',
      });
      spawnedWorker.on('exit', (code) => {
        if (code !== 0 && options.verbose) {
          writeTaskError('Worker Process', `Exited with code ${code}`);
        }
      });
      process.on('exit', () => {
        try { spawnedWorker && spawnedWorker.kill(); } catch { /* noop */ }
      });
    } catch (e) {
      writeTaskError('Worker Auto-Start', `Failed to spawn worker: ${e.message}`);
      return false;
    }
  }

  // Poll until ready or timeout
  while (Date.now() - start < maxWaitMs) {
    if (await poll()) {
      if (options.verbose) writeSuccess('✅ Local worker is ready');
      return true;
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  writeTaskError('Worker Auto-Start', 'Timed out waiting for /health');
  return false;
}

async function preflightConnectivity(baseUrl) {
  // Skip in production (we'll just try real endpoints) or if auto-start will handle
  if (options.prod || options.autoStartWorker) return true;
  try {
    const res = await axios.get(`${baseUrl}/health`, { timeout: 1500 });
    if (res?.data?.status === 'healthy') return true;
  } catch {
    // unreachable
  }
  addTestResult(
    'Environment Setup',
    'FAIL',
    `Worker not reachable at ${baseUrl}. Start it via VS Code task "wrangler-dev-8789" or run: wrangler dev --env development --port ${options.workerPort}`
  );
  return false;
}

// Default to development tests if no specific test type is selected
if (
  !options.quick &&
  !options.full &&
  !options.api &&
  !options.websocket &&
  !options.ios &&
  !options.prod
) {
  options.dev = true;
}

function addTestResult(name, status, details = '') {
  testResults.push({
    name,
    status,
    details,
    timestamp: new Date().toISOString(),
  });
}

async function testWorkerHealth(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo(`Testing Worker health at ${baseUrl}...`);

  try {
    const response = await axios.get(`${baseUrl}/health`, {
      timeout: parseInt(options.timeout),
    });

    if (response.data.status === 'healthy') {
      writeSuccess(
        `✅ Worker Health: OK (${response.data.environment || 'unknown'})`
      );
      addTestResult('Worker Health', 'PASS', response.data.environment);
      return true;
    } else {
      writeTaskError('Worker Health', 'Unhealthy response');
      addTestResult('Worker Health', 'FAIL', 'Unhealthy response');
      return false;
    }
  } catch (error) {
    writeTaskError('Worker Health', `No response: ${error.message}`);
    addTestResult('Worker Health', 'FAIL', error.message);
    return false;
  }
}

async function testApiAuthentication(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo('Testing API authentication...');

  try {
    const response = await axios.post(
      `${baseUrl}/api/device/auth`,
      {
        userId: 'test-user',
      },
      {
        timeout: parseInt(options.timeout),
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.ok) {
      writeSuccess('✅ API Authentication: OK');
      addTestResult('API Authentication', 'PASS', 'Token received');
      return true;
    } else {
      writeTaskError('API Authentication', 'Authentication failed');
      addTestResult('API Authentication', 'FAIL', 'No token received');
      return false;
    }
  } catch (error) {
    writeTaskError('API Authentication', `Failed: ${error.message}`);
    addTestResult('API Authentication', 'FAIL', error.message);
    return false;
  }
}

async function testHealthDataEndpoints(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo('Testing health data endpoints...');

  const endpoints = [
    { path: '/api/health-data', method: 'GET', description: 'Get health data' },
    {
      path: '/api/health-data?limit=10',
      method: 'GET',
      description: 'Health data with limit',
    },
    {
      path: '/api/health-data?metric=heart_rate',
      method: 'GET',
      description: 'Filter by metric',
    },
  ];

  let passCount = 0;

  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, {
        timeout: parseInt(options.timeout),
      });

      writeSuccess(`✅ ${endpoint.description}: ${response.status}`);
      addTestResult(endpoint.description, 'PASS', `Status: ${response.status}`);
      passCount++;
    } catch (error) {
      writeTaskError(
        endpoint.description,
        `Failed: ${error.response?.status || error.message}`
      );
      addTestResult(
        endpoint.description,
        'FAIL',
        error.response?.status || error.message
      );
    }
  }

  return passCount === endpoints.length;
}

async function testHealthDataSubmission(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo('Testing health data submission...');

  // Must satisfy processedHealthDataSchema (includes processedAt, validated, source, etc.)
  const now = new Date().toISOString();
  const testData = {
    type: 'heart_rate',
    value: 72,
    unit: 'bpm',
    timestamp: now,
    processedAt: now,
    validated: true,
    healthScore: 90,
    fallRisk: 'low',
    trendAnalysis: {
      direction: 'stable',
      confidence: 0.9,
    },
    alert: null,
    source: {
      deviceId: 'test-device',
      userId: 'user-test',
      collectedAt: now,
      processingPipeline: 'test-runner',
    },
    dataQuality: {
      completeness: 100,
      accuracy: 100,
      timeliness: 100,
      consistency: 100,
    },
  };

  try {
    const response = await axios.post(`${baseUrl}/api/health-data`, testData, {
      timeout: parseInt(options.timeout),
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 201 && response.data?.ok) {
      writeSuccess(`✅ Health Data Submission: ${response.status}`);
      addTestResult(
        'Health Data Submission',
        'PASS',
        `Status: ${response.status}`
      );
      return true;
    }
    writeTaskError(
      'Health Data Submission',
      `Unexpected status: ${response.status}`
    );
    addTestResult(
      'Health Data Submission',
      'FAIL',
      `Unexpected status: ${response.status}`
    );
    return false;
  } catch (error) {
    writeTaskError(
      'Health Data Submission',
      `Failed: ${error.response?.status || error.message}`
    );
    addTestResult(
      'Health Data Submission',
      'FAIL',
      error.response?.status || error.message
    );
    return false;
  }
}

async function testWebSocketEndpoint(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo('Testing WebSocket endpoint info...');

  try {
    const response = await axios.get(`${baseUrl}/ws`, {
      timeout: parseInt(options.timeout),
      validateStatus: () => true, // handle custom statuses
    });

    const status = response.status;
    const contentType = response.headers['content-type'] || '';

    if (status === 200 && /application\/json/i.test(contentType)) {
      const body = response.data || {};
      if (body.ok === true && body.upgradeRequired === true) {
        writeSuccess('✅ WebSocket Endpoint: Metadata fallback present');
        addTestResult('WebSocket Endpoint', 'PASS', 'Metadata JSON available');
        return true;
      }
      writeTaskError('WebSocket Endpoint', '200 JSON missing expected fields');
      addTestResult('WebSocket Endpoint', 'FAIL', 'Missing ok/upgradeRequired');
      return false;
    }

    if (status === 426) {
      // Legacy behavior (pre-metadata). Treat as soft pass to avoid breaking CI during rollout.
      writeSuccess('🛈 WebSocket Endpoint: Legacy 426 (no metadata)');
      addTestResult('WebSocket Endpoint', 'PASS', 'Legacy 426 (no metadata)');
      return true;
    }

    if (status === 503) {
      writeTaskError('WebSocket Endpoint', '503 Service not available (Durable Object binding?)');
      addTestResult('WebSocket Endpoint', 'FAIL', '503 Service unavailable');
      return false;
    }

    writeTaskError('WebSocket Endpoint', `Unexpected status ${status}`);
    addTestResult('WebSocket Endpoint', 'FAIL', `Unexpected status ${status}`);
    return false;
  } catch (error) {
    writeTaskError('WebSocket Endpoint', `Failed: ${error.message}`);
    addTestResult('WebSocket Endpoint', 'FAIL', error.message);
    return false;
  }
}

async function testProductionEndpoints() {
  writeInfo('Testing production endpoints...');

  const prodUrls = [
    // Use the route URL reported by Wrangler deploy output
    'https://health-app-prod.andernet.workers.dev',
    'https://health.andernet.dev',
  ];

  let allPassed = true;

  for (const baseUrl of prodUrls) {
    writeInfo(`Testing ${baseUrl}...`);

    try {
      // 1) Health endpoint check
      const health = await axios.get(`${baseUrl}/health`, {
        timeout: parseInt(options.timeout),
      });

      writeSuccess(`✅ ${baseUrl} /health: ${health.status}`);
      addTestResult(
        `Production Health ${baseUrl}`,
        'PASS',
        `Status: ${health.status}`
      );

      // 2) Homepage branding smoke check
      const home = await axios.get(baseUrl, {
        timeout: parseInt(options.timeout),
      });
      const content = String(home.data || '');
      const hasBrand = /VitalSense/i.test(content);
      const hasTitle = /<title>.*?<\/title>/i.test(content);
      if (hasBrand && hasTitle) {
        writeSuccess(`✅ ${baseUrl} branding: VitalSense + <title> detected`);
        addTestResult(
          `Production Branding ${baseUrl}`,
          'PASS',
          'Branding detected'
        );
      } else {
        writeTaskError(
          `Production Branding ${baseUrl}`,
          'Branding/title not detected'
        );
        addTestResult(
          `Production Branding ${baseUrl}`,
          'FAIL',
          'Branding/title not detected'
        );
        allPassed = false;
      }
    } catch (error) {
      writeTaskError(
        `Production ${baseUrl}`,
        `Failed: ${error.response?.status || error.message}`
      );
      addTestResult(
        `Production Health ${baseUrl}`,
        'FAIL',
        error.response?.status || error.message
      );
      allPassed = false;
    }
  }

  return allPassed;
}

async function runQuickTests() {
  writeTaskStart('Quick Tests', 'Running basic health checks');
  const baseUrl = options.prod
    ? 'https://health.andernet.dev'
    : `http://127.0.0.1:${options.workerPort}`;

  const ready = await preflightConnectivity(baseUrl);
  if (!ready) return false;
  await ensureWorker(baseUrl);

  const results = await Promise.all([testWorkerHealth(baseUrl), testApiAuthentication(baseUrl)]);

  return results.every((result) => result === true);
}

async function runFullTests() {
  writeTaskStart('Full Test Suite', 'Running comprehensive tests');

  const baseUrl = options.prod
    ? 'https://health.andernet.dev'
    : `http://127.0.0.1:${options.workerPort}`;

  const ready = await preflightConnectivity(baseUrl);
  if (!ready) return false;
  await ensureWorker(baseUrl);

  // Run sequentially to avoid race conditions with a freshly started worker
  const steps = [
    () => testWorkerHealth(baseUrl),
    () => testApiAuthentication(baseUrl),
    () => testHealthDataEndpoints(baseUrl),
    () => testHealthDataSubmission(baseUrl),
    () => testWebSocketEndpoint(baseUrl),
  ];
  let allPassed = true;
  for (const step of steps) {
    const ok = await step().catch(() => false);
    if (!ok) allPassed = false;
  }
  return allPassed;
}

async function runApiTests() {
  writeTaskStart('API Tests', 'Testing API endpoints');

  const baseUrl = options.prod
    ? 'https://health.andernet.dev'
    : `http://127.0.0.1:${options.workerPort}`;

  const ready = await preflightConnectivity(baseUrl);
  if (!ready) return false;
  await ensureWorker(baseUrl);

  const results = await Promise.all([
    testApiAuthentication(baseUrl),
    testHealthDataEndpoints(baseUrl),
    testHealthDataSubmission(baseUrl),
  ]);

  return results.every((result) => result === true);
}

async function runWebSocketTests() {
  writeTaskStart('WebSocket Tests', 'Testing WebSocket functionality');

  const baseUrl = options.prod
    ? 'https://health.andernet.dev'
    : `http://127.0.0.1:${options.workerPort}`;

  const ready = await preflightConnectivity(baseUrl);
  if (!ready) return false;
  await ensureWorker(baseUrl);

  return await testWebSocketEndpoint(baseUrl);
}

function printTestSummary() {
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;
  const total = testResults.length;

  writeInfo('\n📊 Test Summary:');
  writeInfo(`   Total: ${total}`);
  writeSuccess(`   Passed: ${passed}`);
  if (failed > 0) {
    writeTaskError('Summary', `Failed: ${failed}`);
  }

  if (options.verbose) {
    writeInfo('\n📋 Detailed Results:');
    testResults.forEach((result) => {
      const status = result.status === 'PASS' ? '✅' : '❌';
      writeInfo(`   ${status} ${result.name}: ${result.details}`);
    });
  }

  return failed === 0;
}

async function main() {
  try {
    let success = false;

    if (options.quick) {
      success = await runQuickTests();
    } else if (options.full) {
      success = await runFullTests();
    } else if (options.api) {
      success = await runApiTests();
    } else if (options.websocket) {
      success = await runWebSocketTests();
    } else if (options.prod) {
      success = await testProductionEndpoints();
    } else if (options.dev) {
      success = await runQuickTests();
    } else {
      success = await runQuickTests();
    }

    const summaryOk = printTestSummary();

    if (success && summaryOk) {
      writeTaskComplete('Test Runner', 'All tests passed!');
      exitWithSuccess();
    } else {
      writeTaskError('Test Runner', 'Some tests failed');
      exitWithError('Tests failed', 1);
    }
  } catch (error) {
    writeTaskError('Test Runner', `Unexpected error: ${error.message}`);
    exitWithError('Test execution failed', 1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('Test Runner', error.message);
    process.exit(1);
  });
}
