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
  exitWithSuccess 
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
  .option('-t, --timeout <ms>', 'Request timeout in milliseconds', '5000')
  .option('-v, --verbose', 'Show detailed output')
  .parse();

const options = program.opts();
const testResults = [];

// Default to development tests if no specific test type is selected
if (!options.quick && !options.full && !options.api && !options.websocket && !options.ios && !options.prod) {
  options.dev = true;
}

function addTestResult(name, status, details = '') {
  testResults.push({
    name,
    status,
    details,
    timestamp: new Date().toISOString()
  });
}

async function testWorkerHealth(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo(`Testing Worker health at ${baseUrl}...`);
  
  try {
    const response = await axios.get(`${baseUrl}/health`, {
      timeout: parseInt(options.timeout)
    });
    
    if (response.data.status === 'healthy') {
      writeSuccess(`✅ Worker Health: OK (${response.data.environment || 'unknown'})`);
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
    const response = await axios.post(`${baseUrl}/api/device/auth`, {
      userId: 'test-user'
    }, {
      timeout: parseInt(options.timeout),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
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
    { path: '/api/health-data?limit=10', method: 'GET', description: 'Health data with limit' },
    { path: '/api/health-data?metric=heart_rate', method: 'GET', description: 'Filter by metric' }
  ];

  let passCount = 0;
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.get(`${baseUrl}${endpoint.path}`, {
        timeout: parseInt(options.timeout)
      });
      
      writeSuccess(`✅ ${endpoint.description}: ${response.status}`);
      addTestResult(endpoint.description, 'PASS', `Status: ${response.status}`);
      passCount++;
    } catch (error) {
      writeTaskError(endpoint.description, `Failed: ${error.response?.status || error.message}`);
      addTestResult(endpoint.description, 'FAIL', error.response?.status || error.message);
    }
  }
  
  return passCount === endpoints.length;
}

async function testHealthDataSubmission(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo('Testing health data submission...');
  
  const testData = {
    type: 'heart_rate',
    value: 72,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    source: 'test_client'
  };

  try {
    const response = await axios.post(`${baseUrl}/api/health-data`, testData, {
      timeout: parseInt(options.timeout),
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    writeSuccess(`✅ Health Data Submission: ${response.status}`);
    addTestResult('Health Data Submission', 'PASS', `Status: ${response.status}`);
    return true;
  } catch (error) {
    writeTaskError('Health Data Submission', `Failed: ${error.response?.status || error.message}`);
    addTestResult('Health Data Submission', 'FAIL', error.response?.status || error.message);
    return false;
  }
}

async function testWebSocketEndpoint(baseUrl = 'http://127.0.0.1:8789') {
  writeInfo('Testing WebSocket endpoint info...');
  
  try {
    const response = await axios.get(`${baseUrl}/ws`, {
      timeout: parseInt(options.timeout)
    });
    
    writeSuccess(`✅ WebSocket Endpoint: ${response.status}`);
    addTestResult('WebSocket Endpoint', 'PASS', `Status: ${response.status}`);
    return true;
  } catch (error) {
    writeTaskError('WebSocket Endpoint', `Failed: ${error.response?.status || error.message}`);
    addTestResult('WebSocket Endpoint', 'FAIL', error.response?.status || error.message);
    return false;
  }
}

async function testProductionEndpoints() {
  writeInfo('Testing production endpoints...');
  
  const prodUrls = [
    'https://health-app-prod.workers.dev',
    'https://health.andernet.dev'
  ];

  let allPassed = true;
  
  for (const baseUrl of prodUrls) {
    writeInfo(`Testing ${baseUrl}...`);
    
    try {
      const response = await axios.get(`${baseUrl}/health`, {
        timeout: parseInt(options.timeout)
      });
      
      writeSuccess(`✅ ${baseUrl}: ${response.status}`);
      addTestResult(`Production Health ${baseUrl}`, 'PASS', `Status: ${response.status}`);
    } catch (error) {
      writeTaskError(`Production ${baseUrl}`, `Failed: ${error.response?.status || error.message}`);
      addTestResult(`Production Health ${baseUrl}`, 'FAIL', error.response?.status || error.message);
      allPassed = false;
    }
  }
  
  return allPassed;
}

async function runQuickTests() {
  writeTaskStart('Quick Tests', 'Running basic health checks');
  
  const results = await Promise.all([
    testWorkerHealth(),
    testApiAuthentication()
  ]);
  
  return results.every(result => result === true);
}

async function runFullTests() {
  writeTaskStart('Full Test Suite', 'Running comprehensive tests');
  
  const baseUrl = options.prod ? 'https://health.andernet.dev' : 'http://127.0.0.1:8789';
  
  const results = await Promise.allSettled([
    testWorkerHealth(baseUrl),
    testApiAuthentication(baseUrl),
    testHealthDataEndpoints(baseUrl),
    testHealthDataSubmission(baseUrl),
    testWebSocketEndpoint(baseUrl)
  ]);
  
  return results.every(result => result.status === 'fulfilled' && result.value === true);
}

async function runApiTests() {
  writeTaskStart('API Tests', 'Testing API endpoints');
  
  const baseUrl = options.prod ? 'https://health.andernet.dev' : 'http://127.0.0.1:8789';
  
  const results = await Promise.all([
    testApiAuthentication(baseUrl),
    testHealthDataEndpoints(baseUrl),
    testHealthDataSubmission(baseUrl)
  ]);
  
  return results.every(result => result === true);
}

async function runWebSocketTests() {
  writeTaskStart('WebSocket Tests', 'Testing WebSocket functionality');
  
  const baseUrl = options.prod ? 'https://health.andernet.dev' : 'http://127.0.0.1:8789';
  
  return await testWebSocketEndpoint(baseUrl);
}

function printTestSummary() {
  const passed = testResults.filter(r => r.status === 'PASS').length;
  const failed = testResults.filter(r => r.status === 'FAIL').length;
  const total = testResults.length;
  
  writeInfo('\n📊 Test Summary:');
  writeInfo(`   Total: ${total}`);
  writeSuccess(`   Passed: ${passed}`);
  if (failed > 0) {
    writeTaskError('Summary', `Failed: ${failed}`);
  }
  
  if (options.verbose) {
    writeInfo('\n📋 Detailed Results:');
    testResults.forEach(result => {
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
  main().catch(error => {
    writeTaskError('Test Runner', error.message);
    process.exit(1);
  });
}
