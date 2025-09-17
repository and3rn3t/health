import type { LiveHealthMetric } from '@/lib/liveHealthDataSync';
import { describe, expect, it } from 'vitest';
import {
  computeCompositeFromMetrics,
  type InsightConfig,
} from './liveInsights';

const mk = (
  type: LiveHealthMetric['metricType'],
  value: number,
  i = 0
): LiveHealthMetric => ({
  deviceId: 'test',
  confidence: 0.9,
  source: 'iphone',
  unit: '',
  timestamp: new Date(Date.now() + i * 1000).toISOString(),
  metricType: type,
  value,
});

describe('normalized risk via composite components', () => {
  it('low-is-bad: gait_speed at warn=0 risk, at critical=1 risk, midpoint=0.5', () => {
    const cfg: InsightConfig = {
      thresholds: {
        gait_speed: { warn: 1.0, critical: 0.8, direction: 'low-is-bad' },
      },
      weights: { gait_speed: 1 },
    };
    const c0 = computeCompositeFromMetrics([mk('gait_speed', 1.0)], cfg);
    expect(c0.components.gait_speed).toBeCloseTo(0, 6);
    const c1 = computeCompositeFromMetrics([mk('gait_speed', 0.8)], cfg);
    expect(c1.components.gait_speed).toBeCloseTo(1, 6);
    const cm = computeCompositeFromMetrics([mk('gait_speed', 0.9)], cfg);
    expect(cm.components.gait_speed).toBeCloseTo(0.5, 6);
  });

  it('high-is-bad: double_support_time at warn=0 risk, at critical=1 risk, midpoint=0.5', () => {
    const cfg: InsightConfig = {
      thresholds: {
        double_support_time: {
          warn: 30,
          critical: 40,
          direction: 'high-is-bad',
        },
      },
      weights: { double_support_time: 1 },
    };
    const c0 = computeCompositeFromMetrics(
      [mk('double_support_time', 30)],
      cfg
    );
    expect(c0.components.double_support_time).toBeCloseTo(0, 6);
    const c1 = computeCompositeFromMetrics(
      [mk('double_support_time', 40)],
      cfg
    );
    expect(c1.components.double_support_time).toBeCloseTo(1, 6);
    const cm = computeCompositeFromMetrics(
      [mk('double_support_time', 35)],
      cfg
    );
    expect(cm.components.double_support_time).toBeCloseTo(0.5, 6);
  });
});
