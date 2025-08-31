import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { HealthDataProcessor } from '../lib/healthDataProcessor';

describe('HealthDataProcessor', () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.restoreAllMocks());
  it('processHealthData returns structured analytics with expected aggregation lengths', async () => {
    // Make generation deterministic (randomComponent = 0)
    vi.spyOn(Math, 'random').mockReturnValue(0.5);

    const data = await HealthDataProcessor.processHealthData();
    expect(data.lastUpdated).toBeTypeOf('string');
    expect(Array.isArray(data.insights)).toBe(true);
    expect(Array.isArray(data.fallRiskFactors)).toBe(true);

    const { steps, heartRate, walkingSteadiness, sleepHours } = data.metrics;
    // Daily series of 90 points, weekly ceil(90/7)=13, monthly ceil(13/7)=2
    expect(steps.daily.length).toBe(90);
    expect(steps.weekly.length).toBe(13);
    expect(steps.monthly.length).toBe(2);

    expect(heartRate.daily.length).toBe(90);
    expect(walkingSteadiness.weekly.length).toBe(13);
    expect(sleepHours.monthly.length).toBe(2);
  });
});
