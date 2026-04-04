/**
 * Sample Health Data Generator
 * Provides realistic sample data for development and testing
 */

import { ProcessedHealthData } from '@/lib/healthDataProcessor';

/**
 * Generates sample health data for demonstration and testing purposes
 */
export function generateSampleHealthData(): ProcessedHealthData {
  const now = new Date();
  const generateMetricData = (
    baseValue: number,
    variance: number,
    trend: 'increasing' | 'decreasing' | 'stable' = 'stable'
  ) => {
    const dailyData = Array.from({ length: 30 }, (_, i) => ({
      date: new Date(now.getTime() - (29 - i) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      value: Math.max(0, baseValue + (Math.random() - 0.5) * variance), // NOSONAR: Sample data
    }));

    const weeklyData = Array.from({ length: 12 }, (_, i) => ({
      date: new Date(now.getTime() - (11 - i) * 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      value: Math.max(0, baseValue + (Math.random() - 0.5) * variance * 1.5), // NOSONAR
    }));

    const monthlyData = Array.from({ length: 6 }, (_, i) => ({
      date: new Date(now.getTime() - (5 - i) * 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      value: Math.max(0, baseValue + (Math.random() - 0.5) * variance * 2), // NOSONAR
    }));

    return {
      daily: dailyData,
      weekly: weeklyData,
      monthly: monthlyData,
      average: baseValue,
      trend,
      variability: variance / baseValue,
      reliability: 0.8 + Math.random() * 0.2, // NOSONAR
      lastValue: dailyData[dailyData.length - 1].value,
      percentileRank: 50 + (Math.random() - 0.5) * 40, // NOSONAR
    };
  };

  return {
    lastUpdated: now.toISOString(),
    dataQuality: {
      completeness: 0.85 + Math.random() * 0.15, // NOSONAR
      consistency: 0.8 + Math.random() * 0.2, // NOSONAR
      recency: 0.9 + Math.random() * 0.1, // NOSONAR
      overall: 'good' as const,
    },
    metrics: {
      steps: generateMetricData(8500, 2000, 'stable'),
      heartRate: generateMetricData(68, 8, 'stable'),
      walkingSteadiness: generateMetricData(85, 10, 'increasing'),
      sleepHours: generateMetricData(7.2, 1.5, 'stable'),
      bodyWeight: generateMetricData(70, 2, 'stable'),
      bloodPressure: generateMetricData(120, 15, 'stable'),
      activeEnergy: generateMetricData(420, 80, 'increasing'),
      distanceWalking: generateMetricData(6.2, 1.8, 'stable'),
    },
    insights: [
      'Your walking steadiness has improved by 12% over the past month',
      'Sleep quality is consistent with recommended 7-8 hours per night',
      'Heart rate variability indicates good cardiovascular health',
      'Daily step count exceeds recommended 8,000 steps on most days',
    ],
    fallRiskFactors: [
      {
        factor: 'Walking Steadiness',
        risk: 'low' as const,
        impact: 0.15,
        recommendation:
          'Continue current balance exercises to maintain stability',
      },
      {
        factor: 'Medication Effects',
        risk: 'moderate' as const,
        impact: 0.3,
        recommendation:
          'Review medications with healthcare provider for dizziness side effects',
      },
      {
        factor: 'Environmental Hazards',
        risk: 'low' as const,
        impact: 0.1,
        recommendation:
          'Home safety assessment shows good lighting and clear pathways',
      },
    ],
    healthScore: 78 + Math.round(Math.random() * 15), // NOSONAR
  };
}

/**
 * Generates sample health data with specific fall risk characteristics
 */
export function generateHighRiskSampleData(): ProcessedHealthData {
  const baseData = generateSampleHealthData();

  return {
    ...baseData,
    metrics: {
      ...baseData.metrics,
      walkingSteadiness: {
        ...baseData.metrics.walkingSteadiness,
        average: 45, // Low walking steadiness
        trend: 'decreasing' as const,
        lastValue: 42,
      },
      heartRate: {
        ...baseData.metrics.heartRate,
        average: 85, // Elevated resting heart rate
        variability: 0.25, // Higher variability
      },
    },
    fallRiskFactors: [
      {
        factor: 'Walking Steadiness',
        risk: 'high' as const,
        impact: 0.7,
        recommendation:
          'Immediate physical therapy consultation recommended for balance training',
      },
      {
        factor: 'Medication Effects',
        risk: 'high' as const,
        impact: 0.6,
        recommendation:
          'Urgent medication review needed - multiple fall-risk medications detected',
      },
      {
        factor: 'Previous Falls',
        risk: 'moderate' as const,
        impact: 0.4,
        recommendation:
          'History of recent falls increases risk - enhanced monitoring recommended',
      },
      {
        factor: 'Vision Problems',
        risk: 'moderate' as const,
        impact: 0.35,
        recommendation:
          'Eye examination recommended - vision changes affect fall risk',
      },
    ],
    healthScore: 45 + Math.round(Math.random() * 10), // NOSONAR: Lower health score
    insights: [
      '⚠️ Walking steadiness has declined significantly over the past month',
      '⚠️ Multiple fall risk factors have been identified',
      'Immediate intervention recommended to reduce fall risk',
      'Healthcare provider consultation is strongly advised',
    ],
  };
}
