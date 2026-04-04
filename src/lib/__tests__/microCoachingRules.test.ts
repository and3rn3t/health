import { describe, expect, it } from 'vitest';
import {
  MicroCoachEngine,
  microCoachingRules,
} from '../coaching/microCoachingRules';

describe('MicroCoachEngine', () => {
  it('emits posture forward warn at threshold 8 and not below', () => {
    const engine = new MicroCoachEngine();
    // Below threshold
    let events = engine.evaluate('posture_angle', 7, 1000);
    expect(events.length).toBe(0);
    // At threshold
    events = engine.evaluate('posture_angle', 8, 2000);
    expect(events.some((e) => e.id === 'posture-forward-warn')).toBe(true);
  });

  it('emits both warn and critical when posture angle jumps directly to 12+', () => {
    const engine = new MicroCoachEngine();
    const events = engine.evaluate('posture_angle', 12, 1000);
    // Because rules are independent, both should trigger simultaneously
    const ids = events.map((e) => e.id);
    expect(ids).toContain('posture-forward-warn');
    expect(ids).toContain('posture-forward-critical');
  });

  it('respects per-rule cooldowns', () => {
    const engine = new MicroCoachEngine();
    let events = engine.evaluate('posture_angle', 9, 0);
    expect(events.find((e) => e.id === 'posture-forward-warn')).toBeTruthy();
    // Same metric again within cooldown window → no new warn event
    events = engine.evaluate('posture_angle', 10, 30 * 1000); // 30s later (<120s cooldown)
    expect(events.find((e) => e.id === 'posture-forward-warn')).toBeFalsy();
    // After cooldown
    events = engine.evaluate('posture_angle', 10, 130 * 1000); // >120s
    expect(events.find((e) => e.id === 'posture-forward-warn')).toBeTruthy();
  });

  it('instability spike rule triggers only after prior value for delta comparison', () => {
    const engine = new MicroCoachEngine();
    // First value establishes baseline, should NOT fire (no lastValue)
    let events = engine.evaluate('instability_index', 1.0, 0);
    expect(events.length).toBe(0);
    // 50% spike (from 1.0 -> 1.6) should trigger (>=40% & abs delta >=0.5)
    events = engine.evaluate('instability_index', 1.6, 10_000);
    expect(events.some((e) => e.id === 'instability-spike')).toBe(true);
  });

  it('fall risk escalation needs prior value and sufficient pct + abs delta', () => {
    const engine = new MicroCoachEngine();
    let events = engine.evaluate('fall_risk_score', 3, 0);
    expect(events.length).toBe(0);
    // Increase 3 -> 3.5 (delta 0.5, ~16.6%) below 25% threshold
    events = engine.evaluate('fall_risk_score', 3.5, 5_000);
    expect(events.some((e) => e.id === 'fall-risk-escalation')).toBe(false);
    // Increase 3.5 -> 4.6 (~31%) and abs 1.1 satisfies both
    events = engine.evaluate('fall_risk_score', 4.6, 10_000);
    expect(events.some((e) => e.id === 'fall-risk-escalation')).toBe(true);
  });

  it('does not emit events for unrelated metrics', () => {
    const engine = new MicroCoachEngine();
    const events = engine.evaluate('some_other_metric', 999, Date.now());
    expect(events.length).toBe(0);
  });

  it('rule metadata (ids) stays stable', () => {
    // Guardrail: if rule IDs change unintentionally this test will flag it.
    const ids = microCoachingRules.map((r) => r.id).sort();
    expect(ids).toEqual(
      [
        'fall-risk-escalation',
        'instability-spike',
        'lidar-lateral-deviation-drift',
        'lidar-obstacle-near-critical',
        'lidar-obstacle-near-warn',
        'lidar-surface-roughness-spike',
        'posture-forward-critical',
        'posture-forward-warn',
      ].sort()
    );
  });
});
