#!/usr/bin/env node

/**
 * Production Integration Test for VitalSense
 * Tests the complete iOS → Backend → Web dashboard flow
 */

import https from 'https';
import WebSocket from 'ws';

const PROD_WS_URL = 'wss://health.andernet.dev/ws';

class ProductionIntegrationTest {
  constructor() {
    this.results = {
      health: false,
      api: false,
      webApp: false,
      websocket: false,
      authentication: false,
    };
  }

  async runAllTests() {
    console.log('🚀 VitalSense Production Integration Test Suite');
    console.log('==================================================\n');

    try {
      await this.testHealthEndpoint();
      await this.testWebApplication();
      await this.testAPIAuthentication();
      await this.testWebSocketConnection();

      this.printSummary();
    } catch (error) {
      console.error('❌ Critical test error:', error.message);
    }
  }

  async testHealthEndpoint() {
    console.log('🔍 Testing Health Endpoint...');
    try {
      const response = await this.httpsRequest('/health');
      if (response.statusCode === 200) {
        const data = JSON.parse(response.body);
        console.log('✅ Health endpoint working');
        console.log(`   Status: ${data.status}`);
        console.log(`   Environment: ${data.environment}`);
        console.log(`   Timestamp: ${data.timestamp}`);
        this.results.health = true;
      } else {
        console.log(`❌ Health endpoint failed: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Health endpoint error: ${error.message}`);
    }
    console.log('');
  }

  async testWebApplication() {
    console.log('🌐 Testing Web Application...');
    try {
      const response = await this.httpsRequest('/');
      if (response.statusCode === 200) {
        const hasVitalSense = response.body.includes('VitalSense');
        const hasTitle = response.body.includes('<title>');

        console.log('✅ Web application loading');
        console.log(`   VitalSense branding: ${hasVitalSense ? '✅' : '❌'}`);
        console.log(`   HTML structure: ${hasTitle ? '✅' : '❌'}`);
        console.log(`   Response size: ${response.body.length} bytes`);

        this.results.webApp = hasVitalSense && hasTitle;
      } else {
        console.log(`❌ Web application failed: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ Web application error: ${error.message}`);
    }
    console.log('');
  }

  async testAPIAuthentication() {
    console.log('🔐 Testing API Authentication...');
    try {
      // Test without authentication (should get 401)
      const response = await this.httpsRequest('/api/health-data');
      if (response.statusCode === 401) {
        console.log('✅ API properly secured (401 Unauthorized)');
        this.results.api = true;
      } else {
        console.log(`❌ Unexpected API response: ${response.statusCode}`);
      }
    } catch (error) {
      console.log(`❌ API authentication error: ${error.message}`);
    }
    console.log('');
  }

  async testWebSocketConnection() {
    console.log('🔌 Testing WebSocket Connection...');
    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(
          PROD_WS_URL + '?userId=test-user&deviceId=test-device',
          {
            timeout: 10000,
          }
        );

        let connectionEstablished = false;

        ws.on('open', () => {
          console.log('✅ WebSocket connection opened');
          // Wait for welcome message before marking as successful
        });

        ws.on('message', (data) => {
          try {
            const message = JSON.parse(data.toString());
            console.log(`   📩 Received: ${message.type}`);

            if (message.type === 'connection_established') {
              console.log('✅ WebSocket connection fully established');
              console.log(`   User ID: ${message.userId}`);
              console.log(`   Device ID: ${message.deviceId}`);
              console.log(`   Session ID: ${message.sessionId}`);
              this.results.websocket = true;
              connectionEstablished = true;
              ws.close();
            }
          } catch (e) {
            console.log(`   ⚠️ Message parse error: ${e.message}`);
          }
        });

        ws.on('error', (error) => {
          console.log(`❌ WebSocket connection failed: ${error.message}`);
          resolve();
        });

        ws.on('close', (code, reason) => {
          if (connectionEstablished) {
            console.log('   WebSocket connection closed gracefully');
          } else {
            console.log(`❌ WebSocket closed unexpectedly: ${code} ${reason}`);
          }
          resolve();
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (ws.readyState === WebSocket.CONNECTING) {
            console.log('❌ WebSocket connection timeout');
            ws.terminate();
            resolve();
          }
        }, 10000);
      } catch (error) {
        console.log(`❌ WebSocket setup error: ${error.message}`);
        resolve();
      }
    });
  }

  async httpsRequest(path) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'health.andernet.dev',
        port: 443,
        path: path,
        method: 'GET',
        timeout: 10000,
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => {
          body += chunk;
        });
        res.on('end', () => {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            body: body,
          });
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });

      req.end();
    });
  }

  printSummary() {
    console.log('\n📊 Production Integration Test Summary');
    console.log('=====================================');

    const tests = [
      { name: 'Health Endpoint', result: this.results.health },
      { name: 'Web Application', result: this.results.webApp },
      { name: 'API Security', result: this.results.api },
      { name: 'WebSocket Connection', result: this.results.websocket },
    ];

    tests.forEach((test) => {
      const status = test.result ? '✅ PASS' : '❌ FAIL';
      console.log(`   ${test.name}: ${status}`);
    });

    const passedTests = Object.values(this.results).filter((r) => r).length;
    const totalTests = Object.keys(this.results).length;

    console.log(`\nOverall: ${passedTests}/${totalTests} tests passed`);

    if (passedTests === totalTests) {
      console.log(
        '\n🎉 ALL TESTS PASSED - Production backend is ready for iOS integration!'
      );
      console.log('\n🚀 Next Steps:');
      console.log('   1. Build and test iOS app with production configuration');
      console.log('   2. Verify health data sync from iOS to backend');
      console.log('   3. Test real-time WebSocket updates');
      console.log('   4. Validate authentication flow');
    } else {
      console.log(
        '\n⚠️  Some tests failed - review configuration before iOS integration'
      );
    }

    // Exit with appropriate code
    process.exit(passedTests === totalTests ? 0 : 1);
  }
}

// Run tests if called directly
const tester = new ProductionIntegrationTest();
tester.runAllTests().catch(console.error);

export default ProductionIntegrationTest;
