/**
 * Live Apple Health Data Synchronization
 * Manages real-time data streaming via WebSocket connections
 */

import { messageEnvelopeSchema, type MessageEnvelope } from '@/schemas/health';
import { toast } from 'sonner';

export interface LiveHealthMetric {
  timestamp: string;
  metricType:
    | 'heart_rate'
    | 'steps'
    | 'walking_steadiness'
    | 'sleep'
    | 'activity'
    | 'fall_event';
  value: number | boolean;
  unit?: string;
  deviceId: string;
  confidence: number;
  source: 'apple_watch' | 'iphone' | 'health_app';
  healthScore?: number;
  fallRisk?: string;
  alert?: {
    level: 'warning' | 'critical';
    message: string;
  };
}

export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  heartbeatInterval: number;
  connectionTimeout: number;
}

export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat: string;
  reconnectAttempts: number;
  latency: number;
  dataQuality: 'excellent' | 'good' | 'poor' | 'offline';
  clientId?: string;
}

export interface LiveDataSubscription {
  id: string;
  metricTypes: string[];
  callback: (data: LiveHealthMetric) => void;
  filters?: {
    deviceId?: string;
    minConfidence?: number;
    timeWindow?: number;
  };
}

type OutboundMessage = { type: string; [key: string]: unknown };
type HealthKitEventDetail = { data: LiveHealthMetric; timestamp: string };
type AlertData = { alert?: { message?: string } } & Record<string, unknown>;
type EmergencyPayload = {
  triggeredBy: 'user' | 'system';
  timestamp: string;
} & Record<string, unknown>;

declare global {
  interface Window {
    __WS_API_KEY__?: string;
  }
}

export class LiveHealthDataSync {
  private ws: WebSocket | null = null;
  private readonly config: WebSocketConfig;
  private readonly subscriptions: Map<string, LiveDataSubscription> = new Map();
  private readonly connectionStatus: ConnectionStatus;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly messageQueue: OutboundMessage[] = [];
  private readonly userId: string;
  private lastPingAt: number = 0;
  private pendingEmergencyTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingEmergencyExpiresAt: number | null = null;
  private pendingEmergencyData: EmergencyPayload | null = null;

  constructor(userId: string, config?: Partial<WebSocketConfig>) {
    this.userId = userId;
    this.config = {
      url: config?.url || 'ws://localhost:3001',
      reconnectAttempts: config?.reconnectAttempts || 5,
      heartbeatInterval: config?.heartbeatInterval || 30000,
      connectionTimeout: config?.connectionTimeout || 10000,
    };

    this.connectionStatus = {
      connected: false,
      lastHeartbeat: '',
      reconnectAttempts: 0,
      latency: 0,
      dataQuality: 'offline',
    };

    // Listen for HealthKit data from iOS app
    this.setupHealthKitListener();
  }

  private setupHealthKitListener() {
    if (
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function'
    ) {
      window.addEventListener('healthkit-data', (event: Event) => {
        const ce = event as CustomEvent<HealthKitEventDetail>;
        const healthKitData = ce.detail;
        this.handleHealthKitData(healthKitData);
      });
    }
  }

  private handleHealthKitData(data: HealthKitEventDetail) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'live_health_data',
          data: data.data,
          timestamp: data.timestamp,
        })
      );
    } else {
      // Queue data if not connected
      this.messageQueue.push({
        type: 'live_health_data',
        data: data.data,
        timestamp: data.timestamp,
      });
    }
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        let token: string | undefined;
        try {
          if (typeof window !== 'undefined') {
            token = (window as unknown as { __WS_DEVICE_TOKEN__?: string })
              .__WS_DEVICE_TOKEN__;
          }
        } catch {
          // ignore
        }
        // Allow dev override of WS URL via window hint
        let baseUrl = this.config.url;
        try {
          if (typeof window !== 'undefined') {
            const override = (window as unknown as { __WS_URL__?: string })
              .__WS_URL__;
            if (override) baseUrl = override;
          }
        } catch {
          // ignore
        }
        let wsUrl = baseUrl;
        if (token) {
          wsUrl +=
            (wsUrl.includes('?') ? '&' : '?') +
            'token=' +
            encodeURIComponent(token);
        }
        this.ws = new WebSocket(wsUrl);

        if (!this.ws) {
          resolve(false);
          return;
        }

        this.ws.onopen = () => {
          console.log('Connected to health monitoring server');
          this.connectionStatus.connected = true;
          this.connectionStatus.reconnectAttempts = 0;
          this.connectionStatus.dataQuality = 'excellent';

          // Identify as web dashboard client
          this.ws?.send(
            JSON.stringify({
              type: 'client_identification',
              clientType: 'web_dashboard',
              userId: this.userId,
              // Dev-only optional API key; do not set in production client builds
              apiKey:
                (typeof window !== 'undefined' && window.__WS_API_KEY__) ||
                undefined,
            })
          );

          // Send queued messages
          this.flushMessageQueue();

          // Start heartbeat
          this.startHeartbeat();

          resolve(true);
        };

        this.ws.onmessage = (event: MessageEvent) => {
          try {
            const raw = JSON.parse(event.data);
            const parsed = messageEnvelopeSchema.safeParse(raw);
            if (!parsed.success) return;
            this.handleServerMessage(parsed.data);
          } catch {
            // Swallow parse errors; avoid leaking details
            console.debug('ws message parse failed');
          }
        };

        this.ws.onclose = () => {
          console.log('Disconnected from health monitoring server');
          this.connectionStatus.connected = false;
          this.connectionStatus.dataQuality = 'offline';
          this.stopHeartbeat();
          this.attemptReconnect();
        };

        this.ws.onerror = (error: Event) => {
          console.error('WebSocket error:', error);
          this.connectionStatus.dataQuality = 'poor';
          resolve(false);
        };
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error);
        resolve(false);
      }
    });
  }

  private handleServerMessage(message: MessageEnvelope) {
    switch (message.type) {
      case 'connection_established':
        // Narrow unknown payload
        {
          const d = (message as unknown as { data?: { clientId?: string } })
            .data;
          if (d && typeof d.clientId === 'string')
            this.connectionStatus.clientId = d.clientId;
        }
        break;
      // 'pong' is an app-level message our server may send; not part of zod union yet
      case 'pong': {
        const now = Date.now();
        if (this.lastPingAt) {
          this.connectionStatus.latency = Math.max(0, now - this.lastPingAt);
          this.connectionStatus.lastHeartbeat = new Date(now).toISOString();
        }
        break;
      }

      case 'live_health_update':
        {
          const d = message.data;
          if (
            d &&
            typeof d === 'object' &&
            'metricType' in (d as Record<string, unknown>)
          ) {
            this.processLiveHealthUpdate(d as LiveHealthMetric);
          }
        }
        break;

      case 'historical_data_update':
        this.processHistoricalData(message.data);
        break;

      case 'emergency_alert':
        {
          const d = message.data;
          if (d && typeof d === 'object') {
            this.handleEmergencyAlert(d as { alert?: { message?: string } });
          }
        }
        break;

      case 'error':
        try {
          toast.error('Realtime error');
        } catch {
          /* noop */
        }
        break;
    }
  }

  private processLiveHealthUpdate(data: LiveHealthMetric) {
    // Notify all subscribers
    this.subscriptions.forEach((subscription) => {
      if (subscription.metricTypes.includes(data.metricType)) {
        // Apply filters if any
        if (this.passesFilters(data, subscription.filters)) {
          subscription.callback(data);
        }
      }
    });
  }

  private processHistoricalData(data: unknown) {
    // Handle historical data updates
    console.log('Historical data received:', data);
  }

  private handleEmergencyAlert(data: AlertData) {
    // Handle emergency alerts
    console.log('Emergency alert:', data);

    // You could show browser notifications here
    if (
      typeof window !== 'undefined' &&
      'Notification' in window &&
      Notification.permission === 'granted'
    ) {
      new Notification('Health Emergency Alert', {
        body: data?.alert?.message ?? 'Emergency condition detected',
        icon: '/health-icon.png',
        tag: 'health-emergency',
      });
    }

    // Dispatch a DOM event for app-level listeners
    try {
      window.dispatchEvent(
        new CustomEvent('health-emergency', { detail: { data } })
      );
    } catch {
      /* noop */
    }
  }

  private passesFilters(
    data: LiveHealthMetric,
    filters?: { deviceId?: string; minConfidence?: number; timeWindow?: number }
  ): boolean {
    if (!filters) return true;

    if (filters.deviceId && data.deviceId !== filters.deviceId) return false;
    if (filters.minConfidence && data.confidence < filters.minConfidence)
      return false;

    return true;
  }

  private flushMessageQueue() {
    while (
      this.messageQueue.length > 0 &&
      this.ws?.readyState === WebSocket.OPEN
    ) {
      const message = this.messageQueue.shift();
      this.ws.send(JSON.stringify(message));
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const startTime = Date.now();
        this.lastPingAt = startTime;
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: startTime }));
      }
    }, this.config.heartbeatInterval);
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  // Public: trigger a single ping and let latency update on 'pong'.
  // Returns true if a ping was sent.
  requestPing(): boolean {
    if (this.ws?.readyState === WebSocket.OPEN) {
      const startTime = Date.now();
      this.lastPingAt = startTime;
      this.ws.send(JSON.stringify({ type: 'ping', timestamp: startTime }));
      return true;
    }
    return false;
  }

  private attemptReconnect() {
    if (
      this.connectionStatus.reconnectAttempts >= this.config.reconnectAttempts
    ) {
      console.log('Max reconnection attempts reached');
      return;
    }

    this.connectionStatus.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.connectionStatus.reconnectAttempts),
      30000
    );

    console.log(
      `Attempting to reconnect in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts})`
    );

    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  subscribe(subscription: LiveDataSubscription): string {
    this.subscriptions.set(subscription.id, subscription);

    // Send subscription to server
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(
        JSON.stringify({
          type: 'subscribe_health_updates',
          metrics: subscription.metricTypes,
        })
      );
    }

    return subscription.id;
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId);
  }

  disconnect() {
    this.stopHeartbeat();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionStatus.connected = false;
    this.connectionStatus.dataQuality = 'offline';
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus };
  }

  // Request emergency services
  triggerEmergency(
    emergencyData: Record<string, unknown>,
    cancelWindowMs: number = 30_000
  ) {
    // If a pending emergency exists, replace it and reset timer
    if (this.pendingEmergencyTimer) {
      clearTimeout(this.pendingEmergencyTimer);
      this.pendingEmergencyTimer = null;
    }
    const now = Date.now();
    this.pendingEmergencyData = {
      ...emergencyData,
      triggeredBy: 'user',
      timestamp: new Date(now).toISOString(),
    };
    this.pendingEmergencyExpiresAt = now + cancelWindowMs;
    // Notify UI: pending
    try {
      window.dispatchEvent(
        new CustomEvent('emergency-pending', {
          detail: {
            data: this.pendingEmergencyData,
            expiresAt: this.pendingEmergencyExpiresAt,
          },
        })
      );
    } catch {
      // noop
    }

    // Schedule actual send
    this.pendingEmergencyTimer = setTimeout(() => {
      if (this.ws?.readyState === WebSocket.OPEN && this.pendingEmergencyData) {
        this.ws.send(
          JSON.stringify({
            type: 'emergency_alert',
            data: this.pendingEmergencyData,
          })
        );
      }
      try {
        window.dispatchEvent(
          new CustomEvent('emergency-sent', {
            detail: { data: this.pendingEmergencyData },
          })
        );
      } catch {
        // noop
      }
      this.pendingEmergencyData = null;
      this.pendingEmergencyExpiresAt = null;
      this.pendingEmergencyTimer = null;
    }, cancelWindowMs);
  }

  cancelPendingEmergency() {
    if (this.pendingEmergencyTimer) {
      clearTimeout(this.pendingEmergencyTimer);
      this.pendingEmergencyTimer = null;
    }
    this.pendingEmergencyData = null;
    this.pendingEmergencyExpiresAt = null;
    try {
      window.dispatchEvent(new CustomEvent('emergency-cancelled'));
    } catch {
      // noop
    }
  }

  getPendingEmergency(): { data: EmergencyPayload; expiresAt: number } | null {
    if (!this.pendingEmergencyData || !this.pendingEmergencyExpiresAt)
      return null;
    return {
      data: this.pendingEmergencyData,
      expiresAt: this.pendingEmergencyExpiresAt,
    };
  }
}

// Global instance getter
let globalSyncInstance: LiveHealthDataSync | null = null;

export function getLiveHealthDataSync(userId: string): LiveHealthDataSync {
  globalSyncInstance ??= new LiveHealthDataSync(userId);
  return globalSyncInstance;
}
