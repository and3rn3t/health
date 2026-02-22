# Model Drift Detection Pipeline

## Overview

The model drift detection pipeline monitors production ML models (e.g. the fall-risk predictor) for distributional shifts between the data seen at training time and the data arriving in production. When significant drift is detected the pipeline emits an alert and – when the drift crosses the critical threshold – recommends retraining.

---

## How It Works

### 1. Feature drift measurement – Population Stability Index (PSI)

For each input feature the pipeline computes the **Population Stability Index (PSI)**:

```
PSI = Σ (Q_i − P_i) × ln(Q_i / P_i)
```

where *P_i* is the reference (training) proportion in bin *i* and *Q_i* is the current (production) proportion.

| PSI range | Interpretation | Action |
|-----------|---------------|--------|
| < 0.10 | No significant change | No action |
| 0.10 – 0.19 | Moderate change | Monitor; schedule extra evaluations |
| ≥ 0.20 | Significant change | **Trigger retraining review** |

### 2. Scheduled evaluation

Drift evaluations are registered with the existing `Scheduler` via `scheduleDriftEval()`. Evaluations can run on a `'daily'` or `'weekly'` cadence (configured per model). When a scheduled slot becomes due:

1. `scheduler.getDueSchedules()` surfaces the schedule.
2. The job runner calls `runScheduledDriftEval()` with the latest feature distributions.
3. `evaluateModelDrift()` computes per-feature PSI values and an overall (mean) PSI.
4. A `DriftAlert` is returned and the job result is persisted via `scheduler.updateJobStatus()`.

### 3. Alert on drift

When `severity !== 'stable'` a notification is dispatched through `sendNotification()` (the same webhook/email system used by the rest of the platform). The `DriftAlert` payload includes:

- `modelId` / `modelVersion` – which model was evaluated
- `overallPSI` – mean PSI across all features
- `severity` – `'stable' | 'warning' | 'critical'`
- `features` – per-feature PSI and severity
- `shouldRetrain` – `true` when retraining is recommended
- `message` – human-readable summary

---

## Retrain Trigger Policy

Retraining is **recommended** when **either** of the following conditions is met:

1. **Overall PSI ≥ 0.20** – the aggregate distribution of all monitored features has shifted significantly.
2. **Any individual feature PSI ≥ 0.20** – a single feature that is important to the model (e.g. `walkingSteadiness_avg`, `steps_avg`) shows a critical shift.

Use `shouldTriggerRetrain(alert)` to check programmatically.

### Recommended retraining workflow

```
Drift alert (critical)
    └─► Open retrain ticket / CI trigger
        └─► Re-collect labelled data from last N weeks
            └─► Retrain model with updated weights
                └─► Validate AUC, Brier score, calibration vs. baseline
                    └─► If metrics pass → update model-registry → deploy
                        └─► Reset reference distributions → resume drift monitoring
```

### Warning-severity actions

A `'warning'` result does **not** trigger automatic retraining, but should:

- Increase evaluation frequency (e.g. switch from weekly → daily).
- Alert on-call ML engineer for investigation.
- Check upstream data pipelines for quality issues (missing data, sensor changes).

---

## API Reference

```ts
// Compute PSI for a single feature
computePSI(reference: number[], current: number[]): number

// Classify PSI into a severity level
classifyDrift(psi: number): 'stable' | 'warning' | 'critical'

// Full drift evaluation across all features
evaluateModelDrift(
  modelId: string,
  modelVersion: string,
  features: FeatureDistribution[]
): DriftAlert

// Register a recurring drift-eval schedule
scheduleDriftEval(modelId, modelVersion, options): scheduleId

// Run one drift-eval job (called by the job runner)
runScheduledDriftEval(
  scheduleId, modelId, modelVersion,
  features, notificationConfig?
): Promise<DriftAlert>

// Decide whether to trigger retraining
shouldTriggerRetrain(alert: DriftAlert): boolean
```

---

## Example

```ts
import { scheduleDriftEval, runScheduledDriftEval } from '@/lib/ai/drift/modelDrift';

// Register a daily evaluation for the fall-risk model
const scheduleId = scheduleDriftEval('fall-risk', 'v0.1-baseline', {
  projectId: 'vitalsense-prod',
  scheduleType: 'daily',
  notificationConfig: {
    webhooks: [{ url: process.env.DRIFT_WEBHOOK_URL!, events: ['*'] }],
  },
});

// When the job runner fires this schedule:
const alert = await runScheduledDriftEval(
  scheduleId,
  'fall-risk',
  'v0.1-baseline',
  currentFeatureDistributions,   // obtained from production telemetry
  notificationConfig
);

if (alert.shouldRetrain) {
  console.log('Retraining recommended:', alert.message);
}
```

---

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/ai/drift/modelDrift.ts` | Core drift detection implementation |
| `src/lib/model-registry.ts` | Model versioning and metadata |
| `src/lib/scheduling.ts` | Scheduler used for periodic evaluations |
| `src/lib/ai/anomaly/ewma.ts` | EWMA anomaly detection (complementary) |
| `src/lib/ai/features/fallRiskFeatures.ts` | Fall-risk feature extraction |
| `src/lib/__tests__/modelDrift.test.ts` | Unit tests |
