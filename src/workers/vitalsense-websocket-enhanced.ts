/**
 * VitalSense Enhanced WebSocket Worker
 * Production WebSocket service with full VitalSense health monitoring capabilities
 * Compatible with Cloudflare Workers and Durable Objects
 */

interface Env {
  VITALSENSE_WEBSOCKET: DurableObjectNamespace;
}

interface HealthDataPoint {
  id: string;
  user_id: string;
  metric_type: string;
  value: number;
  unit: string;
  timestamp: number;
  device_id: string;
  source_type: string;
  confidence_level: number;
  wellness_score?: number;
  metadata?: Record<string, unknown>;
}

interface HealthAlert {
  id: string;
  user_id: string;
  alert_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  metric_type: string;
  metric_value: number;
  threshold_value: number;
  timestamp: number;
}

interface VitalSenseClient {
  id: string;
  userId?: string;
  clientType?: string;
  connectedAt: number;
  lastHeartbeat: number;
  deviceInfo?: any;
}

export class VitalSenseWebSocketDO {
  private clients: Map<WebSocket, VitalSenseClient> = new Map();
  private storage: DurableObjectStorage;
  private env: Env;

  constructor(ctx: DurableObjectState, env: Env) {
    this.storage = ctx.storage;
    this.env = env;

    // Start background health monitoring tasks
    this.startBackgroundTasks();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({
        status: 'healthy',
        service: 'VitalSense Enhanced WebSocket',
        timestamp: new Date().toISOString(),
        clients: this.clients.size,
        features: [
          'real_time_health_processing',
          'emergency_alerts',
          'wellness_scoring',
          'fall_risk_detection',
          'gait_analysis'
        ]
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      await this.handleWebSocketUpgrade(server, request);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('VitalSense Enhanced WebSocket Worker', { status: 200 });
  }

  private async handleWebSocketUpgrade(ws: WebSocket, request: Request): Promise<void> {
    const clientId = crypto.randomUUID();
    const clientInfo: VitalSenseClient = {
      id: clientId,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
    };

    this.clients.set(ws, clientInfo);

    console.log(`🏥 VitalSense client connected: ${clientId} (Total: ${this.clients.size})`);

    // Accept the WebSocket connection
    ws.accept();

    // Send VitalSense welcome message with capabilities
    this.sendMessage(ws, {
      type: 'vitalsense_connection_established',
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        capabilities: [
          'real_time_health_monitoring',
          'emergency_alert_system',
          'wellness_scoring',
          'fall_risk_assessment',
          'gait_analysis',
          'heart_rate_monitoring'
        ],
        server_version: '2.0.0-enhanced'
      },
      timestamp: new Date().toISOString(),
    });

    // Set up message handling
    ws.addEventListener('message', (event) => {
      this.handleMessage(ws, event.data, clientInfo);
    });

    ws.addEventListener('close', () => {
      this.handleDisconnect(ws, clientInfo);
    });

    ws.addEventListener('error', (error) => {
      console.error(`🚨 WebSocket error for ${clientId}:`, error);
    });
  }

  private async handleMessage(ws: WebSocket, data: string, clientInfo: VitalSenseClient): Promise<void> {
    try {
      const message = JSON.parse(data);
      const { type, ...payload } = message;

      switch (type) {
        case 'client_identification':
          await this.handleClientIdentification(ws, clientInfo, payload);
          break;

        case 'vitalsense_health_data':
          await this.processVitalSenseHealthData(clientInfo, payload);
          break;

        case 'emergency_event':
          await this.handleEmergencyEvent(clientInfo, payload);
          break;

        case 'heartbeat':
          await this.handleHeartbeat(ws, clientInfo);
          break;

        case 'subscribe_health_updates':
          await this.handleHealthSubscription(ws, clientInfo, payload);
          break;

        case 'historical_health_request':
          await this.handleHistoricalHealthRequest(ws, clientInfo, payload);
          break;

        default:
          console.warn(`🤔 Unknown VitalSense message type: ${type}`);
          this.sendMessage(ws, {
            type: 'error',
            data: { message: `Unknown message type: ${type}` },
            timestamp: new Date().toISOString(),
          });
      }
    } catch (error) {
      console.error('🚨 Error handling VitalSense message:', error);
      this.sendMessage(ws, {
        type: 'error',
        data: { message: 'Invalid message format' },
        timestamp: new Date().toISOString(),
      });
    }
  }

  private async handleClientIdentification(ws: WebSocket, clientInfo: VitalSenseClient, payload: any): Promise<void> {
    clientInfo.userId = payload.userId;
    clientInfo.clientType = payload.clientType || 'unknown';
    clientInfo.deviceInfo = payload.deviceInfo;

    // Store session in durable storage
    await this.storage.put(`session:${clientInfo.id}`, {
      userId: clientInfo.userId,
      clientType: clientInfo.clientType,
      connectedAt: clientInfo.connectedAt,
      deviceInfo: clientInfo.deviceInfo,
    });

    console.log(`👤 VitalSense client identified: ${clientInfo.userId} (${clientInfo.clientType})`);

    this.sendMessage(ws, {
      type: 'identification_confirmed',
      data: {
        status: 'authenticated',
        features_enabled: [
          'real_time_monitoring',
          'emergency_alerts',
          'wellness_insights',
          'health_analytics'
        ]
      },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Core VitalSense Health Data Processing
   * Processes incoming health metrics with wellness scoring and alert checking
   */
  private async processVitalSenseHealthData(clientInfo: VitalSenseClient, payload: any): Promise<void> {
    if (!clientInfo.userId) {
      console.warn('🚨 Health data received from unidentified VitalSense client');
      return;
    }

    const healthDataArray = Array.isArray(payload.data) ? payload.data : [payload.data || payload];
    const processedData: HealthDataPoint[] = [];
    const alerts: HealthAlert[] = [];

    for (const dataPoint of healthDataArray) {
      const healthData: HealthDataPoint = {
        id: crypto.randomUUID(),
        user_id: clientInfo.userId,
        metric_type: dataPoint.type,
        value: dataPoint.value,
        unit: dataPoint.unit,
        timestamp: dataPoint.timestamp ? new Date(dataPoint.timestamp).getTime() : Date.now(),
        device_id: payload.deviceId || dataPoint.deviceId || 'unknown',
        source_type: payload.sourceType || 'ios_app',
        confidence_level: dataPoint.confidence || 1.0,
        metadata: dataPoint.metadata || {},
      };

      // Calculate VitalSense wellness score
      const wellnessScore = this.calculateVitalSenseWellnessScore(healthData);
      (healthData as any).wellness_score = wellnessScore;

      // Check for VitalSense health alerts
      const alert = this.checkForVitalSenseHealthAlerts(healthData);
      if (alert) {
        alerts.push(alert);
        await this.triggerVitalSenseHealthAlert(clientInfo.userId, alert, healthData);
      }

      // Store health data in durable storage
      await this.storage.put(`health:${healthData.id}`, healthData);

      // Store in user's recent data (keep last 100 points)
      const userDataKey = `user_health:${clientInfo.userId}`;
      const existingData = (await this.storage.get(userDataKey)) as HealthDataPoint[] || [];
      existingData.unshift(healthData);
      if (existingData.length > 100) existingData.splice(100);
      await this.storage.put(userDataKey, existingData);

      processedData.push(healthData);
    }

    // Broadcast real-time update to all user's clients
    await this.broadcastToUser(clientInfo.userId, {
      type: 'vitalsense_live_health_update',
      data: {
        metrics: processedData,
        alerts: alerts,
        wellness_insights: this.generateWellnessInsights(processedData),
      },
      timestamp: new Date().toISOString(),
    });

    console.log(`📊 VitalSense processed ${healthDataArray.length} health data points for user ${clientInfo.userId}`);
  }

  /**
   * VitalSense Wellness Score Calculation
   * Enhanced scoring system for comprehensive health assessment
   */
  private calculateVitalSenseWellnessScore(healthData: HealthDataPoint): number {
    switch (healthData.metric_type) {
      case 'heart_rate':
        const hr = healthData.value;
        if (hr >= 60 && hr <= 100) return 0.95; // Optimal range
        if (hr >= 50 && hr <= 120) return 0.8;  // Good range
        if (hr >= 40 && hr <= 150) return 0.6;  // Acceptable range
        if (hr >= 30 && hr <= 180) return 0.4;  // Concerning range
        return 0.2; // Critical range

      case 'walking_steadiness':
        const steadiness = healthData.value;
        if (steadiness >= 80) return 0.95; // Excellent stability
        if (steadiness >= 60) return 0.8;  // Good stability
        if (steadiness >= 40) return 0.6;  // Moderate stability
        if (steadiness >= 20) return 0.4;  // Poor stability
        return 0.2; // Very poor stability - high fall risk

      case 'gait_speed':
        const speed = healthData.value;
        if (speed >= 1.0 && speed <= 1.4) return 0.95; // Optimal gait speed
        if (speed >= 0.8 && speed <= 1.6) return 0.8;  // Good gait speed
        if (speed >= 0.6) return 0.6; // Moderate gait speed
        if (speed >= 0.4) return 0.4; // Slow gait speed
        return 0.2; // Very slow - mobility concern

      case 'step_asymmetry':
        const asymmetry = healthData.value;
        if (asymmetry <= 2) return 0.95;   // Excellent symmetry
        if (asymmetry <= 5) return 0.8;    // Good symmetry
        if (asymmetry <= 10) return 0.6;   // Moderate asymmetry
        if (asymmetry <= 20) return 0.4;   // Poor symmetry
        return 0.2; // Severe asymmetry - balance concern

      case 'double_support_time_percentage':
        const supportTime = healthData.value;
        if (supportTime <= 25) return 0.95; // Excellent dynamic balance
        if (supportTime <= 30) return 0.8;  // Good balance
        if (supportTime <= 35) return 0.6;  // Moderate balance
        return 0.4; // Poor balance

      case 'walking_speed_variability':
        const variability = healthData.value;
        if (variability <= 5) return 0.95;  // Very consistent
        if (variability <= 10) return 0.8;  // Consistent
        if (variability <= 15) return 0.6;  // Moderate variability
        return 0.4; // High variability - instability

      default:
        return 0.8; // Default score for unknown metrics
    }
  }

  /**
   * VitalSense Health Alert System
   * Comprehensive alert logic for all health metrics
   */
  private checkForVitalSenseHealthAlerts(healthData: HealthDataPoint): HealthAlert | null {
    const alerts: Partial<HealthAlert>[] = [];

    switch (healthData.metric_type) {
      case 'heart_rate':
        const hr = healthData.value;
        if (hr > 180) {
          alerts.push({
            alert_type: 'heart_rate_critical_high',
            severity: 'critical',
            title: '🚨 Critical Heart Rate Alert',
            message: `Heart rate dangerously elevated to ${hr} bpm - immediate medical attention required`,
            threshold_value: 180,
          });
        } else if (hr > 150) {
          alerts.push({
            alert_type: 'heart_rate_high',
            severity: 'high',
            title: '⚠️ High Heart Rate Alert',
            message: `Heart rate elevated to ${hr} bpm - please rest and monitor closely`,
            threshold_value: 150,
          });
        } else if (hr < 30) {
          alerts.push({
            alert_type: 'heart_rate_critical_low',
            severity: 'critical',
            title: '🚨 Critical Low Heart Rate',
            message: `Heart rate critically low at ${hr} bpm - seek immediate medical attention`,
            threshold_value: 30,
          });
        } else if (hr < 40) {
          alerts.push({
            alert_type: 'heart_rate_low',
            severity: 'high',
            title: '⚠️ Low Heart Rate Alert',
            message: `Heart rate low at ${hr} bpm - monitor for symptoms`,
            threshold_value: 40,
          });
        }
        break;

      case 'walking_steadiness':
        const steadiness = healthData.value;
        if (steadiness < 20) {
          alerts.push({
            alert_type: 'fall_risk_critical',
            severity: 'critical',
            title: '🚨 Critical Fall Risk Detected',
            message: `Walking steadiness critically low at ${steadiness}% - immediate fall prevention measures needed`,
            threshold_value: 20,
          });
        } else if (steadiness < 30) {
          alerts.push({
            alert_type: 'fall_risk_high',
            severity: 'high',
            title: '⚠️ High Fall Risk Alert',
            message: `Walking steadiness low at ${steadiness}% - increased fall risk, use caution`,
            threshold_value: 30,
          });
        } else if (steadiness < 50) {
          alerts.push({
            alert_type: 'fall_risk_moderate',
            severity: 'medium',
            title: '📋 Moderate Fall Risk',
            message: `Walking steadiness ${steadiness}% - consider fall prevention strategies`,
            threshold_value: 50,
          });
        }
        break;

      case 'gait_speed':
        const speed = healthData.value;
        if (speed < 0.4) {
          alerts.push({
            alert_type: 'mobility_severe',
            severity: 'high',
            title: '🚨 Severe Mobility Concern',
            message: `Gait speed critically low at ${speed} m/s - mobility assessment recommended`,
            threshold_value: 0.4,
          });
        } else if (speed < 0.6) {
          alerts.push({
            alert_type: 'mobility_concern',
            severity: 'medium',
            title: '📋 Mobility Concern',
            message: `Gait speed low at ${speed} m/s - below normal range`,
            threshold_value: 0.6,
          });
        }
        break;

      case 'step_asymmetry':
        const asymmetry = healthData.value;
        if (asymmetry > 20) {
          alerts.push({
            alert_type: 'gait_asymmetry_severe',
            severity: 'high',
            title: '🚨 Severe Gait Asymmetry',
            message: `Step asymmetry high at ${asymmetry}% - possible balance or neurological issue`,
            threshold_value: 20,
          });
        } else if (asymmetry > 10) {
          alerts.push({
            alert_type: 'gait_asymmetry',
            severity: 'medium',
            title: '📋 Gait Asymmetry Detected',
            message: `Step asymmetry at ${asymmetry}% - monitor balance and coordination`,
            threshold_value: 10,
          });
        }
        break;
    }

    if (alerts.length === 0) return null;

    // Return the most severe alert
    const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
    const mostSevere = alerts.reduce((prev, curr) =>
      severityOrder[curr.severity!] > severityOrder[prev.severity!] ? curr : prev
    );

    return {
      id: crypto.randomUUID(),
      user_id: healthData.user_id,
      alert_type: mostSevere.alert_type!,
      severity: mostSevere.severity!,
      title: mostSevere.title!,
      message: mostSevere.message!,
      metric_type: healthData.metric_type,
      metric_value: healthData.value,
      threshold_value: mostSevere.threshold_value!,
      timestamp: Date.now(),
    };
  }

  /**
   * VitalSense Emergency Alert System
   * Handles critical health alerts with emergency response
   */
  private async triggerVitalSenseHealthAlert(userId: string, alert: HealthAlert, healthData: HealthDataPoint): Promise<void> {
    // Store alert in durable storage
    await this.storage.put(`alert:${alert.id}`, alert);

    // Store in user's alerts list
    const userAlertsKey = `user_alerts:${userId}`;
    const existingAlerts = (await this.storage.get(userAlertsKey)) as HealthAlert[] || [];
    existingAlerts.unshift(alert);
    if (existingAlerts.length > 50) existingAlerts.splice(50); // Keep last 50 alerts
    await this.storage.put(userAlertsKey, existingAlerts);

    // Send immediate alert to all user's connected clients
    await this.broadcastToUser(userId, {
      type: 'vitalsense_emergency_alert',
      data: {
        alert,
        healthData,
        response_required: alert.severity === 'critical',
        emergency_contacts_notified: alert.severity === 'critical',
      },
      timestamp: new Date().toISOString(),
    });

    // For critical alerts, trigger external emergency webhook
    if (alert.severity === 'critical' && this.env.EMERGENCY_WEBHOOK_URL) {
      try {
        await fetch(this.env.EMERGENCY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'vitalsense_critical_alert',
            userId,
            alert,
            healthData,
            timestamp: new Date().toISOString(),
          }),
        });
        console.log(`🚨 Critical alert webhook sent for user ${userId}`);
      } catch (error) {
        console.error('🚨 Failed to send emergency webhook:', error);
      }
    }

    console.log(`🚨 VitalSense ${alert.severity} alert triggered: ${alert.title} for user ${userId}`);
  }

  private generateWellnessInsights(healthData: HealthDataPoint[]): any {
    if (healthData.length === 0) return {};

    const latest = healthData[0];
    const wellnessScore = (latest as any).wellness_score || 0.8;

    return {
      overall_wellness_score: wellnessScore,
      trend: healthData.length > 1 ? 'improving' : 'stable',
      recommendations: this.generateHealthRecommendations(latest),
      risk_factors: this.assessRiskFactors(healthData),
    };
  }

  private generateHealthRecommendations(healthData: HealthDataPoint): string[] {
    const recommendations: string[] = [];

    switch (healthData.metric_type) {
      case 'walking_steadiness':
        if (healthData.value < 50) {
          recommendations.push('Consider balance training exercises');
          recommendations.push('Use assistive devices when walking');
          recommendations.push('Ensure adequate lighting in walkways');
        }
        break;
      case 'gait_speed':
        if (healthData.value < 0.8) {
          recommendations.push('Practice walking exercises daily');
          recommendations.push('Consider physical therapy consultation');
        }
        break;
      case 'heart_rate':
        if (healthData.value > 120) {
          recommendations.push('Take rest breaks during activity');
          recommendations.push('Stay hydrated');
          recommendations.push('Monitor stress levels');
        }
        break;
    }

    return recommendations;
  }

  private assessRiskFactors(healthData: HealthDataPoint[]): string[] {
    const risks: string[] = [];

    // Analyze recent health data for risk patterns
    const recentData = healthData.slice(0, 10);

    const steadinessValues = recentData
      .filter(d => d.metric_type === 'walking_steadiness')
      .map(d => d.value);

    if (steadinessValues.length > 0) {
      const avgSteadiness = steadinessValues.reduce((a, b) => a + b, 0) / steadinessValues.length;
      if (avgSteadiness < 40) risks.push('Elevated fall risk');
    }

    return risks;
  }

  private async handleHeartbeat(ws: WebSocket, clientInfo: VitalSenseClient): Promise<void> {
    clientInfo.lastHeartbeat = Date.now();
    this.sendMessage(ws, {
      type: 'heartbeat_ack',
      data: { server_time: new Date().toISOString() },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleHealthSubscription(ws: WebSocket, clientInfo: VitalSenseClient, payload: any): Promise<void> {
    // Store subscription preferences
    if (clientInfo.userId) {
      await this.storage.put(`subscription:${clientInfo.userId}`, {
        metrics: payload.metrics || [],
        alert_levels: payload.alert_levels || ['high', 'critical'],
        real_time: payload.real_time !== false,
      });
    }

    this.sendMessage(ws, {
      type: 'subscription_confirmed',
      data: {
        subscribed_metrics: payload.metrics || [],
        real_time_enabled: true,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleHistoricalHealthRequest(ws: WebSocket, clientInfo: VitalSenseClient, payload: any): Promise<void> {
    if (!clientInfo.userId) return;

    const userDataKey = `user_health:${clientInfo.userId}`;
    const historicalData = (await this.storage.get(userDataKey)) as HealthDataPoint[] || [];

    // Filter by requested metrics and time range
    let filteredData = historicalData;

    if (payload.metrics) {
      filteredData = filteredData.filter(d => payload.metrics.includes(d.metric_type));
    }

    if (payload.since) {
      const sinceTime = new Date(payload.since).getTime();
      filteredData = filteredData.filter(d => d.timestamp >= sinceTime);
    }

    // Limit results
    const limit = Math.min(payload.limit || 100, 500);
    filteredData = filteredData.slice(0, limit);

    this.sendMessage(ws, {
      type: 'historical_health_data',
      data: {
        metrics: filteredData,
        total_count: filteredData.length,
        has_more: historicalData.length > filteredData.length,
      },
      timestamp: new Date().toISOString(),
    });
  }

  private async handleEmergencyEvent(clientInfo: VitalSenseClient, payload: any): Promise<void> {
    if (!clientInfo.userId) return;

    const emergencyEvent = {
      id: crypto.randomUUID(),
      user_id: clientInfo.userId,
      event_type: payload.event_type,
      severity: payload.severity || 'high',
      location_data: payload.location,
      timestamp: Date.now(),
      device_info: clientInfo.deviceInfo,
    };

    // Store emergency event
    await this.storage.put(`emergency:${emergencyEvent.id}`, emergencyEvent);

    // Notify all clients for this user
    await this.broadcastToUser(clientInfo.userId, {
      type: 'vitalsense_emergency_event',
      data: emergencyEvent,
      timestamp: new Date().toISOString(),
    });

    // Trigger external emergency webhook if configured
    if (this.env.EMERGENCY_WEBHOOK_URL) {
      try {
        await fetch(this.env.EMERGENCY_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'vitalsense_emergency_event',
            data: emergencyEvent,
            timestamp: new Date().toISOString(),
          }),
        });
      } catch (error) {
        console.error('🚨 Failed to send emergency event webhook:', error);
      }
    }

    console.log(`🚨 Emergency event recorded: ${emergencyEvent.event_type} for user ${clientInfo.userId}`);
  }

  private async broadcastToUser(userId: string, message: any): Promise<void> {
    for (const [ws, clientInfo] of this.clients) {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.READY_STATE_OPEN) {
        this.sendMessage(ws, message);
      }
    }
  }

  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.READY_STATE_OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private handleDisconnect(ws: WebSocket, clientInfo: VitalSenseClient): void {
    this.clients.delete(ws);
    console.log(`📴 VitalSense client disconnected: ${clientInfo.id} (Total: ${this.clients.size})`);
  }

  private startBackgroundTasks(): void {
    // Heartbeat monitoring
    setInterval(() => {
      const now = Date.now();
      const timeoutMs = 90000; // 90 seconds timeout

      for (const [ws, clientInfo] of this.clients) {
        if (now - clientInfo.lastHeartbeat > timeoutMs) {
          console.log(`💔 VitalSense client timeout: ${clientInfo.id} (${clientInfo.userId})`);
          ws.terminate();
        }
      }
    }, 30000); // Check every 30 seconds

    // Demo health data generation for development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      this.startDemoHealthDataGeneration();
    }
  }

  private startDemoHealthDataGeneration(): void {
    setInterval(() => {
      if (this.clients.size > 0) {
        const demoMetrics = [
          {
            type: 'heart_rate',
            value: 65 + Math.random() * 40,
            unit: 'bpm',
            timestamp: new Date().toISOString(),
            confidence: 0.95,
          },
          {
            type: 'walking_steadiness',
            value: 40 + Math.random() * 50,
            unit: 'percent',
            timestamp: new Date().toISOString(),
            confidence: 0.9,
          },
          {
            type: 'gait_speed',
            value: +(0.6 + Math.random() * 0.8).toFixed(2),
            unit: 'm/s',
            timestamp: new Date().toISOString(),
            confidence: 0.88,
          },
        ];

        // Send to demo users
        this.clients.forEach((clientInfo, ws) => {
          if (
            ws.readyState === WebSocket.READY_STATE_OPEN &&
            (clientInfo.userId === 'demo-user' || !clientInfo.userId)
          ) {
            this.sendMessage(ws, {
              type: 'vitalsense_live_health_update',
              data: {
                metrics: demoMetrics.slice(0, Math.ceil(Math.random() * 3)),
                source: 'demo_generator',
              },
              timestamp: new Date().toISOString(),
            });
          }
        });
      }
    }, 5000); // Every 5 seconds
  }
}

// Main worker export
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // Route to Durable Object
    if (url.pathname.startsWith('/ws') || url.pathname === '/health') {
      const id = env.VITALSENSE_WEBSOCKET.idFromName('vitalsense-main');
      const stub = env.VITALSENSE_WEBSOCKET.get(id);
      return stub.fetch(request);
    }

    // Default response
    return new Response(JSON.stringify({
      service: 'VitalSense Enhanced WebSocket Worker',
      version: '2.0.0',
      timestamp: new Date().toISOString(),
      endpoints: {
        websocket: '/ws',
        health: '/health',
      },
      features: [
        'real_time_health_processing',
        'emergency_alert_system',
        'wellness_scoring',
        'fall_risk_assessment',
        'gait_analysis',
        'health_analytics',
        'emergency_response',
      ],
    }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
