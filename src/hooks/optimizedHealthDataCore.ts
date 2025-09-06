import type { ProcessedHealthRecord } from '@/types';
import { createContext, useContext, useMemo } from 'react';

// Types for centralized state management
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type QualityLevel = 'high' | 'medium' | 'low';
export type RiskLevel = 'low' | 'medium' | 'high';
export type ConnectionState =
  | 'connected'
  | 'disconnected'
  | 'connecting'
  | 'error';
export type SystemHealth = 'healthy' | 'degraded' | 'down';

export interface HealthDataState {
  rawData: ProcessedHealthRecord[];
  aggregatedMetrics: AggregatedMetrics | null;
  mlPredictions: MLPredictions | null;
  realTimeStream: LiveHealthData[];
  connectionStatus: ConnectionStatus;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
}

export interface AggregatedMetrics {
  totalRecords: number;
  averageHeartRate: number;
  averageSteps: number;
  averageWalkingSteadiness: number;
  riskScores: {
    fallRisk: number;
    cardiovascularRisk: number;
    sleepQuality: number;
  };
  trends: {
    heartRate: TrendDirection;
    steps: TrendDirection;
    walkingSteadiness: TrendDirection;
  };
}

export interface MLPredictions {
  fallRiskPrediction: number;
  healthScore: number;
  anomalies: string[];
  recommendations: string[];
  confidence: number;
  lastModelUpdate: string;
}

export interface LiveHealthData {
  id: string;
  type: string;
  value: number;
  timestamp: string;
  quality: QualityLevel;
}

export interface ConnectionStatus {
  webSocket: ConnectionState;
  api: SystemHealth;
  database: SystemHealth;
  lastHeartbeat: string | null;
}

// Action types for state management
export type HealthDataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'UPDATE_RAW_DATA'; payload: ProcessedHealthRecord[] }
  | { type: 'ADD_REAL_TIME_DATA'; payload: LiveHealthData }
  | { type: 'UPDATE_AGGREGATED_METRICS'; payload: AggregatedMetrics }
  | { type: 'UPDATE_ML_PREDICTIONS'; payload: MLPredictions }
  | { type: 'UPDATE_CONNECTION_STATUS'; payload: Partial<ConnectionStatus> }
  | { type: 'CLEAR_OLD_REAL_TIME_DATA' };

// Initial state
export const initialState: HealthDataState = {
  rawData: [],
  aggregatedMetrics: null,
  mlPredictions: null,
  realTimeStream: [],
  connectionStatus: {
    webSocket: 'disconnected',
    api: 'healthy',
    database: 'healthy',
    lastHeartbeat: null,
  },
  isLoading: false,
  error: null,
  lastUpdated: null,
};

// Optimized reducer with performance considerations
export function healthDataReducer(
  state: HealthDataState,
  action: HealthDataAction
): HealthDataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };

    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };

    case 'UPDATE_RAW_DATA':
      return {
        ...state,
        rawData: action.payload,
        lastUpdated: new Date().toISOString(),
        error: null,
      };

    case 'ADD_REAL_TIME_DATA': {
      // Keep only last 1000 real-time entries to prevent memory bloat
      const newRealTimeStream = [...state.realTimeStream, action.payload].slice(
        -1000
      );
      return {
        ...state,
        realTimeStream: newRealTimeStream,
        lastUpdated: new Date().toISOString(),
      };
    }

    case 'UPDATE_AGGREGATED_METRICS':
      return {
        ...state,
        aggregatedMetrics: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_ML_PREDICTIONS':
      return {
        ...state,
        mlPredictions: action.payload,
        lastUpdated: new Date().toISOString(),
      };

    case 'UPDATE_CONNECTION_STATUS':
      return {
        ...state,
        connectionStatus: {
          ...state.connectionStatus,
          ...action.payload,
          lastHeartbeat: new Date().toISOString(),
        },
      };

    case 'CLEAR_OLD_REAL_TIME_DATA': {
      // Remove entries older than 1 hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      return {
        ...state,
        realTimeStream: state.realTimeStream.filter(
          (data) => data.timestamp > oneHourAgo
        ),
      };
    }

    default:
      return state;
  }
}

// Context definition
export interface HealthDataContextValue extends HealthDataState {
  updateRawData: (data: ProcessedHealthRecord[]) => void;
  addRealTimeData: (data: LiveHealthData) => void;
  updateAggregatedMetrics: (metrics: AggregatedMetrics) => void;
  updateMLPredictions: (predictions: MLPredictions) => void;
  updateConnectionStatus: (status: Partial<ConnectionStatus>) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearOldRealTimeData: () => void;

  // Derived computed values (memoized)
  recentHealthData: ProcessedHealthRecord[];
  healthTrends: AggregatedMetrics['trends'] | null;
  riskLevel: RiskLevel;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'offline';
}

export const HealthDataContext = createContext<HealthDataContextValue | null>(
  null
);

// Custom hook for accessing health data context
export function useHealthData() {
  const context = useContext(HealthDataContext);
  if (!context) {
    throw new Error('useHealthData must be used within a HealthDataProvider');
  }
  return context;
}

// Specialized hooks for specific data access (to prevent unnecessary re-renders)
export function useRawHealthData() {
  const { rawData, isLoading, error } = useHealthData();
  return useMemo(
    () => ({ rawData, isLoading, error }),
    [rawData, isLoading, error]
  );
}

export function useRealTimeStream() {
  const { realTimeStream, connectionStatus } = useHealthData();
  return useMemo(
    () => ({ realTimeStream, connectionStatus }),
    [realTimeStream, connectionStatus]
  );
}

export function useHealthMetrics() {
  const { aggregatedMetrics, healthTrends, riskLevel } = useHealthData();
  return useMemo(
    () => ({
      aggregatedMetrics,
      healthTrends,
      riskLevel,
    }),
    [aggregatedMetrics, healthTrends, riskLevel]
  );
}

export function useMLInsights() {
  const { mlPredictions, riskLevel } = useHealthData();
  return useMemo(
    () => ({ mlPredictions, riskLevel }),
    [mlPredictions, riskLevel]
  );
}

export function useConnectionStatus() {
  const { connectionStatus, connectionQuality } = useHealthData();
  return useMemo(
    () => ({
      connectionStatus,
      connectionQuality,
    }),
    [connectionStatus, connectionQuality]
  );
}

// Utility functions for state management
export function useHealthDataActions(
  dispatch: React.Dispatch<HealthDataAction>
) {
  return useMemo(
    () => ({
      updateRawData: (data: ProcessedHealthRecord[]) =>
        dispatch({ type: 'UPDATE_RAW_DATA', payload: data }),

      addRealTimeData: (data: LiveHealthData) =>
        dispatch({ type: 'ADD_REAL_TIME_DATA', payload: data }),

      updateAggregatedMetrics: (metrics: AggregatedMetrics) =>
        dispatch({ type: 'UPDATE_AGGREGATED_METRICS', payload: metrics }),

      updateMLPredictions: (predictions: MLPredictions) =>
        dispatch({ type: 'UPDATE_ML_PREDICTIONS', payload: predictions }),

      updateConnectionStatus: (status: Partial<ConnectionStatus>) =>
        dispatch({ type: 'UPDATE_CONNECTION_STATUS', payload: status }),

      setLoading: (loading: boolean) =>
        dispatch({ type: 'SET_LOADING', payload: loading }),

      setError: (error: string | null) =>
        dispatch({ type: 'SET_ERROR', payload: error }),

      clearOldRealTimeData: () =>
        dispatch({ type: 'CLEAR_OLD_REAL_TIME_DATA' }),
    }),
    [dispatch]
  );
}

// Utility function for derived values calculation
export function useDerivedHealthValues(state: HealthDataState) {
  return useMemo(() => {
    // Recent health data (last 7 days)
    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();
    const recentHealthData = state.rawData.filter(
      (data) => data.timestamp > sevenDaysAgo
    );

    // Health trends from aggregated metrics
    const healthTrends = state.aggregatedMetrics?.trends || null;

    // Risk level calculation
    const riskLevel: RiskLevel = (() => {
      if (!state.aggregatedMetrics?.riskScores) return 'low';

      const { fallRisk, cardiovascularRisk } =
        state.aggregatedMetrics.riskScores;
      const maxRisk = Math.max(fallRisk, cardiovascularRisk);

      if (maxRisk > 70) return 'high';
      if (maxRisk > 40) return 'medium';
      return 'low';
    })();

    // Connection quality assessment
    const connectionQuality: 'excellent' | 'good' | 'poor' | 'offline' =
      (() => {
        const { webSocket, api, database } = state.connectionStatus;

        if (webSocket === 'disconnected' && api === 'down') return 'offline';
        if (
          webSocket === 'connected' &&
          api === 'healthy' &&
          database === 'healthy'
        )
          return 'excellent';
        if (webSocket === 'connected' && api === 'healthy') return 'good';
        return 'poor';
      })();

    return {
      recentHealthData,
      healthTrends,
      riskLevel,
      connectionQuality,
    };
  }, [state.rawData, state.aggregatedMetrics, state.connectionStatus]);
}
