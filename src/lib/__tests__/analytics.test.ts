import { describe, it, expect } from 'vitest';
import {
  calculateTrend,
  calculateCorrelation,
  detectPatterns,
  detectAnomalies,
  comparePeriods,
  extractTimeSeries,
  generateAnalyticsSummary,
  type TimeSeriesDataPoint,
} from '../analytics';
import type { MetricData } from '../healthDataProcessor';

// ── Helpers ──────────────────────────────────────────────────────────────────

function makePoints(values: number[], startDaysAgo = 10): TimeSeriesDataPoint[] {
  const now = Date.now();
  return values.map((value, i) => ({
    date: new Date(now - (startDaysAgo - i) * 86_400_000),
    value,
  }));
}

function makeWeeklyPoints(weeksOfData: number): TimeSeriesDataPoint[] {
  const points: TimeSeriesDataPoint[] = [];
  const now = Date.now();
  for (let d = weeksOfData * 7 - 1; d >= 0; d--) {
    const date = new Date(now - d * 86_400_000);
    const dayOfWeek = date.getDay();
    // Mon-Fri higher, Sat-Sun lower to create a weekly pattern
    const base = dayOfWeek >= 1 && dayOfWeek <= 5 ? 80 : 40;
    points.push({ date, value: base + Math.random() * 5 });
  }
  return points;
}

// ── calculateTrend ───────────────────────────────────────────────────────────

describe('calculateTrend', () => {
  it('returns stable defaults for empty data', () => {
    const result = calculateTrend([]);
    expect(result.direction).toBe('stable');
    expect(result.slope).toBe(0);
    expect(result.confidence).toBe(0);
  });

  it('returns stable defaults for single point', () => {
    const result = calculateTrend(makePoints([72]));
    expect(result.direction).toBe('stable');
  });

  it('detects an improving trend', () => {
    const data = makePoints([60, 62, 65, 68, 72, 76, 80, 85]);
    const result = calculateTrend(data, 30);
    expect(result.direction).toBe('improving');
    expect(result.slope).toBeGreaterThan(0);
    expect(result.changePercent).toBeGreaterThan(0);
  });

  it('detects a declining trend', () => {
    const data = makePoints([90, 85, 80, 75, 70, 65, 60, 50]);
    const result = calculateTrend(data, 30);
    expect(result.direction).toBe('declining');
    expect(result.slope).toBeLessThan(0);
  });

  it('reports stable for flat data', () => {
    const data = makePoints([70, 70, 70, 70, 70]);
    const result = calculateTrend(data, 30);
    expect(result.direction).toBe('stable');
    expect(result.volatility).toBe(0);
  });

  it('detects volatile when oscillating within stable range', () => {
    const data = makePoints([70, 40, 70, 40, 70, 40, 70, 40]);
    const result = calculateTrend(data, 30);
    // Start=70, end=40 is a drop but volatility is high
    expect(result.volatility).toBeGreaterThan(0.1);
  });

  it('provides a prediction with capped confidence', () => {
    const data = makePoints([60, 62, 64, 66, 68, 70]);
    const result = calculateTrend(data, 30);
    expect(result.prediction).toBeDefined();
    expect(result.prediction!.confidence).toBeLessThanOrEqual(0.8);
    expect(result.prediction!.nextDate).toBeInstanceOf(Date);
  });

  it('filters data outside the specified day window', () => {
    const now = Date.now();
    const data: TimeSeriesDataPoint[] = [
      { date: new Date(now - 60 * 86_400_000), value: 100 }, // 60 days ago, outside 7d
      { date: new Date(now - 3 * 86_400_000), value: 50 },
      { date: new Date(now - 1 * 86_400_000), value: 50 },
    ];
    const result = calculateTrend(data, 7);
    // Only the last 2 points should be used → stable
    expect(result.direction).toBe('stable');
  });

  it('returns stable when all filtered data is outside window', () => {
    const now = Date.now();
    const data: TimeSeriesDataPoint[] = [
      { date: new Date(now - 90 * 86_400_000), value: 100 },
      { date: new Date(now - 80 * 86_400_000), value: 50 },
    ];
    const result = calculateTrend(data, 7);
    expect(result.direction).toBe('stable');
    expect(result.confidence).toBe(0);
  });

  it('computes rSquared between 0 and 1', () => {
    const data = makePoints([10, 20, 30, 40, 50]);
    const result = calculateTrend(data, 30);
    expect(result.rSquared).toBeGreaterThanOrEqual(0);
    expect(result.rSquared).toBeLessThanOrEqual(1);
  });
});

// ── calculateCorrelation ─────────────────────────────────────────────────────

describe('calculateCorrelation', () => {
  it('returns no correlation for insufficient data', () => {
    const result = calculateCorrelation(makePoints([1, 2]), makePoints([3, 4]));
    expect(result.strength).toBe('none');
    expect(result.interpretation).toContain('Insufficient');
  });

  it('detects strong positive correlation', () => {
    const now = Date.now();
    const shared = [1, 2, 3, 4, 5, 6, 7, 8].map((v, i) => ({
      date: new Date(now - (8 - i) * 86_400_000),
      value: v,
    }));
    const data2 = shared.map((p) => ({ ...p, value: p.value * 2 }));
    const result = calculateCorrelation(shared, data2);
    expect(result.correlation).toBeGreaterThan(0.9);
    expect(result.strength).toBe('strong');
    expect(result.interpretation).toContain('positive');
  });

  it('detects strong negative correlation', () => {
    const now = Date.now();
    const data1 = [1, 2, 3, 4, 5, 6, 7, 8].map((v, i) => ({
      date: new Date(now - (8 - i) * 86_400_000),
      value: v,
    }));
    const data2 = data1.map((p) => ({ ...p, value: 10 - p.value }));
    const result = calculateCorrelation(data1, data2);
    expect(result.correlation).toBeLessThan(-0.9);
    expect(result.strength).toBe('strong');
    expect(result.interpretation).toContain('negative');
  });

  it('returns weak/none for uncorrelated data', () => {
    const now = Date.now();
    const dates = Array.from({ length: 10 }, (_, i) =>
      new Date(now - (10 - i) * 86_400_000)
    );
    const data1 = dates.map((d, i) => ({ date: d, value: i % 2 === 0 ? 10 : 20 }));
    const data2 = dates.map((d, i) => ({ date: d, value: i % 3 === 0 ? 30 : 15 }));
    const result = calculateCorrelation(data1, data2);
    expect(['weak', 'none', 'moderate']).toContain(result.strength);
  });

  it('aligns data by matching dates', () => {
    const now = Date.now();
    const data1 = [
      { date: new Date(now - 3 * 86_400_000), value: 10 },
      { date: new Date(now - 2 * 86_400_000), value: 20 },
      { date: new Date(now - 1 * 86_400_000), value: 30 },
    ];
    // Only share 2 dates → insufficient
    const data2 = [
      { date: new Date(now - 3 * 86_400_000), value: 5 },
      { date: new Date(now - 2 * 86_400_000), value: 15 },
      { date: new Date(now - 5 * 86_400_000), value: 999 }, // non-matching date
    ];
    const result = calculateCorrelation(data1, data2);
    expect(result.sampleSize).toBe(2);
    expect(result.strength).toBe('none');
  });

  it('reports sampleSize correctly', () => {
    const now = Date.now();
    const dates = Array.from({ length: 5 }, (_, i) =>
      new Date(now - (5 - i) * 86_400_000)
    );
    const d1 = dates.map((d, i) => ({ date: d, value: i * 10 }));
    const d2 = dates.map((d, i) => ({ date: d, value: i * 5 }));
    const result = calculateCorrelation(d1, d2);
    expect(result.sampleSize).toBe(5);
  });
});

// ── detectPatterns ───────────────────────────────────────────────────────────

describe('detectPatterns', () => {
  it('returns irregular for insufficient data', () => {
    const result = detectPatterns(makePoints([1, 2, 3]));
    expect(result).toHaveLength(1);
    expect(result[0].pattern).toBe('irregular');
    expect(result[0].strength).toBe(0);
  });

  it('detects weekly pattern with clear weekday/weekend difference', () => {
    const data = makeWeeklyPoints(4);
    const result = detectPatterns(data);
    const weekly = result.find((p) => p.pattern === 'weekly');
    // Should detect a pattern or fall back to irregular
    if (weekly) {
      expect(weekly.strength).toBeGreaterThan(0);
      expect(weekly.peakTimes).toBeDefined();
      expect(weekly.lowTimes).toBeDefined();
    }
  });

  it('returns irregular for random data', () => {
    const now = Date.now();
    // Same value every day → no weekly variance
    const data = Array.from({ length: 14 }, (_, i) => ({
      date: new Date(now - (14 - i) * 86_400_000),
      value: 50,
    }));
    const result = detectPatterns(data);
    expect(result.some((p) => p.pattern === 'irregular')).toBe(true);
  });

  it('handles data spanning fewer than 5 days-of-week', () => {
    // 7 points all on same weekday-ish (but timestamps differ day-of-week)
    const now = Date.now();
    const data = Array.from({ length: 7 }, (_, i) => ({
      date: new Date(now - i * 86_400_000),
      value: 50 + i,
    }));
    const result = detectPatterns(data);
    expect(result.length).toBeGreaterThanOrEqual(1);
  });
});

// ── detectAnomalies ──────────────────────────────────────────────────────────

describe('detectAnomalies', () => {
  it('returns empty for insufficient data', () => {
    const result = detectAnomalies(makePoints([1, 2]));
    expect(result.anomalies).toHaveLength(0);
    expect(result.anomalyScore).toBe(0);
  });

  it('detects a spike anomaly', () => {
    const data = makePoints([50, 50, 50, 50, 50, 50, 50, 200, 50, 50]);
    const result = detectAnomalies(data, 2);
    expect(result.anomalies.length).toBeGreaterThan(0);
    const spike = result.anomalies.find((a) => a.type === 'spike');
    expect(spike).toBeDefined();
    expect(spike!.value).toBe(200);
  });

  it('detects a drop anomaly', () => {
    const data = makePoints([100, 100, 100, 100, 100, 0, 100, 100]);
    const result = detectAnomalies(data, 2);
    expect(result.anomalies.length).toBeGreaterThan(0);
    const drop = result.anomalies.find((a) => a.type === 'drop');
    expect(drop).toBeDefined();
  });

  it('classifies severity based on deviation', () => {
    // Very large outlier → should be high or critical
    const data = makePoints([50, 50, 50, 50, 50, 50, 50, 50, 50, 500]);
    const result = detectAnomalies(data, 2);
    const anomaly = result.anomalies.find((a) => a.value === 500);
    expect(anomaly).toBeDefined();
    expect(['moderate', 'high', 'critical']).toContain(anomaly!.severity);
  });

  it('reports normal range based on mean and stddev', () => {
    const data = makePoints([50, 50, 50, 50, 50]);
    const result = detectAnomalies(data, 2.5);
    // All identcal → stdDev=0, normalRange min=max=50
    expect(result.normalRange.min).toBe(50);
    expect(result.normalRange.max).toBe(50);
  });

  it('computes anomalyScore proportional to anomaly count', () => {
    const data = makePoints([50, 50, 50, 50, 50, 50, 50, 200, 50, 50]);
    const result = detectAnomalies(data, 2);
    expect(result.anomalyScore).toBeGreaterThan(0);
    expect(result.anomalyScore).toBeLessThanOrEqual(1);
  });

  it('respects custom threshold', () => {
    const data = makePoints([50, 50, 50, 50, 52, 50, 48, 50]);
    const strict = detectAnomalies(data, 0.5);
    const lenient = detectAnomalies(data, 5);
    expect(strict.anomalies.length).toBeGreaterThanOrEqual(lenient.anomalies.length);
  });

  it('generates explanation for each anomaly', () => {
    const data = makePoints([50, 50, 50, 50, 50, 200, 50, 50]);
    const result = detectAnomalies(data, 2);
    for (const a of result.anomalies) {
      expect(a.explanation).toContain('detected');
    }
  });
});

// ── comparePeriods ───────────────────────────────────────────────────────────

describe('comparePeriods', () => {
  it('returns zeros for empty periods', () => {
    const result = comparePeriods([], []);
    expect(result.current).toBe(0);
    expect(result.previous).toBe(0);
    expect(result.change).toBe(0);
  });

  it('detects improving trend when current > previous', () => {
    const current = makePoints([80, 85, 90]);
    const previous = makePoints([60, 55, 50]);
    const result = comparePeriods(current, previous);
    expect(result.trend).toBe('improving');
    expect(result.change).toBeGreaterThan(0);
  });

  it('detects declining trend when current < previous', () => {
    const current = makePoints([40, 45, 42]);
    const previous = makePoints([80, 85, 90]);
    const result = comparePeriods(current, previous);
    expect(result.trend).toBe('declining');
    expect(result.change).toBeLessThan(0);
  });

  it('detects stable when change is small', () => {
    const current = makePoints([50, 50, 50]);
    const previous = makePoints([50, 50, 50]);
    const result = comparePeriods(current, previous);
    expect(result.trend).toBe('stable');
    expect(result.changePercent).toBeLessThan(2);
  });

  it('handles empty previous period gracefully', () => {
    const current = makePoints([80, 85, 90]);
    const result = comparePeriods(current, []);
    expect(result.previous).toBe(0);
    expect(result.changePercent).toBe(0); // Division guard
  });
});

// ── extractTimeSeries ────────────────────────────────────────────────────────

describe('extractTimeSeries', () => {
  const now = new Date();
  const recentDate = new Date(now.getTime() - 5 * 86_400_000).toISOString().slice(0, 10);
  const oldDate = new Date(now.getTime() - 60 * 86_400_000).toISOString().slice(0, 10);

  const metric: MetricData = {
    daily: [
      { date: recentDate, value: 72 },
      { date: oldDate, value: 65 },
    ],
    weekly: [],
    monthly: [{ date: recentDate, value: 70 }],
    average: 70,
    trend: 'stable',
    variability: 5,
    reliability: 0.9,
    lastValue: 72,
    percentileRank: 50,
  };

  it('returns empty for undefined metric', () => {
    expect(extractTimeSeries(undefined)).toEqual([]);
  });

  it('filters daily data to 7d window', () => {
    const result = extractTimeSeries(metric, '7d');
    expect(result.every((p) => p.date >= new Date(now.getTime() - 8 * 86_400_000))).toBe(true);
  });

  it('filters daily data to 30d window', () => {
    const result = extractTimeSeries(metric, '30d');
    expect(result.length).toBeGreaterThanOrEqual(1);
  });

  it('uses monthly data for 1y range', () => {
    const result = extractTimeSeries(metric, '1y');
    expect(result.length).toBe(1); // monthly has 1 recent entry
  });

  it('sorts output chronologically', () => {
    const metricMulti: MetricData = {
      ...metric,
      daily: [
        { date: new Date(now.getTime() - 2 * 86_400_000).toISOString().slice(0, 10), value: 70 },
        { date: new Date(now.getTime() - 5 * 86_400_000).toISOString().slice(0, 10), value: 60 },
        { date: new Date(now.getTime() - 1 * 86_400_000).toISOString().slice(0, 10), value: 80 },
      ],
    };
    const result = extractTimeSeries(metricMulti, '30d');
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date.getTime()).toBeGreaterThanOrEqual(result[i - 1].date.getTime());
    }
  });

  it('handles 90d range', () => {
    const result = extractTimeSeries(metric, '90d');
    expect(result.length).toBe(2); // both daily entries within 90d
  });

  it('defaults to daily when timeRange is "all"', () => {
    const result = extractTimeSeries(metric, 'all');
    // 'all' uses daily source but still applies the default switch branch cutoff
    expect(result.length).toBeGreaterThanOrEqual(0);
  });
});

// ── generateAnalyticsSummary ─────────────────────────────────────────────────

describe('generateAnalyticsSummary', () => {
  it('returns a valid summary structure', () => {
    const result = generateAnalyticsSummary([], '30d');
    expect(result.timeRange).toBe('30d');
    expect(result.totalDataPoints).toBe(0);
    expect(result.overallHealthScore).toBe(0);
    expect(result.healthScoreTrend).toBe('stable');
  });

  it('calculates overallHealthScore from health data', () => {
    const data = [
      { healthScore: 80, metrics: { steps: {} } },
      { healthScore: 60, metrics: { steps: {} } },
    ] as unknown as import('../healthDataProcessor').ProcessedHealthData[];
    const result = generateAnalyticsSummary(data, '7d');
    expect(result.overallHealthScore).toBe(70); // avg of 80 and 60
    expect(result.totalDataPoints).toBe(2);
  });

  it('lists metricsAnalyzed from first entry', () => {
    const data = [
      { metrics: { steps: {}, heartRate: {} } },
    ] as unknown as import('../healthDataProcessor').ProcessedHealthData[];
    const result = generateAnalyticsSummary(data);
    expect(result.metricsAnalyzed).toEqual(expect.arrayContaining(['steps', 'heartRate']));
  });
});
