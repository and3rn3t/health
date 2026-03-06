#!/usr/bin/env node

/**
 * VitalSense Enhanced Server Setup & Startup Script
 * Installs dependencies and starts the enhanced WebSocket server
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

class VitalSenseServerSetup {
  constructor() {
    this.serverDir = __dirname;
    this.isWindows = process.platform === 'win32';
  }

  async run() {
    console.log('🚀 VitalSense Enhanced Server Setup');
    console.log('==================================');
    console.log();

    try {
      await this.checkNodeVersion();
      await this.installDependencies();
      await this.createDataDirectory();
      await this.showConfiguration();
      await this.startServer();
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkNodeVersion() {
    console.log('🔍 Checking Node.js version...');
    const nodeVersion = process.version;
    const majorVersion = parseInt(nodeVersion.substring(1).split('.')[0]);

    if (majorVersion < 16) {
      throw new Error(
        `Node.js version ${nodeVersion} is not supported. Please upgrade to Node.js 16 or later.`
      );
    }

    console.log(`✅ Node.js ${nodeVersion} - OK`);
    console.log();
  }

  async installDependencies() {
    console.log('📦 Installing server dependencies...');

    const packageManager = fs.existsSync('package-lock.json')
      ? 'npm'
      : fs.existsSync('yarn.lock')
        ? 'yarn'
        : 'npm';

    const installCmd =
      packageManager === 'yarn' ? 'yarn install' : 'npm install';

    return new Promise((resolve, reject) => {
      const [cmd, ...args] = installCmd.split(' ');
      const install = spawn(cmd, args, {
        cwd: this.serverDir,
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: this.isWindows,
      });

      let output = '';
      install.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write('.');
      });

      install.stderr.on('data', (data) => {
        output += data.toString();
      });

      install.on('close', (code) => {
        console.log();
        if (code === 0) {
          console.log('✅ Dependencies installed successfully');
          console.log();
          resolve();
        } else {
          console.error('❌ Failed to install dependencies');
          console.error(output);
          reject(new Error(`Installation failed with code ${code}`));
        }
      });
    });
  }

  async createDataDirectory() {
    console.log('📁 Creating data directory...');

    const dataDir = path.join(this.serverDir, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
      console.log('✅ Data directory created: ./data');
    } else {
      console.log('✅ Data directory already exists');
    }
    console.log();
  }

  async showConfiguration() {
    console.log('⚙️  Server Configuration:');
    console.log('========================');
    console.log(`Port: ${process.env.PORT || 3001}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(
      `JWT Secret: ${process.env.JWT_SECRET ? '***configured***' : 'using default (dev only)'}`
    );
    console.log(
      `Data Retention: ${process.env.DATA_RETENTION_DAYS || 30} days`
    );
    console.log(`Database: SQLite (./data/vitalsense-production.db)`);
    console.log();

    const allowedOrigins =
      process.env.ALLOWED_ORIGINS ||
      'http://localhost:5173,http://127.0.0.1:8789,http://localhost:5000,https://health.andernet.dev';
    console.log('🌐 Allowed Origins:');
    allowedOrigins.split(',').forEach((origin) => {
      console.log(`   - ${origin.trim()}`);
    });
    console.log();
  }

  async startServer() {
    console.log('🚀 Starting VitalSense Enhanced Server...');
    console.log('========================================');
    console.log();

    const serverScript = 'vitalsense-enhanced-server.js';
    const env = process.env.NODE_ENV || 'development';

    // Set up environment
    const serverEnv = {
      ...process.env,
      NODE_ENV: env,
      PORT: process.env.PORT || '3001',
      JWT_SECRET:
        process.env.JWT_SECRET ||
        process.env.DEVICE_JWT_SECRET ||
        'dev-local-secret-change-in-production',
      DATA_RETENTION_DAYS: process.env.DATA_RETENTION_DAYS || '30',
      ALLOWED_ORIGINS:
        process.env.ALLOWED_ORIGINS ||
        'http://localhost:5173,http://127.0.0.1:8789,http://localhost:5000,https://health.andernet.dev',
    };

    const server = spawn('node', [serverScript], {
      cwd: this.serverDir,
      stdio: 'inherit',
      env: serverEnv,
      shell: this.isWindows,
    });

    server.on('error', (error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });

    server.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
      process.exit(code);
    });

    // Handle graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n🛑 Received SIGINT, shutting down gracefully...');
      server.kill('SIGTERM');
    });

    process.on('SIGTERM', () => {
      console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
      server.kill('SIGTERM');
    });
  }
}

// Show usage information
function showUsage() {
  console.log(`
🔧 VitalSense Enhanced Server Commands:

Development:
  npm run dev              Start in development mode (auto-restart)
  npm run dev:watch        Start with file watching (nodemon)
  node start-enhanced.js   Install dependencies and start

Production:
  npm start               Start in production mode
  NODE_ENV=production npm start

Legacy (original server):
  npm run legacy          Start original websocket-server.js
  npm run legacy:dev      Start original with nodemon

Environment Variables:
  PORT=3001                    Server port (default: 3001)
  NODE_ENV=development         Environment (development/production)
  JWT_SECRET=your-secret       JWT secret for authentication
  DATA_RETENTION_DAYS=30       How long to keep health data
  ALLOWED_ORIGINS=...          Comma-separated list of allowed origins

Examples:
  PORT=8080 npm run dev                    # Start on port 8080
  NODE_ENV=production npm start           # Production mode
  JWT_SECRET=mysecret npm run dev          # With custom JWT secret

Server Endpoints:
  WebSocket: ws://localhost:3001/ws
  Health Check: http://localhost:3001/api/health
  API Docs: http://localhost:3001/api/
`);
}

// Run the setup if this script is executed directly
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    showUsage();
    process.exit(0);
  }

  const setup = new VitalSenseServerSetup();
  setup.run().catch(console.error);
}

module.exports = { VitalSenseServerSetup };
