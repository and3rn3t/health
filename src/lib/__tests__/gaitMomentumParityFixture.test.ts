import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { computeMomentum, GaitTrendSeverity } from '../gaitMomentum';

interface FixtureTrendPartial {
  severity: string;
  confidence: number;
  relativeSlope: number;
}

describe('momentum parity fixture', () => {
  it('produces deterministic classification for fixture sample', () => {
    const p = path.resolve(
      __dirname,
      '../../fixtures/momentum-parity-sample.json'
    );
    const json = JSON.parse(fs.readFileSync(p, 'utf-8')) as {
      trends: Record<string, FixtureTrendPartial>;
    };
    const casted: Record<
      string,
      {
        severity?: GaitTrendSeverity;
        confidence: number | null;
        relativeSlope?: number | null;
      }
    > = {};
    for (const [k, v] of Object.entries(json.trends)) {
      casted[k] = {
        severity: v.severity as GaitTrendSeverity,
        confidence: v.confidence,
        relativeSlope: v.relativeSlope,
      };
    }
    const res = computeMomentum(casted);
    expect(res).not.toBeNull();
    expect(res!.classification).toBe('Upward');
    expect(res!.score).toBeGreaterThan(0.3);
    expect(res!.score).toBeLessThan(1.5);
  });
});
