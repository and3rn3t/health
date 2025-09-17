import type { LiveHealthMetric } from '@/lib/liveHealthDataSync';
import { describe, expect, it } from 'vitest';
import {
  computeCompositeScore,
  createInitialInsightState,
  updateInsights,
  type InsightConfig,
} from './liveInsights';

const baseMetric = () => ({
  deviceId: 'test-device',
  confidence: 0.9,
  unit: '',
  timestamp: new Date().toISOString(),
  source: 'iphone' as const,
});

describe('liveInsights', () => {
  it('computes gait speed warnings using defaults', () => {
    let state = createInitialInsightState();
    const m: LiveHealthMetric = {
      ...baseMetric(),
      metricType: 'gait_speed',
      value: 0.85,
      unit: 'm/s',
    };
    state = updateInsights(state, m);
    expect(state.insights.some((i) => i.metricType === 'gait_speed')).toBe(
      true
    );
  });

  it('respects custom thresholds from config', () => {
    let state = createInitialInsightState();
    const cfg: InsightConfig = {
      thresholds: {
        gait_speed: { warn: 1.2, critical: 1.0, direction: 'low-is-bad' },
      },
    };
    const m: LiveHealthMetric = {
      ...baseMetric(),
      metricType: 'gait_speed',
      value: 1.05,
      unit: 'm/s',
    };
    state = updateInsights(state, m, cfg);
    // 1.05 lies between warn and critical -> warning or critical depending on config
    expect(state.insights.length).toBeGreaterThan(0);
  });

  it('computes composite score from multiple metrics', () => {
    let state = createInitialInsightState();
    const now = Date.now();
    const mk = (
      t: LiveHealthMetric['metricType'],
      v: number,
      i: number
    ): LiveHealthMetric => ({
      deviceId: 'test-device',
      confidence: 0.9,
      source: 'iphone',
      unit: '',
      metricType: t,
      value: v,
      timestamp: new Date(now + i * 1000).toISOString(),
    });
    const metrics: LiveHealthMetric[] = [
      mk('gait_speed', 0.9, 0),
      mk('stability_index', 55, 1),
      mk('double_support_time', 35, 2),
      mk('step_asymmetry', 6, 3),
      mk('sway_balance', 2, 4),
    ];
    metrics.forEach((m) => (state = updateInsights(state, m)));
    const comp = computeCompositeScore(state);
    expect(comp.mobilityScore).toBeGreaterThanOrEqual(0);
    expect(comp.mobilityScore).toBeLessThanOrEqual(100);
  });
});
