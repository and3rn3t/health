import type { AnalyticsHealthData as ProcessedHealthData } from '@/lib/healthDataProcessor';
import { logisticPredict, type InferenceResult } from '../inference';
import { fallRiskModel } from '../models/fallRiskModel';

export interface FallRiskPrediction extends InferenceResult {
  modelVersion: string;
  inputs: {
    walkingSteadiness_avg: number;
    walkingSteadiness_var: number;
    steps_avg: number;
    sleepHours_avg: number;
    heartRate_avg: number;
  };
}

export function buildFallRiskFeatures(data: ProcessedHealthData) {
  const ws = data.metrics.walkingSteadiness;
  const steps = data.metrics.steps;
  const sleep = data.metrics.sleepHours;
  const hr = data.metrics.heartRate;

  const features = {
    walkingSteadiness_avg: (ws?.average ?? 0) / 100, // normalize 0..1
    walkingSteadiness_var: Math.min(1, (ws?.variability ?? 0) / 100),
    steps_avg: Math.min(1, (steps?.average ?? 0) / 15000),
    sleepHours_avg: Math.min(1, (sleep?.average ?? 0) / 9),
    heartRate_avg: Math.min(1, Math.max(0, ((hr?.average ?? 0) - 40) / 80)), // 40..120 bpm window
  } as const;

  return features;
}

export function predictFallRisk(data: ProcessedHealthData): FallRiskPrediction {
  const features = buildFallRiskFeatures(data);
  const result = logisticPredict({ features, model: fallRiskModel });
  return {
    ...result,
    modelVersion: fallRiskModel.version,
    inputs: features,
  };
}
