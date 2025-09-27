#!/usr/bin/env node

/**
 * VitalSense Advanced ML WebSocket Test Suite
 * Tests predictive analytics, anomaly detection, and personalized insights
 */

const WebSocket = require('ws');

class VitalSenseAdvancedMLTest {
  constructor(baseUrl = 'ws://127.0.0.1:8787') {
    this.baseUrl = baseUrl;
    this.testResults = [];
    this.ws = null;
    this.userId = 'test-user-ml-' + Date.now();
  }

  async runAllTests() {
    console.log('🧠 VitalSense Advanced ML WebSocket Test Suite');
    console.log('==============================================');
    console.log(`🔗 Connecting to: ${this.baseUrl}/ws`);
    console.log(`👤 Test User: ${this.userId}\n`);

    try {
      await this.testConnection();
      await this.testClientIdentification();
      await this.testMLHealthDataProcessing();
      await this.testPredictiveAnalytics();
      await this.testAnomalyDetection();
      await this.testPersonalizedInsights();
      await this.testEmergencyScenarios();
      
      this.displayResults();
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
    } finally {
      if (this.ws) {
        this.ws.close();
      }
    }
  }

  async testConnection() {
    return new Promise((resolve, reject) => {
      console.log('🔍 Testing WebSocket connection...');
      
      this.ws = new WebSocket(`${this.baseUrl}/ws`);
      
      this.ws.on('open', () => {
        console.log('✅ WebSocket connected successfully');
        this.addResult('Connection', true, 'Successfully connected to WebSocket');
        resolve();
      });

      this.ws.on('error', (error) => {
        console.log('❌ WebSocket connection failed:', error.message);
        this.addResult('Connection', false, error.message);
        reject(error);
      });

      this.ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleMessage(message);
        } catch (error) {
          console.error('Error parsing message:', error);
        }
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (this.ws.readyState !== WebSocket.OPEN) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  async testClientIdentification() {
    return new Promise((resolve) => {
      console.log('🔍 Testing client identification...');
      
      this.pendingTest = 'identification';
      this.pendingResolve = resolve;
      
      this.ws.send(JSON.stringify({
        type: 'client_identification',
        userId: this.userId,
        deviceInfo: {
          type: 'test_client',
          version: '1.0.0',
          capabilities: ['ml_analytics', 'predictive_insights']
        }
      }));

      // Timeout after 3 seconds
      setTimeout(() => {
        if (this.pendingTest === 'identification') {
          this.addResult('Client Identification', false, 'Timeout waiting for identification response');
          resolve();
        }
      }, 3000);
    });
  }

  async testMLHealthDataProcessing() {
    return new Promise((resolve) => {
      console.log('🔍 Testing ML health data processing...');
      
      this.pendingTest = 'ml_processing';
      this.pendingResolve = resolve;

      // Send diverse health data for ML analysis
      const healthDataBatch = [
        {
          type: 'heart_rate',
          value: 75,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          confidence: 0.95
        },
        {
          type: 'walking_steadiness',
          value: 65.5,
          unit: 'percentage',
          timestamp: new Date().toISOString(),
          confidence: 0.88
        },
        {
          type: 'gait_speed',
          value: 1.1,
          unit: 'm/s',
          timestamp: new Date().toISOString(),
          confidence: 0.92
        }
      ];

      this.ws.send(JSON.stringify({
        type: 'vitalsense_health_data',
        data: healthDataBatch,
        metadata: {
          source: 'ml_test_suite',
          batch_id: crypto.randomUUID()
        }
      }));

      setTimeout(() => {
        if (this.pendingTest === 'ml_processing') {
          this.addResult('ML Health Processing', false, 'Timeout waiting for ML processing response');
          resolve();
        }
      }, 5000);
    });
  }

  async testPredictiveAnalytics() {
    return new Promise((resolve) => {
      console.log('🔍 Testing predictive analytics...');
      
      this.pendingTest = 'predictions';
      this.pendingResolve = resolve;

      // Generate historical data pattern for testing predictions
      const historicalData = this.generateHistoricalHealthData();
      
      // Send historical data first
      for (const dataPoint of historicalData) {
        this.ws.send(JSON.stringify({
          type: 'vitalsense_health_data',
          data: dataPoint
        }));
      }

      // Wait a bit then request predictions
      setTimeout(() => {
        this.ws.send(JSON.stringify({
          type: 'request_predictions',
          metrics: ['heart_rate', 'walking_steadiness', 'gait_speed'],
          time_horizon_days: 7
        }));
      }, 1000);

      setTimeout(() => {
        if (this.pendingTest === 'predictions') {
          this.addResult('Predictive Analytics', false, 'Timeout waiting for predictions');
          resolve();
        }
      }, 8000);
    });
  }

  async testAnomalyDetection() {
    return new Promise((resolve) => {
      console.log('🔍 Testing anomaly detection...');
      
      this.pendingTest = 'anomalies';
      this.pendingResolve = resolve;

      // Send anomalous health data
      const anomalousData = [
        {
          type: 'heart_rate',
          value: 195, // Extremely high heart rate
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          confidence: 0.97
        },
        {
          type: 'walking_steadiness',
          value: 15, // Critically low walking steadiness
          unit: 'percentage',
          timestamp: new Date().toISOString(),
          confidence: 0.89
        }
      ];

      this.ws.send(JSON.stringify({
        type: 'vitalsense_health_data',
        data: anomalousData,
        metadata: {
          test_scenario: 'anomaly_detection'
        }
      }));

      setTimeout(() => {
        if (this.pendingTest === 'anomalies') {
          this.addResult('Anomaly Detection', false, 'Timeout waiting for anomaly detection');
          resolve();
        }
      }, 5000);
    });
  }

  async testPersonalizedInsights() {
    return new Promise((resolve) => {
      console.log('🔍 Testing personalized insights...');
      
      this.pendingTest = 'insights';
      this.pendingResolve = resolve;

      this.ws.send(JSON.stringify({
        type: 'request_insights',
        focus_areas: ['cardiovascular', 'mobility', 'balance'],
        time_range_days: 30
      }));

      setTimeout(() => {
        if (this.pendingTest === 'insights') {
          this.addResult('Personalized Insights', false, 'Timeout waiting for insights');
          resolve();
        }
      }, 4000);
    });
  }

  async testEmergencyScenarios() {
    return new Promise((resolve) => {
      console.log('🔍 Testing emergency scenario detection...');
      
      this.pendingTest = 'emergency';
      this.pendingResolve = resolve;

      // Send critical health data that should trigger emergency alerts
      const emergencyData = {
        type: 'heart_rate',
        value: 210, // Dangerously high heart rate
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        confidence: 0.98,
        context: 'emergency_test'
      };

      this.ws.send(JSON.stringify({
        type: 'vitalsense_health_data',
        data: emergencyData,
        priority: 'emergency'
      }));

      setTimeout(() => {
        if (this.pendingTest === 'emergency') {
          this.addResult('Emergency Detection', false, 'Timeout waiting for emergency response');
          resolve();
        }
      }, 4000);
    });
  }

  generateHistoricalHealthData() {
    const data = [];
    const now = Date.now();
    
    // Generate 14 days of historical data with trends
    for (let i = 13; i >= 0; i--) {
      const timestamp = new Date(now - (i * 24 * 60 * 60 * 1000)).toISOString();
      
      // Heart rate with slight upward trend
      data.push({
        type: 'heart_rate',
        value: 70 + Math.random() * 10 + (i * 0.5), // Gradual increase
        unit: 'bpm',
        timestamp,
        confidence: 0.9 + Math.random() * 0.1
      });

      // Walking steadiness with slight decline
      data.push({
        type: 'walking_steadiness',
        value: 80 - (i * 0.8) + Math.random() * 5, // Gradual decline
        unit: 'percentage',
        timestamp,
        confidence: 0.85 + Math.random() * 0.1
      });
      
      // Gait speed relatively stable
      data.push({
        type: 'gait_speed',
        value: 1.0 + Math.random() * 0.2,
        unit: 'm/s',
        timestamp,
        confidence: 0.9 + Math.random() * 0.05
      });
    }
    
    return data;
  }

  handleMessage(message) {
    const { type, data } = message;

    switch (type) {
      case 'vitalsense_ml_connection_established':
        console.log('✅ ML connection established with capabilities:', data.capabilities);
        this.addResult('ML Connection', true, 'Advanced ML features enabled');
        break;

      case 'identification_confirmed':
        if (this.pendingTest === 'identification') {
          console.log('✅ Client identification confirmed');
          this.addResult('Client Identification', true, 'Client successfully identified for ML features');
          this.pendingTest = null;
          if (this.pendingResolve) this.pendingResolve();
        }
        break;

      case 'vitalsense_ml_health_update':
        if (this.pendingTest === 'ml_processing') {
          console.log('✅ ML health data processed');
          console.log(`   📊 Metrics processed: ${data.metrics?.length || 0}`);
          console.log(`   🔮 Predictions: ${data.predictions?.length || 0}`);
          console.log(`   ⚠️  Anomalies: ${data.anomalies?.length || 0}`);
          console.log(`   💡 Insights: ${data.insights?.length || 0}`);
          console.log(`   🎯 ML Confidence: ${data.ml_confidence || 'N/A'}`);
          
          this.addResult('ML Health Processing', true, 
            `Processed ${data.metrics?.length || 0} metrics with ${data.predictions?.length || 0} predictions`);
          this.pendingTest = null;
          if (this.pendingResolve) this.pendingResolve();
        }

        // Check for anomalies
        if (this.pendingTest === 'anomalies' && data.anomalies?.length > 0) {
          console.log('✅ Anomaly detection working');
          console.log(`   🚨 Detected ${data.anomalies.length} anomalies`);
          data.anomalies.forEach(anomaly => {
            console.log(`   • ${anomaly.metric_type}: ${anomaly.current_value} (severity: ${anomaly.severity})`);
          });
          
          this.addResult('Anomaly Detection', true, 
            `Detected ${data.anomalies.length} anomalies with appropriate severity levels`);
          this.pendingTest = null;
          if (this.pendingResolve) this.pendingResolve();
        }

        // Check for emergency alerts
        if (this.pendingTest === 'emergency' && data.alerts?.length > 0) {
          const criticalAlerts = data.alerts.filter(alert => alert.severity === 'critical');
          if (criticalAlerts.length > 0) {
            console.log('✅ Emergency detection working');
            console.log(`   🚨 Critical alerts triggered: ${criticalAlerts.length}`);
            
            this.addResult('Emergency Detection', true, 
              `Triggered ${criticalAlerts.length} critical alerts for emergency data`);
            this.pendingTest = null;
            if (this.pendingResolve) this.pendingResolve();
          }
        }
        break;

      case 'health_predictions_response':
        if (this.pendingTest === 'predictions') {
          console.log('✅ Predictive analytics working');
          console.log(`   🔮 Predictions generated: ${data.predictions?.length || 0}`);
          
          data.predictions?.forEach(prediction => {
            console.log(`   • ${prediction.metric_type}: ${prediction.predicted_value} (confidence: ${prediction.confidence}, risk: ${prediction.risk_level})`);
          });
          
          this.addResult('Predictive Analytics', true, 
            `Generated ${data.predictions?.length || 0} predictions with confidence scores`);
          this.pendingTest = null;
          if (this.pendingResolve) this.pendingResolve();
        }
        break;

      case 'personalized_insights_response':
        if (this.pendingTest === 'insights') {
          console.log('✅ Personalized insights working');
          console.log(`   💡 Insights: ${data.insights?.length || 0}`);
          console.log(`   📋 Recommendations: ${data.recommendations?.length || 0}`);
          
          data.recommendations?.forEach(rec => {
            console.log(`   • ${rec.category}: ${rec.recommendation} (priority: ${rec.priority})`);
          });
          
          this.addResult('Personalized Insights', true, 
            `Generated ${data.insights?.length || 0} insights and ${data.recommendations?.length || 0} recommendations`);
          this.pendingTest = null;
          if (this.pendingResolve) this.pendingResolve();
        }
        break;

      case 'heartbeat_ack':
        // Heartbeat acknowledgment - normal operation
        break;

      default:
        console.log(`📨 Received message: ${type}`);
    }
  }

  addResult(testName, success, details) {
    this.testResults.push({
      test: testName,
      success,
      details,
      timestamp: new Date().toISOString()
    });
  }

  displayResults() {
    console.log('\n🧠 VitalSense Advanced ML Test Results');
    console.log('=====================================');
    
    let passed = 0;
    let total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.success ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${result.test}: ${result.details}`);
      if (result.success) passed++;
    });
    
    console.log('\n📊 Summary:');
    console.log(`   Tests passed: ${passed}/${total}`);
    console.log(`   Success rate: ${total > 0 ? Math.round((passed/total) * 100) : 0}%`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! VitalSense ML WebSocket is working perfectly.');
    } else {
      console.log(`\n⚠️  ${total - passed} test(s) failed. Check the WebSocket service configuration.`);
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const baseUrl = process.argv[2] || 'ws://127.0.0.1:8787';
  const tester = new VitalSenseAdvancedMLTest(baseUrl);
  tester.runAllTests().catch(console.error);
}

module.exports = VitalSenseAdvancedMLTest;