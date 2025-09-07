#!/usr/bin/env node

const WebSocket = require('ws');

const server = new WebSocket.Server({
  port: 3001,
  host: '0.0.0.0', // Listen on all interfaces
});

console.log('🚀 WebSocket server starting on ws://localhost:3001');

server.on('connection', function connection(ws, request) {
  const clientIP = request.socket.remoteAddress;
  console.log(`✅ New client connected from ${clientIP}`);

  // Send welcome message
  ws.send(
    JSON.stringify({
      type: 'welcome',
      message: 'Connected to HealthKit WebSocket server',
      timestamp: new Date().toISOString(),
    })
  );

  ws.on('message', function incoming(data) {
    try {
      const message = JSON.parse(data.toString());
      console.log('📥 Received:', message);

      // Echo back health data with confirmation
      if (message.type === 'health_data') {
        const response = {
          type: 'health_data_ack',
          received: message.data,
          timestamp: new Date().toISOString(),
          status: 'success',
        };
        ws.send(JSON.stringify(response));
        console.log('📤 Sent acknowledgment for health data');
      }
    } catch (error) {
      console.error('❌ Error parsing message:', error);
    }
  });

  ws.on('close', function close() {
    console.log('🔌 Client disconnected');
  });

  ws.on('error', function error(err) {
    console.error('❌ WebSocket error:', err);
  });

  // Handle ping frames
  ws.on('ping', function ping() {
    console.log('🏓 Received ping, sending pong');
    ws.pong();
  });
});

server.on('error', function error(err) {
  console.error('❌ Server error:', err);
});

console.log('🎯 WebSocket server ready and waiting for connections...');
console.log('💡 To test: Open your HealthKit app and try to connect!');
