/**
 * Momentum scoring for multi-metric gait trends.
 *
 * Inputs are trend metrics each with a severity classification, confidence, and relativeSlope.
 * Weighted severity scores yield an aggregate score in roughly the range -3..3 which is then
 * normalized into an Upward / Stable / Downward classification.
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

export interface GaitTrendForMomentum {
  severity?: GaitTrendSeverity;
  confidence: number | null; // 0..1 or null if not computed
  relativeSlope?: number | null; // normalized magnitude proxy
}

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
  const rel = m.relativeSlope == null ? null : m.relativeSlope;
  const relNorm = rel == null ? 0.5 : Math.min(1, rel / 0.05);
  return conf * relNorm;
}

/** Compute aggregate momentum result from a record of trend metrics. */
export function computeMomentum(
  trends: Record<string, GaitTrendForMomentum> | undefined | null
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
  if (score > 0.6) classification = 'Upward';
  else if (score < -0.6) classification = 'Downward';
  else classification = 'Stable';
  return {
    score,
    classification,
    totalWeight: total,
    contributing: entries.length,
  };
}
