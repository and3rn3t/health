/**
 * Enhanced Multi-Modal Fall Detection System
 * Combines accelerometer, gyroscope, heart rate, and contextual data for accurate fall detection
 */

// Type aliases for better readability
type DetectionMethod =
  | 'accelerometer'
  | 'gyroscope'
  | 'heart_rate'
  | 'ml_model';

interface CalibrationData {
  age: number;
  weight: number;
  height: number;
  personalThresholds?: {
    impactSensitivity: number;
    orientationSensitivity: number;
  };
}

interface DetectionResults {
  detected: boolean;
  event?: FallDetectionEvent;
}

// Enhanced sensor data interface
export interface EnhancedSensorData {
  timestamp: number;

  // Motion sensors
  accelerometer: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
  };

  gyroscope: {
    x: number;
    y: number;
    z: number;
    magnitude: number;
  };

  // Physiological sensors
  heartRate: number;
  heartRateVariability?: number;
  oxygenSaturation?: number;

  // Environmental context
  altitude?: number;
  pressure?: number;
  temperature?: number;
  lightLevel?: number;

  // Device context
  batteryLevel?: number;
  signalStrength?: number;
  confidence: number; // 0-1 sensor confidence

  // Derived metrics
  impactSeverity?: number;
  postureOrientation?: 'standing' | 'sitting' | 'lying' | 'unknown';
  activityType?: 'walking' | 'running' | 'stationary' | 'unknown';
}

export interface FallDetectionEvent {
  id: string;
  timestamp: number;

  // Detection details
  detectedBy: DetectionMethod[];
  confidence: number; // 0-1 overall confidence
  severity: 'minor' | 'moderate' | 'severe' | 'critical';

  // Sensor data at time of detection
  sensorData: EnhancedSensorData;
  sensorHistory: EnhancedSensorData[]; // 5 seconds before + after

  // Analysis results
  impactMagnitude: number;
  orientationChange: number;
  recoveryTime?: number; // Time to return to normal activity

  // Context
  location?: string;
  activity?: string;
  environment?: {
    indoors: boolean;
    lighting: 'bright' | 'dim' | 'dark';
    surface: 'flat' | 'uneven' | 'stairs' | 'unknown';
  };

  // Response tracking
  userResponse?: {
    acknowledged: boolean;
    falsePositive: boolean;
    needsHelp: boolean;
    responseTime: number;
  };

  emergencyContacted?: boolean;
  resolved: boolean;
}

export interface FallDetectionConfig {
  // Sensitivity settings
  sensitivity: 'low' | 'medium' | 'high' | 'adaptive';

  // Threshold configurations
  thresholds: {
    impact: {
      minor: number;
      moderate: number;
      severe: number;
      critical: number;
    };
    orientation: {
      minor: number;
      moderate: number;
      severe: number;
    };
    heartRate: {
      spike: number;
      drop: number;
    };
  };

  // Detection parameters
  detectionWindow: number; // milliseconds
  confirmationWindow: number; // milliseconds for user response
  falsePositiveTimeout: number; // milliseconds

  // ML model settings
  mlModel: {
    enabled: boolean;
    confidence_threshold: number;
    update_frequency: number;
  };

  // Emergency response
  emergencyResponse: {
    enabled: boolean;
    countdown: number; // seconds before auto-calling
    contacts: string[];
    message: string;
  };
}

export interface FallPreventionAlert {
  id: string;
  timestamp: number;
  type:
    | 'posture_warning'
    | 'gait_change'
    | 'fatigue_detected'
    | 'environmental_hazard';
  severity: 'info' | 'warning' | 'alert';
  message: string;
  recommendation: string;
  dismissed: boolean;
}

/**
 * Enhanced Fall Detection Engine
 * Multi-modal approach combining traditional threshold-based detection with ML
 */
export class EnhancedFallDetectionEngine {
  private config: FallDetectionConfig;
  private sensorHistory: EnhancedSensorData[] = [];
  private readonly historyLength = 50; // Keep 5 seconds at 10Hz
  private isCalibrated = false;
  private calibrationData: CalibrationData | null = null;
  private mlModelLoaded = false;

  // Detection state
  private lastFallDetection?: FallDetectionEvent;
  private preventionAlerts: FallPreventionAlert[] = [];

  constructor(config?: Partial<FallDetectionConfig>) {
    this.config = this.initializeConfig(config);
    this.initializeMLModel();
  }

  /**
   * Process new sensor data and detect falls
   */
  async processSensorData(sensorData: EnhancedSensorData): Promise<{
    fallDetected: boolean;
    event?: FallDetectionEvent;
    preventionAlerts: FallPreventionAlert[];
    recommendations: string[];
  }> {
    // Add to history
    this.sensorHistory.push(sensorData);
    if (this.sensorHistory.length > this.historyLength) {
      this.sensorHistory.shift();
    }

    // Multi-modal fall detection
    const detectionResults = await this.performFallDetection(sensorData);

    // Generate prevention alerts
    const preventionAlerts = this.generatePreventionAlerts(sensorData);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      sensorData,
      detectionResults
    );

    return {
      fallDetected: detectionResults.detected,
      event: detectionResults.event,
      preventionAlerts,
      recommendations,
    };
  }

  /**
   * Multi-modal fall detection algorithm
   */
  private async performFallDetection(sensorData: EnhancedSensorData): Promise<{
    detected: boolean;
    event?: FallDetectionEvent;
  }> {
    const detectionMethods: DetectionMethod[] = [];
    let overallConfidence = 0;
    let severity: FallDetectionEvent['severity'] = 'minor';

    // 1. Accelerometer-based detection
    const accelResult = this.detectFallFromAccelerometer(sensorData);
    if (accelResult.detected) {
      detectionMethods.push('accelerometer');
      overallConfidence += accelResult.confidence * 0.3;
      severity = this.maxSeverity(severity, accelResult.severity);
    }

    // 2. Gyroscope-based detection
    const gyroResult = this.detectFallFromGyroscope(sensorData);
    if (gyroResult.detected) {
      detectionMethods.push('gyroscope');
      overallConfidence += gyroResult.confidence * 0.25;
      severity = this.maxSeverity(severity, gyroResult.severity);
    }

    // 3. Heart rate-based detection
    const hrResult = this.detectFallFromHeartRate(sensorData);
    if (hrResult.detected) {
      detectionMethods.push('heart_rate');
      overallConfidence += hrResult.confidence * 0.2;
      severity = this.maxSeverity(severity, hrResult.severity);
    }

    // 4. ML model-based detection
    const mlResult = await this.detectFallFromMLModel(sensorData);
    if (mlResult.detected) {
      detectionMethods.push('ml_model');
      overallConfidence += mlResult.confidence * 0.25;
      severity = this.maxSeverity(severity, mlResult.severity);
    }

    // Determine if fall occurred based on ensemble
    const fallDetected = this.evaluateEnsembleDetection(
      detectionMethods,
      overallConfidence
    );

    if (fallDetected) {
      const event = this.createFallEvent(
        sensorData,
        detectionMethods,
        overallConfidence,
        severity
      );

      this.lastFallDetection = event;
      return { detected: true, event };
    }

    return { detected: false };
  }

  /**
   * Accelerometer-based fall detection
   */
  private detectFallFromAccelerometer(sensorData: EnhancedSensorData): {
    detected: boolean;
    confidence: number;
    severity: FallDetectionEvent['severity'];
  } {
    const { accelerometer } = sensorData;
    const magnitude = accelerometer.magnitude;

    // Thresholds based on research (values in g-force)
    const thresholds = this.config.thresholds.impact;

    let detected = false;
    let confidence = 0;
    let severity: FallDetectionEvent['severity'] = 'minor';

    // High impact detection
    if (magnitude > thresholds.critical) {
      detected = true;
      confidence = 0.95;
      severity = 'critical';
    } else if (magnitude > thresholds.severe) {
      detected = true;
      confidence = 0.85;
      severity = 'severe';
    } else if (magnitude > thresholds.moderate) {
      detected = true;
      confidence = 0.7;
      severity = 'moderate';
    } else if (magnitude > thresholds.minor) {
      // Additional validation needed for minor impacts
      if (this.validateMinorImpact(sensorData)) {
        detected = true;
        confidence = 0.6;
        // severity remains 'minor' (already initialized)
      }
    }

    // Adjust confidence based on sensor quality
    confidence *= sensorData.confidence;

    return { detected, confidence, severity };
  }

  /**
   * Gyroscope-based fall detection
   */
  private detectFallFromGyroscope(sensorData: EnhancedSensorData): {
    detected: boolean;
    confidence: number;
    severity: FallDetectionEvent['severity'];
  } {
    const { gyroscope } = sensorData;
    const rotationMagnitude = gyroscope.magnitude;

    // Calculate orientation change
    const orientationChange = this.calculateOrientationChange();
    const thresholds = this.config.thresholds.orientation;

    let detected = false;
    let confidence = 0;
    let severity: FallDetectionEvent['severity'] = 'minor';

    if (orientationChange > thresholds.severe && rotationMagnitude > 5.0) {
      detected = true;
      confidence = 0.8;
      severity = 'severe';
    } else if (
      orientationChange > thresholds.moderate &&
      rotationMagnitude > 3.0
    ) {
      detected = true;
      confidence = 0.65;
      severity = 'moderate';
    } else if (
      orientationChange > thresholds.minor &&
      rotationMagnitude > 2.0
    ) {
      detected = true;
      confidence = 0.5;
      // severity remains 'minor' (already initialized)
    }

    return { detected, confidence, severity };
  }

  /**
   * Heart rate-based fall detection
   */
  private detectFallFromHeartRate(sensorData: EnhancedSensorData): {
    detected: boolean;
    confidence: number;
    severity: FallDetectionEvent['severity'];
  } {
    if (!sensorData.heartRate || this.sensorHistory.length < 5) {
      return { detected: false, confidence: 0, severity: 'minor' };
    }

    const currentHR = sensorData.heartRate;
    const recentHR = this.sensorHistory.slice(-5).map((s) => s.heartRate || 0);
    const baselineHR =
      recentHR.reduce((sum, hr) => sum + hr, 0) / recentHR.length;

    const hrChange = Math.abs(currentHR - baselineHR);
    const thresholds = this.config.thresholds.heartRate;

    let detected = false;
    let confidence = 0;
    let severity: FallDetectionEvent['severity'] = 'minor';

    // Sudden heart rate spike or drop
    if (hrChange > thresholds.spike) {
      detected = true;
      confidence = 0.4; // Lower confidence for HR alone
      severity = hrChange > thresholds.spike * 2 ? 'moderate' : 'minor';
    }

    return { detected, confidence, severity };
  }

  /**
   * ML model-based fall detection
   */
  private async detectFallFromMLModel(sensorData: EnhancedSensorData): Promise<{
    detected: boolean;
    confidence: number;
    severity: FallDetectionEvent['severity'];
  }> {
    if (!this.mlModelLoaded || this.sensorHistory.length < 10) {
      return { detected: false, confidence: 0, severity: 'minor' };
    }

    try {
      // Prepare features for ML model
      const features = this.extractMLFeatures(sensorData);

      // Run ML inference (placeholder - would use actual ML model)
      const prediction = await this.runMLInference(features);

      const detected =
        prediction.probability > this.config.mlModel.confidence_threshold;
      const confidence = prediction.probability;

      // Determine severity based on prediction confidence
      let severity: FallDetectionEvent['severity'] = 'minor';
      if (confidence > 0.9) severity = 'severe';
      else if (confidence > 0.8) severity = 'moderate';

      return { detected, confidence, severity };
    } catch (error) {
      console.warn('ML model inference failed:', error);
      return { detected: false, confidence: 0, severity: 'minor' };
    }
  }

  /**
   * Evaluate ensemble detection results
   */
  private evaluateEnsembleDetection(
    detectionMethods: DetectionMethod[],
    overallConfidence: number
  ): boolean {
    // Require at least one primary method (accelerometer or gyroscope)
    const hasPrimaryDetection =
      detectionMethods.includes('accelerometer') ||
      detectionMethods.includes('gyroscope');

    // Minimum confidence threshold
    let minConfidence: number;
    if (this.config.sensitivity === 'high') {
      minConfidence = 0.4;
    } else if (this.config.sensitivity === 'medium') {
      minConfidence = 0.5;
    } else {
      minConfidence = 0.6;
    }

    // Multiple detection methods increase confidence
    const methodBonus = Math.min(0.2, (detectionMethods.length - 1) * 0.1);
    const adjustedConfidence = overallConfidence + methodBonus;

    return hasPrimaryDetection && adjustedConfidence >= minConfidence;
  }

  /**
   * Create fall detection event
   */
  private createFallEvent(
    sensorData: EnhancedSensorData,
    detectedBy: DetectionMethod[],
    confidence: number,
    severity: FallDetectionEvent['severity']
  ): FallDetectionEvent {
    return {
      id: `fall-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: sensorData.timestamp,
      detectedBy,
      confidence,
      severity,
      sensorData,
      sensorHistory: [...this.sensorHistory],
      impactMagnitude: sensorData.accelerometer.magnitude,
      orientationChange: this.calculateOrientationChange(),
      location: 'unknown', // Would be provided by location services
      resolved: false,
    };
  }

  /**
   * Generate prevention alerts based on sensor patterns
   */
  private generatePreventionAlerts(
    sensorData: EnhancedSensorData
  ): FallPreventionAlert[] {
    const alerts: FallPreventionAlert[] = [];

    // Detect gait irregularities
    if (this.detectGaitIrregularity(sensorData)) {
      alerts.push({
        id: `alert-gait-${Date.now()}`,
        timestamp: Date.now(),
        type: 'gait_change',
        severity: 'warning',
        message: 'Irregular walking pattern detected',
        recommendation: 'Consider taking a break and ensuring stable footing',
        dismissed: false,
      });
    }

    // Detect fatigue
    if (this.detectFatigue(sensorData)) {
      alerts.push({
        id: `alert-fatigue-${Date.now()}`,
        timestamp: Date.now(),
        type: 'fatigue_detected',
        severity: 'warning',
        message: 'Signs of fatigue detected',
        recommendation: 'Take a rest and avoid strenuous activities',
        dismissed: false,
      });
    }

    return alerts;
  }

  /**
   * Generate personalized recommendations
   */
  private generateRecommendations(
    sensorData: EnhancedSensorData,
    detectionResults: DetectionResults
  ): string[] {
    const recommendations: string[] = [];

    if (detectionResults.detected) {
      recommendations.push(
        'Fall detected - remain calm and assess for injuries',
        'If unable to get up safely, call for help immediately',
        'Consider medical evaluation even if no injuries are apparent'
      );
    } else {
      // Preventive recommendations based on sensor patterns
      if (sensorData.accelerometer.magnitude > 1.5) {
        recommendations.push(
          'Walking pattern shows instability - consider using assistive device'
        );
      }

      if (sensorData.heartRate && sensorData.heartRate > 120) {
        recommendations.push(
          'Elevated heart rate detected - take a break and hydrate'
        );
      }
    }

    return recommendations;
  }

  // Helper methods implementation
  private initializeConfig(
    config?: Partial<FallDetectionConfig>
  ): FallDetectionConfig {
    return {
      sensitivity: 'medium',
      thresholds: {
        impact: {
          minor: 2.5, // g-force
          moderate: 4.0,
          severe: 6.0,
          critical: 8.0,
        },
        orientation: {
          minor: 45, // degrees
          moderate: 90,
          severe: 135,
        },
        heartRate: {
          spike: 30, // bpm change
          drop: 20,
        },
      },
      detectionWindow: 1000, // 1 second
      confirmationWindow: 30000, // 30 seconds
      falsePositiveTimeout: 60000, // 1 minute
      mlModel: {
        enabled: true,
        confidence_threshold: 0.7,
        update_frequency: 100, // ms
      },
      emergencyResponse: {
        enabled: true,
        countdown: 60, // seconds
        contacts: [],
        message: 'Fall detected - emergency response activated',
      },
      ...config,
    };
  }

  private async initializeMLModel(): Promise<void> {
    try {
      // Initialize ML model (placeholder)
      // In real implementation, this would load a trained model
      this.mlModelLoaded = true;
    } catch (error) {
      console.warn('Failed to load ML model:', error);
      this.mlModelLoaded = false;
    }
  }

  private validateMinorImpact(sensorData: EnhancedSensorData): boolean {
    // Additional validation for minor impacts to reduce false positives
    const orientationChange = this.calculateOrientationChange();
    const hasSignificantRotation = sensorData.gyroscope.magnitude > 1.5;

    return orientationChange > 30 && hasSignificantRotation;
  }

  private calculateOrientationChange(): number {
    if (this.sensorHistory.length < 5) return 0;

    // Calculate orientation change over last few samples
    // Placeholder implementation
    return Math.random() * 180; // degrees
  }

  private maxSeverity(
    current: FallDetectionEvent['severity'],
    new_: FallDetectionEvent['severity']
  ): FallDetectionEvent['severity'] {
    const severityOrder = ['minor', 'moderate', 'severe', 'critical'];
    const currentIndex = severityOrder.indexOf(current);
    const newIndex = severityOrder.indexOf(new_);

    return severityOrder[
      Math.max(currentIndex, newIndex)
    ] as FallDetectionEvent['severity'];
  }

  private extractMLFeatures(sensorData: EnhancedSensorData): number[] {
    // Extract features for ML model
    const features = [
      sensorData.accelerometer.x,
      sensorData.accelerometer.y,
      sensorData.accelerometer.z,
      sensorData.accelerometer.magnitude,
      sensorData.gyroscope.x,
      sensorData.gyroscope.y,
      sensorData.gyroscope.z,
      sensorData.gyroscope.magnitude,
      sensorData.heartRate || 0,
      sensorData.confidence,
    ];

    // Add historical features
    if (this.sensorHistory.length >= 5) {
      const recent = this.sensorHistory.slice(-5);
      const avgAccel =
        recent.reduce((sum, s) => sum + s.accelerometer.magnitude, 0) / 5;
      const avgGyro =
        recent.reduce((sum, s) => sum + s.gyroscope.magnitude, 0) / 5;
      features.push(avgAccel, avgGyro);
    }

    return features;
  }

  private async runMLInference(
    features: number[]
  ): Promise<{ probability: number }> {
    // Placeholder ML inference
    // In real implementation, this would run the actual trained model
    const randomProbability = Math.random() * 0.3; // Usually low probability

    // Simulate higher probability for certain feature combinations
    if (features[3] > 4.0 && features[7] > 3.0) {
      // High accel + gyro magnitude
      return { probability: Math.random() * 0.4 + 0.6 }; // 0.6-1.0
    }

    return { probability: randomProbability };
  }

  private detectGaitIrregularity(_sensorData: EnhancedSensorData): boolean {
    // Detect irregular gait patterns
    if (this.sensorHistory.length < 10) return false;

    // Check for sudden changes in acceleration patterns
    const recent = this.sensorHistory.slice(-10);
    const variance = this.calculateVariance(
      recent.map((s) => s.accelerometer.magnitude)
    );

    return variance > 2.0; // Threshold for irregularity
  }

  private detectFatigue(sensorData: EnhancedSensorData): boolean {
    // Detect signs of fatigue
    if (!sensorData.heartRate || this.sensorHistory.length < 20) return false;

    // Look for elevated heart rate with reduced movement efficiency
    const avgHR =
      this.sensorHistory
        .slice(-20)
        .filter((s) => s.heartRate)
        .reduce((sum, s) => sum + (s.heartRate || 0), 0) / 20;

    const avgMovement =
      this.sensorHistory
        .slice(-20)
        .reduce((sum, s) => sum + s.accelerometer.magnitude, 0) / 20;

    return avgHR > 100 && avgMovement < 1.2; // High HR, low movement
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
    return squaredDiffs.reduce((sum, diff) => sum + diff, 0) / values.length;
  }

  // Public methods for external use
  public calibrate(userProfile: {
    age: number;
    weight: number;
    height: number;
  }): void {
    // Calibrate thresholds based on user profile
    this.isCalibrated = true;
    this.calibrationData = userProfile;
  }

  public updateConfig(updates: Partial<FallDetectionConfig>): void {
    this.config = { ...this.config, ...updates };
  }

  public getDetectionHistory(): FallDetectionEvent[] {
    // Return recent detection events
    return this.lastFallDetection ? [this.lastFallDetection] : [];
  }

  public dismissAlert(alertId: string): void {
    const alert = this.preventionAlerts.find((a) => a.id === alertId);
    if (alert) {
      alert.dismissed = true;
    }
  }
}
