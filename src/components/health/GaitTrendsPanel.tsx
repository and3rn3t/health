import { useRecentGait } from '@/hooks/useRecentGait';
import { computeMomentum } from '@/lib/gaitMomentum';
import React, { useMemo, useState } from 'react';

interface TrendMetric {
  direction: 'improving' | 'stable' | 'declining' | null;
  slope: number | null;
  confidence: number | null;
  sampleCount?: number;
  relativeSlope?: number | null;
  severity?:
    | 'strong_improvement'
    | 'moderate_improvement'
    | 'mild_improvement'
    | 'stable'
    | 'mild_decline'
    | 'moderate_decline'
    | 'strong_decline'
    | 'insufficient_data';
}

interface MetricTrendProps {
  name: string;
  metricKey: string;
  direction: string | null;
  slope: number | null;
  confidence: number | null;
  sampleCount?: number;
  relativeSlope?: number | null;
  severity?: TrendMetric['severity'];
}

const directionColor = (dir: string | null) => {
  switch (dir) {
    case 'improving':
      return 'bg-emerald-600/15 text-emerald-600 border-emerald-600/30';
    case 'declining':
      return 'bg-rose-600/15 text-rose-600 border-rose-600/30';
    case 'stable':
      return 'bg-slate-500/15 text-slate-500 border-slate-500/30';
    default:
      return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
  }
};

const severityStyle = (sev: TrendMetric['severity']) => {
  switch (sev) {
    case 'strong_improvement':
      return 'bg-emerald-600 text-white';
    case 'moderate_improvement':
      return 'bg-emerald-500/90 text-white';
    case 'mild_improvement':
      return 'bg-emerald-400/30 text-emerald-700';
    case 'strong_decline':
      return 'bg-rose-700 text-white';
    case 'moderate_decline':
      return 'bg-rose-600/90 text-white';
    case 'mild_decline':
      return 'bg-rose-500/15 text-rose-600';
    case 'stable':
      return 'bg-slate-500/15 text-slate-600';
    default:
      return 'bg-gray-500/10 text-gray-500';
  }
};

const metricRecommendation = (
  key: string,
  severity: TrendMetric['severity'],
  direction: string | null
): string | null => {
  if (!severity || severity === 'insufficient_data') return null;
  if (direction === 'stable') return 'Maintain current routine';
  const improving = direction === 'improving';
  switch (key) {
    case 'speed':
      return improving
        ? 'Sustain pace improvements with consistent cadence drills'
        : 'Introduce interval walks to counter slowing pace';
    case 'cadence':
      return improving
        ? 'Leverage metronome steps to reinforce cadence gains'
        : 'Shorten stride slightly and focus on rhythmic footfalls';
    case 'asymmetry':
      return improving
        ? 'Great symmetry gains—add light single-leg balance to lock in'
        : 'Add targeted unilateral strength & balance exercises';
    case 'variability':
      return improving
        ? 'Consistency rising—gradually extend walk duration'
        : 'Add structured warm-up to reduce early stride variability';
    default:
      return null;
  }
};

const MetricTrend: React.FC<MetricTrendProps & { showRelative: boolean }> = ({
  name,
  metricKey,
  direction,
  slope,
  confidence,
  sampleCount,
  relativeSlope,
  severity,
  showRelative,
}) => {
  const rec = metricRecommendation(metricKey, severity, direction);
  const lowConf = confidence != null && confidence < 0.4;
  return (
    <div className="border-gray-200/40 flex flex-col border-b py-1 last:border-none">
      <div className="flex items-center justify-between">
        <div className="gap-0.5 flex flex-col">
          <span className="text-xs text-gray-700 font-medium">{name}</span>
          <span className="text-[10px] text-gray-500">
            samples: {sampleCount ?? '—'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`py-0.5 rounded-full border px-2 text-[11px] ${directionColor(direction)}`}
            title={direction || undefined}
          >
            {direction ?? '—'}
          </span>
          <span
            className={`py-0.5 rounded-full px-2 text-[10px] font-medium transition ${severityStyle(severity)} ${lowConf ? 'opacity-50' : ''}`}
            title={
              severity
                ? `${severity.replace(/_/g, ' ')} | slope=${
                    slope == null ? '—' : slope.toExponential(3)
                  } | rel=${
                    relativeSlope == null ? '—' : relativeSlope.toFixed(4)
                  } | conf=${
                    confidence == null
                      ? '—'
                      : (confidence * 100).toFixed(1) + '%'
                  }${lowConf ? ' (low confidence)' : ''}`
                : undefined
            }
          >
            {severity?.replace(/_/g, ' ') || '—'}
          </span>
          {showRelative ? (
            <span className="text-gray-600 text-[10px] tabular-nums">
              rel: {relativeSlope == null ? '—' : relativeSlope.toFixed(3)}
            </span>
          ) : (
            <span className="text-gray-600 text-[10px] tabular-nums">
              slope: {slope === null ? '—' : slope.toFixed(4)}
            </span>
          )}
          <span className="text-gray-600 text-[10px] tabular-nums">
            conf: {confidence === null ? '—' : (confidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
      {rec && (
        <div className="mt-0.5 text-gray-600 line-clamp-2 text-[10px]">
          {rec}
        </div>
      )}
    </div>
  );
};

export const GaitTrendsPanel: React.FC<
  { limit?: number } & React.HTMLAttributes<HTMLDivElement>
> = ({ limit = 50, className }) => {
  const { data, isLoading, error } = useRecentGait(limit);
  const trends: Record<string, TrendMetric> | undefined = useMemo(
    () =>
      (data?.trends as Record<string, TrendMetric> | undefined) ||
      (data?.trend ? { speed: data.trend as TrendMetric } : undefined),
    [data?.trends, data?.trend]
  );
  const [showRelative, setShowRelative] = useState(true);

  // Aggregate momentum classification
  const momentum = useMemo(
    () => computeMomentum(trends as Record<string, any>),
    [trends]
  );

  const momentumGradient = useMemo(() => {
    if (!momentum) return '';
    switch (momentum.classification) {
      case 'Upward':
        return 'from-emerald-500/80 to-emerald-600/80 text-white';
      case 'Downward':
        return 'from-rose-500/80 to-rose-600/80 text-white';
      default:
        return 'from-slate-400/30 to-slate-500/30 text-slate-700';
    }
  }, [momentum]);

  return (
    <div
      className={`border-gray-200/60 backdrop-blur rounded-lg border bg-white/70 p-4 shadow-sm ${className || ''}`}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <h3 className="text-gray-800 flex items-center gap-2 text-sm font-semibold">
          Gait Trends
          {momentum && (
            <span
              className={`py-0.5 rounded bg-gradient-to-r px-2 text-[10px] ${momentumGradient}`}
              title={`Momentum score ${momentum.score.toFixed(2)} (${momentum.classification})`}
            >
              {momentum.classification}
            </span>
          )}
        </h3>
        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRelative((v) => !v)}
            className="border-gray-300 py-0.5 text-gray-600 hover:bg-gray-50 rounded border bg-white px-2 text-[10px]"
            title={
              showRelative
                ? 'Showing relative slope magnitude (toggle to view absolute slope)'
                : 'Showing absolute slope (toggle to view relative normalized magnitude)'
            }
          >
            {showRelative ? 'Rel' : 'Abs'}
          </button>
          {isLoading && (
            <span className="animate-pulse text-[10px] text-gray-500">
              loading...
            </span>
          )}
          {error && <span className="text-rose-600 text-[10px]">error</span>}
        </div>
      </div>
      {!trends && !isLoading && (
        <p className="text-xs text-gray-500">No trend data yet.</p>
      )}
      {trends && (
        <div className="flex flex-col divide-y divide-gray-100/60">
          {Object.entries(trends).map(([k, v]) => (
            <MetricTrend
              key={k}
              name={k}
              metricKey={k}
              direction={v.direction}
              slope={v.slope}
              confidence={v.confidence}
              sampleCount={v.sampleCount}
              relativeSlope={v.relativeSlope}
              severity={v.severity}
              showRelative={showRelative}
            />
          ))}
        </div>
      )}
      {data?.rolling && (
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-[10px] text-gray-500">Speed Avg</p>
            <p className="text-xs font-medium tabular-nums">
              {data.rolling.speedAvg?.toFixed(3) ?? '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-[10px] text-gray-500">Cadence Avg</p>
            <p className="text-xs font-medium tabular-nums">
              {data.rolling.cadenceAvg?.toFixed(1) ?? '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-[10px] text-gray-500">Asym Avg</p>
            <p className="text-xs font-medium tabular-nums">
              {data.rolling.asymAvg?.toFixed(3) ?? '—'}
            </p>
          </div>
          <div className="bg-gray-50 rounded-md p-2">
            <p className="text-[10px] text-gray-500">Variability Avg</p>
            <p className="text-xs font-medium tabular-nums">
              {data.rolling.variabilityAvg?.toFixed(3) ?? '—'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default GaitTrendsPanel;
