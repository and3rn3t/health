/**
 * Momentum scoring for multi-metric gait trends.
 *
 * Inputs are trend metrics each with a severity classification, confidence, and relativeSlope.
 * Weighted severity scores yield an aggregate score in roughly the range -3..3 which is then
 * normalized into an Upward / Stable / Downward classification.
 */
// Centralized configuration for gait analytics
import { gaitConfig } from './gaitConfig';
import type { GaitTrendForMomentumLike } from './gaitTypes';
export const MOMENTUM_RELATIVE_SLOPE_NORMALIZER =
  gaitConfig.momentum.relativeSlopeNormalizer;
export const MOMENTUM_FALLBACK_RELATIVE = gaitConfig.momentum.fallbackRelative;
export const MOMENTUM_UPWARD_THRESHOLD = gaitConfig.momentum.upwardThreshold;
export const MOMENTUM_DOWNWARD_THRESHOLD =
  gaitConfig.momentum.downwardThreshold;

/**
 * Threshold & weighting rationale:
 * - relativeSlope normalization (0.05) was chosen so typical mild gait changes (≤0.02) yield partial weights (≤0.4)
 *   while pronounced shifts ≥0.05 saturate contribution.
 * - fallback relativeSlope 0.5 grants medium influence to a metric with confidence but missing relative magnitude.
 * - momentum score range nominally spans -3..3 (severity numeric mapping) but usually compresses toward 0 when
 *   conflicting signals appear; thresholds ±0.6 provide a buffer so minor mixed improvements/declines remain Stable.
 *
 * Tuning guidance:
 * - To make classification more sensitive: lower UP/DOWN thresholds (e.g. 0.45 / -0.45).
 * - To emphasize magnitude over confidence: increase MOMENTUM_FALLBACK_RELATIVE or raise normalization divisor.
 * - To require stronger consensus: raise thresholds or require minimum contributing metrics before classification.
 */
export type GaitTrendSeverity =
  | 'strong_improvement'
  | 'moderate_improvement'
  | 'mild_improvement'
  | 'stable'
  | 'mild_decline'
  | 'moderate_decline'
  | 'strong_decline'
  | 'insufficient_data';

export type GaitTrendForMomentum = GaitTrendForMomentumLike;

export interface MomentumResult {
  score: number; // weighted average severity score
  classification: 'Upward' | 'Stable' | 'Downward';
  totalWeight: number; // aggregate weight used (debug/inspection)
  contributing: number; // number of metrics counted
}

// Numerical mapping of severity buckets used for weighting.
export function severityNumeric(sev: GaitTrendSeverity | undefined): number {
  switch (sev) {
    case 'strong_improvement':
      return 3;
    case 'moderate_improvement':
      return 2;
    case 'mild_improvement':
      return 1;
    case 'stable':
      return 0;
    case 'mild_decline':
      return -1;
    case 'moderate_decline':
      return -2;
    case 'strong_decline':
      return -3;
    default:
      return 0; // treat insufficient_data or undefined as neutral
  }
}

/** Weight function replicating panel logic: confidence * normalizedRelativeSlope.
 * If relativeSlope is missing, fall back to 0.5 (mid baseline) so high confidence still contributes.
 * relativeSlope is normalized by dividing by 0.05 and capped at 1.
 */
export function momentumWeight(m: GaitTrendForMomentum): number {
  const conf = m.confidence ?? 0;
  const rel = m.relativeSlope; // undefined/null treated the same
  const relNorm =
    rel == null
      ? MOMENTUM_FALLBACK_RELATIVE
      : Math.min(1, rel / MOMENTUM_RELATIVE_SLOPE_NORMALIZER);
  return conf * relNorm;
}

/** Compute aggregate momentum result from a record of trend metrics. */
export function computeMomentum(
  trends: Record<string, GaitTrendForMomentumLike> | undefined | null
): MomentumResult | null {
  if (!trends) return null;
  const entries = Object.values(trends).filter(
    (t) => t.severity && t.confidence != null
  );
  if (!entries.length) return null;
  let weighted = 0;
  let total = 0;
  for (const t of entries) {
    const w = momentumWeight(t);
    if (w <= 0) continue; // skip zero/negative weights
    total += w;
    weighted += severityNumeric(t.severity) * w;
  }
  if (total === 0) return null;
  const score = weighted / total;
  let classification: MomentumResult['classification'];
  if (score > MOMENTUM_UPWARD_THRESHOLD) classification = 'Upward';
  else if (score < MOMENTUM_DOWNWARD_THRESHOLD) classification = 'Downward';
  else classification = 'Stable';
  return {
    score,
    classification,
    totalWeight: total,
    contributing: entries.length,
  };
}

/** Helper to format badge label + title consistently for UI components. */
export function formatMomentumBadge(result: MomentumResult | null): {
  label: string;
  title: string | undefined;
} {
  if (!result) return { label: '—', title: undefined };
  return {
    label: result.classification,
    title: `Momentum score ${result.score.toFixed(2)} (${result.classification})`,
  };
}
