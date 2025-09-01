import { useMutation, useQueryClient } from '@tanstack/react-query';
import { processedHealthDataSchema } from '@/schemas/health';
import { z } from 'zod';

export function useCreateHealthData() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: z.infer<typeof processedHealthDataSchema>) => {
      const res = await fetch('/api/health-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Failed to save health data');
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['health-data'] });
    },
  });
}
