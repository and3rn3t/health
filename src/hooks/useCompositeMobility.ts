import {
  computeCompositeFromMetrics,
  type CompositeScoreResult,
  type InsightConfig,
} from '@/lib/insights/liveInsights';
import type { LiveHealthMetric } from '@/lib/liveHealthDataSync';
import { useMemo } from 'react';

export function useCompositeMobility(
  metrics: LiveHealthMetric[],
  config?: InsightConfig
): CompositeScoreResult {
  return useMemo(
    () => computeCompositeFromMetrics(metrics, config),
    [metrics, config]
  );
}
