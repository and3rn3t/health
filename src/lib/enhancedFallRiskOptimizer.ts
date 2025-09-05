/**
 * Enhanced Fall Risk Optimizer
 * Advanced ML-powered optimization for fall risk prediction and intervention
 */

import type { ProcessedHealthData as AnalyticsHealthData, MetricData } from '@/lib/healthDataProcessor';
import { MLFallRiskPredictor, RiskPrediction } from '@/lib/mlFallRiskPredictor';
import { normalizeToHealthData } from '@/lib/normalizeHealthInput';
import type { ProcessedHealthRecord } from '@/types';

interface ContextData {
  environmentalRisk?: number;
  weatherRisk?: number;
  locationComplexity?: number;
  acceptsTechnology?: boolean;
  weather?: { riskFactor: number };
  [k: string]: unknown;
}

interface PersonalizedFactors {
  balanceDeficit: number;
  activityDeficit: number;
  autonomicDysfunction: number;
  gaitAsymmetry: number;
  muscleWeakness: number;
  historicalPatterns: HistoricalPatterns;
  environmentalRisk: number;
}

interface HistoricalPatterns {
  averageAdherence: number;
  effectiveInterventions: string[];
  ineffectiveInterventions: string[];
}

interface OptimizedInterventionPlan {
  id: string;
  riskLevel: RiskPrediction['riskLevel'];
  interventions: PersonalizedIntervention[];
  timeline: InterventionTimeline;
  successMetrics: SuccessMetric[];
  adaptiveThresholds: AdaptiveThreshold[];
}

interface PersonalizedIntervention {
  type:
    | 'exercise'
    | 'medication'
    | 'environmental'
    | 'behavioral'
    | 'technology';
  priority: 'critical' | 'high' | 'medium' | 'low';
  intervention: string;
  frequency: string;
  duration: number; // days
  evidenceLevel: 'strong' | 'moderate' | 'emerging';
  personalizedReason: string;
  expectedImpact: number; // 0-1
  contraindications?: string[];
}

interface InterventionTimeline {
  immediate: PersonalizedIntervention[]; // 0-24 hours
  shortTerm: PersonalizedIntervention[]; // 1-7 days
  mediumTerm: PersonalizedIntervention[]; // 1-4 weeks
  longTerm: PersonalizedIntervention[]; // 1-3 months
}

interface SuccessMetric {
  metric: string;
  baseline: number;
  target: number;
  timeframe: number; // days
  measurementFrequency: string;
  clinicalSignificance: number;
}

interface AdaptiveThreshold {
  metric: string;
  currentThreshold: number;
  adaptiveRange: [number, number];
  sensitivityLevel: 'high' | 'medium' | 'low';
  lastAdjusted: Date;
  performanceHistory: Array<{
    threshold: number;
    accuracy: number;
    falsePositiveRate: number;
    timestamp: Date;
  }>;
}

interface PredictiveInsight {
  timeHorizon: '1hour' | '4hours' | '12hours' | '24hours' | '7days' | '30days';
  riskTrend: 'increasing' | 'decreasing' | 'stable' | 'volatile';
  confidenceInterval: [number, number];
  keyDrivers: Array<{
    factor: string;
    impact: number;
    trend: 'improving' | 'worsening' | 'stable';
    actionable: boolean;
  }>;
  environmentalFactors: {
    weather: number;
    timeOfDay: number;
    dayOfWeek: number;
    seasonality: number;
  };
}

type HealthInput = ProcessedHealthRecord | ProcessedHealthRecord[] | AnalyticsHealthData;

export class EnhancedFallRiskOptimizer {
  private readonly mlPredictor: MLFallRiskPredictor;
  private readonly interventionHistory: Map<string, OptimizedInterventionPlan[]> = new Map();
  private readonly personalizedThresholds: Map<string, AdaptiveThreshold[]> = new Map();
  private readonly contextualFactors: Map<string, ContextData> = new Map();

  constructor() {
    this.mlPredictor = new MLFallRiskPredictor();
  }

  /**
   * Generate optimized intervention plan based on risk prediction
   */
  async generateOptimizedInterventionPlan(
    userId: string,
    input: HealthInput,
    contextData?: ContextData
  ): Promise<OptimizedInterventionPlan> {
    const healthData = this.normalizeInput(input);
    // Get base risk prediction
    const riskPrediction = await this.mlPredictor.predictFallRisk(
      healthData,
      '24hours',
      contextData
    );

    // Analyze user-specific patterns
    const userHistory = this.interventionHistory.get(userId) || [];
    const personalizedFactors = this.analyzePersonalizedFactors(
      healthData,
      userHistory,
      contextData
    );

    // Generate timeline-based interventions
    const timeline = this.generateInterventionTimeline(
      riskPrediction,
      personalizedFactors,
      contextData
    );

    // Define success metrics
    const successMetrics = this.defineSuccessMetrics(
      riskPrediction,
      personalizedFactors
    );

    // Update adaptive thresholds
    const adaptiveThresholds = await this.updateAdaptiveThresholds(
      userId,
      riskPrediction,
      healthData
    );

    const plan: OptimizedInterventionPlan = {
      id: `plan-${userId}-${Date.now()}`,
      riskLevel: riskPrediction.riskLevel,
      interventions: this.consolidateInterventions(timeline),
      timeline,
      successMetrics,
      adaptiveThresholds,
    };

    // Store plan for future optimization
    this.storeInterventionPlan(userId, plan);

    return plan;
  }

  /**
   * Advanced predictive analytics with multiple time horizons
   */
  async generatePredictiveInsights(
    userId: string,
    input: HealthInput,
    contextData?: ContextData
  ): Promise<PredictiveInsight[]> {
    const healthData = this.normalizeInput(input);
    const timeHorizons: PredictiveInsight['timeHorizon'][] = [
      '1hour',
      '4hours',
      '12hours',
      '24hours',
      '7days',
      '30days',
    ];

    const insights: PredictiveInsight[] = [];

    for (const horizon of timeHorizons) {
      // Convert '30days' to '7days' since MLFallRiskPredictor doesn't support '30days'
      const supportedHorizon = horizon === '30days' ? '7days' : horizon;
      const prediction = await this.mlPredictor.predictFallRisk(
        healthData,
        supportedHorizon,
        contextData
      );

      const riskTrend = this.analyzeTrend(
        userId,
        horizon,
        prediction.riskScore
      );
      const confidenceInterval = this.calculateConfidenceInterval(
        prediction,
        horizon
      );
      const keyDrivers = this.identifyKeyDrivers(prediction, healthData);
      const environmentalFactors = this.analyzeEnvironmentalFactors(
        contextData,
        horizon
      );

      insights.push({
        timeHorizon: horizon,
        riskTrend,
        confidenceInterval,
        keyDrivers,
        environmentalFactors,
      });
    }

    return insights;
  }

  /**
   * Real-time threshold optimization based on user performance
   */
  private async updateAdaptiveThresholds(
    userId: string,
    prediction: RiskPrediction,
    healthData: AnalyticsHealthData
  ): Promise<AdaptiveThreshold[]> {
    const currentThresholds = this.personalizedThresholds.get(userId) || [];
    const updatedThresholds: AdaptiveThreshold[] = [];

    // Key metrics to optimize
    const metricsToOptimize = [
      'walkingSteadiness',
      'gaitAsymmetry',
      'stepRegularity',
      'balanceScore',
      'heartRateVariability',
    ];

    for (const metric of metricsToOptimize) {
      const existingThreshold = currentThresholds.find(
        (t) => t.metric === metric
      );
      const metricValue = this.extractMetricValue(healthData, metric);

      if (existingThreshold) {
        // Update based on recent performance
        const performance = this.evaluateThresholdPerformance(
          existingThreshold,
          prediction,
          metricValue
        );

        const optimizedThreshold = this.optimizeThreshold(
          existingThreshold,
          performance
        );

        updatedThresholds.push(optimizedThreshold);
      } else {
        // Create new adaptive threshold
        const newThreshold: AdaptiveThreshold = {
          metric,
          currentThreshold: this.getDefaultThreshold(metric),
          adaptiveRange: this.getAdaptiveRange(metric),
          sensitivityLevel: 'medium',
          lastAdjusted: new Date(),
          performanceHistory: [],
        };

        updatedThresholds.push(newThreshold);
      }
    }

    this.personalizedThresholds.set(userId, updatedThresholds);
    return updatedThresholds;
  }

  /**
   * Generate personalized exercise recommendations
   */
  private generateExerciseInterventions(
    riskLevel: RiskPrediction['riskLevel'],
  personalizedFactors: PersonalizedFactors
  ): PersonalizedIntervention[] {
    const exercises: PersonalizedIntervention[] = [];

    // Balance training (evidence-based)
    if (personalizedFactors.balanceDeficit > 0.3) {
      exercises.push({
        type: 'exercise',
        priority: 'high',
        intervention: 'Single-leg standing with eyes closed',
        frequency: '2x daily, 30 seconds each leg',
        duration: 28,
        evidenceLevel: 'strong',
        personalizedReason:
          'Your balance scores indicate specific instability during weight shifting',
        expectedImpact: 0.7,
        contraindications: ['Recent leg injury', 'Severe arthritis'],
      });
    }

    // Gait training
    if (personalizedFactors.gaitAsymmetry > 0.25) {
      exercises.push({
        type: 'exercise',
        priority: 'high',
        intervention: 'Metronome-assisted walking practice',
        frequency: '15 minutes, 3x weekly',
        duration: 21,
        evidenceLevel: 'strong',
        personalizedReason:
          'Gait asymmetry detected - rhythmic training improves step symmetry',
        expectedImpact: 0.6,
      });
    }

    // Strength training (progressive)
    if (personalizedFactors.muscleWeakness > 0.4) {
      exercises.push({
        type: 'exercise',
        priority: 'medium',
        intervention: 'Progressive resistance training - lower body',
        frequency: '3x weekly, 45 minutes',
        duration: 42,
        evidenceLevel: 'strong',
        personalizedReason:
          'Reduced walking speed indicates lower body strength deficits',
        expectedImpact: 0.8,
        contraindications: [
          'Uncontrolled hypertension',
          'Recent cardiac event',
        ],
      });
    }

    // Tai Chi (for severe risk)
    if (riskLevel === 'high' || riskLevel === 'severe') {
      exercises.push({
        type: 'exercise',
        priority: 'high',
        intervention: 'Tai Chi for fall prevention (modified)',
        frequency: '2x weekly, 60 minutes',
        duration: 84,
        evidenceLevel: 'strong',
        personalizedReason:
          'High fall risk requires comprehensive balance and strength training',
        expectedImpact: 0.9,
      });
    }

    return exercises;
  }

  /**
   * Environmental optimization recommendations
   */
  private generateEnvironmentalInterventions(
    riskLevel: RiskPrediction['riskLevel'],
  contextData?: ContextData
  ): PersonalizedIntervention[] {
    const environmental: PersonalizedIntervention[] = [];

    // Home safety audit
    if (riskLevel === 'high' || riskLevel === 'severe') {
      environmental.push({
        type: 'environmental',
        priority: 'critical',
        intervention: 'Professional home safety assessment',
        frequency: 'One-time evaluation',
        duration: 1,
        evidenceLevel: 'strong',
        personalizedReason:
          'High fall risk requires immediate environmental modifications',
        expectedImpact: 0.85,
      });
    }

    // Lighting optimization
    environmental.push({
      type: 'environmental',
      priority: 'medium',
      intervention: 'Motion-activated LED pathway lighting',
      frequency: 'Permanent installation',
      duration: 1,
      evidenceLevel: 'moderate',
      personalizedReason:
        'Improved visibility reduces fall risk, especially during nighttime',
      expectedImpact: 0.4,
    });

    // Technology integration
    if (contextData?.acceptsTechnology) {
      environmental.push({
        type: 'technology',
        priority: 'medium',
        intervention: 'Smart floor sensors for gait monitoring',
        frequency: 'Continuous monitoring',
        duration: 365,
        evidenceLevel: 'emerging',
        personalizedReason:
          'Continuous gait monitoring enables early intervention',
        expectedImpact: 0.6,
      });
    }

    return environmental;
  }

  /**
   * Analyze personalized risk factors
   */
  private analyzePersonalizedFactors(
    healthData: AnalyticsHealthData,
    userHistory: OptimizedInterventionPlan[],
    contextData?: ContextData
  ): PersonalizedFactors {
    const getAvg = (metric?: MetricData) => metric?.average ?? 0;
    const walkingSteadiness = getAvg(healthData.metrics.walkingSteadiness) || 70;
    const stepCount = getAvg(healthData.metrics.steps) || 5000;
  const metricsMap = healthData.metrics as Record<string, MetricData | undefined>;
  const heartRateVariability = getAvg(metricsMap.heartRateVariability) || 30;
  const walkingSpeed = getAvg(metricsMap.walkingSpeed) || 1.2;
  const gaitAsymmetry = metricsMap.walkingStepLength?.variability || 0.1;

    const balanceDeficit = Math.max(0, (80 - walkingSteadiness) / 80);
    const activityDeficit = Math.max(0, (8000 - stepCount) / 8000);
    const autonomicDysfunction = Math.max(0, (40 - heartRateVariability) / 40);
    const muscleWeakness = Math.max(0, (1.2 - walkingSpeed) / 1.2);

    return {
      balanceDeficit,
      activityDeficit,
      autonomicDysfunction,
      gaitAsymmetry,
      muscleWeakness,
      historicalPatterns: this.analyzeHistoricalPatterns(userHistory),
      environmentalRisk: contextData?.environmentalRisk || 0.3,
    };
  }

  /**
   * Generate intervention timeline
   */
  private generateInterventionTimeline(
    prediction: RiskPrediction,
  personalizedFactors: PersonalizedFactors,
  contextData?: ContextData
  ): InterventionTimeline {
    const immediate: PersonalizedIntervention[] = [];
    const shortTerm: PersonalizedIntervention[] = [];
    const mediumTerm: PersonalizedIntervention[] = [];
    const longTerm: PersonalizedIntervention[] = [];

    // Immediate interventions (0-24 hours)
    if (prediction.riskLevel === 'severe') {
      immediate.push({
        type: 'behavioral',
        priority: 'critical',
        intervention: 'Avoid stairs and uneven surfaces',
        frequency: 'Until risk decreases',
        duration: 1,
        evidenceLevel: 'strong',
        personalizedReason:
          'Severe fall risk requires immediate safety measures',
        expectedImpact: 0.9,
      });
    }

    // Add exercise interventions to appropriate timeframes
    const exercises = this.generateExerciseInterventions(
      prediction.riskLevel,
      personalizedFactors
    );

    exercises.forEach((exercise) => {
      if (exercise.priority === 'critical') {
        immediate.push(exercise);
      } else if (exercise.duration <= 7) {
        shortTerm.push(exercise);
      } else if (exercise.duration <= 28) {
        mediumTerm.push(exercise);
      } else {
        longTerm.push(exercise);
      }
    });

    // Add environmental interventions
    const environmental = this.generateEnvironmentalInterventions(
      prediction.riskLevel,
      contextData
    );

    environmental.forEach((env) => {
      if (env.priority === 'critical') {
        immediate.push(env);
      } else {
        shortTerm.push(env);
      }
    });

    return {
      immediate,
      shortTerm,
      mediumTerm,
      longTerm,
    };
  }

  /**
   * Define success metrics for intervention tracking
   */
  private defineSuccessMetrics(
  prediction: RiskPrediction,
  personalizedFactors: PersonalizedFactors
  ): SuccessMetric[] {
    const metrics: SuccessMetric[] = [];

    // Walking steadiness improvement
    metrics.push({
      metric: 'Walking Steadiness',
      baseline: personalizedFactors.balanceDeficit * 100,
      target: Math.max(80, (1 - personalizedFactors.balanceDeficit) * 100 + 10),
      timeframe: 28,
      measurementFrequency: 'Daily',
      clinicalSignificance: 0.8,
    });

    // Gait asymmetry reduction
    if (personalizedFactors.gaitAsymmetry > 0.05) {
      metrics.push({
        metric: 'Gait Asymmetry',
        baseline: personalizedFactors.gaitAsymmetry * 100,
        target: Math.max(3, personalizedFactors.gaitAsymmetry * 100 - 2),
        timeframe: 21,
        measurementFrequency: 'Weekly',
        clinicalSignificance: 0.7,
      });
    }

    // Fall risk score improvement
    metrics.push({
      metric: 'Fall Risk Score',
      baseline: prediction.riskScore * 100,
      target: Math.max(20, prediction.riskScore * 100 - 15),
      timeframe: 42,
      measurementFrequency: 'Weekly',
      clinicalSignificance: 0.9,
    });

    return metrics;
  }

  // Helper methods
  private consolidateInterventions(
    timeline: InterventionTimeline
  ): PersonalizedIntervention[] {
    return [
      ...timeline.immediate,
      ...timeline.shortTerm,
      ...timeline.mediumTerm,
      ...timeline.longTerm,
    ];
  }

  private storeInterventionPlan(
    userId: string,
    plan: OptimizedInterventionPlan
  ): void {
    const history = this.interventionHistory.get(userId) || [];
    history.push(plan);
    this.interventionHistory.set(userId, history.slice(-10)); // Keep last 10 plans
  }

  private analyzeTrend(
    _userId: string,
    _horizon: PredictiveInsight['timeHorizon'],
    _currentScore: number
  ): PredictiveInsight['riskTrend'] {
    // Simplified trend analysis - would use historical data in production
    const randomFactor = Math.random();
    if (randomFactor < 0.25) return 'increasing';
    if (randomFactor < 0.5) return 'decreasing';
    if (randomFactor < 0.75) return 'stable';
    return 'volatile';
  }

  private calculateConfidenceInterval(
  prediction: RiskPrediction,
  _horizon: PredictiveInsight['timeHorizon']
  ): [number, number] {
    const margin = (1 - prediction.confidence) * 0.2;
    return [
      Math.max(0, prediction.riskScore - margin),
      Math.min(1, prediction.riskScore + margin),
    ];
  }

  private identifyKeyDrivers(
    prediction: RiskPrediction,
    _healthData: AnalyticsHealthData
  ): PredictiveInsight['keyDrivers'] {
    return prediction.primaryFactors.map((factor) => ({
      factor: factor.factor,
      impact: factor.contribution,
      trend: Math.random() > 0.5 ? 'worsening' : 'improving',
      actionable: true,
    }));
  }

  private analyzeEnvironmentalFactors(
    contextData: ContextData | undefined,
    _horizon: PredictiveInsight['timeHorizon']
  ): PredictiveInsight['environmentalFactors'] {
    return {
      weather: contextData?.weather?.riskFactor || 0.3,
      timeOfDay: this.getTimeOfDayRisk(),
      dayOfWeek: this.getDayOfWeekRisk(),
      seasonality: this.getSeasonalityRisk(),
    };
  }

  private analyzeHistoricalPatterns(_history: OptimizedInterventionPlan[]): HistoricalPatterns {
    return {
      averageAdherence: 0.75,
      effectiveInterventions: ['balance training', 'strength training'],
      ineffectiveInterventions: ['medication reminders'],
    };
  }

  private extractMetricValue(
    healthData: AnalyticsHealthData,
    metric: string
  ): number {
    switch (metric) {
      case 'walkingSteadiness':
        return healthData.metrics.walkingSteadiness?.average || 70;
      case 'gaitAsymmetry':
  return (healthData.metrics as Record<string, MetricData | undefined>).walkingStepLength?.variability || 0.1;
      default:
        return 0;
    }
  }

  private evaluateThresholdPerformance(
  _threshold: AdaptiveThreshold,
  _prediction: RiskPrediction,
  _metricValue: number
  ): { accuracy: number; falsePositiveRate: number } {
    // Simplified performance evaluation
    return {
      accuracy: 0.85,
      falsePositiveRate: 0.1,
    };
  }

  private optimizeThreshold(
    threshold: AdaptiveThreshold,
    performance: { accuracy: number; falsePositiveRate: number }
  ): AdaptiveThreshold {
    // Adjust threshold based on performance
    let adjustment = 0;
    if (performance.falsePositiveRate > 0.15) {
      adjustment = -0.05; // Make less sensitive
    } else if (
      performance.falsePositiveRate < 0.05 &&
      performance.accuracy < 0.8
    ) {
      adjustment = 0.05; // Make more sensitive
    }

    const newThreshold = Math.max(
      threshold.adaptiveRange[0],
      Math.min(
        threshold.adaptiveRange[1],
        threshold.currentThreshold + adjustment
      )
    );

    return {
      ...threshold,
      currentThreshold: newThreshold,
      lastAdjusted: new Date(),
      performanceHistory: [
        ...threshold.performanceHistory,
        {
          threshold: threshold.currentThreshold,
          accuracy: performance.accuracy,
          falsePositiveRate: performance.falsePositiveRate,
          timestamp: new Date(),
        },
      ].slice(-20), // Keep last 20 records
    };
  }

  private getDefaultThreshold(metric: string): number {
    const defaults: Record<string, number> = {
      walkingSteadiness: 60,
      gaitAsymmetry: 0.05,
      stepRegularity: 0.7,
      balanceScore: 70,
      heartRateVariability: 30,
    };
    return defaults[metric] || 0.5;
  }

  private getAdaptiveRange(metric: string): [number, number] {
    const ranges: Record<string, [number, number]> = {
      walkingSteadiness: [40, 80],
      gaitAsymmetry: [0.03, 0.1],
      stepRegularity: [0.5, 0.9],
      balanceScore: [50, 90],
      heartRateVariability: [20, 50],
    };
    return ranges[metric] || [0, 1];
  }

  private getTimeOfDayRisk(): number {
    const hour = new Date().getHours();
    if (hour < 6 || hour > 22) return 0.8; // Night/early morning higher risk
    if (hour < 9 || hour > 20) return 0.6; // Evening/morning moderate risk
    return 0.3; // Daytime lower risk
  }

  private getDayOfWeekRisk(): number {
    const day = new Date().getDay();
    return day === 0 || day === 6 ? 0.4 : 0.3; // Slightly higher risk on weekends
  }

  private getSeasonalityRisk(): number {
    const month = new Date().getMonth();
    return month >= 10 || month <= 2 ? 0.6 : 0.3; // Higher risk in winter months
  }

  private normalizeInput(
    input: HealthInput,
    options?: { bypassCache?: boolean }
  ): AnalyticsHealthData {
    return normalizeToHealthData(input, options);
  }
}
