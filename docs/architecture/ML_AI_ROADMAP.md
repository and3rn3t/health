# VitalSense ML/AI Roadmap

Date: 2025-09-17

This document outlines practical, Workers-safe ML/AI features we can add to VitalSense to enhance fall/gait analytics, personalization, and real-time insights without heavy dependencies.

## 1) Feature Catalog (near-term → advanced)

- Fall Risk v1.1 (calibrated):
  - Replace hand-tuned weights with trained weights; add probability calibration (Platt or isotonic).
  - Confidence intervals via bootstrap ensembles.
- Time-series forecasting:
  - Health score, steps, steadiness: exponential smoothing or Holt–Winters (edge-safe) with fallback to linear trend.
  - Output next 7/30-day forecasts + confidence.
- Streaming anomaly detection:
  - EWMA + rolling z-score on steadiness, steps, HR; seasonal baselines offline.
  - Alert types: sudden drop, drift, missingness.
- Gait analytics v2:
  - Asymmetry index, cadence variability, turn detection, stride-interval CV, TUG proxy score.
  - Risk fusion: gait metrics → fall risk uplift with explainability.
- Recommendation policy (contextual bandits):
  - LinUCB/Thompson sampling to select interventions.
  - Feedback loop: capture compliance and outcome to learn policy online.
- Personalization & clustering:
  - K-means on normalized features (steps, steadiness, HRV, sleep) → persona buckets guiding copy/thresholds.
- Explainability & counterfactuals:
  - Perturbation-based SHAP-lite to rank feature contributions.
  - Counterfactual suggestions: “+15 min sleep → −X% risk.”
- Data quality & trust scoring:
  - Completeness, recency, reliability; per-metric trust gates to suppress noisy insights.
- Privacy-forward training (future):
  - Federated fine-tuning (FedAvg) for light models; DP clipping/noising; secure aggregation stubs.

## 2) Data contracts (input/outputs)

Input (ProcessedHealthData): metrics.walkingSteadiness, steps, sleepHours, heartRate; lastUpdated, dataQuality.

Outputs (common shape): score, probability (0..1), riskLevel, contributions, optional confidence, model metadata.

## 3) Edge-safe model choices

- Classification: logistic regression, gradient linear models.
- Forecasting: exponential smoothing (Holt–Winters), linear trend.
- Anomaly: EWMA, rolling median/IQR z-score.
- Bandits: LinUCB, Thompson (Bernoulli rewards).

## 4) Integration plan

- src/lib/ai/: models, features, inference, policies (later), validators.
- UI: AdvancedAnalytics (Decision Engine, Forecasts, Anomalies), MLAnalytics (unified charts).
- API (optional): Hono routes for predict/anomalies; WS for risk_update, anomaly_alert.

## 5) Evaluation & monitoring

- Offline: AUC/PR, Brier, calibration error; MAPE for forecasts.
- Online: alert precision/recall, action rates, outcome deltas.
- Drift: PSI/KS on features; retraining flag.

## 6) Privacy & safety

- No PII logging; aggregate only.
- Minimum data quality threshold for AI outcomes.
- Debounce and confirm critical alerts.

## 7) Milestones

- M1 (this week): calibrated fall risk, EWMA anomalies, 7-day forecast.
- M2 (2–3 weeks): gait v2, counterfactuals, basic bandit policy.
- M3 (4–6 weeks): personas, monitoring, retraining hooks.

## 8) Next steps

- Implement EWMA anomaly detector + Holt–Winters forecaster.
- Wire charts and optional server endpoints.
- Replace baseline fall risk weights with trained/calibrated set.

—
Focus: explainability, privacy, and small, fast models that run at the edge.
