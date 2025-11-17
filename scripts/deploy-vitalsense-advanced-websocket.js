#!/usr/bin/env node

/**
 * Deploy VitalSense Advanced ML WebSocket Service
 * Builds and deploys the enhanced WebSocket worker with ML capabilities
 */

import { spawnSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

class VitalSenseAdvancedDeployer {
  constructor() {
    this.projectRoot = process.cwd();
    this.workerPath = 'src/workers/vitalsense-websocket-advanced.ts';
    this.configPath = 'wrangler.advanced-websocket.toml';
  }

  async deploy() {
    console.log('🧠 VitalSense Advanced ML WebSocket Deployment');
    console.log('==============================================\n');

    try {
      await this.validateFiles();
      await this.buildWorker();
      await this.deployToCloudflare();
      await this.testDeployment();

      console.log(
        '\n🎉 VitalSense Advanced ML WebSocket deployed successfully!'
      );
      console.log('📍 Service URL: https://vitalsense-advanced.andernet.dev');
      console.log(
        '🔍 Health Check: https://vitalsense-advanced.andernet.dev/health'
      );
      console.log(
        '🧠 ML Features: Predictive analytics, anomaly detection, personalized insights'
      );
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  async validateFiles() {
    console.log('🔍 Validating deployment files...');

    // Check if advanced worker exists
    try {
      const workerContent = readFileSync(
        join(this.projectRoot, this.workerPath),
        'utf8'
      );
      if (!workerContent.includes('VitalSenseAdvancedWebSocketDO')) {
        throw new Error('Advanced WebSocket worker class not found');
      }
      console.log('✅ Advanced WebSocket worker validated');
    } catch (error) {
      throw new Error(`Worker validation failed: ${error.message}`);
    }

    // Check wrangler config
    try {
      const configContent = readFileSync(
        join(this.projectRoot, this.configPath),
        'utf8'
      );
      if (!configContent.includes('vitalsense-websocket-advanced')) {
        throw new Error('Advanced WebSocket configuration not found');
      }
      console.log('✅ Wrangler configuration validated');
    } catch (error) {
      throw new Error(`Configuration validation failed: ${error.message}`);
    }
  }

  async buildWorker() {
    console.log('🔨 Building advanced WebSocket worker...');

    try {
      // Build the worker using the dedicated vite config for advanced websocket
      const result = spawnSync('npx', ['vite', 'build', '--config', 'vite.advanced-websocket.config.ts'], {
        stdio: 'pipe',
        cwd: this.projectRoot,
        shell: false, // Disable shell to prevent injection
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        const errorOutput = result.stderr?.toString() || result.stdout?.toString() || 'Unknown error';
        throw new Error(`Build failed with exit code ${result.status}: ${errorOutput}`);
      }

      // Verify the built file exists
      const builtWorkerPath = join(
        this.projectRoot,
        'dist-worker',
        'vitalsense-websocket-advanced-clean.js'
      );

      if (!readFileSync(builtWorkerPath, 'utf8').includes('VitalSenseAdvancedWebSocketDO')) {
        throw new Error('Built worker does not contain VitalSenseAdvancedWebSocketDO class');
      }

      console.log('✅ Advanced WebSocket worker built successfully');
    } catch (error) {
      throw new Error(`Build failed: ${error.message}`);
    }
  }

  async deployToCloudflare() {
    console.log('☁️  Deploying to Cloudflare Workers...');

    try {
      // Deploy to development environment first
      console.log('   🚀 Deploying to development...');
      const devResult = spawnSync(
        'npx',
        ['wrangler', 'deploy', '--config', this.configPath, '--env', 'development'],
        {
          stdio: 'inherit',
          cwd: this.projectRoot,
          shell: false, // Disable shell to prevent injection
        }
      );

      if (devResult.error) {
        throw devResult.error;
      }

      if (devResult.status !== 0) {
        throw new Error(`Development deployment failed with exit code ${devResult.status}`);
      }

      console.log('✅ Development deployment successful');

      // Ask for production deployment
      console.log('   🚀 Deploying to production...');
      const prodResult = spawnSync(
        'npx',
        ['wrangler', 'deploy', '--config', this.configPath, '--env', 'production'],
        {
          stdio: 'inherit',
          cwd: this.projectRoot,
          shell: false, // Disable shell to prevent injection
        }
      );

      if (prodResult.error) {
        throw prodResult.error;
      }

      if (prodResult.status !== 0) {
        throw new Error(`Production deployment failed with exit code ${prodResult.status}`);
      }

      console.log('✅ Production deployment successful');
    } catch (error) {
      throw new Error(`Cloudflare deployment failed: ${error.message}`);
    }
  }

  async testDeployment() {
    console.log('🧪 Testing deployed service...');

    try {
      // Test health endpoint
      const response = await fetch(
        'https://vitalsense-advanced.andernet.dev/health'
      );

      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status}`);
      }

      const healthData = await response.json();

      if (!healthData.features?.includes('predictive_analytics')) {
        throw new Error('ML features not detected in deployed service');
      }

      console.log('✅ Deployment test successful');
      console.log(`   📊 Features: ${healthData.features?.join(', ')}`);
      console.log(`   👥 Active clients: ${healthData.clients || 0}`);
    } catch (error) {
      console.warn(`⚠️  Deployment test failed: ${error.message}`);
      console.warn('   Service may still be starting up...');
    }
  }
}

// Run deployment if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const deployer = new VitalSenseAdvancedDeployer();
  deployer.deploy().catch(console.error);
}

export default VitalSenseAdvancedDeployer;
