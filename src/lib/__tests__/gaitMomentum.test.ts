import { describe, expect, it } from 'vitest';
import {
  MOMENTUM_DOWNWARD_THRESHOLD,
  MOMENTUM_UPWARD_THRESHOLD,
  computeMomentum,
  formatMomentumBadge,
  momentumWeight,
  severityNumeric,
} from '../gaitMomentum';

describe('gaitMomentum', () => {
  it('maps severities to numeric scale', () => {
    expect(severityNumeric('strong_improvement')).toBe(3);
    expect(severityNumeric('moderate_improvement')).toBe(2);
    expect(severityNumeric('mild_improvement')).toBe(1);
    expect(severityNumeric('stable')).toBe(0);
    expect(severityNumeric('mild_decline')).toBe(-1);
    expect(severityNumeric('moderate_decline')).toBe(-2);
    expect(severityNumeric('strong_decline')).toBe(-3);
    // undefined / insufficient_data treated neutral
    // undefined severity treated as neutral (passing as parameter type union allows undefined)
    const undef: undefined = undefined;
    expect(severityNumeric(undef as unknown as undefined)).toBe(0);
  });

  it('computes weight using confidence and relative slope normalization', () => {
    const w1 = momentumWeight({
      severity: 'stable',
      confidence: 0.8,
      relativeSlope: 0.02,
    });
    // relNorm = 0.02/0.05 = 0.4 => weight 0.32
    expect(w1).toBeCloseTo(0.32, 3);
    const w2 = momentumWeight({
      severity: 'stable',
      confidence: 0.8,
      relativeSlope: 0.2,
    });
    // relNorm capped at 1 -> 0.8
    expect(w2).toBeCloseTo(0.8, 3);
    const w3 = momentumWeight({
      severity: 'stable',
      confidence: 0.8,
      relativeSlope: null,
    });
    // fallback 0.5 -> 0.4
    expect(w3).toBeCloseTo(0.4, 3);
  });

  it('returns null for empty or non-contributing trends', () => {
    expect(computeMomentum(null)).toBeNull();
    expect(computeMomentum({})).toBeNull();
    // no severities/confidences
    expect(
      computeMomentum({
        speed: { severity: undefined, confidence: null, relativeSlope: null },
      })
    ).toBeNull();
  });

  it('classifies upward momentum', () => {
    const res = computeMomentum({
      speed: {
        severity: 'strong_improvement',
        confidence: 0.9,
        relativeSlope: 0.06, // normalized to 1
      },
      cadence: {
        severity: 'moderate_improvement',
        confidence: 0.85,
        relativeSlope: 0.05, // normalized to 1
      },
    });
    expect(res).not.toBeNull();
    expect(res!.classification).toBe('Upward');
    expect(res!.score).toBeGreaterThan(1.5); // strong positive
  });

  it('classifies downward momentum', () => {
    const res = computeMomentum({
      speed: {
        severity: 'strong_decline',
        confidence: 0.95,
        relativeSlope: 0.05,
      },
      variability: {
        severity: 'moderate_decline',
        confidence: 0.8,
        relativeSlope: 0.05,
      },
    });
    expect(res).not.toBeNull();
    expect(res!.classification).toBe('Downward');
    expect(res!.score).toBeLessThan(-1.5);
  });

  it('classifies stable momentum near zero', () => {
    const res = computeMomentum({
      speed: { severity: 'stable', confidence: 0.9, relativeSlope: 0.05 },
      cadence: { severity: 'stable', confidence: 0.6, relativeSlope: 0.01 },
      asym: {
        severity: 'mild_improvement',
        confidence: 0.4,
        relativeSlope: 0.005,
      },
      variability: {
        severity: 'mild_decline',
        confidence: 0.4,
        relativeSlope: 0.005,
      },
    });
    expect(res).not.toBeNull();
    expect(Math.abs(res!.score)).toBeLessThan(0.6);
    expect(res!.classification).toBe('Stable');
  });

  it('returns null (weight zero) when all confidences are zero', () => {
    const res = computeMomentum({
      speed: {
        severity: 'mild_improvement',
        confidence: 0,
        relativeSlope: 0.05,
      },
      cadence: { severity: 'mild_decline', confidence: 0, relativeSlope: 0.05 },
    });
    expect(res).toBeNull();
  });

  it('formats momentum badge consistently', () => {
    const mock = {
      score: 1.23456,
      classification: 'Upward' as const,
      totalWeight: 2.5,
      contributing: 3,
    };
    const badge = formatMomentumBadge(mock);
    expect(badge.label).toBe('Upward');
    expect(badge.title).toContain('Momentum score 1.23');
    const empty = formatMomentumBadge(null);
    expect(empty.label).toBe('—');
    expect(empty.title).toBeUndefined();
  });
  it('respects classification thresholds over randomized samples', () => {
    type Sev =
      | 'strong_improvement'
      | 'moderate_improvement'
      | 'mild_improvement'
      | 'stable'
      | 'mild_decline'
      | 'moderate_decline'
      | 'strong_decline';
    for (let i = 0; i < 150; i++) {
      const metrics: Record<
        string,
        { severity: Sev; confidence: number; relativeSlope: number }
      > = {};
      const count = 3 + Math.floor(Math.random() * 5);
      const severities = [
        'strong_improvement',
        'moderate_improvement',
        'mild_improvement',
        'stable',
        'mild_decline',
        'moderate_decline',
        'strong_decline',
      ];
      for (let m = 0; m < count; m++) {
        const sev = severities[
          Math.floor(Math.random() * severities.length)
        ] as Sev;
        metrics['m' + m] = {
          severity: sev,
          confidence: Math.random(),
          relativeSlope: Math.random() * 0.08,
        };
      }
      const res = computeMomentum(metrics);
      if (!res) continue;
      if (res.score > MOMENTUM_UPWARD_THRESHOLD)
        expect(res.classification).toBe('Upward');
      else if (res.score < MOMENTUM_DOWNWARD_THRESHOLD)
        expect(res.classification).toBe('Downward');
      else expect(res.classification).toBe('Stable');
    }
  });
});
