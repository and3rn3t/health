#!/usr/bin/env node

/**
 * Test the new dedicated WebSocket worker
 */

import WebSocket from 'ws';

const url = 'wss://vitalsense-websocket-dev.andernet.workers.dev/ws?userId=test-user&deviceId=test-device';

console.log('🔌 Testing New WebSocket Worker');
console.log('===============================');
console.log(`Target: ${url}`);
console.log('');

const ws = new WebSocket(url);

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened!');
  
  // Send a ping
  ws.send(JSON.stringify({
    type: 'ping',
    timestamp: new Date().toISOString()
  }));
  
  console.log('📤 Sent ping message');
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
  
  try {
    const message = JSON.parse(data.toString());
    if (message.type === 'pong') {
      console.log('🏓 Received pong response!');
      console.log('🎉 WebSocket test successful!');
      ws.close();
    }
  } catch (_e) {
    // ignore parse errors
  }
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket closed: ${code} ${reason || 'No reason'}`);
  process.exit(code === 1000 ? 0 : 1);
});

// Timeout after 10 seconds
setTimeout(() => {
  if (ws.readyState !== WebSocket.OPEN) {
    console.log('⏰ Connection timeout');
    ws.terminate();
    process.exit(1);
  }
}, 10000);