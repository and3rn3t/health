import { describe, expect, it } from 'vitest';
import { MicroCoachEngine, microCoachingRules } from '../microCoachingRules';

// Helper to find rule by id quickly
const ruleIds = new Set(microCoachingRules.map((r) => r.id));

describe('LiDAR Micro Coaching Rules', () => {
  it('includes expected LiDAR rule ids', () => {
    for (const id of [
      'lidar-obstacle-near-warn',
      'lidar-obstacle-near-critical',
      'lidar-lateral-deviation-drift',
      'lidar-surface-roughness-spike',
    ]) {
      expect(ruleIds.has(id)).toBe(true);
    }
  });

  it('fires obstacle near warn and respects cooldown', () => {
    const eng = new MicroCoachEngine();
    const now = Date.now();
    let ev = eng.evaluate('obstacle_distance_min', 1.0, now);
    expect(ev.find((e) => e.id === 'lidar-obstacle-near-warn')).toBeTruthy();
    // Within cooldown
    ev = eng.evaluate('obstacle_distance_min', 0.9, now + 30_000);
    expect(ev.find((e) => e.id === 'lidar-obstacle-near-warn')).toBeFalsy();
    // After cooldown
    ev = eng.evaluate('obstacle_distance_min', 0.8, now + 120_000);
    expect(ev.find((e) => e.id === 'lidar-obstacle-near-warn')).toBeTruthy();
  });

  it('fires roughness spike on delta increase', () => {
    const eng = new MicroCoachEngine();
    const now = Date.now();
    eng.evaluate('surface_roughness', 0.1, now);
    const ev = eng.evaluate('surface_roughness', 0.16, now + 10_000); // 60% increase
    expect(
      ev.find((e) => e.id === 'lidar-surface-roughness-spike')
    ).toBeTruthy();
  });
});
