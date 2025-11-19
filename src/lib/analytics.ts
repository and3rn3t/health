/**
 * Analytics Utilities and Types
 * Comprehensive analytics calculations and data processing
 */

import type { ProcessedHealthData, MetricData } from '@/lib/healthDataProcessor';

export type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';
export type MetricType = 'steps' | 'heartRate' | 'walkingSteadiness' | 'sleepHours' | 'activeEnergy' | 'distanceWalking';
export type TrendDirection = 'improving' | 'stable' | 'declining' | 'volatile';

export interface TimeSeriesDataPoint {
  date: Date;
  value: number;
  label?: string;
}

export interface TrendAnalysis {
  direction: TrendDirection;
  slope: number; // Rate of change per day
  rSquared: number; // Goodness of fit (0-1)
  confidence: number; // Confidence in trend (0-1)
  changePercent: number; // Percentage change over period
  volatility: number; // Standard deviation / mean
  prediction?: {
    nextValue: number;
    nextDate: Date;
    confidence: number;
  };
}

export interface CorrelationAnalysis {
  metric1: string;
  metric2: string;
  correlation: number; // -1 to 1
  strength: 'strong' | 'moderate' | 'weak' | 'none';
  significance: number; // Statistical significance (0-1)
  sampleSize: number;
  interpretation: string;
}

export interface PatternDetection {
  pattern: 'daily' | 'weekly' | 'seasonal' | 'irregular';
  strength: number; // 0-1
  description: string;
  peakTimes?: string[];
  lowTimes?: string[];
}

export interface AnomalyDetection {
  anomalies: Anomaly[];
  anomalyScore: number; // 0-1, higher = more anomalies
  normalRange: { min: number; max: number };
}

export interface Anomaly {
  date: Date;
  value: number;
  expectedValue: number;
  deviation: number; // Standard deviations from expected
  severity: 'low' | 'moderate' | 'high' | 'critical';
  type: 'spike' | 'drop' | 'outlier';
  explanation: string;
}

export interface MetricComparison {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: TrendDirection;
  percentile: number; // 0-100, where user stands
}

export interface AnalyticsSummary {
  timeRange: TimeRange;
  totalDataPoints: number;
  metricsAnalyzed: string[];
  overallHealthScore: number;
  healthScoreTrend: TrendDirection;
  keyInsights: string[];
  anomalies: number;
  correlations: CorrelationAnalysis[];
  patterns: PatternDetection[];
}

/**
 * Calculate trend analysis for a time series
 */
export function calculateTrend(
  data: TimeSeriesDataPoint[],
  days: number = 30
): TrendAnalysis {
  if (data.length < 2) {
    return {
      direction: 'stable',
      slope: 0,
      rSquared: 0,
      confidence: 0,
      changePercent: 0,
      volatility: 0,
    };
  }

  // Filter to last N days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const filtered = data.filter((d) => d.date >= cutoff);

  if (filtered.length < 2) {
    return {
      direction: 'stable',
      slope: 0,
      rSquared: 0,
      confidence: 0,
      changePercent: 0,
      volatility: 0,
    };
  }

  // Calculate linear regression
  const n = filtered.length;
  const xValues = filtered.map((_, i) => i);
  const yValues = filtered.map((d) => d.value);

  const xMean = xValues.reduce((a, b) => a + b, 0) / n;
  const yMean = yValues.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominatorX = 0;
  let denominatorY = 0;

  for (let i = 0; i < n; i++) {
    const xDiff = xValues[i] - xMean;
    const yDiff = yValues[i] - yMean;
    numerator += xDiff * yDiff;
    denominatorX += xDiff * xDiff;
    denominatorY += yDiff * yDiff;
  }

  const slope = denominatorX > 0 ? numerator / denominatorX : 0;
  const rSquared = denominatorX * denominatorY > 0
    ? (numerator * numerator) / (denominatorX * denominatorY)
    : 0;

  // Calculate volatility
  const variance = yValues.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const volatility = yMean > 0 ? stdDev / yMean : 0;

  // Determine direction
  const firstValue = yValues[0];
  const lastValue = yValues[yValues.length - 1];
  const changePercent = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  let direction: TrendDirection = 'stable';
  if (Math.abs(changePercent) < 2) {
    direction = volatility > 0.2 ? 'volatile' : 'stable';
  } else if (changePercent > 5) {
    direction = 'improving';
  } else if (changePercent < -5) {
    direction = 'declining';
  }

  // Calculate confidence
  const confidence = Math.min(1, Math.max(0, rSquared * (n / 30))); // More data = higher confidence

  // Predict next value
  const nextIndex = n;
  const nextValue = yMean + slope * (nextIndex - xMean);
  const nextDate = new Date(filtered[filtered.length - 1].date);
  nextDate.setDate(nextDate.getDate() + 1);

  return {
    direction,
    slope,
    rSquared,
    confidence,
    changePercent: Math.abs(changePercent),
    volatility,
    prediction: {
      nextValue,
      nextDate,
      confidence: Math.min(confidence, 0.8), // Cap prediction confidence
    },
  };
}

/**
 * Calculate correlation between two metrics
 */
export function calculateCorrelation(
  data1: TimeSeriesDataPoint[],
  data2: TimeSeriesDataPoint[]
): CorrelationAnalysis {
  // Align data by date
  const aligned: Array<{ date: Date; value1: number; value2: number }> = [];
  const dateMap1 = new Map(data1.map((d) => [d.date.getTime(), d.value]));
  const dateMap2 = new Map(data2.map((d) => [d.date.getTime(), d.value]));

  const allDates = new Set([...dateMap1.keys(), ...dateMap2.keys()]);
  for (const dateTime of allDates) {
    const val1 = dateMap1.get(dateTime);
    const val2 = dateMap2.get(dateTime);
    if (val1 !== undefined && val2 !== undefined) {
      aligned.push({
        date: new Date(dateTime),
        value1: val1,
        value2: val2,
      });
    }
  }

  if (aligned.length < 3) {
    return {
      metric1: 'unknown',
      metric2: 'unknown',
      correlation: 0,
      strength: 'none',
      significance: 0,
      sampleSize: aligned.length,
      interpretation: 'Insufficient data for correlation analysis',
    };
  }

  const values1 = aligned.map((d) => d.value1);
  const values2 = aligned.map((d) => d.value2);

  const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
  const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;

  let numerator = 0;
  let denominator1 = 0;
  let denominator2 = 0;

  for (let i = 0; i < aligned.length; i++) {
    const diff1 = values1[i] - mean1;
    const diff2 = values2[i] - mean2;
    numerator += diff1 * diff2;
    denominator1 += diff1 * diff1;
    denominator2 += diff2 * diff2;
  }

  const correlation = denominator1 * denominator2 > 0
    ? numerator / Math.sqrt(denominator1 * denominator2)
    : 0;

  const absCorr = Math.abs(correlation);
  let strength: 'strong' | 'moderate' | 'weak' | 'none' = 'none';
  if (absCorr > 0.7) strength = 'strong';
  else if (absCorr > 0.4) strength = 'moderate';
  else if (absCorr > 0.2) strength = 'weak';

  // Calculate significance (simplified)
  const significance = Math.min(1, Math.max(0, absCorr * (aligned.length / 30)));

  let interpretation = '';
  if (absCorr > 0.7) {
    interpretation = correlation > 0
      ? 'Strong positive correlation - these metrics move together'
      : 'Strong negative correlation - these metrics move in opposite directions';
  } else if (absCorr > 0.4) {
    interpretation = correlation > 0
      ? 'Moderate positive correlation'
      : 'Moderate negative correlation';
  } else {
    interpretation = 'Weak or no significant correlation';
  }

  return {
    metric1: 'metric1',
    metric2: 'metric2',
    correlation,
    strength,
    significance,
    sampleSize: aligned.length,
    interpretation,
  };
}

/**
 * Detect patterns in time series data
 */
export function detectPatterns(data: TimeSeriesDataPoint[]): PatternDetection[] {
  if (data.length < 7) {
    return [{
      pattern: 'irregular',
      strength: 0,
      description: 'Insufficient data for pattern detection',
    }];
  }

  const patterns: PatternDetection[] = [];

  // Daily pattern (hourly if available, otherwise day-of-week)
  const dayOfWeekGroups: Record<number, number[]> = {};
  data.forEach((point) => {
    const day = point.date.getDay();
    if (!dayOfWeekGroups[day]) dayOfWeekGroups[day] = [];
    dayOfWeekGroups[day].push(point.value);
  });

  if (Object.keys(dayOfWeekGroups).length >= 5) {
    const dayAverages = Object.entries(dayOfWeekGroups).map(([day, values]) => ({
      day: parseInt(day),
      avg: values.reduce((a, b) => a + b, 0) / values.length,
    }));

    const variance = calculateVariance(dayAverages.map((d) => d.avg));
    const overallAvg = dayAverages.reduce((sum, d) => sum + d.avg, 0) / dayAverages.length;
    const strength = Math.min(1, variance / (overallAvg * 0.1));

    if (strength > 0.3) {
      const peakDay = dayAverages.reduce((max, d) => d.avg > max.avg ? d : max);
      const lowDay = dayAverages.reduce((min, d) => d.avg < min.avg ? d : min);

      patterns.push({
        pattern: 'weekly',
        strength,
        description: `Weekly pattern detected with peak on ${getDayName(peakDay.day)} and low on ${getDayName(lowDay.day)}`,
        peakTimes: [getDayName(peakDay.day)],
        lowTimes: [getDayName(lowDay.day)],
      });
    }
  }

  // If no strong patterns, mark as irregular
  if (patterns.length === 0) {
    patterns.push({
      pattern: 'irregular',
      strength: 0.2,
      description: 'No strong patterns detected - data appears irregular',
    });
  }

  return patterns;
}

/**
 * Detect anomalies in time series data
 */
export function detectAnomalies(
  data: TimeSeriesDataPoint[],
  threshold: number = 2.5
): AnomalyDetection {
  if (data.length < 3) {
    return {
      anomalies: [],
      anomalyScore: 0,
      normalRange: { min: 0, max: 0 },
    };
  }

  const values = data.map((d) => d.value);
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);

  const anomalies: Anomaly[] = [];
  const normalRange = {
    min: mean - threshold * stdDev,
    max: mean + threshold * stdDev,
  };

  data.forEach((point, index) => {
    const deviation = stdDev > 0 ? Math.abs(point.value - mean) / stdDev : 0;

    if (deviation > threshold) {
      const previousValue = index > 0 ? data[index - 1].value : mean;
      const nextValue = index < data.length - 1 ? data[index + 1].value : mean;

      let type: 'spike' | 'drop' | 'outlier' = 'outlier';
      if (point.value > previousValue && point.value > nextValue) type = 'spike';
      else if (point.value < previousValue && point.value < nextValue) type = 'drop';

      let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
      if (deviation > 4) severity = 'critical';
      else if (deviation > 3) severity = 'high';
      else if (deviation > 2.5) severity = 'moderate';

      anomalies.push({
        date: point.date,
        value: point.value,
        expectedValue: mean,
        deviation,
        severity,
        type,
        explanation: `${type} detected: ${point.value.toFixed(1)} (expected ~${mean.toFixed(1)})`,
      });
    }
  });

  const anomalyScore = Math.min(1, anomalies.length / (data.length * 0.1));

  return {
    anomalies,
    anomalyScore,
    normalRange,
  };
}

/**
 * Compare current vs previous period
 */
export function comparePeriods(
  current: TimeSeriesDataPoint[],
  previous: TimeSeriesDataPoint[]
): MetricComparison {
  const currentAvg = current.length > 0
    ? current.reduce((sum, d) => sum + d.value, 0) / current.length
    : 0;
  const previousAvg = previous.length > 0
    ? previous.reduce((sum, d) => sum + d.value, 0) / previous.length
    : 0;

  const change = currentAvg - previousAvg;
  const changePercent = previousAvg > 0 ? (change / previousAvg) * 100 : 0;

  let trend: TrendDirection = 'stable';
  if (Math.abs(changePercent) < 2) trend = 'stable';
  else if (changePercent > 5) trend = 'improving';
  else if (changePercent < -5) trend = 'declining';

  // Calculate percentile (simplified - would use population data in production)
  const percentile = 50; // Placeholder

  return {
    metric: 'unknown',
    current: currentAvg,
    previous: previousAvg,
    change,
    changePercent: Math.abs(changePercent),
    trend,
    percentile,
  };
}

/**
 * Extract time series from metric data
 */
export function extractTimeSeries(
  metric: MetricData | undefined,
  timeRange: TimeRange = '30d'
): TimeSeriesDataPoint[] {
  if (!metric) return [];

  let source: Array<{ date: string; value: number }> = [];
  const cutoff = new Date();

  switch (timeRange) {
    case '7d':
      cutoff.setDate(cutoff.getDate() - 7);
      source = metric.daily || [];
      break;
    case '30d':
      cutoff.setDate(cutoff.getDate() - 30);
      source = metric.daily || [];
      break;
    case '90d':
      cutoff.setDate(cutoff.getDate() - 90);
      source = metric.daily || [];
      break;
    case '1y':
      cutoff.setFullYear(cutoff.getFullYear() - 1);
      source = metric.monthly || [];
      break;
    default:
      source = metric.daily || [];
  }

  return source
    .filter((d) => new Date(d.date) >= cutoff)
    .map((d) => ({
      date: new Date(d.date),
      value: d.value,
    }))
    .sort((a, b) => a.date.getTime() - b.date.getTime());
}

/**
 * Calculate variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  return variance;
}

/**
 * Get day name
 */
function getDayName(day: number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[day] || 'Unknown';
}

/**
 * Generate analytics summary
 */
export function generateAnalyticsSummary(
  healthData: ProcessedHealthData[],
  timeRange: TimeRange = '30d'
): AnalyticsSummary {
  const metrics = healthData[0]?.metrics || {};
  const metricsAnalyzed = Object.keys(metrics);

  const healthScores = healthData
    .filter((d) => d.healthScore !== undefined)
    .map((d) => d.healthScore || 0);
  const overallHealthScore = healthScores.length > 0
    ? healthScores.reduce((a, b) => a + b, 0) / healthScores.length
    : 0;

  // Calculate health score trend
  if (healthScores.length >= 2) {
    const recent = healthScores.slice(-7);
    const older = healthScores.slice(0, -7);
    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
    const change = ((recentAvg - olderAvg) / olderAvg) * 100;
    // Trend calculation would go here
  }

  return {
    timeRange,
    totalDataPoints: healthData.length,
    metricsAnalyzed,
    overallHealthScore,
    healthScoreTrend: 'stable',
    keyInsights: [],
    anomalies: 0,
    correlations: [],
    patterns: [],
  };
}
