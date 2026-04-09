import type { LiveHealthMetric } from '@/lib/liveHealthDataSync';

// Config types for thresholds and weights
export type ThresholdDirection = 'low-is-bad' | 'high-is-bad';

export interface MetricThreshold {
  warn: number;
  critical: number;
  direction: ThresholdDirection;
}

export type InsightThresholds = Partial<
  Record<
    | 'gait_speed'
    | 'cadence'
    | 'stride_length'
    | 'step_asymmetry'
    | 'double_support_time'
    | 'posture_angle'
    | 'stability_index'
    | 'sway_balance'
    | 'walking_steadiness',
    MetricThreshold
  >
>;

export type InsightWeights = Partial<
  Record<
    | 'gait_speed'
    | 'stability_index'
    | 'double_support_time'
    | 'step_asymmetry'
    | 'sway_balance',
    number
  >
>;

export interface InsightConfig {
  thresholds?: InsightThresholds;
  weights?: InsightWeights;
}

export type InsightLevel = 'info' | 'warning' | 'critical';

export interface Insight {
  id: string;
  level: InsightLevel;
  title: string;
  message: string;
  metricType:
    | 'gait_speed'
    | 'cadence'
    | 'stride_length'
    | 'step_asymmetry'
    | 'double_support_time'
    | 'posture_angle'
    | 'stability_index'
    | 'sway_balance'
    | 'walking_steadiness'
    | 'composite_fall_risk';
  timestamp: string;
  confidence: number; // 0-1
  trend?: 'improving' | 'stable' | 'declining';
  evidence?: Record<string, unknown>;
}

export interface LiveInsightState {
  windows: Record<string, LiveHealthMetric[]>;
  insights: Insight[];
}

const MAX_WINDOW = 120; // keep last ~120 samples per metric

export function createInitialInsightState(): LiveInsightState {
  return { windows: {}, insights: [] };
}

function pushWindow(
  state: LiveInsightState,
  m: LiveHealthMetric
): LiveInsightState {
  const key = m.metricType;
  const arr = state.windows[key] ? [...state.windows[key]] : [];
  arr.push(m);
  if (arr.length > MAX_WINDOW) arr.shift();
  return { ...state, windows: { ...state.windows, [key]: arr } };
}

// Simple EWMA for smoothing
function ewma(values: number[], alpha = 0.3): number[] {
  if (values.length === 0) return [];
  const out: number[] = [values[0]!];
  for (let i = 1; i < values.length; i++) {
    out[i] = alpha * values[i]! + (1 - alpha) * out[i - 1]!;
  }
  return out;
}

// Simple slope over last N points (index as proxy for time)
function slope(values: number[]): number {
  const n = values.length;
  if (n < 2) return 0;
  const xMean = (n - 1) / 2;
  const yMean = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i]! - yMean);
    den += (i - xMean) * (i - xMean);
  }
  return den === 0 ? 0 : num / den;
}

function levelFromThresholds(
  value: number,
  warn: number,
  crit: number,
  direction: 'low-is-bad' | 'high-is-bad' = 'low-is-bad'
): InsightLevel | null {
  if (!Number.isFinite(value)) return null;
  if (direction === 'low-is-bad') {
    if (value <= crit) return 'critical';
    if (value <= warn) return 'warning';
    return null;
  }
  // high-is-bad
  if (value >= crit) return 'critical';
  if (value >= warn) return 'warning';
  return null;
}

function trendFromSlope(s: number, warn = 0.002, improve = -0.002) {
  if (s >= warn) return 'improving';
  if (s <= improve) return 'declining';
  return 'stable';
}

function coerceNum(v: unknown): number | null {
  if (typeof v === 'number') return v;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

// Helpers for latest value/window
function latestValue(state: LiveInsightState, key: string): number | null {
  const w = state.windows[key];
  const last = w && w.length ? w[w.length - 1] : undefined;
  return last ? coerceNum(last.value) : null;
}

function resolveThreshold(
  config: InsightConfig | undefined,
  key: keyof InsightThresholds,
  fallback: MetricThreshold
): MetricThreshold {
  const t = config?.thresholds?.[key];
  return t ?? fallback;
}

function gaitSpeedInsight(
  state: LiveInsightState,
  now: string,
  config?: InsightConfig
): Insight[] {
  const gs = latestValue(state, 'gait_speed');
  if (gs == null) return [];
  const th = resolveThreshold(config, 'gait_speed', {
    warn: 1.0,
    critical: 0.8,
    direction: 'low-is-bad',
  });
  const lvl = levelFromThresholds(gs, th.warn, th.critical, th.direction);
  if (!lvl) return [];
  const windowVals = (state.windows['gait_speed'] || []).map(
    (m) => coerceNum(m.value) ?? 0
  );
  const smoothed = ewma(windowVals);
  const s = slope(smoothed.slice(-20));
  const tr = trendFromSlope(s);
  return [
    {
      id: 'insight-gait-speed',
      level: lvl,
      title: 'Gait speed is below ideal range',
      message:
        gs <= th.critical
          ? 'Gait speed suggests elevated fall risk. Consider rest or stability exercises.'
          : 'Gait speed slightly reduced. Monitor and recheck during next walk.',
      metricType: 'gait_speed',
      timestamp: now,
      confidence: 0.8,
      trend: tr,
      evidence: { value: gs, thresholds: th },
    },
  ];
}

function stabilityIndexInsight(
  state: LiveInsightState,
  now: string,
  config?: InsightConfig
): Insight[] {
  const si = latestValue(state, 'stability_index');
  if (si == null) return [];
  const th = resolveThreshold(config, 'stability_index', {
    warn: 60,
    critical: 40,
    direction: 'low-is-bad',
  });
  const lvl = levelFromThresholds(si, th.warn, th.critical, th.direction);
  if (!lvl) return [];
  return [
    {
      id: 'insight-stability-index',
      level: lvl,
      title: 'Stability index indicates balance concerns',
      message:
        si < th.critical
          ? 'Balance is significantly reduced. Reduce activity and consider assistance.'
          : 'Balance is trending lower than recommended. Take caution on uneven surfaces.',
      metricType: 'stability_index',
      timestamp: now,
      confidence: 0.85,
      evidence: { value: si, thresholds: th },
    },
  ];
}

function stepAsymmetryInsight(
  state: LiveInsightState,
  now: string,
  config?: InsightConfig
): Insight[] {
  const sa = latestValue(state, 'step_asymmetry');
  if (sa == null) return [];
  const th = resolveThreshold(config, 'step_asymmetry', {
    warn: 4,
    critical: 10,
    direction: 'high-is-bad',
  });
  const lvl = levelFromThresholds(sa, th.warn, th.critical, th.direction);
  if (!lvl) return [];
  return [
    {
      id: 'insight-step-asymmetry',
      level: lvl,
      title: 'Step asymmetry elevated',
      message:
        sa >= th.critical
          ? 'Marked asymmetry in gait detected. Consider rest and evaluation.'
          : 'Notable asymmetry. Monitor for changes and avoid rapid turns.',
      metricType: 'step_asymmetry',
      timestamp: now,
      confidence: 0.75,
      evidence: { value: sa, thresholds: th },
    },
  ];
}

function doubleSupportInsight(
  state: LiveInsightState,
  now: string,
  config?: InsightConfig
): Insight[] {
  const dst = latestValue(state, 'double_support_time');
  if (dst == null) return [];
  const th = resolveThreshold(config, 'double_support_time', {
    warn: 30,
    critical: 40,
    direction: 'high-is-bad',
  });
  const lvl = levelFromThresholds(dst, th.warn, th.critical, th.direction);
  if (!lvl) return [];
  return [
    {
      id: 'insight-double-support',
      level: lvl,
      title: 'Double support time is high',
      message:
        dst >= th.critical
          ? 'Walking pattern suggests high caution. Use supports and avoid obstacles.'
          : 'Spending longer in double support. Consider slowing pace and focusing on posture.',
      metricType: 'double_support_time',
      timestamp: now,
      confidence: 0.7,
      evidence: { value: dst, thresholds: th },
    },
  ];
}

function postureAngleInsight(
  state: LiveInsightState,
  now: string,
  config?: InsightConfig
): Insight[] {
  const pa = latestValue(state, 'posture_angle');
  if (pa == null) return [];
  const th = resolveThreshold(config, 'posture_angle', {
    warn: 8,
    critical: 12,
    direction: 'high-is-bad',
  });
  const lvl = levelFromThresholds(pa, th.warn, th.critical, th.direction);
  if (!lvl) return [];
  return [
    {
      id: 'insight-posture-angle',
      level: lvl,
      title: 'Forward lean posture detected',
      message:
        pa >= th.critical
          ? 'Pronounced forward lean. Consider posture correction and rest.'
          : 'Forward lean present. Try small posture adjustments while walking.',
      metricType: 'posture_angle',
      timestamp: now,
      confidence: 0.7,
      evidence: { value: pa, thresholds: th },
    },
  ];
}

function swayBalanceInsight(
  state: LiveInsightState,
  now: string,
  config?: InsightConfig
): Insight[] {
  const sb = latestValue(state, 'sway_balance');
  if (sb == null) return [];
  const th = resolveThreshold(config, 'sway_balance', {
    warn: 1.5,
    critical: 2.5,
    direction: 'high-is-bad',
  });
  const lvl = levelFromThresholds(sb, th.warn, th.critical, th.direction);
  if (!lvl) return [];
  return [
    {
      id: 'insight-sway-balance',
      level: lvl,
      title: 'Increased sway detected',
      message:
        sb >= th.critical
          ? 'Significant sway. Avoid challenging terrain and consider assistance.'
          : 'Sway elevated. Slow down and ensure stable footing.',
      metricType: 'sway_balance',
      timestamp: now,
      confidence: 0.65,
      evidence: { value: sb, thresholds: th },
    },
  ];
}

function walkingSteadinessInsight(
  state: LiveInsightState,
  now: string,
  config?: InsightConfig
): Insight[] {
  const ws = latestValue(state, 'walking_steadiness');
  if (ws == null) return [];
  const th = resolveThreshold(config, 'walking_steadiness', {
    warn: 40,
    critical: 20,
    direction: 'low-is-bad',
  });
  const lvl = levelFromThresholds(ws, th.warn, th.critical, th.direction);
  if (!lvl) return [];
  return [
    {
      id: 'insight-walking-steadiness',
      level: lvl,
      title: 'Walking steadiness is low',
      message:
        ws <= th.critical
          ? 'Walking steadiness is critically low. Pause activity and rest.'
          : 'Walking steadiness is below ideal range. Take caution while moving.',
      metricType: 'walking_steadiness',
      timestamp: now,
      confidence: 0.8,
      evidence: { value: ws, thresholds: th },
    },
  ];
}

export interface CompositeScoreResult {
  risk: number; // 0..1, higher is worse
  mobilityScore: number; // 0..100, higher is better
  components: Record<string, number>; // per-metric normalized risk 0..1
}

function normalizedRisk(value: number | null, th: MetricThreshold): number {
  if (value == null || !Number.isFinite(value)) return 0;
  if (th.direction === 'low-is-bad') {
    if (value >= th.warn) return 0;
    if (value <= th.critical) return 1;
    return (th.warn - value) / (th.warn - th.critical);
  }
  // high-is-bad
  if (value <= th.warn) return 0;
  if (value >= th.critical) return 1;
  return (value - th.warn) / (th.critical - th.warn);
}

export function computeCompositeScore(
  state: LiveInsightState,
  config?: InsightConfig
): CompositeScoreResult {
  const thDefaults: InsightThresholds = {
    gait_speed: { warn: 1.0, critical: 0.8, direction: 'low-is-bad' },
    stability_index: { warn: 60, critical: 40, direction: 'low-is-bad' },
    double_support_time: { warn: 30, critical: 40, direction: 'high-is-bad' },
    step_asymmetry: { warn: 4, critical: 10, direction: 'high-is-bad' },
    sway_balance: { warn: 1.5, critical: 2.5, direction: 'high-is-bad' },
  };

  const weights: InsightWeights = {
    gait_speed: 0.35,
    stability_index: 0.3,
    double_support_time: 0.2,
    step_asymmetry: 0.1,
    sway_balance: 0.05,
    ...(config?.weights ?? {}),
  };

  // normalize weights to sum 1
  const sumW = Object.values(weights).reduce((a, b) => a + (b ?? 0), 0) || 1;
  const normWeights = Object.fromEntries(
    Object.entries(weights).map(([k, v]) => [k, (v ?? 0) / sumW])
  ) as InsightWeights;

  const getTh = (k: keyof InsightThresholds) =>
    resolveThreshold(config, k, thDefaults[k]!);

  const comps: Record<string, number> = {};
  (Object.keys(normWeights) as Array<keyof InsightWeights>).forEach((k) => {
    const key = k as string;
    const val = latestValue(state, key);
    const th = getTh(k as keyof InsightThresholds);
    comps[key] = normalizedRisk(val, th);
  });

  const risk = (Object.keys(normWeights) as Array<keyof InsightWeights>).reduce(
    (acc, k) => acc + normWeights[k]! * (comps[k as string] ?? 0),
    0
  );
  const mobilityScore = Math.round((1 - Math.max(0, Math.min(1, risk))) * 100);
  return { risk, mobilityScore, components: comps };
}

export function computeInsights(
  state: LiveInsightState,
  config?: InsightConfig
): Insight[] {
  const now = new Date().toISOString();
  const all = [
    ...gaitSpeedInsight(state, now, config),
    ...stabilityIndexInsight(state, now, config),
    ...stepAsymmetryInsight(state, now, config),
    ...doubleSupportInsight(state, now, config),
    ...postureAngleInsight(state, now, config),
    ...swayBalanceInsight(state, now, config),
    ...walkingSteadinessInsight(state, now, config),
  ];

  // Composite fall risk insight
  const composite = computeCompositeScore(state, config);
  let compositeLevel: InsightLevel | null = null;
  if (composite.risk >= 0.5) {
    compositeLevel = 'critical';
  } else if (composite.risk >= 0.3) {
    compositeLevel = 'warning';
  }
  if (compositeLevel) {
    all.push({
      id: 'insight-composite-fall-risk',
      level: compositeLevel,
      title:
        compositeLevel === 'critical'
          ? 'Elevated composite fall risk'
          : 'Composite fall risk trending higher',
      message:
        compositeLevel === 'critical'
          ? 'Multiple gait and stability indicators suggest high fall risk. Reduce activity and seek assistance.'
          : 'Several indicators are trending less favorable. Slow down and pay attention to posture and footing.',
      metricType: 'composite_fall_risk',
      timestamp: now,
      confidence: 0.85,
      evidence: {
        risk: Number(composite.risk.toFixed(3)),
        mobilityScore: composite.mobilityScore,
        components: composite.components,
      },
    });
  }

  // Rank and cap
  const ranked = all.sort((a, b) => {
    const order = { critical: 2, warning: 1, info: 0 } as const;
    return order[b.level] - order[a.level];
  });
  return ranked.slice(0, 5);
}

export function updateInsights(
  prev: LiveInsightState,
  metric: LiveHealthMetric,
  config?: InsightConfig
): LiveInsightState {
  if (typeof metric.value !== 'number' && Number.isNaN(Number(metric.value))) {
    return prev; // ignore non-numeric metrics
  }
  const next = pushWindow(prev, metric);
  return { ...next, insights: computeInsights(next, config) };
}

// Convenience: compute composite score from an arbitrary metrics array
export function computeCompositeFromMetrics(
  metrics: LiveHealthMetric[],
  config?: InsightConfig
): CompositeScoreResult {
  let state = createInitialInsightState();
  for (const m of metrics) {
    if (typeof m.value === 'number' || !Number.isNaN(Number(m.value))) {
      state = pushWindow(state, m);
    }
  }
  return computeCompositeScore(state, config);
}
