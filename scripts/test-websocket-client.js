#!/usr/bin/env node

import WebSocket from 'ws';

console.log('🧪 Testing VitalSense WebSocket Connection...');

const ws = new WebSocket('ws://localhost:3001');

ws.on('open', () => {
  console.log('✅ Connected to VitalSense WebSocket server');
  
  // Send client identification
  ws.send(JSON.stringify({
    type: 'client_identification',
    data: {
      clientType: 'test_client',
      userId: 'test-user',
      version: '1.0.0',
    },
    timestamp: new Date().toISOString(),
  }));
  
  // Subscribe to health updates
  setTimeout(() => {
    ws.send(JSON.stringify({
      type: 'subscribe_health_updates',
      data: {
        metrics: ['heart_rate', 'steps', 'walking_steadiness'],
        userId: 'test-user',
      },
      timestamp: new Date().toISOString(),
    }));
  }, 1000);
  
  // Send a ping every 10 seconds
  setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'ping',
        data: { timestamp: Date.now() },
        timestamp: new Date().toISOString(),
      }));
      console.log('📤 Sent ping');
    }
  }, 10000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log(`📥 Received [${message.type}]:`, 
      message.type === 'live_health_update' 
        ? `${message.data.metrics?.length || 0} metrics from ${message.data.deviceId}` 
        : message.data
    );
    
    // Log specific health data
    if (message.type === 'live_health_update' && message.data.metrics) {
      message.data.metrics.forEach(metric => {
        console.log(`   💓 ${metric.type}: ${metric.value} ${metric.unit}`);
      });
    }
    
    // Log emergency alerts
    if (message.type === 'emergency_alert') {
      console.log(`🚨 EMERGENCY ALERT: ${message.data.alert.kind} - ${message.data.alert.message}`);
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error.message);
  }
});

ws.on('close', (code, reason) => {
  console.log(`🔌 Connection closed: ${code} ${reason || 'No reason'}`);
});

ws.on('error', (error) => {
  console.error('❌ WebSocket error:', error.message);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down test client...');
  ws.close();
  process.exit(0);
});

console.log('🔗 Connecting to ws://localhost:3001...');
console.log('🔧 Press Ctrl+C to stop the test client');
