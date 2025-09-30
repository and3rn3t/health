import { useKV } from '@/hooks/useCloudflareKV';
import {
  computeCompositeScore,
  createInitialInsightState,
  type Insight,
  type InsightConfig,
  type LiveInsightState,
  updateInsights,
} from '@/lib/insights/liveInsights';
import type { LiveHealthMetric } from '@/lib/liveHealthDataSync';
import { useEffect, useMemo, useState } from 'react';

export function useLiveInsights(
  metrics: LiveHealthMetric[],
  config?: InsightConfig
) {
  const [state, setState] = useState<LiveInsightState>(
    createInitialInsightState()
  );

  // Load persisted thresholds and weights (lightweight, optional override)
  const [thresholdsKV] = useKV<string>('insights-thresholds', '');
  const [weightsKV] = useKV<string>('insights-weights', '');
  const persistedConfig: InsightConfig | undefined = useMemo(() => {
    try {
      const t = thresholdsKV ? JSON.parse(thresholdsKV) : undefined;
      const w = weightsKV ? JSON.parse(weightsKV) : undefined;
      if (!t && !w) return config;
      return {
        ...(config ?? {}),
        thresholds: t ?? config?.thresholds,
        weights: w ?? config?.weights,
      };
    } catch {
      return config;
    }
  }, [thresholdsKV, weightsKV, config]);

  // Incremental update when new metrics arrive
  useEffect(() => {
    if (!metrics || metrics.length === 0) return;
    // Only process the newest metric each render to amortize cost
    const latest = metrics[0];
    setState((prev) => updateInsights(prev, latest, persistedConfig));
  }, [metrics, persistedConfig]);

  const insights: Insight[] = useMemo(() => state.insights, [state.insights]);
  const composite = useMemo(
    () => computeCompositeScore(state, persistedConfig),
    [state, persistedConfig]
  );

  return { insights, state, composite };
}
