import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import { useCallback, useEffect, useState } from 'react';

// LiDAR Fall Prediction Types
interface FallRiskMetrics {
  gaitStability: {
    stepLength: number; // cm - average step length
    stepWidth: number; // cm - average step width
    stepTime: number; // seconds - average step time
    doubleSupport: number; // percentage of gait cycle
    variability: number; // coefficient of variation (0-100)
    asymmetry: number; // percentage difference left vs right
  };
  balanceMetrics: {
    swayArea: number; // cm² - postural sway area
    swayVelocity: number; // cm/s - average sway velocity
    mediolateralSway: number; // cm - side-to-side movement
    anteroposteriorSway: number; // cm - forward-backward movement
    stabilityIndex: number; // 0-100 (higher = more stable)
  };
  reactionMetrics: {
    anticipatoryControl: number; // 0-100 score
    compensatoryResponse: number; // milliseconds reaction time
    recoveryStrategy: 'ankle' | 'hip' | 'step' | 'mixed';
    cognitiveLoad: number; // 0-100 (dual-task performance)
  };
  environmentalFactors: {
    surfaceCompliance: number; // 0-100 (0 = very soft, 100 = rigid)
    lightingConditions: number; // lux measurement
    obstacles: number; // count of detected obstacles
    terrainVariability: number; // 0-100 roughness score
  };
  biomechanicalFactors: {
    lowerLimbStrength: number; // 0-100 relative strength
    flexibilityScore: number; // 0-100 range of motion
    coordinationIndex: number; // 0-100 movement coordination
    fatigueLevel: number; // 0-100 (higher = more fatigued)
  };
}

interface FallPrediction {
  id: string;
  timestamp: Date;
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  riskScore: number; // 0-100 (higher = higher risk)
  confidence: number; // 0-100 model confidence
  metrics: FallRiskMetrics;
  riskFactors: FallRiskFactor[];
  predictions: {
    next24Hours: number; // probability 0-100
    nextWeek: number; // probability 0-100
    nextMonth: number; // probability 0-100
  };
  interventions: FallIntervention[];
  environmentalRecommendations: string[];
  monitoringRecommendations: string[];
}

interface FallRiskFactor {
  id: string;
  category:
    | 'gait'
    | 'balance'
    | 'strength'
    | 'cognitive'
    | 'environmental'
    | 'medical';
  factor: string;
  severity: 'low' | 'moderate' | 'high';
  contribution: number; // percentage contribution to total risk
  modifiable: boolean;
  timeToIntervention: 'immediate' | 'short-term' | 'long-term';
}

interface FallIntervention {
  id: string;
  type: 'exercise' | 'environmental' | 'assistive-device' | 'medical-referral';
  title: string;
  description: string;
  urgency: 'low' | 'medium' | 'high' | 'critical';
  expectedBenefit: number; // percentage risk reduction
  timeToEffect: string; // e.g., "2-4 weeks"
  instructions: string[];
  contraindications: string[];
  monitoringRequired: boolean;
}

interface RealTimeFallMonitoring {
  isActive: boolean;
  currentRisk: number; // 0-100 current risk level
  alerts: FallAlert[];
  triggerThreshold: number; // risk level that triggers alert
  monitoringMode: 'continuous' | 'periodic' | 'on-demand';
  sensorFusion: {
    lidar: boolean;
    accelerometer: boolean;
    gyroscope: boolean;
    pressure: boolean;
  };
}

interface FallAlert {
  id: string;
  timestamp: Date;
  type:
    | 'immediate-risk'
    | 'trending-risk'
    | 'environmental-hazard'
    | 'gait-change';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  recommendation: string;
  autoResolve: boolean;
  acknowledged: boolean;
}

interface LiDARFallPredictionEngineProps {
  onPredictionComplete?: (prediction: FallPrediction) => void;
  realTimeAnalysis?: boolean;
  alertThreshold?: number; // 0-100
  monitoringEnabled?: boolean;
}

export function LiDARFallPredictionEngine({
  onPredictionComplete,
  realTimeAnalysis = true,
  alertThreshold = 70,
  monitoringEnabled = false,
}: LiDARFallPredictionEngineProps) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentPrediction, setCurrentPrediction] =
    useState<FallPrediction | null>(null);
  const [_predictionHistory, setPredictionHistory] = useKV(
    'fall-predictions',
    '[]'
  );
  const [realTimeMonitoring, setRealTimeMonitoring] =
    useState<RealTimeFallMonitoring>({
      isActive: monitoringEnabled,
      currentRisk: 0,
      alerts: [],
      triggerThreshold: alertThreshold,
      monitoringMode: 'periodic',
      sensorFusion: {
        lidar: true,
        accelerometer: true,
        gyroscope: true,
        pressure: false,
      },
    });
  const [activeAlerts, setActiveAlerts] = useState<FallAlert[]>([]);

  // Generate realistic fall risk metrics
  const generateFallRiskMetrics = useCallback((): FallRiskMetrics => {
    // Simulate age-related and health-related variations
    const ageRisk = Math.random(); // 0-1, higher = older/more risk
    const healthStatus = Math.random(); // 0-1, higher = better health

    return {
      gaitStability: {
        stepLength: Math.round(45 + healthStatus * 25 - ageRisk * 15), // 30-70cm typical
        stepWidth: Math.round(8 + ageRisk * 7 + Math.random() * 3), // 8-18cm typical
        stepTime:
          Math.round((0.5 + ageRisk * 0.3 + Math.random() * 0.2) * 100) / 100, // 0.5-1.0s
        doubleSupport: Math.round(10 + ageRisk * 15 + Math.random() * 5), // 10-30%
        variability: Math.round(ageRisk * 25 + Math.random() * 15), // higher = more variable
        asymmetry: Math.round(ageRisk * 15 + Math.random() * 10), // percentage difference
      },
      balanceMetrics: {
        swayArea: Math.round(1 + ageRisk * 8 + Math.random() * 3), // cm²
        swayVelocity:
          Math.round((0.5 + ageRisk * 2 + Math.random() * 1) * 10) / 10, // cm/s
        mediolateralSway:
          Math.round((0.3 + ageRisk * 1.2 + Math.random() * 0.5) * 10) / 10, // cm
        anteroposteriorSway:
          Math.round((0.4 + ageRisk * 1.5 + Math.random() * 0.6) * 10) / 10, // cm
        stabilityIndex: Math.round(100 - ageRisk * 40 - Math.random() * 20), // 0-100
      },
      reactionMetrics: {
        anticipatoryControl: Math.round(healthStatus * 80 + Math.random() * 20),
        compensatoryResponse: Math.round(
          150 + ageRisk * 100 + Math.random() * 50
        ), // ms
        recoveryStrategy: ['ankle', 'hip', 'step', 'mixed'][
          Math.floor(Math.random() * 4)
        ] as 'ankle' | 'hip' | 'step' | 'mixed',
        cognitiveLoad: Math.round(60 + healthStatus * 30 + Math.random() * 10),
      },
      environmentalFactors: {
        surfaceCompliance: Math.round(50 + Math.random() * 40), // 0-100
        lightingConditions: Math.round(200 + Math.random() * 300), // lux
        obstacles: Math.floor(Math.random() * 5), // 0-4 obstacles
        terrainVariability: Math.round(Math.random() * 60), // 0-60
      },
      biomechanicalFactors: {
        lowerLimbStrength: Math.round(healthStatus * 70 + Math.random() * 30),
        flexibilityScore: Math.round(healthStatus * 60 + Math.random() * 40),
        coordinationIndex: Math.round(healthStatus * 80 + Math.random() * 20),
        fatigueLevel: Math.round(ageRisk * 40 + Math.random() * 30),
      },
    };
  }, []);

  // Calculate fall risk score based on metrics
  const calculateFallRiskScore = useCallback(
    (metrics: FallRiskMetrics): number => {
      const gaitScore =
        (100 - metrics.gaitStability.variability) * 0.3 +
        (100 - metrics.gaitStability.asymmetry) * 0.2 +
        (metrics.gaitStability.stepLength > 40 ? 80 : 50) * 0.3 +
        (100 - Math.abs(metrics.gaitStability.stepWidth - 12) * 5) * 0.2;

      const balanceScore = metrics.balanceMetrics.stabilityIndex;

      const strengthScore =
        metrics.biomechanicalFactors.lowerLimbStrength * 0.4 +
        metrics.biomechanicalFactors.coordinationIndex * 0.3 +
        (100 - metrics.biomechanicalFactors.fatigueLevel) * 0.3;

      const reactionScore =
        metrics.reactionMetrics.anticipatoryControl * 0.4 +
        ((300 - Math.min(metrics.reactionMetrics.compensatoryResponse, 300)) /
          3) *
          0.3 +
        metrics.reactionMetrics.cognitiveLoad * 0.3;

      const environmentScore =
        Math.max(0, 100 - metrics.environmentalFactors.obstacles * 20) * 0.4 +
        Math.min(100, metrics.environmentalFactors.lightingConditions / 5) *
          0.3 +
        (100 - metrics.environmentalFactors.terrainVariability) * 0.3;

      // Weighted average (higher scores = lower fall risk)
      const overallScore =
        gaitScore * 0.25 +
        balanceScore * 0.3 +
        strengthScore * 0.2 +
        reactionScore * 0.15 +
        environmentScore * 0.1;

      // Invert to make higher scores = higher risk
      return Math.round(100 - Math.max(0, Math.min(100, overallScore)));
    },
    []
  );

  // Generate risk factors based on metrics
  const generateRiskFactors = useCallback(
    (metrics: FallRiskMetrics, riskScore: number): FallRiskFactor[] => {
      const factors: FallRiskFactor[] = [];

      if (metrics.gaitStability.variability > 20) {
        factors.push({
          id: 'gait-variability',
          category: 'gait',
          factor: 'High gait variability',
          severity:
            metrics.gaitStability.variability > 35 ? 'high' : 'moderate',
          contribution: Math.round(metrics.gaitStability.variability * 0.8),
          modifiable: true,
          timeToIntervention: 'short-term',
        });
      }

      if (metrics.balanceMetrics.stabilityIndex < 60) {
        factors.push({
          id: 'poor-balance',
          category: 'balance',
          factor: 'Reduced postural stability',
          severity:
            metrics.balanceMetrics.stabilityIndex < 40 ? 'high' : 'moderate',
          contribution: Math.round(
            (60 - metrics.balanceMetrics.stabilityIndex) * 1.2
          ),
          modifiable: true,
          timeToIntervention: 'short-term',
        });
      }

      if (metrics.biomechanicalFactors.lowerLimbStrength < 60) {
        factors.push({
          id: 'muscle-weakness',
          category: 'strength',
          factor: 'Lower limb muscle weakness',
          severity:
            metrics.biomechanicalFactors.lowerLimbStrength < 40
              ? 'high'
              : 'moderate',
          contribution: Math.round(
            (60 - metrics.biomechanicalFactors.lowerLimbStrength) * 1.0
          ),
          modifiable: true,
          timeToIntervention: 'long-term',
        });
      }

      if (metrics.reactionMetrics.compensatoryResponse > 250) {
        factors.push({
          id: 'slow-reactions',
          category: 'cognitive',
          factor: 'Delayed compensatory responses',
          severity:
            metrics.reactionMetrics.compensatoryResponse > 300
              ? 'high'
              : 'moderate',
          contribution: Math.round(
            (metrics.reactionMetrics.compensatoryResponse - 200) * 0.15
          ),
          modifiable: true,
          timeToIntervention: 'short-term',
        });
      }

      if (metrics.environmentalFactors.obstacles > 2) {
        factors.push({
          id: 'environmental-hazards',
          category: 'environmental',
          factor: 'Multiple environmental obstacles',
          severity: 'moderate',
          contribution: metrics.environmentalFactors.obstacles * 5,
          modifiable: true,
          timeToIntervention: 'immediate',
        });
      }

      return factors.slice(0, 5); // Limit to top 5 factors
    },
    []
  );

  // Generate interventions based on risk factors
  const generateInterventions = useCallback(
    (riskFactors: FallRiskFactor[], riskScore: number): FallIntervention[] => {
      const interventions: FallIntervention[] = [];

      // High-priority interventions for critical risk
      if (riskScore > 80) {
        interventions.push({
          id: 'immediate-assessment',
          type: 'medical-referral',
          title: 'Urgent Medical Assessment',
          description:
            'Immediate evaluation by healthcare provider due to critical fall risk',
          urgency: 'critical',
          expectedBenefit: 40,
          timeToEffect: 'Immediate',
          instructions: [
            'Contact healthcare provider within 24 hours',
            'Avoid activities that increase fall risk',
            'Consider temporary supervision or assistance',
            'Review current medications with provider',
          ],
          contraindications: [],
          monitoringRequired: true,
        });
      }

      // Balance training for balance issues
      if (riskFactors.some((f) => f.category === 'balance')) {
        interventions.push({
          id: 'balance-exercises',
          type: 'exercise',
          title: 'Progressive Balance Training',
          description:
            'Structured balance exercises to improve postural stability',
          urgency: 'high',
          expectedBenefit: 25,
          timeToEffect: '4-6 weeks',
          instructions: [
            'Stand on one foot for 30 seconds, 3 times each leg',
            'Walk heel-to-toe in a straight line for 20 steps',
            'Practice standing from sitting without using hands',
            'Perform gentle tai chi or yoga movements',
            'Progress to eyes-closed balance challenges',
          ],
          contraindications: [
            'Severe joint pain',
            'Recent injury',
            'Severe dizziness',
          ],
          monitoringRequired: true,
        });
      }

      // Strength training for weakness
      if (riskFactors.some((f) => f.category === 'strength')) {
        interventions.push({
          id: 'strength-training',
          type: 'exercise',
          title: 'Lower Limb Strengthening Program',
          description:
            'Progressive resistance training to improve muscle strength',
          urgency: 'medium',
          expectedBenefit: 20,
          timeToEffect: '6-8 weeks',
          instructions: [
            'Perform seated to standing exercises 10-15 repetitions',
            'Calf raises holding onto stable surface',
            'Wall squats with back against wall',
            'Step-ups on low step or curb',
            'Resistance band exercises for hip and ankle',
          ],
          contraindications: [
            'Acute pain',
            'Recent surgery',
            'Uncontrolled medical conditions',
          ],
          monitoringRequired: false,
        });
      }

      // Environmental modifications
      if (riskFactors.some((f) => f.category === 'environmental')) {
        interventions.push({
          id: 'home-safety',
          type: 'environmental',
          title: 'Home Safety Modifications',
          description: 'Environmental changes to reduce fall hazards',
          urgency: 'high',
          expectedBenefit: 30,
          timeToEffect: 'Immediate',
          instructions: [
            'Remove loose rugs and clutter from walkways',
            'Install adequate lighting in all areas',
            'Add handrails to stairs and grab bars in bathroom',
            'Secure loose carpets and repair uneven surfaces',
            'Keep frequently used items within easy reach',
          ],
          contraindications: [],
          monitoringRequired: false,
        });
      }

      return interventions.slice(0, 4);
    },
    []
  );

  // Run fall risk analysis
  const runFallRiskAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const phases = [
        'Initializing LiDAR sensors...',
        'Analyzing gait patterns...',
        'Measuring postural stability...',
        'Assessing reaction times...',
        'Evaluating environmental factors...',
        'Processing biomechanical data...',
        'Running ML prediction models...',
        'Calculating risk scores...',
        'Generating recommendations...',
      ];

      for (let i = 0; i < phases.length; i++) {
        await new Promise((resolve) => setTimeout(resolve, 800));
        setAnalysisProgress(((i + 1) / phases.length) * 100);
      }

      // Generate prediction results
      const metrics = generateFallRiskMetrics();
      const riskScore = calculateFallRiskScore(metrics);
      const riskFactors = generateRiskFactors(metrics, riskScore);
      const interventions = generateInterventions(riskFactors, riskScore);

      const prediction: FallPrediction = {
        id: `fall-prediction-${Date.now()}`,
        timestamp: new Date(),
        riskLevel: (() => {
          if (riskScore > 80) return 'critical';
          if (riskScore > 65) return 'high';
          if (riskScore > 45) return 'moderate';
          if (riskScore > 25) return 'low';
          return 'minimal';
        })() as 'minimal' | 'low' | 'moderate' | 'high' | 'critical',
        riskScore,
        confidence: 85 + Math.random() * 10,
        metrics,
        riskFactors,
        predictions: {
          next24Hours: Math.min(95, riskScore * 0.8 + Math.random() * 15),
          nextWeek: Math.min(90, riskScore * 0.6 + Math.random() * 20),
          nextMonth: Math.min(85, riskScore * 0.4 + Math.random() * 25),
        },
        interventions,
        environmentalRecommendations: [
          'Ensure adequate lighting in all areas',
          'Remove tripping hazards from walkways',
          'Install grab bars in high-risk areas',
          'Use non-slip mats in wet areas',
        ],
        monitoringRecommendations: [
          'Weekly balance assessments',
          'Monthly gait analysis',
          'Daily fall risk self-monitoring',
          'Emergency response system consideration',
        ],
      };

      setCurrentPrediction(prediction);
      onPredictionComplete?.(prediction);

      // Save to history
      setPredictionHistory((prev) =>
        JSON.stringify([prediction, ...JSON.parse(prev || '[]').slice(0, 9)])
      );

      // Check for alerts
      if (riskScore > alertThreshold) {
        const alert: FallAlert = {
          id: `alert-${Date.now()}`,
          timestamp: new Date(),
          type: 'trending-risk',
          severity: riskScore > 80 ? 'critical' : 'warning',
          message: `Fall risk elevated to ${prediction.riskLevel} level (${riskScore}%)`,
          recommendation:
            'Review intervention recommendations and consider immediate safety measures',
          autoResolve: false,
          acknowledged: false,
        };
        setActiveAlerts((prev) => [alert, ...prev.slice(0, 4)]);
      }
    } catch (error) {
      console.error('Fall risk analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [
    generateFallRiskMetrics,
    calculateFallRiskScore,
    generateRiskFactors,
    generateInterventions,
    onPredictionComplete,
    setPredictionHistory,
    alertThreshold,
  ]);

  // Real-time monitoring
  useEffect(() => {
    if (!realTimeMonitoring.isActive || !realTimeAnalysis) return;

    const interval = setInterval(() => {
      // Simulate real-time risk fluctuations
      const baseRisk = currentPrediction?.riskScore || 50;
      const currentRisk = Math.max(
        0,
        Math.min(100, baseRisk + (Math.random() - 0.5) * 20)
      );

      setRealTimeMonitoring((prev) => ({ ...prev, currentRisk }));

      // Generate alerts if risk exceeds threshold
      if (
        currentRisk > realTimeMonitoring.triggerThreshold &&
        Math.random() < 0.1
      ) {
        // 10% chance of alert
        const alert: FallAlert = {
          id: `realtime-alert-${Date.now()}`,
          timestamp: new Date(),
          type: 'immediate-risk',
          severity: currentRisk > 80 ? 'critical' : 'warning',
          message: `Real-time fall risk spike detected: ${Math.round(currentRisk)}%`,
          recommendation:
            'Take immediate precautions and consider sitting down',
          autoResolve: true,
          acknowledged: false,
        };
        setActiveAlerts((prev) => [alert, ...prev.slice(0, 4)]);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [
    realTimeMonitoring.isActive,
    realTimeAnalysis,
    currentPrediction,
    realTimeMonitoring.triggerThreshold,
  ]);

  // Helper functions
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'minimal':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setActiveAlerts((prev) =>
      prev.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🛡️ LiDAR Fall Prediction Engine
            <div className="flex items-center gap-2">
              <Badge
                variant={realTimeMonitoring.isActive ? 'default' : 'secondary'}
              >
                {realTimeMonitoring.isActive ? '🔴 Monitoring' : '⚪ Static'}
              </Badge>
              <Badge variant={realTimeAnalysis ? 'default' : 'secondary'}>
                {realTimeAnalysis ? '📡 Real-time' : '📊 Manual'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="text-muted-foreground text-sm">
              Advanced ML-powered fall risk assessment using LiDAR sensor fusion
            </div>
            <Button
              onClick={runFallRiskAnalysis}
              disabled={isAnalyzing}
              variant="default"
            >
              {isAnalyzing ? '🔄 Analyzing...' : '🎯 Analyze Fall Risk'}
            </Button>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-muted-foreground text-center text-sm">
                Running comprehensive fall risk analysis...{' '}
                {Math.round(analysisProgress)}%
              </p>
            </div>
          )}

          {/* Real-time Monitoring Status */}
          {realTimeMonitoring.isActive && (
            <div className="p-3 bg-blue-50 mt-4 rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Risk Level</span>
                <span className="text-blue-600 text-lg font-bold">
                  {Math.round(realTimeMonitoring.currentRisk)}%
                </span>
              </div>
              <Progress
                value={realTimeMonitoring.currentRisk}
                className="mt-2"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">
              ⚠️ Active Fall Risk Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeAlerts
                .filter((alert) => !alert.acknowledged)
                .map((alert) => (
                  <Alert
                    key={alert.id}
                    className={`border-${alert.severity === 'critical' ? 'red' : 'orange'}-200`}
                  >
                    <AlertDescription className="flex items-center justify-between">
                      <div>
                        <strong>{alert.message}</strong>
                        <br />
                        <span className="text-sm">{alert.recommendation}</span>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => acknowledgeAlert(alert.id)}
                      >
                        ✓ OK
                      </Button>
                    </AlertDescription>
                  </Alert>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {currentPrediction && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="metrics">📏 Metrics</TabsTrigger>
            <TabsTrigger value="interventions">💡 Interventions</TabsTrigger>
            <TabsTrigger value="monitoring">📈 Monitoring</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Risk Summary */}
            <div className="md:grid-cols-3 grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-red-600 text-3xl font-bold">
                      {currentPrediction.riskScore}%
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Fall Risk Score
                    </div>
                    <Badge
                      className={`mt-2 ${getRiskColor(currentPrediction.riskLevel)}`}
                    >
                      {currentPrediction.riskLevel.toUpperCase()}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-blue-600 text-2xl font-bold">
                      {currentPrediction.confidence.toFixed(0)}%
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Model Confidence
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-orange-600 text-2xl font-bold">
                      {currentPrediction.riskFactors.length}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Risk Factors
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Prediction Timeline */}
            <Card>
              <CardHeader>
                <CardTitle>📅 Fall Risk Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Next 24 Hours</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={currentPrediction.predictions.next24Hours}
                        className="w-32"
                      />
                      <span className="text-sm font-medium">
                        {currentPrediction.predictions.next24Hours.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Week</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={currentPrediction.predictions.nextWeek}
                        className="w-32"
                      />
                      <span className="text-sm font-medium">
                        {currentPrediction.predictions.nextWeek.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Next Month</span>
                    <div className="flex items-center gap-2">
                      <Progress
                        value={currentPrediction.predictions.nextMonth}
                        className="w-32"
                      />
                      <span className="text-sm font-medium">
                        {currentPrediction.predictions.nextMonth.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Top Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle>⚠️ Primary Risk Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentPrediction.riskFactors
                    .sort((a, b) => b.contribution - a.contribution)
                    .slice(0, 3)
                    .map((factor) => (
                      <div
                        key={factor.id}
                        className="p-3 bg-red-50 flex items-center justify-between rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{factor.factor}</h4>
                          <p className="text-muted-foreground text-sm">
                            {factor.category} •{' '}
                            {factor.modifiable
                              ? 'Modifiable'
                              : 'Non-modifiable'}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getRiskColor(factor.severity)}>
                            {factor.severity}
                          </Badge>
                          <div className="mt-1 text-sm font-medium">
                            {factor.contribution}% contribution
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
              {/* Gait Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>🚶 Gait Analysis</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Step Length</span>
                      <span className="text-sm font-medium">
                        {currentPrediction.metrics.gaitStability.stepLength}cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Step Width</span>
                      <span className="text-sm font-medium">
                        {currentPrediction.metrics.gaitStability.stepWidth}cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Variability</span>
                      <span className="text-sm font-medium">
                        {currentPrediction.metrics.gaitStability.variability}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Asymmetry</span>
                      <span className="text-sm font-medium">
                        {currentPrediction.metrics.gaitStability.asymmetry}%
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Balance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>⚖️ Balance Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Stability Index</span>
                      <span className="text-sm font-medium">
                        {
                          currentPrediction.metrics.balanceMetrics
                            .stabilityIndex
                        }
                        /100
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sway Area</span>
                      <span className="text-sm font-medium">
                        {currentPrediction.metrics.balanceMetrics.swayArea}cm²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Sway Velocity</span>
                      <span className="text-sm font-medium">
                        {currentPrediction.metrics.balanceMetrics.swayVelocity}
                        cm/s
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Biomechanical Factors */}
              <Card>
                <CardHeader>
                  <CardTitle>💪 Biomechanical Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-sm">Lower Limb Strength</span>
                        <span className="text-sm font-medium">
                          {
                            currentPrediction.metrics.biomechanicalFactors
                              .lowerLimbStrength
                          }
                          /100
                        </span>
                      </div>
                      <Progress
                        value={
                          currentPrediction.metrics.biomechanicalFactors
                            .lowerLimbStrength
                        }
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-sm">Coordination Index</span>
                        <span className="text-sm font-medium">
                          {
                            currentPrediction.metrics.biomechanicalFactors
                              .coordinationIndex
                          }
                          /100
                        </span>
                      </div>
                      <Progress
                        value={
                          currentPrediction.metrics.biomechanicalFactors
                            .coordinationIndex
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Reaction Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>⚡ Reaction Assessment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm">Reaction Time</span>
                      <span className="text-sm font-medium">
                        {
                          currentPrediction.metrics.reactionMetrics
                            .compensatoryResponse
                        }
                        ms
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm">Recovery Strategy</span>
                      <span className="text-sm font-medium">
                        {
                          currentPrediction.metrics.reactionMetrics
                            .recoveryStrategy
                        }
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="interventions" className="space-y-4">
            <div className="space-y-4">
              {currentPrediction.interventions
                .sort((a, b) => {
                  const urgencyOrder = {
                    critical: 0,
                    high: 1,
                    medium: 2,
                    low: 3,
                  };
                  return urgencyOrder[a.urgency] - urgencyOrder[b.urgency];
                })
                .map((intervention) => (
                  <Card key={intervention.id}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-lg">
                          {intervention.title}
                        </CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge
                            className={getUrgencyColor(intervention.urgency)}
                          >
                            {intervention.urgency}
                          </Badge>
                          <Badge variant="outline">{intervention.type}</Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground mb-3 text-sm">
                        {intervention.description}
                      </p>

                      <div className="md:grid-cols-3 mb-3 grid grid-cols-1 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Expected Benefit:</span>
                          <p className="text-muted-foreground">
                            {intervention.expectedBenefit}% risk reduction
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Time to Effect:</span>
                          <p className="text-muted-foreground">
                            {intervention.timeToEffect}
                          </p>
                        </div>
                        <div>
                          <span className="font-medium">Monitoring:</span>
                          <p className="text-muted-foreground">
                            {intervention.monitoringRequired
                              ? 'Required'
                              : 'Optional'}
                          </p>
                        </div>
                      </div>

                      <div className="mb-3 space-y-2">
                        <h4 className="text-sm font-medium">Instructions:</h4>
                        <ul className="space-y-1 text-sm">
                          {intervention.instructions.map(
                            (instruction, index) => (
                              <li
                                key={instruction}
                                className="flex items-start gap-2"
                              >
                                <span className="text-blue-500 font-medium">
                                  {index + 1}.
                                </span>
                                {instruction}
                              </li>
                            )
                          )}
                        </ul>
                      </div>

                      {intervention.contraindications.length > 0 && (
                        <div className="bg-yellow-50 border-yellow-200 rounded border p-2">
                          <h4 className="text-yellow-800 mb-1 text-sm font-medium">
                            ⚠️ Contraindications:
                          </h4>
                          <ul className="text-yellow-700 text-sm">
                            {intervention.contraindications.map((contra) => (
                              <li key={contra}>• {contra}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>📈 Monitoring Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="mb-2 font-medium">📋 Regular Assessments</h4>
                    <ul className="space-y-1 text-sm">
                      {currentPrediction.monitoringRecommendations.map(
                        (rec) => (
                          <li key={rec} className="flex items-start gap-2">
                            <span className="text-blue-500">•</span>
                            {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div>
                    <h4 className="mb-2 font-medium">
                      🏠 Environmental Safety
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {currentPrediction.environmentalRecommendations.map(
                        (rec) => (
                          <li key={rec} className="flex items-start gap-2">
                            <span className="text-green-500">•</span>
                            {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  <div className="bg-blue-50 rounded-lg p-4">
                    <h4 className="mb-2 font-medium">
                      🔄 Real-time Monitoring Settings
                    </h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Alert Threshold</span>
                        <span className="text-sm font-medium">
                          {realTimeMonitoring.triggerThreshold}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Monitoring Mode</span>
                        <span className="text-sm font-medium">
                          {realTimeMonitoring.monitoringMode}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Active Sensors</span>
                        <div className="flex gap-1">
                          {Object.entries(realTimeMonitoring.sensorFusion)
                            .filter(([, active]) => active)
                            .map(([sensor]) => (
                              <Badge
                                key={sensor}
                                variant="secondary"
                                className="text-xs"
                              >
                                {sensor}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
