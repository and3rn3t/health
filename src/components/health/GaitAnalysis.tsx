/**
 * Gait Analysis Component
 * Advanced biomechanical analysis of walking patterns, stride characteristics, and gait stability
 */

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
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronRight,
  Footprints,
  Heart,
  LineChart,
  MapPin,
  Route,
  Ruler,
  Target,
  Timer,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';

interface GaitAnalysisProps {
  healthData: ProcessedHealthData;
  onNavigateToFeature?: (feature: string) => void;
}

interface GaitMetrics {
  biomechanics: {
    strideLength: number;
    cadence: number; // steps per minute
    stepWidth: number;
    doubleSupport: number; // percentage of gait cycle
    symmetry: number; // percentage
    variability: number; // coefficient of variation
  };
  stability: {
    steadinessScore: number;
    balanceIndex: number;
    fallRisk: 'low' | 'moderate' | 'high' | 'critical';
    stabilityTrend: 'improving' | 'declining' | 'stable';
    weeklyChange: number;
  };
  performance: {
    walkingSpeed: number; // m/s
    endurance: number; // percentage
    efficiency: number; // energy cost index
    fatigue: number; // accumulated fatigue score
    recovery: number; // recovery capacity
  };
  patterns: {
    consistency: number;
    adaptability: number;
    terrainHandling: number;
    timeOfDayVariation: GaitTimePattern[];
  };
  neurological: {
    cognitiveLoad: number;
    dualTaskPerformance: number;
    motorControl: number;
    adaptiveCapacity: number;
  };
  recommendations: GaitRecommendation[];
  alerts: GaitAlert[];
}

interface GaitTimePattern {
  timeRange: string;
  quality: number;
  volume: number;
  characteristics: string[];
}

interface GaitRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'biomechanics' | 'strength' | 'balance' | 'endurance' | 'safety';
  priority: 'critical' | 'high' | 'medium' | 'low';
  timeframe: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  evidence: string;
}

interface GaitAlert {
  id: string;
  type: 'warning' | 'concern' | 'improvement';
  title: string;
  description: string;
  severity: 'low' | 'moderate' | 'high';
  action: string;
}

const GaitAnalysis: React.FC<GaitAnalysisProps> = ({
  healthData,
  onNavigateToFeature,
}) => {
  // Calculate comprehensive gait metrics from health data
  const gaitMetrics = useMemo((): GaitMetrics => {
    const stepsData = healthData.metrics.steps;
    const steadinessData = healthData.metrics.walkingSteadiness;
    const distanceData = healthData.metrics.distanceWalking;
    const heartRateData = healthData.metrics.heartRate;

    // Calculate biomechanical parameters
    const dailySteps = stepsData?.lastValue || 8500;
    const dailyDistance = distanceData?.lastValue || 4.2; // km
    const averageStrideLength = (dailyDistance * 1000) / dailySteps; // meters
    const avgWalkingTime = 60; // minutes per day estimated
    const cadence = dailySteps / avgWalkingTime; // steps per minute

    const biomechanics = {
      strideLength: averageStrideLength,
      cadence: cadence,
      stepWidth: 0.12, // typical step width in meters
      doubleSupport: 24, // percentage of gait cycle
      symmetry: 95 - (stepsData?.variability || 5), // symmetry based on step variability
      variability: stepsData?.variability || 8,
    };

    // Calculate stability metrics
    const steadinessScore = steadinessData?.average || 82;
    const balanceIndex = Math.min(
      100,
      steadinessScore + (100 - biomechanics.variability)
    );
    let fallRisk: 'low' | 'moderate' | 'high' | 'critical';

    if (steadinessScore >= 85) fallRisk = 'low';
    else if (steadinessScore >= 70) fallRisk = 'moderate';
    else if (steadinessScore >= 50) fallRisk = 'high';
    else fallRisk = 'critical';

    const stabilityTrend: 'improving' | 'declining' | 'stable' =
      steadinessData?.trend === 'increasing'
        ? 'improving'
        : steadinessData?.trend === 'decreasing'
          ? 'declining'
          : 'stable';
    const weeklyChange =
      (((steadinessData?.lastValue || 82) - (steadinessData?.average || 82)) /
        (steadinessData?.average || 82)) *
      100;

    const stability = {
      steadinessScore,
      balanceIndex,
      fallRisk,
      stabilityTrend,
      weeklyChange,
    };

    // Calculate performance metrics
    const walkingSpeed =
      dailyDistance > 0 ? (dailyDistance * 1000) / (avgWalkingTime * 60) : 1.2; // m/s
    const endurance = Math.min(100, (dailySteps / 10000) * 100);
    const efficiency = Math.max(50, 100 - (heartRateData?.variability || 15));
    const fatigue = Math.max(0, 100 - endurance);
    const recovery = Math.min(100, efficiency + steadinessScore / 2);

    const performance = {
      walkingSpeed,
      endurance,
      efficiency,
      fatigue,
      recovery,
    };

    // Calculate pattern analysis
    const consistency = 100 - biomechanics.variability;
    const adaptability = Math.min(100, balanceIndex + efficiency) / 2;
    const terrainHandling = Math.min(100, steadinessScore + walkingSpeed * 50);

    const timeOfDayVariation: GaitTimePattern[] = [
      {
        timeRange: '6:00 AM - 10:00 AM',
        quality: 92,
        volume: 35,
        characteristics: ['Fresh', 'Optimal stride', 'Good balance'],
      },
      {
        timeRange: '10:00 AM - 2:00 PM',
        quality: 88,
        volume: 40,
        characteristics: ['Peak activity', 'Consistent pace', 'Adaptive'],
      },
      {
        timeRange: '2:00 PM - 6:00 PM',
        quality: 85,
        volume: 20,
        characteristics: ['Slight fatigue', 'Maintained form', 'Stable'],
      },
      {
        timeRange: '6:00 PM - 10:00 PM',
        quality: 78,
        volume: 5,
        characteristics: ['End-day fatigue', 'Slower pace', 'Cautious'],
      },
    ];

    const patterns = {
      consistency,
      adaptability,
      terrainHandling,
      timeOfDayVariation,
    };

    // Calculate neurological factors
    const cognitiveLoad = Math.max(30, 100 - biomechanics.variability * 8);
    const dualTaskPerformance = Math.min(
      100,
      steadinessScore + consistency / 2
    );
    const motorControl = Math.min(
      100,
      biomechanics.symmetry + (100 - biomechanics.variability)
    );
    const adaptiveCapacity = Math.min(
      100,
      (adaptability + terrainHandling) / 2
    );

    const neurological = {
      cognitiveLoad,
      dualTaskPerformance,
      motorControl,
      adaptiveCapacity,
    };

    // Generate evidence-based recommendations
    const recommendations: GaitRecommendation[] = [
      {
        id: 'stride-optimization',
        title: 'Optimize Stride Length',
        description: `Your current stride length is ${averageStrideLength.toFixed(2)}m. Consider stride length training to improve efficiency and reduce injury risk.`,
        category: 'biomechanics',
        priority:
          averageStrideLength < 0.6 || averageStrideLength > 0.8
            ? 'high'
            : 'medium',
        timeframe: '4-6 weeks',
        difficulty: 'intermediate',
        evidence:
          'Research shows optimal stride length reduces energy expenditure by 8-12%',
      },
      {
        id: 'cadence-training',
        title: 'Cadence Optimization',
        description: `Current cadence: ${cadence.toFixed(0)} steps/min. Target range is 160-180 steps/min for optimal efficiency.`,
        category: 'biomechanics',
        priority: cadence < 140 ? 'high' : 'medium',
        timeframe: '2-3 weeks',
        difficulty: 'beginner',
        evidence: 'Higher cadence reduces impact forces and injury risk',
      },
      {
        id: 'balance-training',
        title: 'Dynamic Balance Enhancement',
        description: `Balance index: ${balanceIndex.toFixed(0)}%. Incorporate single-leg stands and dynamic balance exercises.`,
        category: 'balance',
        priority:
          balanceIndex < 70
            ? 'critical'
            : fallRisk === 'moderate'
              ? 'high'
              : 'medium',
        timeframe: '6-8 weeks',
        difficulty: 'beginner',
        evidence: 'Balance training reduces fall risk by up to 37% in adults',
      },
      {
        id: 'gait-symmetry',
        title: 'Improve Gait Symmetry',
        description: `Current symmetry: ${biomechanics.symmetry.toFixed(0)}%. Focus on unilateral exercises and form correction.`,
        category: 'biomechanics',
        priority: biomechanics.symmetry < 90 ? 'high' : 'low',
        timeframe: '4-6 weeks',
        difficulty: 'intermediate',
        evidence:
          'Improved symmetry enhances efficiency and reduces overuse injuries',
      },
    ];

    // Generate alerts based on metrics
    const alerts: GaitAlert[] = [];

    if (fallRisk === 'high' || fallRisk === 'critical') {
      alerts.push({
        id: 'fall-risk-alert',
        type: 'warning',
        title: 'Elevated Fall Risk Detected',
        description: `Walking steadiness score of ${steadinessScore.toFixed(0)}% indicates ${fallRisk} fall risk.`,
        severity: fallRisk === 'critical' ? 'high' : 'moderate',
        action: 'Consider consulting a healthcare provider for gait assessment',
      });
    }

    if (biomechanics.variability > 15) {
      alerts.push({
        id: 'gait-variability',
        type: 'concern',
        title: 'High Gait Variability',
        description: `Gait variability of ${biomechanics.variability.toFixed(1)}% suggests inconsistent walking patterns.`,
        severity: 'moderate',
        action: 'Focus on gait training and consistency exercises',
      });
    }

    if (stabilityTrend === 'improving' && weeklyChange > 5) {
      alerts.push({
        id: 'improvement-trend',
        type: 'improvement',
        title: 'Gait Stability Improving',
        description: `Walking steadiness has improved by ${weeklyChange.toFixed(1)}% this week.`,
        severity: 'low',
        action: 'Continue current activities and maintain progress',
      });
    }

    return {
      biomechanics,
      stability,
      performance,
      patterns,
      neurological,
      recommendations,
      alerts,
    };
  }, [healthData]);

  const getRiskBadgeVariant = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'default';
      case 'moderate':
        return 'secondary';
      case 'high':
        return 'destructive';
      default:
        return 'destructive'; // critical
    }
  };

  const getPriorityBadgeVariant = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getAlertBadgeVariant = (type: string) => {
    switch (type) {
      case 'warning':
        return 'destructive';
      case 'concern':
        return 'secondary';
      default:
        return 'default'; // improvement
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving')
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining')
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Footprints className="h-6 w-6 text-vitalsense-primary" />
            Gait Analysis
          </h1>
          <p className="mt-1 text-gray-600">
            Advanced biomechanical analysis of your walking patterns and gait
            stability
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => onNavigateToFeature?.('walking-patterns')}
            className="flex items-center gap-2"
          >
            <Route className="h-4 w-4" />
            Walking Patterns
          </Button>
          <Button
            variant="outline"
            onClick={() => onNavigateToFeature?.('posture-analysis')}
            className="flex items-center gap-2"
          >
            <Activity className="h-4 w-4" />
            Posture Analysis
          </Button>
        </div>
      </div>

      {/* Alerts Section */}
      {gaitMetrics.alerts.length > 0 && (
        <div className="grid gap-3">
          {gaitMetrics.alerts.map((alert) => (
            <Card
              key={alert.id}
              className="border-l-4 border-l-vitalsense-warning"
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-2">
                      <h4 className="font-semibold">{alert.title}</h4>
                      <Badge variant={getAlertBadgeVariant(alert.type)}>
                        {alert.type}
                      </Badge>
                    </div>
                    <p className="mb-2 text-gray-600">{alert.description}</p>
                    <p className="text-sm font-medium text-vitalsense-primary">
                      {alert.action}
                    </p>
                  </div>
                  <AlertTriangle className="mt-1 h-5 w-5 flex-shrink-0 text-vitalsense-warning" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Fall Risk</p>
                <p className="text-2xl font-bold capitalize">
                  {gaitMetrics.stability.fallRisk}
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {getTrendIcon(gaitMetrics.stability.stabilityTrend)}
                  <span className="text-sm text-gray-600">
                    {gaitMetrics.stability.weeklyChange.toFixed(1)}% this week
                  </span>
                </div>
              </div>
              <Badge
                variant={getRiskBadgeVariant(gaitMetrics.stability.fallRisk)}
              >
                {gaitMetrics.stability.steadinessScore.toFixed(0)}%
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Walking Speed
                </p>
                <p className="text-2xl font-bold">
                  {gaitMetrics.performance.walkingSpeed.toFixed(1)} m/s
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Cadence: {gaitMetrics.biomechanics.cadence.toFixed(0)} spm
                </p>
              </div>
              <Timer className="h-8 w-8 text-vitalsense-teal" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Gait Symmetry
                </p>
                <p className="text-2xl font-bold">
                  {gaitMetrics.biomechanics.symmetry.toFixed(0)}%
                </p>
                <div className="mt-2">
                  <Progress
                    value={gaitMetrics.biomechanics.symmetry}
                    className="h-2"
                  />
                </div>
              </div>
              <Ruler className="h-8 w-8 text-vitalsense-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Stride Length
                </p>
                <p className="text-2xl font-bold">
                  {gaitMetrics.biomechanics.strideLength.toFixed(2)}m
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Variability: {gaitMetrics.biomechanics.variability.toFixed(1)}
                  %
                </p>
              </div>
              <MapPin className="h-8 w-8 text-vitalsense-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="biomechanics" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="biomechanics">Biomechanics</TabsTrigger>
          <TabsTrigger value="stability">Stability</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="biomechanics" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Biomechanical Parameters</CardTitle>
                <CardDescription>
                  Key measurements of your walking mechanics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Stride Length</span>
                    <span className="font-bold">
                      {gaitMetrics.biomechanics.strideLength.toFixed(2)} m
                    </span>
                  </div>
                  <div className="mb-3 text-xs text-gray-600">
                    Optimal range: 0.65-0.75m for average height
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cadence</span>
                    <span className="font-bold">
                      {gaitMetrics.biomechanics.cadence.toFixed(0)} steps/min
                    </span>
                  </div>
                  <div className="mb-3 text-xs text-gray-600">
                    Optimal range: 160-180 steps/min
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Step Width</span>
                    <span className="font-bold">
                      {gaitMetrics.biomechanics.stepWidth.toFixed(2)} m
                    </span>
                  </div>
                  <div className="mb-3 text-xs text-gray-600">
                    Typical range: 0.10-0.15m
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Double Support</span>
                    <span className="font-bold">
                      {gaitMetrics.biomechanics.doubleSupport}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-600">
                    Normal: 20-25% of gait cycle
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Gait Quality Metrics</CardTitle>
                <CardDescription>
                  Symmetry and consistency indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Gait Symmetry</span>
                      <span className="font-bold">
                        {gaitMetrics.biomechanics.symmetry.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.biomechanics.symmetry}
                      className="mb-1 h-3"
                    />
                    <p className="text-xs text-gray-600">
                      Balance between left and right steps
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Consistency (Low Variability)
                      </span>
                      <span className="font-bold">
                        {(100 - gaitMetrics.biomechanics.variability).toFixed(
                          0
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={100 - gaitMetrics.biomechanics.variability}
                      className="mb-1 h-3"
                    />
                    <p className="text-xs text-gray-600">
                      Step-to-step consistency
                    </p>
                  </div>

                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="mb-1 font-medium text-blue-800">
                      💡 Insight
                    </h4>
                    <p className="text-sm text-blue-700">
                      Your gait shows{' '}
                      {gaitMetrics.biomechanics.symmetry > 90
                        ? 'excellent'
                        : 'good'}{' '}
                      symmetry.
                      {gaitMetrics.biomechanics.variability < 10
                        ? ' Consistency is also excellent.'
                        : ' Work on reducing step variability.'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="stability" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Stability Assessment</CardTitle>
                <CardDescription>
                  Balance and fall risk evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                      Walking Steadiness
                    </span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {gaitMetrics.stability.steadinessScore.toFixed(0)}%
                      </div>
                      <Badge
                        variant={getRiskBadgeVariant(
                          gaitMetrics.stability.fallRisk
                        )}
                      >
                        {gaitMetrics.stability.fallRisk} risk
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={gaitMetrics.stability.steadinessScore}
                    className="h-4"
                  />

                  <div className="flex items-center gap-2">
                    {getTrendIcon(gaitMetrics.stability.stabilityTrend)}
                    <span className="text-sm">
                      {gaitMetrics.stability.stabilityTrend === 'improving'
                        ? 'Improving'
                        : gaitMetrics.stability.stabilityTrend === 'declining'
                          ? 'Declining'
                          : 'Stable'}
                      ({gaitMetrics.stability.weeklyChange > 0 ? '+' : ''}
                      {gaitMetrics.stability.weeklyChange.toFixed(1)}% this
                      week)
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Balance Index</span>
                    <span className="font-bold">
                      {gaitMetrics.stability.balanceIndex.toFixed(0)}/100
                    </span>
                  </div>
                  <Progress
                    value={gaitMetrics.stability.balanceIndex}
                    className="h-2"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Neurological Factors</CardTitle>
                <CardDescription>
                  Cognitive and motor control aspects
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Motor Control</span>
                      <span className="font-bold">
                        {gaitMetrics.neurological.motorControl.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.neurological.motorControl}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Dual-Task Performance
                      </span>
                      <span className="font-bold">
                        {gaitMetrics.neurological.dualTaskPerformance.toFixed(
                          0
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.neurological.dualTaskPerformance}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Adaptive Capacity
                      </span>
                      <span className="font-bold">
                        {gaitMetrics.neurological.adaptiveCapacity.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.neurological.adaptiveCapacity}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Cognitive Load
                      </span>
                      <span className="font-bold">
                        {gaitMetrics.neurological.cognitiveLoad.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.neurological.cognitiveLoad}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Performance Metrics</CardTitle>
                <CardDescription>
                  Speed, endurance, and efficiency analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Walking Speed</span>
                    <span className="font-bold">
                      {gaitMetrics.performance.walkingSpeed.toFixed(2)} m/s
                    </span>
                  </div>
                  <div className="mb-3 text-xs text-gray-600">
                    Normal: 1.2-1.4 m/s, Fast: &gt;1.4 m/s
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Endurance</span>
                      <span className="font-bold">
                        {gaitMetrics.performance.endurance.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.performance.endurance}
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Walking Efficiency
                      </span>
                      <span className="font-bold">
                        {gaitMetrics.performance.efficiency.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.performance.efficiency}
                      className="h-3"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Recovery Capacity
                      </span>
                      <span className="font-bold">
                        {gaitMetrics.performance.recovery.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.performance.recovery}
                      className="h-3"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fatigue Analysis</CardTitle>
                <CardDescription>
                  Energy expenditure and fatigue patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Current Fatigue Level
                      </span>
                      <span className="font-bold">
                        {gaitMetrics.performance.fatigue.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.performance.fatigue}
                      className="h-3"
                    />
                    <p className="mt-1 text-xs text-gray-600">
                      Based on activity level and recovery metrics
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold text-vitalsense-success">
                        {gaitMetrics.performance.walkingSpeed.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-600">Speed (m/s)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-vitalsense-primary">
                        {gaitMetrics.performance.efficiency.toFixed(0)}%
                      </div>
                      <div className="text-sm text-gray-600">Efficiency</div>
                    </div>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="mb-1 font-medium text-green-800">
                      💪 Performance Status
                    </h4>
                    <p className="text-sm text-green-700">
                      {gaitMetrics.performance.endurance > 80
                        ? 'Excellent endurance levels'
                        : gaitMetrics.performance.endurance > 60
                          ? 'Good endurance, room for improvement'
                          : 'Focus on building endurance gradually'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Time-of-Day Gait Patterns</CardTitle>
                <CardDescription>
                  How your gait quality varies throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {gaitMetrics.patterns.timeOfDayVariation.map(
                    (pattern, index) => (
                      <div key={index} className="rounded-lg border p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <h4 className="font-medium">{pattern.timeRange}</h4>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <div className="text-sm font-bold">
                                {pattern.quality}%
                              </div>
                              <div className="text-xs text-gray-600">
                                Quality
                              </div>
                            </div>
                            <div className="text-center">
                              <div className="text-sm font-bold">
                                {pattern.volume}%
                              </div>
                              <div className="text-xs text-gray-600">
                                Volume
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="mb-3 grid grid-cols-2 gap-2">
                          <div>
                            <Progress value={pattern.quality} className="h-2" />
                            <span className="text-xs text-gray-600">
                              Quality
                            </span>
                          </div>
                          <div>
                            <Progress value={pattern.volume} className="h-2" />
                            <span className="text-xs text-gray-600">
                              Activity Volume
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {pattern.characteristics.map((char, charIndex) => (
                            <Badge
                              key={charIndex}
                              variant="outline"
                              className="text-xs"
                            >
                              {char}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Pattern Analysis Summary</CardTitle>
                <CardDescription>
                  Overall pattern characteristics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Consistency</span>
                      <span className="font-bold">
                        {gaitMetrics.patterns.consistency.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.patterns.consistency}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">Adaptability</span>
                      <span className="font-bold">
                        {gaitMetrics.patterns.adaptability.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.patterns.adaptability}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Terrain Handling
                      </span>
                      <span className="font-bold">
                        {gaitMetrics.patterns.terrainHandling.toFixed(0)}%
                      </span>
                    </div>
                    <Progress
                      value={gaitMetrics.patterns.terrainHandling}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {gaitMetrics.recommendations.map((recommendation) => (
              <Card key={recommendation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">
                          {recommendation.title}
                        </h4>
                        <Badge
                          variant={getPriorityBadgeVariant(
                            recommendation.priority
                          )}
                        >
                          {recommendation.priority}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.difficulty}
                        </Badge>
                      </div>
                      <p className="mb-2 text-gray-600">
                        {recommendation.description}
                      </p>
                      <div className="mb-2 flex items-center gap-4">
                        <span className="text-sm text-gray-500">
                          Timeline: {recommendation.timeframe}
                        </span>
                      </div>
                      <p className="mb-3 text-xs italic text-vitalsense-primary">
                        {recommendation.evidence}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Learn More
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            onNavigateToFeature?.('ai-recommendations')
                          }
                        >
                          Get Exercise Plan
                        </Button>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Immediate steps to improve your gait
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('fall-detection')}
                >
                  <AlertTriangle className="h-4 w-4" />
                  Fall Risk Assessment
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('walking-patterns')}
                >
                  <BarChart3 className="h-4 w-4" />
                  View Walking Patterns
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('posture-analysis')}
                >
                  <LineChart className="h-4 w-4" />
                  Posture Analysis
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('ai-recommendations')}
                >
                  <Brain className="h-4 w-4" />
                  AI Exercise Recommendations
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('alerts')}
                >
                  <Heart className="h-4 w-4" />
                  Setup Gait Alerts
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('family')}
                >
                  <Zap className="h-4 w-4" />
                  Share with Family
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default GaitAnalysis;
