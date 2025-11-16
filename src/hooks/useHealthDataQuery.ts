import {
  healthMetricSchema,
  processedHealthDataSchema,
} from '@/schemas/health';
import { useQuery } from '@tanstack/react-query';
import { z } from 'zod';
import { apiClient } from '@/lib/apiClient';

const listSchema = z.array(processedHealthDataSchema);

export type HealthDataQueryParams = {
  from?: string;
  to?: string;
  metric?: z.infer<typeof healthMetricSchema.shape.type>;
  limit?: number;
};

export function useHealthDataQuery(params: HealthDataQueryParams) {
  return useQuery({
    queryKey: ['health-data', params],
    queryFn: async () => {
      return apiClient.getHealthData(params);
    },
  });
}
