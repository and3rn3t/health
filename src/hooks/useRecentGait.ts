import { liveGaitRecentResponseSchema } from '@/schemas/health';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

// Extended schema adaptation: ensure we gracefully handle absence of new trends.
const multiTrendsSchema = z
  .record(
    z.object({
      direction: z.enum(['improving', 'stable', 'declining']).nullable(),
      slope: z.number().nullable(),
      confidence: z.number().min(0).max(1).nullable(),
      sampleCount: z.number().optional(),
      relativeSlope: z.number().nullable().optional(),
      severity: z
        .enum([
          'strong_improvement',
          'moderate_improvement',
          'mild_improvement',
          'stable',
          'mild_decline',
          'moderate_decline',
          'strong_decline',
          'insufficient_data',
        ])
        .optional(),
    })
  )
  .optional();

export function useRecentGait(limit = 50) {
  return useQuery({
    queryKey: ['gait', 'recent', limit],
    queryFn: async () => {
      const res = await fetch(`/api/live/gait/recent?limit=${limit}`);
      if (!res.ok) throw new Error(`failed_recent_gait:${res.status}`);
      const json = await res.json();
      const parsed = liveGaitRecentResponseSchema
        .extend({ trends: multiTrendsSchema })
        .safeParse(json);
      if (!parsed.success) {
        throw new Error('validation_error');
      }
      return parsed.data;
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  });
}

export type RecentGaitData =
  ReturnType<typeof useRecentGait> extends { data: infer D } ? D : never;
