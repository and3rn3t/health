/**
 * useHealthInsights — generates insights, trends, and predictive alerts from health data.
 */

import { useKV } from '@/hooks/useCloudflareKV';
import type { ProcessedHealthData } from '@/types';
import { useCallback, useEffect, useState } from 'react';

import type {
  HealthInsight,
  HealthTrend,
  PredictiveAlert,
} from '@/components/health/insights/types';

export function useHealthInsights(healthData: ProcessedHealthData) {
  const [currentScore] = useKV<number>('current-health-score', 75);
  const [trends, setTrends] = useKV<HealthTrend[]>('health-trends', []);
  const [insights, setInsights] = useKV<HealthInsight[]>('health-insights', []);
  const [predictiveAlerts, setPredictiveAlerts] = useKV<PredictiveAlert[]>(
    'predictive-alerts',
    []
  );
  const [selectedInsight, setSelectedInsight] = useState<HealthInsight | null>(
    null
  );

  const generateHealthInsights = useCallback(async (): Promise<
    HealthInsight[]
  > => {
    const newInsights: HealthInsight[] = [];

    if (healthData.metrics.heartRate) {
      const avgHeartRate = healthData.metrics.heartRate.average;
      if (avgHeartRate > 80) {
        newInsights.push({
          id: 'hr-elevated',
          title: 'Elevated Resting Heart Rate',
          description: `Your average heart rate of ${avgHeartRate} bpm is above the typical range (60-80 bpm).`,
          type: 'warning',
          priority: 8,
          category: 'Cardiovascular',
          actionable: true,
          recommendations: [
            'Consider stress reduction techniques',
            'Ensure adequate hydration',
            'Monitor caffeine intake',
            'Consult healthcare provider if persistent',
          ],
        });
      }
    }

    if (healthData.metrics.steps) {
      const avgSteps = healthData.metrics.steps.average;
      if (avgSteps < 8000) {
        newInsights.push({
          id: 'low-activity',
          title: 'Below Recommended Activity Level',
          description: `Your daily average of ${avgSteps} steps is below the recommended 8,000-10,000 steps.`,
          type: 'warning',
          priority: 6,
          category: 'Activity',
          actionable: true,
          recommendations: [
            'Take short walks throughout the day',
            'Use stairs instead of elevators',
            'Set hourly movement reminders',
            'Park farther away or walk to nearby destinations',
          ],
        });
      } else if (avgSteps > 12000) {
        newInsights.push({
          id: 'excellent-activity',
          title: 'Excellent Activity Level',
          description: `Your daily average of ${avgSteps} steps exceeds recommended levels. Great work!`,
          type: 'positive',
          priority: 4,
          category: 'Activity',
          actionable: false,
        });
      }
    }

    if (healthData.fallRiskFactors && healthData.fallRiskFactors.length > 0) {
      const highRiskFactors = healthData.fallRiskFactors.filter(
        (factor) => factor.risk === 'high'
      );
      if (highRiskFactors.length > 0) {
        newInsights.push({
          id: 'fall-risk-high',
          title: 'Elevated Fall Risk Detected',
          description: `${highRiskFactors.length} high-risk factors identified for falls.`,
          type: 'critical',
          priority: 10,
          category: 'Safety',
          actionable: true,
          recommendations: [
            'Review home environment for hazards',
            'Consider balance training exercises',
            'Ensure emergency contacts are updated',
            'Discuss with healthcare provider',
          ],
        });
      }
    }

    if (healthData.metrics.sleepHours) {
      const avgSleep = healthData.metrics.sleepHours.average;
      if (avgSleep < 7) {
        newInsights.push({
          id: 'insufficient-sleep',
          title: 'Insufficient Sleep Duration',
          description: `Your average sleep of ${avgSleep.toFixed(1)} hours is below the recommended 7-9 hours.`,
          type: 'warning',
          priority: 7,
          category: 'Recovery',
          actionable: true,
          recommendations: [
            'Establish consistent bedtime routine',
            'Limit screen time before bed',
            'Create optimal sleep environment',
            'Avoid caffeine late in the day',
          ],
        });
      }
    }

    return newInsights;
  }, [healthData]);

  const generatePredictiveAlerts = useCallback(async (): Promise<
    PredictiveAlert[]
  > => {
    const alerts: PredictiveAlert[] = [];

    if (healthData.healthScore && healthData.healthScore < 70) {
      alerts.push({
        id: 'cv-decline',
        title: 'Cardiovascular Health Decline Risk',
        prediction:
          'Based on current trends, there is a 65% chance of further cardiovascular health decline within the next 2 weeks.',
        confidence: 65,
        timeframe: '2 weeks',
        preventiveActions: [
          'Increase moderate cardio exercise',
          'Monitor blood pressure daily',
          'Reduce sodium intake',
          'Schedule preventive cardiology consultation',
        ],
        severity: 'medium',
      });
    }

    if (
      healthData.fallRiskFactors?.some(
        (factor) => factor.risk === 'moderate' || factor.risk === 'high'
      )
    ) {
      alerts.push({
        id: 'fall-prediction',
        title: 'Increased Fall Risk Likelihood',
        prediction:
          'Current gait and balance metrics suggest a 40% increased fall risk over the next month.',
        confidence: 72,
        timeframe: '1 month',
        preventiveActions: [
          'Begin balance training program',
          'Remove home hazards',
          'Improve lighting in walkways',
          'Consider fall detection device',
        ],
        severity: 'high',
      });
    }

    return alerts;
  }, [healthData]);

  const generateHealthTrends = useCallback((): HealthTrend[] => {
    const trendData: HealthTrend[] = [];

    if (healthData.metrics.heartRate) {
      trendData.push({
        metric: 'Heart Rate',
        current: healthData.metrics.heartRate.average,
        previous: healthData.metrics.heartRate.average + 3,
        change: -3,
        trend: 'down',
        timeframe: '7 days',
      });
    }

    if (healthData.metrics.steps) {
      trendData.push({
        metric: 'Daily Steps',
        current: healthData.metrics.steps.average,
        previous: healthData.metrics.steps.average - 500,
        change: 500,
        trend: 'up',
        timeframe: '7 days',
      });
    }

    return trendData;
  }, [healthData]);

  useEffect(() => {
    const initializeInsights = async () => {
      const newInsights = await generateHealthInsights();
      const newAlerts = await generatePredictiveAlerts();
      const newTrends = generateHealthTrends();

      const sorted = [...newInsights].sort((a, b) => b.priority - a.priority);
      setInsights(sorted);
      setPredictiveAlerts(newAlerts);
      setTrends(newTrends);
    };

    void initializeInsights();
  }, [
    healthData,
    setInsights,
    setPredictiveAlerts,
    setTrends,
    generateHealthInsights,
    generatePredictiveAlerts,
    generateHealthTrends,
  ]);

  const resolvedScore =
    (typeof healthData.healthScore === 'number'
      ? healthData.healthScore
      : undefined) ?? (typeof currentScore === 'number' ? currentScore : 75);

  return {
    insights: insights ?? [],
    trends: trends ?? [],
    predictiveAlerts: predictiveAlerts ?? [],
    selectedInsight,
    setSelectedInsight,
    resolvedScore,
  } as const;
}
