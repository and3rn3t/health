#!/usr/bin/env node
/**
 * Build Configuration Optimizer - VitalSense Bundle Optimization Phase 2B
 * Optimizes Vite build configuration for smaller bundles:
 * 1. Advanced minification settings
 * 2. Tree shaking optimization
 * 3. Chunk splitting strategies
 * 4. Asset optimization
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.dirname(__dirname);

console.log('⚙️  VitalSense Build Configuration Optimizer');
console.log('===========================================');

function analyzeCurrentConfig() {
    console.log('\n📊 Analyzing Current Build Configuration...');

    const viteConfigPath = path.join(projectRoot, 'vite.config.ts');
    const workerConfigPath = path.join(projectRoot, 'vite.worker.config.ts');
    const packageJsonPath = path.join(projectRoot, 'package.json');

    const configs = {
        main: null,
        worker: null,
        package: null
    };

    try {
        if (fs.existsSync(viteConfigPath)) {
            configs.main = fs.readFileSync(viteConfigPath, 'utf-8');
            console.log('✅ Main Vite config found');
        }

        if (fs.existsSync(workerConfigPath)) {
            configs.worker = fs.readFileSync(workerConfigPath, 'utf-8');
            console.log('✅ Worker Vite config found');
        }

        if (fs.existsSync(packageJsonPath)) {
            configs.package = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
            console.log('✅ Package.json found');
        }
    } catch (err) {
        console.error(`❌ Error reading configs: ${err.message}`);
    }

    return configs;
}

function generateOptimizedMainConfig() {
    console.log('\n🎯 Generating Optimized Main Vite Config...');

    const optimizedConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for better optimization
    target: 'es2020',

    // Advanced minification
    minify: 'esbuild',

    // Optimize CSS
    cssMinify: true,

    // Chunk size warnings
    chunkSizeWarningLimit: 500,

    rollupOptions: {
      // Advanced tree shaking
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false,
        unknownGlobalSideEffects: false,
      },

      // Optimize chunks
      output: {
        manualChunks(id) {
          // Vendor chunk for large libraries
          if (id.includes('node_modules')) {
            // Create separate chunks for large libraries
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('framer-motion')) {
              return 'animation-vendor';
            }
            if (id.includes('@radix-ui')) {
              return 'ui-vendor';
            }
            if (id.includes('recharts') || id.includes('d3')) {
              return 'charts-vendor';
            }
            if (id.includes('three') || id.includes('@react-three')) {
              return 'graphics-vendor';
            }
            // Other smaller vendor libraries
            return 'vendor';
          }

          // Component chunks
          if (id.includes('/components/')) {
            if (id.includes('/components/ui/')) {
              return 'ui-components';
            }
            if (id.includes('/components/health/')) {
              return 'health-components';
            }
            if (id.includes('/components/gamification/')) {
              return 'gamification-components';
            }
          }

          // Feature chunks
          if (id.includes('/features/') || id.includes('/pages/')) {
            return 'features';
          }

          // Utils and hooks
          if (id.includes('/hooks/') || id.includes('/lib/')) {
            return 'utils';
          }
        },

        // Optimize asset file names
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name.split('.');
          const ext = info[info.length - 1];

          if (/\\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i.test(assetInfo.name)) {
            return \`assets/images/[name]-[hash].[ext]\`;
          }
          if (/\\.(woff2?|eot|ttf|otf)$/i.test(assetInfo.name)) {
            return \`assets/fonts/[name]-[hash].[ext]\`;
          }

          return \`assets/[name]-[hash].\${ext}\`;
        },

        // Optimize chunk file names
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },

    // Enable source maps for debugging but optimize size
    sourcemap: false, // Disable in production for smaller builds

    // Asset optimization
    assetsInlineLimit: 4096, // 4KB limit for inlining

    // Enable advanced optimizations
    reportCompressedSize: true,

    // ESBuild optimizations
    esbuild: {
      // Remove console.log in production
      drop: ['console', 'debugger'],
      // Optimize for size
      minifyWhitespace: true,
      minifyIdentifiers: true,
      minifySyntax: true,
      // Legal comments handling
      legalComments: 'none',
    },
  },

  // CSS optimizations
  css: {
    // PostCSS optimizations will be handled by postcss.config.js
    devSourcemap: false,
  },

  // Development optimizations
  server: {
    // Optimize dev server
    hmr: {
      overlay: false, // Reduce overlay for better performance
    },
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react/jsx-runtime',
    ],
    exclude: [
      // Large libraries that should be chunked
      'framer-motion',
      'three',
      'recharts',
    ],
  },
});`;

    return optimizedConfig;
}

function generateOptimizedPostCSS() {
    console.log('\n🎨 Generating Optimized PostCSS Config...');

    const optimizedPostCSS = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
    // CSS optimization plugins
    cssnano: {
      preset: ['default', {
        // Aggressive CSS minification
        discardComments: { removeAll: true },
        normalizeWhitespace: true,
        colormin: true,
        normalizeUrl: true,
        normalizeUnicode: true,
        minifySelectors: true,
        minifyParams: true,
        mergeRules: true,
        mergeLonghand: true,
        discardOverridden: true,
        discardEmpty: true,
        discardDuplicates: true,
        // Reduce calc() expressions
        calc: true,
        // Convert values to shorter representations
        convertValues: true,
        // Remove unused font-weight values
        fontWeight: true,
        // Merge media queries
        mergeMedia: true,
      }],
    },
  },
};`;

    return optimizedPostCSS;
}

function generateBuildScript() {
    console.log('\n🔨 Generating Optimized Build Script...');

    const buildScript = `#!/usr/bin/env node
/**
 * Optimized Build Script for VitalSense
 * Includes bundle analysis and optimization verification
 */

import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

console.log('🚀 VitalSense Optimized Build Process');
console.log('====================================');

async function prebuildAnalysis() {
    console.log('\\n📊 Pre-build Analysis...');

    try {
        // Run CSS optimizer
        await execAsync('node scripts/css-optimizer.js');
        console.log('✅ CSS optimization analysis complete');

        // Check bundle analyzer
        await execAsync('node scripts/bundle-analyzer.js');
        console.log('✅ Bundle analysis complete');

    } catch (err) {
        console.warn('⚠️  Pre-build analysis failed:', err.message);
    }
}

async function optimizedBuild() {
    console.log('\\n🔨 Running Optimized Build...');

    const startTime = Date.now();

    try {
        // Clear previous build
        if (fs.existsSync('dist')) {
            fs.rmSync('dist', { recursive: true, force: true });
        }
        if (fs.existsSync('dist-worker')) {
            fs.rmSync('dist-worker', { recursive: true, force: true });
        }

        // Build main app with optimizations
        console.log('📦 Building main application...');
        await execAsync('vite build --mode production');

        // Build worker
        console.log('⚙️  Building worker...');
        await execAsync('vite build --config vite.worker.config.ts');

        const buildTime = Date.now() - startTime;
        console.log(\`✅ Build completed in \${Math.round(buildTime / 1000)}s\`);

    } catch (err) {
        console.error('❌ Build failed:', err.message);
        throw err;
    }
}

async function postbuildAnalysis() {
    console.log('\\n📈 Post-build Analysis...');

    try {
        // Analyze final bundle sizes
        await execAsync('node scripts/bundle-analyzer.js --post-build');
        console.log('✅ Post-build analysis complete');

        // Generate performance report
        const distPath = path.join(process.cwd(), 'dist');
        if (fs.existsSync(distPath)) {
            const stats = await getBundleStats(distPath);
            console.log('\\n📊 Final Bundle Stats:');
            console.log(\`  Total Size: \${Math.round(stats.totalSize / 1024)}KB\`);
            console.log(\`  Gzipped Est: ~\${Math.round(stats.totalSize * 0.3 / 1024)}KB\`);
            console.log(\`  Files: \${stats.fileCount}\`);
        }

    } catch (err) {
        console.warn('⚠️  Post-build analysis failed:', err.message);
    }
}

async function getBundleStats(distPath) {
    let totalSize = 0;
    let fileCount = 0;

    function scanDir(dir) {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                scanDir(fullPath);
            } else {
                const stats = fs.statSync(fullPath);
                totalSize += stats.size;
                fileCount++;
            }
        }
    }

    scanDir(distPath);

    return { totalSize, fileCount };
}

async function main() {
    try {
        await prebuildAnalysis();
        await optimizedBuild();
        await postbuildAnalysis();

        console.log('\\n🎉 Optimized Build Process Complete!');
        console.log('\\n📋 Bundle Size Targets:');
        console.log('  React App: <400KB (target)');
        console.log('  CSS Bundle: <50KB (target)');
        console.log('  Worker: <150KB (target)');

    } catch (error) {
        console.error('❌ Build process failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
    main();
}`;

    return buildScript;
}

function writeOptimizedConfigs(configs) {
    console.log('\n💾 Writing Optimized Configurations...');

    try {
        // Write optimized main Vite config
        const viteConfigPath = path.join(projectRoot, 'vite.config.optimized.ts');
        fs.writeFileSync(viteConfigPath, configs.vite);
        console.log('✅ Optimized Vite config written');

        // Write optimized PostCSS config
        const postCSSConfigPath = path.join(projectRoot, 'postcss.config.optimized.js');
        fs.writeFileSync(postCSSConfigPath, configs.postCSS);
        console.log('✅ Optimized PostCSS config written');

        // Write optimized build script
        const buildScriptPath = path.join(projectRoot, 'scripts/optimized-build.js');
        fs.writeFileSync(buildScriptPath, configs.buildScript);
        fs.chmodSync(buildScriptPath, '755'); // Make executable
        console.log('✅ Optimized build script written');

        // Create backup of original configs
        const originalViteConfig = path.join(projectRoot, 'vite.config.ts');
        if (fs.existsSync(originalViteConfig)) {
            const backupPath = path.join(projectRoot, 'vite.config.backup.ts');
            fs.copyFileSync(originalViteConfig, backupPath);
            console.log('💾 Original Vite config backed up');
        }

        const originalPostCSS = path.join(projectRoot, 'postcss.config.js');
        if (fs.existsSync(originalPostCSS)) {
            const backupPath = path.join(projectRoot, 'postcss.config.backup.js');
            fs.copyFileSync(originalPostCSS, backupPath);
            console.log('💾 Original PostCSS config backed up');
        }

    } catch (err) {
        console.error('❌ Error writing optimized configs:', err.message);
        throw err;
    }
}

function updatePackageScripts() {
    console.log('\n📦 Updating Package.json Scripts...');

    const packageJsonPath = path.join(projectRoot, 'package.json');

    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

        // Add optimized build scripts
        packageJson.scripts = {
            ...packageJson.scripts,
            'build:optimized': 'node scripts/optimized-build.js',
            'build:analyze': 'node scripts/bundle-analyzer.js',
            'css:optimize': 'node scripts/css-optimizer.js',
            'build:fast': 'vite build --config vite.config.optimized.ts',
        };

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('✅ Package.json updated with optimized scripts');

    } catch (err) {
        console.error('❌ Error updating package.json:', err.message);
    }
}

async function main() {
    try {
        analyzeCurrentConfig();

        const optimizedConfigs = {
            vite: generateOptimizedMainConfig(),
            postCSS: generateOptimizedPostCSS(),
            buildScript: generateBuildScript()
        };

        writeOptimizedConfigs(optimizedConfigs);
        updatePackageScripts();

        console.log('\\n🎉 Build Configuration Optimization Complete!');
        console.log('\\n🚀 Next Steps:');
        console.log('1. Test optimized build: npm run build:optimized');
        console.log('2. Compare bundle sizes with: npm run build:analyze');
        console.log('3. Apply configs if satisfied (replace originals)');
        console.log('4. Integrate CSS optimizer: npm run css:optimize');

    } catch (error) {
        console.error('❌ Build configuration optimization failed:', error);
        process.exit(1);
    }
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}

export { generateOptimizedMainConfig, generateOptimizedPostCSS };
