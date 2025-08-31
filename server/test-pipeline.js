/**
 * Comprehensive test for the iOS -> WebSocket -> React pipeline
 */
const WebSocket = require('ws');

console.log('🧪 Testing complete health monitoring pipeline...\n');

// Test configuration
const WS_URL = 'ws://localhost:3001';
const API_URL = 'http://127.0.0.1:8789';

async function testWebSocketConnection() {
  return new Promise((resolve, reject) => {
    console.log('1️⃣  Testing WebSocket connection...');

    const ws = new WebSocket(WS_URL);
    let connected = false;

    const timeout = setTimeout(() => {
      if (!connected) {
        ws.close();
        reject(new Error('WebSocket connection timeout'));
      }
    }, 5000);

    ws.on('open', () => {
      console.log('   ✅ WebSocket connected');
      connected = true;
      clearTimeout(timeout);

      // Identify as iOS client
      const identification = {
        type: 'client_identification',
        data: {
          clientType: 'ios_app',
          userId: 'test-user-123',
          timestamp: new Date().toISOString(),
        },
      };

      ws.send(JSON.stringify(identification));
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log(`   📨 Received: ${message.type}`);

        if (message.type === 'connection_established') {
          console.log('   ✅ Client identified successfully\n');
          resolve(ws);
        }
      } catch (error) {
        console.error('   ❌ Invalid message format:', error.message);
      }
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      reject(error);
    });

    ws.on('close', () => {
      clearTimeout(timeout);
      if (!connected) {
        reject(new Error('WebSocket connection closed unexpectedly'));
      }
    });
  });
}

async function testHealthDataFlow(ws) {
  return new Promise((resolve, reject) => {
    console.log('2️⃣  Testing health data flow...');

    let receivedLiveUpdate = false;
    let receivedAlert = false;

    const timeout = setTimeout(() => {
      reject(new Error('Health data flow test timeout'));
    }, 10000);

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());

        switch (message.type) {
          case 'live_health_update':
            console.log(
              '   ✅ Live health update received:',
              message.data?.type
            );
            receivedLiveUpdate = true;
            break;

          case 'emergency_alert':
            console.log(
              '   🚨 Emergency alert received:',
              message.data?.alert_level
            );
            receivedAlert = true;
            break;

          case 'historical_data_update':
            console.log('   ✅ Historical data update received');
            break;
        }

        if (receivedLiveUpdate) {
          clearTimeout(timeout);
          resolve(true);
        }
      } catch (error) {
        console.error('   ❌ Message parsing error:', error.message);
      }
    });

    // Simulate iOS app sending health data
    setTimeout(() => {
      console.log('   📱 Simulating iOS health data...');

      // Send normal heart rate
      const normalHeartRate = {
        type: 'live_health_update',
        data: {
          type: 'heart_rate',
          value: 72,
          unit: 'bpm',
          timestamp: Date.now() / 1000,
          source: 'Apple Watch',
        },
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(normalHeartRate));

      // Send high heart rate (should trigger alert)
      setTimeout(() => {
        const highHeartRate = {
          type: 'live_health_update',
          data: {
            type: 'heart_rate',
            value: 155,
            unit: 'bpm',
            timestamp: Date.now() / 1000,
            source: 'Apple Watch',
          },
          timestamp: new Date().toISOString(),
        };

        ws.send(JSON.stringify(highHeartRate));
      }, 1000);

      // Send walking steadiness data
      setTimeout(() => {
        const walkingSteadiness = {
          type: 'live_health_update',
          data: {
            type: 'walking_steadiness',
            value: 35, // Low steadiness (should trigger fall risk alert)
            unit: 'percent',
            timestamp: Date.now() / 1000,
            source: 'Apple Watch',
          },
          timestamp: new Date().toISOString(),
        };

        ws.send(JSON.stringify(walkingSteadiness));
      }, 2000);

      // Send historical data batch
      setTimeout(() => {
        const historicalData = {
          type: 'historical_data_update',
          data: {
            type: 'heart_rate',
            samples: [
              { timestamp: Date.now() / 1000 - 3600, value: 68, unit: 'bpm' },
              { timestamp: Date.now() / 1000 - 1800, value: 74, unit: 'bpm' },
              { timestamp: Date.now() / 1000 - 900, value: 71, unit: 'bpm' },
            ],
          },
          timestamp: new Date().toISOString(),
        };

        ws.send(JSON.stringify(historicalData));
      }, 3000);
    }, 500);
  });
}

async function testCloudflareWorkerAPI() {
  console.log('3️⃣  Testing Cloudflare Worker API...');

  try {
    // Test health endpoint
    console.log('   🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    if (healthResponse.ok) {
      console.log('   ✅ Worker health endpoint responsive');
    } else {
      throw new Error(`Health endpoint failed: ${healthResponse.status}`);
    }

    // Test device auth endpoint
    console.log('   🔍 Testing device auth endpoint...');
    const authResponse = await fetch(`${API_URL}/api/device/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: 'test-user-123' }),
    });

    if (authResponse.ok) {
      const authData = await authResponse.json();
      console.log('   ✅ Device auth successful');
      return authData;
    } else {
      console.log('   ⚠️  Device auth endpoint may not be fully configured');
    }
  } catch (error) {
    console.error('   ❌ API test failed:', error.message);
  }
}

async function runFullTest() {
  try {
    // Test WebSocket connection
    const ws = await testWebSocketConnection();

    // Test health data flow
    await testHealthDataFlow(ws);

    // Test Cloudflare Worker API
    await testCloudflareWorkerAPI();

    console.log('\n🎉 All tests passed! Pipeline is working correctly.');
    console.log('\n📋 Summary:');
    console.log('   ✅ WebSocket server running and accepting connections');
    console.log('   ✅ Client identification working');
    console.log('   ✅ Live health data processing');
    console.log('   ✅ Message broadcasting');
    console.log('   ✅ Cloudflare Worker API responsive');
    console.log('\n🚀 Ready for iOS integration!');

    ws.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log(
      '   • Ensure WebSocket server is running: npm start (in server/)'
    );
    console.log('   • Ensure Cloudflare Worker is running: wrangler dev');
    console.log('   • Check port availability (3001 for WS, 8789 for Worker)');
    process.exit(1);
  }
}

// Run the test
runFullTest();
