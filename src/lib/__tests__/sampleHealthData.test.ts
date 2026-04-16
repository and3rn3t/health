import { describe, expect, it } from 'vitest';
import { generateSampleHealthData } from '../sampleHealthData';

describe('generateSampleHealthData', () => {
  it('returns a ProcessedHealthData object', () => {
    const data = generateSampleHealthData();
    expect(data).toBeDefined();
    expect(typeof data).toBe('object');
  });

  it('includes metrics with expected keys', () => {
    const data = generateSampleHealthData();
    expect(data.metrics).toBeDefined();
    expect(typeof data.metrics).toBe('object');
  });

  it('includes daily data arrays within metrics', () => {
    const data = generateSampleHealthData();
    expect(data.metrics.steps.daily).toBeDefined();
    expect(Array.isArray(data.metrics.steps.daily)).toBe(true);
    expect(data.metrics.steps.daily.length).toBeGreaterThan(0);
  });
});
