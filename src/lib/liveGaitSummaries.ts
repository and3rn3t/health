import {
  computeMultiMetricTrends,
  computeSingleMetricTrend,
  type BasicGaitSnapshot,
} from '@/lib/gaitTrends';
import type { LiveGaitSnapshot } from '@/schemas/health';

export interface GaitSummary {
  ordered: LiveGaitSnapshot[];
  rolling: {
    speedAvg: number | null;
    speedVar: number | null;
    cadenceAvg: number | null;
    asymAvg: number | null;
    variabilityAvg: number | null;
  };
  trend: ReturnType<typeof computeSingleMetricTrend>;
  trends: ReturnType<typeof computeMultiMetricTrends>;
}

function mean(arr: number[]): number | null {
  return arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null;
}
function variance(arr: number[]): number | null {
  if (!arr.length) return null;
  const m = mean(arr)!;
  return arr.reduce((a, b) => a + Math.pow(b - m, 2), 0) / arr.length;
}

export function summarizeGaitSnapshots(
  snapshots: LiveGaitSnapshot[]
): GaitSummary {
  const collect = (f: (s: LiveGaitSnapshot) => number | undefined) =>
    snapshots
      .map(f)
      .filter((n): n is number => typeof n === 'number' && !Number.isNaN(n));
  const speedSeries = collect((s) => s.speed);
  const cadSeries = collect((s) => s.stepFrequency);
  const asymSeries = collect((s) => s.asymmetry ?? undefined);
  const varSeries = collect((s) => s.variability ?? undefined);
  const ordered = snapshots
    .slice()
    .sort((a, b) => (a.capturedAt || '').localeCompare(b.capturedAt || ''));
  const sanitized = ordered.map((s) => ({
    ...s,
    asymmetry: s.asymmetry == null ? undefined : s.asymmetry,
    variability: s.variability == null ? undefined : s.variability,
  }));
  const trends = computeMultiMetricTrends(
    sanitized as unknown as BasicGaitSnapshot[]
  );
  const trend = trends.speed || computeSingleMetricTrend([]);
  return {
    ordered,
    rolling: {
      speedAvg: mean(speedSeries),
      speedVar: variance(speedSeries),
      cadenceAvg: mean(cadSeries),
      asymAvg: mean(asymSeries),
      variabilityAvg: mean(varSeries),
    },
    trend,
    trends,
  };
}
