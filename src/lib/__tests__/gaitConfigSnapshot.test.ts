import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { GAIT_ANALYTICS_VERSION, gaitConfig } from '../gaitConfig';

describe('gaitConfig snapshot & parity', () => {
  it('matches expected stable values', () => {
    expect(gaitConfig).toEqual({
      magnitude: { moderate: 0.02, strong: 0.04 },
      minimumConfidence: 0.15,
      momentum: {
        downwardThreshold: -0.6,
        fallbackRelative: 0.5,
        relativeSlopeNormalizer: 0.05,
        upwardThreshold: 0.6,
      },
      stabilityRelativeSlopeThreshold: 0.01,
    });
  });
  it('JSON export artifact wraps version + config and matches values', () => {
    const p = path.resolve(__dirname, '../../fixtures/gait-config-export.json');
    const json = JSON.parse(fs.readFileSync(p, 'utf-8'));
    expect(json.config).toEqual(gaitConfig);
    expect(json.version).toBe(GAIT_ANALYTICS_VERSION);
  });
});
