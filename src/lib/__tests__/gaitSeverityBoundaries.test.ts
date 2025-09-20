import { describe, expect, it } from 'vitest';
import { severityNumeric } from '../gaitMomentum';
import { classifySeverity, computeSingleMetricTrend } from '../gaitTrends';

function classify(values: number[]) {
  return classifySeverity(computeSingleMetricTrend(values));
}

describe('gait severity boundaries', () => {
  it('insufficient_data when relative slope tiny (low confidence)', () => {
    const tr = classify([1, 1.0005, 1.0008]);
    expect(tr.severity).toBe('insufficient_data');
  });
  it('increasing pattern shows non-decreasing severity ordering', () => {
    const mildish = classify([1, 1.004, 1.008, 1.011, 1.013]);
    const moderateish = classify([1, 1.012, 1.024, 1.036, 1.048]);
    const strongish = classify([1, 1.05, 1.09, 1.14, 1.2]);
    const s1 = severityNumeric(mildish.severity as any);
    const s2 = severityNumeric(moderateish.severity as any);
    const s3 = severityNumeric(strongish.severity as any);
    expect(s2).toBeGreaterThanOrEqual(s1);
    expect(s3).toBeGreaterThanOrEqual(s2);
  });
  it('declining pattern yields negative severity that grows in magnitude', () => {
    const mildDecline = classify([1.2, 1.195, 1.19, 1.185, 1.18]);
    const strongerDecline = classify([1.2, 1.18, 1.16, 1.14, 1.12]);
    const sd1 = severityNumeric(mildDecline.severity as any);
    const sd2 = severityNumeric(strongerDecline.severity as any);
    // Both should be <= 0 and sd2 should be <= sd1 (more negative)
    expect(sd1).toBeLessThanOrEqual(0);
    expect(sd2).toBeLessThanOrEqual(sd1);
  });
});
