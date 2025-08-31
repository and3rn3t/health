import { useInfiniteQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  processedHealthDataSchema,
  healthMetricSchema,
} from '@/schemas/health';

const listSchema = z.array(processedHealthDataSchema);

export type HealthDataInfiniteParams = {
  from?: string;
  to?: string;
  metric?: z.infer<typeof healthMetricSchema.shape.type>;
  limit?: number;
};

type Page = {
  items: z.infer<typeof listSchema>;
  nextCursor?: string;
};

export function useHealthDataInfiniteQuery(params: HealthDataInfiniteParams) {
  return useInfiniteQuery<Page>({
    queryKey: ['health-data-infinite', params],
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor,
    queryFn: async ({ pageParam }) => {
      const entries = Object.entries(params).filter(
        ([, v]) => v !== undefined && v !== ''
      );
      const search = new URLSearchParams(
        Object.fromEntries(entries as [string, string][])
      );
      if (typeof pageParam === 'string' && pageParam) {
        search.set('cursor', pageParam);
      }
      const res = await fetch(`/api/health-data?${search.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch health data');
      const json = await res.json();
      const payload = Array.isArray(json) ? json : json.data;
      const parsed = listSchema.safeParse(payload);
      if (!parsed.success) throw new Error('Schema validation failed');
      const nextCursor = json.nextCursor as string | undefined;
      return { items: parsed.data, nextCursor };
    },
  });
}

export default useHealthDataInfiniteQuery;
