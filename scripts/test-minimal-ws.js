#!/usr/bin/env node

/**
 * Test client for minimal WebSocket server
 */

import WebSocket from 'ws';

console.log('🧪 Testing minimal WebSocket server');

const ws = new WebSocket('ws://localhost:3002/ws');

ws.on('open', () => {
  console.log('✅ Connected to minimal server');
  ws.send('Hello minimal server!');
});

ws.on('message', (data) => {
  console.log('📥 Received:', data.toString());
});

ws.on('error', (error) => {
  console.log('❌ Error:', error.message);
});

ws.on('close', () => {
  console.log('👋 Connection closed');
  process.exit(0);
});

setTimeout(() => {
  ws.close();
}, 2000);
