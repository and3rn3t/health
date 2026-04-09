// Gait trend analytics logic extracted from worker for reuse & testing.
// Pure functions only; no side effects or platform APIs.
import { gaitConfig } from './gaitConfig';

export type TrendDir = 'improving' | 'stable' | 'declining' | null;

export interface TrendResult {
  direction: TrendDir;
  slope: number | null;
  confidence: number | null;
  sampleCount: number;
  relativeSlope?: number | null; // |slope| / mean for magnitude context
  severity?:
    | 'strong_improvement'
    | 'moderate_improvement'
    | 'mild_improvement'
    | 'stable'
    | 'mild_decline'
    | 'moderate_decline'
    | 'strong_decline'
    | 'insufficient_data';
}

export function computeSingleMetricTrend(values: number[]): TrendResult {
  if (values.length < 3)
    return {
      direction: null,
      slope: null,
      confidence: null,
      sampleCount: values.length,
      relativeSlope: null,
      severity: 'insufficient_data',
    };
  const n = values.length;
  const meanX = (n - 1) / 2;
  const meanY = values.reduce((a, b) => a + b, 0) / n;
  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    const dx = i - meanX;
    num += dx * (values[i]! - meanY);
    den += dx * dx;
  }
  const slope = den === 0 ? 0 : num / den;
  const rel = meanY === 0 ? 0 : Math.abs(slope) / (Math.abs(meanY) || 1);
  let direction: TrendDir;
  const stabilityThreshold = gaitConfig.stabilityRelativeSlopeThreshold; // centralized
  if (rel < stabilityThreshold) direction = 'stable';
  else if (slope > 0) direction = 'improving';
  else direction = 'declining';
  const confidence = Math.min(1, rel / 0.05);
  return { direction, slope, confidence, sampleCount: n, relativeSlope: rel };
}

export function classifySeverity(tr: TrendResult): TrendResult {
  if (
    tr.direction == null ||
    tr.slope == null ||
    tr.confidence == null ||
    tr.relativeSlope == null ||
    tr.sampleCount < 3 ||
    tr.confidence < gaitConfig.minimumConfidence
  ) {
    return { ...tr, severity: 'insufficient_data' };
  }
  if (tr.direction === 'stable') return { ...tr, severity: 'stable' };
  const rel = tr.relativeSlope;
  let magnitude: 'mild' | 'moderate' | 'strong';
  if (rel >= gaitConfig.magnitude.strong) magnitude = 'strong';
  else if (rel >= gaitConfig.magnitude.moderate) magnitude = 'moderate';
  else magnitude = 'mild';
  const prefix =
    magnitude +
    '_' +
    (tr.direction === 'improving' ? 'improvement' : 'decline');
  const severity = prefix as TrendResult['severity'];
  return { ...tr, severity };
}

export interface BasicGaitSnapshot {
  speed?: number; // meters/sec
  stepFrequency?: number; // steps/min
  asymmetry?: number; // percentage or ratio
  variability?: number; // coefficient of variation etc.
}

export function computeMultiMetricTrends(snapshots: BasicGaitSnapshot[]) {
  const metricExtractors: Record<
    string,
    (s: BasicGaitSnapshot) => number | undefined
  > = {
    speed: (s) => (typeof s.speed === 'number' ? s.speed : undefined),
    cadence: (s) =>
      typeof s.stepFrequency === 'number' ? s.stepFrequency : undefined,
    asymmetry: (s) =>
      typeof s.asymmetry === 'number' ? s.asymmetry : undefined,
    variability: (s) =>
      typeof s.variability === 'number' ? s.variability : undefined,
  };
  const betterWhenHigher: Record<string, boolean> = {
    speed: true,
    cadence: true,
    asymmetry: false,
    variability: false,
  };
  const trends: Record<string, TrendResult> = {};
  for (const key of Object.keys(metricExtractors)) {
    const series = snapshots
      .map(metricExtractors[key]!)
      .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
    let base = computeSingleMetricTrend(series);
    if (
      base.direction &&
      !betterWhenHigher[key] &&
      base.direction !== 'stable'
    ) {
      base = {
        ...base,
        direction: base.direction === 'improving' ? 'declining' : 'improving',
      };
    }
    base = classifySeverity(base);
    trends[key] = base;
  }
  return trends;
}
