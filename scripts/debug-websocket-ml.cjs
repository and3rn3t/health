#!/usr/bin/env node

/**
 * Simple WebSocket test to debug ML features
 */

const WebSocket = require('ws');

console.log('🧪 Simple WebSocket ML Test');
console.log('============================');

const ws = new WebSocket('ws://localhost:3001/ws');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket');

  // Test 1: Client identification
  console.log('📤 Sending client identification...');
  ws.send(
    JSON.stringify({
      type: 'client_identification',
      userId: 'test-user-debug',
      deviceInfo: {
        type: 'test_client',
        version: '1.0.0',
      },
    })
  );

  // Test 2: Send ML health data after 2 seconds
  setTimeout(() => {
    console.log('📤 Sending ML health data...');
    ws.send(
      JSON.stringify({
        type: 'vitalsense_health_data',
        data: {
          metric_type: 'heart_rate',
          value: 75,
          timestamp: new Date().toISOString(),
        },
      })
    );
  }, 2000);

  // Test 3: Request predictions after 4 seconds
  setTimeout(() => {
    console.log('📤 Requesting predictions...');
    ws.send(
      JSON.stringify({
        type: 'request_predictions',
        metrics: ['heart_rate'],
        time_horizon_days: 7,
      })
    );
  }, 4000);

  // Close after 8 seconds
  setTimeout(() => {
    console.log('🔚 Closing connection');
    ws.close();
  }, 8000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received:', message.type);
    if (message.data) {
      console.log('   Data keys:', Object.keys(message.data));
    }
  } catch (_error) {
    console.log('📥 Raw message:', data.toString());
  }
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message);
});

ws.on('close', () => {
  console.log('👋 WebSocket closed');
  process.exit(0);
});
