import { describe, expect, it } from 'vitest';
import { generateDemoHealthData } from '../demo-data';

describe('generateDemoHealthData', () => {
  it('returns an array', () => {
    const data = generateDemoHealthData();
    expect(Array.isArray(data)).toBe(true);
    expect(data.length).toBeGreaterThan(0);
  });

  it('each record has a timestamp', () => {
    const data = generateDemoHealthData();
    for (const record of data) {
      expect(record).toHaveProperty('timestamp');
    }
  });

  it('returns records sorted by timestamp descending', () => {
    const data = generateDemoHealthData();
    for (let i = 1; i < data.length; i++) {
      const prev = new Date(data[i - 1]!.timestamp).getTime();
      const curr = new Date(data[i]!.timestamp).getTime();
      expect(prev).toBeGreaterThanOrEqual(curr);
    }
  });
});
