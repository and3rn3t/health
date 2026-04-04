import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadStreakState, updateDailyMetrics } from '../coaching/streaks';

// Simple in-memory localStorage mock (avoid jsdom side-effects ordering)
const store: Record<string, string> = {};
const originalGet = globalThis.localStorage?.getItem;
const originalSet = globalThis.localStorage?.setItem;

beforeEach(() => {
  globalThis.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => {
      store[k] = v;
    },
    removeItem: (k: string) => {
      delete store[k];
    },
    clear: () => {
      Object.keys(store).forEach((k) => delete store[k]);
    },
    key: (i: number) => Object.keys(store)[i] ?? null,
    length: 0,
  } as unknown as Storage;
  Object.keys(store).forEach((k) => delete store[k]);
});

describe('streaks', () => {
  it('initial load yields zeroed state', () => {
    const s = loadStreakState();
    expect(s.postureUprightDays).toBe(0);
    expect(s.lowInstabilityDays).toBe(0);
    expect(s.badges).toEqual([]);
  });

  it('increments posture & instability streaks on good day', () => {
    const s1 = updateDailyMetrics({ postureOk: true, instabilityOk: true });
    expect(s1.postureUprightDays).toBe(1);
    expect(s1.lowInstabilityDays).toBe(1);
  });

  it('resets posture streak if posture fails next day', () => {
    // Day 1 good
    let s = updateDailyMetrics({ postureOk: true, instabilityOk: true });
    const today = new Date().toISOString().slice(0, 10);
    // Simulate next day by monkey patching Date
    const nextDay = new Date(Date.now() + 86_400_000);
    vi.setSystemTime(nextDay);
    s = updateDailyMetrics({ postureOk: false, instabilityOk: true });
    expect(s.postureUprightDays).toBe(0);
    expect(s.lowInstabilityDays).toBe(2); // instability continued
    // restore time
    vi.useRealTimers();
  });

  it('awards badges at thresholds (upright-5, steady-week)', () => {
    // Simulate 5 consecutive posture days and 7 instability days
    let fakeTime = Date.now();
    for (let day = 1; day <= 7; day++) {
      vi.setSystemTime(fakeTime);
      updateDailyMetrics({ postureOk: day <= 5, instabilityOk: true });
      fakeTime += 86_400_000; // +1 day
    }
    const finalState = loadStreakState();
    expect(finalState.postureUprightDays).toBe(0); // posture reset after day 5 (day 6 postureOk=false)
    expect(finalState.lowInstabilityDays).toBe(7);
    expect(finalState.badges).toContain('upright-5');
    expect(finalState.badges).toContain('steady-week');
    vi.useRealTimers();
  });
});
