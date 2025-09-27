#!/usr/bin/env node

/**
 * VitalSense Enhanced WebSocket Test Client
 * Tests the enhanced health monitoring features
 */

import WebSocket from 'ws';

console.log('🧪 Testing VitalSense Enhanced WebSocket Connection...');

const ws = new WebSocket(
  'wss://vitalsense-websocket-enhanced-dev.andernet.workers.dev/ws'
);

ws.on('open', () => {
  console.log('✅ Connected to VitalSense Enhanced WebSocket server');

  // Send client identification with VitalSense-specific fields
  ws.send(
    JSON.stringify({
      type: 'client_identification',
      userId: 'test-vitalsense-user',
      clientType: 'vitalsense_test_client',
      deviceInfo: {
        platform: 'test',
        version: '2.0.0-enhanced',
        capabilities: ['health_monitoring', 'emergency_alerts'],
      },
      timestamp: new Date().toISOString(),
    })
  );

  // Wait then send VitalSense health data
  setTimeout(() => {
    console.log('📊 Sending VitalSense health data...');

    ws.send(
      JSON.stringify({
        type: 'vitalsense_health_data',
        data: [
          {
            type: 'heart_rate',
            value: 75,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            confidence: 0.95,
            metadata: {
              source: 'apple_watch',
              activity_level: 'resting',
            },
          },
          {
            type: 'walking_steadiness',
            value: 85,
            unit: 'percent',
            timestamp: new Date().toISOString(),
            confidence: 0.9,
            metadata: {
              measurement_duration: 60,
              surface_type: 'indoor',
            },
          },
          {
            type: 'gait_speed',
            value: 1.2,
            unit: 'm/s',
            timestamp: new Date().toISOString(),
            confidence: 0.88,
            metadata: {
              distance_measured: 100,
              conditions: 'normal',
            },
          },
        ],
        deviceId: 'test-device-001',
        sourceType: 'vitalsense_test',
        timestamp: new Date().toISOString(),
      })
    );
  }, 1000);

  // Test emergency condition - send critical heart rate
  setTimeout(() => {
    console.log('🚨 Testing emergency alert with critical heart rate...');

    ws.send(
      JSON.stringify({
        type: 'vitalsense_health_data',
        data: {
          type: 'heart_rate',
          value: 185, // Critical high heart rate
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          confidence: 0.98,
          metadata: {
            source: 'emergency_test',
            activity_level: 'exercising',
          },
        },
        deviceId: 'test-device-001',
        sourceType: 'vitalsense_emergency_test',
        timestamp: new Date().toISOString(),
      })
    );
  }, 3000);

  // Test fall risk scenario
  setTimeout(() => {
    console.log('⚠️ Testing fall risk detection...');

    ws.send(
      JSON.stringify({
        type: 'vitalsense_health_data',
        data: {
          type: 'walking_steadiness',
          value: 15, // Critical low walking steadiness
          unit: 'percent',
          timestamp: new Date().toISOString(),
          confidence: 0.92,
          metadata: {
            measurement_context: 'unsteady_surface',
            recent_falls: 0,
          },
        },
        deviceId: 'test-device-001',
        sourceType: 'vitalsense_fall_risk_test',
        timestamp: new Date().toISOString(),
      })
    );
  }, 5000);

  // Send heartbeat every 10 seconds
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(
        JSON.stringify({
          type: 'heartbeat',
          timestamp: new Date().toISOString(),
        })
      );
    }
  }, 10000);

  // Cleanup after test
  setTimeout(() => {
    clearInterval(heartbeatInterval);
    console.log('🏁 Test completed, closing connection...');
    ws.close();
  }, 15000);
});

ws.on('message', (data) => {
  try {
    const message = JSON.parse(data.toString());
    console.log('📥 Received:', JSON.stringify(message, null, 2));

    // Highlight VitalSense-specific responses
    if (message.type === 'vitalsense_connection_established') {
      console.log(
        '🏥 VitalSense Enhanced features available:',
        message.data.capabilities
      );
    }

    if (message.type === 'vitalsense_live_health_update') {
      console.log(
        '📊 Health metrics processed:',
        message.data.metrics?.length || 0
      );
      if (message.data.alerts && message.data.alerts.length > 0) {
        console.log('🚨 Health alerts triggered:', message.data.alerts.length);
        message.data.alerts.forEach((alert) => {
          console.log(`   ${alert.severity.toUpperCase()}: ${alert.title}`);
        });
      }
      if (message.data.wellness_insights) {
        console.log(
          '💡 Wellness score:',
          message.data.wellness_insights.overall_wellness_score
        );
      }
    }

    if (message.type === 'vitalsense_emergency_alert') {
      console.log('🚨 EMERGENCY ALERT RECEIVED:', message.data.alert.title);
    }
  } catch (error) {
    console.error('❌ Error parsing message:', error);
    console.log('Raw message:', data.toString());
  }
});

ws.on('close', (code, reason) => {
  console.log(
    `📴 VitalSense WebSocket connection closed: ${code} ${reason || ''}`
  );
  process.exit(0);
});

ws.on('error', (error) => {
  console.error('❌ VitalSense WebSocket error:', error);
  process.exit(1);
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, closing connection...');
  ws.close();
  process.exit(0);
});
