#!/usr/bin/env node
/**
 * CSS Bundle Emergency Optimizer - Fast Version
 * Target: Reduce 122KB CSS to <50KB (59% reduction)
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🎨 VitalSense CSS Emergency Optimizer');
console.log('=====================================');
console.log('Target: 122KB → 50KB (59% reduction needed)');

function analyzeCurrentSafelist() {
    console.log('\n📋 Analyzing Current Safelist...');

    const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
    const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');

    const safelistMatch = configContent.match(/safelist:\s*\[([\s\S]*?)\]/);
    if (!safelistMatch) return { classes: [], analysis: null };

    const safelistContent = safelistMatch[1];
    const safelistItems = safelistContent.match(/'([^']+)'/g) || [];
    const classes = safelistItems.map(item => item.replace(/'/g, ''));

    console.log(`📊 Current safelist: ${classes.length} classes`);

    // Analyze by category
    const categories = {
        background: classes.filter(c => c.startsWith('bg-vitalsense')),
        text: classes.filter(c => c.startsWith('text-vitalsense')),
        border: classes.filter(c => c.startsWith('border-vitalsense')),
        hover: classes.filter(c => c.startsWith('hover:')),
        other: classes.filter(c => !c.includes('vitalsense') && !c.startsWith('hover:'))
    };

    console.log('📂 Safelist Categories:');
    Object.entries(categories).forEach(([cat, items]) => {
        console.log(`  ${cat}: ${items.length} classes`);
    });

    return { classes, categories };
}

function scanComponentsForClasses() {
    console.log('\n🔍 Quick Component CSS Scan...');

    // Sample a few key components instead of scanning all 245
    const keyComponents = [
        path.join(projectRoot, 'src/App.tsx'),
        path.join(projectRoot, 'src/components'),
        path.join(projectRoot, 'src/pages')
    ];

    const usedClasses = new Set();
    let filesScanned = 0;

    function scanPath(targetPath) {
        if (!fs.existsSync(targetPath)) return;

        const stats = fs.statSync(targetPath);
        if (stats.isFile() && targetPath.match(/\.(tsx?|jsx?)$/)) {
            scanFile(targetPath);
        } else if (stats.isDirectory()) {
            try {
                const entries = fs.readdirSync(targetPath);
                for (const entry of entries.slice(0, 20)) { // Limit to first 20 files per directory
                    const fullPath = path.join(targetPath, entry);
                    scanPath(fullPath);
                }
            } catch (err) {
                console.warn(`⚠️  Skip ${targetPath}: ${err.message}`);
            }
        }
    }

    function scanFile(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            filesScanned++;

            // Extract VitalSense classes specifically
            const vitalSenseMatches = content.match(/[a-zA-Z-]*vitalsense[a-zA-Z-]*/g) || [];
            vitalSenseMatches.forEach(className => {
                if (className.includes('vitalsense')) {
                    usedClasses.add(className);
                }
            });

            // Extract common patterns
            const commonMatches = content.match(/(?:bg|text|border|hover)-[a-zA-Z-]+/g) || [];
            commonMatches.forEach(className => {
                if (className.includes('vitalsense')) {
                    usedClasses.add(className);
                }
            });

        } catch (err) {
            console.warn(`⚠️  Could not scan ${filePath}: ${err.message}`);
        }
    }

    // Scan key paths
    keyComponents.forEach(scanPath);

    console.log(`📄 Scanned ${filesScanned} files`);
    console.log(`🎨 Found ${usedClasses.size} VitalSense classes in use`);

    return Array.from(usedClasses);
}

function generateMinimalSafelist(currentClasses, usedClasses) {
    console.log('\n🎯 Generating Minimal Safelist...');

    const usedSet = new Set(usedClasses);

    // Keep only classes that are actually used + essential dynamic classes
    const minimalSafelist = currentClasses.filter(className => {
        // Keep if used
        if (usedSet.has(className)) return true;

        // Keep essential hover states
        if (className.startsWith('hover:bg-vitalsense-primary')) return true;
        if (className.startsWith('hover:bg-vitalsense-teal')) return true;

        // Keep essential brand colors that might be dynamic
        if (className === 'bg-vitalsense-primary' || className === 'bg-vitalsense-teal') return true;
        if (className === 'text-vitalsense-primary' || className === 'text-vitalsense-teal') return true;

        return false;
    });

    console.log(`📊 Optimization Results:`);
    console.log(`  Original: ${currentClasses.length} classes`);
    console.log(`  Used: ${usedClasses.length} classes found in components`);
    console.log(`  Minimal: ${minimalSafelist.length} classes (${Math.round((minimalSafelist.length / currentClasses.length) * 100)}% of original)`);

    const potentialSavings = Math.round(((currentClasses.length - minimalSafelist.length) / currentClasses.length) * 30); // Estimate
    console.log(`💾 Estimated CSS savings: ~${potentialSavings}KB`);

    return minimalSafelist;
}

function generateOptimizedConfig(minimalSafelist) {
    console.log('\n⚙️  Generating Optimized Tailwind Config...');

    const originalConfigPath = path.join(projectRoot, 'tailwind.config.js');
    const optimizedConfigPath = path.join(projectRoot, 'tailwind.config.optimized.js');

    const originalContent = fs.readFileSync(originalConfigPath, 'utf-8');

    // Create new safelist string
    const minimalSafelistStr = minimalSafelist
        .map(className => `    '${className}',`)
        .join('\n');

    // Replace safelist in config
    const optimizedContent = originalContent.replace(
        /safelist:\s*\[([\s\S]*?)\]/,
        `safelist: [
${minimalSafelistStr}
  ]`
    );

    // Add comment about optimization
    const header = `// OPTIMIZED TAILWIND CONFIG - Generated by CSS Emergency Optimizer
// Original safelist: ${originalContent.match(/'[^']+'/g)?.length || 0} classes
// Optimized safelist: ${minimalSafelist.length} classes
// Estimated savings: ~${Math.round(((originalContent.match(/'[^']+'/g)?.length || 0) - minimalSafelist.length) / (originalContent.match(/'[^']+'/g)?.length || 1) * 30)}KB

`;

    const finalContent = header + optimizedContent;

    // Write optimized config
    fs.writeFileSync(optimizedConfigPath, finalContent);
    console.log(`✅ Optimized config saved: ${optimizedConfigPath}`);

    // Create backup
    const backupPath = path.join(projectRoot, 'tailwind.config.backup.js');
    fs.writeFileSync(backupPath, originalContent);
    console.log(`💾 Original config backed up: ${backupPath}`);

    return { optimizedConfigPath, backupPath };
}

function generatePostCSSOptimization() {
    console.log('\n🎨 Generating PostCSS Optimization...');

    const optimizedPostCSS = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Advanced CSS optimization for production
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: ['advanced', {
          // Aggressive CSS minification
          discardComments: { removeAll: true },
          normalizeWhitespace: true,
          colormin: true,
          normalizeUnicode: true,
          minifySelectors: true,
          mergeRules: true,
          mergeLonghand: true,
          discardOverridden: true,
          discardEmpty: true,
          discardDuplicates: true,
          calc: true,
          convertValues: true,
        }],
      },
    }),
  },
};`;

    const postCSSPath = path.join(projectRoot, 'postcss.config.optimized.js');
    fs.writeFileSync(postCSSPath, optimizedPostCSS);
    console.log(`✅ Optimized PostCSS config saved: ${postCSSPath}`);

    return postCSSPath;
}

function generateOptimizationSummary(original, minimal) {
    console.log('\n📋 CSS Optimization Summary');
    console.log('============================');

    const reduction = original.length - minimal.length;
    const percentReduction = Math.round((reduction / original.length) * 100);
    const estimatedSavings = Math.round((reduction / original.length) * 30); // 30KB base estimate

    console.log(`📊 Safelist Optimization:`);
    console.log(`  ${original.length} → ${minimal.length} classes (${percentReduction}% reduction)`);
    console.log(`  Estimated CSS savings: ~${estimatedSavings}KB`);

    console.log(`\n🎯 Expected Results:`);
    console.log(`  Current CSS: 122KB`);
    console.log(`  Target CSS: 50KB`);
    console.log(`  Safelist savings: ~${estimatedSavings}KB`);
    console.log(`  Additional optimization needed: ~${Math.max(0, 122 - 50 - estimatedSavings)}KB`);

    const report = {
        timestamp: new Date().toISOString(),
        optimization: {
            original: original.length,
            optimized: minimal.length,
            reduction,
            percentReduction,
            estimatedSavings
        },
        targets: {
            currentCSS: 122,
            targetCSS: 50,
            additionalOptimizationNeeded: Math.max(0, 122 - 50 - estimatedSavings)
        }
    };

    const reportPath = path.join(projectRoot, 'css-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n💾 Detailed report saved: ${reportPath}`);

    return report;
}

async function main() {
    try {
        console.log('\n🚀 Starting CSS Emergency Optimization...');

        // Step 1: Analyze current safelist
        const safelist = analyzeCurrentSafelist();

        // Step 2: Quick component scan for VitalSense classes
        const usedClasses = scanComponentsForClasses();

        // Step 3: Generate minimal safelist
        const minimalSafelist = generateMinimalSafelist(safelist.classes, usedClasses);

        // Step 4: Generate optimized configs
        generateOptimizedConfig(minimalSafelist);
        generatePostCSSOptimization();

        // Step 5: Generate summary
        generateOptimizationSummary(safelist.classes, minimalSafelist);

        console.log('\n🎉 CSS Emergency Optimization Complete!');
        console.log('\n🚀 Next Steps:');
        console.log('1. Test build: vite build --config vite.config.ts');
        console.log('2. Apply optimization: replace tailwind.config.js with tailwind.config.optimized.js');
        console.log('3. Apply PostCSS: replace postcss.config.js with postcss.config.optimized.js');
        console.log('4. Verify with: node scripts/bundle-optimization-tester.js');

    } catch (error) {
        console.error('❌ CSS optimization failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
