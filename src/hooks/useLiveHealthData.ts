import { useState, useEffect, useCallback } from 'react'
import { getLiveHealthDataSync, LiveHealthMetric, ConnectionStatus } from '@/lib/liveHealthDataSync'

export function useLiveHealthData(userId: string = 'default-user') {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastHeartbeat: '',
    reconnectAttempts: 0,
    latency: 0,
    dataQuality: 'offline'
  })

  const [liveMetrics, setLiveMetrics] = useState<LiveHealthMetric[]>([])
  const [latestMetrics, setLatestMetrics] = useState<Record<string, LiveHealthMetric>>({})
  const [isConnecting, setIsConnecting] = useState(false)

  const healthDataSync = getLiveHealthDataSync(userId)

  const connectToHealthData = useCallback(async () => {
    setIsConnecting(true)
    try {
      const connected = await healthDataSync.connect()
      setConnectionStatus(healthDataSync.getConnectionStatus())

      if (connected) {
        // Subscribe to all health metrics
        healthDataSync.subscribe({
          id: 'main-dashboard',
          metricTypes: ['heart_rate', 'walking_steadiness', 'steps', 'activity', 'fall_event'],
          callback: (data: LiveHealthMetric) => {
            setLiveMetrics(prev => [...prev.slice(-99), data]) // Keep last 100 metrics
            setLatestMetrics(prev => ({
              ...prev,
              [data.metricType]: data
            }))
          }
        })
      }
    } catch (error) {
      console.error('Failed to connect to health data:', error)
    } finally {
      setIsConnecting(false)
    }
  }, [userId, healthDataSync])

  const disconnectFromHealthData = useCallback(() => {
    healthDataSync.disconnect()
    setConnectionStatus(healthDataSync.getConnectionStatus())
  }, [healthDataSync])

  const triggerEmergency = useCallback((emergencyData: any) => {
    healthDataSync.triggerEmergency(emergencyData)
  }, [healthDataSync])

  // Auto-connect on mount
  useEffect(() => {
    connectToHealthData()

    // Update connection status periodically
    const statusInterval = setInterval(() => {
      setConnectionStatus(healthDataSync.getConnectionStatus())
    }, 5000)

    return () => {
      clearInterval(statusInterval)
      disconnectFromHealthData()
    }
  }, [connectToHealthData, disconnectFromHealthData, healthDataSync])

  // Request notification permissions
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  return {
    connectionStatus,
    liveMetrics,
    latestMetrics,
    isConnecting,
    connectToHealthData,
    disconnectFromHealthData,
    triggerEmergency
  }
}