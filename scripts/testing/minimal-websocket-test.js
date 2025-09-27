#!/usr/bin/env node

/**
 * Minimal WebSocket Test Script
 *
 * This script tests the most basic WebSocket connection to help isolate
 * the 500 error we're getting from the production WebSocket endpoint.
 */

import WebSocket from 'ws';

const url = 'wss://health.andernet.dev/ws';

console.log('🔌 Testing Minimal WebSocket Connection');
console.log('=====================================');
console.log(`Target: ${url}`);
console.log('');

const ws = new WebSocket(url);

ws.on('open', function open() {
  console.log('✅ WebSocket connection opened!');

  // Send a simple ping
  ws.send(
    JSON.stringify({
      type: 'ping',
      timestamp: new Date().toISOString(),
    })
  );

  console.log('📤 Sent ping message');
});

ws.on('message', function message(data) {
  console.log('📨 Received message:', data.toString());
});

ws.on('error', function error(err) {
  console.error('❌ WebSocket error:', err.message);
  if (err.message.includes('500')) {
    console.log('');
    console.log('💡 This is a 500 Internal Server Error from the server');
    console.log('   The issue is in the Durable Object implementation');
  }
});

ws.on('close', function close(code, reason) {
  console.log(`🔌 WebSocket closed: ${code} ${reason}`);
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
