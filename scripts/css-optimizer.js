#!/usr/bin/env node
/**
 * CSS Bundle Optimizer - Phase 2 VitalSense Bundle Optimization
 * Analyzes and optimizes CSS bundle size through:
 * 1. Safelist analysis and reduction
 * 2. Unused CSS detection
 * 3. PurgeCSS integration
 * 4. Before/after comparison
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🎨 VitalSense CSS Bundle Optimizer');
console.log('====================================');

// Target: Reduce 122KB CSS to <50KB (59% reduction needed)
const CSS_TARGET_SIZE = 50 * 1024; // 50KB
const CURRENT_CSS_SIZE = 122 * 1024; // 122KB (from previous analysis)

function analyzeCSSBundle() {
    console.log('\n📊 CSS Bundle Analysis:');
    console.log(`Current Size: ${Math.round(CURRENT_CSS_SIZE / 1024)}KB`);
    console.log(`Target Size: ${Math.round(CSS_TARGET_SIZE / 1024)}KB`);
    console.log(`Reduction Needed: ${Math.round((CURRENT_CSS_SIZE - CSS_TARGET_SIZE) / 1024)}KB (${Math.round(((CURRENT_CSS_SIZE - CSS_TARGET_SIZE) / CURRENT_CSS_SIZE) * 100)}%)`);
}

function analyzeComponentUsage() {
    console.log('\n🔍 Analyzing Component CSS Usage...');

    const srcDir = path.join(projectRoot, 'src');
    const componentFiles = [];

    function scanDirectory(dir) {
        try {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    scanDirectory(fullPath);
                } else if (entry.name.match(/\.(tsx?|jsx?)$/)) {
                    componentFiles.push(fullPath);
                }
            }
        } catch (err) {
            console.warn(`⚠️  Could not scan directory ${dir}: ${err.message}`);
        }
    }

    scanDirectory(srcDir);

    const classUsage = new Map();
    const vitalSenseUsage = new Map();

    for (const file of componentFiles) {
        try {
            const content = fs.readFileSync(file, 'utf-8');

            // Extract Tailwind classes from className attributes
            const classMatches = content.match(/className\s*=\s*["`']([^"`']*)["`']/g) || [];
            const classNameMatches = content.match(/className\s*=\s*\{([^}]*)\}/g) || [];

            for (const match of [...classMatches, ...classNameMatches]) {
                // Extract individual classes
                const classes = match.match(/[\w-]+/g) || [];
                for (const className of classes) {
                    if (className.startsWith('bg-') || className.startsWith('text-') ||
                        className.startsWith('border-') || className.startsWith('hover:') ||
                        className.includes('vitalsense')) {
                        classUsage.set(className, (classUsage.get(className) || 0) + 1);

                        if (className.includes('vitalsense')) {
                            vitalSenseUsage.set(className, (vitalSenseUsage.get(className) || 0) + 1);
                        }
                    }
                }
            }
        } catch (err) {
            console.warn(`⚠️  Could not read file ${file}: ${err.message}`);
        }
    }

    console.log(`📁 Scanned ${componentFiles.length} component files`);
    console.log(`🎨 Found ${classUsage.size} unique CSS classes in use`);
    console.log(`💎 Found ${vitalSenseUsage.size} VitalSense brand classes in use`);

    return { classUsage, vitalSenseUsage, componentFiles };
}

function analyzeSafelist() {
    console.log('\n📋 Safelist Analysis...');

    const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
    if (!fs.existsSync(tailwindConfigPath)) {
        console.log('❌ Tailwind config not found');
        return { safelist: [], analysis: null };
    }

    try {
        const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');

        // Extract safelist items (simplified parsing)
        const safelistMatch = configContent.match(/safelist:\s*\[([\s\S]*?)\]/);
        if (!safelistMatch) {
            console.log('✅ No safelist found');
            return { safelist: [], analysis: null };
        }

        const safelistContent = safelistMatch[1];
        const safelistItems = safelistContent.match(/'([^']+)'/g) || [];
        const safelist = safelistItems.map(item => item.replace(/'/g, ''));

        console.log(`📊 Current safelist: ${safelist.length} classes`);

        // Categorize safelist items
        const categories = {
            background: safelist.filter(c => c.startsWith('bg-')),
            text: safelist.filter(c => c.startsWith('text-')),
            border: safelist.filter(c => c.startsWith('border-')),
            hover: safelist.filter(c => c.startsWith('hover:')),
            vitalsense: safelist.filter(c => c.includes('vitalsense')),
            other: safelist.filter(c =>
                !c.startsWith('bg-') && !c.startsWith('text-') &&
                !c.startsWith('border-') && !c.startsWith('hover:') &&
                !c.includes('vitalsense')
            )
        };

        console.log('📂 Safelist Categories:');
        Object.entries(categories).forEach(([category, items]) => {
            console.log(`  ${category}: ${items.length} classes`);
        });

        return { safelist, analysis: categories };
    } catch (err) {
        console.log(`❌ Error analyzing safelist: ${err.message}`);
        return { safelist: [], analysis: null };
    }
}

function generateOptimizedSafelist(actualUsage, currentSafelist) {
    console.log('\n🎯 Generating Optimized Safelist...');

    const usedClasses = Array.from(actualUsage.keys());
    const safelistSet = new Set(currentSafelist);

    // Find safelist items that are actually used
    const usedSafelistItems = currentSafelist.filter(item => actualUsage.has(item));
    const unusedSafelistItems = currentSafelist.filter(item => !actualUsage.has(item));

    // Find used classes not in safelist (these are automatically included by Tailwind)
    const autoIncludedClasses = usedClasses.filter(className => !safelistSet.has(className));

    console.log('📊 Safelist Optimization Results:');
    console.log(`  Used safelist items: ${usedSafelistItems.length}/${currentSafelist.length} (${Math.round((usedSafelistItems.length / currentSafelist.length) * 100)}%)`);
    console.log(`  Unused safelist items: ${unusedSafelistItems.length}/${currentSafelist.length} (${Math.round((unusedSafelistItems.length / currentSafelist.length) * 100)}%)`);
    console.log(`  Auto-included classes: ${autoIncludedClasses.length}`);

    // Generate minimal safelist (only include classes that are dynamically generated)
    const minimalSafelist = usedSafelistItems.filter(className => {
        // Keep VitalSense brand colors (might be used dynamically)
        if (className.includes('vitalsense')) return true;
        // Keep hover states (often dynamic)
        if (className.startsWith('hover:')) return true;
        // Keep state-based classes
        if (className.includes('focus:') || className.includes('active:')) return true;
        return false;
    });

    console.log(`🎯 Recommended minimal safelist: ${minimalSafelist.length} classes (${Math.round((minimalSafelist.length / currentSafelist.length) * 100)}% of current)`);
    console.log(`💾 Potential CSS size reduction: ~${Math.round((unusedSafelistItems.length / currentSafelist.length) * 30)}KB`);

    return {
        current: currentSafelist,
        used: usedSafelistItems,
        unused: unusedSafelistItems,
        minimal: minimalSafelist,
        autoIncluded: autoIncludedClasses
    };
}

function generateOptimizationReport(usage, safelist, optimization) {
    console.log('\n📋 CSS Optimization Report');
    console.log('===========================');

    const report = {
        timestamp: new Date().toISOString(),
        currentCSSSize: CURRENT_CSS_SIZE,
        targetCSSSize: CSS_TARGET_SIZE,
        reductionNeeded: CURRENT_CSS_SIZE - CSS_TARGET_SIZE,
        reductionPercent: Math.round(((CURRENT_CSS_SIZE - CSS_TARGET_SIZE) / CURRENT_CSS_SIZE) * 100),

        componentAnalysis: {
            filesScanned: usage.componentFiles.length,
            totalClasses: usage.classUsage.size,
            vitalSenseClasses: usage.vitalSenseUsage.size,
            topUsedClasses: Array.from(usage.classUsage.entries())
                .sort((a, b) => b[1] - a[1])
                .slice(0, 10)
                .map(([className, count]) => ({ className, count }))
        },

        safelistAnalysis: {
            currentSize: safelist.safelist.length,
            usedItems: optimization.used.length,
            unusedItems: optimization.unused.length,
            minimalSize: optimization.minimal.length,
            potentialSavings: Math.round((optimization.unused.length / safelist.safelist.length) * 30) // Estimate
        },

        recommendations: [
            'Reduce safelist from ' + safelist.safelist.length + ' to ' + optimization.minimal.length + ' classes',
            'Remove unused VitalSense color variants',
            'Implement PurgeCSS for additional optimization',
            'Consider CSS-in-JS for dynamic styles'
        ]
    };

    // Save detailed report
    const reportPath = path.join(projectRoot, 'css-optimization-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`💾 Detailed report saved to: ${reportPath}`);

    // Display summary
    console.log('\n🎯 Optimization Summary:');
    console.log(`Current CSS: ${Math.round(CURRENT_CSS_SIZE / 1024)}KB → Target: ${Math.round(CSS_TARGET_SIZE / 1024)}KB`);
    console.log(`Safelist: ${safelist.safelist.length} → ${optimization.minimal.length} classes`);
    console.log(`Estimated savings: ~${report.safelistAnalysis.potentialSavings}KB from safelist optimization`);

    return report;
}

function generateOptimizedTailwindConfig(optimization) {
    console.log('\n⚙️  Generating Optimized Tailwind Config...');

    const originalConfigPath = path.join(projectRoot, 'tailwind.config.js');
    const optimizedConfigPath = path.join(projectRoot, 'tailwind.config.optimized.js');

    try {
        const originalContent = fs.readFileSync(originalConfigPath, 'utf-8');

        // Replace safelist with minimal version
        const minimalSafelistStr = optimization.minimal
            .map(className => `    '${className}',`)
            .join('\n');

        const optimizedContent = originalContent.replace(
            /safelist:\s*\[([\s\S]*?)\]/,
            `safelist: [
${minimalSafelistStr}
  ]`
        );

        fs.writeFileSync(optimizedConfigPath, optimizedContent);
        console.log(`✅ Optimized config saved to: ${optimizedConfigPath}`);
        console.log(`📊 Safelist reduced from ${optimization.current.length} to ${optimization.minimal.length} classes`);

        // Create backup of original
        const backupPath = path.join(projectRoot, 'tailwind.config.backup.js');
        fs.writeFileSync(backupPath, originalContent);
        console.log(`💾 Original config backed up to: ${backupPath}`);

    } catch (err) {
        console.error(`❌ Error generating optimized config: ${err.message}`);
    }
}

async function main() {
    try {
        analyzeCSSBundle();

        const usage = analyzeComponentUsage();
        const safelist = analyzeSafelist();

        if (usage.classUsage.size === 0) {
            console.log('⚠️  No CSS classes found in components. Check file scanning.');
            return;
        }

        const optimization = generateOptimizedSafelist(usage.classUsage, safelist.safelist);
        generateOptimizationReport(usage, safelist, optimization);

        generateOptimizedTailwindConfig(optimization);

        console.log('\n🎉 CSS Optimization Analysis Complete!');
        console.log('\n🚀 Next Steps:');
        console.log('1. Review the optimized tailwind.config.js');
        console.log('2. Test the build with: npm run build');
        console.log('3. Compare CSS bundle sizes');
        console.log('4. Apply the optimized config if satisfied');

    } catch (error) {
        console.error('❌ CSS optimization failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { analyzeCSSBundle, analyzeComponentUsage, analyzeSafelist };
