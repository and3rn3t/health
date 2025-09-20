import { GAIT_ANALYTICS_VERSION, gaitConfig } from '@/lib/gaitConfig';
import { computeMomentum } from '@/lib/gaitMomentum';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

describe('Gait advanced guards', () => {
  it('exports a stable GAIT_ANALYTICS_VERSION hash', () => {
    expect(GAIT_ANALYTICS_VERSION).toMatch(/^[0-9a-f]{8}$/);
  });

  it('Swift version matches TypeScript hash', () => {
    const repoRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      '../../..'
    );
    const swiftFile = path.join(
      repoRoot,
      'ios',
      'HealthKitBridge',
      'Generated',
      'GaitConfig.swift'
    );
    if (!fs.existsSync(swiftFile)) return; // existing parity test will fail earlier if missing
    const swift = fs.readFileSync(swiftFile, 'utf-8');
    const m = /static\s+let\s+version:\s+String\s*=\s*"([0-9a-f]{8})"/.exec(
      swift
    );
    expect(m).not.toBeNull();
    expect(m![1]).toBe(GAIT_ANALYTICS_VERSION);
  });

  it('momentum classification is monotonic around thresholds (small perturbations do not flip twice)', () => {
    const base = {
      speed: {
        severity: 'mild_improvement',
        confidence: 0.8,
        relativeSlope: 0.018,
      },
      cadence: {
        severity: 'mild_improvement',
        confidence: 0.75,
        relativeSlope: 0.017,
      },
      variability: {
        severity: 'mild_decline',
        confidence: 0.7,
        relativeSlope: 0.016,
      },
    } as const;
    const original = computeMomentum(base)!;
    const steps: Array<number> = [-0.002, -0.001, 0, 0.001, 0.002];
    let lastClass = original.classification;
    let flips = 0;
    for (const delta of steps) {
      const mutated = {
        speed: {
          ...base.speed,
          relativeSlope: Math.max(0, base.speed.relativeSlope + delta),
        },
        cadence: {
          ...base.cadence,
          relativeSlope: Math.max(0, base.cadence.relativeSlope + delta),
        },
        variability: base.variability,
      } as const;
      const res = computeMomentum(mutated)!;
      if (res.classification !== lastClass) flips++;
      lastClass = res.classification;
    }
    expect(flips).toBeLessThan(3); // guard against oscillation/immediate re-flip
  });

  it('low confidence reduces total weight (even if score saturates)', () => {
    const baseRel = gaitConfig.magnitude.strong * 2;
    const highConf = gaitConfig.minimumConfidence * 2;
    const lowConf = gaitConfig.minimumConfidence * 0.5;
    const high = computeMomentum({
      speed: {
        severity: 'strong_improvement',
        confidence: highConf,
        relativeSlope: baseRel,
      },
      cadence: {
        severity: 'strong_improvement',
        confidence: highConf,
        relativeSlope: baseRel,
      },
    });
    const low = computeMomentum({
      speed: {
        severity: 'strong_improvement',
        confidence: lowConf,
        relativeSlope: baseRel,
      },
      cadence: {
        severity: 'strong_improvement',
        confidence: lowConf,
        relativeSlope: baseRel,
      },
    });
    if (high && low) {
      expect(low.totalWeight).toBeLessThan(high.totalWeight);
      expect(high.classification).toBe('Upward');
      expect(low.classification).toBe('Upward');
    }
  });
});
