/**
 * Tests for useFallRiskHistory hook
 */

import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useFallRiskHistory } from '../useFallRiskHistory';
import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

const createMockPrediction = (
  riskScore: number,
  date: Date = new Date()
): AdvancedFallRiskPrediction => ({
  riskScore,
  riskLevel: riskScore < 20 ? 'low' : riskScore < 40 ? 'moderate' : 'high',
  confidence: 0.85,
  shortTermRisk: riskScore * 0.8,
  mediumTermRisk: riskScore * 0.9,
  longTermRisk: riskScore,
  gaitRisk: {
    overallScore: riskScore * 0.3,
    walkingSteadiness: 50,
    stepVariability: 20,
    gaitAsymmetry: 15,
    walkingSpeed: 1.2,
    cadenceVariability: 10,
    strideLengthVariability: 8,
    doubleSupportTime: 0.2,
    trends: { improving: [], declining: [], stable: [] },
  },
  balanceRisk: {
    overallScore: riskScore * 0.25,
    staticBalance: 60,
    dynamicBalance: 55,
    posturalControl: 50,
    reactionTime: 0.3,
    stabilityIndex: 0.7,
    fallHistory: {
      totalFalls: 0,
      recentFalls: 0,
      fallFrequency: 0,
      lastFallDate: null,
    },
  },
  environmentalRisk: {
    overallScore: riskScore * 0.15,
    homeHazards: 30,
    weatherConditions: 20,
    lightingConditions: 25,
    terrainDifficulty: 15,
    locationComplexity: 10,
    timeOfDayRisk: 20,
  },
  physiologicalRisk: {
    overallScore: riskScore * 0.2,
    cardiovascularHealth: 70,
    muscleStrength: 65,
    flexibility: 60,
    visionHealth: 75,
    medicationEffects: 30,
    cognitiveFunction: 80,
    sleepQuality: 70,
  },
  behavioralRisk: {
    overallScore: riskScore * 0.1,
    activityLevel: 60,
    riskTakingBehavior: 20,
    adherenceToRecommendations: 70,
    socialSupport: 75,
    healthcareEngagement: 80,
  },
  primaryRiskFactors: [],
  secondaryRiskFactors: [],
  protectiveFactors: [],
  interventions: [],
  emergencyActions: [],
  algorithmVersion: '2.1.0',
  modelEnsemble: [],
  lastUpdated: date,
  nextAssessment: new Date(date.getTime() + 7 * 24 * 60 * 60 * 1000),
});

describe('useFallRiskHistory', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty history', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    expect(result.current.history).toEqual([]);
    expect(result.current.isLoading).toBe(false);
  });

  it('loads history from localStorage on mount', () => {
    const prediction = createMockPrediction(35);
    const historyData = [
      {
        date: prediction.lastUpdated,
        riskScore: prediction.riskScore,
        riskLevel: prediction.riskLevel,
        gaitRisk: prediction.gaitRisk.overallScore,
        balanceRisk: prediction.balanceRisk.overallScore,
        environmentalRisk: prediction.environmentalRisk.overallScore,
        physiologicalRisk: prediction.physiologicalRisk.overallScore,
        behavioralRisk: prediction.behavioralRisk.overallScore,
        prediction,
      },
    ];

    localStorageMock.setItem(
      'vitalsense-fall-risk-history',
      JSON.stringify(historyData)
    );

    const { result } = renderHook(() => useFallRiskHistory());

    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].riskScore).toBe(35);
  });

  it('adds prediction to history', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    const prediction = createMockPrediction(40);

    act(() => {
      result.current.addPrediction(prediction);
    });

    expect(result.current.history.length).toBe(1);
    expect(result.current.history[0].riskScore).toBe(40);
  });

  it('saves to localStorage when adding prediction', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    const prediction = createMockPrediction(45);

    act(() => {
      result.current.addPrediction(prediction);
    });

    const stored = localStorageMock.getItem('vitalsense-fall-risk-history');
    expect(stored).toBeTruthy();

    const parsed = JSON.parse(stored!);
    expect(parsed.length).toBe(1);
    expect(parsed[0].riskScore).toBe(45);
  });

  it('limits history to MAX_HISTORY_ITEMS', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    // Add more than MAX_HISTORY_ITEMS (100)
    act(() => {
      for (let i = 0; i < 105; i++) {
        const prediction = createMockPrediction(i, new Date(2024, 0, i + 1));
        result.current.addPrediction(prediction);
      }
    });

    expect(result.current.history.length).toBe(100);
  });

  it('clears history', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    const prediction = createMockPrediction(35);
    act(() => {
      result.current.addPrediction(prediction);
    });

    expect(result.current.history.length).toBe(1);

    act(() => {
      result.current.clearHistory();
    });

    expect(result.current.history.length).toBe(0);
    expect(
      localStorageMock.getItem('vitalsense-fall-risk-history')
    ).toBeNull();
  });

  it('gets latest prediction', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    const prediction1 = createMockPrediction(30, new Date('2024-01-01'));
    const prediction2 = createMockPrediction(40, new Date('2024-01-02'));

    act(() => {
      result.current.addPrediction(prediction1);
      result.current.addPrediction(prediction2);
    });

    const latest = result.current.getLatest();
    expect(latest).toBeTruthy();
    expect(latest!.riskScore).toBe(40); // Most recent
  });

  it('returns null for latest when history is empty', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    const latest = result.current.getLatest();
    expect(latest).toBeNull();
  });

  it('calculates trend correctly', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    // Add predictions with improving trend
    act(() => {
      result.current.addPrediction(createMockPrediction(50, new Date('2024-01-01')));
      result.current.addPrediction(createMockPrediction(40, new Date('2024-01-02')));
      result.current.addPrediction(createMockPrediction(30, new Date('2024-01-03')));
    });

    const trend = result.current.getTrend();
    expect(trend.trend).toBe('improving');
    expect(trend.change).toBeLessThan(0); // Risk decreased
  });

  it('calculates declining trend', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    act(() => {
      result.current.addPrediction(createMockPrediction(30, new Date('2024-01-01')));
      result.current.addPrediction(createMockPrediction(40, new Date('2024-01-02')));
      result.current.addPrediction(createMockPrediction(50, new Date('2024-01-03')));
    });

    const trend = result.current.getTrend();
    expect(trend.trend).toBe('declining');
    expect(trend.change).toBeGreaterThan(0); // Risk increased
  });

  it('calculates stable trend', () => {
    const { result } = renderHook(() => useFallRiskHistory());

    act(() => {
      result.current.addPrediction(createMockPrediction(35, new Date('2024-01-01')));
      result.current.addPrediction(createMockPrediction(36, new Date('2024-01-02')));
      result.current.addPrediction(createMockPrediction(34, new Date('2024-01-03')));
    });

    const trend = result.current.getTrend();
    expect(trend.trend).toBe('stable');
  });

  it('handles localStorage errors gracefully', () => {
    // Mock localStorage to throw error
    const originalGetItem = localStorage.getItem;
    localStorage.getItem = vi.fn(() => {
      throw new Error('Storage error');
    });

    const { result } = renderHook(() => useFallRiskHistory());

    // Should still work, just with empty history
    expect(result.current.history).toEqual([]);

    // Restore
    localStorage.getItem = originalGetItem;
  });
});
