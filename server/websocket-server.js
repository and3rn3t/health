const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// Store active connections and health data
const connections = new Map();
const healthDataBuffer = new Map();
const userSessions = new Map();

class HealthDataProcessor {
  static processLiveHealthData(data) {
    const processed = {
      ...data,
      processedAt: new Date().toISOString(),
      validated: true
    };

    // Add health score calculation
    if (data.type === 'heart_rate') {
      processed.healthScore = this.calculateHeartRateScore(data.value);
      processed.alert = this.checkHeartRateAlerts(data.value);
    }

    if (data.type === 'walking_steadiness') {
      processed.fallRisk = this.calculateFallRisk(data.value);
      processed.alert = this.checkFallRiskAlerts(data.value);
    }

    return processed;
  }

  static calculateHeartRateScore(heartRate) {
    // Normal resting heart rate: 60-100 bpm
    if (heartRate >= 60 && heartRate <= 100) return 100;
    if (heartRate >= 50 && heartRate < 60) return 85;
    if (heartRate > 100 && heartRate <= 120) return 75;
    if (heartRate > 120 || heartRate < 50) return 40;
    return 0;
  }

  static checkHeartRateAlerts(heartRate) {
    if (heartRate > 150) return { level: 'critical', message: 'Heart rate critically high' };
    if (heartRate < 40) return { level: 'critical', message: 'Heart rate critically low' };
    if (heartRate > 120) return { level: 'warning', message: 'Heart rate elevated' };
    return null;
  }

  static calculateFallRisk(steadiness) {
    // Walking steadiness is typically 0-100%
    if (steadiness >= 80) return 'low';
    if (steadiness >= 60) return 'moderate';
    if (steadiness >= 40) return 'high';
    return 'critical';
  }

  static checkFallRiskAlerts(steadiness) {
    if (steadiness < 40) return { level: 'critical', message: 'Fall risk critically high' };
    if (steadiness < 60) return { level: 'warning', message: 'Fall risk elevated' };
    return null;
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  const clientId = generateClientId();
  const clientInfo = {
    id: clientId,
    type: 'unknown',
    connectedAt: new Date(),
    lastHeartbeat: new Date()
  };

  connections.set(clientId, { ws, info: clientInfo });
  console.log(`Client connected: ${clientId}`);

  // Send welcome message
  ws.send(JSON.stringify({
    type: 'connection_established',
    clientId: clientId,
    timestamp: new Date().toISOString()
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleMessage(clientId, data);
    } catch (error) {
      console.error('Invalid message format:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });

  ws.on('close', () => {
    connections.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });

  // Setup heartbeat
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
    } else {
      clearInterval(heartbeatInterval);
      connections.delete(clientId);
    }
  }, 30000);

  ws.on('pong', () => {
    if (connections.has(clientId)) {
      connections.get(clientId).info.lastHeartbeat = new Date();
    }
  });
});

function handleMessage(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const { ws, info } = connection;

  switch (data.type) {
    case 'client_identification':
      info.type = data.clientType; // 'ios_app' or 'web_dashboard'
      info.userId = data.userId;
      console.log(`Client identified: ${clientId} as ${data.clientType}`);
      break;

    case 'live_health_data':
      handleLiveHealthData(clientId, data.data);
      break;

    case 'historical_data':
      handleHistoricalData(clientId, data.data);
      break;

    case 'subscribe_health_updates':
      handleSubscription(clientId, data.metrics);
      break;

    case 'emergency_alert':
      handleEmergencyAlert(clientId, data.data);
      break;

    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

function handleLiveHealthData(clientId, healthData) {
  const connection = connections.get(clientId);
  if (!connection || connection.info.type !== 'ios_app') return;

  // Process the health data
  const processedData = HealthDataProcessor.processLiveHealthData(healthData);

  // Store in buffer
  const userId = connection.info.userId;
  if (!healthDataBuffer.has(userId)) {
    healthDataBuffer.set(userId, []);
  }
  healthDataBuffer.get(userId).push(processedData);

  // Keep only last 1000 readings per user
  const userBuffer = healthDataBuffer.get(userId);
  if (userBuffer.length > 1000) {
    userBuffer.splice(0, userBuffer.length - 1000);
  }

  // Broadcast to all web dashboard clients for this user
  broadcastToWebClients(userId, {
    type: 'live_health_update',
    data: processedData,
    timestamp: new Date().toISOString()
  });

  // Check for emergency conditions
  if (processedData.alert && processedData.alert.level === 'critical') {
    handleEmergencyAlert(clientId, {
      type: 'health_alert',
      metric: healthData.type,
      value: healthData.value,
      alert: processedData.alert,
      timestamp: new Date().toISOString()
    });
  }

  console.log(`Health data received from ${clientId}:`, healthData.type, healthData.value);
}

function handleHistoricalData(clientId, historicalData) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const userId = connection.info.userId;

  // Broadcast historical data to web clients
  broadcastToWebClients(userId, {
    type: 'historical_data_update',
    data: historicalData,
    timestamp: new Date().toISOString()
  });

  console.log(`Historical data received from ${clientId}:`, historicalData.type);
}

function handleSubscription(clientId, metrics) {
  const connection = connections.get(clientId);
  if (!connection) return;

  connection.info.subscribedMetrics = metrics;
  console.log(`Client ${clientId} subscribed to metrics:`, metrics);
}

function handleEmergencyAlert(clientId, alertData) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const userId = connection.info.userId;

  // Broadcast emergency alert to all clients for this user
  broadcastToAllClients(userId, {
    type: 'emergency_alert',
    data: alertData,
    timestamp: new Date().toISOString(),
    priority: 'critical'
  });

  console.log(`Emergency alert from ${clientId}:`, alertData);

  // Here you would integrate with external emergency services
  // sendToEmergencyServices(userId, alertData);
}

function broadcastToWebClients(userId, message) {
  connections.forEach(({ ws, info }) => {
    if (info.type === 'web_dashboard' &&
        info.userId === userId &&
        ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToAllClients(userId, message) {
  connections.forEach(({ ws, info }) => {
    if (info.userId === userId && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function generateClientId() {
  return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: connections.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

app.get('/api/users/:userId/health-data', (req, res) => {
  const userId = req.params.userId;
  const userBuffer = healthDataBuffer.get(userId) || [];

  res.json({
    userId: userId,
    dataPoints: userBuffer.length,
    latestData: userBuffer.slice(-10), // Last 10 readings
    timestamp: new Date().toISOString()
  });
});

app.post('/api/users/:userId/emergency', (req, res) => {
  const userId = req.params.userId;
  const emergencyData = req.body;

  // Broadcast emergency to all clients for this user
  broadcastToAllClients(userId, {
    type: 'emergency_alert',
    data: emergencyData,
    timestamp: new Date().toISOString(),
    priority: 'critical'
  });

  res.json({
    status: 'emergency_alert_sent',
    userId: userId,
    timestamp: new Date().toISOString()
  });
});

// Error handling
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Health monitoring WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}`);
  console.log(`REST API endpoint: http://localhost:${PORT}/api`);
});

module.exports = { app, server, wss };
