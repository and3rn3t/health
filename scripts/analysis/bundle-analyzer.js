#!/usr/bin/env node
// Moved from scripts/bundle-analyzer.js to scripts/node/analysis/bundle-analyzer.js
// Path shim: update any new references to use this location; legacy wrapper left at original path.
import { build } from 'esbuild';
import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../../..');

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
    try { const stats = await fs.stat(filePath); return stats.size; } catch { return 0; }
  }

  async analyzeBundleComposition() {
    try {
      const metaResult = await build({
        entryPoints: [resolve(projectRoot, 'src/main.tsx')],
        bundle: true,
        minify: true,
        format: 'esm',
        target: ['es2020'],
        write: false,
        metafile: true,
        define: { 'process.env.NODE_ENV': '"production"', 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true' },
        loader: { '.tsx': 'tsx', '.ts': 'ts', '.css': 'css' }
      });
      return this.parseMetafile(metaResult.metafile);
    } catch (error) {
      console.warn('⚠️ Bundle composition analysis failed:', error.message);
      return null;
    }
  }

  parseMetafile(metafile) {
    const inputs = metafile.inputs;
    const inputAnalysis = { typescript: 0, javascript: 0, css: 0, nodeModules: 0, total: 0 };
    Object.entries(inputs).forEach(([path, info]) => {
      const size = info.bytes; inputAnalysis.total += size;
      if (path.includes('node_modules')) inputAnalysis.nodeModules += size; else if (path.endsWith('.ts') || path.endsWith('.tsx')) inputAnalysis.typescript += size; else if (path.endsWith('.js') || path.endsWith('.jsx')) inputAnalysis.javascript += size; else if (path.endsWith('.css')) inputAnalysis.css += size;
    });
    const largestDeps = Object.entries(inputs)
      .filter(([p]) => p.includes('node_modules'))
      .map(([p, info]) => ({ name: p.split('node_modules/')[1]?.split('/')[0] || p, size: info.bytes }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 10);
    return {
      inputAnalysis: Object.fromEntries(Object.entries(inputAnalysis).map(([k, bytes]) => [k, { bytes, formatted: this.formatBytes(bytes), percentage: ((bytes / inputAnalysis.total) * 100).toFixed(1) + '%' }])),
      largestDependencies: largestDeps.map(d => ({ name: d.name, size: this.formatBytes(d.size), bytes: d.size }))
    };
  }

  async buildAndAnalyze() {
    console.log('🔍 Starting VitalSense Bundle Analysis...');
    const buildStartTime = Date.now();
    try { await fs.rm(resolve(projectRoot, 'dist'), { recursive: true, force: true }); await fs.mkdir(resolve(projectRoot, 'dist'), { recursive: true }); } catch {}
    try {
      console.log('🏗️ Building production bundles...');
      execSync('npm run build', { cwd: projectRoot, stdio: 'pipe' });
    } catch (error) { console.error('❌ Build failed:', error.message); throw error; }
    const buildTime = Date.now() - buildStartTime;
    this.results.buildTime = { ms: buildTime, formatted: `${(buildTime / 1000).toFixed(2)}s` };
    console.log(`✅ Build completed in ${this.results.buildTime.formatted}`);
    const bundleFiles = [
      { key: 'app', path: 'dist/main.js', name: 'React App Bundle' },
      { key: 'css', path: 'dist/main.css', name: 'CSS Bundle' },
      { key: 'worker', path: 'dist-worker/index.js', name: 'Cloudflare Worker' },
      { key: 'html', path: 'dist/index.html', name: 'HTML Template' }
    ];
    let totalSize = 0;
    for (const b of bundleFiles) {
      const size = await this.getBundleSize(resolve(projectRoot, b.path));
      totalSize += size;
      this.results.bundles[b.key] = { name: b.name, path: b.path, bytes: size, formatted: this.formatBytes(size) };
    }
    this.results.bundles.total = { name: 'Total Bundle Size', bytes: totalSize, formatted: this.formatBytes(totalSize) };
    console.log('🧩 Analyzing bundle composition...');
    const composition = await this.analyzeBundleComposition(); if (composition) this.results.composition = composition;
    await this.analyzePerformance();
    this.generateRecommendations();
    return this.results;
  }

  async analyzePerformance() {
    const { bundles } = this.results;
    const thresholds = { app: 250 * 1024, css: 50 * 1024, worker: 100 * 1024, total: 400 * 1024 };
    this.results.performance = {
      scores: {
        app: bundles.app.bytes <= thresholds.app ? 'excellent' : bundles.app.bytes <= thresholds.app * 1.5 ? 'good' : bundles.app.bytes <= thresholds.app * 2 ? 'fair' : 'poor',
        css: bundles.css.bytes <= thresholds.css ? 'excellent' : bundles.css.bytes <= thresholds.css * 1.5 ? 'good' : 'fair',
        worker: bundles.worker.bytes <= thresholds.worker ? 'excellent' : bundles.worker.bytes <= thresholds.worker * 1.5 ? 'good' : 'fair',
        total: bundles.total.bytes <= thresholds.total ? 'excellent' : bundles.total.bytes <= thresholds.total * 1.5 ? 'good' : bundles.total.bytes <= thresholds.total * 2 ? 'fair' : 'poor'
      },
      thresholds: Object.fromEntries(Object.entries(thresholds).map(([k, bytes]) => [k, { bytes, formatted: this.formatBytes(bytes) }])),
      gzipEstimate: { app: this.formatBytes(bundles.app.bytes * 0.3), total: this.formatBytes(bundles.total.bytes * 0.3) }
    };
  }

  generateRecommendations() {
    const { bundles, performance, composition } = this.results;
    const rec = [];
    if (performance.scores.total === 'poor') rec.push({ type: 'critical', category: 'bundle-size', message: `Total bundle size (${bundles.total.formatted}) exceeds recommended limit. Consider code splitting.`, action: 'Implement lazy loading for large components and route-based code splitting' });
    if (performance.scores.app === 'poor') rec.push({ type: 'warning', category: 'app-bundle', message: `App bundle (${bundles.app.formatted}) is large. Consider optimization.`, action: 'Review dependencies and implement dynamic imports for conditional features' });
    if (composition?.largestDependencies?.length) { const largest = composition.largestDependencies[0]; if (largest && largest.bytes > 50 * 1024) rec.push({ type: 'info', category: 'dependencies', message: `Largest dependency: ${largest.name} (${largest.size})`, action: `Review if ${largest.name} can be optimized or replaced with lighter alternatives` }); }
    if (performance.scores.total === 'excellent') rec.push({ type: 'success', category: 'performance', message: 'Bundle size is optimal! Great job with performance optimization.', action: 'Monitor bundle size in CI/CD to prevent regressions' });
    if (this.results.buildTime.ms > 30000) rec.push({ type: 'info', category: 'build-performance', message: `Build time (${this.results.buildTime.formatted}) could be improved`, action: 'Consider enabling esbuild cache or optimizing build configuration' });
    this.results.recommendations = rec;
  }

  printReport() {
    const { bundles, performance, buildTime, composition, recommendations } = this.results;
    console.log('\n' + '='.repeat(60));
    console.log('📊 VitalSense Bundle Analysis Report');
    console.log('='.repeat(60));
    console.log(`\n🏗️ Build Performance:\n   Build Time: ${buildTime.formatted}`);
    console.log('\n📦 Bundle Sizes:');
    Object.entries(bundles).forEach(([k, b]) => { if (k === 'total') return; const score = performance.scores[k]; const icon = score === 'excellent' ? '🟢' : score === 'good' ? '🟡' : score === 'fair' ? '🟠' : '🔴'; console.log(`   ${icon} ${b.name}: ${b.formatted}`); });
    console.log(`   Σ Total: ${bundles.total.formatted}`);
    console.log('\n📈 Performance Scores:');
    Object.entries(performance.scores).forEach(([k, s]) => { const icon = s === 'excellent' ? '🟢' : s === 'good' ? '🟡' : s === 'fair' ? '🟠' : '🔴'; console.log(`   ${icon} ${k}: ${s}`); });
    console.log('\n📉 Estimated Gzipped Sizes:');
    console.log(`   App: ${performance.gzipEstimate.app}`);
    console.log(`   Total: ${performance.gzipEstimate.total}`);
    if (composition) {
      console.log('\n🧩 Bundle Composition:');
      Object.entries(composition.inputAnalysis).forEach(([k, d]) => { if (k !== 'total' && d.bytes > 0) console.log(`   ${k}: ${d.formatted} (${d.percentage})`); });
      if (composition.largestDependencies.length) { console.log('\n📚 Largest Dependencies:'); composition.largestDependencies.slice(0,5).forEach((dep,i)=> console.log(`   ${i+1}. ${dep.name}: ${dep.size}`)); }
    }
    console.log('\n💡 Recommendations:');
    if (!recommendations.length) console.log('   ✅ No recommendations - bundle is well optimized!'); else recommendations.forEach((r,i)=> { const icon = r.type === 'critical' ? '🔴' : r.type === 'warning' ? '🟡' : r.type === 'success' ? '🟢' : '🔵'; console.log(`   ${i+1}. ${icon} ${r.message}`); console.log(`      Action: ${r.action}`); });
    console.log('\n' + '='.repeat(60));
  }

  async saveReport(outputPath) {
    const reportData = { ...this.results, generatedBy: 'VitalSense Bundle Analyzer v1.0.1 (relocated)', projectInfo: { name: 'VitalSense Health App', version: '1.0.0', bundler: 'esbuild', target: 'production' } };
    await fs.writeFile(outputPath, JSON.stringify(reportData, null, 2));
    console.log(`📄 Detailed report saved to: ${outputPath}`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const flags = { save: args.includes('--save'), outputPath: args.find(a=>a.startsWith('--output='))?.split('=')[1] || resolve(projectRoot, 'bundle-analysis-report.json'), verbose: args.includes('--verbose')||args.includes('-v'), help: args.includes('--help')||args.includes('-h') };
  if (flags.help) { console.log(`\nUsage: node scripts/node/analysis/bundle-analyzer.js [options]\n\nOptions:\n  --save              Save detailed JSON report to file\n  --output=<path>     Specify output file path (default: bundle-analysis-report.json)\n  --verbose, -v       Show verbose output\n  --help, -h          Show this help message\n`); return; }
  try { const analyzer = new BundleAnalyzer(); const results = await analyzer.buildAndAnalyze(); analyzer.printReport(); if (flags.save) await analyzer.saveReport(flags.outputPath); const critical = results.recommendations.filter(r=>r.type==='critical'); if (critical.length) { console.log(`\n❌ Found ${critical.length} critical performance issue(s)`); process.exit(1);} console.log('\n✅ Bundle analysis completed successfully'); } catch (error) { console.error('\n❌ Bundle analysis failed:', error.message); if (flags.verbose) console.error(error.stack); process.exit(1); }
}

if (import.meta.url === `file://${process.argv[1]}`) { main(); }

export default BundleAnalyzer;
