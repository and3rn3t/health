/**
 * Frontend Integration Test
 * Tests the VitalSense frontend integration with ML backend services
 */

import { readFileSync } from 'fs';
import path from 'path';

class FrontendIntegrationTester {
  constructor() {
    this.frontendUrl = 'http://localhost:5173';
    this.quickFixMlUrl = 'http://localhost:3002';
    this.advancedMlUrl = 'wss://vitalsense-advanced.andernet.dev/ws';
    this.workspaceRoot = process.cwd();
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const levelIcon = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      test: '🧪',
      frontend: '🌐',
    };
    console.log(`${levelIcon[level] || '📋'} [${timestamp}] ${message}`);
  }

  async testFrontendHealth() {
    this.log('frontend', 'Testing VitalSense frontend health...');

    try {
      const response = await fetch(this.frontendUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const html = await response.text();
      const hasVitalSense = html.includes('VitalSense');
      const hasHealthContent =
        html.includes('Health') || html.includes('health');
      const size = html.length;

      this.log('success', `Frontend responding: ${response.status}`);
      this.log('info', `Content size: ${size} bytes`);
      this.log(
        hasVitalSense ? 'success' : 'warning',
        `VitalSense branding: ${hasVitalSense ? 'Found' : 'Not detected'}`
      );
      this.log(
        hasHealthContent ? 'success' : 'warning',
        `Health content: ${hasHealthContent ? 'Found' : 'Not detected'}`
      );

      return {
        status: response.status,
        size,
        hasVitalSense,
        hasHealthContent,
        healthy: response.ok && hasVitalSense,
      };
    } catch (error) {
      this.log('error', `Frontend test failed: ${error.message}`);
      return {
        status: 0,
        size: 0,
        hasVitalSense: false,
        hasHealthContent: false,
        healthy: false,
        error: error.message,
      };
    }
  }

  async testQuickFixMLIntegration() {
    this.log('test', 'Testing Quick Fix ML integration...');

    try {
      // Test health endpoint
      const healthResponse = await fetch(`${this.quickFixMlUrl}/health`);
      if (!healthResponse.ok) {
        throw new Error(`Health check failed: ${healthResponse.status}`);
      }

      // Test ML analysis endpoint
      const testHealthData = {
        timestamp: new Date().toISOString(),
        heartRate: 72,
        steps: 8500,
        distance: 5.2,
      };

      const mlResponse = await fetch(`${this.quickFixMlUrl}/api/ml-analysis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testHealthData),
      });

      if (!mlResponse.ok) {
        throw new Error(`ML analysis failed: ${mlResponse.status}`);
      }

      const mlResult = await mlResponse.json();

      this.log('success', 'Quick Fix ML integration working');
      this.log(
        'info',
        `ML Analysis result: ${JSON.stringify(mlResult).substring(0, 100)}...`
      );

      return {
        healthy: true,
        healthStatus: healthResponse.status,
        mlStatus: mlResponse.status,
        mlResult,
      };
    } catch (error) {
      this.log('warning', `Quick Fix ML test failed: ${error.message}`);
      return {
        healthy: false,
        error: error.message,
      };
    }
  }

  async testAdvancedWebSocketML() {
    this.log('test', 'Testing Advanced WebSocket ML integration...');

    return new Promise((resolve) => {
      try {
        const ws = new WebSocket(this.advancedMlUrl);
        const timeout = setTimeout(() => {
          ws.close();
          this.log('warning', 'WebSocket test timeout');
          resolve({
            healthy: false,
            error: 'Connection timeout',
          });
        }, 10000);

        ws.onopen = () => {
          this.log('success', 'Advanced WebSocket connected');

          // Send test ML request
          ws.send(
            JSON.stringify({
              type: 'ml_analysis_request',
              data: {
                heartRate: 75,
                steps: 9000,
                timestamp: new Date().toISOString(),
              },
            })
          );
        };

        ws.onmessage = (event) => {
          clearTimeout(timeout);
          const message = JSON.parse(event.data);

          this.log('success', 'Advanced WebSocket ML response received');
          this.log('info', `Message type: ${message.type}`);

          ws.close();
          resolve({
            healthy: true,
            messageType: message.type,
            hasData: !!message.data,
          });
        };

        ws.onerror = (error) => {
          clearTimeout(timeout);
          this.log('warning', `WebSocket error: ${error}`);
          resolve({
            healthy: false,
            error: 'WebSocket connection error',
          });
        };
      } catch (error) {
        this.log('warning', `WebSocket test setup failed: ${error.message}`);
        resolve({
          healthy: false,
          error: error.message,
        });
      }
    });
  }

  async testFrontendToBackendIntegration() {
    this.log('test', 'Testing full frontend-to-backend integration...');

    // This would test the actual frontend JavaScript connecting to backends
    // For now, we'll simulate by checking if the frontend has the necessary
    // WebSocket connection code

    try {
      const srcPath = path.join(this.workspaceRoot, 'src');
      const files = [
        'main.tsx',
        'App.tsx',
        'lib/websocket.ts',
        'lib/liveHealthDataSync.ts',
      ];

      let hasWebSocketCode = false;
      let hasMLIntegration = false;

      for (const file of files) {
        try {
          const filePath = path.join(srcPath, file);
          const content = readFileSync(filePath, 'utf8');

          if (content.includes('WebSocket') || content.includes('websocket')) {
            hasWebSocketCode = true;
          }

          if (
            content.includes('ml_analysis') ||
            content.includes('ML') ||
            content.includes('ai')
          ) {
            hasMLIntegration = true;
          }
        } catch (error) {
          // File might not exist, continue
        }
      }

      this.log(
        hasWebSocketCode ? 'success' : 'warning',
        `WebSocket integration code: ${hasWebSocketCode ? 'Found' : 'Missing'}`
      );
      this.log(
        hasMLIntegration ? 'success' : 'warning',
        `ML integration code: ${hasMLIntegration ? 'Found' : 'Missing'}`
      );

      return {
        hasWebSocketCode,
        hasMLIntegration,
        integrationReady: hasWebSocketCode && hasMLIntegration,
      };
    } catch (error) {
      this.log('error', `Integration test failed: ${error.message}`);
      return {
        hasWebSocketCode: false,
        hasMLIntegration: false,
        integrationReady: false,
        error: error.message,
      };
    }
  }

  async generateIntegrationReport(results) {
    const report = {
      timestamp: new Date().toISOString(),
      test_summary: {
        frontend_health: results.frontend.healthy,
        quickfix_ml: results.quickFixML.healthy,
        advanced_websocket: results.advancedWS.healthy,
        integration_ready: results.integration.integrationReady,
      },
      detailed_results: results,
      next_steps: [
        results.frontend.healthy
          ? '✅ Frontend is working'
          : '❌ Fix frontend issues',
        results.quickFixML.healthy
          ? '✅ Quick Fix ML ready'
          : '❌ Quick Fix ML needs attention',
        results.advancedWS.healthy
          ? '✅ Advanced WebSocket ready'
          : '❌ Advanced WebSocket needs attention',
        results.integration.integrationReady
          ? '✅ Integration code ready'
          : '❌ Add integration code',
      ],
      recommendations: [
        'Run comprehensive end-to-end testing',
        'Test ML algorithm accuracy',
        'Verify WebSocket error handling',
        'Check security dependency updates',
      ],
    };

    const reportPath = path.join(
      this.workspaceRoot,
      'frontend-integration-report.json'
    );
    await import('fs').then((fs) =>
      fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2))
    );

    this.log('success', `Integration report saved to ${reportPath}`);
    return report;
  }

  async run() {
    this.log('frontend', '🌐 Starting Frontend Integration Test Suite');

    try {
      // Test all components
      const [frontend, quickFixML, advancedWS, integration] = await Promise.all(
        [
          this.testFrontendHealth(),
          this.testQuickFixMLIntegration(),
          this.testAdvancedWebSocketML(),
          this.testFrontendToBackendIntegration(),
        ]
      );

      const results = {
        frontend,
        quickFixML,
        advancedWS,
        integration,
      };

      // Generate report
      const report = await this.generateIntegrationReport(results);

      this.log('success', '🎯 Frontend Integration Test Complete');

      return report;
    } catch (error) {
      this.log('error', `Integration test failed: ${error.message}`);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tester = new FrontendIntegrationTester();
  tester
    .run()
    .then((result) => {
      console.log('\n📊 Integration Test Summary:');
      console.log(JSON.stringify(result.test_summary, null, 2));
      console.log('\n📋 Next Steps:');
      result.next_steps.forEach((step) => console.log(`  ${step}`));
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Integration test failed:', error.message);
      process.exit(1);
    });
}

export default FrontendIntegrationTester;
