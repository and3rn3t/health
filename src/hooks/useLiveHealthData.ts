import { useCallback, useEffect, useState } from 'react';
import { useWebSocket, type MessageHandlers } from './useWebSocket';

export interface LiveHealthMetric {
  id: string;
  userId: string;
  metricType:
    | 'heart_rate'
    | 'walking_steadiness'
    | 'step_count'
    | 'gait_speed'
    | 'cadence'
    | 'stride_length'
    | 'step_asymmetry'
    | 'double_support_time'
    | 'posture_angle'
    | 'stability_index'
    | 'sway_balance'
    | 'fall_detected';
  value: number;
  unit: string;
  timestamp: number;
  source?: string;
  deviceId?: string;
  processedAt: number;
  wellnessScore: number;
}

export interface HistoricalDataUpdate {
  type: string;
  samples: LiveHealthMetric[];
  count: number;
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

export function useLiveHealthData(_userId: string = 'demo-user') {
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
  const [clientPresence, setClientPresence] = useState<
    Record<string, ClientPresence>
  >({});
  const [isConnecting, setIsConnecting] = useState(false);

  const handlers: MessageHandlers = {
    onLiveHealthUpdate: useCallback((data: unknown) => {
      const healthData = data as LiveHealthMetric;
      setLiveMetrics((prev) => [...(prev || []).slice(-99), healthData]); // Keep last 100 metrics
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
      setLiveMetrics((prev) =>
        [...(histUpdate.samples || []), ...(prev || [])].slice(0, 1000)
      ); // Keep last 1000
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

    onError: useCallback((data: unknown) => {
      const error = data as string;
      console.error('Live health data error:', error);
      setConnectionStatus((prev) => ({
        ...prev,
        dataQuality: 'offline',
      }));
    }, []),
  };

  const { connectionState, sendMessage, connect, disconnect } = useWebSocket(
    {
      url: 'ws://localhost:3001/ws', // Connect to enhanced server in development
      enableInDevelopment: true, // Enable WebSocket in development for enhanced server
      reconnectAttempts: 10,
      reconnectDelay: 2000,
      pingInterval: 30000,
    },
    handlers
  );

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
        data: { metrics },
        timestamp: new Date().toISOString(),
      });
    },
    [sendMessage]
  );

  const requestHistoricalData = useCallback(
    (cursor?: string) => {
      sendMessage({
        type: 'start_historical_backfill',
        data: { cursor },
        timestamp: new Date().toISOString(),
      });
    },
    [sendMessage]
  );

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

  const getRecentData = useCallback(
    (type: string, limit = 10) => {
      return (liveMetrics || [])
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
    clientPresence,
    isConnecting,

    // Actions
    connectToHealthData,
    disconnectFromHealthData,
    subscribeToHealthUpdates,
    requestHistoricalData,

    // Getters
    getLatestHeartRate,
    getLatestWalkingSteadiness,
    getLatestStepCount,
    isIOSConnected,
    getRecentData,
  };
}
