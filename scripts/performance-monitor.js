#!/usr/bin/env node
// Performance Monitor for VitalSense Bundle Sizes
// Tracks CSS and JS bundle sizes over time with alerts for size increases

import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

class PerformanceMonitor {
  constructor() {
    this.thresholds = {
      css: {
        warning: 50 * 1024, // 50KB
        critical: 60 * 1024, // 60KB target from CSS strategy
      },
      js: {
        warning: 2 * 1024 * 1024, // 2MB
        critical: 3 * 1024 * 1024, // 3MB
      },
    };
    this.historyFile = resolve(projectRoot, 'reports', 'bundle-history.json');
    this.reportFile = resolve(
      projectRoot,
      'reports',
      'performance-report.json'
    );
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
    } catch {
      return 0;
    }
  }

  async getCurrentSizes() {
    const distPath = resolve(projectRoot, 'dist');

    const sizes = {
      timestamp: new Date().toISOString(),
      css: await this.getBundleSize(resolve(distPath, 'main.css')),
      js: await this.getBundleSize(resolve(distPath, 'main.js')),
      cssMap: await this.getBundleSize(resolve(distPath, 'main.css.map')),
      jsMap: await this.getBundleSize(resolve(distPath, 'main.js.map')),
    };

    return sizes;
  }

  async loadHistory() {
    try {
      const data = await fs.readFile(this.historyFile, 'utf8');
      return JSON.parse(data);
    } catch {
      return { measurements: [] };
    }
  }

  async saveHistory(history) {
    await fs.mkdir(resolve(projectRoot, 'reports'), { recursive: true });
    await fs.writeFile(this.historyFile, JSON.stringify(history, null, 2));
  }

  checkThresholds(sizes) {
    const alerts = [];

    // Check CSS thresholds
    if (sizes.css >= this.thresholds.css.critical) {
      alerts.push({
        level: 'CRITICAL',
        type: 'CSS',
        message: `CSS bundle ${this.formatBytes(sizes.css)} exceeds critical threshold (${this.formatBytes(this.thresholds.css.critical)})`,
      });
    } else if (sizes.css >= this.thresholds.css.warning) {
      alerts.push({
        level: 'WARNING',
        type: 'CSS',
        message: `CSS bundle ${this.formatBytes(sizes.css)} exceeds warning threshold (${this.formatBytes(this.thresholds.css.warning)})`,
      });
    }

    // Check JS thresholds
    if (sizes.js >= this.thresholds.js.critical) {
      alerts.push({
        level: 'CRITICAL',
        type: 'JS',
        message: `JS bundle ${this.formatBytes(sizes.js)} exceeds critical threshold (${this.formatBytes(this.thresholds.js.critical)})`,
      });
    } else if (sizes.js >= this.thresholds.js.warning) {
      alerts.push({
        level: 'WARNING',
        type: 'JS',
        message: `JS bundle ${this.formatBytes(sizes.js)} exceeds warning threshold (${this.formatBytes(this.thresholds.js.warning)})`,
      });
    }

    return alerts;
  }

  calculateTrends(history, current) {
    if (history.measurements.length === 0) return null;

    const previous = history.measurements[history.measurements.length - 1];
    const trends = {
      css: {
        change: current.css - previous.css,
        percentage: (
          ((current.css - previous.css) / previous.css) *
          100
        ).toFixed(2),
      },
      js: {
        change: current.js - previous.js,
        percentage: (((current.js - previous.js) / previous.js) * 100).toFixed(
          2
        ),
      },
    };

    return trends;
  }

  async generateReport(sizes, history, alerts, trends) {
    const report = {
      timestamp: sizes.timestamp,
      current: {
        css: {
          size: sizes.css,
          formatted: this.formatBytes(sizes.css),
          threshold: `${this.formatBytes(this.thresholds.css.warning)} warning / ${this.formatBytes(this.thresholds.css.critical)} critical`,
        },
        js: {
          size: sizes.js,
          formatted: this.formatBytes(sizes.js),
          threshold: `${this.formatBytes(this.thresholds.js.warning)} warning / ${this.formatBytes(this.thresholds.js.critical)} critical`,
        },
      },
      alerts: alerts,
      trends: trends,
      history: {
        totalMeasurements: history.measurements.length,
        oldestMeasurement:
          history.measurements.length > 0
            ? history.measurements[0].timestamp
            : null,
      },
      recommendations: this.generateRecommendations(sizes, alerts, trends),
    };

    await fs.writeFile(this.reportFile, JSON.stringify(report, null, 2));
    return report;
  }

  generateRecommendations(sizes, alerts, trends) {
    const recommendations = [];

    // CSS recommendations
    if (sizes.css > 30 * 1024) {
      // 30KB
      recommendations.push({
        type: 'CSS',
        priority: 'medium',
        message:
          'Consider code-splitting large feature-specific CSS into separate files',
      });
    }

    if (trends && trends.css.change > 5 * 1024) {
      // 5KB increase
      recommendations.push({
        type: 'CSS',
        priority: 'high',
        message: `CSS bundle increased by ${this.formatBytes(trends.css.change)} (${trends.css.percentage}%). Review recent CSS additions.`,
      });
    }

    // JS recommendations
    if (sizes.js > 2 * 1024 * 1024) {
      // 2MB
      recommendations.push({
        type: 'JS',
        priority: 'medium',
        message:
          'Consider implementing lazy loading for large components or features',
      });
    }

    if (trends && trends.js.change > 100 * 1024) {
      // 100KB increase
      recommendations.push({
        type: 'JS',
        priority: 'high',
        message: `JS bundle increased by ${this.formatBytes(trends.js.change)} (${trends.js.percentage}%). Review recent dependencies or code additions.`,
      });
    }

    return recommendations;
  }

  async run(options = {}) {
    console.log('📊 VitalSense Performance Monitor');
    console.log('================================');

    // Build if requested
    if (options.build !== false) {
      console.log('🔨 Building project...');
      try {
        execSync('npm run build', {
          stdio: options.verbose ? 'inherit' : 'pipe',
        });
        console.log('✅ Build completed');
      } catch (error) {
        console.error('❌ Build failed:', error.message);
        process.exit(1);
      }
    }

    // Get current sizes
    const sizes = await this.getCurrentSizes();
    console.log('📏 Current Bundle Sizes:');
    console.log(`   CSS: ${this.formatBytes(sizes.css)}`);
    console.log(`   JS:  ${this.formatBytes(sizes.js)}`);

    // Load and update history
    const history = await this.loadHistory();
    const trends = this.calculateTrends(history, sizes);

    if (trends) {
      console.log('📈 Trends (vs previous):');
      console.log(
        `   CSS: ${trends.css.change >= 0 ? '+' : ''}${this.formatBytes(trends.css.change)} (${trends.css.percentage}%)`
      );
      console.log(
        `   JS:  ${trends.js.change >= 0 ? '+' : ''}${this.formatBytes(trends.js.change)} (${trends.js.percentage}%)`
      );
    }

    // Check thresholds
    const alerts = this.checkThresholds(sizes);
    if (alerts.length > 0) {
      console.log('🚨 Alerts:');
      alerts.forEach((alert) => {
        const emoji = alert.level === 'CRITICAL' ? '🔴' : '⚠️';
        console.log(`   ${emoji} ${alert.level}: ${alert.message}`);
      });
    } else {
      console.log('✅ All thresholds within limits');
    }

    // Update history
    history.measurements.push(sizes);
    // Keep last 100 measurements
    if (history.measurements.length > 100) {
      history.measurements = history.measurements.slice(-100);
    }
    await this.saveHistory(history);

    // Generate report
    const report = await this.generateReport(sizes, history, alerts, trends);

    if (options.verbose) {
      console.log('\n📋 Recommendations:');
      if (report.recommendations.length === 0) {
        console.log('   None - bundle sizes are optimal');
      } else {
        report.recommendations.forEach((rec) => {
          const emoji = rec.priority === 'high' ? '🔥' : '💡';
          console.log(`   ${emoji} ${rec.type}: ${rec.message}`);
        });
      }
    }

    console.log(`\n📄 Reports saved to:`);
    console.log(`   ${this.historyFile}`);
    console.log(`   ${this.reportFile}`);

    // Exit with error code if critical alerts
    const criticalAlerts = alerts.filter((a) => a.level === 'CRITICAL');
    if (criticalAlerts.length > 0) {
      process.exit(1);
    }
  }
}

// CLI handling
const args = process.argv.slice(2);
const options = {
  verbose: args.includes('--verbose') || args.includes('-v'),
  continuous: args.includes('--continuous'),
  interval:
    parseInt(
      args.find((arg) => arg.startsWith('--interval='))?.split('=')[1]
    ) || 600000, // 10 minutes
  build: !args.includes('--no-build'),
};

const monitor = new PerformanceMonitor();

if (options.continuous) {
  console.log(
    `🔄 Starting continuous monitoring (interval: ${options.interval / 1000}s)`
  );
  console.log('Press Ctrl+C to stop\n');

  // Run immediately
  monitor.run(options).catch(console.error);

  // Then run on interval
  setInterval(() => {
    monitor.run(options).catch(console.error);
  }, options.interval);
} else {
  monitor.run(options).catch(console.error);
}
