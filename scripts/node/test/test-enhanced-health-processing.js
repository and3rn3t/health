#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';

function log(msg, color = 'white') {
  console.log(chalk[color](msg));
}

function ok(msg) { log(`✅ ${msg}`, 'green'); }
function warn(msg) { log(`⚠️ ${msg}`, 'yellow'); }
function err(msg) { log(`❌ ${msg}`, 'red'); }

function arg(name, def) {
  const m = process.argv.find(a => a.startsWith(`--${name}=`));
  return m ? m.split('=')[1] : def;
}

const baseUrl = arg('baseUrl', 'http://127.0.0.1');
const port = parseInt(arg('port', '8789'), 10);
const target = `${baseUrl}:${port}`;
const timeout = parseInt(arg('timeout', '10000'), 10);

const results = [];
function addResult(name, success, details = '') {
  results.push({ name, success, details });
}

async function testHealth() {
  try {
    const r = await axios.get(`${target}/health`, { timeout });
    if (r.status === 200) { ok('Health check passed'); addResult('Health', true); return true; }
    err(`Health check unexpected status: ${r.status}`); addResult('Health', false, String(r.status)); return false;
  } catch (e) {
    err(`Health check failed: ${e.message}`); addResult('Health', false, e.message); return false;
  }
}

async function testProcessSingle() {
  const payload = {
    type: 'heart_rate', value: 72, unit: 'bpm',
    timestamp: new Date().toISOString(), deviceId: 'test-device-001', userId: 'test-user-123', source: 'Apple Watch', confidence: 0.95,
  };
  try {
    const r = await axios.post(`${target}/api/health-data/process`, payload, { timeout, headers: { 'Content-Type': 'application/json' } });
    if (r.status >= 200 && r.status < 300) {
      ok('Single metric processed');
      if (r.data?.analytics) {
        const a = r.data.analytics;
        warn(`Analytics: healthScore=${a.healthScore} fallRisk=${a.fallRisk} anomalyScore=${a.anomalyScore}`);
      }
      addResult('ProcessSingle', true);
      return true;
    }
    err(`Single metric unexpected status ${r.status}`);
    addResult('ProcessSingle', false, String(r.status));
    return false;
  } catch (e) {
    err(`Single metric processing failed: ${e.message}`);
    addResult('ProcessSingle', false, e.message);
    return false;
  }
}

async function testProcessBatch() {
  const now = new Date().toISOString();
  const batch = {
    metrics: [
      { type: 'heart_rate', value: 75, unit: 'bpm', timestamp: now, deviceId: 'test-device-001', userId: 'test-user-123', source: 'Apple Watch', confidence: 0.95 },
      { type: 'walking_steadiness', value: 85, unit: 'percent', timestamp: now, deviceId: 'test-device-001', userId: 'test-user-123', source: 'Apple Watch', confidence: 0.88 },
      { type: 'steps', value: 8500, unit: 'count', timestamp: now, deviceId: 'test-device-001', userId: 'test-user-123', source: 'iPhone', confidence: 0.92 },
    ],
    uploadedAt: now,
    deviceInfo: { deviceId: 'test-device-001', deviceType: 'iPhone', osVersion: '17.5', appVersion: '1.0.0' },
  };
  try {
    const r = await axios.post(`${target}/api/health-data/batch`, batch, { timeout, headers: { 'Content-Type': 'application/json' } });
    if (r.status >= 200 && r.status < 300) {
      ok(`Batch processed (${r.data?.processed}/${r.data?.total})`);
      if (Array.isArray(r.data?.errors) && r.data.errors.length) {
        warn(`Errors: ${r.data.errors.length}`);
      }
      addResult('ProcessBatch', true);
      return true;
    }
    err(`Batch processing unexpected status ${r.status}`);
    addResult('ProcessBatch', false, String(r.status));
    return false;
  } catch (e) {
    err(`Batch processing failed: ${e.message}`);
    addResult('ProcessBatch', false, e.message);
    return false;
  }
}

async function testAnalytics() {
  try {
    const r = await axios.get(`${target}/api/health-data/analytics/test-user-123`, { timeout });
    if (r.status === 200) { ok('Analytics retrieved'); addResult('Analytics', true); return true; }
    err(`Analytics unexpected status ${r.status}`); addResult('Analytics', false, String(r.status)); return false;
  } catch (e) {
    err(`Analytics retrieval failed: ${e.message}`); addResult('Analytics', false, e.message); return false;
  }
}

async function testGetHealthData() {
  try {
    const r = await axios.get(`${target}/api/health-data`, { timeout });
    if (r.status === 200) { ok(`Health data retrieved (${Array.isArray(r.data?.data) ? r.data.data.length : 'unknown'} items)`); addResult('GetHealthData', true); return true; }
    err(`Get health data unexpected status ${r.status}`); addResult('GetHealthData', false, String(r.status)); return false;
  } catch (e) {
    err(`Health data retrieval failed: ${e.message}`); addResult('GetHealthData', false, e.message); return false;
  }
}

function summary() {
  const passed = results.filter(r => r.success).length;
  const total = results.length;
  log(`\n📊 Test Summary`, 'magenta');
  log(`Passed: ${passed}/${total}`, passed === total ? 'green' : 'yellow');
  process.exitCode = passed === total ? 0 : 1;
}

(async () => {
  log('🧪 Enhanced Health Data Processing Test Suite', 'magenta');
  log(`Target: ${target}`, 'cyan');
  await testHealth();
  await testProcessSingle();
  await testProcessBatch();
  await testAnalytics();
  await testGetHealthData();
  summary();
})();
