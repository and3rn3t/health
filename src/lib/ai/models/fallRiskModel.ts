export type FeatureName =
  | 'walkingSteadiness_avg'
  | 'walkingSteadiness_var'
  | 'steps_avg'
  | 'sleepHours_avg'
  | 'heartRate_avg'
  | 'bias';

export interface ModelWeights {
  weights: Record<Exclude<FeatureName, 'bias'>, number>;
  bias: number;
  version: string;
  trainedAt: string;
}

// Tiny baseline model (hand-tuned; replace with trained weights when available)
export const fallRiskModel: ModelWeights = {
  version: 'v0.1-baseline',
  trainedAt: '2025-09-17T00:00:00Z',
  // Negative weight for steadiness (higher steadiness lowers risk),
  // positive for variability and heart rate, mild negative for steps and sleep
  weights: {
    walkingSteadiness_avg: -0.045,
    walkingSteadiness_var: 0.03,
    steps_avg: -0.00005,
    sleepHours_avg: -0.12,
    heartRate_avg: 0.015,
  },
  bias: -0.5,
};
