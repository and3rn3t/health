#!/usr/bin/env node
// Quick Bundle Check - Fast analysis of current bundle sizes without rebuilding
// For use when you just want to check current dist/ folder contents

import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

async function getBundleSize(filePath) {
  try {
    const stats = await fs.stat(filePath);
    return stats.size;
  } catch {
    return 0;
  }
}

async function quickCheck() {
  console.log('📦 Quick Bundle Size Check');
  console.log('==========================');

  const distPath = resolve(projectRoot, 'dist');

  // Check if dist exists
  try {
    await fs.access(distPath);
  } catch {
    console.log('❌ No dist/ folder found. Run "npm run build" first.');
    process.exit(1);
  }

  const files = [
    {
      name: 'main.css',
      description: 'CSS Bundle',
      target: '~60KB',
      critical: 60 * 1024,
    },
    {
      name: 'main.js',
      description: 'JS Bundle',
      target: '~2MB',
      critical: 3 * 1024 * 1024,
    },
    {
      name: 'sw.js',
      description: 'Service Worker',
      target: '~15KB',
      critical: 50 * 1024,
    },
    {
      name: 'main.css.map',
      description: 'CSS Source Map',
      target: '~20KB',
      critical: 100 * 1024,
    },
    {
      name: 'main.js.map',
      description: 'JS Source Map',
      target: '~7MB',
      critical: 10 * 1024 * 1024,
    },
  ];

  let totalSize = 0;
  let hasIssues = false;

  console.log('File                Size        Status   Target');
  console.log('----                ----        ------   ------');

  for (const file of files) {
    const size = await getBundleSize(resolve(distPath, file.name));
    const formatted =
      size > 0 ? formatBytes(size).padEnd(10) : 'Missing'.padEnd(10);

    let status = '✅ OK';
    if (size === 0) {
      status = '❌ Missing';
      hasIssues = true;
    } else if (size > file.critical) {
      status = '🔴 Critical';
      hasIssues = true;
    } else if (size > file.critical * 0.8) {
      status = '⚠️  Warning';
    }

    console.log(
      `${file.description.padEnd(18)} ${formatted} ${status.padEnd(12)} ${file.target}`
    );

    if (size > 0) totalSize += size;
  }

  console.log('----                ----        ------   ------');
  console.log(
    `${'Total Bundle'.padEnd(18)} ${formatBytes(totalSize).padEnd(10)} ${hasIssues ? '❌' : '✅'}`
  );

  // Performance insights
  console.log('\n🚀 Performance Insights:');

  const cssSize = await getBundleSize(resolve(distPath, 'main.css'));
  const jsSize = await getBundleSize(resolve(distPath, 'main.js'));

  if (cssSize > 0 && cssSize < 30 * 1024) {
    console.log('   ✅ CSS bundle is well-optimized (< 30KB)');
  } else if (cssSize >= 30 * 1024 && cssSize < 50 * 1024) {
    console.log('   💡 CSS bundle could benefit from optimization (30-50KB)');
  } else if (cssSize >= 50 * 1024) {
    console.log('   ⚠️  CSS bundle is large (>50KB) - consider code splitting');
  }

  if (jsSize > 0 && jsSize < 1.5 * 1024 * 1024) {
    console.log('   ✅ JS bundle is well-optimized (< 1.5MB)');
  } else if (jsSize >= 1.5 * 1024 * 1024 && jsSize < 2 * 1024 * 1024) {
    console.log('   💡 JS bundle could benefit from lazy loading (1.5-2MB)');
  } else if (jsSize >= 2 * 1024 * 1024) {
    console.log('   ⚠️  JS bundle is large (>2MB) - implement code splitting');
  }

  // Network performance estimates
  if (totalSize > 0) {
    console.log('\n📡 Network Performance (estimated):');
    console.log(
      `   3G (1.6 Mbps): ~${Math.ceil(((totalSize * 8) / (1.6 * 1024 * 1024)) * 1000)}ms`
    );
    console.log(
      `   4G (10 Mbps):  ~${Math.ceil(((totalSize * 8) / (10 * 1024 * 1024)) * 1000)}ms`
    );
    console.log(
      `   Fiber (100 Mbps): ~${Math.ceil(((totalSize * 8) / (100 * 1024 * 1024)) * 1000)}ms`
    );
  }

  console.log('\n💡 Quick Actions:');
  console.log(
    '   📊 Full analysis:     npm run task -- "📊 Performance Monitor"'
  );
  console.log(
    '   🔄 Continuous:        npm run task -- "🔄 Continuous Performance Monitor"'
  );
  console.log('   📈 Build optimized:   npm run build:optimized');

  if (hasIssues) {
    process.exit(1);
  }
}

quickCheck().catch(console.error);
