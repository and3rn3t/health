import {
  FALL_RISK_ANALYTICS_VERSION,
  fallRiskConfig,
} from '@/lib/fallRiskConfig';
import { describe, expect, it } from 'vitest';

describe('fallRiskConfig', () => {
  it('should expose a stable version hash', () => {
    expect(FALL_RISK_ANALYTICS_VERSION).toMatch(/^[0-9a-f]{8}$/);
  });

  it('walking steadiness thresholds should be ordered (critical < high < moderate)', () => {
    const ws = fallRiskConfig.walkingSteadiness;
    expect(ws.criticalThreshold).toBeLessThan(ws.highThreshold);
    expect(ws.highThreshold).toBeLessThan(ws.moderateThreshold);
  });

  it('risk score classification thresholds should be ascending (moderate < high < critical)', () => {
    const cls = fallRiskConfig.riskScoreClassification;
    expect(cls.moderate).toBeLessThan(cls.high);
    expect(cls.high).toBeLessThan(cls.critical);
  });

  it('model score thresholds should be ascending (moderate < high < severe)', () => {
    const mdl = fallRiskConfig.modelScoreThresholds;
    expect(mdl.moderate).toBeLessThan(mdl.high);
    expect(mdl.high).toBeLessThan(mdl.severe);
  });

  it('boundary: riskScore exactly below moderate threshold should be low', () => {
    const cls = fallRiskConfig.riskScoreClassification;
    const riskScore = cls.moderate - 1; // 19
    expect(riskScore >= cls.moderate).toBe(false);
  });

  it('boundary: riskScore at moderate threshold qualifies as moderate', () => {
    const cls = fallRiskConfig.riskScoreClassification;
    const riskScore = cls.moderate; // 20
    expect(riskScore >= cls.moderate).toBe(true);
    expect(riskScore >= cls.high).toBe(false);
  });

  it('boundary: riskScore at high threshold qualifies as high', () => {
    const cls = fallRiskConfig.riskScoreClassification;
    const riskScore = cls.high; // 40
    expect(riskScore >= cls.high).toBe(true);
    expect(riskScore >= cls.critical).toBe(false);
  });

  it('boundary: riskScore at critical threshold qualifies as critical', () => {
    const cls = fallRiskConfig.riskScoreClassification;
    const riskScore = cls.critical; // 60
    expect(riskScore >= cls.critical).toBe(true);
  });
});
