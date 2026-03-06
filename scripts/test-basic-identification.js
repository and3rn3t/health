#!/usr/bin/env node

/**
 * Basic WebSocket identification test
 */

import WebSocket from 'ws';

console.log('🧪 Basic WebSocket Identification Test');
console.log('======================================');

const ws = new WebSocket('ws://localhost:3001/ws');

let received = false;

ws.on('open', () => {
  console.log('✅ WebSocket connected');

  // Send client identification
  ws.send(
    JSON.stringify({
      type: 'client_identification',
      userId: 'test-user-basic',
      clientType: 'test_client',
      deviceInfo: {
        type: 'test_device',
        version: '1.0.0',
      },
    })
  );

  console.log('📤 Sent client identification');
});

ws.on('message', (data) => {
  received = true;
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received message type:', message.type);
    console.log('📥 Message data:', JSON.stringify(message.data, null, 2));

    if (message.type === 'identification_confirmed') {
      console.log('✅ Client identification confirmed!');
      ws.close();
    }
  } catch (error) {
    console.log('📥 Raw message:', data.toString());
  }
});

ws.on('error', (error) => {
  console.log('❌ WebSocket error:', error.message);
  process.exit(1);
});

ws.on('close', () => {
  if (received) {
    console.log('✅ Test completed successfully');
    process.exit(0);
  } else {
    console.log('❌ No response received from server');
    process.exit(1);
  }
});

// Timeout after 5 seconds
setTimeout(() => {
  if (!received) {
    console.log('⏰ Test timed out - no response from server');
    ws.close();
  }
}, 5000);
