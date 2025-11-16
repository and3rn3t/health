import { describe, it, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '@/lib/apiClient';

describe('apiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('getHealthData returns array on well-formed payload', async () => {
    const payload = [{ type: 'steps', value: 10, timestamp: new Date().toISOString(), source: { userId: 'u', collectedAt: new Date().toISOString(), deviceId: 'd', processingPipeline: 'p' }, processedAt: new Date().toISOString(), validated: true, fallRisk: 'low' as const }];
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => payload,
    }));
    const res = await apiClient.getHealthData({ limit: 1 });
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBe(1);
  });

  it('createHealthData posts payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      headers: { get: () => 'application/json' },
      json: async () => ({ ok: true }),
    }));
    const res = await apiClient.createHealthData(
      // minimal valid shape (fields validated server-side in e2e)
      {
        type: 'steps',
        value: 1,
        timestamp: new Date().toISOString(),
        source: { userId: 'u', collectedAt: new Date().toISOString(), deviceId: 'd', processingPipeline: 'p' },
        processedAt: new Date().toISOString(),
        validated: true,
        fallRisk: 'low',
      } as any
    );
    expect(res).toEqual({ ok: true });
  });
});
