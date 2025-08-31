#!/usr/bin/env node

const WebSocket = require('ws');

console.log('Testing WebSocket server...');

// Test WebSocket connection
const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Connected to WebSocket server');

  // Identify as test client
  ws.send(
    JSON.stringify({
      type: 'client_identification',
      data: {
        clientType: 'web_app',
        userId: 'test-user',
        timestamp: new Date().toISOString(),
      },
    })
  );

  // Send test health data
  setTimeout(() => {
    console.log('📊 Sending test health data...');
    ws.send(
      JSON.stringify({
        type: 'live_health_update',
        data: {
          type: 'heart_rate',
          value: 72,
          unit: 'bpm',
          timestamp: Date.now() / 1000,
          source: 'test_simulator',
        },
        timestamp: new Date().toISOString(),
      })
    );
  }, 1000);

  // Send test emergency alert
  setTimeout(() => {
    console.log('🚨 Sending test emergency alert...');
    ws.send(
      JSON.stringify({
        type: 'emergency_alert',
        data: {
          metric_type: 'heart_rate',
          alert_level: 'warning',
          message: 'Heart rate elevated',
          value: 125,
          timestamp: Date.now() / 1000,
          user_id: 'test-user',
        },
        timestamp: new Date().toISOString(),
      })
    );
  }, 2000);

  // Close after tests
  setTimeout(() => {
    console.log('👋 Closing connection...');
    ws.close();
  }, 3000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data);
    console.log(
      '📨 Received:',
      message.type,
      message.data ? '(with data)' : '(no data)'
    );
  } catch (error) {
    console.log('📨 Received raw:', data.toString());
  }
});

ws.on('close', () => {
  console.log('❌ WebSocket connection closed');
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error);
  process.exit(1);
});

// Exit after 10 seconds if something goes wrong
setTimeout(() => {
  console.log('⏰ Test timeout - exiting');
  process.exit(1);
}, 10000);
