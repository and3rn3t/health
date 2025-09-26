/**
 * Micro Coaching Rules
 * Lightweight, table-driven evaluation for real-time coaching messages.
 */
export interface CoachingContext {
  metric: string;
  value: number;
  now: number;
  lastValue?: number;
  recent?: Array<{ ts: number; value: number }>;
}

export interface CoachingRule {
  id: string;
  metric: string;
  condition: (ctx: CoachingContext) => boolean;
  severity: 'info' | 'warn' | 'critical';
  message: (ctx: CoachingContext) => string;
  cooldownSec: number;
  minIntervalSec?: number; // optional additional guard
}

// Helper factory conditions
const overThreshold = (threshold: number) => (ctx: CoachingContext) =>
  ctx.value >= threshold;
const deltaIncreasePct =
  (pct: number, minAbs = 0) =>
  (ctx: CoachingContext) => {
    if (ctx.lastValue == null) return false;
    const base = ctx.lastValue === 0 ? 0.00001 : ctx.lastValue;
    const change = ((ctx.value - ctx.lastValue) / base) * 100;
    return change >= pct && Math.abs(ctx.value - ctx.lastValue) >= minAbs;
  };

export const microCoachingRules: CoachingRule[] = [
  {
    id: 'posture-forward-warn',
    metric: 'posture_angle',
    condition: overThreshold(8),
    severity: 'info',
    message: () => 'Forward lean emerging — gently straighten upper torso.',
    cooldownSec: 120,
  },
  {
    id: 'posture-forward-critical',
    metric: 'posture_angle',
    condition: overThreshold(12),
    severity: 'warn',
    message: () =>
      'Significant forward lean detected — reset posture and pause briefly.',
    cooldownSec: 180,
  },
  {
    id: 'instability-spike',
    metric: 'instability_index',
    condition: deltaIncreasePct(40, 0.5),
    severity: 'warn',
    message: () => 'Instability spike — slow pace and tighten core alignment.',
    cooldownSec: 180,
  },
  {
    id: 'fall-risk-escalation',
    metric: 'fall_risk_score',
    condition: deltaIncreasePct(25, 1),
    severity: 'critical',
    message: () =>
      'Fall-risk rising quickly — consider resting or using support.',
    cooldownSec: 300,
  },
  // LiDAR – obstacle proximity (lower distance => higher risk)
  {
    id: 'lidar-obstacle-near-warn',
    metric: 'obstacle_distance_min',
    condition: (ctx) => ctx.value > 0 && ctx.value <= 1.2, // meters
    severity: 'warn',
    message: (ctx) =>
      `Obstacle within ${ctx.value.toFixed(2)}m — prepare to adjust path.`,
    cooldownSec: 90,
  },
  {
    id: 'lidar-obstacle-near-critical',
    metric: 'obstacle_distance_min',
    condition: (ctx) => ctx.value > 0 && ctx.value <= 0.6,
    severity: 'critical',
    message: (ctx) =>
      `Immediate obstacle (${ctx.value.toFixed(2)}m) — slow down or stop.`,
    cooldownSec: 150,
  },
  // Lateral deviation (path drift)
  {
    id: 'lidar-lateral-deviation-drift',
    metric: 'lateral_deviation_mean',
    condition: overThreshold(0.45), // meters
    severity: 'info',
    message: () => 'Path drift increasing — re-center your trajectory.',
    cooldownSec: 180,
  },
  // Surface roughness spike (trend-based) – treat >40% increase over last value
  {
    id: 'lidar-surface-roughness-spike',
    metric: 'surface_roughness',
    condition: deltaIncreasePct(40, 0.05),
    severity: 'warn',
    message: () => 'Surface getting uneven — shorten stride and stabilize.',
    cooldownSec: 240,
  },
];

export interface CoachingEvent {
  type: 'micro_coach';
  id: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  metric: string;
  value: number;
  ts: string;
  cooldownSec: number;
}

export class MicroCoachEngine {
  private lastValues = new Map<string, number>();
  private lastSent = new Map<string, number>();

  evaluate(
    metric: string,
    value: number,
    now: number = Date.now()
  ): CoachingEvent[] {
    const events: CoachingEvent[] = [];
    for (const rule of microCoachingRules) {
      if (rule.metric !== metric) continue;
      const lastVal = this.lastValues.get(metric);
      const ctx: CoachingContext = { metric, value, lastValue: lastVal, now };
      if (!rule.condition(ctx)) continue;
      const hasSentBefore = this.lastSent.has(rule.id);
      const lastSentAt = this.lastSent.get(rule.id) ?? 0;
      // Only enforce cooldown if rule fired previously (key exists)
      if (hasSentBefore && now - lastSentAt < rule.cooldownSec * 1000) continue;
      this.lastSent.set(rule.id, now);
      events.push({
        type: 'micro_coach',
        id: rule.id,
        severity: rule.severity,
        message: rule.message(ctx),
        metric,
        value,
        ts: new Date(now).toISOString(),
        cooldownSec: rule.cooldownSec,
      });
    }
    this.lastValues.set(metric, value);
    return events;
  }
}
