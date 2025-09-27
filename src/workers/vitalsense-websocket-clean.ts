/**
 * VitalSense Enhanced WebSocket Worker
 * Simplified but complete implementation with VitalSense health processing
 */

interface Env {
  VITALSENSE_WEBSOCKET: DurableObjectNamespace;
}

interface HealthData {
  type: string;
  value: number;
  unit: string;
  timestamp: string;
  confidence?: number;
}

interface VitalSenseClient {
  id: string;
  userId?: string;
  connectedAt: number;
  lastHeartbeat: number;
}

export class VitalSenseWebSocketDO {
  private clients: Map<WebSocket, VitalSenseClient> = new Map();
  private storage: DurableObjectStorage;

  constructor(ctx: DurableObjectState, env: Env) {
    this.storage = ctx.storage;
    this.startHeartbeatCheck();
  }

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === '/health') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          service: 'VitalSense Enhanced WebSocket',
          clients: this.clients.size,
          features: [
            'real_time_health_processing',
            'wellness_scoring',
            'fall_risk_assessment',
            'emergency_alerts',
          ],
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (request.headers.get('Upgrade') === 'websocket') {
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      await this.handleWebSocketConnection(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('VitalSense Enhanced WebSocket Worker', {
      status: 200,
    });
  }

  private async handleWebSocketConnection(ws: WebSocket): Promise<void> {
    const clientId = crypto.randomUUID();
    const clientInfo: VitalSenseClient = {
      id: clientId,
      connectedAt: Date.now(),
      lastHeartbeat: Date.now(),
    };

    this.clients.set(ws, clientInfo);
    console.log(`🏥 VitalSense client connected: ${clientId}`);

    ws.accept();

    // Send enhanced welcome message
    this.sendMessage(ws, {
      type: 'vitalsense_connection_established',
      data: {
        clientId,
        serverTime: new Date().toISOString(),
        capabilities: [
          'real_time_health_monitoring',
          'wellness_scoring',
          'fall_risk_assessment',
          'gait_analysis',
          'emergency_alerts',
        ],
      },
      timestamp: new Date().toISOString(),
    });

    ws.addEventListener('message', (event) => {
      this.handleMessage(ws, event.data, clientInfo);
    });

    ws.addEventListener('close', () => {
      this.clients.delete(ws);
      console.log(`📴 VitalSense client disconnected: ${clientId}`);
    });
  }

  private async handleMessage(
    ws: WebSocket,
    data: string,
    clientInfo: VitalSenseClient
  ): Promise<void> {
    try {
      const message = JSON.parse(data);
      const { type, ...payload } = message;

      switch (type) {
        case 'client_identification':
          clientInfo.userId = payload.userId;
          console.log(`👤 VitalSense client identified: ${payload.userId}`);

          this.sendMessage(ws, {
            type: 'identification_confirmed',
            data: {
              status: 'authenticated',
              features_enabled: ['health_monitoring', 'emergency_alerts'],
            },
          });
          break;

        case 'vitalsense_health_data':
          await this.processVitalSenseHealthData(clientInfo, payload);
          break;

        case 'heartbeat':
          clientInfo.lastHeartbeat = Date.now();
          this.sendMessage(ws, {
            type: 'heartbeat_ack',
            timestamp: new Date().toISOString(),
          });
          break;

        default:
          console.warn(`Unknown message type: ${type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private async processVitalSenseHealthData(
    clientInfo: VitalSenseClient,
    payload: any
  ): Promise<void> {
    if (!clientInfo.userId) return;

    const healthDataArray = Array.isArray(payload.data)
      ? payload.data
      : [payload.data || payload];
    const processedData = [];
    const alerts = [];

    for (const dataPoint of healthDataArray) {
      // Calculate VitalSense wellness score
      const wellnessScore = this.calculateWellnessScore(dataPoint);

      // Check for health alerts
      const alert = this.checkForHealthAlerts(dataPoint);
      if (alert) {
        alerts.push(alert);
        console.log(`🚨 VitalSense ${alert.severity} alert: ${alert.title}`);
      }

      const processedPoint = {
        ...dataPoint,
        id: crypto.randomUUID(),
        user_id: clientInfo.userId,
        wellness_score: wellnessScore,
        processed_at: Date.now(),
      };

      // Store in durable storage
      await this.storage.put(`health:${processedPoint.id}`, processedPoint);
      processedData.push(processedPoint);
    }

    // Broadcast to all user's clients
    await this.broadcastToUser(clientInfo.userId, {
      type: 'vitalsense_live_health_update',
      data: {
        metrics: processedData,
        alerts: alerts,
        wellness_insights: this.generateWellnessInsights(processedData),
      },
      timestamp: new Date().toISOString(),
    });

    console.log(
      `📊 VitalSense processed ${healthDataArray.length} health data points`
    );
  }

  private calculateWellnessScore(healthData: HealthData): number {
    switch (healthData.type) {
      case 'heart_rate':
        const hr = healthData.value;
        if (hr >= 60 && hr <= 100) return 0.95;
        if (hr >= 50 && hr <= 120) return 0.8;
        if (hr >= 40 && hr <= 150) return 0.6;
        return 0.4;

      case 'walking_steadiness':
        const steadiness = healthData.value;
        if (steadiness >= 80) return 0.95;
        if (steadiness >= 60) return 0.8;
        if (steadiness >= 40) return 0.6;
        if (steadiness >= 20) return 0.4;
        return 0.2;

      case 'gait_speed':
        const speed = healthData.value;
        if (speed >= 1.0 && speed <= 1.4) return 0.95;
        if (speed >= 0.8) return 0.8;
        if (speed >= 0.6) return 0.6;
        return 0.4;

      default:
        return 0.8;
    }
  }

  private checkForHealthAlerts(healthData: HealthData): any {
    switch (healthData.type) {
      case 'heart_rate':
        const hr = healthData.value;
        if (hr > 180) {
          return {
            severity: 'critical',
            title: '🚨 Critical Heart Rate Alert',
            message: `Heart rate dangerously elevated to ${hr} bpm`,
            metric_type: 'heart_rate',
            threshold: 180,
          };
        } else if (hr > 150) {
          return {
            severity: 'high',
            title: '⚠️ High Heart Rate Alert',
            message: `Heart rate elevated to ${hr} bpm`,
            metric_type: 'heart_rate',
            threshold: 150,
          };
        } else if (hr < 30) {
          return {
            severity: 'critical',
            title: '🚨 Critical Low Heart Rate',
            message: `Heart rate critically low at ${hr} bpm`,
            metric_type: 'heart_rate',
            threshold: 30,
          };
        }
        break;

      case 'walking_steadiness':
        const steadiness = healthData.value;
        if (steadiness < 20) {
          return {
            severity: 'critical',
            title: '🚨 Critical Fall Risk',
            message: `Walking steadiness critically low at ${steadiness}%`,
            metric_type: 'walking_steadiness',
            threshold: 20,
          };
        } else if (steadiness < 30) {
          return {
            severity: 'high',
            title: '⚠️ High Fall Risk',
            message: `Walking steadiness low at ${steadiness}%`,
            metric_type: 'walking_steadiness',
            threshold: 30,
          };
        }
        break;

      case 'gait_speed':
        const speed = healthData.value;
        if (speed < 0.4) {
          return {
            severity: 'high',
            title: '🚨 Severe Mobility Concern',
            message: `Gait speed critically low at ${speed} m/s`,
            metric_type: 'gait_speed',
            threshold: 0.4,
          };
        }
        break;
    }

    return null;
  }

  private generateWellnessInsights(healthData: any[]): any {
    if (healthData.length === 0) return {};

    const avgWellness =
      healthData.reduce((sum, d) => sum + (d.wellness_score || 0.8), 0) /
      healthData.length;

    return {
      overall_wellness_score: avgWellness,
      trend: 'stable',
      recommendations: this.getHealthRecommendations(healthData[0]),
      processed_metrics: healthData.length,
    };
  }

  private getHealthRecommendations(healthData: any): string[] {
    const recommendations = [];

    if (healthData.type === 'walking_steadiness' && healthData.value < 50) {
      recommendations.push('Consider balance training exercises');
      recommendations.push('Use assistive devices when walking');
    }

    if (healthData.type === 'gait_speed' && healthData.value < 0.8) {
      recommendations.push('Practice walking exercises daily');
      recommendations.push('Consider physical therapy consultation');
    }

    if (healthData.type === 'heart_rate' && healthData.value > 120) {
      recommendations.push('Take rest breaks during activity');
      recommendations.push('Monitor stress levels');
    }

    return recommendations;
  }

  private async broadcastToUser(userId: string, message: any): Promise<void> {
    for (const [ws, clientInfo] of this.clients) {
      if (clientInfo.userId === userId && ws.readyState === WebSocket.OPEN) {
        this.sendMessage(ws, message);
      }
    }
  }

  private sendMessage(ws: WebSocket, message: any): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeatCheck(): void {
    setInterval(() => {
      const now = Date.now();
      const timeoutMs = 90000; // 90 seconds

      for (const [ws, clientInfo] of this.clients) {
        if (now - clientInfo.lastHeartbeat > timeoutMs) {
          console.log(`💔 VitalSense client timeout: ${clientInfo.id}`);
          ws.close();
        }
      }
    }, 30000);
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/ws') || url.pathname === '/health') {
      const id = env.VITALSENSE_WEBSOCKET.idFromName('vitalsense-enhanced');
      const stub = env.VITALSENSE_WEBSOCKET.get(id);
      return stub.fetch(request);
    }

    return new Response(
      JSON.stringify({
        service: 'VitalSense Enhanced WebSocket Worker',
        version: '2.0.0-enhanced',
        timestamp: new Date().toISOString(),
        endpoints: { websocket: '/ws', health: '/health' },
        features: [
          'real_time_health_processing',
          'emergency_alert_system',
          'wellness_scoring',
          'fall_risk_assessment',
          'gait_analysis',
          'health_analytics',
        ],
      }),
      {
        headers: { 'Content-Type': 'application/json' },
      }
    );
  },
};
