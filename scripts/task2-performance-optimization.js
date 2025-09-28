#!/usr/bin/env node

/**
 * VitalSense Performance Optimization
 * Task 2: Performance optimization and advanced ML testing
 */

import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

class PerformanceOptimizer {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.optimizations = [];
    this.performanceMetrics = {
      frontend: {},
      mlBackend: {},
      websocket: {},
      overall: {},
    };
  }

  log(level, message, component = null) {
    const timestamp = new Date().toLocaleTimeString();
    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      perf: '📊',
      optimize: '⚡',
      ml: '🧠',
    };

    const prefix = component ? `[${component}] ` : '';
    console.log(`${icons[level] || '📋'} [${timestamp}] ${prefix}${message}`);
  }

  recordOptimization(component, optimization, impact, metrics = {}) {
    this.optimizations.push({
      component,
      optimization,
      impact,
      metrics,
      timestamp: new Date().toISOString(),
    });
  }

  async measureFrontendPerformance() {
    this.log('perf', 'Measuring frontend performance...', 'FRONTEND');

    try {
      const start = Date.now();
      const response = await fetch('http://localhost:5173', { timeout: 10000 });
      const responseTime = Date.now() - start;

      if (response.ok) {
        const content = await response.text();
        const contentSize = content.length;
        const compressionRatio = response.headers.get('content-encoding')
          ? 'gzip'
          : 'none';

        this.performanceMetrics.frontend = {
          responseTime,
          contentSize,
          compression: compressionRatio,
          httpStatus: response.status,
          timestamp: new Date().toISOString(),
        };

        this.log(
          'success',
          `Frontend: ${responseTime}ms, ${contentSize} bytes`,
          'FRONTEND'
        );

        // Optimization recommendations
        if (responseTime > 2000) {
          this.recordOptimization(
            'frontend',
            'Response time optimization needed',
            'high',
            {
              currentTime: responseTime,
              target: '<1000ms',
            }
          );
        }

        if (contentSize > 500000) {
          this.recordOptimization(
            'frontend',
            'Bundle size optimization needed',
            'medium',
            {
              currentSize: contentSize,
              target: '<300KB',
            }
          );
        }

        return true;
      }
    } catch (error) {
      this.log(
        'error',
        `Frontend performance test failed: ${error.message}`,
        'FRONTEND'
      );
      return false;
    }
  }

  async measureMLPerformance() {
    this.log(
      'ml',
      'Testing ML backend performance with advanced scenarios...',
      'ML'
    );

    const testScenarios = [
      {
        name: 'Normal Health Data',
        data: { heartRate: 72, steps: 8500, bloodPressure: [120, 80] },
        expectedLatency: 500,
      },
      {
        name: 'High Activity Data',
        data: { heartRate: 150, steps: 15000, distance: 12.5, calories: 800 },
        expectedLatency: 750,
      },
      {
        name: 'Anomaly Detection',
        data: { heartRate: 200, steps: 100, bloodPressure: [180, 120] },
        expectedLatency: 1000,
      },
      {
        name: 'Complex Multi-Metric',
        data: {
          heartRate: 85,
          steps: 9500,
          distance: 6.2,
          calories: 450,
          sleepHours: 7.5,
          stressLevel: 3,
          bloodOxygen: 98,
        },
        expectedLatency: 1200,
      },
    ];

    const results = [];

    for (const scenario of testScenarios) {
      try {
        const start = Date.now();

        const response = await fetch('http://localhost:3002/ml/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...scenario.data,
            timestamp: new Date().toISOString(),
            testScenario: scenario.name,
          }),
          timeout: 15000,
        });

        const latency = Date.now() - start;

        if (response.ok) {
          const result = await response.json();

          results.push({
            scenario: scenario.name,
            latency,
            success: true,
            analysisQuality: result.analysis ? 'comprehensive' : 'basic',
            predictionsCount: result.analysis?.predictions?.length || 0,
            insightsCount: result.analysis?.insights?.length || 0,
          });

          this.log(
            'success',
            `${scenario.name}: ${latency}ms, ${result.analysis?.predictions?.length || 0} predictions`,
            'ML'
          );

          // Performance optimization checks
          if (latency > scenario.expectedLatency * 1.5) {
            this.recordOptimization(
              'ml-backend',
              `${scenario.name} latency optimization`,
              'medium',
              {
                currentLatency: latency,
                expectedLatency: scenario.expectedLatency,
              }
            );
          }
        } else {
          results.push({
            scenario: scenario.name,
            latency,
            success: false,
            error: `HTTP ${response.status}`,
          });
        }
      } catch (error) {
        results.push({
          scenario: scenario.name,
          success: false,
          error: error.message,
        });
      }
    }

    this.performanceMetrics.mlBackend = {
      testScenarios: results,
      averageLatency:
        results
          .filter((r) => r.success)
          .reduce((sum, r) => sum + r.latency, 0) /
        results.filter((r) => r.success).length,
      successRate:
        (results.filter((r) => r.success).length / results.length) * 100,
      timestamp: new Date().toISOString(),
    };

    const avgLatency = this.performanceMetrics.mlBackend.averageLatency;
    const successRate = this.performanceMetrics.mlBackend.successRate;

    this.log(
      'success',
      `ML Performance: ${avgLatency.toFixed(0)}ms avg, ${successRate}% success rate`,
      'ML'
    );

    return results;
  }

  async testWebSocketPerformance() {
    this.log('perf', 'Testing WebSocket ML performance...', 'WEBSOCKET');

    try {
      // Dynamic import for WebSocket in Node.js environment
      const { default: WebSocket } = await import('ws');

      return new Promise((resolve) => {
        try {
          const ws = new WebSocket(
            'wss://vitalsense-websocket-advanced-prod.andernet.workers.dev'
          );

          const testStart = Date.now();
          let connectionTime = 0;
          let responseTime = 0;
          let messagesExchanged = 0;

          const timeout = setTimeout(() => {
            ws.close();
            this.log(
              'warning',
              'WebSocket performance test timeout',
              'WEBSOCKET'
            );
            resolve({ success: false, error: 'timeout' });
          }, 15000);

          ws.on('open', () => {
            connectionTime = Date.now() - testStart;
            this.log(
              'info',
              `WebSocket connected in ${connectionTime}ms`,
              'WEBSOCKET'
            );

            // Send performance test message
            const messageStart = Date.now();
            ws.send(
              JSON.stringify({
                type: 'ml_analysis_request',
                data: {
                  heartRate: 78,
                  steps: 9200,
                  testType: 'performance',
                  timestamp: new Date().toISOString(),
                },
              })
            );

            ws.on('message', (data) => {
              responseTime = Date.now() - messageStart;
              messagesExchanged++;

              clearTimeout(timeout);

              try {
                const message = JSON.parse(data.toString());

                this.performanceMetrics.websocket = {
                  connectionTime,
                  responseTime,
                  messagesExchanged,
                  messageType: message.type,
                  hasMLData: !!message.data,
                  success: true,
                  timestamp: new Date().toISOString(),
                };

                this.log(
                  'success',
                  `WebSocket: ${connectionTime}ms connect, ${responseTime}ms response`,
                  'WEBSOCKET'
                );

                // Performance optimization checks
                if (connectionTime > 3000) {
                  this.recordOptimization(
                    'websocket',
                    'Connection time optimization',
                    'low',
                    {
                      currentTime: connectionTime,
                      target: '<2000ms',
                    }
                  );
                }

                if (responseTime > 5000) {
                  this.recordOptimization(
                    'websocket',
                    'ML response time optimization',
                    'medium',
                    {
                      currentTime: responseTime,
                      target: '<3000ms',
                    }
                  );
                }

                ws.close();
                resolve({
                  success: true,
                  metrics: this.performanceMetrics.websocket,
                });
              } catch (parseError) {
                this.log(
                  'warning',
                  `WebSocket parse error: ${parseError.message}`,
                  'WEBSOCKET'
                );
                ws.close();
                resolve({ success: false, error: 'parse_error' });
              }
            });
          });

          ws.on('error', (error) => {
            clearTimeout(timeout);
            this.log('error', `WebSocket error: ${error.message}`, 'WEBSOCKET');
            resolve({ success: false, error: error.message });
          });
        } catch (error) {
          this.log(
            'error',
            `WebSocket test setup failed: ${error.message}`,
            'WEBSOCKET'
          );
          resolve({ success: false, error: error.message });
        }
      });
    } catch (importError) {
      this.log(
        'error',
        `WebSocket import failed: ${importError.message}`,
        'WEBSOCKET'
      );
      return { success: false, error: 'websocket_import_failed' };
    }
  }

  async optimizeBundleSize() {
    this.log(
      'optimize',
      'Analyzing bundle optimization opportunities...',
      'BUNDLE'
    );

    try {
      // Check if we can build and analyze the bundle
      try {
        const { stdout } = await execAsync('npx vite build --mode production', {
          timeout: 60000,
        });

        // Try to get build stats
        if (stdout.includes('dist/')) {
          this.log(
            'success',
            'Production build completed successfully',
            'BUNDLE'
          );

          // Check dist folder exists
          try {
            const distPath = path.join(this.workspaceRoot, 'dist');
            await fs.access(distPath);

            this.recordOptimization(
              'bundle',
              'Production build ready',
              'high',
              {
                buildSuccess: true,
                outputDirectory: 'dist/',
                buildTime: 'under 60s',
              }
            );
          } catch {
            this.log('warning', 'Could not access dist folder', 'BUNDLE');
          }
        }
      } catch (buildError) {
        this.log(
          'warning',
          `Build test failed: ${buildError.message.substring(0, 100)}`,
          'BUNDLE'
        );

        this.recordOptimization(
          'bundle',
          'Build optimization needed',
          'medium',
          {
            issue: 'Build process needs refinement',
            recommendation: 'Review build configuration',
          }
        );
      }

      return true;
    } catch (error) {
      this.log(
        'error',
        `Bundle optimization failed: ${error.message}`,
        'BUNDLE'
      );
      return false;
    }
  }

  async generatePerformanceReport() {
    this.log(
      'optimize',
      'Generating comprehensive performance report...',
      'REPORT'
    );

    const report = {
      timestamp: new Date().toISOString(),
      test_phase: 'Performance Optimization & Advanced ML Testing',
      metrics: this.performanceMetrics,
      optimizations: this.optimizations,
      recommendations: [],
      performance_score: this.calculatePerformanceScore(),
      next_steps: [
        'Deploy optimized build to production',
        'Configure Cloudflare performance features',
        'Set up real-time monitoring',
        'Implement performance budgets',
      ],
    };

    // Generate recommendations based on metrics
    if (this.performanceMetrics.frontend.responseTime > 1000) {
      report.recommendations.push({
        component: 'Frontend',
        recommendation: 'Optimize initial load time with code splitting',
        priority: 'high',
      });
    }

    if (this.performanceMetrics.mlBackend.averageLatency > 1000) {
      report.recommendations.push({
        component: 'ML Backend',
        recommendation: 'Implement response caching for similar requests',
        priority: 'medium',
      });
    }

    if (this.performanceMetrics.websocket.connectionTime > 2000) {
      report.recommendations.push({
        component: 'WebSocket',
        recommendation: 'Optimize WebSocket connection establishment',
        priority: 'low',
      });
    }

    const reportPath = path.join(
      this.workspaceRoot,
      'performance-optimization-report.json'
    );
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

    this.log('success', `Performance report saved: ${reportPath}`, 'REPORT');
    return report;
  }

  calculatePerformanceScore() {
    let score = 100;

    // Frontend performance impact
    if (this.performanceMetrics.frontend.responseTime > 2000) score -= 20;
    else if (this.performanceMetrics.frontend.responseTime > 1000) score -= 10;

    // ML backend performance impact
    if (this.performanceMetrics.mlBackend.averageLatency > 2000) score -= 15;
    else if (this.performanceMetrics.mlBackend.averageLatency > 1000)
      score -= 5;

    if (this.performanceMetrics.mlBackend.successRate < 100) score -= 10;

    // WebSocket performance impact
    if (this.performanceMetrics.websocket.success) {
      if (this.performanceMetrics.websocket.responseTime > 5000) score -= 10;
      else if (this.performanceMetrics.websocket.responseTime > 3000)
        score -= 5;
    } else {
      score -= 20;
    }

    return Math.max(0, score);
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 PERFORMANCE OPTIMIZATION SUMMARY');
    console.log('='.repeat(60));

    // Frontend metrics
    if (this.performanceMetrics.frontend.responseTime) {
      console.log(`🌐 Frontend Performance:`);
      console.log(
        `   Response Time: ${this.performanceMetrics.frontend.responseTime}ms`
      );
      console.log(
        `   Content Size: ${this.performanceMetrics.frontend.contentSize} bytes`
      );
      console.log(`   Status: ${this.performanceMetrics.frontend.httpStatus}`);
    }

    // ML backend metrics
    if (this.performanceMetrics.mlBackend.averageLatency) {
      console.log(`🧠 ML Backend Performance:`);
      console.log(
        `   Average Latency: ${this.performanceMetrics.mlBackend.averageLatency.toFixed(0)}ms`
      );
      console.log(
        `   Success Rate: ${this.performanceMetrics.mlBackend.successRate}%`
      );
      console.log(
        `   Test Scenarios: ${this.performanceMetrics.mlBackend.testScenarios.length}`
      );
    }

    // WebSocket metrics
    if (this.performanceMetrics.websocket.success) {
      console.log(`🔌 WebSocket Performance:`);
      console.log(
        `   Connection Time: ${this.performanceMetrics.websocket.connectionTime}ms`
      );
      console.log(
        `   Response Time: ${this.performanceMetrics.websocket.responseTime}ms`
      );
      console.log(
        `   Messages: ${this.performanceMetrics.websocket.messagesExchanged}`
      );
    }

    // Optimizations
    console.log(`\n⚡ Optimizations Identified: ${this.optimizations.length}`);
    this.optimizations.forEach((opt) => {
      let priority;
      if (opt.impact === 'high') {
        priority = '🔴';
      } else if (opt.impact === 'medium') {
        priority = '🟡';
      } else {
        priority = '🟢';
      }
      console.log(`   ${priority} ${opt.component}: ${opt.optimization}`);
    });

    const score = this.calculatePerformanceScore();
    console.log(`\n📈 Performance Score: ${score}/100`);

    if (score >= 90) {
      console.log('🟢 EXCELLENT - System performing optimally');
    } else if (score >= 70) {
      console.log('🟡 GOOD - Minor optimizations recommended');
    } else {
      console.log('🟠 NEEDS OPTIMIZATION - Address performance issues');
    }
  }

  async run() {
    console.log('📊 VITALSENSE PERFORMANCE OPTIMIZATION & ADVANCED ML TESTING');
    console.log('='.repeat(60));
    console.log(`📅 Date: ${new Date().toLocaleDateString()}`);
    console.log(`⏰ Time: ${new Date().toLocaleTimeString()}`);
    console.log('🎯 Task 2: Performance optimization and ML scenario testing');
    console.log();

    try {
      // Run performance tests
      await this.measureFrontendPerformance();
      await this.measureMLPerformance();
      await this.testWebSocketPerformance();
      await this.optimizeBundleSize();

      // Generate report
      const report = await this.generatePerformanceReport();

      // Print summary
      this.printSummary();

      console.log('\n🎯 NEXT STEP: Generate production documentation');
      console.log('Run: node scripts/task3-production-documentation.js');

      return {
        success: true,
        performanceScore: this.calculatePerformanceScore(),
        report,
      };
    } catch (error) {
      this.log('error', `Performance optimization failed: ${error.message}`);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const optimizer = new PerformanceOptimizer();
  optimizer
    .run()
    .then(() => {
      console.log('\n✅ Task 2: Performance optimization completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n❌ Task 2 failed:', error.message);
      process.exit(1);
    });
}

export default PerformanceOptimizer;
