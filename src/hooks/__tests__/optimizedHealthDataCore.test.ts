import { describe, expect, it } from 'vitest';
import {
  healthDataReducer,
  initialState,
  useDerivedHealthValues,
  type HealthDataAction,
  type HealthDataState,
  type LiveHealthData,
} from '@/hooks/optimizedHealthDataCore';
import { renderHook } from '@testing-library/react';
import { buildAggregatedMetrics, buildConnectionStatus, buildLiveHealthData, buildProcessedHealthRecord } from '@/test/factories';

describe('healthDataReducer', () => {
  it('handles SET_LOADING', () => {
    const next = healthDataReducer(initialState, {
      type: 'SET_LOADING',
      payload: true,
    });
    expect(next.isLoading).toBe(true);
  });

  it('handles SET_ERROR and clears loading', () => {
    const loading: HealthDataState = { ...initialState, isLoading: true };
    const next = healthDataReducer(loading, {
      type: 'SET_ERROR',
      payload: 'Network error',
    });
    expect(next.error).toBe('Network error');
    expect(next.isLoading).toBe(false);
  });

  it('handles UPDATE_RAW_DATA', () => {
    const records = [buildProcessedHealthRecord()];
    const next = healthDataReducer(initialState, {
      type: 'UPDATE_RAW_DATA',
      payload: records,
    });
    expect(next.rawData).toHaveLength(1);
    expect(next.lastUpdated).toBeTruthy();
    expect(next.error).toBeNull();
  });

  it('handles ADD_REAL_TIME_DATA and caps at 1000', () => {
    // Start with 999 items
    const existing: LiveHealthData[] = Array.from({ length: 999 }, (_, i) =>
      buildLiveHealthData({ id: `existing-${i}` })
    );
    const state: HealthDataState = { ...initialState, realTimeStream: existing };

    // Add 2 more → should be capped at 1000
    let next = healthDataReducer(state, {
      type: 'ADD_REAL_TIME_DATA',
      payload: buildLiveHealthData({ id: 'new-1' }),
    });
    next = healthDataReducer(next, {
      type: 'ADD_REAL_TIME_DATA',
      payload: buildLiveHealthData({ id: 'new-2' }),
    });

    expect(next.realTimeStream).toHaveLength(1000);
    // Oldest entry should have been dropped
    expect(next.realTimeStream[0]!.id).toBe('existing-1');
    expect(next.realTimeStream[999]!.id).toBe('new-2');
  });

  it('handles UPDATE_AGGREGATED_METRICS', () => {
    const metrics = buildAggregatedMetrics();
    const next = healthDataReducer(initialState, {
      type: 'UPDATE_AGGREGATED_METRICS',
      payload: metrics,
    });
    expect(next.aggregatedMetrics).toEqual(metrics);
    expect(next.lastUpdated).toBeTruthy();
  });

  it('handles UPDATE_CONNECTION_STATUS', () => {
    const next = healthDataReducer(initialState, {
      type: 'UPDATE_CONNECTION_STATUS',
      payload: { webSocket: 'connected' },
    });
    expect(next.connectionStatus.webSocket).toBe('connected');
    expect(next.connectionStatus.lastHeartbeat).toBeTruthy();
  });

  it('handles CLEAR_OLD_REAL_TIME_DATA', () => {
    const oldItem = buildLiveHealthData({
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    });
    const recentItem = buildLiveHealthData({
      timestamp: new Date().toISOString(),
    });
    const state: HealthDataState = {
      ...initialState,
      realTimeStream: [oldItem, recentItem],
    };

    const next = healthDataReducer(state, {
      type: 'CLEAR_OLD_REAL_TIME_DATA',
    });
    expect(next.realTimeStream).toHaveLength(1);
  });

  it('returns same state for unknown action type', () => {
    const next = healthDataReducer(initialState, {
      type: 'UNKNOWN' as HealthDataAction['type'],
    } as HealthDataAction);
    expect(next).toBe(initialState);
  });
});

describe('useDerivedHealthValues', () => {
  it('computes riskLevel as low when no aggregated metrics', () => {
    const { result } = renderHook(() => useDerivedHealthValues(initialState));
    expect(result.current.riskLevel).toBe('low');
  });

  it('computes riskLevel as high when fallRisk > 70', () => {
    const state: HealthDataState = {
      ...initialState,
      aggregatedMetrics: buildAggregatedMetrics({
        riskScores: { fallRisk: 80, cardiovascularRisk: 10, sleepQuality: 50 },
      }),
    };
    const { result } = renderHook(() => useDerivedHealthValues(state));
    expect(result.current.riskLevel).toBe('high');
  });

  it('computes riskLevel as medium when maxRisk between 40-70', () => {
    const state: HealthDataState = {
      ...initialState,
      aggregatedMetrics: buildAggregatedMetrics({
        riskScores: { fallRisk: 55, cardiovascularRisk: 10, sleepQuality: 50 },
      }),
    };
    const { result } = renderHook(() => useDerivedHealthValues(state));
    expect(result.current.riskLevel).toBe('medium');
  });

  it('computes connectionQuality correctly', () => {
    const excellent: HealthDataState = {
      ...initialState,
      connectionStatus: buildConnectionStatus({
        webSocket: 'connected',
        api: 'healthy',
        database: 'healthy',
      }),
    };
    const { result: res1 } = renderHook(() =>
      useDerivedHealthValues(excellent)
    );
    expect(res1.current.connectionQuality).toBe('excellent');

    const offline: HealthDataState = {
      ...initialState,
      connectionStatus: buildConnectionStatus({
        webSocket: 'disconnected',
        api: 'down',
        database: 'down',
      }),
    };
    const { result: res2 } = renderHook(() => useDerivedHealthValues(offline));
    expect(res2.current.connectionQuality).toBe('offline');
  });

  it('filters recentHealthData to last 7 days', () => {
    const old = buildProcessedHealthRecord({
      timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const recent = buildProcessedHealthRecord({
      timestamp: new Date().toISOString(),
    });
    const state: HealthDataState = {
      ...initialState,
      rawData: [old, recent],
    };
    const { result } = renderHook(() => useDerivedHealthValues(state));
    expect(result.current.recentHealthData).toHaveLength(1);
  });
});
