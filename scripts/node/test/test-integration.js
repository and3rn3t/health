/**
 * Integration Test Suite for Health Monitoring Platform
 * Node.js implementation replacing test-integration.ps1
 */

import { setTimeout } from 'node:timers/promises';
import { createConnection } from 'node:net';
import axios from 'axios';
import chalk from 'chalk';

class IntegrationTester {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.timeout = options.timeout || 5000;
    this.ports = options.ports || [3000, 8787, 8788, 8789, 5173];
    this.endpoints = options.endpoints || [
      'http://localhost:3000',
      'http://localhost:8787',
      'http://localhost:8788', 
      'http://localhost:8789',
      'http://localhost:5173'
    ];
    
    this.results = {
      portTests: [],
      endpointTests: [],
      integrationTests: [],
      summary: {
        total: 0,
        passed: 0,
        failed: 0
      }
    };
  }

  log(message, color = 'white') {
    if (this.verbose || !['gray', 'dim'].includes(color)) {
      console.log(chalk[color](message));
    }
  }

  async testPort(port) {
    return new Promise((resolve) => {
      const connection = createConnection(port, 'localhost');
      
      connection.on('connect', () => {
        connection.end();
        resolve({ port, available: true, status: 'OPEN' });
      });
      
      connection.on('error', () => {
        resolve({ port, available: false, status: 'CLOSED' });
      });
      
      setTimeout(() => {
        connection.destroy();
        resolve({ port, available: false, status: 'TIMEOUT' });
      }, 1000);
    });
  }

  async testHttpEndpoint(url) {
    try {
      const response = await axios.get(`${url}/health`, {
        timeout: this.timeout,
        validateStatus: () => true
      });
      
      return {
        url,
        success: response.status >= 200 && response.status < 400,
        status: response.status,
        data: response.data,
        responseTime: response.headers['x-response-time'] || 'unknown'
      };
    } catch (error) {
      return {
        url,
        success: false,
        error: error.message,
        code: error.code
      };
    }
  }

  async checkSystemStatus() {
    this.log('🔍 Checking system status...', 'yellow');
    
    // Test all ports
    this.log('\n📡 Port Availability:', 'cyan');
    for (const port of this.ports) {
      const result = await this.testPort(port);
      this.results.portTests.push(result);
      
      const icon = result.available ? '✅' : '❌';
      const color = result.available ? 'green' : 'red';
      this.log(`${icon} Port ${port}: ${result.status}`, color);
    }

    // Test HTTP endpoints
    this.log('\n🌐 HTTP Endpoint Health:', 'cyan');
    for (const endpoint of this.endpoints) {
      const result = await this.testHttpEndpoint(endpoint);
      this.results.endpointTests.push(result);
      
      const icon = result.success ? '✅' : '❌';
      const color = result.success ? 'green' : 'red';
      const message = result.success ? 
        `${endpoint}/health: ${result.status} (${result.responseTime})` :
        `${endpoint}/health: ${result.error || 'Failed'}`;
      
      this.log(`${icon} ${message}`, color);
      
      if (result.success) {
        this.results.summary.passed++;
      } else {
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    }
  }

  async testWorkerEndpoints() {
    this.log('\n🏗️ Testing Cloudflare Worker Endpoints:', 'cyan');
    
    const workerTests = [
      { url: 'http://localhost:8788', name: 'Development Worker' },
      { url: 'http://localhost:8789', name: 'Production Worker' }
    ];

    for (const test of workerTests) {
      this.log(`\n🔍 Testing ${test.name}: ${test.url}`, 'blue');
      
      const endpoints = [
        { path: '/health', description: 'Health check' },
        { path: '/', description: 'Main app' },
        { path: '/api/health-data', description: 'Health data API' },
        { path: '/ws', description: 'WebSocket info' }
      ];

      let testPassed = 0;
      let testTotal = 0;

      for (const endpoint of endpoints) {
        testTotal++;
        const fullUrl = `${test.url}${endpoint.path}`;
        
        try {
          const response = await axios.get(fullUrl, { 
            timeout: this.timeout,
            validateStatus: () => true 
          });
          
          const success = response.status >= 200 && response.status < 400;
          if (success) testPassed++;
          
          const icon = success ? '✅' : '❌';
          const color = success ? 'green' : 'red';
          this.log(`  ${icon} ${endpoint.description}: ${response.status}`, color);
          
        } catch (error) {
          this.log(`  ❌ ${endpoint.description}: ${error.message}`, 'red');
        }
      }

      const testResult = {
        name: test.name,
        url: test.url,
        passed: testPassed,
        total: testTotal,
        success: testPassed === testTotal
      };
      
      this.results.integrationTests.push(testResult);
      this.results.summary.total += testTotal;
      this.results.summary.passed += testPassed;
      this.results.summary.failed += (testTotal - testPassed);
    }
  }

  async testWebSocketConnection() {
    this.log('\n🔌 Testing WebSocket Connections:', 'cyan');
    
    const wsTests = [
      { url: 'ws://localhost:3001', name: 'Development WebSocket Server' },
      { url: 'ws://localhost:8788', name: 'Worker WebSocket (8788)' },
      { url: 'ws://localhost:8789', name: 'Worker WebSocket (8789)' }
    ];

    for (const test of wsTests) {
      try {
        // Test WebSocket info endpoint first
        const infoUrl = test.url.replace('ws://', 'http://').replace(':3001', ':8788') + '/ws';
        const response = await axios.get(infoUrl, { 
          timeout: this.timeout,
          validateStatus: () => true 
        });
        
        if (response.status === 200) {
          this.log(`✅ ${test.name}: WebSocket info available`, 'green');
          this.results.summary.passed++;
        } else {
          this.log(`❌ ${test.name}: WebSocket info failed (${response.status})`, 'red');
          this.results.summary.failed++;
        }
        
      } catch (error) {
        this.log(`❌ ${test.name}: ${error.message}`, 'red');
        this.results.summary.failed++;
      }
      
      this.results.summary.total++;
    }
  }

  async testDataFlow() {
    this.log('\n📊 Testing Data Flow Integration:', 'cyan');
    
    // Test health data submission and retrieval
    const workerUrl = 'http://localhost:8789';
    
    try {
      // Test GET health data
      this.log('  🔍 Testing health data retrieval...', 'blue');
      const getResponse = await axios.get(`${workerUrl}/api/health-data`, {
        timeout: this.timeout,
        validateStatus: () => true
      });
      
      if (getResponse.status === 200) {
        this.log('  ✅ Health data retrieval: Success', 'green');
        this.results.summary.passed++;
      } else {
        this.log(`  ❌ Health data retrieval: Failed (${getResponse.status})`, 'red');
        this.results.summary.failed++;
      }
      
      // Test POST health data (only in non-production)
      if (!workerUrl.includes('workers.dev')) {
        this.log('  📤 Testing health data submission...', 'blue');
        const postData = {
          type: 'heart_rate',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          source: 'integration_test'
        };
        
        const postResponse = await axios.post(`${workerUrl}/api/health-data`, postData, {
          timeout: this.timeout,
          validateStatus: () => true,
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (postResponse.status >= 200 && postResponse.status < 300) {
          this.log('  ✅ Health data submission: Success', 'green');
          this.results.summary.passed++;
        } else {
          this.log(`  ❌ Health data submission: Failed (${postResponse.status})`, 'red');
          this.results.summary.failed++;
        }
        
        this.results.summary.total++;
      }
      
      this.results.summary.total++;
      
    } catch (error) {
      this.log(`  ❌ Data flow test failed: ${error.message}`, 'red');
      this.results.summary.failed++;
      this.results.summary.total++;
    }
  }

  async testDependencies() {
    this.log('\n🔗 Testing Service Dependencies:', 'cyan');
    
    const dependencies = [
      { name: 'Node.js', check: () => process.version },
      { name: 'Environment Variables', check: () => process.env.NODE_ENV || 'development' }
    ];

    for (const dep of dependencies) {
      try {
        const result = dep.check();
        this.log(`  ✅ ${dep.name}: ${result}`, 'green');
        this.results.summary.passed++;
      } catch (error) {
        this.log(`  ❌ ${dep.name}: ${error.message}`, 'red');
        this.results.summary.failed++;
      }
      this.results.summary.total++;
    }
  }

  printSummary() {
    this.log('\n📊 Integration Test Summary:', 'blue');
    this.log('═'.repeat(50), 'blue');
    
    const { total, passed, failed } = this.results.summary;
    const successRate = total > 0 ? ((passed / total) * 100).toFixed(1) : 0;
    
    this.log(`🧪 Total Tests: ${total}`, 'white');
    this.log(`✅ Passed: ${passed}`, 'green');
    this.log(`❌ Failed: ${failed}`, 'red');
    
    let statusColor = 'red';
    if (successRate >= 90) {
      statusColor = 'green';
    } else if (successRate >= 70) {
      statusColor = 'yellow';
    }
    
    this.log(`📈 Success Rate: ${successRate}%`, statusColor);
    
    // Detailed results
    if (this.verbose) {
      this.log('\n📋 Detailed Results:', 'cyan');
      
      if (this.results.portTests.length > 0) {
        this.log('\nPort Tests:', 'blue');
        this.results.portTests.forEach(test => {
          const status = test.available ? 'OPEN' : 'CLOSED';
          const color = test.available ? 'green' : 'red';
          this.log(`  Port ${test.port}: ${status}`, color);
        });
      }
      
      if (this.results.integrationTests.length > 0) {
        this.log('\nIntegration Tests:', 'blue');
        this.results.integrationTests.forEach(test => {
          const color = test.success ? 'green' : 'red';
          this.log(`  ${test.name}: ${test.passed}/${test.total}`, color);
        });
      }
    }

    // Recommendations
    this.log('\n💡 Recommendations:', 'yellow');
    if (failed === 0) {
      this.log('  🎉 All tests passed! System is ready for development.', 'green');
    } else {
      this.log('  🔧 Some tests failed. Check the details above.', 'yellow');
      
      const failedPorts = this.results.portTests.filter(t => !t.available);
      if (failedPorts.length > 0) {
        this.log(`  📡 Start servers for ports: ${failedPorts.map(t => t.port).join(', ')}`, 'yellow');
      }
    }
    
    return { success: failed === 0, results: this.results };
  }

  async runFullIntegrationTest() {
    this.log('🧪 Testing Health Monitoring Platform Integration...', 'cyan');
    this.log('═'.repeat(60), 'cyan');
    
    const startTime = Date.now();
    
    try {
      await this.checkSystemStatus();
      await this.testWorkerEndpoints();
      await this.testWebSocketConnection();
      await this.testDataFlow();
      await this.testDependencies();
      
      const totalTime = Date.now() - startTime;
      this.log(`\n⏱️ Total test time: ${totalTime}ms`, 'blue');
      
      return this.printSummary();
      
    } catch (error) {
      this.log(`💥 Integration test failed: ${error.message}`, 'red');
      if (this.verbose) {
        console.error(error.stack);
      }
      return { success: false, error: error.message };
    }
  }

  async saveResults(filename) {
    const fs = await import('node:fs/promises');
    
    const output = {
      summary: this.results.summary,
      timestamp: new Date().toISOString(),
      details: {
        portTests: this.results.portTests,
        endpointTests: this.results.endpointTests,
        integrationTests: this.results.integrationTests
      }
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
    timeout: parseInt(args.find(arg => arg.startsWith('--timeout='))?.split('=')[1]) || 5000
  };

  const saveFile = args.find(arg => arg.startsWith('--save='))?.split('=')[1];

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 VitalSense Health Platform Integration Tester

Usage: node test-integration.js [options]

Options:
  --verbose, -v          Verbose output with detailed results
  --timeout=<ms>         Request timeout (default: 5000ms)
  --save=<filename>      Save results to JSON file
  --help, -h             Show this help

Examples:
  node test-integration.js --verbose
  node test-integration.js --timeout=10000
  node test-integration.js --save=integration-results.json
    `);
    process.exit(0);
  }

  try {
    const tester = new IntegrationTester(options);
    const result = await tester.runFullIntegrationTest();
    
    if (saveFile) {
      await tester.saveResults(saveFile);
    }
    
    process.exitCode = result.success ? 0 : 1;
    return result;
    
  } catch (error) {
    console.error(chalk.red(`💥 Test suite failed: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { IntegrationTester };
