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
import { useEffect, useState } from 'react';

// Walking Pattern Types
interface WalkingMetrics {
  stepCount: number;
  distance: number;
  speed: number;
  rhythm: number;
  symmetry: number;
  stability: number;
}

interface WalkingSession {
  id: string;
  startTime: Date;
  duration: number;
  metrics: WalkingMetrics;
  qualityScore: number;
  recommendations: string[];
}

export function WalkingPatternVisualizer() {
  const [isTracking, setIsTracking] = useState(false);
  const [currentMetrics, setCurrentMetrics] = useState<WalkingMetrics>({
    stepCount: 0,
    distance: 0,
    speed: 0,
    rhythm: 0,
    symmetry: 0,
    stability: 0,
  });
  const [sessionHistory, setSessionHistory] = useState<WalkingSession[]>([]);
  const [trackingDuration, setTrackingDuration] = useState(0);
  const [qualityScore, setQualityScore] = useState(0);

  // Simulate real-time walking metrics
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      setCurrentMetrics((prev) => ({
        stepCount: prev.stepCount + Math.floor(Math.random() * 3) + 1,
        distance: parseFloat(
          (prev.distance + Math.random() * 0.1 + 0.05).toFixed(2)
        ),
        speed: parseFloat((1.2 + Math.random() * 0.8).toFixed(1)), // 1.2-2.0 m/s
        rhythm: Math.floor(85 + Math.random() * 30), // 85-115 steps/min
        symmetry: Math.floor(70 + Math.random() * 25), // 70-95%
        stability: Math.floor(65 + Math.random() * 30), // 65-95%
      }));

      setTrackingDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking]);

  // Calculate quality score based on metrics
  useEffect(() => {
    const { rhythm, symmetry, stability } = currentMetrics;
    const score = Math.round(
      ((rhythm * 0.4 + symmetry * 0.3 + stability * 0.3) / 100) * 100
    );
    setQualityScore(Math.min(score, 100));
  }, [currentMetrics]);

  const startTracking = () => {
    setIsTracking(true);
    setCurrentMetrics({
      stepCount: 0,
      distance: 0,
      speed: 0,
      rhythm: 0,
      symmetry: 0,
      stability: 0,
    });
    setTrackingDuration(0);
    setQualityScore(0);
  };

  const stopTracking = () => {
    setIsTracking(false);

    // Save session
    const session: WalkingSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(Date.now() - trackingDuration * 1000),
      duration: trackingDuration,
      metrics: currentMetrics,
      qualityScore,
      recommendations: generateRecommendations(),
    };

    setSessionHistory((prev) => [session, ...prev.slice(0, 9)]);
  };

  const generateRecommendations = (): string[] => {
    const recommendations: string[] = [];
    const { rhythm, symmetry, stability } = currentMetrics;

    if (rhythm < 90) {
      recommendations.push('Try to increase your walking pace slightly');
    }
    if (symmetry < 80) {
      recommendations.push(
        'Focus on maintaining equal stride length for both legs'
      );
    }
    if (stability < 75) {
      recommendations.push(
        'Consider balance exercises to improve walking stability'
      );
    }
    if (recommendations.length === 0) {
      recommendations.push(
        'Excellent walking pattern! Keep up the great work.'
      );
    }

    return recommendations;
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span className="text-primary text-xl">🚶</span>
            Walking Pattern Visualizer
          </h2>
          <p className="text-muted-foreground">
            Real-time analysis of your walking patterns and gait quality
          </p>
        </div>
        <Badge variant={isTracking ? 'default' : 'secondary'}>
          {isTracking ? 'Tracking Active' : 'Ready to Track'}
        </Badge>
      </div>

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>⏱️</span>
            Tracking Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Session Duration</p>
              <p className="text-2xl font-bold">
                {formatTime(trackingDuration)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Quality Score</p>
              <p className="text-2xl font-bold">{qualityScore}%</p>
            </div>
          </div>

          <div className="flex gap-2">
            {!isTracking ? (
              <Button onClick={startTracking} className="flex-1">
                ▶️ Start Tracking
              </Button>
            ) : (
              <Button
                onClick={stopTracking}
                variant="destructive"
                className="flex-1"
              >
                ⏹️ Stop Tracking
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Live Metrics */}
      {isTracking && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📊</span>
              Live Walking Metrics
            </CardTitle>
            <CardDescription>
              Real-time analysis of your walking pattern
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Steps</span>
                  <span className="text-lg font-bold">
                    {currentMetrics.stepCount}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Distance</span>
                  <span className="text-lg font-bold">
                    {currentMetrics.distance} m
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Speed</span>
                  <span className="text-lg font-bold">
                    {currentMetrics.speed} m/s
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Rhythm</span>
                  <span className="text-lg font-bold">
                    {currentMetrics.rhythm} steps/min
                  </span>
                </div>
                <Progress
                  value={currentMetrics.rhythm}
                  max={120}
                  className="h-2"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Symmetry</span>
                  <span className="text-lg font-bold">
                    {currentMetrics.symmetry}%
                  </span>
                </div>
                <Progress value={currentMetrics.symmetry} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Stability</span>
                  <span className="text-lg font-bold">
                    {currentMetrics.stability}%
                  </span>
                </div>
                <Progress value={currentMetrics.stability} className="h-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📈</span>
              Session History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="detailed">Detailed Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="space-y-2">
                  {sessionHistory.slice(0, 3).map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between rounded border p-3"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {formatTime(session.duration)} •{' '}
                          {session.metrics.stepCount} steps
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {session.startTime.toLocaleDateString()} at{' '}
                          {session.startTime.toLocaleTimeString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="mb-1">
                          {session.qualityScore}% Quality
                        </Badge>
                        <p className="text-muted-foreground text-xs">
                          {session.metrics.distance}m distance
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="detailed" className="space-y-4">
                {sessionHistory.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold">Latest Session Analysis</h4>
                    {sessionHistory[0] && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium">
                              Session Metrics
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Duration:</span>
                                <span>
                                  {formatTime(sessionHistory[0].duration)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Steps:</span>
                                <span>
                                  {sessionHistory[0].metrics.stepCount}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Distance:</span>
                                <span>
                                  {sessionHistory[0].metrics.distance}m
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Avg Speed:</span>
                                <span>
                                  {sessionHistory[0].metrics.speed} m/s
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium">
                              Quality Metrics
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Rhythm:</span>
                                <span>
                                  {sessionHistory[0].metrics.rhythm} steps/min
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Symmetry:</span>
                                <span>
                                  {sessionHistory[0].metrics.symmetry}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Stability:</span>
                                <span>
                                  {sessionHistory[0].metrics.stability}%
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Overall Score:</span>
                                <span className="font-semibold">
                                  {sessionHistory[0].qualityScore}%
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div>
                          <p className="mb-2 text-sm font-medium">
                            Recommendations
                          </p>
                          <div className="space-y-1">
                            {sessionHistory[0].recommendations.map(
                              (rec, index) => (
                                <div
                                  key={index}
                                  className="flex items-start gap-2 text-sm"
                                >
                                  <span className="mt-0.5 text-green-500">
                                    ✅
                                  </span>
                                  <span>{rec}</span>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
