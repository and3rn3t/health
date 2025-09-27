#!/usr/bin/env node

/**
 * Test Advanced ML WebSocket Configuration
 * Validates that all configuration files have been updated correctly
 * and that the service is reachable.
 */

import { promises as fs } from 'fs';

const EXPECTED_URL = 'wss://vitalsense-websocket-advanced-dev.andernet.workers.dev/ws';

async function readPlistValue(filePath, key) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const keyPattern = new RegExp(`<key>${key}</key>\\s*<string>([^<]+)</string>`);
    const match = content.match(keyPattern);
    return match ? match[1] : null;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function readTomlValue(filePath, section, key) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const sectionPattern = new RegExp(`\\[${section}\\]([\\s\\S]*?)(?=\\[|$)`);
    const sectionMatch = content.match(sectionPattern);
    if (!sectionMatch) return null;
    
    const keyPattern = new RegExp(`${key}\\s*=\\s*"([^"]+)"`);
    const keyMatch = sectionMatch[1].match(keyPattern);
    return keyMatch ? keyMatch[1] : null;
  } catch (error) {
    console.error(`❌ Error reading ${filePath}:`, error.message);
    return null;
  }
}

async function testHealthEndpoint() {
  try {
    const response = await fetch('https://vitalsense-websocket-advanced-dev.andernet.workers.dev/health');
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Health endpoint responding:', data.status);
      console.log('🎯 Service version:', data.version);
      console.log('🔧 Available features:', data.features.join(', '));
      return true;
    } else {
      console.log('❌ Health endpoint error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Health endpoint unreachable:', error.message);
    return false;
  }
}

async function main() {
  console.log('🔍 Testing VitalSense Advanced ML WebSocket Configuration\n');

  const configurations = [
    {
      name: 'iOS Main Config',
      path: 'ios/VitalSense/Resources/Config.plist',
      test: () => readPlistValue('ios/VitalSense/Resources/Config.plist', 'WS_URL')
    },
    {
      name: 'iOS Development Config',
      path: 'ios/VitalSense/Resources/Config.development.plist',
      test: () => readPlistValue('ios/VitalSense/Resources/Config.development.plist', 'WS_URL')
    },
    {
      name: 'iOS Production Config',
      path: 'ios/VitalSense/Resources/Config.production.plist',
      test: () => readPlistValue('ios/VitalSense/Resources/Config.production.plist', 'WS_URL')
    },
    {
      name: 'Wrangler Development',
      path: 'wrangler.toml',
      test: () => readTomlValue('wrangler.toml', 'env.development.vars', 'WEBSOCKET_URL')
    },
    {
      name: 'Wrangler Production',
      path: 'wrangler.toml',
      test: () => readTomlValue('wrangler.toml', 'env.production.vars', 'WEBSOCKET_URL')
    }
  ];

  let allCorrect = true;

  for (const config of configurations) {
    const url = await config.test();
    if (url === EXPECTED_URL) {
      console.log(`✅ ${config.name}: ${url}`);
    } else {
      console.log(`❌ ${config.name}: ${url || 'NOT FOUND'} (expected: ${EXPECTED_URL})`);
      allCorrect = false;
    }
  }

  console.log('\n🌐 Testing service availability...');
  const serviceAvailable = await testHealthEndpoint();

  console.log('\n📋 Configuration Update Summary:');
  console.log('=================================');
  if (allCorrect && serviceAvailable) {
    console.log('🎉 All configurations updated successfully!');
    console.log('🚀 VitalSense iOS app is now configured to use Advanced ML WebSocket service');
    console.log('📱 Features available: Predictive Analytics, Anomaly Detection, Personalized Insights, Emergency Detection');
  } else {
    console.log('⚠️  Some configurations may need attention');
    if (!allCorrect) console.log('   - Configuration files have incorrect URLs');
    if (!serviceAvailable) console.log('   - Service is not responding to health checks');
  }
}

main().catch(console.error);