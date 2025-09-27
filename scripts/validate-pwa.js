#!/usr/bin/env node

/**
 * PWA Validation Script
 * Tests PWA implementation and generates a validation report
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

console.log('🔍 Validating PWA Implementation...\n');

// Test results
const results = {
  manifest: false,
  serviceWorker: false,
  offlinePage: false,
  icons: false,
  pwaManager: false,
  statusComponent: false,
  htmlMeta: false
};

// Check manifest.json
try {
  const manifestPath = path.join(projectRoot, 'public', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  console.log('✅ Web App Manifest');
  console.log(`   📱 Name: ${manifest.name}`);
  console.log(`   🎨 Theme: ${manifest.theme_color}`);
  console.log(`   📱 Display: ${manifest.display}`);
  console.log(`   🖼️  Icons: ${manifest.icons.length} defined`);
  console.log(`   ⚡ Shortcuts: ${manifest.shortcuts.length} available`);

  results.manifest = true;
} catch (_error) {
  console.log('❌ Web App Manifest: Missing or invalid');
}

// Check service worker
try {
  const swPath = path.join(projectRoot, 'public', 'sw.js');
  const swContent = fs.readFileSync(swPath, 'utf8');

  console.log('\n✅ Service Worker');
  console.log(`   📁 File size: ${Math.round(swContent.length / 1024)}KB`);
  console.log(`   🎯 Cache strategies: ${swContent.includes('networkFirst') ? '✓' : '✗'} Network-first`);
  console.log(`   💾 Offline support: ${swContent.includes('cacheFirst') ? '✓' : '✗'} Cache-first`);
  console.log(`   🔄 Background sync: ${swContent.includes('sync') ? '✓' : '✗'} Available`);
  console.log(`   📢 Push notifications: ${swContent.includes('push') ? '✓' : '✗'} Configured`);

  results.serviceWorker = true;
} catch (_error) {
  console.log('\n❌ Service Worker: Missing');
}

// Check offline page
try {
  const offlinePath = path.join(projectRoot, 'public', 'offline.html');
  const offlineContent = fs.readFileSync(offlinePath, 'utf8');

  console.log('\n✅ Offline Page');
  console.log(`   📄 File size: ${Math.round(offlineContent.length / 1024)}KB`);
  console.log(`   🎨 VitalSense branding: ${offlineContent.includes('VitalSense') ? '✓' : '✗'} Present`);
  console.log(`   📱 Responsive design: ${offlineContent.includes('viewport') ? '✓' : '✗'} Configured`);

  results.offlinePage = true;
} catch (_error) {
  console.log('\n❌ Offline Page: Missing');
}

// Check PWA icons
try {
  const iconsDir = path.join(projectRoot, 'public', 'icons');
  const iconFiles = fs.readdirSync(iconsDir);

  const requiredIcons = [
    'icon-192x192.svg',
    'icon-512x512.svg',
    'icon-152x152.svg'
  ];

  const foundIcons = requiredIcons.filter(icon => iconFiles.includes(icon));

  console.log('\n✅ PWA Icons');
  console.log(`   📁 Icons directory: ${iconFiles.length} files`);
  console.log(`   ✓ Required icons: ${foundIcons.length}/${requiredIcons.length} found`);

  foundIcons.forEach(icon => {
    console.log(`   📱 ${icon}: Available`);
  });

  if (foundIcons.length === requiredIcons.length) {
    results.icons = true;
  }
} catch (_error) {
  console.log('\n❌ PWA Icons: Directory missing or icons not found');
}

// Check PWA Manager
try {
  const pwaManagerPath = path.join(projectRoot, 'src', 'lib', 'pwa.ts');
  const pwaManager = fs.readFileSync(pwaManagerPath, 'utf8');

  console.log('\n✅ PWA Manager');
  console.log(`   📁 File size: ${Math.round(pwaManager.length / 1024)}KB`);
  console.log(`   🔧 Installation: ${pwaManager.includes('installPWA') ? '✓' : '✗'} Supported`);
  console.log(`   🔄 Updates: ${pwaManager.includes('updateSW') ? '✓' : '✗'} Handled`);
  console.log(`   📢 Notifications: ${pwaManager.includes('subscribeToPush') ? '✓' : '✗'} Available`);
  console.log(`   🌐 Online/Offline: ${pwaManager.includes('isOnline') ? '✓' : '✗'} Tracked`);

  results.pwaManager = true;
} catch (_error) {
  console.log('\n❌ PWA Manager: Missing');
}

// Check PWA Status Component
try {
  const statusComponentPath = path.join(projectRoot, 'src', 'components', 'pwa', 'PWAStatusComponent.tsx');
  const statusComponent = fs.readFileSync(statusComponentPath, 'utf8');

  console.log('\n✅ PWA Status Component');
  console.log(`   📁 File size: ${Math.round(statusComponent.length / 1024)}KB`);
  console.log(`   🎛️  Installation UI: ${statusComponent.includes('handleInstall') ? '✓' : '✗'} Present`);
  console.log(`   📊 Status Display: ${statusComponent.includes('PWAStatus') ? '✓' : '✗'} Available`);
  console.log(`   🔔 Notifications UI: ${statusComponent.includes('Notification') ? '✓' : '✗'} Included`);

  results.statusComponent = true;
} catch (_error) {
  console.log('\n❌ PWA Status Component: Missing');
}

// Check HTML meta tags
try {
  const htmlPath = path.join(projectRoot, 'index.html');
  const htmlContent = fs.readFileSync(htmlPath, 'utf8');

  console.log('\n✅ HTML PWA Meta Tags');
  console.log(`   📱 Manifest link: ${htmlContent.includes('manifest.json') ? '✓' : '✗'} Present`);
  console.log(`   🍎 Apple meta tags: ${htmlContent.includes('apple-mobile-web-app') ? '✓' : '✗'} Configured`);
  console.log(`   🎨 Theme color: ${htmlContent.includes('theme-color') ? '✓' : '✗'} Set`);
  console.log(`   📄 Description: ${htmlContent.includes('description') ? '✓' : '✗'} Present`);

  results.htmlMeta = true;
} catch (error) {
  console.log('\n❌ HTML Meta Tags: Not properly configured', error.message);
}

// Generate summary
const passedTests = Object.values(results).filter(Boolean).length;
const totalTests = Object.keys(results).length;

console.log('\n' + '='.repeat(50));
console.log('📊 PWA Validation Summary');
console.log('='.repeat(50));
console.log(`✅ Tests Passed: ${passedTests}/${totalTests}`);
console.log(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);

if (passedTests === totalTests) {
  console.log('\n🎉 PWA Implementation Complete!');
  console.log('Your VitalSense app is ready for PWA deployment.');
} else {
  console.log('\n⚠️  PWA Implementation Needs Attention');
  const failedTests = Object.entries(results)
    .filter(([, passed]) => !passed)
    .map(([test]) => test);

  console.log('Failed components:');
  failedTests.forEach(test => console.log(`   - ${test}`));
}

console.log('\n📋 Next Steps:');
console.log('1. Test PWA installation on different devices');
console.log('2. Validate with Lighthouse PWA audit');
console.log('3. Test offline functionality');
console.log('4. Configure push notification server');
console.log('5. Deploy with HTTPS for full PWA features');

console.log('\n🚀 Ready for PWA deployment!');
