/**
 * Test data factories for VitalSense.
 *
 * Each factory returns a valid default object that can be spread-overridden:
 *   buildHealthMetric({ type: 'steps', value: 5000 })
 */
import type { ProcessedHealthRecord } from '@/types';
import type {
  AggregatedMetrics,
  ConnectionStatus,
  HealthDataState,
  LiveHealthData,
  MLPredictions,
} from '@/hooks/optimizedHealthDataCore';

// ---------------------------------------------------------------------------
// Worker / API factories
// ---------------------------------------------------------------------------

let _seq = 0;

export function buildHealthMetric(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  _seq += 1;
  return {
    type: 'heart_rate',
    value: 72,
    timestamp: new Date().toISOString(),
    processedAt: new Date().toISOString(),
    validated: true,
    source: {
      userId: `test-user-${_seq}`,
      collectedAt: new Date().toISOString(),
    },
    ...overrides,
  };
}

export function buildHealthMetricBatch(
  count = 3,
  overrides: Record<string, unknown> = {}
): { metrics: Record<string, unknown>[] } {
  return {
    metrics: Array.from({ length: count }, (_, i) =>
      buildHealthMetric({ value: 70 + i, ...overrides })
    ),
  };
}

export function buildLidarFrame(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    obstacle_distance_min: 1.5,
    surface_roughness: 0.3,
    lateral_deviation_mean: 0.1,
    stride_length_var: 0.05,
    ts: Date.now(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Component / hook factories
// ---------------------------------------------------------------------------

export function buildProcessedHealthRecord(
  overrides: Partial<ProcessedHealthRecord> = {}
): ProcessedHealthRecord {
  return {
    id: `rec-${++_seq}`,
    type: 'heart_rate',
    value: 72,
    timestamp: new Date().toISOString(),
    source: 'apple_health',
    ...overrides,
  } as ProcessedHealthRecord;
}

export function buildLiveHealthData(
  overrides: Partial<LiveHealthData> = {}
): LiveHealthData {
  return {
    id: `live-${++_seq}`,
    type: 'heart_rate',
    value: 75,
    timestamp: new Date().toISOString(),
    quality: 'high',
    ...overrides,
  };
}

export function buildConnectionStatus(
  overrides: Partial<ConnectionStatus> = {}
): ConnectionStatus {
  return {
    webSocket: 'connected',
    api: 'healthy',
    database: 'healthy',
    lastHeartbeat: new Date().toISOString(),
    ...overrides,
  };
}

export function buildAggregatedMetrics(
  overrides: Partial<AggregatedMetrics> = {}
): AggregatedMetrics {
  return {
    totalRecords: 100,
    averageHeartRate: 72,
    averageSteps: 8000,
    averageWalkingSteadiness: 85,
    riskScores: {
      fallRisk: 20,
      cardiovascularRisk: 15,
      sleepQuality: 80,
    },
    trends: {
      heartRate: 'stable',
      steps: 'increasing',
      walkingSteadiness: 'stable',
    },
    ...overrides,
  };
}

export function buildMLPredictions(
  overrides: Partial<MLPredictions> = {}
): MLPredictions {
  return {
    fallRiskPrediction: 0.15,
    healthScore: 85,
    anomalies: [],
    recommendations: ['Continue daily walks'],
    confidence: 0.9,
    lastModelUpdate: new Date().toISOString(),
    ...overrides,
  };
}

export function buildHealthDataState(
  overrides: Partial<HealthDataState> = {}
): HealthDataState {
  return {
    rawData: [],
    aggregatedMetrics: null,
    mlPredictions: null,
    realTimeStream: [],
    connectionStatus: buildConnectionStatus(),
    isLoading: false,
    error: null,
    lastUpdated: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Worker env factory (for Hono app.fetch() tests)
// ---------------------------------------------------------------------------

export function buildWorkerEnv(
  overrides: Record<string, unknown> = {}
): Record<string, unknown> {
  return {
    ENVIRONMENT: 'development',
    ALLOWED_ORIGINS: 'https://allowed.test',
    ASSETS: {
      fetch: async () => new Response('not found', { status: 404 }),
    },
    HEALTH_KV: {
      put: async () => {},
      get: async () => null,
      list: async () => ({ keys: [] }),
      delete: async () => {},
    },
    ...overrides,
  };
}
