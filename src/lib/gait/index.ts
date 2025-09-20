export * from '@/lib/fallRiskConfig';
export {
  GAIT_ANALYTICS_VERSION,
  gaitConfig,
  type GaitConfig,
} from '../gaitConfig';
export {
  computeMomentum,
  formatMomentumBadge,
  MOMENTUM_DOWNWARD_THRESHOLD,
  MOMENTUM_FALLBACK_RELATIVE,
  MOMENTUM_RELATIVE_SLOPE_NORMALIZER,
  MOMENTUM_UPWARD_THRESHOLD,
  momentumWeight,
  severityNumeric,
  type MomentumResult,
} from '../gaitMomentum';
export {
  classifySeverity,
  computeMultiMetricTrends,
  computeSingleMetricTrend,
  type TrendResult,
} from '../gaitTrends';
export type { GaitTrendForMomentumLike, GaitTrendMetric } from '../gaitTypes';
