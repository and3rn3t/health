import type { ModelWeights } from './models/fallRiskModel';

export interface FeatureVector {
  // dynamic feature bag; numbers only
  [name: string]: number;
}

export interface InferenceInput<TMeta = unknown> {
  features: FeatureVector;
  model: ModelWeights;
  meta?: TMeta;
}

export interface InferenceResult {
  score: number; // raw logit
  probability: number; // 0..1
  riskLevel: 'low' | 'moderate' | 'high';
  contributions: Array<{
    feature: string;
    weight: number;
    value: number;
    contribution: number;
  }>;
}

export function sigmoid(x: number): number {
  // stable sigmoid
  if (x >= 0) {
    const z = Math.exp(-x);
    return 1 / (1 + z);
  } else {
    const z = Math.exp(x);
    return z / (1 + z);
  }
}

export function logisticPredict({
  features,
  model,
}: InferenceInput): InferenceResult {
  let logit = model.bias;
  const contributions: InferenceResult['contributions'] = [];

  for (const [name, value] of Object.entries(features)) {
    // skip unknown weights silently to allow forward-compat features
    const weight = (model.weights as Record<string, number>)[name] ?? 0;
    const c = weight * value;
    logit += c;
    contributions.push({ feature: name, weight, value, contribution: c });
  }

  const probability = sigmoid(logit);
  let riskLevel: InferenceResult['riskLevel'];
  if (probability >= 0.7) {
    riskLevel = 'high';
  } else if (probability >= 0.4) {
    riskLevel = 'moderate';
  } else {
    riskLevel = 'low';
  }
  // sort contributions by absolute impact
  contributions.sort(
    (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
  );

  return { score: logit, probability, riskLevel, contributions };
}

export function normalize(value: number, min: number, max: number): number {
  if (max === min) return 0;
  return (value - min) / (max - min);
}
