#!/usr/bin/env node

/**
 * Test Mock ML Responses - Quick Fix Verification
 * Tests that the VitalSense server provides mock ML responses
 */

import { spawn } from 'child_process';
import WebSocket from 'ws';

const WEBSOCKET_URL = 'ws://localhost:3001/ws';
const SERVER_START_DELAY = 3000; // 3 seconds

let serverProcess = null;

async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function startServer() {
  console.log('🚀 Starting VitalSense Enhanced Server...');

  serverProcess = spawn('node', ['vitalsense-enhanced-server.js'], {
    cwd: 'server',
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) console.log(`[SERVER] ${output}`);
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) console.log(`[SERVER ERROR] ${output}`);
  });

  // Wait for server to start
  await sleep(SERVER_START_DELAY);
  console.log('⏰ Server startup delay completed');
}

async function testMockMLResponses() {
  return new Promise((resolve, reject) => {
    console.log('🧪 Testing Mock ML Responses...');
    console.log(`📡 Connecting to ${WEBSOCKET_URL}`);

    const ws = new WebSocket(WEBSOCKET_URL);
    const responses = [];
    let testPhase = 'connecting';

    // Test timeout
    const timeout = setTimeout(() => {
      console.log(
        `⏰ Test timeout in phase: ${testPhase}, received ${responses.length} messages`
      );
      ws.close();
      reject(
        new Error(`Test timeout after receiving ${responses.length} responses`)
      );
    }, 15000);

    ws.on('open', () => {
      console.log('✅ WebSocket connection opened');
      testPhase = 'waiting_for_connection_established';
      console.log('⏳ Waiting for connection_established message...');
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`📥 Received: ${message.type}`);
        responses.push(message);

        if (message.type === 'connection_established') {
          console.log('✅ Connection established, sending identification');
          testPhase = 'identifying';

          // Send identification after connection established
          ws.send(
            JSON.stringify({
              type: 'client_identification',
              data: {
                user_id: 'test_user_123',
                device_type: 'test_client',
              },
            })
          );
        } else if (message.type === 'identification_acknowledged') {
          console.log('✅ Client identified, sending ML health data');
          testPhase = 'ml_processing';

          // Step 2: Send ML health data
          ws.send(
            JSON.stringify({
              type: 'vitalsense_health_data',
              data: {
                metric_type: 'heart_rate',
                value: 75,
                timestamp: new Date().toISOString(),
                source: 'test_device',
              },
            })
          );
        } else if (message.type === 'vitalsense_health_processing_response') {
          console.log('✅ ML processing response received!');
          console.log('📊 ML Data:', JSON.stringify(message.data, null, 2));
          testPhase = 'predictions';

          // Step 3: Request predictions
          ws.send(
            JSON.stringify({
              type: 'request_predictions',
              data: {
                metrics: ['heart_rate', 'walking_steadiness'],
                time_horizon_days: 7,
              },
            })
          );
        } else if (message.type === 'health_predictions_response') {
          console.log('✅ Predictions response received!');
          console.log('🔮 Predictions:', JSON.stringify(message.data, null, 2));
          testPhase = 'insights';

          // Step 4: Request insights
          ws.send(
            JSON.stringify({
              type: 'request_insights',
              data: {
                focus_areas: ['activity', 'health_trends'],
              },
            })
          );
        } else if (message.type === 'personalized_insights_response') {
          console.log('✅ Insights response received!');
          console.log('💡 Insights:', JSON.stringify(message.data, null, 2));
          testPhase = 'complete';

          clearTimeout(timeout);
          ws.close();
          resolve({
            success: true,
            responses: responses.length,
            phases: [
              'identification',
              'ml_processing',
              'predictions',
              'insights',
            ],
          });
        }
      } catch (error) {
        console.error('❌ Error parsing message:', error);
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', () => {
      console.log('🔌 WebSocket connection closed');
      if (testPhase !== 'complete') {
        clearTimeout(timeout);
        reject(new Error(`Connection closed in phase: ${testPhase}`));
      }
    });
  });
}

async function cleanup() {
  if (serverProcess) {
    console.log('🧹 Cleaning up server process...');
    serverProcess.kill('SIGTERM');
    await sleep(1000);
  }
}

async function main() {
  try {
    await startServer();
    const result = await testMockMLResponses();

    console.log('\n🎉 Mock ML Response Test Results:');
    console.log('================================');
    console.log(`✅ Success: ${result.success}`);
    console.log(`📊 Total responses: ${result.responses}`);
    console.log(`🔄 Phases completed: ${result.phases.join(' → ')}`);
    console.log(
      '\n💡 Quick Fix Option A is working! Mock ML responses are functional.'
    );
  } catch (error) {
    console.error('\n❌ Mock ML Response Test Failed:');
    console.error('================================');
    console.error(error.message);
    console.log('\n🔧 Next steps: Check server logs and connection handlers');
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️ Test interrupted by user');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Test terminated');
  await cleanup();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('💥 Unhandled error:', error);
  await cleanup();
  process.exit(1);
});
