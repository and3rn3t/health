#!/usr/bin/env node

/**
 * Enhanced health probe utility - Node.js version
 * Replaces scripts/probe.ps1
 */

import { program } from 'commander';
import {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  writeInfo,
  makeHttpRequest,
  getEnvironmentInfo,
  exitWithError,
  exitWithSuccess,
} from '../core/logger.js';

program
  .name('probe')
  .description('Enhanced health checking utility with multiple endpoints')
  .option('-H, --host-url <url>', 'Base host URL', 'http://127.0.0.1')
  .option('-p, --port <port>', 'Port number', '8787')
  .option('-u, --user-id <id>', 'User ID for testing', 'demo-user')
  .option('-c, --client-type <type>', 'Client type', 'ios_app')
  .option('-t, --ttl-sec <seconds>', 'TTL in seconds', '600')
  .option('-v, --verbose', 'Verbose output with environment info')
  .option('-j, --json', 'Output results as JSON')
  .parse();

const options = program.opts();
const baseUrl = `${options.hostUrl}:${options.port}`;

async function testEndpoint(endpoint, description, requestOptions = {}) {
  const url = `${baseUrl}${endpoint}`;

  if (options.verbose) {
    writeInfo(`Testing: ${url}`);
  }

  const result = await makeHttpRequest(url, {
    timeout: 5000,
    ...requestOptions,
  });

  return {
    endpoint,
    description,
    url,
    success: result.success,
    status: result.status,
    data: result.data,
    error: result.error,
    timestamp: new Date().toISOString(),
  };
}

async function main() {
  writeTaskStart('Enhanced Health Probe', `Testing endpoints at ${baseUrl}`);

  // Environment info for Copilot context
  if (options.verbose) {
    const envInfo = await getEnvironmentInfo();
    writeInfo(
      `Environment: Node.js ${envInfo.nodeVersion} on ${envInfo.platform}`
    );
    writeInfo(`Working Directory: ${envInfo.workingDirectory}`);
    if (envInfo.gitBranch !== 'unknown') {
      writeInfo(`Git Branch: ${envInfo.gitBranch}`);
    }
  }

  const results = {
    timestamp: new Date().toISOString(),
    baseUrl,
    environment: options.verbose ? await getEnvironmentInfo() : null,
    tests: [],
  };

  // Test /health endpoint
  const healthTest = await testEndpoint('/health', 'Basic health check');
  results.tests.push(healthTest);

  if (!healthTest.success) {
    const errorMsg = healthTest.error || `HTTP ${healthTest.status}`;
    writeTaskError('Health Probe', `Health endpoint failed: ${errorMsg}`);
  } else {
    writeInfo('✓ Health endpoint OK');
  }

  // Test /api/health-data endpoint
  const apiTest = await testEndpoint('/api/health-data', 'Health data API', {
    params: {
      userId: options.userId,
      limit: 5,
    },
  });
  results.tests.push(apiTest);

  if (!apiTest.success) {
    const errorMsg = apiTest.error || `HTTP ${apiTest.status}`;
    writeTaskError('API Test', `API endpoint failed: ${errorMsg}`);
  } else {
    writeInfo('✓ API endpoint OK');
  }

  // Test device authentication
  const authTest = await testEndpoint(
    '/api/auth/device',
    'Device authentication',
    {
      method: 'POST',
      data: {
        clientType: options.clientType,
        deviceId: 'test-device-id',
        ttlSec: parseInt(options.ttlSec),
      },
    }
  );
  results.tests.push(authTest);

  if (!authTest.success) {
    const errorMsg = authTest.error || `HTTP ${authTest.status}`;
    writeTaskError('Auth Test', `Auth endpoint failed: ${errorMsg}`);
  } else {
    writeInfo('✓ Auth endpoint OK');
  }

  // Summary
  const totalTests = results.tests.length;
  const passedTests = results.tests.filter((t) => t.success).length;
  const failedTests = totalTests - passedTests;

  results.summary = {
    total: totalTests,
    passed: passedTests,
    failed: failedTests,
    success: failedTests === 0,
  };

  if (options.json) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    console.log(`\n📊 Test Summary:`);
    console.log(`   Total: ${totalTests}`);
    console.log(`   Passed: ${passedTests}`);
    console.log(`   Failed: ${failedTests}`);
  }

  if (results.summary.success) {
    writeTaskComplete(
      'Enhanced Health Probe',
      `All ${totalTests} tests passed`
    );
    exitWithSuccess();
  } else {
    writeTaskError(
      'Enhanced Health Probe',
      `${failedTests} of ${totalTests} tests failed`
    );
    exitWithError(`${failedTests} tests failed`, 1);
  }
}

// Only run if this file is executed directly
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('Enhanced Health Probe', error.message);
    process.exit(1);
  });
}
