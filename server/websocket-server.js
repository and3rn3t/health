const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { z } = require('zod');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim());
app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // allow tools like curl
      if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);
app.use(express.json());

// Store active connections and health data
const connections = new Map();
const healthDataBuffer = new Map();
const userSessions = new Map();
const PAGE_SIZE = Number(process.env.WS_PAGE_SIZE || 25);

// Schemas for basic validation and envelope enforcement
const envelopeSchema = z.object({
  type: z.enum([
    'connection_established',
    'live_health_update',
    'historical_data_update',
    'emergency_alert',
    'error',
    'pong',
  ]),
  data: z.unknown().optional(),
  timestamp: z.string().datetime().optional(),
});

const inboundMessageSchema = z.object({
  type: z.string(),
  data: z.unknown().optional(),
  clientType: z.string().optional(),
  userId: z.string().optional(),
  apiKey: z.string().optional(),
  headers: z.record(z.string()).optional(),
  metrics: z.array(z.string()).optional(),
  cursor: z.string().optional(),
});

const healthMetricSchema = z.object({
  type: z.enum([
    'heart_rate',
    'walking_steadiness',
    'steps',
    'oxygen_saturation',
  ]),
  value: z.number(),
  unit: z.string().optional(),
});

class HealthDataProcessor {
  static processLiveHealthData(data) {
    const processed = {
      ...data,
      processedAt: new Date().toISOString(),
      validated: true,
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
    if (heartRate > 150)
      return { level: 'critical', message: 'Heart rate critically high' };
    if (heartRate < 40)
      return { level: 'critical', message: 'Heart rate critically low' };
    if (heartRate > 120)
      return { level: 'warning', message: 'Heart rate elevated' };
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
    if (steadiness < 40)
      return { level: 'critical', message: 'Fall risk critically high' };
    if (steadiness < 60)
      return { level: 'warning', message: 'Fall risk elevated' };
    return null;
  }
}

// WebSocket connection handler
wss.on('connection', (ws, req) => {
  // Enforce allowed origins for WS upgrades (best-effort; Node bridge only)
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.length && !ALLOWED_ORIGINS.includes(origin)) {
    try {
      ws.close(4403, 'forbidden');
    } catch {}
    return;
  }

  // Optional bearer check at connect time for local bridge (WS_BEARER or WS_API_KEY)
  const auth = req.headers['authorization'] || '';
  const bearer =
    auth && typeof auth === 'string' && auth.startsWith('Bearer ')
      ? auth.slice(7)
      : '';
  if (process.env.WS_BEARER && bearer && bearer !== process.env.WS_BEARER) {
    try {
      ws.close(4401, 'unauthorized');
    } catch {}
    return;
  }

  const clientId = generateClientId();
  const clientInfo = {
    id: clientId,
    type: 'unknown',
    connectedAt: new Date(),
    lastHeartbeat: new Date(),
  };

  connections.set(clientId, { ws, info: clientInfo });
  console.log(`Client connected: ${clientId}`);

  // Send welcome message
  sendEnvelope(ws, 'connection_established', { clientId });

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      const parsed = inboundMessageSchema.safeParse(data);
      if (!parsed.success) {
        sendEnvelope(ws, 'error', { message: 'Invalid message format' });
        return;
      }
      handleMessage(clientId, parsed.data);
    } catch (err) {
      // Handle parse error without exposing payload contents
      console.error('Invalid message format', {
        name: err && err.name ? err.name : 'Error',
      });
      sendEnvelope(ws, 'error', { message: 'Invalid message format' });
    }
  });

  ws.on('close', () => {
    connections.delete(clientId);
    console.log(`Client disconnected: ${clientId}`);
  });

  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
  });

  // Setup heartbeat (ws ping frames) and track client pongs
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

  const { info } = connection;

  switch (data.type) {
    case 'ping': {
      // App-level ping (in addition to WS-level ping)
      sendEnvelope(connection.ws, 'pong', {
        serverTime: new Date().toISOString(),
      });
      break;
    }
    case 'client_identification': {
      // Optional API key check for local bridge
      const apiKey = data.apiKey || (data.headers && data.headers['x-api-key']);
      const expected = process.env.WS_API_KEY;
      if (expected && apiKey !== expected) {
        connections.get(clientId)?.ws.close(4401, 'unauthorized');
        return;
      }
      info.type = data.clientType; // 'ios_app' or 'web_dashboard'
      info.userId = data.userId;
      console.log(`Client identified: ${clientId} as ${data.clientType}`);
      break;
    }

    case 'live_health_data':
      handleLiveHealthData(clientId, data.data);
      break;

    case 'historical_data':
      handleHistoricalData(clientId, data.data);
      break;

    case 'subscribe_health_updates':
      handleSubscription(clientId, data.metrics);
      break;

    case 'start_historical_backfill':
      startHistoricalBackfill(clientId, data && data.cursor);
      break;

    case 'get_more':
      // Request next page in historical backfill flow
      sendHistoricalPage(clientId, data && data.cursor);
      break;

    case 'emergency_alert':
      handleEmergencyAlert(clientId, data.data);
      break;

    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

function parseCursor(cursor) {
  if (!cursor || typeof cursor !== 'string') return 0;
  if (cursor.startsWith('offset:')) {
    const n = Number(cursor.slice('offset:'.length));
    return Number.isFinite(n) && n >= 0 ? n : 0;
  }
  return 0;
}

function getUserBuffer(userId) {
  const buf = healthDataBuffer.get(userId) || [];
  // newest first by processedAt
  return buf.slice().sort((a, b) => (a.processedAt < b.processedAt ? 1 : -1));
}

function startHistoricalBackfill(clientId, cursor) {
  const connection = connections.get(clientId);
  if (!connection) return;
  const userId = connection.info.userId;
  if (!userId) return;
  sendHistoricalPage(clientId, cursor);
}

function sendHistoricalPage(clientId, cursor) {
  const connection = connections.get(clientId);
  if (!connection) return;
  const ws = connection.ws;
  const userId = connection.info.userId;
  if (!userId || ws.readyState !== WebSocket.OPEN) return;

  const offset = parseCursor(cursor);
  const data = getUserBuffer(userId);
  const items = data.slice(offset, offset + PAGE_SIZE);
  const nextOffset = offset + items.length;
  const hasMore = nextOffset < data.length;
  const nextCursor = hasMore ? `offset:${nextOffset}` : undefined;
  try {
    sendEnvelope(ws, 'historical_data_update', { items, nextCursor });
  } catch (e) {
    console.warn(
      'WS send failed in historical page',
      e && e.message ? e.message : ''
    );
  }
}

function handleLiveHealthData(clientId, healthData) {
  const connection = connections.get(clientId);
  if (!connection || connection.info.type !== 'ios_app') return;

  // Validate minimal inbound metric shape (best-effort)
  const metricValid = healthMetricSchema.safeParse(healthData);
  if (!metricValid.success) {
    sendEnvelope(connection.ws, 'error', { message: 'invalid_metric' });
    return;
  }

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
  broadcastToWebClients(userId, (ws) =>
    sendEnvelope(ws, 'live_health_update', processedData)
  );

  // Check for emergency conditions
  if (processedData.alert && processedData.alert.level === 'critical') {
    handleEmergencyAlert(clientId, {
      type: 'health_alert',
      metric: healthData.type,
      value: healthData.value,
      alert: processedData.alert,
      at: new Date().toISOString(),
    });
  }

  // Do not log raw values in prod; keep minimal signal only
  console.log(`Health data received from ${clientId}:`, healthData.type);
}

function handleHistoricalData(clientId, historicalData) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const userId = connection.info.userId;

  // Broadcast historical data to web clients
  broadcastToWebClients(userId, (ws) =>
    sendEnvelope(ws, 'historical_data_update', historicalData)
  );

  console.log(
    `Historical data received from ${clientId}:`,
    historicalData.type
  );
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
  broadcastToAllClients(userId, (ws) =>
    sendEnvelope(ws, 'emergency_alert', alertData)
  );

  console.log(`Emergency alert from ${clientId}:`, alertData);

  // Here you would integrate with external emergency services
  // sendToEmergencyServices(userId, alertData);
}

function broadcastToWebClients(userId, sendFn) {
  connections.forEach(({ ws, info }) => {
    if (
      info.type === 'web_dashboard' &&
      info.userId === userId &&
      ws.readyState === WebSocket.OPEN
    ) {
      try {
        sendFn(ws);
      } catch (e) {
        /* ignore */
      }
    }
  });
}

function broadcastToAllClients(userId, sendFn) {
  connections.forEach(({ ws, info }) => {
    if (info.userId === userId && ws.readyState === WebSocket.OPEN) {
      try {
        sendFn(ws);
      } catch (e) {
        /* ignore */
      }
    }
  });
}

function generateClientId() {
  return 'client_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Helper to always send properly-shaped envelopes and guard outbound format
function sendEnvelope(ws, type, data) {
  const message = { type, data, timestamp: new Date().toISOString() };
  const valid = envelopeSchema.safeParse(message);
  if (!valid.success) return; // drop invalid envelope silently
  ws.send(JSON.stringify(message));
}

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    connections: connections.size,
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/users/:userId/health-data', (req, res) => {
  const userId = req.params.userId;
  const userBuffer = healthDataBuffer.get(userId) || [];

  res.json({
    userId: userId,
    dataPoints: userBuffer.length,
    latestData: userBuffer.slice(-10), // Last 10 readings
    timestamp: new Date().toISOString(),
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
    priority: 'critical',
  });

  res.json({
    status: 'emergency_alert_sent',
    userId: userId,
    timestamp: new Date().toISOString(),
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
