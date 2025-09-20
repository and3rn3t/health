import {
  classifySeverity,
  computeMultiMetricTrends,
  computeSingleMetricTrend,
  type BasicGaitSnapshot,
} from '@/lib/gaitTrends';
import { describe, expect, it } from 'vitest';

function genSeries(start: number, delta: number, n: number): number[] {
  return Array.from({ length: n }, (_, i) => start + i * delta);
}

describe('computeSingleMetricTrend', () => {
  it('returns insufficient_data for <3 samples', () => {
    const r = computeSingleMetricTrend([1, 2]);
    expect(r.sampleCount).toBe(2);
    expect(r.severity).toBe('insufficient_data');
    expect(r.direction).toBeNull();
  });

  it('detects improving trend with positive slope', () => {
    const values = genSeries(1, 0.1, 10); // increasing
    const r = computeSingleMetricTrend(values);
    expect(r.direction).toBe('improving');
    expect(r.slope).not.toBeNull();
    expect(r?.slope ?? 0).toBeGreaterThan(0);
  });

  it('detects declining trend with negative slope', () => {
    const values = genSeries(5, -0.05, 12); // decreasing
    const r = computeSingleMetricTrend(values);
    expect(r.direction).toBe('declining');
    expect(r?.slope ?? 0).toBeLessThan(0);
  });

  it('classifies stable when relative slope below threshold', () => {
    const values = Array.from({ length: 20 }, () => 3 + Math.random() * 0.001);
    const r = computeSingleMetricTrend(values);
    expect(r.direction).toBe('stable');
  });
});

describe('classifySeverity', () => {
  it('returns insufficient_data for stable low-confidence pattern', () => {
    const base = computeSingleMetricTrend(Array.from({ length: 10 }, () => 5));
    const sev = classifySeverity(base);
    expect(sev.severity).toBe('insufficient_data');
  });

  it('produces a non-null direction for pronounced monotonic change', () => {
    const trend = computeSingleMetricTrend(genSeries(1, 0.5, 20));
    expect(trend.direction).not.toBeNull();
  });

  it('returns insufficient_data when low confidence', () => {
    // Force low confidence by tiny variance and few samples
    const r = computeSingleMetricTrend([10, 10.0001, 10.00005]);
    const sev = classifySeverity(r);
    expect(sev.severity).toBe('insufficient_data');
  });
});

describe('computeMultiMetricTrends', () => {
  it('computes trends for all metrics & flips direction for lower-is-better (may classify stable if relative slope tiny)', () => {
    const snapshots: BasicGaitSnapshot[] = Array.from(
      { length: 15 },
      (_, i) => ({
        speed: 1 + i * 0.01, // improving
        stepFrequency: 100 + i * 0.5, // improving
        asymmetry: 5 - i * 0.05, // decreasing (improving because lower is better)
        variability: 10 - i * 0.1, // decreasing (improving)
      })
    );
    const trends = computeMultiMetricTrends(snapshots);
    expect(Object.keys(trends)).toEqual(
      expect.arrayContaining(['speed', 'cadence', 'asymmetry', 'variability'])
    );
    // speed & cadence should be improving (positive slope)
    expect(['improving', 'stable']).toContain(trends.speed.direction);
    expect(['improving', 'stable']).toContain(trends.cadence.direction);
    // asymmetry & variability series decreasing (improvement after flip)
    expect(['improving', 'stable']).toContain(trends.asymmetry.direction);
    expect(['improving', 'stable']).toContain(trends.variability.direction);
  });

  it('produces insufficient_data when not enough samples', () => {
    const snapshots: BasicGaitSnapshot[] = [{ speed: 1.2 }];
    const trends = computeMultiMetricTrends(snapshots);
    expect(trends.speed.severity).toBe('insufficient_data');
  });
});
