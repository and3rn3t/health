/**
 * Comprehensive Health Platform API Test Suite
 * Node.js implementation replacing test-all-endpoints.ps1
 */

import { setTimeout } from 'node:timers/promises';
import * as fs from 'node:fs/promises';
import axios from 'axios';
import chalk from 'chalk';

class HealthAPITester {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 10000;
    this.retries = options.retries || 2;
    this.outputFormat = options.format || 'console'; // console, json, junit

    // Production worker URLs (override with options.urls or env.WORKER_URLS)
    const defaultUrls = [
      'https://health-app-prod.andernet.workers.dev',
      'https://health.andernet.dev',
    ];

    const envUrls = process.env.WORKER_URLS
      ? process.env.WORKER_URLS.split(',').map((s) => s.trim()).filter(Boolean)
      : null;

    this.workerUrls = Array.isArray(options.urls) && options.urls.length > 0
      ? options.urls
      : envUrls && envUrls.length > 0
        ? envUrls
        : defaultUrls;

    // All API endpoints from worker and documentation
    this.endpoints = [
      {
        path: '/health',
        method: 'GET',
        description: 'Health check endpoint',
        expectStatus: 200,
      },
      {
        path: '/',
        method: 'GET',
        description: 'React app main page',
        expectStatus: 200,
      },
      {
        path: '/api/health-data',
        method: 'GET',
        description: 'Get health data (with pagination)',
        expectStatus: 200,
      },
      {
        path: '/api/health-data?limit=10',
        method: 'GET',
        description: 'Health data with limit',
        expectStatus: 200,
      },
      {
        path: '/api/health-data?metric=heart_rate',
        method: 'GET',
        description: 'Filter by heart rate metric',
        expectStatus: 200,
      },
      {
        path: '/api/_selftest',
        method: 'GET',
        description: 'Crypto/auth self-test (non-prod)',
        expectStatus: 200,
      },
      {
        path: '/api/_admin/purge-health',
        method: 'POST',
        description: 'Admin purge endpoint (non-prod)',
        expectStatus: 200,
      },
      {
        path: '/ws',
        method: 'GET',
        description: 'WebSocket endpoint info',
        expectStatus: 200,
      },
    ];

    // POST test endpoints with sample payloads
    this.postEndpoints = [
      {
        path: '/api/health-data',
        method: 'POST',
        description: 'Submit health data',
        expectStatus: 201,
        body: {
          type: 'heart_rate',
          value: 72,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'test_client',
        },
      },
      {
        path: '/api/health-data',
        method: 'POST',
        description: 'Submit steps data',
        expectStatus: 201,
        body: {
          type: 'steps',
          value: 5000,
          unit: 'count',
          timestamp: new Date().toISOString(),
          source: 'test_client',
        },
      },
    ];

    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      skipped: 0,
      errors: [],
      details: [],
    };
  }

  log(message, color = 'white') {
    if (this.verbose || color !== 'gray') {
      console.log(chalk[color](message));
    }
  }

  async makeRequest(url, endpoint, retryCount = 0) {
    try {
      const config = {
        method: endpoint.method,
        url: `${url}${endpoint.path}`,
        timeout: this.timeout,
        validateStatus: () => true, // Don't throw on non-2xx status
        headers: {
          'User-Agent': 'VitalSense-API-Tester/1.0',
          Accept: 'application/json',
        },
      };

      if (endpoint.body) {
        config.data = endpoint.body;
        config.headers['Content-Type'] = 'application/json';
      }

      const response = await axios(config);
      return {
        success: true,
        status: response.status,
        data: response.data,
        headers: response.headers,
        responseTime:
          response.config.metadata?.endTime -
            response.config.metadata?.startTime || 0,
      };
    } catch (error) {
      if (retryCount < this.retries) {
        this.log(
          `⚠️ Retry ${retryCount + 1}/${this.retries} for ${endpoint.path}`,
          'yellow'
        );
        await setTimeout(1000 * (retryCount + 1));
        return this.makeRequest(url, endpoint, retryCount + 1);
      }

      return {
        success: false,
        error: error.message,
        code: error.code,
        status: error.response?.status,
      };
    }
  }

  async testEndpoint(baseUrl, endpoint) {
    const startTime = Date.now();
    this.results.total++;

    this.log(`🔍 Testing ${endpoint.method} ${endpoint.path}`, 'cyan');

    const result = await this.makeRequest(baseUrl, endpoint);
    const responseTime = Date.now() - startTime;

    const testResult = {
      url: baseUrl,
      endpoint: endpoint.path,
      method: endpoint.method,
      description: endpoint.description,
      responseTime,
      timestamp: new Date().toISOString(),
    };

    if (!result.success) {
      this.results.failed++;
      this.results.errors.push({
        endpoint: endpoint.path,
        error: result.error,
        url: baseUrl,
      });

      testResult.status = 'FAILED';
      testResult.error = result.error;
      this.log(`❌ FAILED: ${endpoint.description} - ${result.error}`, 'red');
    } else {
      const statusMatch = result.status === endpoint.expectStatus;

      if (statusMatch) {
        this.results.passed++;
        testResult.status = 'PASSED';
        testResult.httpStatus = result.status;
        testResult.responseData = result.data;
        this.log(
          `✅ PASSED: ${endpoint.description} (${result.status}) [${responseTime}ms]`,
          'green'
        );
      } else {
        this.results.failed++;
        this.results.errors.push({
          endpoint: endpoint.path,
          error: `Expected status ${endpoint.expectStatus}, got ${result.status}`,
          url: baseUrl,
        });

        testResult.status = 'FAILED';
        testResult.httpStatus = result.status;
        testResult.expectedStatus = endpoint.expectStatus;
        this.log(
          `❌ FAILED: ${endpoint.description} - Expected ${endpoint.expectStatus}, got ${result.status}`,
          'red'
        );
      }
    }

    this.results.details.push(testResult);
    return testResult;
  }

  async testWebSocketEndpoint(baseUrl) {
    this.log(`🔌 Testing WebSocket connectivity`, 'cyan');

    try {
      // Test WebSocket upgrade endpoint
      // For now, just test the HTTP endpoint that provides WS info
      const result = await this.makeRequest(baseUrl, {
        path: '/ws',
        method: 'GET',
        description: 'WebSocket endpoint info',
      });

      if (result.success) {
        this.log(`✅ WebSocket endpoint accessible`, 'green');
        return { success: true, info: result.data };
      } else {
        this.log(`❌ WebSocket endpoint failed: ${result.error}`, 'red');
        return { success: false, error: result.error };
      }
    } catch (error) {
      this.log(`❌ WebSocket test failed: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }

  async runComprehensiveTest() {
    this.log('🏥 Comprehensive Health Platform API Test', 'green');
    this.log('============================================', 'cyan');

    const startTime = Date.now();

    for (const baseUrl of this.workerUrls) {
      this.log(`\n🌐 Testing: ${baseUrl}`, 'blue');
      this.log('─'.repeat(50), 'gray');

      // Test all GET endpoints
      for (const endpoint of this.endpoints) {
        await this.testEndpoint(baseUrl, endpoint);
      }

      // Test POST endpoints (only on non-production if detected)
      const isProduction =
        baseUrl.includes('workers.dev') || baseUrl.includes('andernet.dev');
      if (!isProduction) {
        this.log(`\n📤 Testing POST endpoints (non-production)`, 'yellow');
        for (const endpoint of this.postEndpoints) {
          await this.testEndpoint(baseUrl, endpoint);
        }
      } else {
        this.log(`\n⚠️ Skipping POST tests on production URL`, 'yellow');
        this.results.skipped += this.postEndpoints.length;
      }

      // Test WebSocket endpoint
      await this.testWebSocketEndpoint(baseUrl);
    }

    const totalTime = Date.now() - startTime;
    this.printSummary(totalTime);

    return this.results;
  }

  printSummary(totalTime) {
    this.log('\n📊 Test Summary', 'blue');
    this.log('═'.repeat(40), 'blue');
    this.log(`⏱️  Total Time: ${totalTime}ms`, 'white');
    this.log(`🧪 Total Tests: ${this.results.total}`, 'white');
    this.log(`✅ Passed: ${this.results.passed}`, 'green');
    this.log(`❌ Failed: ${this.results.failed}`, 'red');
    this.log(`⏭️  Skipped: ${this.results.skipped}`, 'yellow');

    const successRate =
      this.results.total > 0
        ? ((this.results.passed / this.results.total) * 100).toFixed(1)
        : 0;

    let successColor = 'red';
    if (successRate >= 90) {
      successColor = 'green';
    } else if (successRate >= 70) {
      successColor = 'yellow';
    }

    this.log(`📈 Success Rate: ${successRate}%`, successColor);

    if (this.results.errors.length > 0) {
      this.log('\n🚨 Errors:', 'red');
      this.results.errors.forEach((error, index) => {
        this.log(
          `${index + 1}. ${error.endpoint} on ${error.url}: ${error.error}`,
          'red'
        );
      });
    }

    // Exit with appropriate code
    process.exitCode = this.results.failed > 0 ? 1 : 0;
  }

  async saveResults(filename) {
    const fs = await import('node:fs/promises');

    const output = {
      summary: {
        total: this.results.total,
        passed: this.results.passed,
        failed: this.results.failed,
        skipped: this.results.skipped,
        successRate:
          this.results.total > 0
            ? ((this.results.passed / this.results.total) * 100).toFixed(1)
            : 0,
      },
      errors: this.results.errors,
      details: this.results.details,
      timestamp: new Date().toISOString(),
    };

    await fs.writeFile(filename, JSON.stringify(output, null, 2));
    this.log(`💾 Results saved to: ${filename}`, 'blue');
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    timeout:
      parseInt(
        args.find((arg) => arg.startsWith('--timeout='))?.split('=')[1]
      ) || 10000,
    retries:
      parseInt(
        args.find((arg) => arg.startsWith('--retries='))?.split('=')[1]
      ) || 2,
    format:
      args.find((arg) => arg.startsWith('--format='))?.split('=')[1] ||
      'console',
    urls:
      args
        .find((arg) => arg.startsWith('--urls='))
        ?.split('=')[1]
        ?.split(',')
        .map((s) => s.trim())
        .filter(Boolean) || undefined,
  };

  const saveFile = args.find((arg) => arg.startsWith('--save='))?.split('=')[1];

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🏥 VitalSense Health Platform API Tester

Usage: node test-all-endpoints.js [options]

Options:
  --verbose, -v          Verbose output
  --timeout=<ms>         Request timeout (default: 10000ms)
  --retries=<n>          Number of retries (default: 2)
  --format=<type>        Output format: console, json (default: console)
  --urls=<u1,u2>         Comma-separated list of base URLs to test
  --save=<filename>      Save results to JSON file
  --help, -h             Show this help

Examples:
  node test-all-endpoints.js --verbose
  node test-all-endpoints.js --timeout=5000 --retries=3
  node test-all-endpoints.js --save=test-results.json
    `);
    process.exit(0);
  }

  try {
    const tester = new HealthAPITester(options);
    const results = await tester.runComprehensiveTest();

    if (saveFile) {
      await tester.saveResults(saveFile);
    }

    return results;
  } catch (error) {
    console.error(chalk.red(`💥 Test suite failed: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (
  process.argv[1] === new URL(import.meta.url).pathname ||
  process.argv[1].endsWith('test-all-endpoints.js')
) {
  main();
}

export { HealthAPITester };
