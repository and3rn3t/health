#!/usr/bin/env node
// Legacy shim: executes relocated analyzer (scripts/node/analysis/bundle-analyzer.js)
import('./node/analysis/bundle-analyzer.js')
  .then(module => {
    // If user ran: node scripts/bundle-analyzer.js
    // The real script has its own main guard; we just exit after successful import.
    if (!module) {
      console.error('Loaded module is undefined.');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Failed to execute relocated bundle analyzer:', err);
    process.exit(1);
  });
#!/usr/bin/env node

/**
 * VitalSense Bundle Size and Performance Analyzer
 *
 * Measures:
 * - Production bundle sizes (app, worker, CSS)
 * - Build performance metrics
 * - Bundle composition analysis
 * - Performance recommendations
 */

import { build } from 'esbuild';
import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

class BundleAnalyzer {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      buildTime: null,
      bundles: {},
      performance: {},
      recommendations: []
    };
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  async getBundleSize(filePath) {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch (error) {
      return 0;
    }
  }

  async analyzeBundleComposition(bundlePath) {
    // Create a metafile build to analyze bundle composition
    try {
      const metaResult = await build({
        entryPoints: [resolve(projectRoot, 'src/main.tsx')],
        bundle: true,
        minify: true,
        format: 'esm',
        target: ['es2020'],
        write: false,
        metafile: true,
        define: {
          'process.env.NODE_ENV': '"production"',
          'import.meta.env.DEV': 'false',
          'import.meta.env.PROD': 'true',
        },
        loader: {
          '.tsx': 'tsx',
          '.ts': 'ts',
          '.css': 'css',
        }
      });

      return this.parseMetafile(metaResult.metafile);
    } catch (error) {
      console.warn('⚠️ Bundle composition analysis failed:', error.message);
      return null;
    }
  }

  parseMetafile(metafile) {
    const inputs = metafile.inputs;
    const outputs = metafile.outputs;

    #!/usr/bin/env node
    // Legacy shim for backward compatibility.
    // Actual implementation moved to scripts/node/analysis/bundle-analyzer.js
    // Update external references to the new path when convenient.
    import('./node/analysis/bundle-analyzer.js')
      .catch(err => {
        console.error('Failed to load relocated bundle analyzer:', err);
        process.exit(1);
    }
      );
    // Build production bundles
    try {
      console.log('🏗️ Building production bundles...');
      execSync('npm run build', {
        cwd: projectRoot,
        stdio: 'pipe'
      });
    } catch (error) {
      console.error('❌ Build failed:', error.message);
      throw error;
    }

    const buildTime = Date.now() - buildStartTime;
    this.results.buildTime = {
      ms: buildTime,
      formatted: `${(buildTime / 1000).toFixed(2)}s`
    };

    console.log(`✅ Build completed in ${this.results.buildTime.formatted}`);

    // Analyze bundle sizes
    const bundleFiles = [
      { key: 'app', path: 'dist/main.js', name: 'React App Bundle' },
      { key: 'css', path: 'dist/main.css', name: 'CSS Bundle' },
      { key: 'worker', path: 'dist-worker/index.js', name: 'Cloudflare Worker' },
      { key: 'html', path: 'dist/index.html', name: 'HTML Template' }
    ];

    let totalSize = 0;
    for (const bundle of bundleFiles) {
      const size = await this.getBundleSize(resolve(projectRoot, bundle.path));
      totalSize += size;

      this.results.bundles[bundle.key] = {
        name: bundle.name,
        path: bundle.path,
        bytes: size,
        formatted: this.formatBytes(size)
      };
    }

    this.results.bundles.total = {
      name: 'Total Bundle Size',
      bytes: totalSize,
      formatted: this.formatBytes(totalSize)
    };

    // Analyze bundle composition
    console.log('🧩 Analyzing bundle composition...');
    const composition = await this.analyzeBundleComposition();
    if (composition) {
      this.results.composition = composition;
    }

    // Performance analysis
    await this.analyzePerformance();

    // Generate recommendations
    this.generateRecommendations();

    return this.results;
  }

  async analyzePerformance() {
    const { bundles } = this.results;

    // Performance thresholds (based on industry standards)
    const thresholds = {
      app: 250 * 1024,      // 250KB for main app bundle
      css: 50 * 1024,       // 50KB for CSS
      worker: 100 * 1024,   // 100KB for worker
      total: 400 * 1024     // 400KB total
    };

    this.results.performance = {
      scores: {
        app: bundles.app.bytes <= thresholds.app ? 'excellent' :
             bundles.app.bytes <= thresholds.app * 1.5 ? 'good' :
             bundles.app.bytes <= thresholds.app * 2 ? 'fair' : 'poor',
        css: bundles.css.bytes <= thresholds.css ? 'excellent' :
             bundles.css.bytes <= thresholds.css * 1.5 ? 'good' : 'fair',
        worker: bundles.worker.bytes <= thresholds.worker ? 'excellent' :
                bundles.worker.bytes <= thresholds.worker * 1.5 ? 'good' : 'fair',
        total: bundles.total.bytes <= thresholds.total ? 'excellent' :
               bundles.total.bytes <= thresholds.total * 1.5 ? 'good' :
               bundles.total.bytes <= thresholds.total * 2 ? 'fair' : 'poor'
      },
      thresholds: Object.fromEntries(
        Object.entries(thresholds).map(([key, bytes]) => [key, {
          bytes,
          formatted: this.formatBytes(bytes)
        }])
      ),
      gzipEstimate: {
        app: this.formatBytes(bundles.app.bytes * 0.3), // ~30% compression
        total: this.formatBytes(bundles.total.bytes * 0.3)
      }
    };
  }

  generateRecommendations() {
    const { bundles, performance, composition } = this.results;
    const recommendations = [];

    // Size-based recommendations
    if (performance.scores.total === 'poor') {
      recommendations.push({
        type: 'critical',
        category: 'bundle-size',
        message: `Total bundle size (${bundles.total.formatted}) exceeds recommended limit. Consider code splitting.`,
        action: 'Implement lazy loading for large components and route-based code splitting'
      });
    }

    if (performance.scores.app === 'poor') {
      recommendations.push({
        type: 'warning',
        category: 'app-bundle',
        message: `App bundle (${bundles.app.formatted}) is large. Consider optimization.`,
        action: 'Review dependencies and implement dynamic imports for conditional features'
      });
    }

    // Composition-based recommendations
    if (composition?.largestDependencies) {
      const largestDep = composition.largestDependencies[0];
      if (largestDep && largestDep.bytes > 50 * 1024) { // >50KB
        recommendations.push({
          type: 'info',
          category: 'dependencies',
          message: `Largest dependency: ${largestDep.name} (${largestDep.size})`,
          action: `Review if ${largestDep.name} can be optimized or replaced with lighter alternatives`
        });
      }
    }

    // Performance optimizations
    if (performance.scores.total === 'excellent') {
      recommendations.push({
        type: 'success',
        category: 'performance',
        message: 'Bundle size is optimal! Great job with performance optimization.',
        action: 'Monitor bundle size in CI/CD to prevent regressions'
      });
    }

    // Build time recommendations
    if (this.results.buildTime.ms > 30000) { // >30 seconds
      recommendations.push({
        type: 'info',
        category: 'build-performance',
        message: `Build time (${this.results.buildTime.formatted}) could be improved`,
        action: 'Consider enabling esbuild cache or optimizing build configuration'
      });
    }

    this.results.recommendations = recommendations;
  }

  printReport() {
    const { bundles, performance, buildTime, composition, recommendations } = this.results;

    console.log('\n' + '='.repeat(60));
    console.log('📊 VitalSense Bundle Analysis Report');
    console.log('='.repeat(60));

    console.log('\n🏗️ Build Performance:');
    console.log(`   Build Time: ${buildTime.formatted}`);

    console.log('\n📦 Bundle Sizes:');
    Object.entries(bundles).forEach(([key, bundle]) => {
      const score = performance.scores[key];
      const icon = score === 'excellent' ? '🟢' :
                   score === 'good' ? '🟡' :
                   score === 'fair' ? '🟠' : '🔴';
      console.log(`   ${icon} ${bundle.name}: ${bundle.formatted}`);
    });

    console.log('\n📈 Performance Scores:');
    Object.entries(performance.scores).forEach(([key, score]) => {
      const icon = score === 'excellent' ? '🟢' :
                   score === 'good' ? '🟡' :
                   score === 'fair' ? '🟠' : '🔴';
      console.log(`   ${icon} ${key.charAt(0).toUpperCase() + key.slice(1)}: ${score}`);
    });

    console.log('\n📉 Estimated Gzipped Sizes:');
    console.log(`   App: ${performance.gzipEstimate.app}`);
    console.log(`   Total: ${performance.gzipEstimate.total}`);

    if (composition) {
      console.log('\n🧩 Bundle Composition:');
      Object.entries(composition.inputAnalysis).forEach(([key, data]) => {
        if (key !== 'total' && data.bytes > 0) {
          console.log(`   ${key}: ${data.formatted} (${data.percentage})`);
        }
      });

      if (composition.largestDependencies.length > 0) {
        console.log('\n📚 Largest Dependencies:');
        composition.largestDependencies.slice(0, 5).forEach((dep, i) => {
          console.log(`   ${i + 1}. ${dep.name}: ${dep.size}`);
        });
      }
    }

    console.log('\n💡 Recommendations:');
    if (recommendations.length === 0) {
      console.log('   ✅ No recommendations - bundle is well optimized!');
    } else {
      recommendations.forEach((rec, i) => {
        const icon = rec.type === 'critical' ? '🔴' :
                     rec.type === 'warning' ? '🟡' :
                     rec.type === 'success' ? '🟢' : '🔵';
        console.log(`   ${i + 1}. ${icon} ${rec.message}`);
        console.log(`      Action: ${rec.action}`);
      });
    }

    console.log('\n' + '='.repeat(60));
  }

  async saveReport(outputPath) {
    const reportData = {
      ...this.results,
      generatedBy: 'VitalSense Bundle Analyzer v1.0.0',
      projectInfo: {
        name: 'VitalSense Health App',
        version: '1.0.0',
        bundler: 'esbuild',
        target: 'production'
      }
    };

    await fs.writeFile(outputPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${outputPath}`);
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const flags = {
    save: args.includes('--save'),
    outputPath: args.find(arg => arg.startsWith('--output='))?.split('=')[1] ||
               resolve(projectRoot, 'bundle-analysis-report.json'),
    verbose: args.includes('--verbose') || args.includes('-v'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (flags.help) {
    console.log(`
VitalSense Bundle Size and Performance Analyzer

Usage: node scripts/bundle-analyzer.js [options]

Options:
  --save              Save detailed JSON report to file
  --output=<path>     Specify output file path (default: bundle-analysis-report.json)
  --verbose, -v       Show verbose output
  --help, -h          Show this help message

Examples:
  node scripts/bundle-analyzer.js
  node scripts/bundle-analyzer.js --save --verbose
  node scripts/bundle-analyzer.js --save --output=./reports/bundle-$(date +%Y%m%d).json
    `);
    return;
  }

  try {
    const analyzer = new BundleAnalyzer();
    const results = await analyzer.buildAndAnalyze();

    analyzer.printReport();

    if (flags.save) {
      await analyzer.saveReport(flags.outputPath);
    }

    // Exit with non-zero code if critical issues found
    const criticalIssues = results.recommendations.filter(r => r.type === 'critical');
    if (criticalIssues.length > 0) {
      console.log(`\n❌ Found ${criticalIssues.length} critical performance issue(s)`);
      process.exit(1);
    }

    console.log('\n✅ Bundle analysis completed successfully');
  } catch (error) {
    console.error('\n❌ Bundle analysis failed:', error.message);
    if (flags.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default BundleAnalyzer;
