#!/usr/bin/env node

/**
 * iOS HealthKit Integration Test
 * Simulates the iOS app connecting to the enhanced server with realistic HealthKit data
 */

const WebSocket = require('ws');

class IOSHealthKitSimulator {
  constructor() {
    this.ws = null;
    this.connected = false;
    this.userId = 'ios-user-real';
    this.intervalId = null;

    // Simulate real HealthKit metrics with more variation
    this.baseMetrics = {
      heartRate: 72,
      walkingSteadiness: 0.82,
      stepCount: 0,
      walkingSpeed: 1.3,
      stairAscentSpeed: 0.5,
      activeEnergy: 0,
      flightsClimbed: 0,
    };
  }

  async connect() {
    console.log('🍎 iOS HealthKit Integration Test');
    console.log('📱 Connecting to enhanced server at ws://localhost:3001/ws');
    console.log('⚡ Simulating real iOS HealthKit data transmission\n');

    this.ws = new WebSocket('ws://localhost:3001/ws');

    this.ws.on('open', () => {
      console.log('✅ Connected to VitalSense Enhanced Server');
      this.connected = true;

      // Register as iOS client (matching iOS app format)
      this.registerIOSClient();

      this.startHealthKitDataSimulation();
    });

    this.ws.on('message', (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'emergency_alert') {
          console.log('🚨 EMERGENCY ALERT RECEIVED:', message.data.message);
          console.log(
            `   📊 Metric: ${message.data.metric_type} = ${message.data.value}`
          );
          console.log(
            `   ⚠️  Level: ${message.data.alert_level.toUpperCase()}\n`
          );
        } else if (message.type === 'connection_established') {
          console.log('🤝 Server acknowledged iOS connection');
          console.log(`   📱 Client ID: ${message.data.clientId}`);
          console.log(`   🕐 Server Time: ${message.data.serverTime}\n`);
        }
      } catch (err) {
        // Ignore parsing errors
      }
    });

    this.ws.on('error', (error) => {
      console.error('❌ WebSocket error:', error.message);
    });

    this.ws.on('close', () => {
      console.log('🔌 iOS connection closed');
      this.connected = false;
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
    });
  }

  registerIOSClient() {
    const deviceInfo = {
      model: 'iPhone 15 Pro',
      systemVersion: '17.0.1',
      appVersion: '1.0.0',
      healthKitVersion: 'iOS 17.0.1',
    };

    const registrationMessage = {
      type: 'client_register',
      data: {
        userId: this.userId,
        clientType: 'ios_app',
        deviceInfo: deviceInfo,
      },
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(registrationMessage));
    console.log('📋 Registered iOS client with enhanced server');
  }

  startHealthKitDataSimulation() {
    console.log('🏥 Starting HealthKit data simulation...');
    console.log('📊 Sending health metrics every 2 seconds');
    console.log('💻 Monitor at http://localhost:5173 for real-time dashboard');
    console.log('⏹️  Press Ctrl+C to stop iOS simulation\n');

    this.intervalId = setInterval(() => {
      this.sendHealthKitData();
    }, 2000);

    // Send initial data immediately
    this.sendHealthKitData();
  }

  sendHealthKitData() {
    if (!this.connected || !this.ws) return;

    const now = Date.now();

    // Simulate realistic HealthKit variations
    this.updateMetrics();

    // Create multiple health metrics (iOS sends batches)
    const healthMetrics = [
      {
        metricType: 'heart_rate',
        value: this.baseMetrics.heartRate,
        unit: 'bpm',
        timestamp: now,
        source: 'Apple Watch Series 9',
        wellnessScore: this.calculateWellnessScore(
          'heart_rate',
          this.baseMetrics.heartRate
        ),
      },
      {
        metricType: 'walking_steadiness',
        value: this.baseMetrics.walkingSteadiness,
        unit: 'score',
        timestamp: now,
        source: 'iPhone HealthKit',
        wellnessScore: this.calculateWellnessScore(
          'walking_steadiness',
          this.baseMetrics.walkingSteadiness
        ),
      },
      {
        metricType: 'step_count',
        value: this.baseMetrics.stepCount,
        unit: 'steps',
        timestamp: now,
        source: 'iPhone HealthKit',
        wellnessScore: this.calculateWellnessScore(
          'step_count',
          this.baseMetrics.stepCount
        ),
      },
      {
        metricType: 'walking_speed',
        value: this.baseMetrics.walkingSpeed,
        unit: 'm/s',
        timestamp: now,
        source: 'iPhone HealthKit',
        wellnessScore: this.calculateWellnessScore(
          'walking_speed',
          this.baseMetrics.walkingSpeed
        ),
      },
    ];

    // Add additional metrics occasionally
    if (Math.random() < 0.3) {
      healthMetrics.push({
        metricType: 'active_energy',
        value: this.baseMetrics.activeEnergy,
        unit: 'kcal',
        timestamp: now,
        source: 'Apple Watch',
        wellnessScore: 75 + Math.floor(Math.random() * 20),
      });
    }

    if (Math.random() < 0.2) {
      healthMetrics.push({
        metricType: 'stair_ascent_speed',
        value: this.baseMetrics.stairAscentSpeed,
        unit: 'm/s',
        timestamp: now,
        source: 'iPhone HealthKit',
        wellnessScore: 80 + Math.floor(Math.random() * 15),
      });
    }

    // Send health data update (matching iOS app format)
    const healthDataMessage = {
      type: 'health_data_update',
      data: {
        userId: this.userId,
        metrics: healthMetrics,
      },
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(healthDataMessage));

    const time = new Date().toLocaleTimeString();
    console.log(`🍎 [${time}] Sent ${healthMetrics.length} HealthKit metrics:`);
    console.log(`   💓 HR: ${Math.round(this.baseMetrics.heartRate)} bpm`);
    console.log(
      `   🚶 Steadiness: ${Math.round(this.baseMetrics.walkingSteadiness * 100)}%`
    );
    console.log(`   👟 Steps: ${this.baseMetrics.stepCount}`);
    console.log(`   🏃 Speed: ${this.baseMetrics.walkingSpeed.toFixed(1)} m/s`);

    // Trigger emergency alerts occasionally
    if (Math.random() < 0.08) {
      // 8% chance
      this.sendEmergencyAlert();
    }
  }

  updateMetrics() {
    // Heart rate variations (exercise, rest, stress)
    if (Math.random() < 0.1) {
      // 10% chance of exercise
      this.baseMetrics.heartRate = 110 + Math.random() * 40; // 110-150 bpm
      console.log('   🏃‍♂️ Detected exercise - elevated heart rate');
    } else if (Math.random() < 0.15) {
      // 15% chance return to rest
      this.baseMetrics.heartRate = 65 + Math.random() * 15; // 65-80 bpm
    } else {
      // Normal variation
      this.baseMetrics.heartRate += (Math.random() - 0.5) * 8;
      this.baseMetrics.heartRate = Math.max(
        55,
        Math.min(100, this.baseMetrics.heartRate)
      );
    }

    // Walking steadiness gradual changes
    this.baseMetrics.walkingSteadiness += (Math.random() - 0.5) * 0.03;
    this.baseMetrics.walkingSteadiness = Math.max(
      0.3,
      Math.min(1.0, this.baseMetrics.walkingSteadiness)
    );

    // Step count increases throughout day
    this.baseMetrics.stepCount += Math.floor(Math.random() * 80) + 10; // 10-90 steps per interval

    // Walking speed variations
    this.baseMetrics.walkingSpeed += (Math.random() - 0.5) * 0.1;
    this.baseMetrics.walkingSpeed = Math.max(
      0.8,
      Math.min(2.0, this.baseMetrics.walkingSpeed)
    );

    // Active energy accumulates
    this.baseMetrics.activeEnergy += Math.floor(Math.random() * 15) + 5; // 5-20 kcal per interval

    // Stair ascent speed variation
    this.baseMetrics.stairAscentSpeed += (Math.random() - 0.5) * 0.05;
    this.baseMetrics.stairAscentSpeed = Math.max(
      0.2,
      Math.min(0.8, this.baseMetrics.stairAscentSpeed)
    );
  }

  calculateWellnessScore(metricType, value) {
    switch (metricType) {
      case 'heart_rate':
        if (value >= 60 && value <= 80)
          return 90 + Math.floor(Math.random() * 10);
        if (value >= 50 && value <= 100)
          return 70 + Math.floor(Math.random() * 20);
        if (value < 50 || value > 120)
          return 20 + Math.floor(Math.random() * 30);
        return 50 + Math.floor(Math.random() * 20);

      case 'walking_steadiness':
        const percentage = value * 100;
        if (percentage >= 80) return 85 + Math.floor(Math.random() * 15);
        if (percentage >= 60) return 65 + Math.floor(Math.random() * 20);
        if (percentage >= 40) return 45 + Math.floor(Math.random() * 20);
        return 25 + Math.floor(Math.random() * 20);

      case 'step_count':
        if (value >= 10000) return 90 + Math.floor(Math.random() * 10);
        if (value >= 7000) return 75 + Math.floor(Math.random() * 15);
        if (value >= 5000) return 60 + Math.floor(Math.random() * 15);
        return 45 + Math.floor(Math.random() * 25);

      case 'walking_speed':
        if (value >= 1.2 && value <= 1.6)
          return 85 + Math.floor(Math.random() * 15);
        if (value >= 1.0 && value <= 1.8)
          return 70 + Math.floor(Math.random() * 15);
        if (value < 0.8) return 30 + Math.floor(Math.random() * 20);
        return 60 + Math.floor(Math.random() * 20);

      default:
        return 70 + Math.floor(Math.random() * 20);
    }
  }

  sendEmergencyAlert() {
    const alertTypes = [
      {
        metric: 'heart_rate',
        value: 165,
        message: 'High heart rate detected during rest',
      },
      {
        metric: 'walking_steadiness',
        value: 0.28,
        message: 'Walking steadiness significantly below normal',
      },
      {
        metric: 'fall_detected',
        value: 1,
        message: 'Potential fall event detected by Apple Watch',
      },
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
            source: 'Emergency Detection System',
            wellnessScore: 15, // Very low score to trigger alert
          },
        ],
      },
      timestamp: new Date().toISOString(),
    };

    this.ws.send(JSON.stringify(alertData));
    console.log(`🚨 Sent emergency alert: ${alert.message}`);
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

// Start iOS HealthKit simulation
const simulator = new IOSHealthKitSimulator();
simulator.connect().catch(console.error);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n👋 Shutting down iOS HealthKit simulator...');
  simulator.disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  simulator.disconnect();
  process.exit(0);
});
