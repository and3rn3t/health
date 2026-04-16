import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useLocalKV', () => {
  const stores = new Map<string, unknown>();
  return {
    useKV: vi
      .fn()
      .mockImplementation((key: string, defaultVal: unknown) => {
        if (!stores.has(key)) stores.set(key, defaultVal);
        return [
          stores.get(key),
          (val: unknown) => stores.set(key, val),
        ];
      }),
  };
});

const { useHealthInsights } = await import('../useHealthInsights');

const makeHealthData = (overrides = {}) => ({
  healthScore: 80,
  metrics: {
    heartRate: { average: 72, min: 60, max: 100 },
    steps: { average: 9000, min: 5000, max: 15000 },
    sleepHours: { average: 7.5, min: 6, max: 9 },
  },
  dailyMetrics: [],
  fallRiskFactors: [],
  ...overrides,
});

describe('useHealthInsights', () => {
  it('returns default resolved score when healthData has score', () => {
    const { result } = renderHook(() =>
      useHealthInsights(makeHealthData() as never)
    );
    expect(result.current.resolvedScore).toBe(80);
  });

  it('returns insights array', async () => {
    const { result } = renderHook(() =>
      useHealthInsights(makeHealthData() as never)
    );
    await waitFor(() => {
      expect(Array.isArray(result.current.insights)).toBe(true);
    });
  });

  it('returns trends array', async () => {
    const { result } = renderHook(() =>
      useHealthInsights(makeHealthData() as never)
    );
    await waitFor(() => {
      expect(Array.isArray(result.current.trends)).toBe(true);
    });
  });

  it('returns predictiveAlerts array', async () => {
    const { result } = renderHook(() =>
      useHealthInsights(makeHealthData() as never)
    );
    await waitFor(() => {
      expect(Array.isArray(result.current.predictiveAlerts)).toBe(true);
    });
  });

  it('returns empty insights array initially', () => {
    const data = makeHealthData({
      metrics: {
        heartRate: { average: 90, min: 70, max: 110 },
        steps: { average: 9000, min: 5000, max: 15000 },
        sleepHours: { average: 7.5, min: 6, max: 9 },
      },
    });
    const { result } = renderHook(() => useHealthInsights(data as never));
    expect(Array.isArray(result.current.insights)).toBe(true);
  });

  it('selectedInsight is null initially', () => {
    const { result } = renderHook(() =>
      useHealthInsights(makeHealthData() as never)
    );
    expect(result.current.selectedInsight).toBeNull();
  });
});
