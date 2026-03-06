#!/usr/bin/env node

/**
 * Test WebSocket Connection to Enhanced Server
 * Simulates health data from iOS app
 */

const WebSocket = require('ws');

async function testWebSocketConnection() {
  console.log('🧪 Testing WebSocket connection to enhanced server...');

  const ws = new WebSocket('ws://localhost:3001/ws');

  ws.on('open', () => {
    console.log('✅ Connected to enhanced server');

    // Register as iOS client
    ws.send(
      JSON.stringify({
        type: 'client_register',
        data: {
          userId: 'test-user-123',
          clientType: 'ios_app',
          deviceInfo: {
            model: 'iPhone 15 Pro',
            osVersion: '17.0.1',
            appVersion: '1.0.0',
          },
        },
        timestamp: new Date().toISOString(),
      })
    );

    // Send some test health data
    setTimeout(() => {
      console.log('📱 Sending test health data...');

      ws.send(
        JSON.stringify({
          type: 'health_data_update',
          data: {
            userId: 'test-user-123',
            metrics: [
              {
                metricType: 'heart_rate',
                value: 72,
                unit: 'bpm',
                timestamp: Date.now(),
                source: 'Apple Watch',
                wellnessScore: 85,
              },
              {
                metricType: 'walking_steadiness',
                value: 0.85,
                unit: 'score',
                timestamp: Date.now(),
                source: 'iPhone HealthKit',
                wellnessScore: 88,
              },
              {
                metricType: 'step_count',
                value: 8542,
                unit: 'steps',
                timestamp: Date.now(),
                source: 'iPhone HealthKit',
                wellnessScore: 92,
              },
            ],
          },
          timestamp: new Date().toISOString(),
        })
      );
    }, 1000);

    // Send emergency alert test
    setTimeout(() => {
      console.log('🚨 Sending emergency alert test...');

      ws.send(
        JSON.stringify({
          type: 'health_data_update',
          data: {
            userId: 'test-user-123',
            metrics: [
              {
                metricType: 'heart_rate',
                value: 180, // High heart rate to trigger alert
                unit: 'bpm',
                timestamp: Date.now(),
                source: 'Apple Watch',
                wellnessScore: 30,
              },
              {
                metricType: 'walking_steadiness',
                value: 0.15, // Low steadiness to trigger alert
                unit: 'score',
                timestamp: Date.now(),
                source: 'iPhone HealthKit',
                wellnessScore: 25,
              },
            ],
          },
          timestamp: new Date().toISOString(),
        })
      );
    }, 3000);

    // Close connection after test
    setTimeout(() => {
      console.log('👋 Closing test connection');
      ws.close();
    }, 5000);
  });

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('📨 Received message:', message.type);

      if (message.type === 'emergency_alert') {
        console.log('🚨 Emergency Alert:', message.data);
      } else if (message.type === 'live_health_update') {
        console.log(
          '💓 Health Update:',
          message.data.metricType,
          message.data.value
        );
      } else if (message.type === 'connection_established') {
        console.log('🤝 Connection established:', message.data);
      }
    } catch (err) {
      console.log('📦 Raw message:', data.toString());
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error.message);
  });

  ws.on('close', () => {
    console.log('🔌 Connection closed');
  });
}

testWebSocketConnection().catch(console.error);
