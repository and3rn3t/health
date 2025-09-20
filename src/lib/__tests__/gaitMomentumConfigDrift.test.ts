import { describe, expect, it } from 'vitest';
import { gaitConfig } from '../gaitConfig';
import {
  MOMENTUM_DOWNWARD_THRESHOLD,
  MOMENTUM_UPWARD_THRESHOLD,
} from '../gaitMomentum';

describe('momentum config drift', () => {
  it('mirrors gaitConfig values', () => {
    expect(MOMENTUM_UPWARD_THRESHOLD).toBe(gaitConfig.momentum.upwardThreshold);
    expect(MOMENTUM_DOWNWARD_THRESHOLD).toBe(
      gaitConfig.momentum.downwardThreshold
    );
  });
});
