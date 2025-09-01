/**
 * Health Data Processing Utilities
 * Handles parsing, validation, and analysis of Apple Health data exports
 */

export interface HealthMetric {
  date: string;
  value: number;
  unit?: string;
}

export interface ProcessedHealthData {
  lastUpdated: string;
  dataQuality: {
    completeness: number;
    consistency: number;
    recency: number;
    overall: 'excellent' | 'good' | 'fair' | 'poor';
  };
  metrics: {
    steps: MetricData;
    heartRate: MetricData;
    walkingSteadiness: MetricData;
    sleepHours: MetricData;
    bodyWeight?: MetricData;
    bloodPressure?: MetricData;
    activeEnergy?: MetricData;
    distanceWalking?: MetricData;
  };
  insights: string[];
  fallRiskFactors: FallRiskFactor[];
  healthScore: number;
}

export interface MetricData {
  daily: HealthMetric[];
  weekly: HealthMetric[];
  monthly: HealthMetric[];
  average: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  variability: number;
  reliability: number;
  lastValue: number;
  percentileRank: number;
}

export interface FallRiskFactor {
  factor: string;
  risk: 'low' | 'moderate' | 'high';
  impact: number;
  recommendation: string;
}

/**
 * Processes raw health data and returns structured analytics
 */
export class HealthDataProcessor {
  private static generateTimeSeriesData(
    days: number,
    baseValue: number,
    variance: number,
    trend: number = 0
  ): HealthMetric[] {
    return Array.from({ length: days }, (_, i) => {
      const trendComponent = trend * i;
      const randomComponent = (Math.random() - 0.5) * variance;
      const value = Math.max(0, baseValue + trendComponent + randomComponent);

      return {
        date: new Date(Date.now() - (days - 1 - i) * 24 * 60 * 60 * 1000)
          .toISOString()
          .split('T')[0],
        value: Math.round(value * 100) / 100,
      };
    });
  }

  private static calculateTrend(
    data: HealthMetric[]
  ): 'increasing' | 'decreasing' | 'stable' {
    if (data.length < 3) return 'stable';

    const recentValues = data.slice(-7).map((d) => d.value);
    const olderValues = data.slice(-14, -7).map((d) => d.value);

    const recentAvg =
      recentValues.reduce((a, b) => a + b, 0) / recentValues.length;
    const olderAvg =
      olderValues.reduce((a, b) => a + b, 0) / olderValues.length;

    const changePercent = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercent > 5) return 'increasing';
    if (changePercent < -5) return 'decreasing';
    return 'stable';
  }

  private static calculateVariability(data: HealthMetric[]): number {
    if (data.length < 2) return 0;

    const values = data.map((d) => d.value);
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;

    return (Math.sqrt(variance) / mean) * 100; // Coefficient of variation
  }

  private static aggregateToWeekly(daily: HealthMetric[]): HealthMetric[] {
    const weekly: HealthMetric[] = [];

    for (let i = 0; i < daily.length; i += 7) {
      const weekData = daily.slice(i, i + 7);
      if (weekData.length > 0) {
        const weekAvg =
          weekData.reduce((sum, day) => sum + day.value, 0) / weekData.length;
        weekly.push({
          date: weekData[weekData.length - 1].date, // End of week
          value: Math.round(weekAvg * 100) / 100,
        });
      }
    }

    return weekly;
  }

  private static processMetric(
    daily: HealthMetric[],
    metricName: string
  ): MetricData {
    const average = daily.reduce((sum, d) => sum + d.value, 0) / daily.length;
    const trend = this.calculateTrend(daily);
    const variability = this.calculateVariability(daily);
    const weekly = this.aggregateToWeekly(daily);
    const monthly = this.aggregateToWeekly(weekly);

    // Calculate reliability based on data consistency
    const reliability = Math.max(0, 100 - variability);

    // Calculate percentile rank (simplified)
    const sortedValues = daily.map((d) => d.value).sort((a, b) => a - b);
    const lastValue = daily[daily.length - 1]?.value || 0;
    const percentileRank =
      (sortedValues.filter((v) => v <= lastValue).length /
        sortedValues.length) *
      100;

    return {
      daily,
      weekly,
      monthly,
      average: Math.round(average * 100) / 100,
      trend,
      variability: Math.round(variability * 100) / 100,
      reliability: Math.round(reliability * 100) / 100,
      lastValue,
      percentileRank: Math.round(percentileRank),
    };
  }

  private static generateInsights(
    metrics: ProcessedHealthData['metrics']
  ): string[] {
    const insights: string[] = [];

    // Walking steadiness insights
    if (metrics.walkingSteadiness.average < 60) {
      insights.push(
        `Walking steadiness is below average (${Math.round(metrics.walkingSteadiness.average)}%). Consider balance exercises and consulting your healthcare provider.`
      );
    } else if (metrics.walkingSteadiness.trend === 'decreasing') {
      insights.push(
        `Walking steadiness has declined by ${Math.round(metrics.walkingSteadiness.variability)}% recently. Monitor for changes and consider preventive measures.`
      );
    }

    // Activity insights
    if (metrics.steps.average < 5000) {
      insights.push(
        `Daily step count is below recommended levels. Aim for gradual increases in physical activity.`
      );
    } else if (metrics.steps.trend === 'increasing') {
      insights.push(
        `Great progress! Your activity levels have increased by ${Math.round(((metrics.steps.lastValue - metrics.steps.average) / metrics.steps.average) * 100)}% recently.`
      );
    }

    // Heart rate insights
    if (metrics.heartRate.variability > 15) {
      insights.push(
        `Heart rate shows high variability. This could indicate stress or irregular patterns worth discussing with your doctor.`
      );
    }

    // Sleep insights
    if (metrics.sleepHours.average < 7) {
      insights.push(
        `Sleep duration is below recommended 7-9 hours. Poor sleep can affect balance and increase fall risk.`
      );
    }

    // Correlation insights
    if (
      metrics.steps.trend === 'increasing' &&
      metrics.sleepHours.trend === 'increasing'
    ) {
      insights.push(
        `Your increased activity appears to correlate with better sleep quality - an excellent positive cycle!`
      );
    }

    return insights;
  }

  private static calculateFallRiskFactors(
    metrics: ProcessedHealthData['metrics']
  ): FallRiskFactor[] {
    const factors: FallRiskFactor[] = [];

    // Walking steadiness factor
    if (metrics.walkingSteadiness.average < 50) {
      factors.push({
        factor: 'Walking Steadiness',
        risk: 'high',
        impact: 40,
        recommendation:
          'Consult with a physical therapist for balance training exercises',
      });
    } else if (metrics.walkingSteadiness.average < 70) {
      factors.push({
        factor: 'Walking Steadiness',
        risk: 'moderate',
        impact: 25,
        recommendation:
          'Practice daily balance exercises and consider tai chi classes',
      });
    }

    // Activity level factor
    if (metrics.steps.average < 3000) {
      factors.push({
        factor: 'Low Activity Level',
        risk: 'high',
        impact: 30,
        recommendation:
          'Gradually increase daily movement with safe, supervised activities',
      });
    } else if (metrics.steps.average < 5000) {
      factors.push({
        factor: 'Moderate Activity Level',
        risk: 'moderate',
        impact: 15,
        recommendation: 'Aim for 6,000-8,000 steps daily through regular walks',
      });
    }

    // Heart rate variability factor
    if (metrics.heartRate.variability > 20) {
      factors.push({
        factor: 'Heart Rate Irregularity',
        risk: 'moderate',
        impact: 20,
        recommendation:
          'Monitor cardiovascular health and consult with your physician',
      });
    }

    return factors;
  }

  private static calculateDataQuality(
    metrics: ProcessedHealthData['metrics']
  ): ProcessedHealthData['dataQuality'] {
    // Calculate completeness (how much data we have)
    const expectedDays = 30;
    const actualDays = Math.max(
      metrics.steps.daily.length,
      metrics.heartRate.daily.length,
      metrics.walkingSteadiness.daily.length
    );
    const completeness = (actualDays / expectedDays) * 100;

    // Calculate consistency (how reliable the data is)
    const avgReliability =
      [
        metrics.steps.reliability,
        metrics.heartRate.reliability,
        metrics.walkingSteadiness.reliability,
      ].reduce((a, b) => a + b, 0) / 3;

    // Calculate recency (how recent the data is)
    const lastDataDate = new Date(
      metrics.steps.daily[metrics.steps.daily.length - 1]?.date || 0
    );
    const daysSinceLastData = Math.floor(
      (Date.now() - lastDataDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const recency = Math.max(0, 100 - daysSinceLastData * 10);

    const overall = (completeness + avgReliability + recency) / 3;

    let overallRating: 'excellent' | 'good' | 'fair' | 'poor';
    if (overall >= 85) overallRating = 'excellent';
    else if (overall >= 70) overallRating = 'good';
    else if (overall >= 50) overallRating = 'fair';
    else overallRating = 'poor';

    return {
      completeness: Math.round(completeness),
      consistency: Math.round(avgReliability),
      recency: Math.round(recency),
      overall: overallRating,
    };
  }

  private static calculateHealthScore(
    metrics: ProcessedHealthData['metrics'],
    fallRiskFactors: FallRiskFactor[]
  ): number {
    let score = 100;

    // Deduct points for fall risk factors
    const totalRiskImpact = fallRiskFactors.reduce(
      (sum, factor) => sum + factor.impact,
      0
    );
    score -= totalRiskImpact;

    // Bonus points for good trends
    if (metrics.steps.trend === 'increasing') score += 5;
    if (metrics.walkingSteadiness.trend === 'increasing') score += 10;
    if (metrics.sleepHours.average >= 7) score += 5;

    return Math.max(0, Math.min(100, Math.round(score)));
  }

  /**
   * Main processing function that converts raw data into structured analytics
   */
  static async processHealthData(file?: File): Promise<ProcessedHealthData> {
    // For now, generate realistic mock data
    // In a real implementation, this would parse the actual Apple Health XML

    const steps = this.generateTimeSeriesData(90, 6500, 2000, -10);
    const heartRate = this.generateTimeSeriesData(90, 68, 8, 0.1);
    const walkingSteadiness = this.generateTimeSeriesData(90, 75, 15, -0.5);
    const sleepHours = this.generateTimeSeriesData(90, 7.2, 1.5, 0.02);
    const bodyWeight = this.generateTimeSeriesData(90, 70, 2, -0.01);
    const activeEnergy = this.generateTimeSeriesData(90, 450, 150, -2);

    const processedMetrics = {
      steps: this.processMetric(steps, 'steps'),
      heartRate: this.processMetric(heartRate, 'heartRate'),
      walkingSteadiness: this.processMetric(
        walkingSteadiness,
        'walkingSteadiness'
      ),
      sleepHours: this.processMetric(sleepHours, 'sleepHours'),
      bodyWeight: this.processMetric(bodyWeight, 'bodyWeight'),
      activeEnergy: this.processMetric(activeEnergy, 'activeEnergy'),
      distanceWalking: this.processMetric(
        steps.map((s) => ({ ...s, value: s.value * 0.0008 })), // Convert steps to km
        'distanceWalking'
      ),
    };

    const fallRiskFactors = this.calculateFallRiskFactors(processedMetrics);
    const insights = this.generateInsights(processedMetrics);
    const dataQuality = this.calculateDataQuality(processedMetrics);
    const healthScore = this.calculateHealthScore(
      processedMetrics,
      fallRiskFactors
    );

    return {
      lastUpdated: new Date().toISOString(),
      dataQuality,
      metrics: processedMetrics,
      insights,
      fallRiskFactors,
      healthScore,
    };
  }
}

/**
 * Real Apple Health XML parsing would happen here
 * This is a placeholder for the actual implementation
 */
export async function parseAppleHealthXML(xmlContent: string): Promise<any> {
  // TODO: Implement actual XML parsing
  // Would extract HKQuantityTypeIdentifier records for:
  // - HKQuantityTypeIdentifierStepCount
  // - HKQuantityTypeIdentifierHeartRate
  // - HKQuantityTypeIdentifierAppleWalkingSteadiness
  // - HKQuantityTypeIdentifierSleepAnalysis
  // - etc.

  throw new Error('Apple Health XML parsing not yet implemented');
}
