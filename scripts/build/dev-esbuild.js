#!/usr/bin/env node
/**
 * Development Server - VitalSense
 * Starts Vite development server with hot module replacement
 */

import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { createServer } from 'vite';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '../..');

async function startDevServer() {
  console.log('🚀 Starting VitalSense Development Server...');

  try {
    const server = await createServer({
      configFile: resolve(projectRoot, 'vite.config.ts'),
      mode: 'development',
      server: {
        port: 5000,
        open: true,
      },
    });

    await server.listen();

    server.printUrls();
    console.log('\n✨ Development server is ready!');
  } catch (error) {
    console.error('❌ Failed to start dev server:', error);
    process.exit(1);
  }
}

startDevServer();
