/**
 * Live Apple Health Data Synchronization
 * Manages real-time data streaming via WebSocket connections
 */

import { ProcessedHealthData } from './healthDataProcessor'

export interface LiveHealthMetric {
  timestamp: string
  metricType: 'heart_rate' | 'steps' | 'walking_steadiness' | 'sleep' | 'activity' | 'fall_event'
  value: number | boolean
  unit?: string
  deviceId: string
  confidence: number
  source: 'apple_watch' | 'iphone' | 'health_app'
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
  private heartbeatTimer: NodeJS.Timeout | null = null
  private reconnectTimer: NodeJS.Timeout | null = null
  private messageQueue: any[] = []
  private isReconnecting = false

  // Event handlers
  private onConnectionChange: ((status: ConnectionStatus) => void) | null = null
  private onDataReceived: ((data: LiveHealthMetric) => void) | null = null
  private onError: ((error: Error) => void) | null = null

  constructor(config: Partial<WebSocketConfig> = {}) {
    this.config = {
      url: config.url || 'wss://healthguard-live.example.com/stream',
      reconnectAttempts: config.reconnectAttempts || 5,
      heartbeatInterval: config.heartbeatInterval || 30000,
      connectionTimeout: config.connectionTimeout || 10000,
      ...config
    }

    this.connectionStatus = {
      connected: false,
      lastHeartbeat: '',
      reconnectAttempts: 0,
      latency: 0,
      dataQuality: 'offline'
    }
  }

  /**
   * Initialize WebSocket connection
   */
  async connect(): Promise<boolean> {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return true
    }

    try {
      // In a real implementation, this would connect to actual Apple Health WebSocket API
      // For now, we'll simulate the connection
      await this.simulateConnection()
      return true
    } catch (error) {
      this.handleError(new Error(`Failed to connect: ${error}`))
      return false
    }
  }

  /**
   * Simulate WebSocket connection for development
   */
  private async simulateConnection(): Promise<void> {
    return new Promise((resolve, reject) => {
      // Simulate connection delay
      setTimeout(() => {
        this.connectionStatus.connected = true
        this.connectionStatus.dataQuality = 'excellent'
        this.connectionStatus.lastHeartbeat = new Date().toISOString()
        
        this.startHeartbeat()
        this.startDataSimulation()
        
        if (this.onConnectionChange) {
          this.onConnectionChange(this.connectionStatus)
        }
        
        resolve()
      }, 1000)
    })
  }

  /**
   * Disconnect from WebSocket
   */
  disconnect(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }

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
    
    if (this.onConnectionChange) {
      this.onConnectionChange(this.connectionStatus)
    }
  }

  /**
   * Subscribe to live health data updates
   */
  subscribe(subscription: LiveDataSubscription): string {
    this.subscriptions.set(subscription.id, subscription)
    
    // If connected, immediately start receiving relevant data
    if (this.connectionStatus.connected) {
      this.sendSubscriptionMessage(subscription)
    }
    
    return subscription.id
  }

  /**
   * Unsubscribe from data updates
   */
  unsubscribe(subscriptionId: string): boolean {
    const removed = this.subscriptions.delete(subscriptionId)
    
    if (removed && this.connectionStatus.connected) {
      this.sendUnsubscriptionMessage(subscriptionId)
    }
    
    return removed
  }

  /**
   * Send authentication and subscription messages
   */
  private sendSubscriptionMessage(subscription: LiveDataSubscription): void {
    // In real implementation, this would send WebSocket messages
    // For simulation, we'll just log the subscription
    console.log('Subscribing to:', subscription.metricTypes)
  }

  private sendUnsubscriptionMessage(subscriptionId: string): void {
    console.log('Unsubscribing from:', subscriptionId)
  }

  /**
   * Start heartbeat to maintain connection
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.connectionStatus.connected) {
        const now = new Date().toISOString()
        this.connectionStatus.lastHeartbeat = now
        
        // Simulate latency check
        this.connectionStatus.latency = Math.random() * 100 + 20
        
        if (this.onConnectionChange) {
          this.onConnectionChange(this.connectionStatus)
        }
      }
    }, this.config.heartbeatInterval)
  }

  /**
   * Simulate incoming health data for development
   */
  private startDataSimulation(): void {
    const simulateData = () => {
      if (!this.connectionStatus.connected) return

      // Generate simulated health metrics
      const metrics: LiveHealthMetric[] = [
        {
          timestamp: new Date().toISOString(),
          metricType: 'heart_rate',
          value: Math.floor(Math.random() * 40) + 60, // 60-100 BPM
          unit: 'bpm',
          deviceId: 'apple-watch-series-9',
          confidence: 0.95,
          source: 'apple_watch'
        },
        {
          timestamp: new Date().toISOString(),
          metricType: 'steps',
          value: Math.floor(Math.random() * 20) + 5, // 5-25 steps per update
          unit: 'count',
          deviceId: 'iphone-15-pro',
          confidence: 0.92,
          source: 'iphone'
        },
        {
          timestamp: new Date().toISOString(),
          metricType: 'walking_steadiness',
          value: Math.random() * 0.2 + 0.8, // 0.8-1.0 steadiness
          unit: 'score',
          deviceId: 'apple-watch-series-9',
          confidence: 0.88,
          source: 'apple_watch'
        }
      ]

      // Send random metric to subscribers
      const randomMetric = metrics[Math.floor(Math.random() * metrics.length)]
      this.processIncomingData(randomMetric)

      // Schedule next update (every 5-15 seconds)
      setTimeout(simulateData, Math.random() * 10000 + 5000)
    }

    // Start simulation after initial delay
    setTimeout(simulateData, 2000)
  }

  /**
   * Process incoming WebSocket data
   */
  private processIncomingData(data: LiveHealthMetric): void {
    // Notify global data handler
    if (this.onDataReceived) {
      this.onDataReceived(data)
    }

    // Notify specific subscribers
    this.subscriptions.forEach((subscription) => {
      if (this.shouldNotifySubscription(subscription, data)) {
        try {
          subscription.callback(data)
        } catch (error) {
          console.error('Error in subscription callback:', error)
        }
      }
    })
  }

  /**
   * Check if subscription should be notified of data
   */
  private shouldNotifySubscription(subscription: LiveDataSubscription, data: LiveHealthMetric): boolean {
    // Check metric type filter
    if (!subscription.metricTypes.includes(data.metricType)) {
      return false
    }

    // Check confidence filter
    if (subscription.filters?.minConfidence && data.confidence < subscription.filters.minConfidence) {
      return false
    }

    // Check device filter
    if (subscription.filters?.deviceId && data.deviceId !== subscription.filters.deviceId) {
      return false
    }

    return true
  }

  /**
   * Handle connection errors
   */
  private handleError(error: Error): void {
    console.error('WebSocket error:', error)
    
    if (this.onError) {
      this.onError(error)
    }

    // Attempt reconnection if not already reconnecting
    if (!this.isReconnecting && this.connectionStatus.reconnectAttempts < this.config.reconnectAttempts) {
      this.attemptReconnection()
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private async attemptReconnection(): Promise<void> {
    if (this.isReconnecting) return

    this.isReconnecting = true
    this.connectionStatus.reconnectAttempts++

    const backoffMs = Math.pow(2, this.connectionStatus.reconnectAttempts) * 1000
    
    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect()
        this.connectionStatus.reconnectAttempts = 0
        this.isReconnecting = false
      } catch (error) {
        this.isReconnecting = false
        if (this.connectionStatus.reconnectAttempts < this.config.reconnectAttempts) {
          this.attemptReconnection()
        } else {
          this.handleError(new Error('Max reconnection attempts reached'))
        }
      }
    }, backoffMs)
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return { ...this.connectionStatus }
  }

  /**
   * Set event handlers
   */
  onConnectionStatusChange(handler: (status: ConnectionStatus) => void): void {
    this.onConnectionChange = handler
  }

  onLiveDataReceived(handler: (data: LiveHealthMetric) => void): void {
    this.onDataReceived = handler
  }

  onErrorOccurred(handler: (error: Error) => void): void {
    this.onError = handler
  }

  /**
   * Queue messages when offline
   */
  private queueMessage(message: any): void {
    this.messageQueue.push({
      ...message,
      timestamp: new Date().toISOString()
    })

    // Limit queue size
    if (this.messageQueue.length > 100) {
      this.messageQueue.shift()
    }
  }

  /**
   * Process queued messages when reconnected
   */
  private processMessageQueue(): void {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift()
      // Process queued message
      console.log('Processing queued message:', message)
    }
  }
}

/**
 * Singleton instance for global access
 */
let liveDataSyncInstance: LiveHealthDataSync | null = null

export function getLiveHealthDataSync(): LiveHealthDataSync {
  if (!liveDataSyncInstance) {
    liveDataSyncInstance = new LiveHealthDataSync()
  }
  return liveDataSyncInstance
}

/**
 * React hook for live health data
 */
export function useLiveHealthData() {
  return getLiveHealthDataSync()
}