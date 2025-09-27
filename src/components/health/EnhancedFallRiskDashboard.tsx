/**
 * Enhanced Fall Risk Management Dashboard
 * Comprehensive UI for advanced fall risk assessment, prediction, and intervention
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  Brain,
  Calendar,
  CheckCircle,
  Clock,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';

// Import our enhanced engines
import {
  AdvancedFallRiskEngine,
  AdvancedFallRiskPrediction,
} from '@/lib/advanced-fall-risk-engine';
import {
  EnhancedFallDetectionEngine,
  EnhancedSensorData,
  FallDetectionEvent,
} from '@/lib/enhanced-fall-detection-engine';
import {
  EnhancedInterventionEngine,
  PersonalizedInterventionPlan,
  UserProfile,
} from '@/lib/enhanced-intervention-engine';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';

interface EnhancedFallRiskDashboardProps {
  healthData: ProcessedHealthData;
  sensorData?: EnhancedSensorData;
  onInterventionStart?: (interventionId: string) => void;
  onEmergencyAlert?: (event: FallDetectionEvent) => void;
}

export default function EnhancedFallRiskDashboard({
  healthData,
  sensorData,
  onInterventionStart,
  onEmergencyAlert,
}: EnhancedFallRiskDashboardProps) {
  // State management
  const [riskPrediction, setRiskPrediction] =
    useState<AdvancedFallRiskPrediction | null>(null);
  const [interventionPlan, setInterventionPlan] =
    useState<PersonalizedInterventionPlan | null>(null);
  const [fallDetectionEvents, setFallDetectionEvents] = useState<
    FallDetectionEvent[]
  >([]);
  const [realTimeMonitoring, setRealTimeMonitoring] = useState(false);
  const [loading, setLoading] = useState(true);

  // Engine instances (useMemo would be better for performance in real app)
  const riskEngine = React.useMemo(() => new AdvancedFallRiskEngine(), []);
  const detectionEngine = React.useMemo(
    () => new EnhancedFallDetectionEngine(),
    []
  );
  const interventionEngine = React.useMemo(
    () => new EnhancedInterventionEngine(),
    []
  );

  // User profile (would come from user context in real app)
  const userProfile: UserProfile = React.useMemo(
    () => ({
      age: 72,
      mobility: 'independent',
      livingSituation: 'with_family',
      medicalConditions: ['hypertension', 'mild_arthritis'],
      currentActivity: 'light',
      preferences: {
        timeOfDay: 'morning',
        intensity: 'moderate',
        duration: 'medium',
        location: 'home',
        equipment: ['chair', 'resistance_bands'],
        limitations: ['knee_sensitivity'],
      },
    }),
    []
  );

  // Initialize risk assessment
  useEffect(() => {
    const assessRisk = async () => {
      try {
        setLoading(true);
        const prediction = await riskEngine.predictFallRisk(healthData);
        setRiskPrediction(prediction);

        // Generate intervention plan
        const plan = interventionEngine.generatePersonalizedPlan(
          prediction,
          userProfile
        );
        setInterventionPlan(plan);
      } catch (error) {
        console.error('Failed to assess fall risk:', error);
      } finally {
        setLoading(false);
      }
    };

    assessRisk();
  }, [healthData, riskEngine, interventionEngine, userProfile]);

  // Real-time sensor data processing
  useEffect(() => {
    if (!sensorData || !realTimeMonitoring) return;

    const processSensorData = async () => {
      try {
        const result = await detectionEngine.processSensorData(sensorData);

        if (result.fallDetected && result.event) {
          setFallDetectionEvents((prev) => [result.event!, ...prev]);
          onEmergencyAlert?.(result.event);
        }
      } catch (error) {
        console.error('Failed to process sensor data:', error);
      }
    };

    processSensorData();
  }, [sensorData, realTimeMonitoring, onEmergencyAlert, detectionEngine]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'bg-red-500';
      case 'severe':
        return 'bg-red-400';
      case 'high':
        return 'bg-orange-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      case 'minimal':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getRiskLevelIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'severe':
        return <AlertTriangle className="h-5 w-5 text-red-600" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      case 'moderate':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      default:
        return <Shield className="h-5 w-5 text-green-600" />;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin border-blue-600 h-8 w-8 rounded-full border-b-2"></div>
              <span className="ml-2">Analyzing fall risk...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!riskPrediction || !interventionPlan) {
    return (
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Unable to load fall risk assessment. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Overall Risk Score */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {getRiskLevelIcon(riskPrediction.riskLevel)}
            VitalSense Fall Risk Assessment
          </CardTitle>
          <CardDescription>
            Comprehensive AI-powered fall risk analysis and prevention system
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="md:grid-cols-3 grid grid-cols-1 gap-6">
            {/* Overall Risk Score */}
            <div className="text-center">
              <div className="mb-2 text-3xl font-bold">
                {riskPrediction.riskScore}
              </div>
              <div className="text-gray-600 mb-3 text-sm">
                Risk Score (0-100)
              </div>
              <Badge
                className={`${getRiskLevelColor(riskPrediction.riskLevel)} text-white`}
              >
                {riskPrediction.riskLevel.toUpperCase()}
              </Badge>
            </div>

            {/* Confidence & Next Assessment */}
            <div className="text-center">
              <div className="mb-2 text-2xl font-semibold">
                {Math.round(riskPrediction.confidence * 100)}%
              </div>
              <div className="text-gray-600 mb-3 text-sm">
                Prediction Confidence
              </div>
              <div className="text-xs text-gray-500">
                Next assessment:{' '}
                {riskPrediction.nextAssessment.toLocaleDateString()}
              </div>
            </div>

            {/* Real-time Monitoring */}
            <div className="text-center">
              <Button
                variant={realTimeMonitoring ? 'destructive' : 'default'}
                onClick={() => setRealTimeMonitoring(!realTimeMonitoring)}
                className="w-full"
              >
                <Zap className="mr-2 h-4 w-4" />
                {realTimeMonitoring
                  ? 'Stop Monitoring'
                  : 'Start Real-time Monitoring'}
              </Button>
              <div className="text-xs mt-2 text-gray-500">
                {realTimeMonitoring ? 'Monitoring active' : 'Monitoring paused'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {(riskPrediction.riskLevel === 'critical' ||
        riskPrediction.riskLevel === 'severe') && (
        <Alert className="border-red-500 bg-red-50">
          <AlertTriangle className="text-red-600 h-4 w-4" />
          <AlertDescription className="text-red-800">
            <strong>High fall risk detected.</strong> Immediate intervention
            recommended. Consider contacting your healthcare provider and
            implementing suggested interventions below.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Fall Detection Events */}
      {fallDetectionEvents.length > 0 && (
        <Alert className="border-orange-500 bg-orange-50">
          <AlertTriangle className="text-orange-600 h-4 w-4" />
          <AlertDescription className="text-orange-800">
            <strong>Recent fall detection activity.</strong>{' '}
            {fallDetectionEvents.length} event(s) detected.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="prediction">AI Prediction</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="monitoring">Real-time</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Risk Factor Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Risk Factor Analysis
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Gait Risk</span>
                      <span>{riskPrediction.gaitRisk.overallScore}%</span>
                    </div>
                    <Progress
                      value={riskPrediction.gaitRisk.overallScore}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Balance Risk</span>
                      <span>{riskPrediction.balanceRisk.overallScore}%</span>
                    </div>
                    <Progress
                      value={riskPrediction.balanceRisk.overallScore}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Environmental Risk</span>
                      <span>
                        {riskPrediction.environmentalRisk.overallScore}%
                      </span>
                    </div>
                    <Progress
                      value={riskPrediction.environmentalRisk.overallScore}
                      className="h-2"
                    />
                  </div>
                  <div>
                    <div className="mb-1 flex justify-between text-sm">
                      <span>Physiological Risk</span>
                      <span>
                        {riskPrediction.physiologicalRisk.overallScore}%
                      </span>
                    </div>
                    <Progress
                      value={riskPrediction.physiologicalRisk.overallScore}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Protective Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Protective Factors
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskPrediction.protectiveFactors.length > 0 ? (
                  <div className="space-y-2">
                    {riskPrediction.protectiveFactors.map((factor) => (
                      <div key={factor.id} className="flex items-center gap-2">
                        <CheckCircle className="text-green-500 h-4 w-4" />
                        <span className="text-sm">{factor.description}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Focus on building protective factors through interventions
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Primary Risk Factors */}
          <Card>
            <CardHeader>
              <CardTitle>Primary Risk Factors</CardTitle>
              <CardDescription>
                Key factors contributing to your current fall risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
                {riskPrediction.primaryRiskFactors.map((riskFactor) => (
                  <div key={riskFactor.id} className="rounded-lg border p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">
                        {riskFactor.description}
                      </span>
                      <Badge
                        variant={
                          riskFactor.severity === 'high'
                            ? 'destructive'
                            : 'secondary'
                        }
                      >
                        {riskFactor.severity}
                      </Badge>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm">
                      {riskFactor.explanation}
                    </p>
                    <div className="text-xs text-gray-500">
                      Weight: {Math.round(riskFactor.weight * 100)}% |
                      {riskFactor.modifiable
                        ? ' Modifiable'
                        : ' Non-modifiable'}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Prediction Tab */}
        <TabsContent value="prediction" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Temporal Risk Predictions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Short-term Risk
                </CardTitle>
                <CardDescription>Next 1-4 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-3xl font-bold">
                  {riskPrediction.shortTermRisk}%
                </div>
                <Progress
                  value={riskPrediction.shortTermRisk}
                  className="mt-4"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Medium-term Risk
                </CardTitle>
                <CardDescription>Next 24-72 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-3xl font-bold">
                  {riskPrediction.mediumTermRisk}%
                </div>
                <Progress
                  value={riskPrediction.mediumTermRisk}
                  className="mt-4"
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Long-term Risk
                </CardTitle>
                <CardDescription>Next 7-30 days</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-3xl font-bold">
                  {riskPrediction.longTermRisk}%
                </div>
                <Progress
                  value={riskPrediction.longTermRisk}
                  className="mt-4"
                />
              </CardContent>
            </Card>
          </div>

          {/* ML Model Contributions */}
          <Card>
            <CardHeader>
              <CardTitle>AI Model Insights</CardTitle>
              <CardDescription>
                How different AI models contribute to your risk assessment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {riskPrediction.modelEnsemble.map((model) => (
                  <div
                    key={`${model.name}-${model.algorithm}`}
                    className="p-3 flex items-center justify-between rounded border"
                  >
                    <div>
                      <div className="font-medium">{model.name}</div>
                      <div className="text-sm text-gray-500">
                        Algorithm: {model.algorithm} | Confidence:{' '}
                        {Math.round(model.confidence * 100)}%
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        {Math.round(model.prediction)}%
                      </div>
                      <div className="text-sm text-gray-500">
                        Weight: {Math.round(model.weight * 100)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Interventions Tab */}
        <TabsContent value="interventions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Personalized Intervention Plan
              </CardTitle>
              <CardDescription>
                Evidence-based interventions tailored to your risk profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="md:grid-cols-2 grid grid-cols-1 gap-6">
                {interventionPlan.activeInterventions
                  .slice(0, 6)
                  .map((intervention) => (
                    <div
                      key={intervention.id}
                      className="rounded-lg border p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold">{intervention.title}</h3>
                        <Badge
                          variant={
                            intervention.priority === 'urgent'
                              ? 'destructive'
                              : 'default'
                          }
                        >
                          {intervention.priority}
                        </Badge>
                      </div>
                      <p className="text-gray-600 mb-3 text-sm">
                        {intervention.description}
                      </p>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-green-600">
                          -{intervention.riskReduction}% risk reduction
                        </span>
                        <span className="text-gray-500">
                          {intervention.timeframe}
                        </span>
                      </div>
                      <Button
                        size="sm"
                        className="mt-3 w-full"
                        onClick={() => onInterventionStart?.(intervention.id)}
                      >
                        Start Intervention
                      </Button>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>

          {/* Emergency Actions */}
          {riskPrediction.emergencyActions.length > 0 && (
            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Emergency Actions Required
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {riskPrediction.emergencyActions.map((action) => (
                    <Alert key={action.id} className="border-red-300 bg-red-50">
                      <AlertDescription className="text-red-800">
                        <strong>{action.trigger}:</strong> {action.action}
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Real-time Monitoring Tab */}
        <TabsContent value="monitoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Real-time Fall Detection
              </CardTitle>
              <CardDescription>
                Live monitoring using multi-sensor fall detection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded border p-4">
                  <div>
                    <div className="font-medium">Monitoring Status</div>
                    <div className="text-sm text-gray-500">
                      {realTimeMonitoring
                        ? 'Active - sensors monitoring'
                        : 'Paused'}
                    </div>
                  </div>
                  <div
                    className={`h-3 w-3 rounded-full ${realTimeMonitoring ? 'bg-green-500' : 'bg-gray-300'}`}
                  />
                </div>

                {sensorData && (
                  <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
                    <div className="p-3 rounded border text-center">
                      <div className="text-lg font-semibold">
                        {sensorData.accelerometer.magnitude.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Acceleration (g)
                      </div>
                    </div>
                    <div className="p-3 rounded border text-center">
                      <div className="text-lg font-semibold">
                        {sensorData.gyroscope.magnitude.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-500">
                        Rotation (°/s)
                      </div>
                    </div>
                    <div className="p-3 rounded border text-center">
                      <div className="text-lg font-semibold">
                        {sensorData.heartRate}
                      </div>
                      <div className="text-sm text-gray-500">
                        Heart Rate (bpm)
                      </div>
                    </div>
                    <div className="p-3 rounded border text-center">
                      <div className="text-lg font-semibold">
                        {Math.round(sensorData.confidence * 100)}%
                      </div>
                      <div className="text-sm text-gray-500">Confidence</div>
                    </div>
                  </div>
                )}

                {fallDetectionEvents.length > 0 && (
                  <div className="mt-6">
                    <h3 className="mb-3 font-semibold">
                      Recent Detection Events
                    </h3>
                    <div className="space-y-2">
                      {fallDetectionEvents.slice(0, 5).map((event) => (
                        <div
                          key={event.id}
                          className="p-3 flex items-center justify-between rounded border"
                        >
                          <div>
                            <div className="font-medium">
                              {event.severity.toUpperCase()} event detected
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(event.timestamp).toLocaleString()}
                            </div>
                          </div>
                          <Badge
                            variant={
                              event.severity === 'critical'
                                ? 'destructive'
                                : 'secondary'
                            }
                          >
                            {Math.round(event.confidence * 100)}% confidence
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Risk Reduction Progress
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="md:grid-cols-3 grid grid-cols-1 gap-6">
                <div className="text-center">
                  <div className="text-gray-800 text-2xl font-bold">
                    {interventionPlan.baselineRisk}
                  </div>
                  <div className="text-sm text-gray-500">Baseline Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-600 text-2xl font-bold">
                    {interventionPlan.currentRisk}
                  </div>
                  <div className="text-sm text-gray-500">Current Risk</div>
                </div>
                <div className="text-center">
                  <div className="text-green-600 text-2xl font-bold">
                    {interventionPlan.targetRisk}
                  </div>
                  <div className="text-sm text-gray-500">Target Risk</div>
                </div>
              </div>

              <div className="mt-6">
                <div className="mb-2 flex justify-between text-sm">
                  <span>Progress to Target</span>
                  <span>
                    {Math.round(
                      ((interventionPlan.baselineRisk -
                        interventionPlan.currentRisk) /
                        (interventionPlan.baselineRisk -
                          interventionPlan.targetRisk)) *
                        100
                    )}
                    %
                  </span>
                </div>
                <Progress
                  value={
                    ((interventionPlan.baselineRisk -
                      interventionPlan.currentRisk) /
                      (interventionPlan.baselineRisk -
                        interventionPlan.targetRisk)) *
                    100
                  }
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Intervention Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {interventionPlan.progress.map((progress) => (
                  <div
                    key={progress.interventionId}
                    className="rounded-lg border p-4"
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <span className="font-medium">
                        {
                          interventionPlan.activeInterventions.find(
                            (i) => i.id === progress.interventionId
                          )?.title
                        }
                      </span>
                      <Badge variant="outline">
                        {progress.completionRate}% complete
                      </Badge>
                    </div>
                    <Progress
                      value={progress.completionRate}
                      className="mb-2"
                    />
                    <div className="flex justify-between text-sm text-gray-500">
                      <span>Adherence: {progress.adherenceRate}%</span>
                      <span>Effectiveness: {progress.effectiveness}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
