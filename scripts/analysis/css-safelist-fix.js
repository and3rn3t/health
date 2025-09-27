#!/usr/bin/env node
// Legacy shim: relocated to scripts/node/analysis/css/css-safelist-fix.js
console.warn('[DEPRECATED] Use: node scripts/node/analysis/css/css-safelist-fix.js');
export * from './node/analysis/css/css-safelist-fix.js';
import './node/analysis/css/css-safelist-fix.js';
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

// (Intentional no-op; functionality relocated)
