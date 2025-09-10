#!/usr/bin/env node

/**
 * VitalSense Performance Monitor
 *
 * Continuous performance monitoring for bundle size, build times,
 * and performance metrics with historical tracking and alerts.
 */

import { promises as fs } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import BundleAnalyzer from './bundle-analyzer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

class PerformanceMonitor {
  constructor(options = {}) {
    this.options = {
      historyFile: resolve(projectRoot, 'performance-history.json'),
      alertThresholds: {
        bundleSizeIncrease: 0.10, // 10% increase
        buildTimeIncrease: 0.25,  // 25% increase
        totalSizeLimit: 500 * 1024 // 500KB total limit
      },
      ...options
    };

    this.history = [];
  }

  async loadHistory() {
    try {
      const data = await fs.readFile(this.options.historyFile, 'utf-8');
      this.history = JSON.parse(data);
    } catch (error) {
      // File doesn't exist yet, start with empty history
      this.history = [];
    }
  }

  async saveHistory() {
    // Keep only last 50 entries to prevent file from growing too large
    const recentHistory = this.history.slice(-50);
    await fs.writeFile(
      this.options.historyFile,
      JSON.stringify(recentHistory, null, 2)
    );
  }

  async runAnalysis() {
    console.log('📊 Running VitalSense performance analysis...');

    const analyzer = new BundleAnalyzer();
    const results = await analyzer.buildAndAnalyze();

    // Add to history
    const entry = {
      timestamp: results.timestamp,
      buildTime: results.buildTime,
      bundles: results.bundles,
      performance: results.performance,
      recommendations: results.recommendations,
      commit: await this.getCurrentCommit(),
      branch: await this.getCurrentBranch()
    };

    this.history.push(entry);

    return { results, entry };
  }

  async getCurrentCommit() {
    try {
      const { execSync } = await import('child_process');
      return execSync('git rev-parse --short HEAD', {
        cwd: projectRoot,
        encoding: 'utf-8'
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  async getCurrentBranch() {
    try {
      const { execSync } = await import('child_process');
      return execSync('git branch --show-current', {
        cwd: projectRoot,
        encoding: 'utf-8'
      }).trim();
    } catch {
      return 'unknown';
    }
  }

  analyzePerformanceTrends() {
    if (this.history.length < 2) {
      return { trends: {}, alerts: [] };
    }

    const current = this.history[this.history.length - 1];
    const previous = this.history[this.history.length - 2];
    const alerts = [];
    const trends = {};

    // Bundle size trends
    Object.keys(current.bundles).forEach(bundleKey => {
      if (bundleKey === 'total' || !previous.bundles[bundleKey]) return;

      const currentSize = current.bundles[bundleKey].bytes;
      const previousSize = previous.bundles[bundleKey].bytes;
      const change = ((currentSize - previousSize) / previousSize) * 100;

      trends[bundleKey] = {
        current: currentSize,
        previous: previousSize,
        change: change,
        changeFormatted: `${change > 0 ? '+' : ''}${change.toFixed(1)}%`,
        status: Math.abs(change) > 10 ? 'significant' :
                Math.abs(change) > 5 ? 'moderate' : 'stable'
      };

      // Check for alerts
      if (change > this.options.alertThresholds.bundleSizeIncrease * 100) {
        alerts.push({
          type: 'warning',
          category: 'bundle-size',
          bundle: bundleKey,
          message: `${bundleKey} bundle increased by ${change.toFixed(1)}%`,
          current: this.formatBytes(currentSize),
          previous: this.formatBytes(previousSize)
        });
      }
    });

    // Build time trends
    const buildTimeChange = ((current.buildTime.ms - previous.buildTime.ms) / previous.buildTime.ms) * 100;
    trends.buildTime = {
      current: current.buildTime.ms,
      previous: previous.buildTime.ms,
      change: buildTimeChange,
      changeFormatted: `${buildTimeChange > 0 ? '+' : ''}${buildTimeChange.toFixed(1)}%`,
      status: Math.abs(buildTimeChange) > 25 ? 'significant' :
              Math.abs(buildTimeChange) > 10 ? 'moderate' : 'stable'
    };

    if (buildTimeChange > this.options.alertThresholds.buildTimeIncrease * 100) {
      alerts.push({
        type: 'info',
        category: 'build-time',
        message: `Build time increased by ${buildTimeChange.toFixed(1)}%`,
        current: current.buildTime.formatted,
        previous: previous.buildTime.formatted
      });
    }

    // Total size limit check
    if (current.bundles.total.bytes > this.options.alertThresholds.totalSizeLimit) {
      alerts.push({
        type: 'critical',
        category: 'size-limit',
        message: `Total bundle size exceeds ${this.formatBytes(this.options.alertThresholds.totalSizeLimit)} limit`,
        current: current.bundles.total.formatted,
        limit: this.formatBytes(this.options.alertThresholds.totalSizeLimit)
      });
    }

    return { trends, alerts };
  }

  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }

  generatePerformanceReport() {
    if (this.history.length === 0) {
      return 'No performance data available';
    }

    const latest = this.history[this.history.length - 1];
    const { trends, alerts } = this.analyzePerformanceTrends();

    let report = '\n' + '='.repeat(60);
    report += '\n📊 VitalSense Performance Monitor Report';
    report += '\n' + '='.repeat(60);

    report += `\n\n🏷️  Commit: ${latest.commit} (${latest.branch})`;
    report += `\n⏰ Timestamp: ${new Date(latest.timestamp).toLocaleString()}`;

    report += '\n\n📦 Current Bundle Sizes:';
    Object.entries(latest.bundles).forEach(([key, bundle]) => {
      const trend = trends[key];
      const trendIcon = trend ?
        (trend.status === 'significant' ? (trend.change > 0 ? '📈' : '📉') :
         trend.status === 'moderate' ? '📊' : '▫️') : '▫️';
      const trendText = trend ? ` ${trend.changeFormatted}` : '';

      report += `\n   ${trendIcon} ${bundle.name}: ${bundle.formatted}${trendText}`;
    });

    if (this.history.length > 1) {
      report += '\n\n📈 Performance Trends:';
      Object.entries(trends).forEach(([key, trend]) => {
        if (key === 'buildTime') {
          report += `\n   🏗️ Build Time: ${latest.buildTime.formatted} (${trend.changeFormatted})`;
        }
      });
    }

    if (alerts.length > 0) {
      report += '\n\n🚨 Performance Alerts:';
      alerts.forEach((alert, i) => {
        const icon = alert.type === 'critical' ? '🔴' :
                     alert.type === 'warning' ? '🟡' : '🔵';
        report += `\n   ${i + 1}. ${icon} ${alert.message}`;
      });
    } else {
      report += '\n\n✅ No performance alerts - everything looks good!';
    }

    // Historical summary
    if (this.history.length >= 5) {
      const last5 = this.history.slice(-5);
      const avgBuildTime = last5.reduce((sum, entry) => sum + entry.buildTime.ms, 0) / last5.length;
      const avgTotalSize = last5.reduce((sum, entry) => sum + entry.bundles.total.bytes, 0) / last5.length;

      report += '\n\n📊 Recent Averages (last 5 builds):';
      report += `\n   Build Time: ${(avgBuildTime / 1000).toFixed(2)}s`;
      report += `\n   Total Size: ${this.formatBytes(avgTotalSize)}`;
    }

    report += '\n\n' + '='.repeat(60);
    return report;
  }

  async monitor() {
    try {
      await this.loadHistory();
      const { results } = await this.runAnalysis();
      await this.saveHistory();

      // Print analysis results
      const analyzer = new BundleAnalyzer();
      analyzer.results = results;
      analyzer.printReport();

      // Print performance monitoring report
      console.log(this.generatePerformanceReport());

      // Check for critical alerts
      const { alerts } = this.analyzePerformanceTrends();
      const criticalAlerts = alerts.filter(a => a.type === 'critical');

      if (criticalAlerts.length > 0) {
        console.log(`\n❌ Found ${criticalAlerts.length} critical performance issue(s)`);
        return false;
      }

      console.log('\n✅ Performance monitoring completed successfully');
      return true;

    } catch (error) {
      console.error('❌ Performance monitoring failed:', error.message);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const flags = {
    history: args.includes('--history'),
    continuous: args.includes('--continuous'),
    interval: parseInt(args.find(arg => arg.startsWith('--interval='))?.split('=')[1]) || 300000, // 5 minutes
    alerts: args.includes('--alerts-only'),
    help: args.includes('--help') || args.includes('-h')
  };

  if (flags.help) {
    console.log(`
VitalSense Performance Monitor

Usage: node scripts/performance-monitor.js [options]

Options:
  --history           Show performance history only (no new analysis)
  --continuous        Run continuously at specified interval
  --interval=<ms>     Interval for continuous monitoring (default: 300000ms = 5min)
  --alerts-only       Only show alerts and trends, skip full analysis
  --help, -h          Show this help message

Examples:
  node scripts/performance-monitor.js
  node scripts/performance-monitor.js --continuous --interval=600000
  node scripts/performance-monitor.js --history
  node scripts/performance-monitor.js --alerts-only
    `);
    return;
  }

  const monitor = new PerformanceMonitor();

  if (flags.history) {
    await monitor.loadHistory();
    console.log(monitor.generatePerformanceReport());
    return;
  }

  if (flags.alerts) {
    await monitor.loadHistory();
    const { alerts } = monitor.analyzePerformanceTrends();

    if (alerts.length === 0) {
      console.log('✅ No performance alerts');
    } else {
      console.log('🚨 Performance Alerts:');
      alerts.forEach((alert, i) => {
        const icon = alert.type === 'critical' ? '🔴' :
                     alert.type === 'warning' ? '🟡' : '🔵';
        console.log(`${i + 1}. ${icon} ${alert.message}`);
      });
    }
    return;
  }

  if (flags.continuous) {
    console.log(`🔄 Starting continuous performance monitoring (${flags.interval}ms intervals)`);
    console.log('Press Ctrl+C to stop\n');

    let iteration = 1;
    while (true) {
      console.log(`\n--- Monitoring Iteration ${iteration} ---`);
      try {
        const success = await monitor.monitor();
        if (!success) {
          console.log('⚠️ Critical issues detected, but continuing monitoring...');
        }
      } catch (error) {
        console.error(`❌ Error in iteration ${iteration}:`, error.message);
      }

      console.log(`\n⏰ Next check in ${flags.interval / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, flags.interval));
      iteration++;
    }
  } else {
    // Single run
    const success = await monitor.monitor();
    process.exit(success ? 0 : 1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Performance monitor failed:', error.message);
    process.exit(1);
  });
}

export default PerformanceMonitor;
