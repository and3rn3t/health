#!/usr/bin/env node

/**
 * Quick Bundle Size Checker for VitalSense
 * Analyzes existing build files without rebuilding
 */

import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
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
  } catch (_error) {
    return 0;
  }
}

async function checkBundleSizes() {
  console.log('🔍 VitalSense Bundle Size Check');
  console.log('================================\n');

  const bundleFiles = [
    { key: 'app', path: 'dist/main.js', name: 'React App Bundle' },
    { key: 'css', path: 'dist/main.css', name: 'CSS Bundle' },
    { key: 'worker', path: 'dist-worker/index.js', name: 'Cloudflare Worker' },
    { key: 'html', path: 'dist/index.html', name: 'HTML Template' }
  ];

  const results = {};
  let totalSize = 0;

  console.log('📦 Bundle Sizes:');
  for (const bundle of bundleFiles) {
    const size = await getBundleSize(resolve(projectRoot, bundle.path));
    totalSize += size;

    results[bundle.key] = {
      name: bundle.name,
      bytes: size,
      formatted: formatBytes(size),
      exists: size > 0
    };

    const statusIcon = size > 0 ? '✅' : '❌';
    console.log(`   ${statusIcon} ${bundle.name}: ${size > 0 ? formatBytes(size) : 'Not found'}`);
  }

  results.total = {
    name: 'Total Bundle Size',
    bytes: totalSize,
    formatted: formatBytes(totalSize)
  };

  console.log(`\n📊 Total Size: ${formatBytes(totalSize)}`);

  // Performance analysis
  const thresholds = {
    app: 250 * 1024,      // 250KB
    css: 50 * 1024,       // 50KB
    worker: 100 * 1024,   // 100KB
    total: 400 * 1024     // 400KB
  };

  console.log('\n📈 Performance Analysis:');

  Object.entries(results).forEach(([key, data]) => {
    if (!thresholds[key] || !data.exists) return;

    const threshold = thresholds[key];
    const ratio = data.bytes / threshold;

    let status, icon;
    if (ratio <= 1) {
      status = 'Excellent';
      icon = '🟢';
    } else if (ratio <= 1.5) {
      status = 'Good';
      icon = '🟡';
    } else if (ratio <= 2) {
      status = 'Fair';
      icon = '🟠';
    } else {
      status = 'Needs Optimization';
      icon = '🔴';
    }

    const percentage = ((ratio - 1) * 100);
    const overUnder = ratio > 1 ? `${percentage.toFixed(0)}% over` : `${Math.abs(percentage).toFixed(0)}% under`;

    console.log(`   ${icon} ${data.name}: ${status} (${overUnder} target)`);
  });

  // Gzip estimates
  console.log('\n📉 Estimated Gzipped Sizes:');
  const gzipRatio = 0.3; // ~30% compression typical for JS/CSS

  Object.entries(results).forEach(([key, data]) => {
    if (key === 'html' || !data.exists) return;
    const gzipped = formatBytes(data.bytes * gzipRatio);
    console.log(`   📁 ${data.name}: ${gzipped} (estimated)`);
  });

  // Recommendations
  console.log('\n💡 Recommendations:');

  const recommendations = [];

  if (results.app.bytes > thresholds.app * 2) {
    recommendations.push('🔴 App bundle is very large - implement lazy loading for major components');
  } else if (results.app.bytes > thresholds.app) {
    recommendations.push('🟡 App bundle could be optimized - consider code splitting');
  }

  if (results.css.bytes > thresholds.css) {
    recommendations.push('🟡 CSS bundle is large - remove unused styles or use PurgeCSS');
  }

  if (results.total.bytes > thresholds.total * 1.5) {
    recommendations.push('🔴 Total bundle size is too large - implement aggressive optimization');
  }

  if (results.total.bytes <= thresholds.total) {
    recommendations.push('🟢 Bundle sizes are well optimized!');
  }

  if (recommendations.length === 0) {
    recommendations.push('✅ No specific recommendations - performance looks good');
  }

  recommendations.forEach((rec, i) => {
    console.log(`   ${i + 1}. ${rec}`);
  });

  console.log('\n================================');

  return results;
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  checkBundleSizes()
    .then(() => {
      console.log('\n✅ Bundle size check completed');
    })
    .catch(error => {
      console.error('❌ Bundle size check failed:', error.message);
      process.exit(1);
    });
}

export default checkBundleSizes;
