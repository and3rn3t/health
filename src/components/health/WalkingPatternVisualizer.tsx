/**
 * Walking Pattern Visualizer Component
 * Real-time visualization of walking patterns and gait analysis
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
import {
  Activity,
  BarChart3,
  CheckCircle,
  Eye,
  MapPin,
  Target,
  Timer,
  TrendingUp,
  Users,
  Waves,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface WalkingStep {
  timestamp: number;
  x: number; // cm
  y: number; // cm
  pressure: number; // 0-1
  duration: number; // ms
  isLeftFoot: boolean;
}

interface GaitCycle {
  id: string;
  startTime: number;
  endTime: number;
  leftSteps: WalkingStep[];
  rightSteps: WalkingStep[];
  strideLength: number;
  cadence: number;
  symmetry: number;
}

interface WalkingPatternData {
  sessionId: string;
  gaitCycles: GaitCycle[];
  overallMetrics: {
    averageSpeed: number; // m/s
    totalDistance: number; // meters
    totalSteps: number;
    averageStepLength: number; // cm
    averageCadence: number; // steps/min
    walkingSteadiness: number; // 0-1
    pathDeviation: number; // cm
  };
  timestamp: Date;
}

interface WalkingPatternVisualizerProps {
  readonly data?: WalkingPatternData;
  readonly isLiveMode?: boolean;
  readonly onPatternDetected?: (pattern: string) => void;
}

export function WalkingPatternVisualizer({
  data,
  isLiveMode = false,
  onPatternDetected,
}: WalkingPatternVisualizerProps) {
  const [selectedGaitCycle, setSelectedGaitCycle] = useState<GaitCycle | null>(
    null
  );
  const [analysisMode, setAnalysisMode] = useState<
    'overview' | 'detailed' | 'comparison'
  >('overview');
  const [simulatedData, setSimulatedData] = useState<WalkingPatternData | null>(
    null
  );

  useEffect(() => {
    if (!data && isLiveMode) {
      // Generate simulated walking pattern data
      const generateSimulatedData = () => {
        const sessionId = `walk_${Date.now()}`;
        const gaitCycles: GaitCycle[] = [];

        // Generate 10 gait cycles
        for (let i = 0; i < 10; i++) {
          const cycle: GaitCycle = {
            id: `cycle_${i}`,
            startTime: Date.now() + i * 1200,
            endTime: Date.now() + (i + 1) * 1200,
            leftSteps: generateSteps(true, i * 2),
            rightSteps: generateSteps(false, i * 2 + 1),
            strideLength: 130 + Math.random() * 20,
            cadence: 110 + Math.random() * 10,
            symmetry: 0.85 + Math.random() * 0.15,
          };
          gaitCycles.push(cycle);
        }

        const totalSteps = gaitCycles.length * 2;
        const totalDistance =
          (gaitCycles.reduce((sum, cycle) => sum + cycle.strideLength, 0) /
            100) *
          gaitCycles.length;

        return {
          sessionId,
          gaitCycles,
          overallMetrics: {
            averageSpeed: 1.2 + Math.random() * 0.3,
            totalDistance,
            totalSteps,
            averageStepLength: 65 + Math.random() * 10,
            averageCadence: 112 + Math.random() * 8,
            walkingSteadiness: 0.8 + Math.random() * 0.2,
            pathDeviation: 2 + Math.random() * 3,
          },
          timestamp: new Date(),
        };
      };

      setSimulatedData(generateSimulatedData());
    }
  }, [data, isLiveMode]);

  const generateSteps = (isLeft: boolean, stepIndex: number): WalkingStep[] => {
    const baseX = stepIndex * 65 + (isLeft ? -5 : 5); // Step width variation
    const baseY = stepIndex * 65; // Forward progression

    return [
      {
        timestamp: Date.now() + stepIndex * 600,
        x: baseX + (Math.random() - 0.5) * 4, // Small lateral variation
        y: baseY + (Math.random() - 0.5) * 4, // Small forward variation
        pressure: 0.7 + Math.random() * 0.3,
        duration: 500 + Math.random() * 200,
        isLeftFoot: isLeft,
      },
    ];
  };

  const currentData = data || simulatedData;

  const detectWalkingPattern = (walkingData: WalkingPatternData): string => {
    const { overallMetrics } = walkingData;

    if (overallMetrics.walkingSteadiness < 0.6) {
      return 'Unsteady Gait';
    } else if (overallMetrics.averageSpeed < 0.8) {
      return 'Cautious Gait';
    } else if (overallMetrics.pathDeviation > 8) {
      return 'Wide-Base Gait';
    } else if (overallMetrics.averageCadence < 100) {
      return 'Slow Cadence';
    } else {
      return 'Normal Gait';
    }
  };

  useEffect(() => {
    if (currentData && onPatternDetected) {
      const pattern = detectWalkingPattern(currentData);
      onPatternDetected(pattern);
    }
  }, [currentData, onPatternDetected]);

  const getPatternColor = (pattern: string) => {
    switch (pattern) {
      case 'Normal Gait':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'Cautious Gait':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'Unsteady Gait':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'Wide-Base Gait':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Slow Cadence':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getMetricStatus = (
    value: number,
    optimal: number,
    tolerance: number
  ) => {
    const deviation = Math.abs(value - optimal) / optimal;
    if (deviation <= tolerance) return 'optimal';
    if (deviation <= tolerance * 2) return 'acceptable';
    return 'concerning';
  };

  const getMetricStatusColor = (status: string) => {
    switch (status) {
      case 'optimal':
        return 'text-green-600';
      case 'acceptable':
        return 'text-yellow-600';
      case 'concerning':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  if (!currentData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Waves className="h-5 w-5" />
            Walking Pattern Visualizer
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Activity className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-semibold">No Walking Data</h3>
          <p className="text-muted-foreground">
            Start a walking analysis session to visualize patterns
          </p>
        </CardContent>
      </Card>
    );
  }

  const detectedPattern = detectWalkingPattern(currentData);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Waves className="text-primary h-6 w-6" />
            Walking Pattern Analysis
          </h2>
          <p className="text-muted-foreground">
            Real-time gait pattern visualization and analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={getPatternColor(detectedPattern)}>
            {detectedPattern}
          </Badge>
          {isLiveMode && (
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              Live
            </Badge>
          )}
        </div>
      </div>

      <Tabs
        value={analysisMode}
        onValueChange={(value) =>
          setAnalysisMode(value as 'overview' | 'detailed' | 'comparison')
        }
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
          <TabsTrigger value="comparison">Gait Cycles</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Overall Metrics */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-blue-500" />
                  <span className="text-muted-foreground text-sm">Speed</span>
                </div>
                <div className="text-2xl font-bold">
                  {currentData.overallMetrics.averageSpeed.toFixed(1)}
                </div>
                <div className="text-muted-foreground text-sm">m/s</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-green-500" />
                  <span className="text-muted-foreground text-sm">
                    Distance
                  </span>
                </div>
                <div className="text-2xl font-bold">
                  {currentData.overallMetrics.totalDistance.toFixed(1)}
                </div>
                <div className="text-muted-foreground text-sm">meters</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Activity className="h-4 w-4 text-purple-500" />
                  <span className="text-muted-foreground text-sm">Steps</span>
                </div>
                <div className="text-2xl font-bold">
                  {currentData.overallMetrics.totalSteps}
                </div>
                <div className="text-muted-foreground text-sm">total</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Timer className="h-4 w-4 text-orange-500" />
                  <span className="text-muted-foreground text-sm">Cadence</span>
                </div>
                <div className="text-2xl font-bold">
                  {Math.round(currentData.overallMetrics.averageCadence)}
                </div>
                <div className="text-muted-foreground text-sm">steps/min</div>
              </CardContent>
            </Card>
          </div>

          {/* Walking Quality Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Walking Quality Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Walking Steadiness
                    </span>
                    <span
                      className={`text-sm font-semibold ${getMetricStatusColor(
                        getMetricStatus(
                          currentData.overallMetrics.walkingSteadiness,
                          0.9,
                          0.1
                        )
                      )}`}
                    >
                      {Math.round(
                        currentData.overallMetrics.walkingSteadiness * 100
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={currentData.overallMetrics.walkingSteadiness * 100}
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Step Length</span>
                    <span
                      className={`text-sm font-semibold ${getMetricStatusColor(
                        getMetricStatus(
                          currentData.overallMetrics.averageStepLength,
                          70,
                          0.15
                        )
                      )}`}
                    >
                      {currentData.overallMetrics.averageStepLength.toFixed(1)}{' '}
                      cm
                    </span>
                  </div>
                  <Progress
                    value={
                      (currentData.overallMetrics.averageStepLength / 90) * 100
                    }
                    className="h-2"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Path Deviation</span>
                    <span
                      className={`text-sm font-semibold ${getMetricStatusColor(
                        getMetricStatus(
                          currentData.overallMetrics.pathDeviation,
                          3,
                          0.5
                        )
                      )}`}
                    >
                      {currentData.overallMetrics.pathDeviation.toFixed(1)} cm
                    </span>
                  </div>
                  <Progress
                    value={Math.max(
                      0,
                      100 - currentData.overallMetrics.pathDeviation * 10
                    )}
                    className="h-2"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pattern Analysis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Pattern Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div
                  className={`rounded-lg border p-4 ${getPatternColor(detectedPattern)}`}
                >
                  <div className="mb-2 flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span className="font-semibold">
                      {detectedPattern} Detected
                    </span>
                  </div>
                  <p className="text-sm opacity-90">
                    {getPatternDescription(detectedPattern)}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">Key Observations</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      {getPatternObservations(currentData).map((obs, index) => (
                        <li
                          key={`obs-${index}`}
                          className="flex items-start gap-2"
                        >
                          <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                          {obs}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Recommendations</h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      {getPatternRecommendations(detectedPattern).map(
                        (rec, index) => (
                          <li
                            key={`rec-${index}`}
                            className="flex items-start gap-2"
                          >
                            <span className="mt-2 h-1 w-1 flex-shrink-0 rounded-full bg-current" />
                            {rec}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed" className="space-y-4">
          {/* Detailed Gait Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Detailed Gait Analysis
              </CardTitle>
              <CardDescription>
                Comprehensive analysis of walking biomechanics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {/* Temporal Parameters */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Temporal Parameters</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Average Cadence</span>
                      <span className="font-semibold">
                        {Math.round(currentData.overallMetrics.averageCadence)}{' '}
                        steps/min
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Step Time</span>
                      <span className="font-semibold">
                        {(
                          (60 / currentData.overallMetrics.averageCadence) *
                          1000
                        ).toFixed(0)}{' '}
                        ms
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stride Time</span>
                      <span className="font-semibold">
                        {(
                          (120 / currentData.overallMetrics.averageCadence) *
                          1000
                        ).toFixed(0)}{' '}
                        ms
                      </span>
                    </div>
                  </div>
                </div>

                {/* Spatial Parameters */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold">Spatial Parameters</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Average Step Length</span>
                      <span className="font-semibold">
                        {currentData.overallMetrics.averageStepLength.toFixed(
                          1
                        )}{' '}
                        cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Estimated Stride Length</span>
                      <span className="font-semibold">
                        {(
                          currentData.overallMetrics.averageStepLength * 2
                        ).toFixed(1)}{' '}
                        cm
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Path Deviation</span>
                      <span className="font-semibold">
                        {currentData.overallMetrics.pathDeviation.toFixed(1)} cm
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          {/* Gait Cycle Comparison */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Gait Cycle Analysis
              </CardTitle>
              <CardDescription>
                Individual gait cycle performance and consistency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-4 gap-4">
                  {currentData.gaitCycles.slice(0, 8).map((cycle, index) => (
                    <Button
                      key={cycle.id}
                      variant={
                        selectedGaitCycle?.id === cycle.id
                          ? 'default'
                          : 'outline'
                      }
                      size="sm"
                      onClick={() => setSelectedGaitCycle(cycle)}
                      className="h-auto p-3"
                    >
                      <div className="text-center">
                        <div className="text-sm font-semibold">
                          Cycle {index + 1}
                        </div>
                        <div className="text-muted-foreground text-xs">
                          {cycle.strideLength.toFixed(0)}cm
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>

                {selectedGaitCycle && (
                  <div className="bg-muted/50 mt-6 rounded-lg border p-4">
                    <h4 className="mb-3 font-semibold">
                      Cycle{' '}
                      {currentData.gaitCycles.findIndex(
                        (c) => c.id === selectedGaitCycle.id
                      ) + 1}{' '}
                      Details
                    </h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Stride Length
                        </div>
                        <div className="font-semibold">
                          {selectedGaitCycle.strideLength.toFixed(1)} cm
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Cadence
                        </div>
                        <div className="font-semibold">
                          {Math.round(selectedGaitCycle.cadence)} steps/min
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Symmetry
                        </div>
                        <div className="font-semibold">
                          {Math.round(selectedGaitCycle.symmetry * 100)}%
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function getPatternDescription(pattern: string): string {
  switch (pattern) {
    case 'Normal Gait':
      return 'Optimal walking pattern with good balance, speed, and symmetry.';
    case 'Cautious Gait':
      return 'Slower than normal walking speed, often indicating increased caution or mobility concerns.';
    case 'Unsteady Gait':
      return 'Significant balance and stability issues detected during walking.';
    case 'Wide-Base Gait':
      return 'Wider than normal step width, typically compensating for balance issues.';
    case 'Slow Cadence':
      return 'Reduced step frequency, may indicate fatigue or muscular weakness.';
    default:
      return 'Walking pattern analysis in progress.';
  }
}

function getPatternObservations(data: WalkingPatternData): readonly string[] {
  const observations: string[] = [];

  if (data.overallMetrics.averageSpeed < 1.0) {
    observations.push('Walking speed below normal range');
  }

  if (data.overallMetrics.pathDeviation > 5) {
    observations.push('Increased lateral movement during walking');
  }

  if (data.overallMetrics.walkingSteadiness < 0.7) {
    observations.push('Reduced walking steadiness detected');
  }

  if (data.overallMetrics.averageCadence < 100) {
    observations.push('Lower than average step frequency');
  }

  return observations.length > 0
    ? observations
    : ['Walking pattern within normal parameters'];
}

function getPatternRecommendations(pattern: string): readonly string[] {
  switch (pattern) {
    case 'Unsteady Gait':
      return [
        'Consider balance training exercises',
        'Use assistive devices when needed',
        'Consult healthcare provider for evaluation',
      ];
    case 'Cautious Gait':
      return [
        'Strength training to improve confidence',
        'Practice on various surfaces safely',
        'Consider physical therapy assessment',
      ];
    case 'Wide-Base Gait':
      return [
        'Balance and core strengthening exercises',
        'Practice walking with narrower stance',
        'Consider balance training program',
      ];
    case 'Slow Cadence':
      return [
        'Rhythm training exercises',
        'Cardiovascular fitness improvement',
        'Monitor for fatigue or weakness',
      ];
    default:
      return [
        'Maintain current activity level',
        'Continue regular walking routine',
        'Monitor for any changes in pattern',
      ];
  }
}
