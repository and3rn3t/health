import { httpClient } from './httpClient';
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

export const apiClient = {
  async getHealthData(params: HealthDataQueryParams = {}) {
    const entries = Object.entries(params).filter(
      ([, v]) => v !== undefined && v !== ''
    );
    const search = new URLSearchParams(
      Object.fromEntries(entries as [string, string][])
    );
    const json = await httpClient.get<unknown>(
      `/api/health-data?${search.toString()}`
    );
    const payload =
      Array.isArray(json)
        ? json
        : json && Array.isArray((json as any).data) // eslint-disable-line @typescript-eslint/no-explicit-any
        ? (json as any).data // eslint-disable-line @typescript-eslint/no-explicit-any
        : [];
    const parsed = listSchema.safeParse(payload);
    if (!parsed.success) {
      console.warn('Health data schema validation failed:', parsed.error);
      return [];
    }
    return parsed.data;
  },

  async createHealthData(payload: z.infer<typeof processedHealthDataSchema>) {
    return httpClient.post('/api/health-data', payload);
  },

  async getWsUrl(): Promise<string> {
    const json = await httpClient.get<{ url?: string; fallback?: string }>(
      '/api/ws-url',
      { headers: { 'cache-control': 'no-store' } }
    );
    return json.url || json.fallback || '';
  },
};
