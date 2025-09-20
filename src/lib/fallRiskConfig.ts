/**
 * Centralized fall risk analytics configuration.
 * Mirrors the approach used for `gaitConfig` to enable:
 *  - Single source of truth for thresholds & weights
 *  - Cross-language parity (future Swift artifact generation)
 *  - Deterministic version hash for integrity / drift detection
 */
export const fallRiskConfig = {
  walkingSteadiness: {
    // Threshold values (value < threshold) for adding risk points
    criticalThreshold: 25, // adds criticalPoints
    highThreshold: 50, // adds highPoints
    moderateThreshold: 75, // adds moderatePoints
    points: {
      critical: 40,
      high: 20,
      moderate: 10,
    },
  },
  riskScoreClassification: {
    critical: 60,
    high: 40,
    moderate: 20,
  },
  modelScoreThresholds: {
    severe: 0.8,
    high: 0.6,
    moderate: 0.4,
    confidenceAdjustmentFactor: 0.1, // (1 - confidence) * factor
  },
  aggregationWeights: {
    fallEvent: 15, // aggregateHealthRecords fall_event contribution
    state: {
      high: 10, // when record has fallRisk === 'high'
      critical: 25, // when record has fallRisk === 'critical'
    },
  },
} as const;
export type FallRiskConfig = typeof fallRiskConfig;

function hashConfig(obj: unknown): string {
  const json = JSON.stringify(obj);
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    h = (h >>> 0) * 0x01000193; // FNV-1a prime multiplication
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

export const FALL_RISK_ANALYTICS_VERSION = hashConfig(fallRiskConfig);
