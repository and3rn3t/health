#!/usr/bin/env node
/**
 * CSS Optimization Test - Simple version to test the optimization concept
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🧪 CSS Optimization Quick Test');
console.log('==============================');

// Test 1: Check Tailwind config exists and analyze safelist
console.log('\n1️⃣ Testing Tailwind Config Analysis...');

const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
if (!fs.existsSync(tailwindConfigPath)) {
    console.log('❌ Tailwind config not found');
    process.exit(1);
}

try {
    const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');
    console.log(`✅ Tailwind config found (${configContent.length} chars)`);

    // Extract safelist (simplified)
    const safelistMatch = configContent.match(/safelist:\s*\[([\s\S]*?)\]/);
    if (safelistMatch) {
        const safelistContent = safelistMatch[1];
        const safelistItems = safelistContent.match(/'([^']+)'/g) || [];
        console.log(`📋 Safelist found: ${safelistItems.length} classes`);

        // Show first few items as example
        const firstFew = safelistItems.slice(0, 5).map(item => item.replace(/'/g, ''));
        console.log(`📝 Example classes: ${firstFew.join(', ')}...`);
    } else {
        console.log('📋 No safelist found');
    }

} catch (err) {
    console.error('❌ Error reading Tailwind config:', err.message);
    process.exit(1);
}

// Test 2: Quick component scan (just count files, don't analyze content yet)
console.log('\n2️⃣ Testing Component Discovery...');

const srcDir = path.join(projectRoot, 'src');
if (!fs.existsSync(srcDir)) {
    console.log('❌ src directory not found');
    process.exit(1);
}

let componentCount = 0;
function countComponents(dir) {
    try {
        const entries = fs.readdirSync(dir);

        for (const entry of entries) {
            const fullPath = path.join(dir, entry);
            const stats = fs.statSync(fullPath);

            if (stats.isDirectory()) {
                countComponents(fullPath);
            } else if (entry.match(/\.(tsx?|jsx?)$/)) {
                componentCount++;
            }
        }
    } catch (err) {
        console.warn(`⚠️  Could not scan ${dir}: ${err.message}`);
    }
}

countComponents(srcDir);
console.log(`✅ Found ${componentCount} component files`);

// Test 3: Bundle size analysis
console.log('\n3️⃣ Testing Bundle Size Analysis...');

const distDir = path.join(projectRoot, 'dist');
const workerDir = path.join(projectRoot, 'dist-worker');

let distExists = fs.existsSync(distDir);
let workerExists = fs.existsSync(workerDir);

console.log(`📁 dist directory: ${distExists ? '✅ exists' : '❌ not found'}`);
console.log(`📁 dist-worker directory: ${workerExists ? '✅ exists' : '❌ not found'}`);

if (distExists) {
    const files = fs.readdirSync(distDir);
    console.log(`📦 Files in dist: ${files.length}`);

    const jsFiles = files.filter(f => f.endsWith('.js'));
    const cssFiles = files.filter(f => f.endsWith('.css'));
    console.log(`📜 JS files: ${jsFiles.length}, CSS files: ${cssFiles.length}`);
}

console.log('\n🎉 CSS Optimization Quick Test Complete!');
console.log('\n🚀 Results:');
console.log(`   Component Files: ${componentCount}`);
console.log(`   Dist Directory: ${distExists ? 'Available' : 'Missing - run build first'}`);
console.log(`   Ready for optimization: ${componentCount > 0 ? '✅' : '❌'}`);

if (componentCount > 0) {
    console.log('\n💡 Next steps:');
    console.log('   1. Full CSS analysis with: node scripts/css-optimizer.js');
    console.log('   2. Bundle optimization: node scripts/build-optimizer.js');
    console.log('   3. Full test: node scripts/bundle-optimization-tester.js');
} else {
    console.log('\n⚠️  No components found - check src directory structure');
}
