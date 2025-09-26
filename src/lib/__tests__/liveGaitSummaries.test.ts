import { summarizeGaitSnapshots } from '@/lib/liveGaitSummaries';
import { describe, expect, it } from 'vitest';

describe('summarizeGaitSnapshots', () => {
  it('produces rolling stats and trends with empty input', () => {
    const s = summarizeGaitSnapshots([]);
    expect(s.ordered.length).toBe(0);
    expect(s.rolling.speedAvg).toBeNull();
    expect(s.trends).toBeTruthy();
  });
  it('computes averages for provided snapshots', () => {
    const now = new Date().toISOString();
    const s = summarizeGaitSnapshots([
      { capturedAt: now, speed: 1, stepFrequency: 100, source: 'test' },
      { capturedAt: now, speed: 1.5, stepFrequency: 110, source: 'test' },
    ]);
    expect(s.rolling.speedAvg).toBeCloseTo(1.25, 3);
    expect(s.rolling.cadenceAvg).toBeCloseTo(105, 3);
  });
});
