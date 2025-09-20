#!/usr/bin/env node
/**
 * Bundle Optimization Tester - VitalSense Bundle Size Emergency Fix
 * Tests all optimizations and measures before/after results
 */

import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import { fileURLToPath } from 'url';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🧪 VitalSense Bundle Optimization Tester');
console.log('========================================');
console.log('Current Bundle: 1.83MB → Target: <400KB (78% reduction needed)');

const TARGETS = {
    reactApp: 400 * 1024, // 400KB
    css: 50 * 1024,       // 50KB
    worker: 150 * 1024    // 150KB
};

async function measureCurrentBundle() {
    console.log('\n📊 Measuring Current Bundle Size...');

    try {
        // Run current bundle analyzer
    const { stdout } = await execAsync('node scripts/node/analysis/bundle-analyzer.js --json', {
            cwd: projectRoot
        });

        const analysis = JSON.parse(stdout);

        console.log('📦 Current Bundle Composition:');
        console.log(`  React App: ${Math.round(analysis.reactApp / 1024)}KB`);
        console.log(`  CSS Bundle: ${Math.round(analysis.css / 1024)}KB`);
        console.log(`  Worker: ${Math.round(analysis.worker / 1024)}KB`);
        console.log(`  Total: ${Math.round(analysis.total / 1024)}KB`);

        return analysis;

    } catch (err) {
        console.error('❌ Current bundle measurement failed:', err.message);

        // Fallback to file system analysis
        return await fallbackBundleAnalysis();
    }
}

async function fallbackBundleAnalysis() {
    console.log('📁 Fallback: Direct file system analysis...');

    const distPath = path.join(projectRoot, 'dist');
    const workerPath = path.join(projectRoot, 'dist-worker');

    let reactApp = 0;
    let css = 0;
    let worker = 0;

    try {
        if (fs.existsSync(distPath)) {
            const distFiles = await scanDirectory(distPath);

            distFiles.forEach(file => {
                if (file.name.endsWith('.js')) {
                    reactApp += file.size;
                } else if (file.name.endsWith('.css')) {
                    css += file.size;
                }
            });
        }

        if (fs.existsSync(workerPath)) {
            const workerFiles = await scanDirectory(workerPath);
            worker = workerFiles.reduce((sum, file) => sum + file.size, 0);
        }

    } catch (err) {
        console.warn('⚠️  Fallback analysis limited:', err.message);
    }

    return {
        reactApp,
        css,
        worker,
        total: reactApp + css + worker,
        timestamp: new Date().toISOString()
    };
}

async function scanDirectory(dir) {
    const files = [];

    function scanRecursive(currentDir) {
        const entries = fs.readdirSync(currentDir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry.name);

            if (entry.isDirectory()) {
                scanRecursive(fullPath);
            } else {
                const stats = fs.statSync(fullPath);
                files.push({
                    name: entry.name,
                    path: fullPath,
                    size: stats.size
                });
            }
        }
    }

    scanRecursive(dir);
    return files;
}

async function testCSSOptimization() {
    console.log('\n🎨 Testing CSS Optimization...');

    try {
        // Run CSS optimizer
    await execAsync('node scripts/node/analysis/css/css-optimizer.js', { cwd: projectRoot });
        console.log('✅ CSS optimization analysis complete');

        // Check if optimized config was generated
        const optimizedConfigPath = path.join(projectRoot, 'tailwind.config.optimized.js');
        if (fs.existsSync(optimizedConfigPath)) {
            console.log('✅ Optimized Tailwind config generated');

            // Read and analyze the optimization
            const originalConfigPath = path.join(projectRoot, 'tailwind.config.js');
            const originalConfig = fs.readFileSync(originalConfigPath, 'utf-8');
            const optimizedConfig = fs.readFileSync(optimizedConfigPath, 'utf-8');

            const originalSafelistMatch = originalConfig.match(/safelist:\s*\[([\s\S]*?)\]/);
            const optimizedSafelistMatch = optimizedConfig.match(/safelist:\s*\[([\s\S]*?)\]/);

            if (originalSafelistMatch && optimizedSafelistMatch) {
                const originalClasses = (originalSafelistMatch[1].match(/'/g) || []).length / 2;
                const optimizedClasses = (optimizedSafelistMatch[1].match(/'/g) || []).length / 2;

                console.log(`📊 Safelist optimization: ${originalClasses} → ${optimizedClasses} classes`);
                console.log(`💾 Estimated CSS savings: ~${Math.round((originalClasses - optimizedClasses) / originalClasses * 30)}KB`);
            }

            return true;
        } else {
            console.log('⚠️  Optimized config not generated');
            return false;
        }

    } catch (err) {
        console.error('❌ CSS optimization test failed:', err.message);
        return false;
    }
}

async function testBuildOptimization() {
    console.log('\n⚙️  Testing Build Configuration Optimization...');

    try {
        // Run build optimizer
        await execAsync('node scripts/build-optimizer.js', { cwd: projectRoot });
        console.log('✅ Build optimization configuration generated');

        // Check if optimized configs were generated
        const configs = [
            'vite.config.optimized.ts',
            'postcss.config.optimized.js',
            'scripts/optimized-build.js'
        ];

        let generatedConfigs = 0;
        for (const config of configs) {
            const configPath = path.join(projectRoot, config);
            if (fs.existsSync(configPath)) {
                console.log(`✅ ${config} generated`);
                generatedConfigs++;
            } else {
                console.log(`❌ ${config} missing`);
            }
        }

        return generatedConfigs === configs.length;

    } catch (err) {
        console.error('❌ Build optimization test failed:', err.message);
        return false;
    }
}

async function runOptimizedBuild() {
    console.log('\n🔨 Running Optimized Build Test...');

    try {
        // Clear previous builds
        const distPath = path.join(projectRoot, 'dist');
        const workerPath = path.join(projectRoot, 'dist-worker');

        if (fs.existsSync(distPath)) {
            fs.rmSync(distPath, { recursive: true, force: true });
            console.log('🗑️  Cleared previous dist');
        }

        if (fs.existsSync(workerPath)) {
            fs.rmSync(workerPath, { recursive: true, force: true });
            console.log('🗑️  Cleared previous dist-worker');
        }

        // Run optimized build
        const startTime = Date.now();

        console.log('📦 Building with optimized configuration...');
        await execAsync('vite build --config vite.config.optimized.ts --mode production', {
            cwd: projectRoot,
            timeout: 120000 // 2 minute timeout
        });

        console.log('⚙️  Building worker...');
        await execAsync('vite build --config vite.worker.config.ts', {
            cwd: projectRoot,
            timeout: 60000 // 1 minute timeout
        });

        const buildTime = Date.now() - startTime;
        console.log(`✅ Optimized build completed in ${Math.round(buildTime / 1000)}s`);

        return true;

    } catch (err) {
        console.error('❌ Optimized build failed:', err.message);
        console.error('Full error:', err);
        return false;
    }
}

async function measureOptimizedBundle() {
    console.log('\n📈 Measuring Optimized Bundle...');

    try {
        const optimizedBundle = await fallbackBundleAnalysis();

        console.log('📦 Optimized Bundle Composition:');
        console.log(`  React App: ${Math.round(optimizedBundle.reactApp / 1024)}KB`);
        console.log(`  CSS Bundle: ${Math.round(optimizedBundle.css / 1024)}KB`);
        console.log(`  Worker: ${Math.round(optimizedBundle.worker / 1024)}KB`);
        console.log(`  Total: ${Math.round(optimizedBundle.total / 1024)}KB`);

        return optimizedBundle;

    } catch (err) {
        console.error('❌ Optimized bundle measurement failed:', err.message);
        return null;
    }
}

function generateComparisonReport(original, optimized) {
    console.log('\n📊 Bundle Optimization Results');
    console.log('===============================');

    if (!optimized) {
        console.log('❌ Cannot generate comparison - optimized bundle measurement failed');
        return;
    }

    const comparison = {
        reactApp: {
            original: original.reactApp,
            optimized: optimized.reactApp,
            savings: original.reactApp - optimized.reactApp,
            percentReduction: Math.round(((original.reactApp - optimized.reactApp) / original.reactApp) * 100)
        },
        css: {
            original: original.css,
            optimized: optimized.css,
            savings: original.css - optimized.css,
            percentReduction: Math.round(((original.css - optimized.css) / original.css) * 100)
        },
        worker: {
            original: original.worker,
            optimized: optimized.worker,
            savings: original.worker - optimized.worker,
            percentReduction: Math.round(((original.worker - optimized.worker) / original.worker) * 100)
        },
        total: {
            original: original.total,
            optimized: optimized.total,
            savings: original.total - optimized.total,
            percentReduction: Math.round(((original.total - optimized.total) / original.total) * 100)
        }
    };

    console.log('📈 Optimization Results:');
    console.log(`  React App: ${Math.round(comparison.reactApp.original / 1024)}KB → ${Math.round(comparison.reactApp.optimized / 1024)}KB (${comparison.reactApp.percentReduction >= 0 ? '-' : '+'}${Math.abs(comparison.reactApp.percentReduction)}%)`);
    console.log(`  CSS Bundle: ${Math.round(comparison.css.original / 1024)}KB → ${Math.round(comparison.css.optimized / 1024)}KB (${comparison.css.percentReduction >= 0 ? '-' : '+'}${Math.abs(comparison.css.percentReduction)}%)`);
    console.log(`  Worker: ${Math.round(comparison.worker.original / 1024)}KB → ${Math.round(comparison.worker.optimized / 1024)}KB (${comparison.worker.percentReduction >= 0 ? '-' : '+'}${Math.abs(comparison.worker.percentReduction)}%)`);
    console.log(`  Total: ${Math.round(comparison.total.original / 1024)}KB → ${Math.round(comparison.total.optimized / 1024)}KB (${comparison.total.percentReduction >= 0 ? '-' : '+'}${Math.abs(comparison.total.percentReduction)}%)`);

    console.log('\n🎯 Target Achievement:');
    console.log(`  React App: ${optimized.reactApp <= TARGETS.reactApp ? '✅' : '❌'} ${Math.round(optimized.reactApp / 1024)}KB / ${Math.round(TARGETS.reactApp / 1024)}KB target`);
    console.log(`  CSS Bundle: ${optimized.css <= TARGETS.css ? '✅' : '❌'} ${Math.round(optimized.css / 1024)}KB / ${Math.round(TARGETS.css / 1024)}KB target`);
    console.log(`  Worker: ${optimized.worker <= TARGETS.worker ? '✅' : '❌'} ${Math.round(optimized.worker / 1024)}KB / ${Math.round(TARGETS.worker / 1024)}KB target`);

    const totalTarget = TARGETS.reactApp + TARGETS.css + TARGETS.worker;
    console.log(`  Total: ${optimized.total <= totalTarget ? '✅' : '❌'} ${Math.round(optimized.total / 1024)}KB / ${Math.round(totalTarget / 1024)}KB target`);

    // Save detailed report
    const report = {
        timestamp: new Date().toISOString(),
        original,
        optimized,
        comparison,
        targets: TARGETS,
        targetAchievement: {
            reactApp: optimized.reactApp <= TARGETS.reactApp,
            css: optimized.css <= TARGETS.css,
            worker: optimized.worker <= TARGETS.worker,
            total: optimized.total <= totalTarget
        }
    };

    const reportPath = path.join(projectRoot, 'bundle-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);

    return report;
}

async function main() {
    try {
        console.log('🚀 Starting Bundle Optimization Test Suite...\n');

        // Step 1: Measure current bundle
        const originalBundle = await measureCurrentBundle();

        // Step 2: Test CSS optimization
        const cssOptimized = await testCSSOptimization();
        if (!cssOptimized) {
            console.log('⚠️  Continuing without CSS optimization...');
        }

        // Step 3: Test build optimization
        const buildOptimized = await testBuildOptimization();
        if (!buildOptimized) {
            console.log('⚠️  Continuing without build optimization...');
        }

        // Step 4: Run optimized build
        const buildSuccess = await runOptimizedBuild();
        if (!buildSuccess) {
            console.log('❌ Cannot proceed - optimized build failed');
            process.exit(1);
        }

        // Step 5: Measure optimized bundle
        const optimizedBundle = await measureOptimizedBundle();

        // Step 6: Generate comparison report
        generateComparisonReport(originalBundle, optimizedBundle);

        console.log('\n🎉 Bundle Optimization Test Complete!');
        console.log('\n🚀 Next Steps:');
        if (optimizedBundle && optimizedBundle.total <= (TARGETS.reactApp + TARGETS.css + TARGETS.worker)) {
            console.log('✅ Targets achieved! Apply optimizations to production');
            console.log('1. Replace vite.config.ts with vite.config.optimized.ts');
            console.log('2. Replace postcss.config.js with postcss.config.optimized.js');
            console.log('3. Replace tailwind.config.js with tailwind.config.optimized.js');
        } else {
            console.log('⚠️  Targets not fully achieved. Additional optimizations needed:');
            console.log('1. Review lazy loading implementation in App.tsx');
            console.log('2. Consider removing heavy dependencies (D3.js, Three.js)');
            console.log('3. Implement more aggressive code splitting');
        }

    } catch (error) {
        console.error('❌ Bundle optimization test failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
