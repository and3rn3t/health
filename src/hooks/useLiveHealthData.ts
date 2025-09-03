import { useCallback, useEffect, useState } from 'react';
import { useWebSocket, type MessageHandlers } from './useWebSocket';

export interface LiveHealthMetric {
  id: string;
  userId: string;
  metricType:
    | 'heart_rate'
    | 'walking_steadiness'
    | 'step_count'
    | 'fall_detected';
  value: number;
  unit: string;
  timestamp: number;
  source?: string;
  processedAt: number;
  wellnessScore: number;
}

export interface HistoricalDataUpdate {
  type: string;
  samples: LiveHealthMetric[];
  count: number;
}

export interface EmergencyAlert {
  metric_type: string;
  alert_level: 'warning' | 'critical';
  message: string;
  value: number;
  timestamp: number;
  user_id: string;
}

export interface ClientPresence {
  userId: string;
  clientType: 'ios_app' | 'web_app' | 'watch_app';
  status: 'online' | 'offline';
}

export interface ConnectionStatus {
  connected: boolean;
  lastHeartbeat: string;
  reconnectAttempts: number;
  latency: number;
  dataQuality: 'realtime' | 'delayed' | 'offline';
}

export function useLiveHealthData(userId: string = 'demo-user') {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastHeartbeat: '',
    reconnectAttempts: 0,
    latency: 0,
    dataQuality: 'offline',
  });

  const [liveMetrics, setLiveMetrics] = useState<LiveHealthMetric[]>([]);
  const [latestMetrics, setLatestMetrics] = useState<
    Record<string, LiveHealthMetric>
  >({});
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [clientPresence, setClientPresence] = useState<
    Record<string, ClientPresence>
  >({});
  const [isConnecting, setIsConnecting] = useState(false);

  const handlers: MessageHandlers = {
    onLiveHealthUpdate: useCallback((data: unknown) => {
      const healthData = data as LiveHealthMetric;
      setLiveMetrics((prev) => [...prev.slice(-99), healthData]); // Keep last 100 metrics
      setLatestMetrics((prev) => ({
        ...prev,
        [healthData.metricType]: healthData,
      }));
      setConnectionStatus((prev) => ({
        ...prev,
        connected: true,
        lastHeartbeat: new Date().toISOString(),
        dataQuality: 'realtime',
      }));
    }, []),

    onHistoricalDataUpdate: useCallback((data: unknown) => {
      const histUpdate = data as HistoricalDataUpdate;
      setLiveMetrics((prev) => [...histUpdate.samples, ...prev].slice(0, 1000)); // Keep last 1000
    }, []),

    onEmergencyAlert: useCallback((data: unknown) => {
      const alert = data as EmergencyAlert;
      setAlerts((prev) => [alert, ...prev.slice(0, 19)]); // Keep last 20 alerts

      // Show browser notification for critical alerts
      if (alert.alert_level === 'critical' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          new Notification(`Health Alert: ${alert.message}`, {
            body: `${alert.metric_type}: ${alert.value}`,
            icon: '/health-icon.png',
            tag: 'health-alert',
          });
        }
      }
    }, []),

    onClientPresence: useCallback((data: unknown) => {
      const presence = data as ClientPresence;
      setClientPresence((prev) => ({
        ...prev,
        [`${presence.userId}-${presence.clientType}`]: presence,
      }));
    }, []),

    onConnect: useCallback(() => {
      setConnectionStatus((prev) => ({
        ...prev,
        connected: true,
        lastHeartbeat: new Date().toISOString(),
        reconnectAttempts: 0,
        dataQuality: 'realtime',
      }));
      setIsConnecting(false);
    }, []),

    onDisconnect: useCallback(() => {
      setConnectionStatus((prev) => ({
        ...prev,
        connected: false,
        dataQuality: 'offline',
      }));
    }, []),

    onError: useCallback((error: string) => {
      console.error('Live health data error:', error);
      setConnectionStatus((prev) => ({
        ...prev,
        dataQuality: 'offline',
      }));
    }, []),
  };

  const { connectionState, sendMessage, connect, disconnect } = useWebSocket(
    {
      url: 'ws://localhost:3001',
      enableInDevelopment: false, // Disable WebSocket in development to prevent console errors
    },
    handlers
  );

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const connectToHealthData = useCallback(async () => {
    setIsConnecting(true);
    try {
      connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to health data:', error);
      setIsConnecting(false);
      return false;
    }
  }, [connect]);

  const disconnectFromHealthData = useCallback(() => {
    disconnect();
    setConnectionStatus((prev) => ({
      ...prev,
      connected: false,
      dataQuality: 'offline',
    }));
  }, [disconnect]);

  const subscribeToHealthUpdates = useCallback(
    (metrics: string[] = []) => {
      sendMessage({
        type: 'subscribe_health_updates',
        metrics,
      });
    },
    [sendMessage]
  );

  const requestHistoricalData = useCallback(
    (cursor?: string) => {
      sendMessage({
        type: 'start_historical_backfill',
        cursor,
      });
    },
    [sendMessage]
  );

  const clearAlerts = useCallback(() => {
    setAlerts([]);
  }, []);

  const getLatestHeartRate = useCallback(() => {
    return latestMetrics.heart_rate;
  }, [latestMetrics]);

  const getLatestWalkingSteadiness = useCallback(() => {
    return latestMetrics.walking_steadiness;
  }, [latestMetrics]);

  const getLatestStepCount = useCallback(() => {
    return latestMetrics.step_count;
  }, [latestMetrics]);

  const isIOSConnected = useCallback(() => {
    return Object.values(clientPresence).some(
      (presence) =>
        presence.clientType === 'ios_app' && presence.status === 'online'
    );
  }, [clientPresence]);

  const getCriticalAlerts = useCallback(() => {
    return alerts.filter((alert) => alert.alert_level === 'critical');
  }, [alerts]);

  const getRecentData = useCallback(
    (type: string, limit = 10) => {
      return liveMetrics
        .filter((data) => data.metricType === type)
        .slice(0, limit);
    },
    [liveMetrics]
  );

  // Auto-connect on mount
  useEffect(() => {
    connectToHealthData();
  }, [connectToHealthData]);

  // Update reconnect attempts from WebSocket state
  useEffect(() => {
    setConnectionStatus((prev) => ({
      ...prev,
      reconnectAttempts: connectionState.reconnectAttempts,
    }));
  }, [connectionState.reconnectAttempts]);

  return {
    // State
    connectionStatus,
    liveMetrics,
    latestMetrics,
    alerts,
    clientPresence,
    isConnecting,

    // Actions
    connectToHealthData,
    disconnectFromHealthData,
    subscribeToHealthUpdates,
    requestHistoricalData,
    clearAlerts,

    // Getters
    getLatestHeartRate,
    getLatestWalkingSteadiness,
    getLatestStepCount,
    isIOSConnected,
    getCriticalAlerts,
    getRecentData,
  };
}
