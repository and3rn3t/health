import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  computePSI,
  classifyDrift,
  evaluateModelDrift,
  scheduleDriftEval,
  runScheduledDriftEval,
  shouldTriggerRetrain,
  type FeatureDistribution,
} from '@/lib/ai/drift/modelDrift';
import { scheduler } from '@/lib/scheduling';

// ---------------------------------------------------------------------------
// computePSI
// ---------------------------------------------------------------------------

describe('computePSI', () => {
  test('returns 0 for identical distributions', () => {
    const dist = [10, 20, 30, 25, 15];
    expect(computePSI(dist, dist)).toBeCloseTo(0, 5);
  });

  test('returns positive value when distributions differ', () => {
    const ref = [20, 20, 20, 20, 20];
    const cur = [40, 10, 10, 30, 10];
    expect(computePSI(ref, cur)).toBeGreaterThan(0);
  });

  test('throws when arrays have different lengths', () => {
    expect(() => computePSI([1, 2], [1, 2, 3])).toThrow();
  });

  test('throws when arrays are empty', () => {
    expect(() => computePSI([], [])).toThrow();
  });

  test('throws when reference total is zero', () => {
    expect(() => computePSI([0, 0], [1, 1])).toThrow();
  });

  test('works with unnormalised counts', () => {
    // same proportions expressed as different scale → PSI ≈ 0
    const ref = [100, 200, 300];
    const cur = [10, 20, 30];
    expect(computePSI(ref, cur)).toBeCloseTo(0, 4);
  });
});

// ---------------------------------------------------------------------------
// classifyDrift
// ---------------------------------------------------------------------------

describe('classifyDrift', () => {
  test('stable for PSI below 0.1', () => {
    expect(classifyDrift(0)).toBe('stable');
    expect(classifyDrift(0.05)).toBe('stable');
    expect(classifyDrift(0.099)).toBe('stable');
  });

  test('warning for PSI in [0.1, 0.2)', () => {
    expect(classifyDrift(0.1)).toBe('warning');
    expect(classifyDrift(0.15)).toBe('warning');
    expect(classifyDrift(0.199)).toBe('warning');
  });

  test('critical for PSI >= 0.2', () => {
    expect(classifyDrift(0.2)).toBe('critical');
    expect(classifyDrift(0.5)).toBe('critical');
    expect(classifyDrift(1.0)).toBe('critical');
  });
});

// ---------------------------------------------------------------------------
// evaluateModelDrift
// ---------------------------------------------------------------------------

describe('evaluateModelDrift', () => {
  const stableDist: FeatureDistribution[] = [
    { name: 'steps_avg', reference: [10, 20, 30], current: [10, 20, 30] },
    { name: 'heartRate_avg', reference: [5, 15, 30], current: [5, 15, 30] },
  ];

  const driftedDist: FeatureDistribution[] = [
    { name: 'steps_avg', reference: [10, 10, 10, 10, 10], current: [40, 2, 2, 2, 4] },
    { name: 'heartRate_avg', reference: [10, 10, 10, 10, 10], current: [1, 1, 1, 1, 46] },
  ];

  test('returns stable report when distributions match', () => {
    const report = evaluateModelDrift('fall-risk', 'v0.1', stableDist);
    expect(report.modelId).toBe('fall-risk');
    expect(report.modelVersion).toBe('v0.1');
    expect(report.severity).toBe('stable');
    expect(report.shouldRetrain).toBe(false);
    expect(report.features).toHaveLength(2);
    expect(report.evaluatedAt).toBeDefined();
  });

  test('returns critical report when distributions diverge significantly', () => {
    const report = evaluateModelDrift('fall-risk', 'v0.1', driftedDist);
    expect(report.severity).toBe('critical');
    expect(report.shouldRetrain).toBe(true);
    expect(report.overallPSI).toBeGreaterThan(0.2);
  });

  test('message contains model id and version', () => {
    const report = evaluateModelDrift('my-model', 'v2.3', stableDist);
    expect(report.message).toContain('my-model');
    expect(report.message).toContain('v2.3');
  });

  test('handles empty feature list gracefully', () => {
    const report = evaluateModelDrift('fall-risk', 'v0.1', []);
    expect(report.overallPSI).toBe(0);
    expect(report.severity).toBe('stable');
    expect(report.features).toHaveLength(0);
  });

  test('feature-level drift metrics are included in report', () => {
    const report = evaluateModelDrift('fall-risk', 'v0.1', driftedDist);
    for (const f of report.features) {
      expect(f.psi).toBeGreaterThanOrEqual(0);
      expect(['stable', 'warning', 'critical']).toContain(f.severity);
    }
  });
});

// ---------------------------------------------------------------------------
// shouldTriggerRetrain
// ---------------------------------------------------------------------------

describe('shouldTriggerRetrain', () => {
  test('returns true when alert severity is critical', () => {
    const alert = evaluateModelDrift('m', 'v1', [
      { name: 'f', reference: [10, 10, 10, 10, 10], current: [40, 2, 2, 2, 4] },
    ]);
    // PSI is ~1.86 for this distribution – well above the 0.2 critical threshold
    expect(shouldTriggerRetrain(alert)).toBe(true);
  });

  test('returns false for stable alert', () => {
    const alert = evaluateModelDrift('m', 'v1', [
      { name: 'f', reference: [10, 20, 30], current: [10, 20, 30] },
    ]);
    expect(shouldTriggerRetrain(alert)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// scheduleDriftEval
// ---------------------------------------------------------------------------

describe('scheduleDriftEval', () => {
  test('creates a schedule and returns a schedule id', () => {
    const scheduleId = scheduleDriftEval('fall-risk', 'v0.1', {
      projectId: 'test-project',
      scheduleType: 'daily',
    });
    expect(typeof scheduleId).toBe('string');
    expect(scheduleId).toMatch(/^schedule-/);

    const schedule = scheduler.getSchedule(scheduleId);
    expect(schedule).toBeDefined();
    expect(schedule!.analysisType).toBe('model-drift:fall-risk');
    expect(schedule!.scheduleType).toBe('daily');
    expect(schedule!.enabled).toBe(true);
  });

  test('weekly schedule is created correctly', () => {
    const scheduleId = scheduleDriftEval('gait-model', 'v1.0', {
      projectId: 'weekly-project',
      scheduleType: 'weekly',
    });
    const schedule = scheduler.getSchedule(scheduleId);
    expect(schedule!.scheduleType).toBe('weekly');
  });
});

// ---------------------------------------------------------------------------
// runScheduledDriftEval
// ---------------------------------------------------------------------------

describe('runScheduledDriftEval', () => {
  beforeEach(() => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 } as Response);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const features: FeatureDistribution[] = [
    { name: 'steps_avg', reference: [10, 20, 30], current: [10, 20, 30] },
  ];

  test('completes job and returns drift alert', async () => {
    const scheduleId = scheduleDriftEval('fall-risk', 'v0.1', {
      projectId: 'run-project',
      scheduleType: 'daily',
    });

    const alert = await runScheduledDriftEval(scheduleId, 'fall-risk', 'v0.1', features);

    expect(alert.modelId).toBe('fall-risk');
    expect(alert.modelVersion).toBe('v0.1');
    expect(alert.severity).toBe('stable');
  });

  test('fires notification when drift is detected', async () => {
    const scheduleId = scheduleDriftEval('fall-risk', 'v0.1', {
      projectId: 'notify-project',
      scheduleType: 'daily',
    });

    const driftedFeatures: FeatureDistribution[] = [
      { name: 'steps_avg', reference: [10, 10, 10, 10, 10], current: [40, 2, 2, 2, 4] },
    ];

    const notificationConfig = {
      webhooks: [{ url: 'https://example.com/drift-hook', events: ['*'] }],
    };

    const alert = await runScheduledDriftEval(
      scheduleId,
      'fall-risk',
      'v0.1',
      driftedFeatures,
      notificationConfig
    );

    expect(alert.severity).toBe('critical');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://example.com/drift-hook',
      expect.objectContaining({ method: 'POST' })
    );
  });

  test('records job failure on error', async () => {
    const scheduleId = scheduleDriftEval('fall-risk', 'v0.1', {
      projectId: 'fail-project',
      scheduleType: 'daily',
    });

    const badFeatures: FeatureDistribution[] = [
      { name: 'f', reference: [], current: [] }, // will throw
    ];

    await expect(
      runScheduledDriftEval(scheduleId, 'fall-risk', 'v0.1', badFeatures)
    ).rejects.toThrow();

    // The job should exist with failed status
    const jobs = scheduler.listJobs(scheduleId, 'failed');
    expect(jobs.length).toBeGreaterThanOrEqual(1);
  });
});
