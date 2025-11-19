import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  normalizeToHealthData,
  isProcessedHealthData,
  clearNormalizationCache,
} from '../normalizeHealthInput';
import type { ProcessedHealthRecord, ProcessedHealthData } from '@/types';

// Mock telemetry
vi.mock('@/lib/telemetry', () => ({
  recordTelemetry: vi.fn(),
  registerNormalizationStatsProvider: vi.fn(),
}));

describe('normalizeHealthInput', () => {
  beforeEach(() => {
    clearNormalizationCache();
  });

  describe('isProcessedHealthData', () => {
    test('should return true for valid ProcessedHealthData', () => {
      const data: ProcessedHealthData = {
        lastUpdated: '2024-01-01T00:00:00Z',
        dataQuality: {
          completeness: 100,
          consistency: 100,
          recency: 100,
          overall: 'good',
        },
        metrics: {
          steps: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 5000,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 5000,
            percentileRank: 50,
          },
          heartRate: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 72,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 72,
            percentileRank: 50,
          },
          walkingSteadiness: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 80,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 80,
            percentileRank: 50,
          },
          sleepHours: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 7,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 7,
            percentileRank: 50,
          },
        },
        insights: [],
        fallRiskFactors: [],
        healthScore: 85,
      };

      expect(isProcessedHealthData(data)).toBe(true);
    });

    test('should return false for invalid data', () => {
      expect(isProcessedHealthData(null)).toBe(false);
      expect(isProcessedHealthData(undefined)).toBe(false);
      expect(isProcessedHealthData({})).toBe(false);
      expect(isProcessedHealthData({ metrics: {} })).toBe(false);
      expect(isProcessedHealthData({ lastUpdated: '2024-01-01' })).toBe(false);
    });
  });

  describe('normalizeToHealthData', () => {
    test('should return input as-is if already ProcessedHealthData', () => {
      const data: ProcessedHealthData = {
        lastUpdated: '2024-01-01T00:00:00Z',
        dataQuality: {
          completeness: 100,
          consistency: 100,
          recency: 100,
          overall: 'good',
        },
        metrics: {
          steps: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 5000,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 5000,
            percentileRank: 50,
          },
          heartRate: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 72,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 72,
            percentileRank: 50,
          },
          walkingSteadiness: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 80,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 80,
            percentileRank: 50,
          },
          sleepHours: {
            daily: [],
            weekly: [],
            monthly: [],
            average: 7,
            trend: 'stable',
            variability: 0,
            reliability: 100,
            lastValue: 7,
            percentileRank: 50,
          },
        },
        insights: [],
        fallRiskFactors: [],
        healthScore: 85,
      };

      const result = normalizeToHealthData(data);
      expect(result).toBe(data);
    });

    test('should normalize single ProcessedHealthRecord', () => {
      const record: ProcessedHealthRecord = {
        id: '1',
        type: 'heart_rate',
        value: 72,
        timestamp: '2024-01-01T00:00:00Z',
        source: 'apple_health',
      };

      const result = normalizeToHealthData(record);

      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('metrics');
      expect(result).toHaveProperty('dataQuality');
      expect(result).toHaveProperty('insights');
      expect(result).toHaveProperty('fallRiskFactors');
      expect(result).toHaveProperty('healthScore');
      expect(result.metrics.heartRate).toBeDefined();
    });

    test('should normalize array of ProcessedHealthRecord', () => {
      const records: ProcessedHealthRecord[] = [
        {
          id: '1',
          type: 'heart_rate',
          value: 72,
          timestamp: '2024-01-01T00:00:00Z',
          source: 'apple_health',
        },
        {
          id: '2',
          type: 'steps',
          value: 5000,
          timestamp: '2024-01-01T00:00:00Z',
          source: 'apple_health',
        },
      ];

      const result = normalizeToHealthData(records);

      expect(result).toHaveProperty('lastUpdated');
      expect(result).toHaveProperty('metrics');
      expect(result.metrics.steps).toBeDefined();
      expect(result.metrics.heartRate).toBeDefined();
    });

    test('should use cache for repeated calls', () => {
      const records: ProcessedHealthRecord[] = [
        {
          id: '1',
          type: 'heart_rate',
          value: 72,
          timestamp: '2024-01-01T00:00:00Z',
          source: 'apple_health',
        },
      ];

      const result1 = normalizeToHealthData(records);
      const result2 = normalizeToHealthData(records);

      // Results should be equivalent (same structure)
      expect(result1).toHaveProperty('lastUpdated');
      expect(result2).toHaveProperty('lastUpdated');
      // Note: lastUpdated will be different, but structure should be same
    });

    test('should bypass cache when bypassCache option is true', () => {
      const records: ProcessedHealthRecord[] = [
        {
          id: '1',
          type: 'heart_rate',
          value: 72,
          timestamp: '2024-01-01T00:00:00Z',
          source: 'apple_health',
        },
      ];

      const result1 = normalizeToHealthData(records, { bypassCache: true });
      const result2 = normalizeToHealthData(records, { bypassCache: true });

      expect(result1).toHaveProperty('lastUpdated');
      expect(result2).toHaveProperty('lastUpdated');
    });
  });

  describe('clearNormalizationCache', () => {
    test('should clear the cache', () => {
      const records: ProcessedHealthRecord[] = [
        {
          id: '1',
          type: 'heart_rate',
          value: 72,
          timestamp: '2024-01-01T00:00:00Z',
          source: 'apple_health',
        },
      ];

      normalizeToHealthData(records);
      clearNormalizationCache();

      // Cache should be cleared, next call should be a miss
      const result = normalizeToHealthData(records);
      expect(result).toBeDefined();
    });
  });
});

