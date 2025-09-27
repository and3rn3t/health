#!/usr/bin/env node

/**
 * VitalSense Enhanced WebSocket Server
 * Production-ready enhancement of the existing server with:
 * - SQLite database persistence
 * - JWT authentication
 * - Health data processing and alerts
 * - Rate limiting and security
 * - Emergency alert system
 */

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

class VitalSenseEnhancedServer {
  constructor() {
    this.app = express();
    this.httpServer = null;
    this.wss = null;
    this.db = null;
    this.clients = new Map();
    this.healthDataBuffer = new Map(); // userId -> [healthData]
    this.emergencyAlerts = new Map(); // userId -> [alerts]

    // Keep your existing data generation for demo/testing
    this.demoDataInterval = null;

    this.init();
  }

  async init() {
    await this.setupDatabase();
    this.setupExpress();
    this.setupWebSocket();
    this.startBackgroundTasks();
  }

  async setupDatabase() {
    console.log('🗄️  Setting up SQLite database...');

    // Ensure data directory exists
    const dataDir = path.join(__dirname, 'data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    this.db = new sqlite3.Database(
      path.join(dataDir, 'vitalsense-production.db')
    );

    // Create tables with proper health data schema
    await this.createTables();
    console.log('✅ Database initialized');
  }

  createTables() {
    return new Promise((resolve) => {
      this.db.serialize(() => {
        // Health metrics table - stores all health data points
        this.db.run(`
          CREATE TABLE IF NOT EXISTS health_metrics (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            metric_type TEXT NOT NULL,
            value REAL NOT NULL,
            unit TEXT,
            timestamp INTEGER NOT NULL,
            device_id TEXT,
            source_type TEXT DEFAULT 'ios_app',
            processed_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
            wellness_score REAL,
            confidence_level REAL DEFAULT 1.0,
            metadata TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // Create index for efficient queries
        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_health_metrics_user_time
          ON health_metrics(user_id, timestamp DESC)
        `);

        this.db.run(`
          CREATE INDEX IF NOT EXISTS idx_health_metrics_type
          ON health_metrics(metric_type, timestamp DESC)
        `);

        // Alerts table - stores health alerts and emergency notifications
        this.db.run(`
          CREATE TABLE IF NOT EXISTS health_alerts (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            alert_type TEXT NOT NULL,
            severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
            title TEXT NOT NULL,
            message TEXT NOT NULL,
            metric_type TEXT,
            metric_value REAL,
            threshold_value REAL,
            timestamp INTEGER NOT NULL,
            resolved INTEGER DEFAULT 0,
            resolved_at INTEGER,
            response_time_ms INTEGER,
            created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
            metadata TEXT,
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        // User sessions table - tracks WebSocket connections
        this.db.run(`
          CREATE TABLE IF NOT EXISTS user_sessions (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            client_type TEXT DEFAULT 'web_dashboard',
            connected_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
            disconnected_at INTEGER,
            last_heartbeat INTEGER,
            device_info TEXT,
            ip_address TEXT,
            user_agent TEXT,
            is_active INTEGER DEFAULT 1
          )
        `);

        // Users table - basic user info (if not using external auth)
        this.db.run(`
          CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            auth_provider TEXT DEFAULT 'auth0',
            auth_provider_id TEXT,
            email TEXT,
            name TEXT,
            emergency_contacts TEXT,
            health_preferences TEXT,
            created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
            updated_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
            is_active INTEGER DEFAULT 1
          )
        `);

        // Emergency events table - critical events requiring immediate response
        this.db.run(`
          CREATE TABLE IF NOT EXISTS emergency_events (
            id TEXT PRIMARY KEY,
            user_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            severity TEXT NOT NULL,
            trigger_metric_type TEXT,
            trigger_value REAL,
            location_data TEXT,
            emergency_contacts_notified TEXT,
            response_actions TEXT,
            resolved INTEGER DEFAULT 0,
            timestamp INTEGER NOT NULL,
            created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000),
            FOREIGN KEY (user_id) REFERENCES users(id)
          )
        `);

        resolve();
      });
    });
  }

  setupExpress() {
    console.log('🔧 Setting up Express API server...');

    // Security middleware
    this.app.use(
      helmet({
        contentSecurityPolicy: false, // Allow WebSocket connections
        crossOriginEmbedderPolicy: false,
      })
    );

    this.app.use(
      cors({
        origin: this.getAllowedOrigins(),
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      })
    );

    // Rate limiting for API endpoints
    const apiLimiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // 1000 requests per 15 minutes
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: 15 * 60, // seconds
      },
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use('/api/', apiLimiter);

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'development',
        websocket: {
          connected_clients: this.clients.size,
          active_users:
            new Set([...this.clients.values()].map((c) => c.userId)).size - 1, // -1 for null
        },
        database: {
          connected: this.db !== null,
          file: path.join(__dirname, 'data', 'vitalsense-production.db'),
        },
        uptime: Math.floor(process.uptime()),
        memory: process.memoryUsage(),
      });
    });

    // Historical health data endpoint
    this.app.get(
      '/api/health-data/:userId',
      this.authenticateRequest.bind(this),
      (req, res) => {
        const { userId } = req.params;
        const { limit = 100, metric_type, since, until, page = 1 } = req.query;

        let query = `
        SELECT id, metric_type, value, unit, timestamp, device_id,
               wellness_score, confidence_level, source_type
        FROM health_metrics
        WHERE user_id = ?
      `;
        let params = [userId];

        // Add filters
        if (metric_type) {
          query += ' AND metric_type = ?';
          params.push(metric_type);
        }

        if (since) {
          query += ' AND timestamp >= ?';
          params.push(parseInt(since));
        }

        if (until) {
          query += ' AND timestamp <= ?';
          params.push(parseInt(until));
        }

        query += ' ORDER BY timestamp DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit));
        params.push((parseInt(page) - 1) * parseInt(limit));

        this.db.all(query, params, (err, rows) => {
          if (err) {
            console.error('Database query error:', err);
            return res.status(500).json({
              error: 'Database error',
              timestamp: new Date().toISOString(),
            });
          }

          // Get total count for pagination
          let countQuery =
            'SELECT COUNT(*) as total FROM health_metrics WHERE user_id = ?';
          let countParams = [userId];

          if (metric_type) {
            countQuery += ' AND metric_type = ?';
            countParams.push(metric_type);
          }

          this.db.get(countQuery, countParams, (countErr, countResult) => {
            if (countErr) {
              console.error('Count query error:', countErr);
              return res.status(500).json({ error: 'Database error' });
            }

            res.json({
              data: rows,
              pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: countResult.total,
                pages: Math.ceil(countResult.total / parseInt(limit)),
              },
              timestamp: new Date().toISOString(),
            });
          });
        });
      }
    );

    // Get user alerts
    this.app.get(
      '/api/alerts/:userId',
      this.authenticateRequest.bind(this),
      (req, res) => {
        const { userId } = req.params;
        const { resolved = 'false', limit = 50 } = req.query;

        let query = `
        SELECT id, alert_type, severity, title, message, metric_type,
               metric_value, timestamp, resolved, resolved_at, response_time_ms
        FROM health_alerts
        WHERE user_id = ?
      `;
        let params = [userId];

        if (resolved !== 'all') {
          query += ' AND resolved = ?';
          params.push(resolved === 'true' ? 1 : 0);
        }

        query += ' ORDER BY timestamp DESC LIMIT ?';
        params.push(parseInt(limit));

        this.db.all(query, params, (err, rows) => {
          if (err) {
            console.error('Alerts query error:', err);
            return res.status(500).json({ error: 'Database error' });
          }

          res.json({
            alerts: rows,
            count: rows.length,
            timestamp: new Date().toISOString(),
          });
        });
      }
    );

    // Trigger emergency alert
    this.app.post(
      '/api/emergency-alert',
      this.authenticateRequest.bind(this),
      (req, res) => {
        const {
          userId,
          alertType,
          title,
          message,
          severity = 'high',
          location,
        } = req.body;

        if (!userId || !title || !message) {
          return res.status(400).json({
            error: 'Missing required fields: userId, title, message',
          });
        }

        const alertId = crypto.randomUUID();
        const timestamp = Date.now();

        const alert = {
          id: alertId,
          user_id: userId,
          alert_type: alertType || 'manual_emergency',
          severity,
          title,
          message,
          timestamp,
        };

        // Store alert in database
        this.db.run(
          `INSERT INTO health_alerts
         (id, user_id, alert_type, severity, title, message, timestamp)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            alert.id,
            alert.user_id,
            alert.alert_type,
            alert.severity,
            alert.title,
            alert.message,
            alert.timestamp,
          ],
          (err) => {
            if (err) {
              console.error('Failed to store alert:', err);
              return res.status(500).json({ error: 'Failed to store alert' });
            }

            // Create emergency event if severity is high or critical
            if (severity === 'high' || severity === 'critical') {
              this.createEmergencyEvent(userId, alert, location);
            }

            // Broadcast alert to all clients for this user
            this.broadcastToUser(userId, {
              type: 'emergency_alert',
              data: alert,
              timestamp: new Date().toISOString(),
            });

            console.log(
              `🚨 Emergency alert created: ${title} (${severity}) for user ${userId}`
            );

            res.json({
              success: true,
              alert,
              timestamp: new Date().toISOString(),
            });
          }
        );
      }
    );

    // Resolve alert
    this.app.put(
      '/api/alerts/:alertId/resolve',
      this.authenticateRequest.bind(this),
      (req, res) => {
        const { alertId } = req.params;
        const { responseTimeMs } = req.body;
        const resolvedAt = Date.now();

        this.db.run(
          'UPDATE health_alerts SET resolved = 1, resolved_at = ?, response_time_ms = ? WHERE id = ?',
          [resolvedAt, responseTimeMs, alertId],
          function (err) {
            if (err) {
              console.error('Failed to resolve alert:', err);
              return res.status(500).json({ error: 'Failed to resolve alert' });
            }

            if (this.changes === 0) {
              return res.status(404).json({ error: 'Alert not found' });
            }

            res.json({
              success: true,
              alertId,
              resolvedAt,
              timestamp: new Date().toISOString(),
            });
          }
        );
      }
    );
  }

  getAllowedOrigins() {
    const origins = process.env.ALLOWED_ORIGINS?.split(',') || [
      'http://localhost:5173',
      'http://127.0.0.1:8789',
      'http://localhost:5000',
      'https://health.andernet.dev',
    ];
    return origins.map((origin) => origin.trim());
  }

  authenticateRequest(req, res, next) {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        error: 'No authentication token provided',
        timestamp: new Date().toISOString(),
      });
    }

    try {
      const secret =
        process.env.JWT_SECRET ||
        process.env.DEVICE_JWT_SECRET ||
        'dev-local-secret-change-in-production';
      const decoded = jwt.verify(token, secret);
      req.user = decoded;
      next();
    } catch (error) {
      console.error('JWT verification failed:', error.message);
      return res.status(401).json({
        error: 'Invalid authentication token',
        timestamp: new Date().toISOString(),
      });
    }
  }

  setupWebSocket() {
    console.log('🔌 Setting up WebSocket server...');

    const port = process.env.PORT || 3001;
    this.httpServer = this.app.listen(port, '0.0.0.0', () => {
      console.log(`🚀 VitalSense Enhanced Server running on:`);
      console.log(`   HTTP: http://localhost:${port}`);
      console.log(`   WebSocket: ws://localhost:${port}/ws`);
      console.log(`   Health: http://localhost:${port}/api/health`);
    });

    this.wss = new WebSocket.Server({
      server: this.httpServer,
      path: '/ws',
    });

    this.wss.on('connection', (ws, req) => {
      const clientId = crypto.randomUUID();
      const clientInfo = {
        id: clientId,
        connectedAt: Date.now(),
        lastHeartbeat: Date.now(),
        userId: null,
        clientType: null,
        ipAddress: req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        req,
      };

      this.clients.set(ws, clientInfo);
      console.log(
        `📱 Client connected: ${clientId} (Total: ${this.clients.size})`
      );

      // Set up message handling
      ws.on('message', (data) => this.handleMessage(ws, data, clientInfo));
      ws.on('close', () => this.handleDisconnect(ws, clientInfo));
      ws.on('error', (error) =>
        console.error(`WebSocket error for ${clientId}:`, error)
      );

      // Send welcome message
      this.sendMessage(ws, {
        type: 'connection_established',
        data: {
          clientId,
          serverTime: new Date().toISOString(),
          version: '2.0.0',
        },
        timestamp: new Date().toISOString(),
      });
    });
  }

  handleMessage(ws, data, clientInfo) {
    try {
      const message = JSON.parse(data.toString());
      const { type, ...payload } = message;

      switch (type) {
        case 'client_identification':
          this.handleClientIdentification(ws, clientInfo, payload);
          break;

        case 'live_health_data':
          this.processHealthData(clientInfo, payload);
          break;

        case 'heartbeat':
          this.handleHeartbeat(ws, clientInfo);
          break;

        case 'historical_data_request':
          this.handleHistoricalDataRequest(ws, clientInfo, payload);
          break;

        case 'subscribe_health_updates':
          this.handleSubscription(ws, clientInfo, payload);
          break;

        default:
          console.warn(
            `Unknown message type: ${type} from client ${clientInfo.id}`
          );
      }
    } catch (error) {
      console.error('Error handling message:', error);
      this.sendMessage(ws, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  handleClientIdentification(ws, clientInfo, payload) {
    clientInfo.userId = payload.userId;
    clientInfo.clientType = payload.clientType || 'web_dashboard';

    // Store session in database
    this.db.run(
      `INSERT OR REPLACE INTO user_sessions
       (id, user_id, client_type, device_info, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        clientInfo.id,
        clientInfo.userId,
        clientInfo.clientType,
        JSON.stringify(payload.deviceInfo || {}),
        clientInfo.ipAddress,
        clientInfo.userAgent,
      ]
    );

    console.log(
      `👤 Client identified: ${clientInfo.userId} (${clientInfo.clientType})`
    );

    // Send acknowledgment
    this.sendMessage(ws, {
      type: 'identification_confirmed',
      data: {
        userId: clientInfo.userId,
        clientType: clientInfo.clientType,
        features: ['real_time_health', 'alerts', 'historical_data'],
      },
      timestamp: new Date().toISOString(),
    });
  }

  handleHeartbeat(ws, clientInfo) {
    clientInfo.lastHeartbeat = Date.now();

    // Update session in database
    this.db.run('UPDATE user_sessions SET last_heartbeat = ? WHERE id = ?', [
      clientInfo.lastHeartbeat,
      clientInfo.id,
    ]);

    this.sendMessage(ws, {
      type: 'heartbeat_ack',
      data: { serverTime: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  processHealthData(clientInfo, payload) {
    if (!clientInfo.userId) {
      console.warn('Health data received from unidentified client');
      return;
    }

    const healthDataArray = Array.isArray(payload.data)
      ? payload.data
      : [payload.data || payload];
    const results = [];

    healthDataArray.forEach((dataPoint) => {
      const healthData = {
        id: crypto.randomUUID(),
        user_id: clientInfo.userId,
        metric_type: dataPoint.type,
        value: dataPoint.value,
        unit: dataPoint.unit,
        timestamp: dataPoint.timestamp
          ? new Date(dataPoint.timestamp).getTime()
          : Date.now(),
        device_id: payload.deviceId || dataPoint.deviceId || 'unknown',
        source_type: payload.sourceType || 'ios_app',
        confidence_level: dataPoint.confidence || 1.0,
        metadata: JSON.stringify(dataPoint.metadata || {}),
      };

      // Calculate wellness score
      healthData.wellness_score = this.calculateWellnessScore(healthData);

      // Store in database
      this.db.run(
        `INSERT INTO health_metrics
         (id, user_id, metric_type, value, unit, timestamp, device_id, source_type, wellness_score, confidence_level, metadata)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          healthData.id,
          healthData.user_id,
          healthData.metric_type,
          healthData.value,
          healthData.unit,
          healthData.timestamp,
          healthData.device_id,
          healthData.source_type,
          healthData.wellness_score,
          healthData.confidence_level,
          healthData.metadata,
        ],
        (err) => {
          if (err) {
            console.error('Failed to store health data:', err);
            return;
          }

          // Check for alerts
          const alert = this.checkForHealthAlerts(healthData);
          if (alert) {
            this.triggerHealthAlert(clientInfo.userId, alert, healthData);
          }

          results.push(healthData);
        }
      );
    });

    // Broadcast to all clients for this user
    this.broadcastToUser(clientInfo.userId, {
      type: 'live_health_update',
      data: results,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `📊 Processed ${healthDataArray.length} health data points for user ${clientInfo.userId}`
    );
  }

  calculateWellnessScore(healthData) {
    // Enhanced wellness score calculation
    switch (healthData.metric_type) {
      case 'heart_rate':
        const hr = healthData.value;
        if (hr >= 60 && hr <= 100) return 0.95;
        if (hr >= 50 && hr <= 120) return 0.8;
        if (hr >= 40 && hr <= 150) return 0.6;
        return 0.3;

      case 'walking_steadiness':
        const steadiness = healthData.value;
        if (steadiness >= 80) return 0.95;
        if (steadiness >= 60) return 0.8;
        if (steadiness >= 40) return 0.6;
        return 0.3;

      case 'gait_speed':
        const speed = healthData.value;
        if (speed >= 1.0 && speed <= 1.4) return 0.95;
        if (speed >= 0.8 && speed <= 1.6) return 0.8;
        if (speed >= 0.6) return 0.6;
        return 0.4;

      case 'step_asymmetry':
        const asymmetry = healthData.value;
        if (asymmetry <= 2) return 0.95;
        if (asymmetry <= 5) return 0.8;
        if (asymmetry <= 10) return 0.6;
        return 0.4;

      default:
        return 0.8; // Default score for unknown metrics
    }
  }

  checkForHealthAlerts(healthData) {
    // Enhanced alert logic with more health metrics
    const alerts = [];

    switch (healthData.metric_type) {
      case 'heart_rate':
        const hr = healthData.value;
        if (hr > 150) {
          alerts.push({
            type: 'heart_rate_high',
            severity: hr > 180 ? 'critical' : 'high',
            title: 'High Heart Rate Alert',
            message: `Heart rate elevated to ${hr} bpm - please rest and monitor`,
            threshold: 150,
          });
        } else if (hr < 40) {
          alerts.push({
            type: 'heart_rate_low',
            severity: hr < 30 ? 'critical' : 'high',
            title: 'Low Heart Rate Alert',
            message: `Heart rate dropped to ${hr} bpm - please seek medical attention if symptomatic`,
            threshold: 40,
          });
        }
        break;

      case 'walking_steadiness':
        const steadiness = healthData.value;
        if (steadiness < 30) {
          alerts.push({
            type: 'fall_risk_high',
            severity: steadiness < 20 ? 'critical' : 'high',
            title: 'High Fall Risk Detected',
            message: `Walking steadiness is ${steadiness}% - increased fall risk detected`,
            threshold: 30,
          });
        } else if (steadiness < 50) {
          alerts.push({
            type: 'fall_risk_medium',
            severity: 'medium',
            title: 'Moderate Fall Risk',
            message: `Walking steadiness is ${steadiness}% - please use caution when walking`,
            threshold: 50,
          });
        }
        break;

      case 'gait_speed':
        const speed = healthData.value;
        if (speed < 0.6) {
          alerts.push({
            type: 'mobility_concern',
            severity: speed < 0.4 ? 'high' : 'medium',
            title: 'Mobility Concern',
            message: `Gait speed is ${speed} m/s - below normal range`,
            threshold: 0.6,
          });
        }
        break;

      case 'step_asymmetry':
        const asymmetry = healthData.value;
        if (asymmetry > 10) {
          alerts.push({
            type: 'gait_asymmetry',
            severity: asymmetry > 20 ? 'high' : 'medium',
            title: 'Gait Asymmetry Detected',
            message: `Step asymmetry is ${asymmetry}% - may indicate balance issues`,
            threshold: 10,
          });
        }
        break;
    }

    return alerts.length > 0 ? alerts[0] : null; // Return the first alert
  }

  triggerHealthAlert(userId, alert, healthData) {
    const alertData = {
      id: crypto.randomUUID(),
      user_id: userId,
      alert_type: alert.type,
      severity: alert.severity,
      title: alert.title,
      message: alert.message,
      metric_type: healthData.metric_type,
      metric_value: healthData.value,
      threshold_value: alert.threshold,
      timestamp: Date.now(),
    };

    // Store alert in database
    this.db.run(
      `INSERT INTO health_alerts
       (id, user_id, alert_type, severity, title, message, metric_type, metric_value, threshold_value, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        alertData.id,
        alertData.user_id,
        alertData.alert_type,
        alertData.severity,
        alertData.title,
        alertData.message,
        alertData.metric_type,
        alertData.metric_value,
        alertData.threshold_value,
        alertData.timestamp,
      ]
    );

    // Create emergency event for critical alerts
    if (alert.severity === 'critical') {
      this.createEmergencyEvent(userId, alertData);
    }

    // Broadcast alert to all clients for this user
    this.broadcastToUser(userId, {
      type: 'health_alert',
      data: alertData,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `🚨 Health alert triggered: ${alert.title} (${alert.severity}) for user ${userId}`
    );
  }

  createEmergencyEvent(userId, alertData, location = null) {
    const emergencyEvent = {
      id: crypto.randomUUID(),
      user_id: userId,
      event_type: alertData.alert_type,
      severity: alertData.severity,
      trigger_metric_type: alertData.metric_type,
      trigger_value: alertData.metric_value,
      location_data: location ? JSON.stringify(location) : null,
      timestamp: Date.now(),
    };

    this.db.run(
      `INSERT INTO emergency_events
       (id, user_id, event_type, severity, trigger_metric_type, trigger_value, location_data, timestamp)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        emergencyEvent.id,
        emergencyEvent.user_id,
        emergencyEvent.event_type,
        emergencyEvent.severity,
        emergencyEvent.trigger_metric_type,
        emergencyEvent.trigger_value,
        emergencyEvent.location_data,
        emergencyEvent.timestamp,
      ]
    );

    // Broadcast emergency event
    this.broadcastToUser(userId, {
      type: 'emergency_event',
      data: emergencyEvent,
      timestamp: new Date().toISOString(),
    });

    console.log(
      `🆘 Emergency event created: ${emergencyEvent.event_type} for user ${userId}`
    );
  }

  broadcastToUser(userId, message) {
    let broadcastCount = 0;
    this.clients.forEach((clientInfo, ws) => {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
        broadcastCount++;
      }
    });

    if (broadcastCount > 0) {
      console.log(
        `📡 Broadcasted ${message.type} to ${broadcastCount} clients for user ${userId}`
      );
    }
  }

  sendMessage(ws, message) {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(JSON.stringify(message));
      } catch (error) {
        console.error('Error sending message:', error);
      }
    }
  }

  startBackgroundTasks() {
    // Heartbeat check - disconnect inactive clients
    setInterval(() => {
      const now = Date.now();
      const timeoutMs = 90000; // 90 seconds timeout

      this.clients.forEach((clientInfo, ws) => {
        if (now - clientInfo.lastHeartbeat > timeoutMs) {
          console.log(
            `💔 Client timeout: ${clientInfo.id} (${clientInfo.userId})`
          );
          ws.terminate();
        }
      });
    }, 30000); // Check every 30 seconds

    // Demo data generation (only in development)
    if (process.env.NODE_ENV === 'development') {
      this.startDemoDataGeneration();
    }

    // Database cleanup - remove old data based on retention policy
    this.startDatabaseCleanup();
  }

  startDemoDataGeneration() {
    console.log('🎭 Starting demo data generation (development mode)');

    this.demoDataInterval = setInterval(() => {
      if (this.clients.size > 0) {
        // Generate demo health data (keeping your existing logic)
        const demoMetrics = this.generateDemoHealthData();

        // Send to demo user clients
        this.clients.forEach((clientInfo, ws) => {
          if (
            ws.readyState === WebSocket.OPEN &&
            (clientInfo.userId === 'demo-user' || !clientInfo.userId)
          ) {
            this.sendMessage(ws, {
              type: 'live_health_update',
              data: demoMetrics,
              timestamp: new Date().toISOString(),
            });
          }
        });
      }
    }, 5000); // Send demo data every 5 seconds
  }

  generateDemoHealthData() {
    // Use your existing generateHealthData logic but return just the metrics
    const metrics = [
      {
        type: 'heart_rate',
        value: 65 + Math.random() * 40,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'walking_steadiness',
        value: 40 + Math.random() * 50,
        unit: 'percent',
        timestamp: new Date().toISOString(),
      },
      {
        type: 'gait_speed',
        value: +(0.6 + Math.random() * 0.8).toFixed(2),
        unit: 'm/s',
        timestamp: new Date().toISOString(),
      },
    ];

    return metrics.slice(0, Math.ceil(Math.random() * 3)); // 1-3 metrics
  }

  startDatabaseCleanup() {
    // Clean up old data every hour
    setInterval(
      () => {
        const retentionDays = parseInt(process.env.DATA_RETENTION_DAYS) || 30;
        const cutoffTime = Date.now() - retentionDays * 24 * 60 * 60 * 1000;

        // Clean old health metrics
        this.db.run(
          'DELETE FROM health_metrics WHERE timestamp < ?',
          [cutoffTime],
          function (err) {
            if (!err && this.changes > 0) {
              console.log(`🧹 Cleaned up ${this.changes} old health metrics`);
            }
          }
        );

        // Clean old resolved alerts (keep for 90 days)
        const alertCutoff = Date.now() - 90 * 24 * 60 * 60 * 1000;
        this.db.run(
          'DELETE FROM health_alerts WHERE resolved = 1 AND resolved_at < ?',
          [alertCutoff],
          function (err) {
            if (!err && this.changes > 0) {
              console.log(`🧹 Cleaned up ${this.changes} old resolved alerts`);
            }
          }
        );

        // Clean old sessions
        this.db.run(
          'DELETE FROM user_sessions WHERE is_active = 0 AND disconnected_at < ?',
          [cutoffTime],
          function (err) {
            if (!err && this.changes > 0) {
              console.log(`🧹 Cleaned up ${this.changes} old sessions`);
            }
          }
        );
      },
      60 * 60 * 1000
    ); // Run every hour
  }

  handleDisconnect(ws, clientInfo) {
    this.clients.delete(ws);

    // Update session in database
    if (clientInfo.userId) {
      this.db.run(
        'UPDATE user_sessions SET is_active = 0, disconnected_at = ? WHERE id = ?',
        [Date.now(), clientInfo.id]
      );
    }

    console.log(
      `📴 Client disconnected: ${clientInfo.id} (${clientInfo.userId || 'unidentified'}) - Total: ${this.clients.size}`
    );
  }

  // Graceful shutdown
  async shutdown() {
    console.log('🛑 Shutting down VitalSense Enhanced Server...');

    // Stop demo data generation
    if (this.demoDataInterval) {
      clearInterval(this.demoDataInterval);
    }

    // Close all WebSocket connections
    this.clients.forEach((clientInfo, ws) => {
      ws.close(1000, 'Server shutting down');
    });

    // Close HTTP server
    if (this.httpServer) {
      this.httpServer.close();
    }

    // Close database
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('✅ Database connection closed');
        }
      });
    }

    console.log('✅ Server shutdown complete');
  }
}

// Start the enhanced server
const server = new VitalSenseEnhancedServer();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM signal');
  await server.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT signal');
  await server.shutdown();
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  server.shutdown().then(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  server.shutdown().then(() => process.exit(1));
});
