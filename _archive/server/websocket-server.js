const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const cors = require('cors');
const { z } = require('zod');
const crypto = require('crypto');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  'http://localhost:5173,http://localhost:5000,http://127.0.0.1:5000'
)
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
    'client_presence',
    'client_identification',
    'ping',
    'heart_rate_alert',
    'fall_risk_alert',
    'gait_data',
    'posture_data',
    'posture_alert',
    'walking_coaching_data',
    'walking_quality_update',
    'fall_risk_update',
    'real_time_gait_metrics',
    'device_status',
  ]),
  data: z.unknown().optional(),
  timestamp: z.string().datetime().optional(),
});

const liveHealthDataSchema = z.object({
  type: z.enum([
    'heart_rate',
    'walking_steadiness',
    'step_count',
    'fall_detected',
  ]),
  value: z.number(),
  unit: z.string(),
  timestamp: z.number(),
  source: z.string().optional(),
});

const historicalDataSchema = z.object({
  type: z.enum(['heart_rate', 'walking_steadiness', 'step_count']),
  samples: z.array(
    z.object({
      timestamp: z.number(),
      value: z.number(),
      unit: z.string(),
    })
  ),
});

const emergencyAlertSchema = z.object({
  metric_type: z.string(),
  alert_level: z.enum(['warning', 'critical']),
  message: z.string(),
  value: z.number(),
  timestamp: z.number(),
  user_id: z.string(),
});

const clientIdentificationSchema = z.object({
  clientType: z.enum(['ios_app', 'web_app', 'watch_app']),
  userId: z.string(),
  timestamp: z.string().optional(),
});

const inboundMessageSchema = z.object({
  type: z.string(),
  data: z.unknown().optional(),
  timestamp: z.string().optional(),
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

  // Optional JWT/Bearer check at connect time; prefer HS256 device token via query param "token"
  const url = new URL(req.url, 'http://localhost');
  const queryToken = url.searchParams.get('token') || '';
  const auth = req.headers['authorization'] || '';
  const bearer =
    auth && typeof auth === 'string' && auth.startsWith('Bearer ')
      ? auth.slice(7)
      : '';
  const token = queryToken || bearer;

  const deviceSecret = process.env.DEVICE_JWT_SECRET || '';
  let tokenClaims = null;
  if (deviceSecret && token) {
    const verified = verifyJwtHS256(token, deviceSecret, {
      iss: process.env.API_ISS || 'health-app',
      aud: process.env.API_AUD || 'ws-device',
    });
    if (!verified.ok) {
      try {
        ws.close(4401, 'unauthorized');
      } catch {}
      return;
    }
    tokenClaims = verified.claims;
  } else if (process.env.WS_BEARER && bearer) {
    if (bearer !== process.env.WS_BEARER) {
      try {
        ws.close(4401, 'unauthorized');
      } catch {}
      return;
    }
  }

  const clientId = generateClientId();
  const clientInfo = {
    id: clientId,
    type: 'unknown',
    connectedAt: new Date(),
    lastHeartbeat: new Date(),
  };

  // Seed identity from JWT claims if present
  if (tokenClaims && typeof tokenClaims === 'object') {
    clientInfo.userId =
      typeof tokenClaims.sub === 'string' ? tokenClaims.sub : undefined;
    const scope =
      typeof tokenClaims.scope === 'string' ? tokenClaims.scope : '';
    if (scope.startsWith('device:')) {
      const t = scope.split(':')[1];
      if (t === 'ios_app' || t === 'web_dashboard') clientInfo.type = t;
    }
  }

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
    // Presence off for user if this was an iOS client
    const uid = clientInfo.userId;
    if (uid && clientInfo.type === 'ios_app') {
      broadcastToAllClients(uid, (ws) =>
        sendEnvelope(ws, 'client_presence', {
          userId: uid,
          clientType: 'ios_app',
          status: 'offline',
        })
      );
    }
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
      const parsed = clientIdentificationSchema.safeParse(data.data || data);
      if (!parsed.success) {
        sendEnvelope(connection.ws, 'error', {
          message: 'Invalid client identification data',
        });
        return;
      }

      // Optional API key check for local bridge
      const apiKey = data.apiKey || (data.headers && data.headers['x-api-key']);
      const expected = process.env.WS_API_KEY;
      if (expected && apiKey !== expected) {
        connections.get(clientId)?.ws.close(4401, 'unauthorized');
        return;
      }

      info.type = parsed.data.clientType;
      info.userId = parsed.data.userId;
      console.log(
        `Client identified: ${clientId} as ${parsed.data.clientType} for user ${parsed.data.userId}`
      );

      if (info.userId && info.type === 'ios_app') {
        broadcastToAllClients(info.userId, (ws) =>
          sendEnvelope(ws, 'client_presence', {
            userId: info.userId,
            clientType: 'ios_app',
            status: 'online',
          })
        );
      }
      break;
    }

    case 'live_health_update':
    case 'live_health_data':
      handleLiveHealthData(clientId, data.data);
      break;

    case 'historical_data_update':
    case 'historical_data':
      handleHistoricalData(clientId, data.data);
      break;

    case 'emergency_alert':
      handleEmergencyAlert(clientId, data.data);
      break;

    case 'subscribe_health_updates':
      handleSubscription(clientId, data.metrics);
      break;

    case 'gait_data':
      handleGaitData(clientId, data.data);
      break;

    case 'posture_data':
      handlePostureData(clientId, data.data);
      break;

    case 'posture_alert':
      handlePostureAlert(clientId, data.data);
      break;

    case 'walking_coaching_data':
      handleWalkingCoachingData(clientId, data.data);
      break;

    case 'walking_quality_update':
      handleWalkingQualityUpdate(clientId, data.data);
      break;

    case 'real_time_gait_metrics':
      handleRealtimeGaitMetrics(clientId, data.data);
      break;

    case 'start_historical_backfill':
      startHistoricalBackfill(clientId, data && data.cursor);
      break;

    case 'get_more':
      // Request next page in historical backfill flow
      sendHistoricalPage(clientId, data && data.cursor);
      break;

    default:
      console.log(`Unknown message type: ${data.type}`);
  }
}

function handleLiveHealthData(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const parsed = liveHealthDataSchema.safeParse(data);
  if (!parsed.success) {
    sendEnvelope(connection.ws, 'error', {
      message: 'Invalid live health data format',
    });
    return;
  }

  const userId = connection.info.userId;
  if (!userId) return;

  const healthData = parsed.data;

  // Process the health data through analytics
  const processedData = {
    id: crypto.randomUUID(),
    userId,
    type: healthData.type,
    value: healthData.value,
    unit: healthData.unit,
    timestamp: healthData.timestamp,
    source: healthData.source || 'ios_app',
    processedAt: Date.now(),
    wellnessScore: HealthAnalytics.calculateWellnessScore(
      healthData.type === 'heart_rate' ? healthData.value : null,
      healthData.type === 'walking_steadiness' ? healthData.value : null
    ),
  };

  // Add to buffer
  if (!healthDataBuffer.has(userId)) {
    healthDataBuffer.set(userId, []);
  }
  const buffer = healthDataBuffer.get(userId);
  buffer.push(processedData);

  // Keep buffer size manageable
  if (buffer.length > 1000) {
    buffer.shift();
  }

  // Check for alerts
  if (healthData.type === 'heart_rate') {
    const alert = HealthAnalytics.checkHeartRateAlerts(healthData.value);
    if (alert) {
      broadcastEmergencyAlert(userId, {
        metric_type: 'heart_rate',
        alert_level: alert.level,
        message: alert.message,
        value: healthData.value,
        timestamp: healthData.timestamp,
        user_id: userId,
      });
    }
  } else if (healthData.type === 'walking_steadiness') {
    const alert = HealthAnalytics.checkFallRiskAlerts(healthData.value);
    if (alert) {
      broadcastEmergencyAlert(userId, {
        metric_type: 'fall_risk',
        alert_level: alert.level,
        message: alert.message,
        value: healthData.value,
        timestamp: healthData.timestamp,
        user_id: userId,
      });
    }
  }

  // Broadcast live update to all connected clients for this user
  broadcastToAllClients(userId, (ws) =>
    sendEnvelope(ws, 'live_health_update', processedData)
  );

  console.log(
    `Live health data processed: ${healthData.type} = ${healthData.value} ${healthData.unit} for user ${userId}`
  );
}

function handleHistoricalData(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const parsed = historicalDataSchema.safeParse(data);
  if (!parsed.success) {
    sendEnvelope(connection.ws, 'error', {
      message: 'Invalid historical data format',
    });
    return;
  }

  const userId = connection.info.userId;
  if (!userId) return;

  const historicalData = parsed.data;

  // Process each sample
  const processedSamples = historicalData.samples.map((sample) => ({
    id: crypto.randomUUID(),
    userId,
    type: historicalData.type,
    value: sample.value,
    unit: sample.unit,
    timestamp: sample.timestamp,
    source: 'ios_app_historical',
    processedAt: Date.now(),
    wellnessScore: HealthAnalytics.calculateWellnessScore(
      historicalData.type === 'heart_rate' ? sample.value : null,
      historicalData.type === 'walking_steadiness' ? sample.value : null
    ),
  }));

  // Add to buffer
  if (!healthDataBuffer.has(userId)) {
    healthDataBuffer.set(userId, []);
  }
  const buffer = healthDataBuffer.get(userId);
  buffer.push(...processedSamples);

  // Keep buffer size manageable
  if (buffer.length > 1000) {
    buffer.splice(0, buffer.length - 1000);
  }

  // Broadcast historical update to all connected clients for this user
  broadcastToAllClients(userId, (ws) =>
    sendEnvelope(ws, 'historical_data_update', {
      type: historicalData.type,
      samples: processedSamples,
      count: processedSamples.length,
    })
  );

  console.log(
    `Historical data processed: ${processedSamples.length} ${historicalData.type} samples for user ${userId}`
  );
}

function handleEmergencyAlert(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const parsed = emergencyAlertSchema.safeParse(data);
  if (!parsed.success) {
    sendEnvelope(connection.ws, 'error', {
      message: 'Invalid emergency alert format',
    });
    return;
  }

  const alertData = parsed.data;
  console.log(
    `EMERGENCY ALERT: ${alertData.alert_level} - ${alertData.message} for user ${alertData.user_id}`
  );

  // Broadcast emergency alert to all clients
  broadcastEmergencyAlert(alertData.user_id, alertData);
}

function broadcastEmergencyAlert(userId, alertData) {
  broadcastToAllClients(userId, (ws) =>
    sendEnvelope(ws, 'emergency_alert', alertData)
  );

  // Log critical alerts
  if (alertData.alert_level === 'critical') {
    console.log(
      `CRITICAL ALERT: ${alertData.message} - Value: ${alertData.value} at ${new Date(alertData.timestamp * 1000).toISOString()}`
    );
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

// Helper to always send properly-shaped envelopes and guard outbound format
function sendEnvelope(ws, type, data) {
  const message = { type, data, timestamp: new Date().toISOString() };
  const valid = envelopeSchema.safeParse(message);
  if (!valid.success) return; // drop invalid envelope silently
  ws.send(JSON.stringify(message));
}

// HS256 JWT verification (Node crypto)
function verifyJwtHS256(token, secret, opts = {}) {
  try {
    const [h, p, s] = token.split('.');
    if (!h || !p || !s) return { ok: false };
    const data = `${h}.${p}`;
    const expected = crypto
      .createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=+$/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
    if (expected !== s) return { ok: false };
    const payload = JSON.parse(
      Buffer.from(p.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString(
        'utf8'
      )
    );
    const now = Math.floor(Date.now() / 1000);
    const skew = 60;
    if (typeof payload.exp === 'number' && now > payload.exp + skew)
      return { ok: false };
    if (typeof payload.nbf === 'number' && now + skew < payload.nbf)
      return { ok: false };
    if (opts.iss && payload.iss !== opts.iss) return { ok: false };
    if (opts.aud && payload.aud !== opts.aud) return { ok: false };
    return { ok: true, claims: payload };
  } catch {
    return { ok: false };
  }
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

// MARK: - Gait and Posture Data Handlers

function handleGaitData(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  console.log(`📊 Processing gait data from client ${clientId}:`, data);

  const userId = connection.info.userId;
  if (!userId) return;

  // Process gait metrics and calculate insights
  const gaitAnalysis = {
    id: crypto.randomUUID(),
    userId,
    timestamp: data.timestamp || new Date().toISOString(),
    walkingSpeed: data.walking_speed,
    stepLength: data.step_length,
    cadence: data.cadence,
    asymmetry: data.asymmetry,
    doubleSupportTime: data.double_support_time,
    walkingQualityScore: data.walking_quality_score,
    fallRiskLevel: data.fall_risk_level,
    processedAt: Date.now(),
  };

  // Store in buffer
  if (!healthDataBuffer.has(userId)) {
    healthDataBuffer.set(userId, []);
  }
  const buffer = healthDataBuffer.get(userId);
  buffer.push(gaitAnalysis);

  // Broadcast to family/caregivers if walking quality is concerning
  if (data.walking_quality_score < 60) {
    broadcastToFamilyMembers(userId, {
      type: 'walking_quality_alert',
      data: {
        score: data.walking_quality_score,
        message: 'Walking quality needs attention',
        timestamp: gaitAnalysis.timestamp,
        recommendations: data.recommendations || [],
      },
    });
  }

  // Send confirmation back to client
  sendEnvelope(connection.ws, 'gait_data_processed', {
    id: gaitAnalysis.id,
    processed_at: gaitAnalysis.processedAt,
    status: 'success',
  });
}

function handlePostureData(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  console.log(`🧘 Processing posture data from client ${clientId}:`, data);

  const userId = connection.info.userId;
  if (!userId) return;

  const postureAnalysis = {
    id: crypto.randomUUID(),
    userId,
    timestamp: data.timestamp || new Date().toISOString(),
    excellentPercentage: data.excellent_percentage,
    goodPercentage: data.good_percentage,
    fairPercentage: data.fair_percentage,
    poorPercentage: data.poor_percentage,
    criticalPercentage: data.critical_percentage,
    averageNeckAngle: data.average_neck_angle,
    totalAlerts: data.total_alerts,
    currentScore: data.current_score,
    processedAt: Date.now(),
  };

  // Add to buffer
  if (!healthDataBuffer.has(userId)) {
    healthDataBuffer.set(userId, []);
  }
  const buffer = healthDataBuffer.get(userId);
  buffer.push(postureAnalysis);

  // Send confirmation
  sendEnvelope(connection.ws, 'posture_data_processed', {
    id: postureAnalysis.id,
    processed_at: postureAnalysis.processedAt,
    status: 'success',
  });
}

function handlePostureAlert(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  console.log(`⚠️ Processing posture alert from client ${clientId}:`, data);

  const userId = connection.info.userId;
  if (!userId) return;

  // Forward posture alert to family/caregivers if severe
  if (data.severity === 'high' || data.alert_type === 'forward_head') {
    broadcastToFamilyMembers(userId, {
      type: 'posture_alert',
      data: {
        alert_type: data.alert_type,
        message: data.message,
        severity: data.severity,
        timestamp: data.timestamp,
        recommendations: [
          'Take a posture break',
          'Adjust workspace ergonomics',
        ],
      },
    });
  }

  // Send confirmation
  sendEnvelope(connection.ws, 'posture_alert_processed', {
    status: 'alert_forwarded',
    severity: data.severity,
  });
}

function handleWalkingCoachingData(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  console.log(
    `🚶 Processing walking coaching data from client ${clientId}:`,
    data
  );

  const userId = connection.info.userId;
  if (!userId) return;

  const coachingSession = {
    id: crypto.randomUUID(),
    userId,
    sessionStart: data.session_start,
    sessionEnd: data.session_end,
    duration: data.duration,
    distance: data.distance,
    averageSpeed: data.average_speed,
    averageCadence: data.average_cadence,
    gaitStability: data.gait_stability,
    improvementAreas: data.improvement_areas,
    feedback: data.feedback,
    workoutType: data.workout_type,
    processedAt: Date.now(),
  };

  // Store coaching session
  if (!healthDataBuffer.has(userId)) {
    healthDataBuffer.set(userId, []);
  }
  const buffer = healthDataBuffer.get(userId);
  buffer.push(coachingSession);

  // Share progress with family if significant improvement
  if (data.improvement_areas && data.improvement_areas.length === 0) {
    broadcastToFamilyMembers(userId, {
      type: 'walking_progress_update',
      data: {
        message: 'Excellent walking session completed!',
        duration: data.duration,
        distance: data.distance,
        improvements: 'All gait metrics in optimal range',
        timestamp: coachingSession.sessionEnd,
      },
    });
  }

  // Send confirmation
  sendEnvelope(connection.ws, 'coaching_data_processed', {
    session_id: coachingSession.id,
    status: 'session_recorded',
  });
}

function handleWalkingQualityUpdate(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const userId = connection.info.userId;
  if (!userId) return;

  // Broadcast real-time walking quality to connected family members
  broadcastToFamilyMembers(userId, {
    type: 'walking_quality_update',
    data: {
      overall_score: data.overall_score,
      quality_level: data.quality_level,
      components: data.components,
      timestamp: data.timestamp,
    },
  });
}

function handleRealtimeGaitMetrics(clientId, data) {
  const connection = connections.get(clientId);
  if (!connection) return;

  const userId = connection.info.userId;
  if (!userId) return;

  // Forward real-time metrics to dashboard/family
  broadcastToFamilyMembers(userId, {
    type: 'real_time_gait_metrics',
    data: {
      current_speed: data.current_speed,
      step_cadence: data.step_cadence,
      gait_stability: data.gait_stability,
      elapsed_time: data.elapsed_time,
      distance: data.distance,
      timestamp: data.timestamp,
    },
  });
}

function broadcastToFamilyMembers(userId, message) {
  // This would integrate with your user/family management system
  // For now, broadcast to all connections for the user
  broadcastToAllClients(userId, message);
  console.log(
    `📡 Broadcasting to family members for user ${userId}:`,
    message.type
  );
}

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
