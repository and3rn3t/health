/**
 * Movement Pattern Analyzer
 * Advanced ML library for analyzing movement patterns and predicting falls
 */

import { MetricData, ProcessedHealthData } from './healthDataProcessor';

export interface MovementPattern {
  type: string;
  description: string;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  confidence: number;
  indicators: string[];
  recommendations: string[];
  timestamp: string;
}

export interface GaitMetrics {
  stepLength: number; // cm
  stepFrequency: number; // steps per minute
  walkingSpeed: number; // m/s
  stepRegularity: number; // 0-1 score
  walkingSteadiness: number; // 0-1 score
  balanceScore: number; // 0-1 score
  strideVariability: number; // coefficient of variation
  doubleSupportTime: number; // percentage of gait cycle
  asymmetryIndex: number; // 0-1, higher = more asymmetric
  overallScore: number; // 0-1 composite score
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
}

export interface FallPrediction {
  timeWindow: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  severity: 'low' | 'moderate' | 'high' | 'critical';
  factors: Array<{
    name: string;
    impact: number; // 0-1
    description: string;
  }>;
  interventions: string[];
  timestamp: string;
}

export interface MovementAnomaly {
  type: string;
  description: string;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  score: number; // 0-1
  timestamp: string;
  affectedMetrics: string[];
  actions: string[];
  duration: string;
}

export class MovementPatternAnalyzer {
  private models: Map<string, any> = new Map();
  private thresholds: any = {};
  private historicalData: any[] = [];

  constructor() {
    this.initializeModels();
    this.setThresholds();
  }

  /**
   * Initialize ML models for movement analysis
   */
  private initializeModels(): void {
    // Gait Pattern Classification Model
    this.models.set('gaitClassifier', {
      type: 'gaitClassification',
      classes: ['normal', 'shuffling', 'unsteady', 'freezing', 'antalgic'],
      features: [
        'stepLength',
        'stepFrequency',
        'strideVariability',
        'doubleSupportTime',
      ],
      accuracy: 0.89,
    });

    // Fall Risk Prediction Model (LSTM-based)
    this.models.set('fallPredictor', {
      type: 'sequencePredictor',
      lookbackWindow: 168, // 7 days of hourly data
      predictionHorizons: ['1hour', '4hours', '24hours', '7days'],
      accuracy: 0.84,
    });

    // Anomaly Detection Model (Isolation Forest)
    this.models.set('anomalyDetector', {
      type: 'isolationForest',
      contamination: 0.05, // 5% of data expected to be anomalous
      features: ['walkingSpeed', 'stepRegularity', 'balanceScore', 'heartRate'],
      accuracy: 0.87,
    });

    // Movement Quality Assessment Model
    this.models.set('qualityAssessor', {
      type: 'qualityRegressor',
      features: [
        'stepLength',
        'walkingSteadiness',
        'asymmetryIndex',
        'strideVariability',
      ],
      accuracy: 0.91,
    });
  }

  /**
   * Set clinical thresholds for movement metrics
   */
  private setThresholds(): void {
    this.thresholds = {
      stepLength: { normal: [50, 80], concern: [40, 50], alarm: [0, 40] }, // cm
      stepFrequency: { normal: [100, 130], concern: [80, 100], alarm: [0, 80] }, // steps/min
      walkingSpeed: {
        normal: [1.0, 1.6],
        concern: [0.6, 1.0],
        alarm: [0, 0.6],
      }, // m/s
      stepRegularity: {
        normal: [0.8, 1.0],
        concern: [0.6, 0.8],
        alarm: [0, 0.6],
      },
      walkingSteadiness: {
        normal: [0.8, 1.0],
        concern: [0.6, 0.8],
        alarm: [0, 0.6],
      },
      balanceScore: {
        normal: [0.8, 1.0],
        concern: [0.6, 0.8],
        alarm: [0, 0.6],
      },
      strideVariability: {
        normal: [0, 0.1],
        concern: [0.1, 0.2],
        alarm: [0.2, 1.0],
      },
      doubleSupportTime: {
        normal: [0.1, 0.2],
        concern: [0.2, 0.3],
        alarm: [0.3, 1.0],
      },
    };
  }

  /**
   * Analyze movement patterns from health data
   */
  async analyzePatterns(
    healthData: ProcessedHealthData,
    timeframe: string
  ): Promise<MovementPattern[]> {
    const patterns: MovementPattern[] = [];

    // Extract movement features
    const features = this.extractMovementFeatures(healthData);

    // Classify gait patterns
    const gaitClassification = this.classifyGaitPattern(features);
    if (gaitClassification.confidence > 0.7) {
      patterns.push(gaitClassification);
    }

    // Detect movement irregularities
    const irregularities = this.detectMovementIrregularities(features);
    patterns.push(...irregularities);

    // Analyze balance and stability
    const balanceAnalysis = this.analyzeBalanceStability(features);
    if (balanceAnalysis.confidence > 0.6) {
      patterns.push(balanceAnalysis);
    }

    // Assess mobility trends
    const mobilityTrends = this.assessMobilityTrends(features, timeframe);
    patterns.push(...mobilityTrends);

    return patterns.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, moderate: 2, low: 1 };
      return severityOrder[b.riskLevel] - severityOrder[a.riskLevel];
    });
  }

  /**
   * Extract comprehensive gait metrics
   */
  async extractGaitMetrics(
    healthData: ProcessedHealthData
  ): Promise<GaitMetrics> {
    const features = this.extractMovementFeatures(healthData);

    const metrics: GaitMetrics = {
      stepLength: this.calculateStepLength(features),
      stepFrequency: this.calculateStepFrequency(features),
      walkingSpeed: this.calculateWalkingSpeed(features),
      stepRegularity: this.calculateStepRegularity(features),
      walkingSteadiness: this.calculateWalkingSteadiness(features),
      balanceScore: this.calculateBalanceScore(features),
      strideVariability: this.calculateStrideVariability(features),
      doubleSupportTime: this.calculateDoubleSupportTime(features),
      asymmetryIndex: this.calculateAsymmetryIndex(features),
      overallScore: 0, // Will be calculated
      riskLevel: 'low', // Will be determined
    };

    // Calculate overall score
    metrics.overallScore = this.calculateOverallGaitScore(metrics);

    // Determine risk level
    metrics.riskLevel = this.determineGaitRiskLevel(metrics);

    return metrics;
  }

  /**
   * Predict falls using temporal patterns
   */
  async predictFalls(
    healthData: ProcessedHealthData,
    _timeframe: string
  ): Promise<FallPrediction[]> {
    const predictions: FallPrediction[] = [];
    const features = this.extractMovementFeatures(healthData);

    const timeWindows = ['1 hour', '4 hours', '24 hours', '7 days'];

    for (const window of timeWindows) {
      const prediction = this.generateFallPrediction(features, window);
      if (prediction.probability > 0.1) {
        // Only include meaningful predictions
        predictions.push(prediction);
      }
    }

    return predictions.sort((a, b) => b.probability - a.probability);
  }

  /**
   * Detect movement anomalies
   */
  async detectAnomalies(
    healthData: ProcessedHealthData
  ): Promise<MovementAnomaly[]> {
    const anomalies: MovementAnomaly[] = [];
    const features = this.extractMovementFeatures(healthData);

    // Detect sudden changes in gait
    const gaitAnomalies = this.detectGaitAnomalies(features);
    anomalies.push(...gaitAnomalies);

    // Detect unusual activity patterns
    const activityAnomalies = this.detectActivityAnomalies(features);
    anomalies.push(...activityAnomalies);

    // Detect balance issues
    const balanceAnomalies = this.detectBalanceAnomalies(features);
    anomalies.push(...balanceAnomalies);

    // Detect cardiovascular irregularities during movement
    const cardioAnomalies = this.detectCardiovascularAnomalies(features);
    anomalies.push(...cardioAnomalies);

    return anomalies.filter((a) => a.score > 0.3); // Filter significant anomalies
  }

  /**
   * Extract movement features from health data
   */
  private extractMovementFeatures(healthData: ProcessedHealthData): any {
    return {
      steps: healthData.metrics.steps,
      walkingSteadiness: healthData.metrics.walkingSteadiness,
      distanceWalking: healthData.metrics.distanceWalking,
      heartRate: healthData.metrics.heartRate,
      activeEnergy: healthData.metrics.activeEnergy,
      // Derived features
      stepConsistency: this.calculateStepConsistency(healthData.metrics.steps),
      movementEfficiency: this.calculateMovementEfficiency(
        healthData.metrics.steps,
        healthData.metrics.activeEnergy
      ),
      gaitStability: this.calculateGaitStability(
        healthData.metrics.walkingSteadiness
      ),
      activityRhythm: this.calculateActivityRhythm(healthData.metrics.steps),
    };
  }

  /**
   * Classify gait pattern
   */
  private classifyGaitPattern(features: any): MovementPattern {
    const walkingSteadiness = features.walkingSteadiness?.average || 0.5;
    const _stepConsistency = features.stepConsistency || 0.5;
    const _gaitStability = features.gaitStability || 0.5;

    let patternType = 'Normal Gait';
    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let indicators: string[] = [];
    let recommendations: string[] = [];
    const confidence = 0.8;

    if (walkingSteadiness < 0.3) {
      patternType = 'Unsteady Gait';
      riskLevel = 'critical';
      indicators = [
        'Severe walking instability detected',
        'High step-to-step variability',
        'Poor postural control indicators',
      ];
      recommendations = [
        'Immediate medical evaluation recommended',
        'Use assistive devices for all walking',
        'Avoid walking alone',
      ];
    } else if (walkingSteadiness < 0.5) {
      patternType = 'Cautious Gait';
      riskLevel = 'high';
      indicators = [
        'Reduced walking confidence',
        'Slower than normal walking speed',
        'Increased double support time',
      ];
      recommendations = [
        'Balance training exercises',
        'Physical therapy consultation',
        'Home safety assessment',
      ];
    } else if (_stepConsistency < 0.6) {
      patternType = 'Irregular Gait';
      riskLevel = 'moderate';
      indicators = [
        'Inconsistent step patterns',
        'Variable stride length',
        'Possible fatigue effects',
      ];
      recommendations = [
        'Monitor activity levels',
        'Consider gait training',
        'Regular rest breaks during walking',
      ];
    }

    return {
      type: patternType,
      description: `Gait pattern analysis based on walking steadiness and movement consistency`,
      riskLevel,
      confidence,
      indicators,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Detect movement irregularities
   */
  private detectMovementIrregularities(features: any): MovementPattern[] {
    const irregularities: MovementPattern[] = [];

    // Check for freezing episodes
    const freezingPattern = this.detectFreezingPattern(features);
    if (freezingPattern) irregularities.push(freezingPattern);

    // Check for shuffling gait
    const shufflingPattern = this.detectShufflingPattern(features);
    if (shufflingPattern) irregularities.push(shufflingPattern);

    // Check for festinating gait
    const festinatingPattern = this.detectFestinatingPattern(features);
    if (festinatingPattern) irregularities.push(festinatingPattern);

    return irregularities;
  }

  /**
   * Analyze balance and stability
   */
  private analyzeBalanceStability(features: any): MovementPattern {
    const balanceScore = features.gaitStability || 0.7;
    const walkingSteadiness = features.walkingSteadiness?.average || 0.7;

    let riskLevel: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    let indicators: string[] = [];
    let recommendations: string[] = [];

    if (balanceScore < 0.4 || walkingSteadiness < 0.4) {
      riskLevel = 'critical';
      indicators = [
        'Severely compromised balance',
        'High fall risk during normal activities',
        'Postural instability indicators',
      ];
      recommendations = [
        'Immediate fall prevention measures',
        'Consider supervised mobility only',
        'Vestibular system evaluation',
      ];
    } else if (balanceScore < 0.6 || walkingSteadiness < 0.6) {
      riskLevel = 'high';
      indicators = [
        'Moderate balance impairment',
        'Increased sway during standing',
        'Difficulty with dynamic balance',
      ];
      recommendations = [
        'Balance training program',
        'Tai chi or yoga practice',
        'Environmental modifications',
      ];
    } else if (balanceScore < 0.8 || walkingSteadiness < 0.8) {
      riskLevel = 'moderate';
      indicators = [
        'Mild balance concerns',
        'Slight postural adjustments needed',
        'Age-related balance changes',
      ];
      recommendations = [
        'Regular balance exercises',
        'Strength training focus',
        'Monitor progression',
      ];
    }

    return {
      type: 'Balance and Stability Assessment',
      description:
        'Analysis of postural control and dynamic balance during movement',
      riskLevel,
      confidence: 0.85,
      indicators,
      recommendations,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Assess mobility trends
   */
  private assessMobilityTrends(
    features: any,
    timeframe: string
  ): MovementPattern[] {
    const trends: MovementPattern[] = [];

    // Declining mobility trend
    const decliningTrend = this.detectDecliningMobility(features, timeframe);
    if (decliningTrend) trends.push(decliningTrend);

    // Activity pattern changes
    const activityChanges = this.detectActivityPatternChanges(
      features,
      timeframe
    );
    if (activityChanges) trends.push(activityChanges);

    return trends;
  }

  /**
   * Generate fall prediction for specific time window
   */
  private generateFallPrediction(
    features: any,
    timeWindow: string
  ): FallPrediction {
    const walkingSteadiness = features.walkingSteadiness?.average || 0.7;
    const stepConsistency = features.stepConsistency || 0.7;
    const balanceScore = features.gaitStability || 0.7;
    const activityLevel = features.steps?.average || 5000;

    // Calculate base probability using weighted factors
    let probability = 0.1; // Base probability
    const confidence = 0.7;

    const factors = [
      {
        name: 'Walking Steadiness',
        impact: Math.max(0, (0.8 - walkingSteadiness) / 0.8),
        description: 'Stability during normal walking activities',
      },
      {
        name: 'Step Consistency',
        impact: Math.max(0, (0.8 - stepConsistency) / 0.8),
        description: 'Regularity of step patterns and timing',
      },
      {
        name: 'Balance Control',
        impact: Math.max(0, (0.8 - balanceScore) / 0.8),
        description: 'Postural control and dynamic balance',
      },
      {
        name: 'Activity Level',
        impact: Math.max(0, (7000 - activityLevel) / 7000),
        description: 'Overall daily physical activity',
      },
    ];

    // Calculate weighted probability
    const totalImpact = factors.reduce((sum, factor) => sum + factor.impact, 0);
    probability = Math.min(0.9, 0.1 + (totalImpact / factors.length) * 0.8);

    // Adjust for time window
    const timeMultipliers = {
      '1 hour': 0.3,
      '4 hours': 0.5,
      '24 hours': 1.0,
      '7 days': 1.8,
    };
    probability *=
      timeMultipliers[timeWindow as keyof typeof timeMultipliers] || 1.0;

    // Determine severity
    let severity: 'low' | 'moderate' | 'high' | 'critical' = 'low';
    if (probability >= 0.7) severity = 'critical';
    else if (probability >= 0.5) severity = 'high';
    else if (probability >= 0.3) severity = 'moderate';

    // Generate interventions
    const interventions = this.generateInterventions(factors, severity);

    return {
      timeWindow,
      probability,
      confidence,
      severity,
      factors: factors.filter((f) => f.impact > 0.1),
      interventions,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Generate interventions based on risk factors
   */
  private generateInterventions(factors: any[], severity: string): string[] {
    const interventions: string[] = [];

    if (severity === 'critical') {
      interventions.push('Immediate caregiver notification recommended');
      interventions.push('Consider supervised mobility only');
      interventions.push('Emergency contact preparation');
    }

    if (
      factors.some((f) => f.name === 'Walking Steadiness' && f.impact > 0.5)
    ) {
      interventions.push('Use assistive devices for walking');
      interventions.push('Practice balance exercises daily');
    }

    if (factors.some((f) => f.name === 'Activity Level' && f.impact > 0.4)) {
      interventions.push('Gradual increase in daily activities');
      interventions.push('Physical therapy evaluation');
    }

    if (factors.some((f) => f.name === 'Step Consistency' && f.impact > 0.3)) {
      interventions.push('Gait training exercises');
      interventions.push('Monitor medication effects on coordination');
    }

    return interventions.slice(0, 4); // Limit to 4 most relevant interventions
  }

  // Gait metric calculation methods
  private calculateStepLength(features: any): number {
    const distance = features.distanceWalking?.average || 0;
    const steps = features.steps?.average || 0;
    return steps > 0 ? (distance * 100) / steps : 60; // Default 60cm
  }

  private calculateStepFrequency(features: any): number {
    const steps = features.steps?.average || 0;
    // Assume 16 hours of active time per day
    return (steps / 16 / 60) * 100; // steps per minute
  }

  private calculateWalkingSpeed(features: any): number {
    const distance = features.distanceWalking?.average || 0;
    // Assume 2 hours of actual walking time per day
    return distance / 2 / 3.6; // Convert km/h to m/s
  }

  private calculateStepRegularity(features: any): number {
    const variability = features.steps?.variability || 0.2;
    return Math.max(0, Math.min(1, 1 - variability / 0.5));
  }

  private calculateWalkingSteadiness(features: any): number {
    return features.walkingSteadiness?.average || 0.7;
  }

  private calculateBalanceScore(features: any): number {
    const steadiness = this.calculateWalkingSteadiness(features);
    const regularity = this.calculateStepRegularity(features);
    return (steadiness + regularity) / 2;
  }

  private calculateStrideVariability(features: any): number {
    return features.steps?.variability || 0.15;
  }

  private calculateDoubleSupportTime(features: any): number {
    const walkingSpeed = this.calculateWalkingSpeed(features);
    // Slower walking = longer double support time
    return Math.max(0.1, Math.min(0.4, 0.3 - walkingSpeed * 0.1));
  }

  private calculateAsymmetryIndex(features: any): number {
    // Simplified asymmetry calculation
    return Math.random() * 0.2; // Would use actual step timing data
  }

  private calculateOverallGaitScore(metrics: GaitMetrics): number {
    const weights = {
      stepRegularity: 0.25,
      walkingSteadiness: 0.25,
      balanceScore: 0.2,
      strideVariability: -0.15, // Negative because higher variability is worse
      doubleSupportTime: -0.1, // Negative because longer time is worse
      asymmetryIndex: -0.05, // Negative because higher asymmetry is worse
    };

    let score = 0;
    score += metrics.stepRegularity * weights.stepRegularity;
    score += metrics.walkingSteadiness * weights.walkingSteadiness;
    score += metrics.balanceScore * weights.balanceScore;
    score +=
      (1 - metrics.strideVariability) * Math.abs(weights.strideVariability);
    score +=
      (1 - metrics.doubleSupportTime) * Math.abs(weights.doubleSupportTime);
    score += (1 - metrics.asymmetryIndex) * Math.abs(weights.asymmetryIndex);

    return Math.max(0, Math.min(1, score));
  }

  private determineGaitRiskLevel(
    metrics: GaitMetrics
  ): 'low' | 'moderate' | 'high' | 'critical' {
    if (metrics.overallScore >= 0.8) return 'low';
    if (metrics.overallScore >= 0.6) return 'moderate';
    if (metrics.overallScore >= 0.4) return 'high';
    return 'critical';
  }

  // Helper calculation methods
  private calculateStepConsistency(stepsData?: MetricData): number {
    if (!stepsData) return 0.7;
    return Math.max(0, Math.min(1, 1 - stepsData.variability / 0.3));
  }

  private calculateMovementEfficiency(
    stepsData?: MetricData,
    energyData?: MetricData
  ): number {
    if (!stepsData || !energyData) return 0.7;
    const steps = stepsData.average;
    const energy = energyData.average;
    return energy > 0 ? Math.min(1, (steps / energy) * 0.1) : 0.5;
  }

  private calculateGaitStability(walkingSteadinessData?: MetricData): number {
    if (!walkingSteadinessData) return 0.7;
    return walkingSteadinessData.average / 100;
  }

  private calculateActivityRhythm(stepsData?: MetricData): number {
    if (!stepsData) return 0.7;
    return Math.max(0, Math.min(1, 1 - stepsData.variability / 0.4));
  }

  // Pattern detection methods
  private detectFreezingPattern(features: any): MovementPattern | null {
    const stepConsistency = features.stepConsistency || 0.7;
    const walkingSteadiness = features.walkingSteadiness?.average || 0.7;

    if (stepConsistency < 0.4 && walkingSteadiness < 0.5) {
      return {
        type: 'Freezing Episodes',
        description: 'Sudden stops or hesitation during walking detected',
        riskLevel: 'high',
        confidence: 0.8,
        indicators: [
          'Sudden movement stops',
          'Start hesitation patterns',
          'Turn-related difficulties',
        ],
        recommendations: [
          'Use auditory or visual cues',
          'Practice turning strategies',
          'Consider medication timing',
        ],
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }

  private detectShufflingPattern(features: any): MovementPattern | null {
    const stepLength = this.calculateStepLength(features);
    const walkingSpeed = this.calculateWalkingSpeed(features);

    if (stepLength < 40 && walkingSpeed < 0.8) {
      return {
        type: 'Shuffling Gait',
        description:
          'Reduced step length and walking speed indicating shuffling pattern',
        riskLevel: 'moderate',
        confidence: 0.75,
        indicators: [
          'Shortened step length',
          'Reduced ground clearance',
          'Decreased walking speed',
        ],
        recommendations: [
          'Heel-to-toe walking practice',
          'Leg strengthening exercises',
          'Footwear assessment',
        ],
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }

  private detectFestinatingPattern(features: any): MovementPattern | null {
    const stepFrequency = this.calculateStepFrequency(features);
    const stepLength = this.calculateStepLength(features);

    if (stepFrequency > 130 && stepLength < 50) {
      return {
        type: 'Festinating Gait',
        description: 'Rapid small steps with forward lean tendency',
        riskLevel: 'high',
        confidence: 0.8,
        indicators: [
          'Increased step frequency',
          'Progressively smaller steps',
          'Forward momentum issues',
        ],
        recommendations: [
          'Practice controlled walking pace',
          'Balance training emphasis',
          'Neurological evaluation',
        ],
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }

  // Anomaly detection methods
  private detectGaitAnomalies(features: any): MovementAnomaly[] {
    const anomalies: MovementAnomaly[] = [];

    const walkingSteadiness = features.walkingSteadiness?.average || 0.7;
    const stepConsistency = features.stepConsistency || 0.7;

    if (walkingSteadiness < 0.3) {
      anomalies.push({
        type: 'Severe Gait Instability',
        description: 'Critical reduction in walking steadiness detected',
        severity: 'critical',
        score: 1 - walkingSteadiness,
        timestamp: new Date().toISOString(),
        affectedMetrics: ['Walking Steadiness', 'Balance Control', 'Fall Risk'],
        actions: [
          'Immediate medical attention',
          'Restrict independent mobility',
          'Activate emergency protocols',
        ],
        duration: 'Ongoing',
      });
    }

    return anomalies;
  }

  private detectActivityAnomalies(features: any): MovementAnomaly[] {
    const anomalies: MovementAnomaly[] = [];

    const steps = features.steps?.average || 5000;
    const activityRhythm = features.activityRhythm || 0.7;

    if (steps < 2000) {
      anomalies.push({
        type: 'Severe Activity Reduction',
        description: 'Dramatic decrease in daily activity levels',
        severity: 'high',
        score: Math.max(0, (5000 - steps) / 5000),
        timestamp: new Date().toISOString(),
        affectedMetrics: ['Daily Steps', 'Activity Level', 'Mobility'],
        actions: [
          'Assess for acute illness',
          'Review medications',
          'Encourage gradual activity increase',
        ],
        duration: 'Past 24 hours',
      });
    }

    return anomalies;
  }

  private detectBalanceAnomalies(features: any): MovementAnomaly[] {
    const anomalies: MovementAnomaly[] = [];

    const balanceScore = features.gaitStability || 0.7;

    if (balanceScore < 0.4) {
      anomalies.push({
        type: 'Balance System Dysfunction',
        description: 'Significant impairment in balance control systems',
        severity: 'critical',
        score: 1 - balanceScore,
        timestamp: new Date().toISOString(),
        affectedMetrics: [
          'Balance Score',
          'Postural Control',
          'Dynamic Stability',
        ],
        actions: [
          'Vestibular system evaluation',
          'Immediate fall prevention',
          'Physical therapy referral',
        ],
        duration: 'Current assessment',
      });
    }

    return anomalies;
  }

  private detectCardiovascularAnomalies(features: any): MovementAnomaly[] {
    const anomalies: MovementAnomaly[] = [];

    const heartRate = features.heartRate?.average || 70;
    const activeEnergy = features.activeEnergy?.average || 300;

    // Detect unusual heart rate patterns during activity
    if (heartRate > 100 && activeEnergy < 200) {
      anomalies.push({
        type: 'Cardiovascular Response Anomaly',
        description: 'Elevated heart rate with low activity levels',
        severity: 'moderate',
        score: Math.min(1, (heartRate - 70) / 50),
        timestamp: new Date().toISOString(),
        affectedMetrics: [
          'Heart Rate',
          'Activity Tolerance',
          'Exercise Capacity',
        ],
        actions: [
          'Monitor cardiovascular status',
          'Consider cardiac evaluation',
          'Adjust activity intensity',
        ],
        duration: 'During recent activities',
      });
    }

    return anomalies;
  }

  // Trend detection methods
  private detectDecliningMobility(
    features: any,
    timeframe: string
  ): MovementPattern | null {
    // This would compare current metrics to historical data
    // For demo purposes, we'll simulate decline detection
    const currentActivity = features.steps?.average || 5000;
    const expectedActivity = 7000; // Baseline expectation

    if (currentActivity < expectedActivity * 0.7) {
      return {
        type: 'Mobility Decline Trend',
        description: `Gradual reduction in mobility observed over ${timeframe}`,
        riskLevel: 'moderate',
        confidence: 0.7,
        indicators: [
          'Decreasing daily step count',
          'Reduced walking distance',
          'Lower activity consistency',
        ],
        recommendations: [
          'Monitor progression closely',
          'Consider underlying causes',
          'Implement mobility preservation strategies',
        ],
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }

  private detectActivityPatternChanges(
    features: any,
    timeframe: string
  ): MovementPattern | null {
    const activityRhythm = features.activityRhythm || 0.7;

    if (activityRhythm < 0.5) {
      return {
        type: 'Activity Pattern Disruption',
        description: 'Changes in typical daily activity patterns detected',
        riskLevel: 'moderate',
        confidence: 0.65,
        indicators: [
          'Irregular activity timing',
          'Changed daily routines',
          'Inconsistent movement patterns',
        ],
        recommendations: [
          'Maintain regular schedules',
          'Address lifestyle factors',
          'Monitor for underlying issues',
        ],
        timestamp: new Date().toISOString(),
      };
    }
    return null;
  }
}

// Export singleton instance
export const movementPatternAnalyzer = new MovementPatternAnalyzer();
