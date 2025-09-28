#!/usr/bin/env node

/**
 * Test HTTP ML Endpoints - Quick Fix Option A
 * Tests ML functionality via HTTP while WebSocket issues are resolved
 */

import { spawn } from 'child_process';

const BASE_URL = 'http://localhost:3001';
const SERVER_START_DELAY = 3000;

let serverProcess = null;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function makeRequest(endpoint, data = null) {
  const url = `${BASE_URL}${endpoint}`;
  const options = {
    method: data ? 'POST' : 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data) {
    options.body = JSON.stringify(data);
  }

  try {
    const response = await fetch(url, options);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function startServer() {
  console.log('🚀 Starting VitalSense Enhanced Server...');
  
  serverProcess = spawn('node', ['vitalsense-enhanced-server.js'], {
    cwd: 'server',
    stdio: ['inherit', 'pipe', 'pipe']
  });

  serverProcess.stdout.on('data', (data) => {
    const output = data.toString().trim();
    if (output) console.log(`[SERVER] ${output}`);
  });

  serverProcess.stderr.on('data', (data) => {
    const output = data.toString().trim();
    if (output) console.log(`[SERVER ERROR] ${output}`);
  });

  await sleep(SERVER_START_DELAY);
  console.log('⏰ Server startup delay completed');
}

async function testMLEndpoints() {
  console.log('🧪 Testing HTTP ML Endpoints...');
  const results = {
    health: null,
    analysis: null,
    predictions: null,
    insights: null
  };

  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    results.health = await makeRequest('/api/health');
    console.log('✅ Health check passed:', results.health.status);

    // Test 2: ML Analysis
    console.log('\n2️⃣ Testing ML analysis...');
    const analysisData = {
      data: {
        metric_type: 'heart_rate',
        value: 75,
        timestamp: new Date().toISOString(),
        source: 'test_device'
      }
    };
    results.analysis = await makeRequest('/api/ml/analyze', analysisData);
    console.log('✅ ML Analysis completed');
    console.log(`   - Analysis ID: ${results.analysis.data.analysisId}`);
    console.log(`   - Metrics: ${results.analysis.data.analysis.metrics.length}`);
    console.log(`   - Predictions: ${results.analysis.data.analysis.predictions.length}`);
    console.log(`   - Anomalies: ${results.analysis.data.analysis.anomalies.length}`);
    console.log(`   - Confidence: ${results.analysis.data.confidence}`);

    // Test 3: Predictions
    console.log('\n3️⃣ Testing predictions...');
    const predictionData = {
      metrics: ['heart_rate', 'walking_steadiness'],
      time_horizon_days: 7
    };
    results.predictions = await makeRequest('/api/ml/predictions', predictionData);
    console.log('✅ Predictions generated');
    console.log(`   - Predictions count: ${results.predictions.data.predictions.length}`);
    results.predictions.data.predictions.forEach((pred) => {
      console.log(`   - ${pred.metric_type}: ${pred.predicted_value} (${pred.confidence} confidence)`);
    });

    // Test 4: Insights
    console.log('\n4️⃣ Testing insights...');
    results.insights = await makeRequest('/api/ml/insights', {});
    console.log('✅ Insights generated');
    console.log(`   - Insights: ${results.insights.data.insights.length}`);
    console.log(`   - Recommendations: ${results.insights.data.recommendations.length}`);

    return results;

  } catch (error) {
    console.error(`❌ Test failed: ${error.message}`);
    throw error;
  }
}

async function cleanup() {
  if (serverProcess) {
    console.log('\n🧹 Cleaning up server process...');
    serverProcess.kill('SIGTERM');
    await sleep(1000);
  }
}

async function main() {
  try {
    await startServer();
    const results = await testMLEndpoints();
    
    console.log('\n🎉 HTTP ML Endpoints Test Results:');
    console.log('==================================');
    console.log('✅ All ML endpoints functional!');
    console.log(`✅ Health check: ${results.health?.status}`);
    console.log(`✅ ML Analysis: ${results.analysis?.data?.analysis?.metrics?.length || 0} metrics processed`);
    console.log(`✅ Predictions: ${results.predictions?.data?.predictions?.length || 0} generated`);
    console.log(`✅ Insights: ${results.insights?.data?.insights?.length || 0} insights provided`);
    
    console.log('\n💡 Quick Fix Option A Status: ✅ SUCCESS');
    console.log('📊 ML functionality is working via HTTP endpoints');
    console.log('🔧 WebSocket connection issues can be resolved separately');
    
  } catch (error) {
    console.error('\n❌ HTTP ML Endpoints Test Failed:');
    console.error('=================================');
    console.error(error.message);
    process.exit(1);
    
  } finally {
    await cleanup();
  }
}

// Handle process termination
process.on('SIGINT', async () => {
  console.log('\n⏹️ Test interrupted by user');
  await cleanup();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n⏹️ Test terminated');
  await cleanup();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('💥 Unhandled error:', error);
  await cleanup();
  process.exit(1);
});