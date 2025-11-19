/**
 * Hook for managing fall risk history data
 */

import { useCallback, useEffect, useState } from 'react';
import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';
import type { FallRiskHistoryDataPoint } from '@/components/health/FallRiskHistoryChart';

const STORAGE_KEY = 'vitalsense-fall-risk-history';
const MAX_HISTORY_ITEMS = 100;

export function useFallRiskHistory() {
  const [history, setHistory] = useState<FallRiskHistoryDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Convert date strings back to Date objects
        const historyData: FallRiskHistoryDataPoint[] = parsed.map((item: any) => ({
          ...item,
          date: new Date(item.date),
          prediction: {
            ...item.prediction,
            lastUpdated: new Date(item.prediction.lastUpdated),
            nextAssessment: new Date(item.prediction.nextAssessment),
          },
        }));
        setHistory(historyData);
      }
    } catch (error) {
      console.error('Failed to load fall risk history:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Save prediction to history
  const addPrediction = useCallback((prediction: AdvancedFallRiskPrediction) => {
    const newPoint: FallRiskHistoryDataPoint = {
      date: prediction.lastUpdated,
      riskScore: prediction.riskScore,
      riskLevel: prediction.riskLevel,
      gaitRisk: prediction.gaitRisk.overallScore,
      balanceRisk: prediction.balanceRisk.overallScore,
      environmentalRisk: prediction.environmentalRisk.overallScore,
      physiologicalRisk: prediction.physiologicalRisk.overallScore,
      behavioralRisk: prediction.behavioralRisk.overallScore,
      prediction,
    };

    setHistory((prev) => {
      // Add new prediction and keep only the most recent MAX_HISTORY_ITEMS
      const updated = [newPoint, ...prev].slice(0, MAX_HISTORY_ITEMS);

      // Save to localStorage
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save fall risk history:', error);
      }

      return updated;
    });
  }, []);

  // Clear history
  const clearHistory = useCallback(() => {
    setHistory([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear fall risk history:', error);
    }
  }, []);

  // Get latest prediction
  const getLatest = useCallback((): FallRiskHistoryDataPoint | null => {
    return history.length > 0 ? history[0] : null;
  }, [history]);

  // Get trend data
  const getTrend = useCallback(() => {
    if (history.length < 2) {
      return {
        trend: 'stable' as const,
        change: 0,
        changePercent: 0,
      };
    }

    const sorted = [...history].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    const first = sorted[0].riskScore;
    const last = sorted[sorted.length - 1].riskScore;
    const change = last - first;
    const changePercent = first > 0 ? (change / first) * 100 : 0;

    let trend: 'improving' | 'declining' | 'stable' = 'stable';
    if (changePercent < -5) trend = 'improving';
    else if (changePercent > 5) trend = 'declining';

    return {
      trend,
      change,
      changePercent: Math.abs(changePercent),
    };
  }, [history]);

  return {
    history,
    isLoading,
    addPrediction,
    clearHistory,
    getLatest,
    getTrend,
  };
}
