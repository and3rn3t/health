import { describe, expect, it } from 'vitest';
import {
  messageEnvelopeSchema,
  healthMetricTypeSchema,
  healthMetricSchema,
  healthMetricBatchSchema,
  processedHealthDataSchema,
  liveGaitSnapshotSchema,
  liveBalanceProgressSchema,
  liveBalanceResultSchema,
  liveGaitRecentResponseSchema,
  liveBalanceRecentResponseSchema,
  liveGaitSnapshotBatchSchema,
} from '../health';

// ---------------------------------------------------------------------------
// messageEnvelopeSchema
// ---------------------------------------------------------------------------

describe('messageEnvelopeSchema', () => {
  const validTypes = [
    'connection_established',
    'live_health_update',
    'historical_data_update',
    'emergency_alert',
    'client_presence',
    'error',
    'pong',
  ] as const;

  it.each(validTypes)('accepts type=%s', (type) => {
    const result = messageEnvelopeSchema.safeParse({
      type,
      timestamp: '2024-01-01T00:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional data', () => {
    const result = messageEnvelopeSchema.safeParse({
      type: 'pong',
      data: { latency: 42 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects an unknown type', () => {
    const result = messageEnvelopeSchema.safeParse({ type: 'unknown_type' });
    expect(result.success).toBe(false);
  });

  it('rejects missing type', () => {
    const result = messageEnvelopeSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// healthMetricTypeSchema
// ---------------------------------------------------------------------------

describe('healthMetricTypeSchema', () => {
  const knownTypes = [
    'heart_rate', 'walking_steadiness', 'steps', 'gait_speed', 'cadence',
    'stride_length', 'step_asymmetry', 'double_support_time', 'posture_angle',
    'stability_index', 'sway_balance', 'oxygen_saturation', 'sleep_hours',
    'body_weight', 'active_energy', 'distance_walking',
    'blood_pressure_systolic', 'blood_pressure_diastolic',
    'body_temperature', 'respiratory_rate', 'fall_event',
  ];

  it.each(knownTypes)('accepts %s', (type) => {
    expect(healthMetricTypeSchema.safeParse(type).success).toBe(true);
  });

  it('rejects unknown metric types', () => {
    expect(healthMetricTypeSchema.safeParse('mood').success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// healthMetricSchema
// ---------------------------------------------------------------------------

describe('healthMetricSchema', () => {
  const validMetric = {
    type: 'heart_rate',
    value: 72,
    unit: 'bpm',
    timestamp: '2024-06-15T10:00:00Z',
    deviceId: 'watch-1',
    userId: 'user-1',
    source: 'Apple Watch',
    confidence: 0.95,
  };

  it('accepts a fully-populated metric', () => {
    const result = healthMetricSchema.safeParse(validMetric);
    expect(result.success).toBe(true);
  });

  it('accepts a minimal metric (type + value only)', () => {
    const result = healthMetricSchema.safeParse({ type: 'steps', value: 5000 });
    expect(result.success).toBe(true);
  });

  it('rejects missing type', () => {
    const result = healthMetricSchema.safeParse({ value: 72 });
    expect(result.success).toBe(false);
  });

  it('rejects missing value', () => {
    const result = healthMetricSchema.safeParse({ type: 'heart_rate' });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric value', () => {
    const result = healthMetricSchema.safeParse({ type: 'heart_rate', value: 'fast' });
    expect(result.success).toBe(false);
  });

  it('rejects confidence outside 0-1', () => {
    expect(
      healthMetricSchema.safeParse({ type: 'heart_rate', value: 72, confidence: 1.5 }).success,
    ).toBe(false);
    expect(
      healthMetricSchema.safeParse({ type: 'heart_rate', value: 72, confidence: -0.1 }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// healthMetricBatchSchema
// ---------------------------------------------------------------------------

describe('healthMetricBatchSchema', () => {
  it('accepts a batch with 1-100 metrics', () => {
    const result = healthMetricBatchSchema.safeParse({
      metrics: [{ type: 'heart_rate', value: 72 }],
      uploadedAt: '2024-06-15T10:00:00Z',
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty metrics array', () => {
    const result = healthMetricBatchSchema.safeParse({
      metrics: [],
      uploadedAt: '2024-06-15T10:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects more than 100 metrics', () => {
    const metrics = Array.from({ length: 101 }, () => ({
      type: 'steps' as const,
      value: 1,
    }));
    const result = healthMetricBatchSchema.safeParse({
      metrics,
      uploadedAt: '2024-06-15T10:00:00Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional deviceInfo', () => {
    const result = healthMetricBatchSchema.safeParse({
      metrics: [{ type: 'steps', value: 5000 }],
      uploadedAt: '2024-06-15T10:00:00Z',
      deviceInfo: { deviceId: 'watch-1', deviceType: 'Apple Watch' },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// processedHealthDataSchema
// ---------------------------------------------------------------------------

describe('processedHealthDataSchema', () => {
  const validProcessed = {
    type: 'heart_rate' as const,
    value: 72,
    timestamp: '2024-06-15T10:00:00Z',
    processedAt: '2024-06-15T10:00:01Z',
    validated: true,
    source: {
      userId: 'user-1',
      collectedAt: '2024-06-15T10:00:00Z',
    },
  };

  it('accepts minimal processed data', () => {
    const result = processedHealthDataSchema.safeParse(validProcessed);
    expect(result.success).toBe(true);
  });

  it('accepts full processed data with analytics', () => {
    const result = processedHealthDataSchema.safeParse({
      ...validProcessed,
      id: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      healthScore: 85,
      fallRisk: 'low',
      trendAnalysis: {
        direction: 'improving',
        confidence: 0.9,
        changePercent: 5.2,
      },
      anomalyScore: 0.1,
      alert: {
        level: 'info',
        message: 'Normal reading',
        actionRequired: false,
      },
      dataQuality: {
        completeness: 100,
        accuracy: 95,
        timeliness: 100,
        consistency: 98,
      },
    });
    expect(result.success).toBe(true);
  });

  it('rejects healthScore outside 0-100', () => {
    expect(
      processedHealthDataSchema.safeParse({ ...validProcessed, healthScore: 150 }).success,
    ).toBe(false);
  });

  it('rejects invalid fallRisk enum', () => {
    expect(
      processedHealthDataSchema.safeParse({ ...validProcessed, fallRisk: 'extreme' }).success,
    ).toBe(false);
  });

  it('requires source.userId', () => {
    const result = processedHealthDataSchema.safeParse({
      ...validProcessed,
      source: { collectedAt: '2024-06-15T10:00:00Z' },
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// liveGaitSnapshotSchema
// ---------------------------------------------------------------------------

describe('liveGaitSnapshotSchema', () => {
  it('accepts valid gait snapshot', () => {
    const result = liveGaitSnapshotSchema.safeParse({
      speed: 1.2,
      stepFrequency: 120,
    });
    expect(result.success).toBe(true);
  });

  it('rejects speed > 4', () => {
    expect(
      liveGaitSnapshotSchema.safeParse({ speed: 5, stepFrequency: 100 }).success,
    ).toBe(false);
  });

  it('rejects stepFrequency > 300', () => {
    expect(
      liveGaitSnapshotSchema.safeParse({ speed: 1, stepFrequency: 301 }).success,
    ).toBe(false);
  });

  it('accepts optional asymmetry and variability', () => {
    const result = liveGaitSnapshotSchema.safeParse({
      speed: 1.0,
      stepFrequency: 100,
      asymmetry: 0.1,
      variability: 0.05,
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// liveBalanceProgressSchema
// ---------------------------------------------------------------------------

describe('liveBalanceProgressSchema', () => {
  it('accepts valid progress', () => {
    const result = liveBalanceProgressSchema.safeParse({
      percent: 50,
      elapsedSeconds: 15,
    });
    expect(result.success).toBe(true);
  });

  it('rejects percent outside 0-100', () => {
    expect(
      liveBalanceProgressSchema.safeParse({
        percent: 101,
        elapsedSeconds: 10,
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// liveBalanceResultSchema
// ---------------------------------------------------------------------------

describe('liveBalanceResultSchema', () => {
  it('accepts valid result with component scores', () => {
    const result = liveBalanceResultSchema.safeParse({
      overallScore: 85,
      componentScores: { romberg: 90, tandem: 80 },
    });
    expect(result.success).toBe(true);
  });

  it('rejects overallScore outside 0-100', () => {
    expect(
      liveBalanceResultSchema.safeParse({
        overallScore: -1,
        componentScores: {},
      }).success,
    ).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// liveGaitRecentResponseSchema
// ---------------------------------------------------------------------------

describe('liveGaitRecentResponseSchema', () => {
  it('accepts a valid recent response', () => {
    const result = liveGaitRecentResponseSchema.safeParse({
      ok: true,
      userId: 'user-1',
      count: 1,
      snapshots: [{ speed: 1.0, stepFrequency: 100 }],
    });
    expect(result.success).toBe(true);
  });

  it('accepts optional rolling stats and trend', () => {
    const result = liveGaitRecentResponseSchema.safeParse({
      ok: true,
      userId: 'user-1',
      count: 0,
      snapshots: [],
      rolling: {
        speedAvg: 1.1,
        speedVar: 0.01,
        cadenceAvg: 115,
        asymAvg: 0.02,
        variabilityAvg: null,
      },
      trend: {
        direction: 'stable',
        slope: 0.001,
        confidence: 0.8,
      },
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// liveBalanceRecentResponseSchema
// ---------------------------------------------------------------------------

describe('liveBalanceRecentResponseSchema', () => {
  it('accepts a valid balance recent response', () => {
    const result = liveBalanceRecentResponseSchema.safeParse({
      ok: true,
      userId: 'user-1',
      results: [{ overallScore: 88, componentScores: { romberg: 90 } }],
    });
    expect(result.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// liveGaitSnapshotBatchSchema
// ---------------------------------------------------------------------------

describe('liveGaitSnapshotBatchSchema', () => {
  it('accepts a batch of gait snapshots', () => {
    const result = liveGaitSnapshotBatchSchema.safeParse({
      snapshots: [{ speed: 1.0, stepFrequency: 100 }],
    });
    expect(result.success).toBe(true);
  });

  it('rejects an empty batch', () => {
    const result = liveGaitSnapshotBatchSchema.safeParse({ snapshots: [] });
    expect(result.success).toBe(false);
  });

  it('rejects more than 50 snapshots', () => {
    const snapshots = Array.from({ length: 51 }, () => ({
      speed: 1.0,
      stepFrequency: 100,
    }));
    const result = liveGaitSnapshotBatchSchema.safeParse({ snapshots });
    expect(result.success).toBe(false);
  });
});
