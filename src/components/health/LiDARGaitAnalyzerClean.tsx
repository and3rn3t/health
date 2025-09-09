/**
 * LiDAR Gait Analyzer Component - Icon-Free Version
 * Streamlined LiDAR-based gait analysis for movement pattern detection
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
    swingTime: number;
    stanceTime: number;
    doubleSupportTime: number;
  };
  stabilityMetrics: {
    lateralVariability: number;
    postureStability: number;
    balanceScore: number;
  };
  recommendations: readonly string[];
  analysisTimestamp: Date;
}

interface LiDARSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  analysisType: 'quick' | 'comprehensive';
  metrics?: LiDARGaitMetrics;
  recommendations: readonly string[];
  status: 'recording' | 'completed' | 'analysing';
}

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
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<
    'quick' | 'comprehensive'
  >('quick');
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

      if (metrics.temporalMetrics.cadence < 100) {
        recommendations.push('Work on increasing walking cadence');
      }

      if (metrics.stabilityMetrics.balanceScore < 70) {
        recommendations.push('Consider balance training exercises');
      }

      if (recommendations.length === 0) {
        recommendations.push('Great gait patterns! Keep up the good work.');
      }

      return recommendations;
    },
    []
  );

  const generateMockMetrics = useCallback(
    (sessionId: string): LiDARGaitMetrics => {
      const baseMetrics = {
        sessionId,
        spatialMetrics: {
          stepWidth: Math.round(8 + Math.random() * 4), // 8-12 cm
          stepLength: Math.round(55 + Math.random() * 15), // 55-70 cm
          strideLength: Math.round(110 + Math.random() * 30), // 110-140 cm
          footClearance: Math.round(2 + Math.random() * 3), // 2-5 cm
        },
        temporalMetrics: {
          cadence: Math.round(95 + Math.random() * 20), // 95-115 steps/min
          swingTime: Math.round(35 + Math.random() * 10), // 35-45% of gait cycle
          stanceTime: Math.round(55 + Math.random() * 10), // 55-65% of gait cycle
          doubleSupportTime: Math.round(10 + Math.random() * 5), // 10-15% of gait cycle
        },
        stabilityMetrics: {
          lateralVariability: Math.round(1 + Math.random() * 2), // 1-3 cm
          postureStability: Math.round(75 + Math.random() * 20), // 75-95%
          balanceScore: Math.round(70 + Math.random() * 25), // 70-95%
        },
        recommendations: [] as readonly string[],
        analysisTimestamp: new Date(),
      };

      baseMetrics.recommendations = generateRecommendations(baseMetrics);
      return baseMetrics;
    },
    [generateRecommendations]
  );

  const startSession = () => {
    if (!isLiDARAvailable) {
      showMessage('LiDAR sensor required for gait analysis', 'error');
      return;
    }

    const sessionId = `session-${Date.now()}`;
    const newSession: LiDARSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      analysisType: selectedAnalysisType,
      recommendations: [],
      status: 'recording',
    };

    setCurrentSession(newSession);
    setRecordingProgress(0);
    showMessage(`Starting ${selectedAnalysisType} analysis...`);

    // Simulate recording progress
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
  };

  const completeSession = useCallback(
    (sessionId: string) => {
      const metrics = generateMockMetrics(sessionId);
      const completedSession: LiDARSession = {
        ...currentSession!,
        endTime: new Date(),
        duration: maxSessionDuration,
        metrics,
        recommendations: metrics.recommendations,
        status: 'completed',
      };

      setCurrentSession(completedSession);
      setSessionHistory((prev) => [completedSession, ...prev.slice(0, 9)]);
      onSessionComplete?.(completedSession);
      showMessage('LiDAR gait analysis completed');
    },
    [currentSession, generateMockMetrics, maxSessionDuration, onSessionComplete]
  );

  if (!isLiDARAvailable && currentSession === null) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-400">
            🎯
          </div>
          <h3 className="mb-2 text-lg font-semibold">LiDAR Not Available</h3>
          <p className="text-muted-foreground">
            LiDAR sensor is required for precise gait analysis. This feature is
            available on iPhone 12 Pro and newer devices.
          </p>
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
            <span className="text-primary text-xl">🎯</span>
            LiDAR Gait Analyzer
          </h2>
          <p className="text-muted-foreground">
            High-precision movement analysis using LiDAR technology
          </p>
        </div>
        <Badge variant={isLiDARAvailable ? 'default' : 'secondary'}>
          {isLiDARAvailable ? 'LiDAR Ready' : 'LiDAR Unavailable'}
        </Badge>
      </div>

      {/* Analysis Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📊</span>
            Analysis Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button
              variant={selectedAnalysisType === 'quick' ? 'default' : 'outline'}
              onClick={() => setSelectedAnalysisType('quick')}
            >
              Quick Analysis (5 min)
            </Button>
            <Button
              variant={
                selectedAnalysisType === 'comprehensive' ? 'default' : 'outline'
              }
              onClick={() => setSelectedAnalysisType('comprehensive')}
            >
              Comprehensive (30 min)
            </Button>
          </div>

          {currentSession ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Recording Progress</span>
                <span className="text-muted-foreground text-sm">
                  {Math.round(recordingProgress)}%
                </span>
              </div>
              <Progress value={recordingProgress} className="w-full" />
              <p className="text-muted-foreground text-sm">
                Keep walking naturally. The LiDAR sensor is analyzing your
                movement patterns.
              </p>
            </div>
          ) : (
            <Button
              onClick={startSession}
              disabled={!isLiDARAvailable}
              className="w-full"
            >
              ▶️ Start LiDAR Gait Analysis
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Current Session Results */}
      {currentSession &&
        currentSession.status === 'completed' &&
        currentSession.metrics && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>📊</span>
                    Analysis Overview
                  </CardTitle>
                  <CardDescription>
                    Session completed at{' '}
                    {currentSession.endTime?.toLocaleTimeString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium">Step Length</p>
                      <p className="text-2xl font-bold">
                        {currentSession.metrics.spatialMetrics.stepLength} cm
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Cadence</p>
                      <p className="text-2xl font-bold">
                        {currentSession.metrics.temporalMetrics.cadence}{' '}
                        steps/min
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Balance Score</p>
                      <p className="text-2xl font-bold">
                        {currentSession.metrics.stabilityMetrics.balanceScore}%
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium">Overall Status</p>
                      <Badge variant="default">✅ Analysis Complete</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      📏 Spatial Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Step Width:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.stepWidth} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Step Length:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.stepLength} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stride Length:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.strideLength} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Foot Clearance:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.footClearance} cm
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      ⏱️ Temporal Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cadence:</span>
                      <span className="font-mono">
                        {currentSession.metrics.temporalMetrics.cadence}{' '}
                        steps/min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Swing Time:</span>
                      <span className="font-mono">
                        {currentSession.metrics.temporalMetrics.swingTime}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stance Time:</span>
                      <span className="font-mono">
                        {currentSession.metrics.temporalMetrics.stanceTime}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Double Support:</span>
                      <span className="font-mono">
                        {
                          currentSession.metrics.temporalMetrics
                            .doubleSupportTime
                        }
                        %
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      ⚖️ Stability Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Lateral Variability:</span>
                      <span className="font-mono">
                        {
                          currentSession.metrics.stabilityMetrics
                            .lateralVariability
                        }{' '}
                        cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posture Stability:</span>
                      <span className="font-mono">
                        {
                          currentSession.metrics.stabilityMetrics
                            .postureStability
                        }
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance Score:</span>
                      <span className="font-mono">
                        {currentSession.metrics.stabilityMetrics.balanceScore}%
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span>🎯</span>
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentSession.recommendations.map((rec, index) => (
                      <div
                        key={`rec-${rec.slice(0, 20)}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-0.5 text-green-500">✅</span>
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📈</span>
              Recent Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {sessionHistory.slice(0, 3).map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded border p-2"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {session.analysisType === 'quick'
                        ? 'Quick'
                        : 'Comprehensive'}{' '}
                      Analysis
                    </p>
                    <p className="text-muted-foreground text-xs">
                      {session.startTime.toLocaleDateString()} at{' '}
                      {session.startTime.toLocaleTimeString()}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {session.status === 'completed'
                      ? 'Completed'
                      : 'In Progress'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
