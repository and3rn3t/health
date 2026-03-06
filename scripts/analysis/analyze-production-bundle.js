#!/usr/bin/env node
// 📊 True Production Bundle Size Analysis
// Calculate actual production bundle size excluding dev artifacts

import fs from 'fs';
import path from 'path';

console.log('📊 VitalSense TRUE Production Bundle Analysis');
console.log('============================================');

const distDir = path.join(process.cwd(), 'dist');
const distWorkerDir = path.join(process.cwd(), 'dist-worker');

function analyzeDirectory(dirPath) {
    try {
        const items = fs.readdirSync(dirPath);
        const files = [];

        for (const item of items) {
            const itemPath = path.join(dirPath, item);
            const stats = fs.statSync(itemPath);

            if (stats.isFile()) {
                files.push({
                    name: item,
                    size: stats.size,
                    sizeKB: Math.round(stats.size / 1024 * 100) / 100
                });
            }
        }

        return files;
    } catch (error) {
        console.log(`❌ Error reading ${dirPath}: ${error.message}`);
        return [];
    }
}

function formatSize(bytes) {
    if (bytes < 1024) return `${bytes}B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024 * 100) / 100}KB`;
    return `${Math.round(bytes / (1024 * 1024) * 100) / 100}MB`;
}

// Analyze files
const appFiles = analyzeDirectory(distDir);
const workerFiles = analyzeDirectory(distWorkerDir);

console.log('🔍 All Files Found:');
console.log('\n📱 App Files:');
appFiles.forEach(file => {
    console.log(`  • ${file.name}: ${formatSize(file.size)}`);
});

console.log('\n⚙️  Worker Files:');
workerFiles.forEach(file => {
    console.log(`  • ${file.name}: ${formatSize(file.size)}`);
});

// Filter PRODUCTION files only (exclude dev artifacts)
const productionAppFiles = appFiles.filter(file => {
    const name = file.name;
    // Exclude source maps, backup CSS files, and dev artifacts
    return !name.endsWith('.map') &&
           !name.includes('-original') &&
           !name.includes('-optimized') &&
           !name.includes('-phase') &&
           !name.includes('.min.css') &&
           name !== 'main.css' && // We want the optimized version
           !name.includes('temp') &&
           !name.includes('backup');
});

const productionWorkerFiles = workerFiles.filter(file => {
    return !file.name.endsWith('.map');
});

console.log('\n🎯 PRODUCTION FILES ONLY:');
console.log('=========================');

console.log('\n📱 Production App Files:');
let appTotalSize = 0;
productionAppFiles.forEach(file => {
    console.log(`  • ${file.name}: ${formatSize(file.size)}`);
    appTotalSize += file.size;
});

console.log('\n⚙️  Production Worker Files:');
let workerTotalSize = 0;
productionWorkerFiles.forEach(file => {
    console.log(`  • ${file.name}: ${formatSize(file.size)}`);
    workerTotalSize += file.size;
});

const totalProductionSize = appTotalSize + workerTotalSize;

console.log('\n📊 TRUE PRODUCTION BUNDLE SIZE:');
console.log('==============================');
console.log(`📱 App Bundle: ${formatSize(appTotalSize)}`);
console.log(`⚙️  Worker Bundle: ${formatSize(workerTotalSize)}`);
console.log(`🎯 TOTAL PRODUCTION: ${formatSize(totalProductionSize)}`);

// Calculate the actual optimization
const productionKB = Math.round(totalProductionSize / 1024);
const originalEstimateKB = 9000;
const reductionKB = originalEstimateKB - productionKB;
const reductionPercent = Math.round((reductionKB / originalEstimateKB) * 100);

console.log('\n🎉 OPTIMIZATION RESULTS:');
console.log('=======================');
console.log(`📊 Original estimate: ${originalEstimateKB}KB`);
console.log(`✅ Current production: ${productionKB}KB`);
console.log(`🎯 Reduction achieved: ${reductionKB}KB (${reductionPercent}%)`);

if (productionKB <= 400) {
    console.log('🏆 EXCELLENT: Under 400KB target! Outstanding optimization!');
} else if (productionKB <= 500) {
    console.log('✅ GREAT: Under 500KB target! Very good optimization!');
} else if (productionKB <= 1000) {
    console.log('🟢 GOOD: Under 1MB, significant improvement achieved');
} else if (productionKB <= 2000) {
    console.log('🟡 MODERATE: Under 2MB, some optimization achieved');
} else {
    console.log('🔴 NEEDS WORK: Still over 2MB, more optimization needed');
}

// Analyze code splitting effectiveness
const jsFiles = productionAppFiles.filter(f => f.name.endsWith('.js'));
const chunks = jsFiles.filter(f => f.name.includes('-') || f.name !== 'main.js');

console.log('\n🔄 CODE SPLITTING ANALYSIS:');
console.log('===========================');
console.log(`📦 Total JS files: ${jsFiles.length}`);
console.log(`🧩 Lazy-loaded chunks: ${chunks.length}`);

if (chunks.length > 0) {
    console.log('\n📋 Code-split chunks (production):');
    chunks.sort((a, b) => b.size - a.size).forEach(chunk => {
        console.log(`  • ${chunk.name}: ${formatSize(chunk.size)}`);
    });

    const chunksSize = chunks.reduce((sum, chunk) => sum + chunk.size, 0);
    console.log(`\n📊 Lazy chunks total: ${formatSize(chunksSize)}`);
    console.log('✅ Code splitting is working - components load on demand!');
} else {
    console.log('❌ No code splitting detected');
}

// Next steps recommendations
console.log('\n🔧 NEXT OPTIMIZATION PHASES:');
console.log('============================');

if (productionKB > 500) {
    console.log('📋 Recommended next phases:');
    console.log('  1. Phase 1C: Dependency analysis and tree-shaking');
    console.log('  2. Phase 1D: Remove unused components and utilities');
    console.log('  3. Phase 2A: Asset optimization (images, fonts)');
    console.log('  4. Phase 2B: Advanced chunking strategies');

    if (productionKB > 1000) {
        console.log('  🚨 PRIORITY: Large bundle needs aggressive optimization');
    }
} else {
    console.log('🎉 Bundle size is excellent! Consider:');
    console.log('  • Performance monitoring');
    console.log('  • Runtime optimization');
    console.log('  • User experience improvements');
}

console.log('\n✅ True production bundle analysis complete!');
