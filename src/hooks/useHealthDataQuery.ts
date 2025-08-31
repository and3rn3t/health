import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import {
  processedHealthDataSchema,
  healthMetricSchema,
} from '@/schemas/health';

const listSchema = z.array(processedHealthDataSchema);

export type HealthDataQueryParams = {
  from?: string;
  to?: string;
  metric?: z.infer<typeof healthMetricSchema.shape.type>;
  limit?: number;
};

export function useHealthDataQuery(params: HealthDataQueryParams) {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ''
  );
  const search = new URLSearchParams(
    Object.fromEntries(entries as [string, string][])
  );

  return useQuery({
    queryKey: ['health-data', params],
    queryFn: async () => {
      const res = await fetch(`/api/health-data?${search.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch health data');
      const json = await res.json();

      // Allow either array data or top-level object with data array
      const payload = Array.isArray(json) ? json : json.data;
      const parsed = listSchema.safeParse(payload);
      if (!parsed.success) {
        throw new Error('Schema validation failed');
      }
      return parsed.data;
    },
  });
}
