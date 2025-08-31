#!/usr/bin/env node

const WebSocket = require('ws');

console.log('🍎 Simulating iOS HealthKit data stream...');

async function simulateIOSApp() {
  try {
    // First get device token
    const authResponse = await fetch('http://127.0.0.1:8789/api/device/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: 'demo-user',
        deviceType: 'ios_app',
      }),
    });

    const { token } = await authResponse.json();
    console.log('✅ Got device token');

    // Connect to WebSocket with token
    const ws = new WebSocket(`ws://localhost:3001?token=${token}`);

    ws.on('open', () => {
      console.log('✅ Connected to WebSocket server as iOS device');

      // Identify as iOS app
      ws.send(
        JSON.stringify({
          type: 'client_identification',
          data: {
            clientType: 'ios_app',
            userId: 'demo-user',
            timestamp: new Date().toISOString(),
          },
        })
      );

      // Simulate real-time health data
      let counter = 0;
      const interval = setInterval(() => {
        counter++;

        // Heart rate data
        ws.send(
          JSON.stringify({
            type: 'live_health_update',
            data: {
              type: 'heart_rate',
              value: 65 + Math.random() * 20, // 65-85 bpm
              unit: 'beats/min',
              timestamp: new Date().toISOString(),
              source: 'Apple Watch',
            },
          })
        );

        // Walking steadiness (every 30 seconds)
        if (counter % 6 === 0) {
          ws.send(
            JSON.stringify({
              type: 'live_health_update',
              data: {
                type: 'walking_steadiness',
                value: 0.7 + Math.random() * 0.3, // 0.7-1.0
                unit: 'percentage',
                timestamp: new Date().toISOString(),
                source: 'Apple Watch',
              },
            })
          );
        }

        // Steps (every minute)
        if (counter % 12 === 0) {
          ws.send(
            JSON.stringify({
              type: 'live_health_update',
              data: {
                type: 'steps',
                value: Math.floor(Math.random() * 100), // 0-100 steps per minute
                unit: 'steps',
                timestamp: new Date().toISOString(),
                source: 'iPhone',
              },
            })
          );
        }

        console.log(`📊 Sent health data batch ${counter}`);

        // Stop after 2 minutes of simulation
        if (counter >= 24) {
          clearInterval(interval);
          console.log('✅ Health data simulation complete');
          ws.close();
        }
      }, 5000); // Every 5 seconds
    });

    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        console.log('📥 Received:', message.type);
      } catch (e) {
        console.log('📥 Received:', data.toString());
      }
    });

    ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    ws.on('close', () => {
      console.log('🔌 Disconnected from WebSocket server');
    });
  } catch (error) {
    console.error('❌ Failed to connect:', error.message);
  }
}

simulateIOSApp();
