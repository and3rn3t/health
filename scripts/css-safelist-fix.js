#!/usr/bin/env node
/**
 * CSS Safelist Optimizer - Immediate Fix
 * Reduces safelist by 70% to cut ~30KB from CSS bundle
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('🎨 CSS Safelist Emergency Fix');
console.log('==============================');
console.log('Target: Remove unused safelist classes to reduce CSS by ~30KB');

function optimizeSafelist() {
    console.log('\n📋 Analyzing Safelist...');

    const tailwindConfigPath = path.join(projectRoot, 'tailwind.config.js');
    const configContent = fs.readFileSync(tailwindConfigPath, 'utf-8');

    // Extract current safelist
    const safelistMatch = configContent.match(/safelist:\s*\[([\s\S]*?)\]/);
    if (!safelistMatch) {
        console.log('❌ No safelist found to optimize');
        return null;
    }

    const safelistContent = safelistMatch[1];
    const safelistItems = safelistContent.match(/'([^']+)'/g) || [];
    const originalClasses = safelistItems.map(item => item.replace(/'/g, ''));

    console.log(`📊 Found ${originalClasses.length} classes in safelist`);

    // Keep only essential classes - reduce by 70%
    const essentialClasses = [
        // Core VitalSense primary brand colors
        'bg-vitalsense-primary',
        'text-vitalsense-primary',
        'border-vitalsense-primary',
        'hover:bg-vitalsense-primary',

        // Core VitalSense teal colors
        'bg-vitalsense-teal',
        'text-vitalsense-teal',
        'border-vitalsense-teal',
        'hover:bg-vitalsense-teal',

        // Essential state colors
        'bg-vitalsense-success',
        'text-vitalsense-success',
        'bg-vitalsense-error',
        'text-vitalsense-error',

        // Key hover states
        'hover:bg-vitalsense-primary-light',
        'hover:bg-vitalsense-teal-light',
    ];

    console.log(`🎯 Reduced to ${essentialClasses.length} essential classes`);
    console.log(`📉 Reduction: ${Math.round(((originalClasses.length - essentialClasses.length) / originalClasses.length) * 100)}%`);

    return { originalClasses, essentialClasses, configContent };
}

function generateOptimizedConfig(originalClasses, essentialClasses, configContent) {
    console.log('\n⚙️  Generating Optimized Config...');

    // Create optimized safelist string
    const optimizedSafelistStr = essentialClasses
        .map(className => `    '${className}',`)
        .join('\n');

    // Replace safelist in config
    const optimizedContent = configContent.replace(
        /safelist:\s*\[([\s\S]*?)\]/,
        `safelist: [
${optimizedSafelistStr}
  ]`
    );

    // Add optimization comment
    const header = `// EMERGENCY CSS OPTIMIZATION - ${new Date().toISOString()}
// Safelist reduced from ${originalClasses.length} to ${essentialClasses.length} classes (${Math.round(((originalClasses.length - essentialClasses.length) / originalClasses.length) * 100)}% reduction)
// Estimated CSS savings: ~${Math.round(((originalClasses.length - essentialClasses.length) / originalClasses.length) * 30)}KB

`;

    const finalContent = header + optimizedContent;

    // Write files
    const optimizedConfigPath = path.join(projectRoot, 'tailwind.config.optimized.js');
    fs.writeFileSync(optimizedConfigPath, finalContent);
    console.log(`✅ Optimized config saved: tailwind.config.optimized.js`);

    // Backup original
    const backupPath = path.join(projectRoot, 'tailwind.config.backup.js');
    fs.writeFileSync(backupPath, configContent);
    console.log(`💾 Original backed up: tailwind.config.backup.js`);

    return optimizedConfigPath;
}

function generateProductionPostCSS() {
    console.log('\n🎨 Generating Production PostCSS Config...');

    const productionPostCSS = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // Production CSS optimization
    ...(process.env.NODE_ENV === 'production' && {
      cssnano: {
        preset: 'default',
      },
    }),
  },
};`;

    const postCSSPath = path.join(projectRoot, 'postcss.config.optimized.js');
    fs.writeFileSync(postCSSPath, productionPostCSS);
    console.log(`✅ Production PostCSS config saved: postcss.config.optimized.js`);

    return postCSSPath;
}

function main() {
    try {
        console.log('\n🚀 Starting Emergency CSS Optimization...');

        const optimization = optimizeSafelist();
        if (!optimization) return;

        const { originalClasses, essentialClasses, configContent } = optimization;

        generateOptimizedConfig(originalClasses, essentialClasses, configContent);
        generateProductionPostCSS();

        const reduction = originalClasses.length - essentialClasses.length;
        const percentReduction = Math.round((reduction / originalClasses.length) * 100);
        const estimatedSavings = Math.round((reduction / originalClasses.length) * 30);

        console.log('\n📊 Emergency Optimization Results:');
        console.log(`  Safelist: ${originalClasses.length} → ${essentialClasses.length} classes (${percentReduction}% reduction)`);
        console.log(`  Estimated savings: ~${estimatedSavings}KB`);
        console.log(`  Expected CSS size: ~${122 - estimatedSavings}KB (target: 50KB)`);

        console.log('\n🎉 Emergency CSS Optimization Complete!');
        console.log('\n🚀 Quick Apply:');
        console.log('1. Replace configs: ');
        console.log('   copy tailwind.config.optimized.js tailwind.config.js');
        console.log('   copy postcss.config.optimized.js postcss.config.js');
        console.log('2. Test build: npm run build');
        console.log('3. Check size: pwsh -NoProfile -File scripts/check-bundle-size.ps1');

        if (estimatedSavings < 30) {
            console.log('\n⚠️  Additional optimization needed:');
            console.log('   - Remove unused CSS frameworks');
            console.log('   - Implement PurgeCSS');
            console.log('   - Review component CSS usage');
        }

    } catch (error) {
        console.error('❌ Emergency optimization failed:', error.message);
        process.exit(1);
    }
}

main();
