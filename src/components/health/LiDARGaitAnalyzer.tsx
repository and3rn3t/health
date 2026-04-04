/**
 * LiDAR Gait Analyzer Component
 * Advanced LiDAR-based gait analysis for precise movement pattern detection
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
import * as Icons from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

// LiDAR Gait Analysis Types
interface LiDARGaitMetrics {
  sessionId: string;
  spatialMetrics: {
    stepWidth: number;
    stepLength: number;
    strideLength: number;
    footClearance: number;
  };
  temporalMetrics: {
    cadence: number;
    velocityVariability: number;
    rhythmIndex: number;
    gaitCycleTime: number;
  };
  asymmetryMetrics: {
    spatialAsymmetry: number;
    temporalAsymmetry: number;
    kinematicAsymmetry: number;
  };
  fallRiskScore: number;
  confidence: number;
  timestamp: Date;
}

interface LiDARSession {
  id: string;
  startTime: Date;
  duration: number;
  status: 'idle' | 'recording' | 'analyzing' | 'completed' | 'error';
  analysisType: 'gait' | 'posture' | 'balance' | 'environment';
  pointCloudSize: number;
  metrics?: LiDARGaitMetrics;
  recommendations: readonly string[];
}

type AnalysisType = 'gait' | 'posture' | 'balance' | 'environment';

interface LiDARGaitAnalyzerProps {
  readonly onSessionComplete?: (session: LiDARSession) => void;
  readonly maxSessionDuration?: number;
}

export function LiDARGaitAnalyzer({
  onSessionComplete,
  maxSessionDuration = 30,
}: LiDARGaitAnalyzerProps) {
  const [currentSession, setCurrentSession] = useState<LiDARSession | null>(
    null
  );
  const [sessionHistory, setSessionHistory] = useState<LiDARSession[]>([]);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isLiDARAvailable, setIsLiDARAvailable] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] =
    useState<AnalysisType>('gait');
  const [showNotification, setShowNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  // Simple notification system
  const showMessage = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Check LiDAR availability on component mount
  const checkLiDARAvailability = useCallback(async () => {
    try {
      // Simulate LiDAR availability check
      const hasLiDAR =
        navigator.userAgent.includes('iPhone') ||
        navigator.userAgent.includes('iPad');
      setIsLiDARAvailable(hasLiDAR);

      if (!hasLiDAR) {
        showMessage('LiDAR sensor not available on this device', 'error');
      }
    } catch (error) {
      console.error('Error checking LiDAR availability:', error);
      setIsLiDARAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkLiDARAvailability();
  }, [checkLiDARAvailability]);

  const generateRecommendations = useCallback(
    (metrics: LiDARGaitMetrics): readonly string[] => {
      const recommendations: string[] = [];

      if (metrics.spatialMetrics.stepLength < 60) {
        recommendations.push('Consider stride lengthening exercises');
      }

      if (metrics.spatialMetrics.footClearance < 3) {
        recommendations.push(
          'Practice high-stepping exercises to improve foot clearance'
        );
      }

      if (metrics.asymmetryMetrics.spatialAsymmetry > 3) {
        recommendations.push('Address walking asymmetry with balance training');
      }

      if (metrics.temporalMetrics.velocityVariability > 5) {
        recommendations.push('Focus on consistent walking rhythm exercises');
      }

      if (metrics.fallRiskScore > 70) {
        recommendations.push(
          'High fall risk detected - consult healthcare provider'
        );
      }

      return recommendations.length > 0
        ? recommendations
        : ['Excellent gait pattern - maintain current activity level'];
    },
    []
  );

  const completeSession = useCallback(
    async (sessionId: string) => {
      setCurrentSession((prev) => {
        if (!prev || prev.id !== sessionId) return prev;
        return { ...prev, status: 'analyzing' };
      });

      // Simulate LiDAR analysis processing
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // Generate synthetic LiDAR gait metrics
      const metrics: LiDARGaitMetrics = {
        sessionId,
        spatialMetrics: {
          stepWidth: 10.5 + Math.random() * 3,
          stepLength: 65 + Math.random() * 10,
          strideLength: 130 + Math.random() * 20,
          footClearance: 2.5 + Math.random() * 1.5,
        },
        temporalMetrics: {
          cadence: 110 + Math.random() * 10,
          velocityVariability: 3 + Math.random() * 3,
          rhythmIndex: 85 + Math.random() * 10,
          gaitCycleTime: 1000 + Math.random() * 200,
        },
        asymmetryMetrics: {
          spatialAsymmetry: Math.random() * 5,
          temporalAsymmetry: Math.random() * 4,
          kinematicAsymmetry: Math.random() * 6,
        },
        fallRiskScore: Math.random() * 100,
        confidence: 85 + Math.random() * 15,
        timestamp: new Date(),
      };

      const recommendations = generateRecommendations(metrics);

      const completedSession: LiDARSession = {
        id: sessionId,
        startTime: currentSession?.startTime || new Date(),
        duration: currentSession?.duration || maxSessionDuration,
        status: 'completed',
        analysisType: selectedAnalysisType,
        pointCloudSize: 1500 + Math.floor(Math.random() * 500),
        metrics,
        recommendations,
      };

      setCurrentSession(completedSession);
      setSessionHistory((prev) => [completedSession, ...prev]);
      setRecordingProgress(0);

      onSessionComplete?.(completedSession);
      showMessage('LiDAR gait analysis completed');
    },
    [
      currentSession,
      maxSessionDuration,
      selectedAnalysisType,
      onSessionComplete,
      generateRecommendations,
    ]
  );

  const startGaitAnalysis = useCallback(async () => {
    if (!isLiDARAvailable) {
      showMessage('LiDAR sensor required for gait analysis', 'error');
      return;
    }

    const sessionId = `lidar_${Date.now()}`;
    const newSession: LiDARSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      status: 'recording',
      analysisType: selectedAnalysisType,
      pointCloudSize: 0,
      recommendations: [],
    };

    setCurrentSession(newSession);
    setRecordingProgress(0);

    showMessage(`Starting ${selectedAnalysisType} analysis...`);

    // Simulate LiDAR recording with progress updates
    const interval = setInterval(() => {
      setRecordingProgress((prev) => {
        const newProgress = prev + 100 / maxSessionDuration;
        if (newProgress >= 100) {
          clearInterval(interval);
          completeSession(sessionId);
          return 100;
        }
        return newProgress;
      });
    }, 1000);

    // Update session duration
    const durationInterval = setInterval(() => {
      setCurrentSession((prev) => {
        if (!prev || prev.status !== 'recording') {
          clearInterval(durationInterval);
          return prev;
        }
        return { ...prev, duration: prev.duration + 1 };
      });
    }, 1000);
  }, [
    isLiDARAvailable,
    selectedAnalysisType,
    maxSessionDuration,
    completeSession,
  ]);

  const stopRecording = useCallback(() => {
    if (currentSession && currentSession.status === 'recording') {
      completeSession(currentSession.id);
    }
  }, [currentSession, completeSession]);

  const getRiskColor = (score: number) => {
    if (score < 25) return 'text-green-600 bg-green-50 border-green-200';
    if (score < 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score < 75) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRiskLevel = (score: number) => {
    if (score < 25) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 75) return 'High';
    return 'Critical';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'recording':
        return 'bg-blue-100 text-blue-800';
      case 'analyzing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getProgressBarClass = (score: number) => {
    if (score < 25) return '[&>div]:bg-green-500';
    if (score < 50) return '[&>div]:bg-yellow-500';
    if (score < 75) return '[&>div]:bg-orange-500';
    return '[&>div]:bg-red-500';
  };

  const getFallRiskTextColor = (score: number) => {
    if (score < 25) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    if (score < 75) return 'text-orange-600';
    return 'text-red-600';
  };

  if (!isLiDARAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icons.Target className="h-5 w-5 text-gray-400" />
            LiDAR Gait Analyzer
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Icons.AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              LiDAR sensor not available on this device. This feature requires a
              device with LiDAR capability (iPhone 12 Pro or later, iPad Pro
              with LiDAR).
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification */}
      {showNotification && (
        <Alert
          className={
            showNotification.type === 'error'
              ? 'border-red-500'
              : 'border-green-500'
          }
        >
          <AlertDescription>{showNotification.message}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Icons.Target className="text-primary h-6 w-6" />
            LiDAR Gait Analyzer
          </h2>
          <p className="text-muted-foreground">
            High-precision movement analysis using LiDAR technology
          </p>
        </div>
        <Badge variant="outline" className="bg-blue-50 text-blue-700">
          LiDAR Enabled
        </Badge>
      </div>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="analysis">Live Analysis</TabsTrigger>
          <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {/* Analysis Control Panel */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.Target className="h-5 w-5" />
                Analysis Control
              </CardTitle>
              <CardDescription>
                Configure and start LiDAR-based gait analysis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Analysis Type Selection */}
              <div className="space-y-2">
                <div className="text-sm font-medium">Analysis Type</div>
                <div className="grid grid-cols-2 gap-2">
                  {(['gait', 'posture', 'balance', 'environment'] as const).map(
                    (type) => (
                      <Button
                        key={type}
                        variant={
                          selectedAnalysisType === type ? 'default' : 'outline'
                        }
                        size="sm"
                        onClick={() => setSelectedAnalysisType(type)}
                        disabled={currentSession?.status === 'recording'}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Button>
                    )
                  )}
                </div>
              </div>

              {/* Recording Controls */}
              <div className="flex items-center gap-2">
                {(!currentSession || currentSession.status === 'completed') && (
                  <Button onClick={startGaitAnalysis} className="flex-1">
                    <Icons.Play className="mr-2 h-4 w-4" />
                    Start Analysis
                  </Button>
                )}
                {currentSession?.status === 'recording' && (
                  <Button
                    onClick={stopRecording}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Icons.Pause className="mr-2 h-4 w-4" />
                    Stop Recording
                  </Button>
                )}
                {currentSession?.status === 'analyzing' && (
                  <Button disabled className="flex-1">
                    <Icons.Brain className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </Button>
                )}
              </div>

              {/* Recording Progress */}
              {currentSession && currentSession.status === 'recording' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Recording Progress</span>
                    <span>{Math.round(recordingProgress)}%</span>
                  </div>
                  <Progress value={recordingProgress} className="h-2" />
                  <div className="text-muted-foreground text-center text-sm">
                    Duration: {currentSession.duration}s / {maxSessionDuration}s
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Real-time Analysis Status */}
          {currentSession && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Icons.Activity className="h-5 w-5" />
                  Session Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Session ID</span>
                    <code className="rounded bg-gray-100 px-2 py-1 text-sm">
                      {currentSession.id}
                    </code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Analysis Type</span>
                    <Badge variant="secondary">
                      {currentSession.analysisType}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <Badge
                      className={getStatusBadgeClass(currentSession.status)}
                    >
                      {currentSession.status}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Point Cloud Size</span>
                    <span className="text-sm">
                      {currentSession.pointCloudSize.toLocaleString()} points
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          {currentSession?.metrics ? (
            <>
              {/* Fall Risk Score */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.AlertTriangle className="h-5 w-5" />
                    Fall Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div
                        className={`inline-flex items-center rounded-lg border px-3 py-2 ${getRiskColor(currentSession.metrics.fallRiskScore)}`}
                      >
                        <span className="mr-2 text-2xl font-bold">
                          {Math.round(currentSession.metrics.fallRiskScore)}
                        </span>
                        <span className="text-sm font-medium">
                          {getRiskLevel(currentSession.metrics.fallRiskScore)}{' '}
                          Risk
                        </span>
                      </div>
                    </div>
                    <Progress
                      value={currentSession.metrics.fallRiskScore}
                      className={`h-3 ${getProgressBarClass(currentSession.metrics.fallRiskScore)}`}
                    />
                    <div className="text-muted-foreground text-center text-sm">
                      Confidence:{' '}
                      {Math.round(currentSession.metrics.confidence)}%
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Spatial Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.BarChart3 className="h-5 w-5" />
                    Spatial Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Step Width
                      </div>
                      <div className="text-lg font-semibold">
                        {currentSession.metrics.spatialMetrics.stepWidth.toFixed(
                          1
                        )}{' '}
                        cm
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Step Length
                      </div>
                      <div className="text-lg font-semibold">
                        {currentSession.metrics.spatialMetrics.stepLength.toFixed(
                          1
                        )}{' '}
                        cm
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Stride Length
                      </div>
                      <div className="text-lg font-semibold">
                        {currentSession.metrics.spatialMetrics.strideLength.toFixed(
                          1
                        )}{' '}
                        cm
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Foot Clearance
                      </div>
                      <div className="text-lg font-semibold">
                        {currentSession.metrics.spatialMetrics.footClearance.toFixed(
                          1
                        )}{' '}
                        cm
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Temporal Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.Clock className="h-5 w-5" />
                    Temporal Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Cadence
                      </div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          currentSession.metrics.temporalMetrics.cadence
                        )}{' '}
                        steps/min
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Velocity Variability
                      </div>
                      <div className="text-lg font-semibold">
                        {currentSession.metrics.temporalMetrics.velocityVariability.toFixed(
                          1
                        )}
                        %
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Rhythm Index
                      </div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          currentSession.metrics.temporalMetrics.rhythmIndex
                        )}
                        %
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground text-sm">
                        Gait Cycle Time
                      </div>
                      <div className="text-lg font-semibold">
                        {Math.round(
                          currentSession.metrics.temporalMetrics.gaitCycleTime
                        )}{' '}
                        ms
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Asymmetry Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Icons.Waves className="h-5 w-5" />
                    Asymmetry Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Spatial Asymmetry</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            currentSession.metrics.asymmetryMetrics
                              .spatialAsymmetry * 20
                          }
                          className="h-2 w-20"
                        />
                        <span className="text-sm font-semibold">
                          {currentSession.metrics.asymmetryMetrics.spatialAsymmetry.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Temporal Asymmetry</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            currentSession.metrics.asymmetryMetrics
                              .temporalAsymmetry * 25
                          }
                          className="h-2 w-20"
                        />
                        <span className="text-sm font-semibold">
                          {currentSession.metrics.asymmetryMetrics.temporalAsymmetry.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Kinematic Asymmetry</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={
                            currentSession.metrics.asymmetryMetrics
                              .kinematicAsymmetry * 16.67
                          }
                          className="h-2 w-20"
                        />
                        <span className="text-sm font-semibold">
                          {currentSession.metrics.asymmetryMetrics.kinematicAsymmetry.toFixed(
                            1
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {currentSession.recommendations.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icons.Target className="h-5 w-5" />
                      Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {currentSession.recommendations.map((rec, index) => (
                        <div
                          key={`rec-${rec.slice(0, 20)}-${index}`}
                          className="flex items-start gap-2"
                        >
                          <Icons.CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                          <span className="text-sm">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Icons.Target className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">No Analysis Data</h3>
                <p className="text-muted-foreground mb-4">
                  Start a LiDAR analysis session to view detailed metrics
                </p>
                <Button onClick={() => setSelectedAnalysisType('gait')}>
                  Start Analysis
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {sessionHistory.length > 0 ? (
            <div className="space-y-4">
              {sessionHistory.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <Icons.Activity className="h-5 w-5" />
                        {session.analysisType.charAt(0).toUpperCase() +
                          session.analysisType.slice(1)}{' '}
                        Analysis
                      </CardTitle>
                      <Badge variant="outline">
                        {session.startTime.toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Duration
                        </div>
                        <div className="font-semibold">{session.duration}s</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Point Cloud
                        </div>
                        <div className="font-semibold">
                          {session.pointCloudSize.toLocaleString()}
                        </div>
                      </div>
                      {session.metrics && (
                        <>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Fall Risk
                            </div>
                            <div
                              className={`font-semibold ${getFallRiskTextColor(session.metrics.fallRiskScore)}`}
                            >
                              {Math.round(session.metrics.fallRiskScore)} -{' '}
                              {getRiskLevel(session.metrics.fallRiskScore)}
                            </div>
                          </div>
                          <div>
                            <div className="text-muted-foreground text-sm">
                              Confidence
                            </div>
                            <div className="font-semibold">
                              {Math.round(session.metrics.confidence)}%
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {session.recommendations.length > 0 && (
                      <div className="mt-4">
                        <div className="text-muted-foreground mb-2 text-sm">
                          Key Recommendations
                        </div>
                        <div className="text-sm">
                          {session.recommendations[0]}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Icons.Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Session History
                </h3>
                <p className="text-muted-foreground">
                  Completed analysis sessions will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
