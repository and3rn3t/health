import { useState, useEffect, useCallback } from 'react'
import { useKV } from '@github/spark/hooks'
import { 
  LiveHealthDataSync, 
  LiveHealthMetric, 
  ConnectionStatus,
  LiveDataSubscription,
  getLiveHealthDataSync 
} from '@/lib/liveHealthDataSync'

interface UseLiveHealthDataOptions {
  autoConnect?: boolean
  metricTypes?: string[]
  minConfidence?: number
}

interface LiveHealthDataState {
  isConnected: boolean
  connectionStatus: ConnectionStatus
  liveMetrics: LiveHealthMetric[]
  isLoading: boolean
  error: Error | null
  dataRate: number
  totalMetricsReceived: number
}

export function useLiveHealthData(options: UseLiveHealthDataOptions = {}) {
  const { 
    autoConnect = false, 
    metricTypes = ['heart_rate', 'steps', 'walking_steadiness', 'activity', 'sleep'],
    minConfidence = 0.7 
  } = options

  const [isEnabled, setIsEnabled] = useKV('live-health-data-enabled', false)
  const [subscriptionId, setSubscriptionId] = useState<string | null>(null)
  
  const [state, setState] = useState<LiveHealthDataState>({
    isConnected: false,
    connectionStatus: {
      connected: false,
      lastHeartbeat: '',
      reconnectAttempts: 0,
      latency: 0,
      dataQuality: 'offline'
    },
    liveMetrics: [],
    isLoading: false,
    error: null,
    dataRate: 0,
    totalMetricsReceived: 0
  })

  const liveDataSync = getLiveHealthDataSync()

  // Initialize connection status handler
  useEffect(() => {
    const handleConnectionChange = (status: ConnectionStatus) => {
      setState(prev => ({
        ...prev,
        isConnected: status.connected,
        connectionStatus: status,
        isLoading: false,
        error: status.connected ? null : prev.error
      }))
    }

    const handleDataReceived = (data: LiveHealthMetric) => {
      setState(prev => ({
        ...prev,
        liveMetrics: [data, ...prev.liveMetrics.slice(0, 99)], // Keep last 100 metrics
        totalMetricsReceived: prev.totalMetricsReceived + 1
      }))
    }

    const handleError = (error: Error) => {
      setState(prev => ({
        ...prev,
        error,
        isLoading: false
      }))
    }

    liveDataSync.onConnectionStatusChange(handleConnectionChange)
    liveDataSync.onLiveDataReceived(handleDataReceived)
    liveDataSync.onErrorOccurred(handleError)

    return () => {
      // Cleanup listeners would go here in a full implementation
    }
  }, [liveDataSync])

  // Calculate data rate
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const oneMinuteAgo = now - 60000
      const recentMetrics = state.liveMetrics.filter(metric => 
        new Date(metric.timestamp).getTime() > oneMinuteAgo
      )
      
      setState(prev => ({
        ...prev,
        dataRate: recentMetrics.length
      }))
    }, 10000) // Update every 10 seconds

    return () => clearInterval(interval)
  }, [state.liveMetrics])

  // Auto-connect on mount if enabled
  useEffect(() => {
    if (autoConnect && isEnabled && !state.isConnected && !state.isLoading) {
      connect()
    }
  }, [autoConnect, isEnabled, state.isConnected, state.isLoading])

  const connect = useCallback(async () => {
    if (state.isLoading || state.isConnected) return

    setState(prev => ({ ...prev, isLoading: true, error: null }))

    try {
      const connected = await liveDataSync.connect()
      
      if (connected) {
        // Subscribe to metrics
        const subscription: LiveDataSubscription = {
          id: `subscription-${Date.now()}`,
          metricTypes,
          callback: () => {}, // Data is handled by global handler
          filters: {
            minConfidence
          }
        }

        const subId = liveDataSync.subscribe(subscription)
        setSubscriptionId(subId)
        setIsEnabled(true)
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error : new Error('Connection failed'),
        isLoading: false 
      }))
    }
  }, [liveDataSync, metricTypes, minConfidence, state.isLoading, state.isConnected])

  const disconnect = useCallback(() => {
    if (subscriptionId) {
      liveDataSync.unsubscribe(subscriptionId)
      setSubscriptionId(null)
    }
    
    liveDataSync.disconnect()
    setIsEnabled(false)
    
    setState(prev => ({
      ...prev,
      isConnected: false,
      liveMetrics: [],
      error: null
    }))
  }, [liveDataSync, subscriptionId])

  const toggleConnection = useCallback(async () => {
    if (state.isConnected) {
      disconnect()
    } else {
      await connect()
    }
  }, [state.isConnected, connect, disconnect])

  const clearMetrics = useCallback(() => {
    setState(prev => ({
      ...prev,
      liveMetrics: [],
      totalMetricsReceived: 0
    }))
  }, [])

  const getMetricsByType = useCallback((metricType: string) => {
    return state.liveMetrics.filter(metric => metric.metricType === metricType)
  }, [state.liveMetrics])

  const getLatestMetric = useCallback((metricType: string) => {
    const metrics = getMetricsByType(metricType)
    return metrics.length > 0 ? metrics[0] : null
  }, [getMetricsByType])

  const getMetricsInTimeRange = useCallback((startTime: Date, endTime: Date) => {
    return state.liveMetrics.filter(metric => {
      const metricTime = new Date(metric.timestamp)
      return metricTime >= startTime && metricTime <= endTime
    })
  }, [state.liveMetrics])

  return {
    // Connection state
    isConnected: state.isConnected,
    isLoading: state.isLoading,
    isEnabled,
    connectionStatus: state.connectionStatus,
    error: state.error,

    // Data state
    liveMetrics: state.liveMetrics,
    dataRate: state.dataRate,
    totalMetricsReceived: state.totalMetricsReceived,

    // Actions
    connect,
    disconnect,
    toggleConnection,
    clearMetrics,

    // Data queries
    getMetricsByType,
    getLatestMetric,
    getMetricsInTimeRange,

    // Computed values
    hasRecentData: state.liveMetrics.length > 0 && 
      new Date().getTime() - new Date(state.liveMetrics[0].timestamp).getTime() < 60000,
    averageLatency: state.connectionStatus.latency,
    dataQuality: state.connectionStatus.dataQuality
  }
}