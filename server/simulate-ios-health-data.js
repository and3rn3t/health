#!/usr/bin/env node

/**
 * Simulate Continuous Health Data from iOS Device
 * This script continuously sends realistic health data to test the real-time monitoring
 */

const WebSocket = require('ws');

class HealthDataSimulator {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.userId = 'demo-user-ios';
    this.intervalId = null;
    this.heartRateBase = 70;
    this.stepCount = 0;
    this.walkingSteadiness = 0.8;
  }

  async connect() {
    console.log('📱 iOS Health Data Simulator starting...');
    console.log('🔗 Connecting to enhanced server at ws://localhost:3001/ws');

    this.ws = new WebSocket('ws://localhost:3001/ws');

    this.ws.on('open', () => {
      console.log('✅ Connected to VitalSense Enhanced Server');
      this.connected = true;

      // Register as iOS client
      this.ws.send(
        JSON.stringify({
          type: 'client_register',
          data: {
            userId: this.userId,
            clientType: 'ios_app',
            deviceInfo: {
              model: 'iPhone 15 Pro',
              osVersion: '17.0.1',
              appVersion: '1.0.0',
              healthKitVersion: '15.0',
            },
          },
          timestamp: new Date().toISOString(),
        })
      );

      this.startHealthDataSimulation();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'emergency_alert') {
          console.log('🚨 EMERGENCY ALERT:', message.data.message);
        } else if (message.type === 'connection_established') {
          console.log('🤝 Server acknowledged connection');
        }
      } catch (err) {
        // Ignore parsing errors
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    this.ws.on('close', () => {
      console.log('🔌 Connection closed');
      this.connected = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    });
  }

  startHealthDataSimulation() {
    console.log('🏃‍♂️ Starting continuous health data simulation...');
    console.log('📊 Sending health metrics every 3 seconds');
    console.log('💡 Open http://localhost:5173 to see real-time monitoring');
    console.log('⏹️  Press Ctrl+C to stop simulation\n');

    this.intervalId = setInterval(() => {
      this.sendHealthData();
    }, 3000);

    // Send initial data immediately
    this.sendHealthData();
  }

  sendHealthData() {
    if (!this.connected || !this.ws) return;

    // Simulate realistic health data with some variation
    const now = Date.now();

    // Heart rate variation (60-100 bpm with occasional spikes)
    const heartRateVariation = (Math.random() - 0.5) * 10;
    const currentHeartRate = Math.max(
      60,
      Math.min(100, this.heartRateBase + heartRateVariation)
    );

    // Occasionally simulate exercise (higher heart rate)
    if (Math.random() < 0.05) {
      // 5% chance
      this.heartRateBase = 90 + Math.random() * 30; // 90-120 bpm
      console.log('🏃‍♂️ Simulating exercise - elevated heart rate');
    } else if (Math.random() < 0.1) {
      // 10% chance to return to rest
      this.heartRateBase = 70 + Math.random() * 10; // 70-80 bpm
    }

    // Step count increases throughout the day
    this.stepCount += Math.floor(Math.random() * 50) + 5; // 5-55 steps per interval

    // Walking steadiness varies slightly
    this.walkingSteadiness += (Math.random() - 0.5) * 0.05;
    this.walkingSteadiness = Math.max(
      0.3,
      Math.min(1.0, this.walkingSteadiness)
    );

    // Calculate wellness scores
    const heartRateScore = this.calculateHeartRateScore(currentHeartRate);
    const steadinessScore = Math.floor(this.walkingSteadiness * 100);
    const stepScore = Math.min(100, Math.floor((this.stepCount / 10000) * 100));

    const healthData = {
      type: 'health_data_update',
      data: {
        userId: this.userId,
        metrics: [
          {
            metricType: 'heart_rate',
            value: Math.round(currentHeartRate),
            unit: 'bpm',
            timestamp: now,
            source: 'Apple Watch Series 9',
            wellnessScore: heartRateScore,
          },
          {
            metricType: 'walking_steadiness',
            value: Math.round(this.walkingSteadiness * 100) / 100,
            unit: 'score',
            timestamp: now,
            source: 'iPhone HealthKit',
            wellnessScore: steadinessScore,
          },
          {
            metricType: 'step_count',
            value: this.stepCount,
            unit: 'steps',
            timestamp: now,
            source: 'iPhone HealthKit',
            wellnessScore: stepScore,
          },
          {
            metricType: 'gait_speed',
            value: Math.round((1.2 + Math.random() * 0.4) * 100) / 100, // 1.2-1.6 m/s
            unit: 'm/s',
            timestamp: now,
            source: 'iPhone HealthKit',
            wellnessScore: 85 + Math.floor(Math.random() * 15),
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(healthData));

    const time = new Date().toLocaleTimeString();
    console.log(
      `📊 [${time}] HR: ${Math.round(currentHeartRate)} bpm, ` +
        `Steadiness: ${Math.round(this.walkingSteadiness * 100)}%, ` +
        `Steps: ${this.stepCount}`
    );

    // Occasionally trigger alerts for testing
    if (Math.random() < 0.05) {
      // 5% chance
      this.sendTestAlert();
    }
  }

  calculateHeartRateScore(heartRate) {
    if (heartRate < 60) return 60; // Bradycardia concern
    if (heartRate > 100) return Math.max(30, 100 - heartRate); // Tachycardia concern
    return 90 + Math.floor(Math.random() * 10); // Normal range
  }

  sendTestAlert() {
    if (!this.connected || !this.ws) return;

    const alertTypes = [
      {
        metric: 'heart_rate',
        value: 170,
        message: 'Elevated heart rate detected',
      },
      {
        metric: 'walking_steadiness',
        value: 0.25,
        message: 'Walking steadiness below normal',
      },
      { metric: 'fall_detected', value: 1, message: 'Potential fall detected' },
    ];

    const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];

    const alertData = {
      type: 'health_data_update',
      data: {
        userId: this.userId,
        metrics: [
          {
            metricType: alert.metric,
            value: alert.value,
            unit: alert.metric === 'heart_rate' ? 'bpm' : 'score',
            timestamp: Date.now(),
            source: 'Alert System',
            wellnessScore: 20, // Low score to trigger alert
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(alertData));
    console.log(`🚨 Test alert sent: ${alert.message}`);
  }

  disconnect() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    if (this.ws) {
      this.ws.close();
    }
  }
}

// Start simulation
const simulator = new HealthDataSimulator();
simulator.connect().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down health data simulator...');
  simulator.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  simulator.disconnect();
  process.exit(0);
});
