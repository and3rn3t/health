#!/usr/bin/env node

/**
 * Minimal WebSocket server test to isolate the issue
 */

const WebSocket = require('ws');
const express = require('express');

console.log('🔧 Creating minimal WebSocket server test...');

const app = express();
const server = app.listen(3002, () => {
  console.log('✅ HTTP server running on port 3002');
});

const wss = new WebSocket.Server({
  server: server,
  path: '/ws',
});

console.log('🔌 WebSocket server created');

wss.on('connection', (ws, req) => {
  console.log('📱 NEW CONNECTION RECEIVED!');
  console.log(`   Client IP: ${req.socket.remoteAddress}`);

  ws.send(
    JSON.stringify({
      type: 'welcome',
      message: 'Hello from minimal server',
    })
  );

  ws.on('message', (data) => {
    console.log('📥 Received:', data.toString());
    ws.send(
      JSON.stringify({
        type: 'echo',
        received: data.toString(),
      })
    );
  });

  ws.on('close', () => {
    console.log('👋 Connection closed');
  });
});

console.log('🚀 Minimal server ready - try: ws://localhost:3002/ws');
