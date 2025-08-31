import { describe, it, expect } from 'vitest';
import { processedHealthDataSchema } from '../schemas/health';

describe('processedHealthDataSchema', () => {
  it('accepts a valid processed health record', () => {
    const sample = {
      type: 'heart_rate',
      value: 64,
      processedAt: new Date().toISOString(),
      validated: true,
      alert: null,
    };
    const res = processedHealthDataSchema.safeParse(sample);
    expect(res.success).toBe(true);
  });

  it('rejects invalid values and datetimes', () => {
    const bad = {
      type: 'heart_rate',
      value: 'NaN', // wrong type
      processedAt: 'yesterday', // not ISO datetime
      validated: 'yes',
    };
    const res = processedHealthDataSchema.safeParse(bad);
    expect(res.success).toBe(false);
  });
});
