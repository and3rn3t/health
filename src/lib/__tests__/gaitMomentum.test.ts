import { describe, expect, it } from 'vitest';
import {
  computeMomentum,
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
});
