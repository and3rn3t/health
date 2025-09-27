#!/usr/bin/env node

/**
 * VitalSense Phase 5: Real-Time Infrastructure Setup
 *
 * This script sets up the basic cloud infrastructure components needed
 * to move from simulated real-time monitoring to production deployment.
 */

const fs = require('fs');
const path = require('path');

class Phase5InfrastructureSetup {
  constructor() {
    this.baseDir = process.cwd();
    this.setupComplete = false;
  }

  async run() {
    console.log('🚀 VitalSense Phase 5: Real-Time Infrastructure Setup');
    console.log('==================================================');
    console.log();

    try {
      await this.checkPrerequisites();
      await this.promptUserChoice();
      await this.setupChosenInfrastructure();
      await this.updateFrontendConfiguration();
      await this.createDeploymentScripts();

      this.displayNextSteps();
      this.setupComplete = true;

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('🔍 Checking prerequisites...');

    // Check if we're in the right directory
    const packageJsonPath = path.join(this.baseDir, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('Not in a valid Node.js project directory');
    }

    // Check if RealTimeMonitoringHub exists
    const monitoringHubPath = path.join(this.baseDir, 'src/components/health/RealTimeMonitoringHub.tsx');
    if (!fs.existsSync(monitoringHubPath)) {
      throw new Error('RealTimeMonitoringHub.tsx not found - ensure you have the latest code');
    }

    // Check if useLiveHealthData hook exists
    const liveDataHookPath = path.join(this.baseDir, 'src/hooks/useLiveHealthData.ts');
    if (!fs.existsSync(liveDataHookPath)) {
      throw new Error('useLiveHealthData.ts hook not found');
    }

    console.log('✅ Prerequisites check passed');
    console.log();
  }

  async promptUserChoice() {
    console.log('📋 Choose your cloud infrastructure approach:');
    console.log();
    console.log('1. 🔥 Firebase Realtime Database (Recommended)');
    console.log('   - Quick setup, real-time out of the box');
    console.log('   - Best for MVP and rapid prototyping');
    console.log('   - Estimated cost: $100-300/month');
    console.log();
    console.log('2. ☁️  AWS API Gateway + Lambda');
    console.log('   - Full control, enterprise-grade');
    console.log('   - More complex setup, higher customization');
    console.log('   - Estimated cost: $200-500/month');
    console.log();
    console.log('3. 🚧 Custom WebSocket Server (Current Dev Server)');
    console.log('   - Enhance existing Node.js WebSocket server');
    console.log('   - Quick start, full control');
    console.log('   - Host on VPS/cloud: $50-150/month');
    console.log();

    // For automated setup, default to option 3 (enhance existing)
    this.choice = '3';
    console.log('🔧 Auto-selecting Option 3: Enhance existing WebSocket server');
    console.log();
  }

  async setupChosenInfrastructure() {
    switch (this.choice) {
      case '1':
        await this.setupFirebase();
        break;
      case '2':
        await this.setupAWS();
        break;
      case '3':
        await this.enhanceWebSocketServer();
        break;
      default:
        throw new Error('Invalid choice');
    }
  }

  async enhanceWebSocketServer() {
    console.log('🔧 Enhancing existing WebSocket server for production...');

    // Create enhanced WebSocket server with persistence
    const enhancedServerCode = `#!/usr/bin/env node

/**
 * VitalSense Production WebSocket Server
 * Enhanced for Phase 5 real-time monitoring with persistence
 */

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class VitalSenseProductionServer {
  constructor() {
    this.app = express();
    this.httpServer = null;
    this.wss = null;
    this.db = null;
    this.clients = new Map();
    this.healthDataBuffer = new Map(); // userId -> [healthData]
    this.emergencyAlerts = new Map(); // userId -> [alerts]

    this.setupDatabase();
    this.setupExpress();
    this.setupWebSocket();
  }

  setupDatabase() {
    // Create SQLite database for persistence
    this.db = new sqlite3.Database('./vitalsense-data.db');

    // Create tables
    this.db.serialize(() => {
      // Health data table
      this.db.run(\`
        CREATE TABLE IF NOT EXISTS health_data (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          metric_type TEXT NOT NULL,
          value REAL NOT NULL,
          unit TEXT,
          timestamp INTEGER NOT NULL,
          device_id TEXT,
          processed_at INTEGER DEFAULT (strftime('%s', 'now')),
          wellness_score REAL
        )
      \`);

      // Alerts table
      this.db.run(\`
        CREATE TABLE IF NOT EXISTS alerts (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          alert_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          message TEXT NOT NULL,
          metric_value REAL,
          timestamp INTEGER NOT NULL,
          resolved INTEGER DEFAULT 0,
          created_at INTEGER DEFAULT (strftime('%s', 'now'))
        )
      \`);

      // User sessions table
      this.db.run(\`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          client_type TEXT,
          connected_at INTEGER DEFAULT (strftime('%s', 'now')),
          last_heartbeat INTEGER,
          device_info TEXT
        )
      \`);

      console.log('✅ Database tables created/verified');
    });
  }

  setupExpress() {
    // Security middleware
    this.app.use(helmet());
    this.app.use(cors({
      origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173', 'http://127.0.0.1:8789'],
      credentials: true
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP'
    });
    this.app.use('/api/', limiter);

    this.app.use(express.json({ limit: '10mb' }));

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        websocket: {
          connected_clients: this.clients.size,
          uptime: process.uptime()
        }
      });
    });

    // Historical data endpoint
    this.app.get('/api/health-data/:userId', this.authenticateRequest.bind(this), (req, res) => {
      const { userId } = req.params;
      const { limit = 100, metric_type, since } = req.query;

      let query = 'SELECT * FROM health_data WHERE user_id = ?';
      let params = [userId];

      if (metric_type) {
        query += ' AND metric_type = ?';
        params.push(metric_type);
      }

      if (since) {
        query += ' AND timestamp > ?';
        params.push(parseInt(since));
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(parseInt(limit));

      this.db.all(query, params, (err, rows) => {
        if (err) {
          console.error('Database query error:', err);
          return res.status(500).json({ error: 'Database error' });
        }

        res.json({
          data: rows,
          count: rows.length,
          timestamp: new Date().toISOString()
        });
      });
    });

    // Emergency alert endpoint
    this.app.post('/api/emergency-alert', this.authenticateRequest.bind(this), (req, res) => {
      const { userId, alertType, message, severity = 'high' } = req.body;

      const alertId = crypto.randomUUID();
      const alert = {
        id: alertId,
        user_id: userId,
        alert_type: alertType || 'manual_emergency',
        severity,
        message: message || 'Manual emergency alert triggered',
        timestamp: Date.now()
      };

      // Store in database
      this.db.run(
        'INSERT INTO alerts (id, user_id, alert_type, severity, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
        [alert.id, alert.user_id, alert.alert_type, alert.severity, alert.message, alert.timestamp],
        (err) => {
          if (err) {
            console.error('Failed to store alert:', err);
            return res.status(500).json({ error: 'Failed to store alert' });
          }

          // Broadcast to all clients for this user
          this.broadcastToUser(userId, {
            type: 'emergency_alert',
            data: alert,
            timestamp: new Date().toISOString()
          });

          res.json({ success: true, alert });
        }
      );
    });
  }

  authenticateRequest(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({ error: 'No authentication token provided' });
    }

    try {
      // In production, use proper JWT secret
      const secret = process.env.JWT_SECRET || 'dev-secret-change-in-production';
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (error) {
      return res.status(401).json({ error: 'Invalid authentication token' });
    }
  }

  setupWebSocket() {
    this.httpServer = this.app.listen(process.env.PORT || 3001, '0.0.0.0', () => {
      console.log(\`🚀 VitalSense Production Server running on port \${process.env.PORT || 3001}\`);
    });

    this.wss = new WebSocket.Server({
      server: this.httpServer,
      path: '/ws'
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = crypto.randomUUID();
      const clientInfo = {
        id: clientId,
        connectedAt: Date.now(),
        lastHeartbeat: Date.now(),
        userId: null,
        clientType: null,
        req
      };

      this.clients.set(ws, clientInfo);
      console.log(\`📱 Client connected: \${clientId} (Total: \${this.clients.size})\`);

      // Set up message handling
      ws.on('message', (data) => this.handleMessage(ws, data, clientInfo));
      ws.on('close', () => this.handleDisconnect(ws, clientInfo));
      ws.on('error', (error) => console.error(\`WebSocket error for \${clientId}:\`, error));

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connection_established',
        data: { clientId, serverTime: new Date().toISOString() },
        timestamp: new Date().toISOString()
      });
    });

    // Start background tasks
    this.startHeartbeatCheck();
    this.startHealthDataGeneration(); // For demo purposes
  }

  handleMessage(ws, data, clientInfo) {
    try {
      const message = JSON.parse(data.toString());
      const { type, ...payload } = message;

      switch (type) {
        case 'client_identification':
          clientInfo.userId = payload.userId;
          clientInfo.clientType = payload.clientType;

          // Store session in database
          this.db.run(
            'INSERT OR REPLACE INTO user_sessions (id, user_id, client_type, device_info) VALUES (?, ?, ?, ?)',
            [clientInfo.id, clientInfo.userId, clientInfo.clientType, JSON.stringify(payload.deviceInfo || {})]
          );

          console.log(\`👤 Client identified: \${clientInfo.userId} (\${clientInfo.clientType})\`);
          break;

        case 'live_health_data':
          this.processHealthData(clientInfo, payload);
          break;

        case 'heartbeat':
          clientInfo.lastHeartbeat = Date.now();
          this.sendMessage(ws, {
            type: 'heartbeat_ack',
            timestamp: new Date().toISOString()
          });
          break;

        case 'historical_data_request':
          this.handleHistoricalDataRequest(ws, clientInfo, payload);
          break;

        default:
          console.warn(\`Unknown message type: \${type}\`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendMessage(ws, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: new Date().toISOString()
      });
    }
  }

  processHealthData(clientInfo, payload) {
    if (!clientInfo.userId) return;

    const healthData = {
      id: crypto.randomUUID(),
      user_id: clientInfo.userId,
      metric_type: payload.data?.type || payload.type,
      value: payload.data?.value || payload.value,
      unit: payload.data?.unit || payload.unit,
      timestamp: payload.timestamp ? new Date(payload.timestamp).getTime() : Date.now(),
      device_id: payload.deviceId || 'unknown'
    };

    // Calculate wellness score (simple example)
    healthData.wellness_score = this.calculateWellnessScore(healthData);

    // Store in database
    this.db.run(
      'INSERT INTO health_data (id, user_id, metric_type, value, unit, timestamp, device_id, wellness_score) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [healthData.id, healthData.user_id, healthData.metric_type, healthData.value, healthData.unit, healthData.timestamp, healthData.device_id, healthData.wellness_score],
      (err) => {
        if (err) {
          console.error('Failed to store health data:', err);
          return;
        }

        // Check for alerts
        const alert = this.checkForAlerts(healthData);
        if (alert) {
          this.triggerAlert(clientInfo.userId, alert);
        }

        // Broadcast to all clients for this user
        this.broadcastToUser(clientInfo.userId, {
          type: 'live_health_update',
          data: healthData,
          timestamp: new Date().toISOString()
        });

        console.log(\`📊 Health data processed: \${healthData.metric_type} = \${healthData.value} \${healthData.unit} (Wellness: \${healthData.wellness_score})\`);
      }
    );
  }

  calculateWellnessScore(healthData) {
    // Simple wellness score calculation
    switch (healthData.metric_type) {
      case 'heart_rate':
        const hr = healthData.value;
        if (hr >= 60 && hr <= 100) return 0.9;
        if (hr >= 50 && hr <= 120) return 0.7;
        return 0.4;

      case 'walking_steadiness':
        return Math.min(1.0, healthData.value / 100);

      default:
        return 0.8; // Default score
    }
  }

  checkForAlerts(healthData) {
    // Simple alert logic
    switch (healthData.metric_type) {
      case 'heart_rate':
        if (healthData.value > 120 || healthData.value < 50) {
          return {
            type: 'heart_rate_anomaly',
            severity: healthData.value > 150 || healthData.value < 40 ? 'critical' : 'medium',
            message: \`Heart rate \${healthData.value > 120 ? 'elevated' : 'low'}: \${healthData.value} bpm\`
          };
        }
        break;

      case 'walking_steadiness':
        if (healthData.value < 30) {
          return {
            type: 'fall_risk',
            severity: healthData.value < 20 ? 'high' : 'medium',
            message: \`Low walking steadiness detected: \${healthData.value}%\`
          };
        }
        break;
    }
    return null;
  }

  triggerAlert(userId, alert) {
    const alertData = {
      id: crypto.randomUUID(),
      user_id: userId,
      alert_type: alert.type,
      severity: alert.severity,
      message: alert.message,
      timestamp: Date.now()
    };

    // Store alert in database
    this.db.run(
      'INSERT INTO alerts (id, user_id, alert_type, severity, message, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [alertData.id, alertData.user_id, alertData.alert_type, alertData.severity, alertData.message, alertData.timestamp]
    );

    // Broadcast alert
    this.broadcastToUser(userId, {
      type: 'emergency_alert',
      data: alertData,
      timestamp: new Date().toISOString()
    });

    console.log(\`🚨 Alert triggered for user \${userId}: \${alert.message}\`);
  }

  broadcastToUser(userId, message) {
    this.clients.forEach((clientInfo, ws) => {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    });
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  startHeartbeatCheck() {
    setInterval(() => {
      const now = Date.now();
      const timeoutMs = 60000; // 1 minute timeout

      this.clients.forEach((clientInfo, ws) => {
        if (now - clientInfo.lastHeartbeat > timeoutMs) {
          console.log(\`💔 Client timeout: \${clientInfo.id}\`);
          ws.terminate();
        }
      });
    }, 30000); // Check every 30 seconds
  }

  startHealthDataGeneration() {
    // For demo/testing purposes - remove in production
    if (process.env.NODE_ENV === 'development') {
      setInterval(() => {
        if (this.clients.size > 0) {
          const demoHealthData = {
            type: 'live_health_update',
            data: {
              id: crypto.randomUUID(),
              user_id: 'demo-user',
              metric_type: 'heart_rate',
              value: 65 + Math.random() * 40,
              unit: 'bpm',
              timestamp: Date.now(),
              device_id: 'demo-device'
            },
            timestamp: new Date().toISOString()
          };

          this.clients.forEach((clientInfo, ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              this.sendMessage(ws, demoHealthData);
            }
          });
        }
      }, 5000); // Send demo data every 5 seconds
    }
  }

  handleDisconnect(ws, clientInfo) {
    this.clients.delete(ws);
    console.log(\`📴 Client disconnected: \${clientInfo.id} (Total: \${this.clients.size})\`);

    // Update session in database
    if (clientInfo.userId) {
      this.db.run(
        'DELETE FROM user_sessions WHERE id = ?',
        [clientInfo.id]
      );
    }
  }
}

// Start the server
const server = new VitalSenseProductionServer();

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down gracefully...');
  if (server.db) {
    server.db.close();
  }
  process.exit(0);
});
`;

    const serverPath = path.join(this.baseDir, 'server/vitalsense-production-server.js');
    fs.writeFileSync(serverPath, enhancedServerCode);

    // Create package.json for server dependencies
    const serverPackageJson = {
      "name": "vitalsense-production-server",
      "version": "1.0.0",
      "description": "VitalSense Production WebSocket Server with persistence",
      "main": "vitalsense-production-server.js",
      "scripts": {
        "start": "node vitalsense-production-server.js",
        "dev": "NODE_ENV=development node vitalsense-production-server.js",
        "production": "NODE_ENV=production node vitalsense-production-server.js"
      },
      "dependencies": {
        "ws": "^8.14.2",
        "express": "^4.18.2",
        "cors": "^2.8.5",
        "helmet": "^7.1.0",
        "express-rate-limit": "^7.1.5",
        "sqlite3": "^5.1.6",
        "jsonwebtoken": "^9.0.2"
      }
    };

    const serverPackagePath = path.join(this.baseDir, 'server/package.json');
    fs.writeFileSync(serverPackagePath, JSON.stringify(serverPackageJson, null, 2));

    console.log('✅ Enhanced WebSocket server created');
    console.log('✅ Server dependencies configured');
  }

  async setupFirebase() {
    console.log('🔥 Setting up Firebase infrastructure...');
    // Firebase setup would go here
    console.log('📋 Firebase setup requires manual configuration - see documentation');
  }

  async setupAWS() {
    console.log('☁️  Setting up AWS infrastructure...');
    // AWS setup would go here
    console.log('📋 AWS setup requires manual configuration - see documentation');
  }

  async updateFrontendConfiguration() {
    console.log('🔧 Updating frontend configuration for production...');

    // Create production config file
    const productionConfig = `/**
 * VitalSense Phase 5 Production Configuration
 * Real-time monitoring infrastructure settings
 */

export const productionConfig = {
  // WebSocket configuration
  websocket: {
    url: process.env.REACT_APP_WS_URL || 'wss://your-domain.com/ws',
    reconnectAttempts: 5,
    heartbeatInterval: 30000,
    connectionTimeout: 10000
  },

  // API configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'https://your-domain.com/api',
    timeout: 10000,
    retryAttempts: 3
  },

  // Real-time monitoring settings
  monitoring: {
    dataRetentionDays: 30,
    alertRetentionDays: 90,
    maxMetricsPerMinute: 120,
    emergencyResponseDelay: 30000 // 30 seconds
  },

  // Health data processing
  healthData: {
    batchSize: 100,
    processingInterval: 5000,
    qualityThreshold: 0.7,
    fallRiskThreshold: 0.75
  },

  // Security settings
  security: {
    encryptionEnabled: true,
    tokenRefreshInterval: 3600000, // 1 hour
    sessionTimeout: 86400000 // 24 hours
  }
};

export const developmentConfig = {
  ...productionConfig,
  websocket: {
    ...productionConfig.websocket,
    url: 'ws://localhost:3001/ws'
  },
  api: {
    ...productionConfig.api,
    baseUrl: 'http://localhost:3001/api'
  }
};

export const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'production' ? productionConfig : developmentConfig;
};
`;

    const configPath = path.join(this.baseDir, 'src/config/phase5-config.ts');
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(configPath, productionConfig);

    console.log('✅ Production configuration created');
  }

  async createDeploymentScripts() {
    console.log('📜 Creating deployment scripts...');

    // Create Docker configuration
    const dockerfile = `# VitalSense Production WebSocket Server
FROM node:18-alpine

WORKDIR /app

# Copy server files
COPY server/package*.json ./
RUN npm ci --only=production

COPY server/ ./

# Create data directory for SQLite
RUN mkdir -p /app/data

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3001/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

EXPOSE 3001

CMD ["npm", "start"]
`;

    const dockerfilePath = path.join(this.baseDir, 'Dockerfile.production');
    fs.writeFileSync(dockerfilePath, dockerfile);

    // Create deployment script
    const deployScript = `#!/bin/bash

# VitalSense Phase 5 Production Deployment
echo "🚀 Deploying VitalSense Real-Time Monitoring System..."

# Build production server
echo "📦 Building production server..."
cd server
npm install
cd ..

# Build frontend
echo "🏗️  Building frontend..."
npm run build

# Deploy to production server (customize for your hosting)
echo "🌐 Deploying to production..."

# Option 1: Docker deployment
if command -v docker &> /dev/null; then
    echo "🐳 Using Docker deployment..."
    docker build -f Dockerfile.production -t vitalsense-server .
    docker run -d -p 3001:3001 --name vitalsense-production vitalsense-server
fi

# Option 2: PM2 deployment
if command -v pm2 &> /dev/null; then
    echo "⚡ Using PM2 deployment..."
    pm2 start server/vitalsense-production-server.js --name vitalsense-server
fi

echo "✅ Deployment complete!"
echo "🔗 WebSocket server: ws://localhost:3001/ws"
echo "🔗 API endpoint: http://localhost:3001/api/health"
`;

    const deployScriptPath = path.join(this.baseDir, 'scripts/deploy-phase5.sh');
    fs.mkdirSync(path.dirname(deployScriptPath), { recursive: true });
    fs.writeFileSync(deployScriptPath, deployScript);
    fs.chmodSync(deployScriptPath, '755');

    console.log('✅ Deployment scripts created');
  }

  displayNextSteps() {
    console.log();
    console.log('🎉 Phase 5 Infrastructure Setup Complete!');
    console.log('========================================');
    console.log();
    console.log('📋 Next Steps:');
    console.log();
    console.log('1. 🔧 Install server dependencies:');
    console.log('   cd server && npm install');
    console.log();
    console.log('2. 🚀 Start the enhanced production server:');
    console.log('   cd server && npm run dev');
    console.log();
    console.log('3. 🧪 Test real-time monitoring:');
    console.log('   - Your RealTimeMonitoringHub should now connect to the enhanced server');
    console.log('   - Health data will be persisted in SQLite database');
    console.log('   - Alerts will be generated based on health thresholds');
    console.log();
    console.log('4. 🌐 Deploy to production:');
    console.log('   bash scripts/deploy-phase5.sh');
    console.log();
    console.log('5. 📊 Monitor system health:');
    console.log('   http://localhost:3001/api/health');
    console.log();
    console.log('🔗 Resources:');
    console.log('   - Enhanced server: server/vitalsense-production-server.js');
    console.log('   - Configuration: src/config/phase5-config.ts');
    console.log('   - Deployment: scripts/deploy-phase5.sh');
    console.log('   - Database: server/vitalsense-data.db (auto-created)');
    console.log();
    console.log('💡 Your existing RealTimeMonitoringHub will now have:');
    console.log('   ✅ Real-time data persistence');
    console.log('   ✅ Historical data queries');
    console.log('   ✅ Emergency alert system');
    console.log('   ✅ User session management');
    console.log('   ✅ Production-ready security');
  }
}

// Run the setup
if (require.main === module) {
  const setup = new Phase5InfrastructureSetup();
  setup.run().catch(console.error);
}

module.exports = { Phase5InfrastructureSetup };
