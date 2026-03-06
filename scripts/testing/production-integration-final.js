#!/usr/bin/env node

/**
 * Comprehensive Production Integration Test
 *
 * Tests the complete VitalSense production stack:
 * - Production API (health.andernet.dev/api)
 * - Production WebSocket (vitalsense-websocket-dev.andernet.workers.dev/ws)
 * - iOS Configuration compatibility
 */

import https from 'https';
import WebSocket from 'ws';

console.log('🚀 VitalSense Production Integration Test');
console.log('==========================================');
console.log('');

// Test configurations
const tests = [
  {
    name: 'Production API WebSocket URL',
    type: 'http',
    url: 'https://health.andernet.dev/api/ws-url',
    expectStatus: 200,
  },
  {
    name: 'Production API Status Check',
    type: 'http',
    url: 'https://health.andernet.dev/app-config.js',
    expectStatus: 200,
  },
  {
    name: 'WebSocket Service Health Check',
    type: 'http',
    url: 'https://vitalsense-websocket-dev.andernet.workers.dev/health',
    expectStatus: 200,
  },
  {
    name: 'WebSocket Probe Check',
    type: 'http',
    url: 'https://vitalsense-websocket-dev.andernet.workers.dev/ws',
    expectStatus: 200,
  },
  {
    name: 'WebSocket Real-time Connection',
    type: 'websocket',
    url: 'wss://vitalsense-websocket-dev.andernet.workers.dev/ws?userId=ios-test&deviceId=iphone-test',
    timeout: 5000,
  },
];

let passedTests = 0;
let totalTests = tests.length;

// Helper function to test HTTP endpoints
function testHttpEndpoint(test) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing: ${test.name}`);

    https
      .get(test.url, (res) => {
        const statusMatch = res.statusCode === test.expectStatus;

        if (statusMatch) {
          console.log(`  ✅ ${test.name} - Status: ${res.statusCode}`);
          passedTests++;
          resolve(true);
        } else {
          console.log(
            `  ❌ ${test.name} - Expected: ${test.expectStatus}, Got: ${res.statusCode}`
          );
          resolve(false);
        }
      })
      .on('error', (err) => {
        console.log(`  ❌ ${test.name} - Error: ${err.message}`);
        resolve(false);
      });
  });
}

// Helper function to test WebSocket connection
function testWebSocketConnection(test) {
  return new Promise((resolve) => {
    console.log(`🔍 Testing: ${test.name}`);

    const ws = new WebSocket(test.url);
    let resolved = false;

    const timeout = setTimeout(() => {
      if (!resolved) {
        console.log(`  ❌ ${test.name} - Connection timeout`);
        ws.terminate();
        resolve(false);
        resolved = true;
      }
    }, test.timeout);

    ws.on('open', () => {
      console.log(`  🔌 ${test.name} - Connection opened`);

      // Send ping to test bi-directional communication
      ws.send(
        JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString(),
        })
      );
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'connection_established') {
          console.log(`  ✅ ${test.name} - Welcome received`);
        } else if (message.type === 'pong') {
          console.log(`  ✅ ${test.name} - Ping/Pong successful`);
          clearTimeout(timeout);
          if (!resolved) {
            passedTests++;
            ws.close();
            resolve(true);
            resolved = true;
          }
        }
      } catch (_e) {
        // Ignore parse errors
      }
    });

    ws.on('error', (err) => {
      if (!resolved) {
        console.log(`  ❌ ${test.name} - WebSocket error: ${err.message}`);
        clearTimeout(timeout);
        resolve(false);
        resolved = true;
      }
    });

    ws.on('close', () => {
      if (!resolved) {
        clearTimeout(timeout);
        resolve(false);
        resolved = true;
      }
    });
  });
}

// Run all tests
async function runTests() {
  for (const test of tests) {
    if (test.type === 'http') {
      await testHttpEndpoint(test);
    } else if (test.type === 'websocket') {
      await testWebSocketConnection(test);
    }
    console.log(''); // Add spacing between tests
  }

  // Summary
  console.log('📊 Test Results');
  console.log('================');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  console.log('');

  if (passedTests === totalTests) {
    console.log(
      '🎉 All tests passed! VitalSense production integration is ready!'
    );
    console.log('');
    console.log('📱 iOS Configuration:');
    console.log('   API_BASE_URL: https://health.andernet.dev/api');
    console.log(
      '   WS_URL: wss://vitalsense-websocket-dev.andernet.workers.dev/ws'
    );
    console.log('   Environment: Production');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Check the issues above.');
    process.exit(1);
  }
}

runTests().catch(console.error);
