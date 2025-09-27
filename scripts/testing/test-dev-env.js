#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';
import { execa } from 'execa';
import fs from 'node:fs/promises';

const verbose = process.argv.includes('--verbose');
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:8789';

function log(msg, color='white'){ console.log(chalk[color](msg)); }
function ok(msg){ log(`✅ ${msg}`, 'green'); }
function fail(msg){ log(`❌ ${msg}`, 'red'); }
function info(msg){ log(msg, 'cyan'); }

const results = [];
function add(name, status, details=''){ results.push({ name, status, details }); }

async function testWorker(){
  info('Testing Cloudflare Worker...');
  try{
    const r = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
    if (r.data?.status === 'healthy') { ok('Worker Health: OK'); add('Worker Health','PASS', r.data.environment||''); return true; }
    fail('Worker Health: Unhealthy response'); add('Worker Health','FAIL','Unhealthy'); return false;
  }catch(e){ fail(`Worker Health: ${e.message}`); add('Worker Health','FAIL', e.message); return false; }
}

async function testApiAuth(){
  info('Testing API Authentication...');
  try{
    const r = await axios.post(`${baseUrl}/api/device/auth`, { userId: 'test-user' }, { timeout: 5000, headers: { 'Content-Type':'application/json' }});
    if (r.data?.ok){ ok('API Auth: OK'); add('API Authentication','PASS','Token received'); return true; }
    fail('API Auth: Failed'); add('API Authentication','FAIL','No token'); return false;
  }catch(e){ fail(`API Auth: ${e.message}`); add('API Authentication','FAIL', e.message); return false; }
}

async function testWebSocketServer(){
  info('Testing WebSocket server (REST status)...');
  try{
    const r = await axios.get('http://localhost:3001/api/status', { timeout: 5000 });
    ok('WebSocket Server: Running'); add('WebSocket Server','PASS','Server responsive'); return true;
  }catch(e){ fail(`WebSocket Server: ${e.message}`); add('WebSocket Server','FAIL', e.message); return false; }
}

async function testBuildSystem(){
  info('Testing build system...');
  try {
    await execa('npm', ['run','build:worker'], { stdio: verbose? 'inherit':'pipe' });
    ok('Worker Build: OK'); add('Worker Build','PASS','Compiled');
  } catch { fail('Worker Build: Failed'); add('Worker Build','FAIL','Compilation errors'); }
  try {
    await execa('npm', ['run','build:app'], { stdio: verbose? 'inherit':'pipe' });
    ok('App Build: OK'); add('App Build','PASS','Compiled');
  } catch { fail('App Build: Failed'); add('App Build','FAIL','Compilation errors'); }
}

async function testIOSProject(){
  info('Checking iOS project files...');
  const files = [
    'ios/HealthKitBridge.xcodeproj/project.pbxproj',
    'ios/HealthKitBridge/HealthKitBridgeApp.swift',
  ];
  let all = true;
  for (const f of files){
    try { await fs.access(`c:/${process.cwd().split(':')[1] ? process.cwd().split(':')[1] : ''}`); } catch {}
    try { await fs.access(f); ok(`${f}`); add(f,'PASS'); } catch { fail(`${f} (missing)`); add(f,'FAIL'); all = false; }
  }
  add('iOS Project Files', all? 'PASS':'FAIL');
}

async function testSecurity(){
  info('Testing CORS...');
  try{
    const r = await axios.get(`${baseUrl}/health`, { timeout: 5000, headers: { Origin: 'http://localhost:5173' }});
    const allowed = r.headers['access-control-allow-origin'];
    if (allowed){ ok('CORS: Configured'); add('CORS Policy','PASS','Headers present'); }
    else { log('⚠️  CORS: Not configured','yellow'); add('CORS Policy','WARN','No headers'); }
  }catch(e){ fail(`CORS: ${e.message}`); add('CORS Policy','FAIL', e.message); }
}

function summary(){
  log('\n📊 TEST SUMMARY','cyan');
  const pass = results.filter(r=>r.status==='PASS').length;
  const failc = results.filter(r=>r.status==='FAIL').length;
  const warnc = results.filter(r=>r.status==='WARN').length;
  log(`Results: ${pass} passed, ${failc} failed, ${warnc} warnings`);
  process.exitCode = failc === 0 ? 0 : 1;
}

(async () => {
  const quick = process.argv.includes('--quick');
  const full = process.argv.includes('--full');
  if (quick || (!full)) {
    await testWorker();
    await testApiAuth();
    await testWebSocketServer();
  }
  if (full) {
    await testBuildSystem();
    await testIOSProject();
    await testSecurity();
  }
  summary();
})();
