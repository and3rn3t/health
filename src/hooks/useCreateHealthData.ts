import { useMutation, useQueryClient } from '@tanstack/react-query';
import { processedHealthDataSchema } from '@/schemas/health';
import { z } from 'zod';
import { apiClient } from '@/lib/apiClient';

export function useCreateHealthData() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: z.infer<typeof processedHealthDataSchema>) => {
      return apiClient.createHealthData(payload);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-data'] });
    },
  });
}
