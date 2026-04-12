import { useCallback, useEffect, useReducer } from 'react';
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

// ---------------------------------------------------------------------------
// Consolidated state + reducer
// ---------------------------------------------------------------------------

interface LiveHealthState {
  connectionStatus: ConnectionStatus;
  liveMetrics: LiveHealthMetric[];
  latestMetrics: Record<string, LiveHealthMetric>;
  clientPresence: Record<string, ClientPresence>;
  isConnecting: boolean;
}

type LiveHealthAction =
  | { type: 'LIVE_METRIC'; metric: LiveHealthMetric }
  | { type: 'HISTORICAL_UPDATE'; samples: LiveHealthMetric[] }
  | { type: 'CLIENT_PRESENCE'; presence: ClientPresence }
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'ERROR' }
  | { type: 'CONNECTING' }
  | { type: 'CONNECT_FAILED' }
  | { type: 'RECONNECT_ATTEMPTS'; count: number };

const initialState: LiveHealthState = {
  connectionStatus: {
    connected: false,
    lastHeartbeat: '',
    reconnectAttempts: 0,
    latency: 0,
    dataQuality: 'offline',
  },
  liveMetrics: [],
  latestMetrics: {},
  clientPresence: {},
  isConnecting: false,
};

function reducer(state: LiveHealthState, action: LiveHealthAction): LiveHealthState {
  switch (action.type) {
    case 'LIVE_METRIC': {
      const m = action.metric;
      return {
        ...state,
        liveMetrics: [...state.liveMetrics.slice(-99), m],
        latestMetrics: { ...state.latestMetrics, [m.metricType]: m },
        connectionStatus: {
          ...state.connectionStatus,
          connected: true,
          lastHeartbeat: new Date().toISOString(),
          dataQuality: 'realtime',
        },
      };
    }
    case 'HISTORICAL_UPDATE':
      return {
        ...state,
        liveMetrics: [...(action.samples || []), ...state.liveMetrics].slice(0, 1000),
      };
    case 'CLIENT_PRESENCE': {
      const p = action.presence;
      return {
        ...state,
        clientPresence: {
          ...state.clientPresence,
          [`${p.userId}-${p.clientType}`]: p,
        },
      };
    }
    case 'CONNECTED':
      return {
        ...state,
        isConnecting: false,
        connectionStatus: {
          ...state.connectionStatus,
          connected: true,
          lastHeartbeat: new Date().toISOString(),
          reconnectAttempts: 0,
          dataQuality: 'realtime',
        },
      };
    case 'DISCONNECTED':
      return {
        ...state,
        connectionStatus: {
          ...state.connectionStatus,
          connected: false,
          dataQuality: 'offline',
        },
      };
    case 'ERROR':
      return {
        ...state,
        connectionStatus: { ...state.connectionStatus, dataQuality: 'offline' },
      };
    case 'CONNECTING':
      return { ...state, isConnecting: true };
    case 'CONNECT_FAILED':
      return { ...state, isConnecting: false };
    case 'RECONNECT_ATTEMPTS':
      return {
        ...state,
        connectionStatus: {
          ...state.connectionStatus,
          reconnectAttempts: action.count,
        },
      };
  }
}

export function useLiveHealthData(_userId: string = 'demo-user') {
  const [state, dispatch] = useReducer(reducer, initialState);

  const handlers: MessageHandlers = {
    onLiveHealthUpdate: useCallback((data: unknown) => {
      dispatch({ type: 'LIVE_METRIC', metric: data as LiveHealthMetric });
    }, []),

    onHistoricalDataUpdate: useCallback((data: unknown) => {
      const histUpdate = data as HistoricalDataUpdate;
      dispatch({ type: 'HISTORICAL_UPDATE', samples: histUpdate.samples || [] });
    }, []),

    onClientPresence: useCallback((data: unknown) => {
      dispatch({ type: 'CLIENT_PRESENCE', presence: data as ClientPresence });
    }, []),

    onConnect: useCallback(() => {
      dispatch({ type: 'CONNECTED' });
    }, []),

    onDisconnect: useCallback(() => {
      dispatch({ type: 'DISCONNECTED' });
    }, []),

    onError: useCallback((data: unknown) => {
      console.error('Live health data error:', data);
      dispatch({ type: 'ERROR' });
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
    dispatch({ type: 'CONNECTING' });
    try {
      connect();
      return true;
    } catch (error) {
      console.error('Failed to connect to health data:', error);
      dispatch({ type: 'CONNECT_FAILED' });
      return false;
    }
  }, [connect]);

  const disconnectFromHealthData = useCallback(() => {
    disconnect();
    dispatch({ type: 'DISCONNECTED' });
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
    return state.latestMetrics.heart_rate;
  }, [state.latestMetrics]);

  const getLatestWalkingSteadiness = useCallback(() => {
    return state.latestMetrics.walking_steadiness;
  }, [state.latestMetrics]);

  const getLatestStepCount = useCallback(() => {
    return state.latestMetrics.step_count;
  }, [state.latestMetrics]);

  const isIOSConnected = useCallback(() => {
    return Object.values(state.clientPresence).some(
      (presence) =>
        presence.clientType === 'ios_app' && presence.status === 'online'
    );
  }, [state.clientPresence]);

  const getRecentData = useCallback(
    (type: string, limit = 10) => {
      return (state.liveMetrics || [])
        .filter((data) => data.metricType === type)
        .slice(0, limit);
    },
    [state.liveMetrics]
  );

  // Auto-connect on mount
  useEffect(() => {
    void connectToHealthData();
  }, [connectToHealthData]);

  // Update reconnect attempts from WebSocket state
  useEffect(() => {
    dispatch({ type: 'RECONNECT_ATTEMPTS', count: connectionState.reconnectAttempts });
  }, [connectionState.reconnectAttempts]);

  return {
    // State
    connectionStatus: state.connectionStatus,
    liveMetrics: state.liveMetrics,
    latestMetrics: state.latestMetrics,
    clientPresence: state.clientPresence,
    isConnecting: state.isConnecting,

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
