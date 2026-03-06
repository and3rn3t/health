#!/usr/bin/env node
/**
 * Build Cloudflare Worker - VitalSense
 * Builds the worker using vite CLI command
 */

import { spawnSync } from 'child_process';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

async function buildWorker() {
  console.log('🔨 Building Cloudflare Worker...');

  try {
    // Use Vite CLI to build the worker using spawnSync to prevent injection
    const result = spawnSync('npx', ['vite', 'build', '--config', 'vite.worker.config.ts'], {
      cwd: projectRoot,
      stdio: 'inherit',
      shell: false, // Disable shell to prevent injection
    });

    if (result.error) {
      throw result.error;
    }

    if (result.status !== 0) {
      throw new Error(`Build failed with exit code ${result.status}`);
    }

    console.log('✅ Worker build completed successfully');
  } catch (error) {
    console.error('❌ Worker build failed:', error.message);
    process.exit(1);
  }
}

buildWorker();
