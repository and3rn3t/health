import {
  healthMetricSchema,
  processedHealthDataSchema,
} from '@/schemas/health';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';

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
      // Ensure we always return an array, even if the API returns an error
      let payload;
      if (Array.isArray(json)) {
        payload = json;
      } else if (json && Array.isArray((json as { data?: unknown }).data)) {
        payload = (json as { data: unknown[] }).data;
      } else {
        // If the API returns an error or malformed data, return empty array
        console.warn('Health data API returned unexpected format:', json);
        payload = [];
      }

      const parsed = listSchema.safeParse(payload);
      if (!parsed.success) {
        console.warn('Health data schema validation failed:', parsed.error);
        return []; // Return empty array instead of throwing
      }
      return parsed.data;
    },
  });
}
