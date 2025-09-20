import { invoke } from '@/__tests__/harness/honoTestHarness';
import { FALL_RISK_ANALYTICS_VERSION } from '@/lib/fallRiskConfig';
import { GAIT_ANALYTICS_VERSION } from '@/lib/gaitConfig';
import { describe, expect, it } from 'vitest';

describe('analyticsVersions /ws metadata parity', () => {
  it('exposes gait & fall risk versions matching local constants', async () => {
    const { res, json } = await invoke<{
      analyticsVersions: { gait: string; fallRisk: string };
    }>('/ws', { asJson: true });
    expect(res.status).toBe(200);
    expect(json).toBeTruthy();
    expect(json?.analyticsVersions.gait).toBe(GAIT_ANALYTICS_VERSION);
    expect(json?.analyticsVersions.fallRisk).toBe(FALL_RISK_ANALYTICS_VERSION);
  });
});
