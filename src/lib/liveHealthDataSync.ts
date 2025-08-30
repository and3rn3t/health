/**
 * Live Apple Health Data Synchronization
 * Manages real-time data streaming via WebSocket connections
 */

import { messageEnvelopeSchema } from '@/schemas/health'
import { toast } from 'sonner'

export interface LiveHealthMetric {
  timestamp: string
  metricType: 'heart_rate' | 'steps' | 'walking_steadiness' | 'sleep' | 'activity' | 'fall_event'
  value: number | boolean
  unit?: string
  deviceId: string
  confidence: number
  source: 'apple_watch' | 'iphone' | 'health_app'
  healthScore?: number
  fallRisk?: string
  alert?: {
    level: 'warning' | 'critical'
    message: string
  }
}

export interface WebSocketConfig {
  url: string
  reconnectAttempts: number
  heartbeatInterval: number
  connectionTimeout: number
}

export interface ConnectionStatus {
  connected: boolean
  lastHeartbeat: string
  reconnectAttempts: number
  latency: number
  dataQuality: 'excellent' | 'good' | 'poor' | 'offline'
  clientId?: string
}

export interface LiveDataSubscription {
  id: string
  metricTypes: string[]
  callback: (data: LiveHealthMetric) => void
  filters?: {
    deviceId?: string
    minConfidence?: number
    timeWindow?: number
  }
}

export class LiveHealthDataSync {
  private ws: WebSocket | null = null
  private config: WebSocketConfig
  private subscriptions: Map<string, LiveDataSubscription> = new Map()
  private connectionStatus: ConnectionStatus
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private messageQueue: any[] = []
  private userId: string

  constructor(userId: string, config?: Partial<WebSocketConfig>) {
    this.userId = userId
    this.config = {
      url: config?.url || 'ws://localhost:3001',
      reconnectAttempts: config?.reconnectAttempts || 5,
      heartbeatInterval: config?.heartbeatInterval || 30000,
      connectionTimeout: config?.connectionTimeout || 10000
    }

    this.connectionStatus = {
      connected: false,
      lastHeartbeat: '',
      reconnectAttempts: 0,
      latency: 0,
      dataQuality: 'offline'
    }

    // Listen for HealthKit data from iOS app
    this.setupHealthKitListener()
  }

  private setupHealthKitListener() {
    if (typeof window !== 'undefined') {
      window.addEventListener('healthkit-data', (event: any) => {
        const healthKitData = event.detail
        this.handleHealthKitData(healthKitData)
      })
    }
  }

  private handleHealthKitData(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'live_health_data',
        data: data.data,
        timestamp: data.timestamp
      }))
    } else {
      // Queue data if not connected
      this.messageQueue.push({
        type: 'live_health_data',
        data: data.data,
        timestamp: data.timestamp
      })
    }
  }

  async connect(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.config.url)

        this.ws.onopen = () => {
          console.log('Connected to health monitoring server')
          this.connectionStatus.connected = true
          this.connectionStatus.reconnectAttempts = 0
          this.connectionStatus.dataQuality = 'excellent'

          // Identify as web dashboard client
          this.ws?.send(JSON.stringify({
            type: 'client_identification',
            clientType: 'web_dashboard',
            userId: this.userId
          }))

          // Send queued messages
          this.flushMessageQueue()

          // Start heartbeat
          this.startHeartbeat()

          resolve(true)
        }

        this.ws.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data)
            const parsed = messageEnvelopeSchema.safeParse(raw)
            if (!parsed.success) return
            this.handleServerMessage(parsed.data)
          } catch (error) {
            // Drop invalid payloads silently to avoid leaking data
          }
        }

        this.ws.onclose = () => {
          console.log('Disconnected from health monitoring server')
          this.connectionStatus.connected = false
          this.connectionStatus.dataQuality = 'offline'
          this.stopHeartbeat()
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error)
          this.connectionStatus.dataQuality = 'poor'
          resolve(false)
        }
        
      } catch (error) {
        console.error('Failed to connect to WebSocket:', error)
        resolve(false)
      }
    })
  }

  private handleServerMessage(message: any) {
    switch (message.type) {
      case 'connection_established':
        this.connectionStatus.clientId = (message as any).data?.clientId
        break

      case 'live_health_update':
        this.processLiveHealthUpdate((message as any).data)
        break

      case 'historical_data_update':
        this.processHistoricalData((message as any).data)
        break

      case 'emergency_alert':
        this.handleEmergencyAlert((message as any).data)
        break

      case 'error':
        try {
          toast.error('Realtime error')
        } catch {}
        break
    }
  }

  private processLiveHealthUpdate(data: LiveHealthMetric) {
    // Notify all subscribers
    this.subscriptions.forEach((subscription) => {
      if (subscription.metricTypes.includes(data.metricType)) {
        // Apply filters if any
        if (this.passesFilters(data, subscription.filters)) {
          subscription.callback(data)
        }
      }
    })
  }

  private processHistoricalData(data: any) {
    // Handle historical data updates
    console.log('Historical data received:', data)
  }

  private handleEmergencyAlert(data: any) {
    // Handle emergency alerts
    console.log('Emergency alert:', data)

    // You could show browser notifications here
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Health Emergency Alert', {
        body: data.alert?.message || 'Emergency condition detected',
        icon: '/health-icon.png',
        tag: 'health-emergency'
      })
    }
  }

  private passesFilters(data: LiveHealthMetric, filters?: any): boolean {
    if (!filters) return true

    if (filters.deviceId && data.deviceId !== filters.deviceId) return false
    if (filters.minConfidence && data.confidence < filters.minConfidence) return false

    return true
  }

  private flushMessageQueue() {
    while (this.messageQueue.length > 0 && this.ws?.readyState === WebSocket.OPEN) {
      const message = this.messageQueue.shift()
      this.ws.send(JSON.stringify(message))
    }
  }

  private startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        const startTime = Date.now()
        this.ws.send(JSON.stringify({ type: 'ping', timestamp: startTime }))
      }
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat() {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private attemptReconnect() {
    if (this.connectionStatus.reconnectAttempts >= this.config.reconnectAttempts) {
      console.log('Max reconnection attempts reached')
      return
    }

    this.connectionStatus.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.connectionStatus.reconnectAttempts), 30000)

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.connectionStatus.reconnectAttempts})`)

    this.reconnectTimer = setTimeout(() => {
      this.connect()
    }, delay)
  }

  subscribe(subscription: LiveDataSubscription): string {
    this.subscriptions.set(subscription.id, subscription)

    // Send subscription to server
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'subscribe_health_updates',
        metrics: subscription.metricTypes
      }))
    }

    return subscription.id
  }

  unsubscribe(subscriptionId: string): boolean {
    return this.subscriptions.delete(subscriptionId)
  }

  disconnect() {
    this.stopHeartbeat()

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.connectionStatus.connected = false
    this.connectionStatus.dataQuality = 'offline'
  }

  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  // Request emergency services
  triggerEmergency(emergencyData: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'emergency_alert',
        data: {
          ...emergencyData,
          triggeredBy: 'user',
          timestamp: new Date().toISOString()
        }
      }))
    }
  }
}

// Global instance getter
let globalSyncInstance: LiveHealthDataSync | null = null

export function getLiveHealthDataSync(userId: string): LiveHealthDataSync {
  if (!globalSyncInstance) {
    globalSyncInstance = new LiveHealthDataSync(userId)
  }
  return globalSyncInstance
}