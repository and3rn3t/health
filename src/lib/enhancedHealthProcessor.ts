/**
 * Enhanced Health Data Processing Service
 * Handles advanced analytics, trend analysis, and anomaly detection
 */

import type {
  HealthMetric,
  HealthMetricBatch,
  HealthMetricType,
  ProcessedHealthData,
} from '@/schemas/health';

export interface HealthDataAnalytics {
  wellnessScore: number;
  riskFactors: RiskFactor[];
  trendAnalysis: TrendAnalysis;
  recommendations: HealthRecommendation[];
  alerts: HealthAlert[];
}

export interface RiskFactor {
  type: 'fall_risk' | 'cardiac_event' | 'sleep_disorder' | 'activity_decline';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  description: string;
  contributingFactors: string[];
}

export interface TrendAnalysis {
  metricType: HealthMetricType;
  direction: 'improving' | 'stable' | 'declining';
  changeRate: number; // percentage change over time period
  significance: number; // statistical significance
  timeframe: string; // e.g., "7 days", "30 days"
}

export interface HealthRecommendation {
  category: 'exercise' | 'sleep' | 'nutrition' | 'medical' | 'lifestyle';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  title: string;
  description: string;
  actionable: boolean;
  estimatedImpact: string;
}

export interface HealthAlert {
  id: string;
  level: 'info' | 'warning' | 'critical' | 'emergency';
  metricType: HealthMetricType;
  message: string;
  actionRequired: boolean;
  expiresAt?: Date;
  createdAt: Date;
}

export class HealthDataProcessor {
  /**
   * Process a single health metric into structured analytics
   */
  static async processHealthMetric(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): Promise<ProcessedHealthData> {
    const processedAt = new Date().toISOString();
    const id = crypto.randomUUID();

    // Basic validation
    const validated = this.validateMetric(metric);

    // Calculate health score
    const healthScore = this.calculateHealthScore(metric, historicalData);

    // Assess fall risk
    const fallRisk = this.assessFallRisk(metric, historicalData);

    // Trend analysis
    const trendAnalysis = this.analyzeTrend(metric, historicalData);

    // Anomaly detection
    const anomalyScore = this.detectAnomaly(metric, historicalData);

    // Generate alerts
    const alert = this.generateAlert(
      metric,
      healthScore,
      fallRisk,
      anomalyScore
    );

    // Data quality assessment
    const dataQuality = this.assessDataQuality(metric, historicalData);

    return {
      id,
      type: metric.type,
      value: metric.value,
      unit: metric.unit,
      timestamp: metric.timestamp || new Date().toISOString(),
      processedAt,
      validated,
      healthScore,
      fallRisk,
      trendAnalysis,
      anomalyScore,
      alert,
      source: {
        deviceId: metric.deviceId || 'unknown',
        userId: metric.userId || 'unknown',
        collectedAt: metric.timestamp || new Date().toISOString(),
        processingPipeline: 'enhanced-analytics-v1',
      },
      dataQuality,
    };
  }

  /**
   * Process a batch of health metrics
   */
  static async processHealthBatch(
    batch: HealthMetricBatch,
    historicalData?: ProcessedHealthData[]
  ): Promise<ProcessedHealthData[]> {
    const processed: ProcessedHealthData[] = [];

    for (const metric of batch.metrics) {
      try {
        const processedMetric = await this.processHealthMetric(
          metric,
          historicalData
        );
        processed.push(processedMetric);
      } catch (error) {
        console.error(`Failed to process metric ${metric.type}:`, error);
        // Create error record for audit trail
        processed.push(this.createErrorRecord(metric, error as Error));
      }
    }

    return processed;
  }

  /**
   * Validate health metric data
   */
  private static validateMetric(metric: HealthMetric): boolean {
    // Basic range validation
    const ranges: Record<HealthMetricType, { min: number; max: number }> = {
      heart_rate: { min: 30, max: 220 },
      walking_steadiness: { min: 0, max: 100 },
      steps: { min: 0, max: 100000 },
      oxygen_saturation: { min: 70, max: 100 },
      sleep_hours: { min: 0, max: 24 },
      body_weight: { min: 20, max: 500 },
      active_energy: { min: 0, max: 10000 },
      distance_walking: { min: 0, max: 100 },
      blood_pressure_systolic: { min: 70, max: 250 },
      blood_pressure_diastolic: { min: 40, max: 150 },
      body_temperature: { min: 95, max: 110 },
      respiratory_rate: { min: 8, max: 40 },
      fall_event: { min: 0, max: 1 },
    };

    const range = ranges[metric.type];
    return metric.value >= range.min && metric.value <= range.max;
  }

  /**
   * Calculate health score based on metric and trends
   */
  private static calculateHealthScore(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): number {
    let score = 50; // baseline

    // Metric-specific scoring
    score += this.getMetricSpecificScore(metric);

    // Trend bonus/penalty
    score += this.getTrendAdjustment(metric, historicalData);

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Get metric-specific health score contribution
   */
  private static getMetricSpecificScore(metric: HealthMetric): number {
    switch (metric.type) {
      case 'heart_rate':
        return this.getHeartRateScore(metric.value);
      case 'walking_steadiness':
        return this.getWalkingSteadinessScore(metric.value);
      case 'steps':
        return this.getStepsScore(metric.value);
      case 'oxygen_saturation':
        return this.getOxygenSaturationScore(metric.value);
      default:
        return 0;
    }
  }

  private static getHeartRateScore(value: number): number {
    if (value >= 60 && value <= 100) return 20;
    if (value < 60 || value > 100) return -10;
    if (value < 40 || value > 120) return -30;
    return 0;
  }

  private static getWalkingSteadinessScore(value: number): number {
    if (value >= 75) return 25;
    if (value >= 50) return 10;
    if (value >= 25) return -10;
    return -30;
  }

  private static getStepsScore(value: number): number {
    if (value >= 8000) return 20;
    if (value >= 5000) return 10;
    if (value >= 2000) return -5;
    return -20;
  }

  private static getOxygenSaturationScore(value: number): number {
    if (value >= 95) return 15;
    if (value >= 90) return 5;
    return -25;
  }

  /**
   * Get trend-based score adjustment
   */
  private static getTrendAdjustment(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): number {
    if (!historicalData || historicalData.length < 3) return 0;

    const recentValues = historicalData
      .filter((d) => d.type === metric.type)
      .slice(-3)
      .map((d) => d.value);

    if (recentValues.length < 2) return 0;

    const trend = this.calculateTrend(recentValues);
    if (trend === 'improving') return 5;
    if (trend === 'declining') return -5;
    return 0;
  }

  /**
   * Assess fall risk based on metrics
   */
  private static assessFallRisk(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): 'low' | 'moderate' | 'high' | 'critical' {
    let riskScore = 0;

    if (metric.type === 'walking_steadiness') {
      if (metric.value < 25) riskScore += 40;
      else if (metric.value < 50) riskScore += 20;
      else if (metric.value < 75) riskScore += 10;
    }

    // Check for concerning patterns
    if (historicalData) {
      const recentMetrics = historicalData.filter((d) => {
        const age = Date.now() - new Date(d.timestamp).getTime();
        return age < 7 * 24 * 60 * 60 * 1000; // last 7 days
      });

      // Multiple concerning readings
      const concerningReadings = recentMetrics.filter(
        (d) =>
          (d.type === 'walking_steadiness' && d.value < 50) ||
          (d.type === 'heart_rate' && (d.value < 50 || d.value > 120))
      );

      if (concerningReadings.length >= 3) riskScore += 20;
    }

    if (riskScore >= 60) return 'critical';
    if (riskScore >= 40) return 'high';
    if (riskScore >= 20) return 'moderate';
    return 'low';
  }

  /**
   * Analyze trend direction and significance
   */
  private static analyzeTrend(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): ProcessedHealthData['trendAnalysis'] {
    if (!historicalData || historicalData.length < 3) {
      return {
        direction: 'stable',
        confidence: 0.5,
      };
    }

    const recentValues = historicalData
      .filter((d) => d.type === metric.type)
      .slice(-7) // last 7 readings
      .map((d) => d.value);

    if (recentValues.length < 3) {
      return {
        direction: 'stable',
        confidence: 0.5,
      };
    }

    const direction = this.calculateTrend(recentValues);
    const changePercent = this.calculateChangePercent(recentValues);
    const confidence = Math.min(1, recentValues.length / 7); // more data = higher confidence

    return {
      direction,
      confidence,
      changePercent,
    };
  }

  /**
   * Detect anomalies in health data
   */
  private static detectAnomaly(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): number {
    if (!historicalData || historicalData.length < 10) {
      return 0; // Not enough data for anomaly detection
    }

    const values = historicalData
      .filter((d) => d.type === metric.type)
      .map((d) => d.value);

    if (values.length < 10) return 0;

    const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
    const variance =
      values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);

    // Z-score based anomaly detection
    const zScore = Math.abs(metric.value - mean) / stdDev;

    // Convert z-score to anomaly score (0-1)
    return Math.min(1, zScore / 3); // 3 standard deviations = max anomaly
  }

  /**
   * Generate alerts based on metric analysis
   */
  private static generateAlert(
    metric: HealthMetric,
    healthScore: number,
    fallRisk: string,
    anomalyScore: number
  ): ProcessedHealthData['alert'] {
    // Critical health conditions
    if (
      metric.type === 'heart_rate' &&
      (metric.value < 40 || metric.value > 140)
    ) {
      return {
        level: 'critical',
        message: `Heart rate ${metric.value} bpm is outside safe range`,
        actionRequired: true,
        expiresAt: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(), // 4 hours
      };
    }

    if (metric.type === 'oxygen_saturation' && metric.value < 90) {
      return {
        level: 'critical',
        message: `Oxygen saturation ${metric.value}% is critically low`,
        actionRequired: true,
        expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(), // 2 hours
      };
    }

    if (fallRisk === 'critical') {
      return {
        level: 'critical',
        message: 'Critical fall risk detected - immediate attention required',
        actionRequired: true,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };
    }

    // Warning conditions
    if (healthScore < 30) {
      return {
        level: 'warning',
        message: 'Health score indicates concerning trends',
        actionRequired: false,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days
      };
    }

    if (anomalyScore > 0.8) {
      return {
        level: 'warning',
        message: 'Unusual reading detected - monitoring recommended',
        actionRequired: false,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours
      };
    }

    return null;
  }

  /**
   * Assess data quality metrics
   */
  private static assessDataQuality(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): ProcessedHealthData['dataQuality'] {
    const completeness = this.assessCompleteness(metric);
    const accuracy = this.assessAccuracy(metric);
    const timeliness = this.assessTimeliness(metric);
    const consistency = this.assessConsistency(metric, historicalData);

    return { completeness, accuracy, timeliness, consistency };
  }

  private static assessCompleteness(metric: HealthMetric): number {
    let score = 100;
    if (!metric.unit) score -= 10;
    if (!metric.timestamp) score -= 15;
    if (!metric.deviceId) score -= 5;
    return Math.max(0, score);
  }

  private static assessAccuracy(metric: HealthMetric): number {
    let score = 90; // assume good unless proven otherwise
    if (!this.validateMetric(metric)) score -= 30;
    return Math.max(0, score);
  }

  private static assessTimeliness(metric: HealthMetric): number {
    let score = 100;

    if (!metric.timestamp) return score;

    const age = Date.now() - new Date(metric.timestamp).getTime();
    const ageHours = age / (1000 * 60 * 60);

    if (ageHours > 24) score -= 20;
    else if (ageHours > 12) score -= 10;
    else if (ageHours > 6) score -= 5;

    return Math.max(0, score);
  }

  private static assessConsistency(
    metric: HealthMetric,
    historicalData?: ProcessedHealthData[]
  ): number {
    let score = 90;

    if (!historicalData || historicalData.length < 5) return score;

    const recentValues = historicalData
      .filter((d) => d.type === metric.type)
      .slice(-5)
      .map((d) => d.value);

    if (recentValues.length < 3) return score;

    const mean =
      recentValues.reduce((sum, v) => sum + v, 0) / recentValues.length;
    const deviation = Math.abs(metric.value - mean) / mean;

    if (deviation > 0.5)
      score -= 20; // >50% deviation
    else if (deviation > 0.25) score -= 10; // >25% deviation

    return Math.max(0, score);
  }

  /**
   * Create error record for failed processing
   */
  private static createErrorRecord(
    metric: HealthMetric,
    error: Error
  ): ProcessedHealthData {
    return {
      id: crypto.randomUUID(),
      type: metric.type,
      value: metric.value,
      unit: metric.unit,
      timestamp: metric.timestamp || new Date().toISOString(),
      processedAt: new Date().toISOString(),
      validated: false,
      alert: {
        level: 'warning',
        message: `Processing failed: ${error.message}`,
        actionRequired: false,
      },
      source: {
        deviceId: metric.deviceId || 'unknown',
        userId: metric.userId || 'unknown',
        collectedAt: metric.timestamp || new Date().toISOString(),
        processingPipeline: 'enhanced-analytics-v1',
      },
    };
  }

  /**
   * Helper: calculate trend direction
   */
  private static calculateTrend(
    values: number[]
  ): 'improving' | 'stable' | 'declining' {
    if (values.length < 2) return 'stable';

    const first = values[0];
    const last = values[values.length - 1];
    const changePercent = ((last - first) / first) * 100;

    if (changePercent > 5) return 'improving';
    if (changePercent < -5) return 'declining';
    return 'stable';
  }

  /**
   * Helper: calculate percentage change
   */
  private static calculateChangePercent(values: number[]): number {
    if (values.length < 2) return 0;

    const first = values[0];
    const last = values[values.length - 1];
    return ((last - first) / first) * 100;
  }
}
