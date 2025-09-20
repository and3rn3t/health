/** Shared gait analytics types to unify momentum + trend panel usage. */
import type { GaitTrendSeverity } from './gaitMomentum';

export interface GaitTrendMetric {
  severity?: GaitTrendSeverity;
  confidence: number | null;
  relativeSlope?: number | null;
  slope?: number | null;
  direction?: 'improving' | 'stable' | 'declining' | null;
  sampleCount?: number;
}

/** Minimal subset required by momentum computation (re-export for convenience). */
export type GaitTrendForMomentumLike = Pick<
  GaitTrendMetric,
  'severity' | 'confidence' | 'relativeSlope'
>;
