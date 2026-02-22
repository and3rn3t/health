/**
 * Model drift detection pipeline
 *
 * Detects feature drift using Population Stability Index (PSI) and
 * integrates with the scheduler for periodic evaluation.
 *
 * PSI thresholds (industry standard):
 *   PSI < 0.1  → no significant drift (stable)
 *   0.1 ≤ PSI < 0.2 → moderate drift (warning)
 *   PSI ≥ 0.2  → significant drift (alert – consider retraining)
 */

import { scheduler, sendNotification, type NotificationConfig } from '@/lib/scheduling';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type DriftSeverity = 'stable' | 'warning' | 'critical';

export interface FeatureDriftMetric {
  feature: string;
  psi: number;
  severity: DriftSeverity;
}

export interface DriftAlert {
  modelId: string;
  modelVersion: string;
  evaluatedAt: string;
  overallPSI: number;
  severity: DriftSeverity;
  features: FeatureDriftMetric[];
  shouldRetrain: boolean;
  message: string;
}

export interface FeatureDistribution {
  /** Feature name */
  name: string;
  /** Binned counts or probabilities (reference/training distribution) */
  reference: number[];
  /** Binned counts or probabilities (current/production distribution) */
  current: number[];
}

// ---------------------------------------------------------------------------
// PSI computation
// ---------------------------------------------------------------------------

const PSI_WARNING = 0.1;
const PSI_CRITICAL = 0.2;
const PSI_EPSILON = 1e-6; // avoid log(0)

/**
 * Compute Population Stability Index for a single feature.
 *
 * @param reference - reference distribution (proportions or counts per bin)
 * @param current   - current distribution (proportions or counts per bin)
 * @returns PSI value ≥ 0
 */
export function computePSI(reference: number[], current: number[]): number {
  if (reference.length === 0 || reference.length !== current.length) {
    throw new Error('reference and current must be non-empty and equal-length arrays');
  }

  const refTotal = reference.reduce((s, v) => s + v, 0);
  const curTotal = current.reduce((s, v) => s + v, 0);

  if (refTotal <= 0 || curTotal <= 0) {
    throw new Error('distribution totals must be positive');
  }

  let psi = 0;
  for (let i = 0; i < reference.length; i++) {
    const p = Math.max(reference[i] / refTotal, PSI_EPSILON);
    const q = Math.max(current[i] / curTotal, PSI_EPSILON);
    psi += (q - p) * Math.log(q / p);
  }

  return psi;
}

/**
 * Classify PSI into a drift severity level.
 */
export function classifyDrift(psi: number): DriftSeverity {
  if (psi >= PSI_CRITICAL) return 'critical';
  if (psi >= PSI_WARNING) return 'warning';
  return 'stable';
}

// ---------------------------------------------------------------------------
// Drift evaluation
// ---------------------------------------------------------------------------

/**
 * Evaluate drift across all provided feature distributions.
 *
 * @param modelId      - registry model ID
 * @param modelVersion - version being evaluated
 * @param features     - feature distributions to compare
 * @returns DriftAlert summarising the evaluation
 */
export function evaluateModelDrift(
  modelId: string,
  modelVersion: string,
  features: FeatureDistribution[]
): DriftAlert {
  const evaluatedAt = new Date().toISOString();

  const featureMetrics: FeatureDriftMetric[] = features.map((f) => {
    const psi = computePSI(f.reference, f.current);
    return { feature: f.name, psi, severity: classifyDrift(psi) };
  });

  const overallPSI =
    featureMetrics.length > 0
      ? featureMetrics.reduce((s, m) => s + m.psi, 0) / featureMetrics.length
      : 0;

  const severity = classifyDrift(overallPSI);
  const shouldRetrain = severity === 'critical';

  const message =
    severity === 'stable'
      ? `Model ${modelId}@${modelVersion}: no significant drift detected (PSI=${overallPSI.toFixed(3)}).`
      : severity === 'warning'
        ? `Model ${modelId}@${modelVersion}: moderate drift detected (PSI=${overallPSI.toFixed(3)}). Monitor closely.`
        : `Model ${modelId}@${modelVersion}: significant drift detected (PSI=${overallPSI.toFixed(3)}). Retraining recommended.`;

  return {
    modelId,
    modelVersion,
    evaluatedAt,
    overallPSI,
    severity,
    features: featureMetrics,
    shouldRetrain,
    message,
  };
}

// ---------------------------------------------------------------------------
// Scheduled drift evaluation
// ---------------------------------------------------------------------------

export interface DriftScheduleOptions {
  /** Scheduler project-level grouping id */
  projectId: string;
  /** How often to run: 'daily' | 'weekly' */
  scheduleType: 'daily' | 'weekly';
  /** Notification config to call when drift is detected */
  notificationConfig?: NotificationConfig;
}

/**
 * Register a recurring drift-evaluation schedule via the existing Scheduler.
 * Returns the schedule id that can be used to cancel or inspect the schedule.
 */
export function scheduleDriftEval(
  modelId: string,
  modelVersion: string,
  options: DriftScheduleOptions
): string {
  const schedule = scheduler.createSchedule({
    projectId: options.projectId,
    analysisType: `model-drift:${modelId}`,
    scheduleType: options.scheduleType,
    enabled: true,
    metadata: { modelId, modelVersion },
  });

  return schedule.id;
}

/**
 * Run a drift evaluation job: evaluate drift, fire alerts if needed, and
 * record the job result in the scheduler.
 *
 * In production this would be called by the job runner when a drift-eval
 * schedule becomes due (see `scheduler.getDueSchedules()`).
 */
export async function runScheduledDriftEval(
  scheduleId: string,
  modelId: string,
  modelVersion: string,
  features: FeatureDistribution[],
  notificationConfig?: NotificationConfig
): Promise<DriftAlert> {
  const runAt = new Date().toISOString();
  const job = scheduler.createJob(scheduleId, runAt);

  try {
    scheduler.updateJobStatus(job.id, 'running');

    const alert = evaluateModelDrift(modelId, modelVersion, features);

    if (notificationConfig && alert.severity !== 'stable') {
      await sendNotification(notificationConfig, 'model-drift', {
        alert,
      });
    }

    scheduler.updateJobStatus(job.id, 'completed', alert);
    return alert;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    scheduler.updateJobStatus(job.id, 'failed', undefined, message);
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Retrain trigger helper
// ---------------------------------------------------------------------------

/**
 * Decide whether to trigger a retrain based on a drift alert.
 *
 * Retrain is recommended when:
 *   - Overall PSI ≥ 0.2 (critical severity), OR
 *   - Any individual feature has PSI ≥ 0.2
 *
 * @see docs/features/MODEL_DRIFT_DETECTION.md for full policy
 */
export function shouldTriggerRetrain(alert: DriftAlert): boolean {
  return (
    alert.severity === 'critical' ||
    alert.features.some((f) => f.severity === 'critical')
  );
}
