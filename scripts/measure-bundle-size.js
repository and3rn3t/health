#!/usr/bin/env node
// 📊 Bundle Size Measurement - Phase 1B Results
// Measure actual bundle size after code splitting optimization

import fs from 'fs';
import path from 'path';

console.log('📊 VitalSense Bundle Size Analysis - Phase 1B Results');
console.log('====================================================');

// Get dist directory stats
const distDir = path.join(process.cwd(), 'dist');
const distWorkerDir = path.join(process.cwd(), 'dist-worker');

function getDirectorySize(dirPath) {
    let totalSize = 0;
    const files = [];

    try {
        function traverse(dir) {
            const items = fs.readdirSync(dir);

            for (const item of items) {
                const itemPath = path.join(dir, item);
                const stats = fs.statSync(itemPath);

                if (stats.isDirectory()) {
                    traverse(itemPath);
                } else {
                    const size = stats.size;
                    totalSize += size;
                    files.push({
                        name: path.relative(dirPath, itemPath),
                        size: size,
                        sizeKB: Math.round(size / 1024 * 100) / 100
                    });
                }
            }
        }

        traverse(dirPath);
    } catch (error) {
        console.log(`❌ Error reading ${dirPath}: ${error.message}`);
        return { totalSize: 0, files: [] };
    }

    return { totalSize, files };
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024 * 100) / 100}KB`;
    return `${Math.round(bytes / (1024 * 1024) * 100) / 100}MB`;
}

console.log('🔍 Analyzing build output...\n');

// Analyze main app bundle
const appResults = getDirectorySize(distDir);
console.log('📱 Main App Bundle (dist/):', formatSize(appResults.totalSize));

// Show largest files
const largestAppFiles = appResults.files
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

console.log('\n📋 Largest App Files:');
largestAppFiles.forEach(file => {
    console.log(`  • ${file.name}: ${formatSize(file.size)}`);
});

// Analyze worker bundle
const workerResults = getDirectorySize(distWorkerDir);
console.log(`\n⚙️  Worker Bundle (dist-worker/): ${formatSize(workerResults.totalSize)}`);

// Show largest worker files
const largestWorkerFiles = workerResults.files
    .sort((a, b) => b.size - a.size)
    .slice(0, 5);

console.log('\n📋 Largest Worker Files:');
largestWorkerFiles.forEach(file => {
    console.log(`  • ${file.name}: ${formatSize(file.size)}`);
});

// Calculate totals
const totalBundleSize = appResults.totalSize + workerResults.totalSize;
console.log(`\n📊 Total Bundle Size: ${formatSize(totalBundleSize)}`);

// Compare with our estimates
console.log('\n🎯 Phase 1B Code Splitting Analysis:');
console.log('=====================================');

// Look for chunks (lazy-loaded components)
const jsFiles = appResults.files.filter(f => f.name.endsWith('.js'));
const chunkFiles = jsFiles.filter(f => f.name.includes('-') && !f.name.startsWith('index'));

console.log(`📦 JavaScript Files: ${jsFiles.length}`);
console.log(`🔄 Lazy-loaded Chunks: ${chunkFiles.length}`);

if (chunkFiles.length > 0) {
    console.log('\n📋 Code-split Chunks:');
    chunkFiles.forEach(file => {
        console.log(`  • ${file.name}: ${formatSize(file.size)}`);
    });
}

// Size comparison estimates
console.log('\n📈 Optimization Impact Assessment:');
console.log('==================================');

const currentTotalKB = Math.round(totalBundleSize / 1024);

// Our previous estimates
console.log('🎯 Original estimates vs actual results:');
console.log(`  • Current total bundle: ${currentTotalKB}KB`);
console.log('  • Pre-optimization estimate: ~9,000KB');
console.log(`  • Reduction achieved: ~${Math.max(0, 9000 - currentTotalKB)}KB`);
console.log(`  • Percentage reduction: ~${Math.round((1 - currentTotalKB / 9000) * 100)}%`);

if (currentTotalKB < 500) {
    console.log('✅ EXCELLENT: Bundle under 500KB target!');
} else if (currentTotalKB < 1000) {
    console.log('✅ GOOD: Significant size reduction achieved');
} else if (currentTotalKB < 2000) {
    console.log('🟡 MODERATE: Some reduction, more optimization possible');
} else {
    console.log('🔴 HIGH: Bundle still large, additional optimization needed');
}

console.log('\n🔄 Code Splitting Verification:');
console.log('==============================');

// Check if we have the expected lazy-loaded components
const expectedChunks = ['HealthDashboard', 'GameCenter', 'SettingsPanel'];
const foundChunks = [];

for (const expectedChunk of expectedChunks) {
    const found = chunkFiles.some(file =>
        file.name.toLowerCase().includes(expectedChunk.toLowerCase())
    );
    if (found) {
        foundChunks.push(expectedChunk);
        console.log(`✅ ${expectedChunk}: Lazy-loaded successfully`);
    } else {
        console.log(`❌ ${expectedChunk}: Not found as separate chunk`);
    }
}

console.log(`\n📊 Code splitting success rate: ${foundChunks.length}/${expectedChunks.length} components`);

// Final summary
console.log('\n🎉 Phase 1B Optimization Results:');
console.log('=================================');
console.log(`📦 Final bundle size: ${formatSize(totalBundleSize)}`);
console.log(`🎯 Target achieved: ${currentTotalKB < 500 ? '✅ YES' : '❌ NO'} (${currentTotalKB}KB ${currentTotalKB < 500 ? '<' : '>'} 500KB)`);
console.log(`🔄 Code splitting: ${foundChunks.length > 0 ? '✅ Active' : '❌ Not detected'}`);
console.log(`⚡ Performance impact: ${foundChunks.length > 0 ? 'Improved loading times' : 'Minimal'}`);

if (currentTotalKB > 500) {
    console.log('\n🔧 Next Phase Recommendations:');
    console.log('- Phase 1C: Dependency analysis and pruning');
    console.log('- Phase 1D: Advanced tree-shaking optimization');
    console.log('- Phase 2: Image and asset optimization');
}

console.log('\n✅ Bundle analysis complete!');
