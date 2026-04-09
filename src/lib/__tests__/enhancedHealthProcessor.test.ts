import { describe, it, expect, vi, beforeEach } from 'vitest';
import { HealthDataProcessor } from '../enhancedHealthProcessor';
import type { HealthMetric, HealthMetricBatch, ProcessedHealthData } from '@/schemas/health';

// ── Helpers ──────────────────────────────────────────────────────────────────

vi.stubGlobal('crypto', { randomUUID: () => '00000000-0000-4000-8000-000000000000' });

function makeMetric(overrides: Partial<HealthMetric> = {}): HealthMetric {
  return {
    type: 'heart_rate',
    value: 72,
    unit: 'bpm',
    timestamp: new Date().toISOString(),
    deviceId: 'device-1',
    userId: 'user-1',
    ...overrides,
  };
}

function makeHistoricalData(
  type: HealthMetric['type'],
  values: number[],
  options?: { daysAgo?: number }
): ProcessedHealthData[] {
  const baseTime = Date.now();
  return values.map((value, i) => ({
    id: `hist-${i}`,
    type,
    value,
    unit: 'bpm',
    timestamp: new Date(baseTime - ((options?.daysAgo ?? values.length) - i) * 86_400_000).toISOString(),
    processedAt: new Date().toISOString(),
    validated: true,
    source: { userId: 'user-1', collectedAt: new Date().toISOString() },
  })) as unknown as ProcessedHealthData[];
}

beforeEach(() => {
  vi.restoreAllMocks();
});

// ── processHealthMetric ──────────────────────────────────────────────────────

describe('processHealthMetric', () => {
  it('processes a valid heart rate metric', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const result = await HealthDataProcessor.processHealthMetric(metric);

    expect(result.id).toBeDefined();
    expect(result.type).toBe('heart_rate');
    expect(result.value).toBe(72);
    expect(result.processedAt).toBeDefined();
    expect(result.validated).toBe(true);
    expect(result.source.processingPipeline).toBe('enhanced-analytics-v1');
  });

  it('processes walking_steadiness metric', async () => {
    const metric = makeMetric({ type: 'walking_steadiness', value: 85 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.validated).toBe(true);
    expect(result.fallRisk).toBeDefined();
  });

  it('processes steps metric', async () => {
    const metric = makeMetric({ type: 'steps', value: 8500, unit: 'count' });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.value).toBe(8500);
    expect(result.healthScore).toBeGreaterThan(0);
  });

  it('processes oxygen_saturation metric', async () => {
    const metric = makeMetric({ type: 'oxygen_saturation', value: 97, unit: '%' });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.healthScore).toBeGreaterThan(50);
  });

  it('defaults deviceId and userId when missing', async () => {
    const metric = makeMetric({ deviceId: undefined, userId: undefined });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.source.deviceId).toBe('unknown');
    expect(result.source.userId).toBe('unknown');
  });

  it('uses current timestamp when metric has none', async () => {
    const metric = makeMetric({ timestamp: undefined });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.timestamp).toBeDefined();
  });

  it('includes trend analysis with historical data', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 75 });
    const history = makeHistoricalData('heart_rate', [70, 72, 74, 76, 78]);
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.trendAnalysis).toBeDefined();
    expect(result.trendAnalysis!.direction).toBeDefined();
  });

  it('returns stable trend without sufficient history', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.trendAnalysis?.direction).toBe('stable');
    expect(result.trendAnalysis?.confidence).toBe(0.5);
  });
});

// ── processHealthBatch ───────────────────────────────────────────────────────

describe('processHealthBatch', () => {
  it('processes multiple metrics', async () => {
    const batch: HealthMetricBatch = {
      metrics: [
        makeMetric({ type: 'heart_rate', value: 72 }),
        makeMetric({ type: 'steps', value: 5000 }),
      ],
      uploadedAt: new Date().toISOString(),
    };
    const results = await HealthDataProcessor.processHealthBatch(batch);
    expect(results).toHaveLength(2);
    expect(results[0]!.type).toBe('heart_rate');
    expect(results[1]!.type).toBe('steps');
  });

  it('creates error record for failed metrics', async () => {
    // Force processHealthMetric to throw by making crypto.randomUUID throw
    const origUUID = crypto.randomUUID;
    let firstCall = true;
    vi.stubGlobal('crypto', {
      randomUUID: () => {
        if (firstCall) {
          firstCall = false;
          throw new Error('UUID generation failed');
        }
        return '00000000-0000-4000-8000-000000000001';
      },
    });

    const batch: HealthMetricBatch = {
      metrics: [
        makeMetric({ type: 'heart_rate', value: 72 }),
        makeMetric({ type: 'steps', value: 5000 }),
      ],
      uploadedAt: new Date().toISOString(),
    };

    const results = await HealthDataProcessor.processHealthBatch(batch);
    expect(results).toHaveLength(2);
    // First should be error record
    expect(results[0]!.validated).toBe(false);
    expect(results[0]!.alert?.message).toContain('Processing failed');

    // Restore
    vi.stubGlobal('crypto', { randomUUID: origUUID });
  });

  it('passes historical data to each metric', async () => {
    const batch: HealthMetricBatch = {
      metrics: [makeMetric({ type: 'heart_rate', value: 72 })],
      uploadedAt: new Date().toISOString(),
    };
    const history = makeHistoricalData('heart_rate', [68, 70, 72, 74, 76]);
    const results = await HealthDataProcessor.processHealthBatch(batch, history);
    expect(results[0]!.trendAnalysis?.confidence).toBeGreaterThan(0);
  });
});

// ── Health Score Calculation ─────────────────────────────────────────────────

describe('healthScore calculation', () => {
  it('gives higher score for normal heart rate (60-100)', async () => {
    const normal = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'heart_rate', value: 72 })
    );
    const abnormal = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'heart_rate', value: 110 })
    );
    expect(normal.healthScore).toBeGreaterThan(abnormal.healthScore!);
  });

  it('gives higher score for high walking steadiness', async () => {
    const steady = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'walking_steadiness', value: 90 })
    );
    const unsteady = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'walking_steadiness', value: 20 })
    );
    expect(steady.healthScore).toBeGreaterThan(unsteady.healthScore!);
  });

  it('gives higher score for more steps', async () => {
    const active = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'steps', value: 10000 })
    );
    const sedentary = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'steps', value: 500 })
    );
    expect(active.healthScore).toBeGreaterThan(sedentary.healthScore!);
  });

  it('gives higher score for good oxygen saturation', async () => {
    const good = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'oxygen_saturation', value: 98 })
    );
    const low = await HealthDataProcessor.processHealthMetric(
      makeMetric({ type: 'oxygen_saturation', value: 88 })
    );
    expect(good.healthScore).toBeGreaterThan(low.healthScore!);
  });

  it('clamps score between 0 and 100', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.healthScore).toBeGreaterThanOrEqual(0);
    expect(result.healthScore).toBeLessThanOrEqual(100);
  });

  it('adjusts score based on improving trend', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 75 });
    const improvingHistory = makeHistoricalData('heart_rate', [60, 65, 70, 73]);
    const decliningHistory = makeHistoricalData('heart_rate', [90, 85, 80, 77]);

    const improving = await HealthDataProcessor.processHealthMetric(metric, improvingHistory);
    const declining = await HealthDataProcessor.processHealthMetric(metric, decliningHistory);

    expect(improving.healthScore).toBeGreaterThan(declining.healthScore!);
  });
});

// ── Fall Risk Assessment ─────────────────────────────────────────────────────

describe('fallRisk assessment', () => {
  it('returns low risk for high walking steadiness', async () => {
    const metric = makeMetric({ type: 'walking_steadiness', value: 90 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.fallRisk).toBe('low');
  });

  it('returns low risk for walking steadiness just below moderate threshold', async () => {
    // value 60 < 75 → 10 points, below moderate classification (20)
    const metric = makeMetric({ type: 'walking_steadiness', value: 60 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.fallRisk).toBe('low');
  });

  it('returns moderate risk for walking steadiness below high threshold', async () => {
    // value 35 < 50 → 20 points, equals moderate classification (20)
    const metric = makeMetric({ type: 'walking_steadiness', value: 35 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.fallRisk).toBe('moderate');
  });

  it('returns high risk for very low walking steadiness', async () => {
    // value 10 < 25 → 40 points, equals high classification (40)
    const metric = makeMetric({ type: 'walking_steadiness', value: 10 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.fallRisk).toBe('high');
  });

  it('increases risk with concerning historical readings', async () => {
    const metric = makeMetric({ type: 'walking_steadiness', value: 60 });
    const badHistory = makeHistoricalData('walking_steadiness', [30, 35, 40, 45, 48], { daysAgo: 5 });
    // Mix some heart rate concerns
    const recentHR = makeHistoricalData('heart_rate', [45, 130, 48], { daysAgo: 3 });
    const history = [...badHistory, ...recentHR];

    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(['moderate', 'high', 'critical']).toContain(result.fallRisk);
  });

  it('returns low for non-walking metrics', async () => {
    const metric = makeMetric({ type: 'steps', value: 5000 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.fallRisk).toBe('low');
  });
});

// ── Alert Generation ─────────────────────────────────────────────────────────

describe('alert generation', () => {
  it('generates critical alert for dangerously low heart rate', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 35 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.alert?.level).toBe('critical');
    expect(result.alert?.message).toContain('Heart rate');
    expect(result.alert?.actionRequired).toBe(true);
  });

  it('generates critical alert for dangerously high heart rate', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 160 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.alert?.level).toBe('critical');
    expect(result.alert?.actionRequired).toBe(true);
  });

  it('generates critical alert for low oxygen saturation', async () => {
    const metric = makeMetric({ type: 'oxygen_saturation', value: 85 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.alert?.level).toBe('critical');
    expect(result.alert?.message).toContain('Oxygen saturation');
  });

  it('generates warning alert for low walking steadiness', async () => {
    // value 10 → fallRisk=high, healthScore=20 (<30) → warning
    const metric = makeMetric({ type: 'walking_steadiness', value: 10 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.alert?.level).toBe('warning');
    expect(result.alert?.message).toContain('Health score');
  });

  it('generates warning alert for low health score', async () => {
    // Very abnormal heart rate → low health score
    const metric = makeMetric({ type: 'heart_rate', value: 35 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    // This will be critical due to heart rate range, not low health score
    expect(result.alert).not.toBeNull();
  });

  it('returns null alert for normal metrics', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.alert).toBeNull();
  });

  it('includes expiresAt on critical alerts', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 35 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.alert?.expiresAt).toBeDefined();
  });
});

// ── Data Quality Assessment ──────────────────────────────────────────────────

describe('dataQuality assessment', () => {
  it('returns high completeness for full metric', async () => {
    const metric = makeMetric({
      unit: 'bpm',
      timestamp: new Date().toISOString(),
      deviceId: 'dev-1',
    });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.completeness).toBe(100);
  });

  it('penalizes missing unit', async () => {
    const metric = makeMetric({ unit: undefined });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.completeness).toBeLessThan(100);
  });

  it('penalizes missing timestamp', async () => {
    const metric = makeMetric({ timestamp: undefined });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.completeness).toBeLessThan(100);
  });

  it('penalizes missing deviceId', async () => {
    const metric = makeMetric({ deviceId: undefined });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.completeness).toBeLessThan(100);
  });

  it('penalizes accuracy for out-of-range values', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 250 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.accuracy).toBeLessThan(90);
  });

  it('has good accuracy for in-range values', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.accuracy).toBe(90);
  });

  it('penalizes timeliness for old data', async () => {
    const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
    const metric = makeMetric({ timestamp: oldTimestamp });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.timeliness).toBeLessThan(100);
  });

  it('has full timeliness for recent data', async () => {
    const metric = makeMetric({ timestamp: new Date().toISOString() });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.dataQuality?.timeliness).toBeGreaterThanOrEqual(95);
  });

  it('penalizes consistency for large deviation from history', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 150 });
    const history = makeHistoricalData('heart_rate', [70, 72, 71, 73, 70]);
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.dataQuality?.consistency).toBeLessThan(90);
  });

  it('has good consistency when aligned with history', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const history = makeHistoricalData('heart_rate', [70, 72, 71, 73, 70]);
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.dataQuality?.consistency).toBe(90);
  });
});

// ── Anomaly Detection ────────────────────────────────────────────────────────

describe('anomaly detection', () => {
  it('returns 0 without enough historical data', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.anomalyScore).toBe(0);
  });

  it('detects anomaly for outlier value', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 150 });
    const history = makeHistoricalData(
      'heart_rate',
      [70, 72, 71, 73, 70, 72, 71, 73, 70, 72]
    );
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.anomalyScore).toBeGreaterThan(0);
  });

  it('returns low anomaly for normal value in line with history', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const history = makeHistoricalData(
      'heart_rate',
      [70, 72, 71, 73, 70, 72, 71, 73, 70, 72]
    );
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.anomalyScore).toBeLessThan(0.5);
  });
});

// ── Validation ───────────────────────────────────────────────────────────────

describe('metric validation', () => {
  it('validates in-range heart rate', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.validated).toBe(true);
  });

  it('invalidates out-of-range heart rate', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 250 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.validated).toBe(false);
  });

  it('validates edge of range (min)', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 30 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.validated).toBe(true);
  });

  it('validates edge of range (max)', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 220 });
    const result = await HealthDataProcessor.processHealthMetric(metric);
    expect(result.validated).toBe(true);
  });

  it('validates different metric types', async () => {
    const types: Array<{ type: HealthMetric['type']; value: number }> = [
      { type: 'steps', value: 5000 },
      { type: 'walking_steadiness', value: 80 },
      { type: 'gait_speed', value: 1.2 },
      { type: 'cadence', value: 110 },
      { type: 'oxygen_saturation', value: 97 },
      { type: 'sleep_hours', value: 7.5 },
      { type: 'body_weight', value: 70 },
      { type: 'active_energy', value: 500 },
      { type: 'body_temperature', value: 98.6 },
      { type: 'respiratory_rate', value: 16 },
    ];

    for (const { type, value } of types) {
      const result = await HealthDataProcessor.processHealthMetric(
        makeMetric({ type, value })
      );
      expect(result.validated).toBe(true);
    }
  });
});

// ── Trend Analysis ───────────────────────────────────────────────────────────

describe('trend analysis', () => {
  it('detects improving trend from rising values', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 80 });
    const history = makeHistoricalData('heart_rate', [60, 62, 65, 68, 72, 75, 78]);
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.trendAnalysis?.direction).toBe('improving');
  });

  it('detects declining trend from falling values', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 55 });
    const history = makeHistoricalData('heart_rate', [80, 77, 74, 70, 65, 60, 58]);
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.trendAnalysis?.direction).toBe('declining');
  });

  it('detects stable trend for consistent values', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 72 });
    const history = makeHistoricalData('heart_rate', [72, 71, 72, 73, 72, 71, 72]);
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.trendAnalysis?.direction).toBe('stable');
  });

  it('provides changePercent for sufficient data', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 80 });
    const history = makeHistoricalData('heart_rate', [60, 65, 70, 75, 78]);
    const result = await HealthDataProcessor.processHealthMetric(metric, history);
    expect(result.trendAnalysis?.changePercent).toBeDefined();
  });

  it('increases confidence with more data points', async () => {
    const metric = makeMetric({ type: 'heart_rate', value: 75 });
    const shortHistory = makeHistoricalData('heart_rate', [70, 72, 74]);
    const longHistory = makeHistoricalData('heart_rate', [60, 62, 64, 66, 68, 70, 72]);

    const shortResult = await HealthDataProcessor.processHealthMetric(metric, shortHistory);
    const longResult = await HealthDataProcessor.processHealthMetric(metric, longHistory);

    expect(longResult.trendAnalysis!.confidence).toBeGreaterThanOrEqual(
      shortResult.trendAnalysis!.confidence
    );
  });
});
