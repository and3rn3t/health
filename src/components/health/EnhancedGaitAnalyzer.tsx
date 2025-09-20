/**
 * Enhanced Gait Analyzer with Real Sensor Integration
 * Combines LiDAR simulation with real device sensor data
 */

import GaitTrendsPanel from '@/components/health/GaitTrendsPanel';
import { Sparkline } from '@/components/health/Sparkline';
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
import { useRecentGait } from '@/hooks/useRecentGait';
import type { GaitMetrics } from '@/lib/sensors/DeviceSensorManager';
import { DeviceSensorManager } from '@/lib/sensors/DeviceSensorManager';
import type { LiveGaitSnapshot } from '@/schemas/health';
import { useCallback, useEffect, useMemo, useState } from 'react';

// Enhanced Gait Analysis Types
interface EnhancedGaitSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  dataSource: 'simulated' | 'real-sensors';
  realMetrics?: GaitMetrics;
  sessionNotes: string[];
}

interface CombinedMetrics {
  realTime: GaitMetrics | null;
  session: {
    totalSteps: number;
    avgSpeed: number;
    sessionQuality: number;
    distanceCovered: number;
  };
  trends: {
    speedTrend: 'improving' | 'stable' | 'declining';
    stabilityTrend: 'improving' | 'stable' | 'declining';
    recommendations: string[];
  };
}

export function EnhancedGaitAnalyzer() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sensorManager, setSensorManager] =
    useState<DeviceSensorManager | null>(null);
  const [currentSession, setCurrentSession] =
    useState<EnhancedGaitSession | null>(null);
  const [metrics, setMetrics] = useState<CombinedMetrics | null>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const [notifications, setNotifications] = useState<string[]>([]);

  // Remote aggregated gait data (multi-metric trends)
  const recentGait = useRecentGait(60);
  const remoteSnapshots: LiveGaitSnapshot[] = useMemo(
    () => recentGait.data?.snapshots || [],
    [recentGait.data?.snapshots]
  );

  interface RemoteTrendMetric {
    direction: 'improving' | 'stable' | 'declining' | null;
    slope: number | null;
    confidence: number | null;
    sampleCount?: number;
  }

  const remoteTrends: Record<string, RemoteTrendMetric> | undefined =
    (recentGait.data?.trends as
      | Record<string, RemoteTrendMetric>
      | undefined) || undefined;

  const buildSeries = useCallback(
    (vals: (number | null | undefined)[]) =>
      vals.filter((v): v is number => typeof v === 'number').slice(-40),
    []
  );

  const speedSeries = useMemo(
    () => buildSeries(remoteSnapshots.map((s) => s.speed)),
    [remoteSnapshots, buildSeries]
  );
  const cadenceSeries = useMemo(
    () => buildSeries(remoteSnapshots.map((s) => s.stepFrequency)),
    [remoteSnapshots, buildSeries]
  );
  const asymSeries = useMemo(
    () => buildSeries(remoteSnapshots.map((s) => s.asymmetry)),
    [remoteSnapshots, buildSeries]
  );
  const variabilitySeries = useMemo(
    () => buildSeries(remoteSnapshots.map((s) => s.variability)),
    [remoteSnapshots, buildSeries]
  );

  // Sparkline row component (local to analyzer)
  const SparklineRow: React.FC<{
    label: string;
    values: number[];
    trend?: RemoteTrendMetric;
    color: string; // Tailwind text-* color class
  }> = ({ label, values, trend, color }) => {
    return (
      <div className="flex items-center justify-between py-1 first:pt-0 last:pb-0">
        <div className="flex flex-col">
          <span className="text-xs text-gray-700 font-medium">{label}</span>
          <span className="text-gray-400 text-[10px]">
            n={values.length}
            {trend?.sampleCount ? ` / ${trend.sampleCount}` : ''}
          </span>
        </div>
        <div className="gap-3 flex items-center">
          <Sparkline
            values={values}
            confidence={trend?.confidence ?? null}
            className={`${color} w-24 h-7`}
            title={`${label} recent samples`}
          />
          <div className="flex flex-col items-end">
            <Badge
              variant={
                trend?.direction === 'improving'
                  ? 'default'
                  : trend?.direction === 'declining'
                    ? 'destructive'
                    : 'secondary'
              }
              className="text-[10px] capitalize"
            >
              {trend?.direction ?? '—'}
            </Badge>
            <span className="text-[10px] tabular-nums text-gray-500">
              {trend?.slope == null
                ? 'slope —'
                : `slope ${trend.slope.toFixed(4)}`}
            </span>
            <span className="text-[10px] tabular-nums text-gray-500">
              {trend?.confidence == null
                ? 'conf —'
                : `conf ${(trend.confidence * 100).toFixed(0)}%`}
            </span>
          </div>
        </div>
      </div>
    );
  };

  // Initialize sensor manager
  useEffect(() => {
    const manager = new DeviceSensorManager();
    setSensorManager(manager);

    return () => {
      manager.stopAnalysis();
    };
  }, []);

  // Add notification (must be defined before being used in callbacks)
  const addNotification = useCallback((message: string) => {
    setNotifications((prev) => [message, ...prev.slice(0, 4)]); // Keep last 5
    setTimeout(() => {
      setNotifications((prev) => prev.slice(0, -1));
    }, 5000);
  }, []);

  // Start real sensor analysis
  const startRealSensorAnalysis = useCallback(async () => {
    if (!sensorManager) return;

    try {
      // Request permissions first
      const granted = await DeviceSensorManager.requestSensorPermissions();
      setPermissionGranted(granted);

      if (!granted) {
        addNotification(
          '⚠️ Sensor permissions not granted. Analysis may be limited.'
        );
        return;
      }

      // Start sensor analysis
      const success = await sensorManager.startAnalysis({
        onGaitUpdate: (gaitMetrics) => {
          setMetrics(
            (prev) =>
              ({
                ...prev,
                realTime: gaitMetrics,
                session: {
                  totalSteps: Math.floor(
                    gaitMetrics.cadence *
                      ((Date.now() -
                        (currentSession?.startTime?.getTime() || Date.now())) /
                        60000)
                  ),
                  avgSpeed: gaitMetrics.speed,
                  sessionQuality: Math.round(
                    (gaitMetrics.rhythm +
                      gaitMetrics.symmetry +
                      gaitMetrics.stability) /
                      3
                  ),
                  distanceCovered:
                    gaitMetrics.speed * gaitMetrics.stepLength * 0.01, // rough estimate
                },
                trends: {
                  speedTrend:
                    gaitMetrics.speed > 1.2
                      ? 'improving'
                      : gaitMetrics.speed < 0.8
                        ? 'declining'
                        : 'stable',
                  stabilityTrend:
                    gaitMetrics.stability > 80
                      ? 'improving'
                      : gaitMetrics.stability < 60
                        ? 'declining'
                        : 'stable',
                  recommendations: generateRecommendations(gaitMetrics),
                },
              }) as CombinedMetrics
          );
        },
        onError: (error) => {
          addNotification(`❌ Sensor error: ${error}`);
        },
      });

      if (success) {
        setIsAnalyzing(true);
        const session: EnhancedGaitSession = {
          id: `session_${Date.now()}`,
          startTime: new Date(),
          duration: 0,
          dataSource: 'real-sensors',
          sessionNotes: ['Real sensor analysis started'],
        };
        setCurrentSession(session);
        addNotification('✅ Real sensor analysis started successfully!');
      } else {
        addNotification('❌ Failed to start sensor analysis');
      }
    } catch (error) {
      addNotification(`❌ Error starting analysis: ${error}`);
    }
  }, [sensorManager, currentSession, addNotification]);

  // Stop analysis
  const stopAnalysis = useCallback(() => {
    if (!sensorManager || !currentSession) return;

    sensorManager.stopAnalysis();
    setIsAnalyzing(false);

    const updatedSession = {
      ...currentSession,
      endTime: new Date(),
      duration: Date.now() - currentSession.startTime.getTime(),
      realMetrics: metrics?.realTime || undefined,
    };
    setCurrentSession(updatedSession);
    addNotification('🛑 Analysis session completed');
  }, [sensorManager, currentSession, metrics, addNotification]);

  // Generate recommendations based on metrics
  const generateRecommendations = (gaitMetrics: GaitMetrics): string[] => {
    const recommendations = [];

    if (gaitMetrics.speed < 1.0) {
      recommendations.push('Consider increasing walking pace gradually');
    }
    if (gaitMetrics.rhythm < 75) {
      recommendations.push('Focus on maintaining steady rhythm');
    }
    if (gaitMetrics.symmetry < 80) {
      recommendations.push('Work on balanced left-right stepping');
    }
    if (gaitMetrics.stability < 70) {
      recommendations.push('Practice balance exercises');
    }
    if (gaitMetrics.cadence < 100) {
      recommendations.push('Try to increase step frequency');
    }

    return recommendations;
  };

  // Format metrics for display
  const formatMetric = (
    value: number,
    unit: string = '',
    decimals = 1
  ): string => {
    return `${value.toFixed(decimals)}${unit}`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Enhanced Gait Analysis</h1>
        <p className="text-muted-foreground">
          Real-time sensor integration for comprehensive movement analysis
        </p>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="space-y-2">
          {notifications.map((notification, index) => (
            <Alert key={index} className="border-blue-200 bg-blue-50">
              <AlertDescription className="text-sm">
                {notification}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Control Panel */}
      <Card>
        <CardHeader>
          <CardTitle>Analysis Controls</CardTitle>
          <CardDescription>
            Start real sensor-based gait analysis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="gap-3 flex">
            {!isAnalyzing ? (
              <Button
                onClick={startRealSensorAnalysis}
                className="bg-green-600 hover:bg-green-700"
                disabled={!sensorManager}
              >
                🎯 Start Real Sensor Analysis
              </Button>
            ) : (
              <Button onClick={stopAnalysis} variant="destructive">
                🛑 Stop Analysis
              </Button>
            )}
          </div>

          {/* Permission Status */}
          <div className="flex items-center gap-2">
            <Badge
              variant={
                permissionGranted === true
                  ? 'default'
                  : permissionGranted === false
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {permissionGranted === true
                ? '✅ Sensors Authorized'
                : permissionGranted === false
                  ? '❌ Permission Denied'
                  : '⏳ Checking Permissions'}
            </Badge>
          </div>

          {/* Session Info */}
          {currentSession && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="space-y-1 text-sm">
                <div>
                  <strong>Session:</strong> {currentSession.id}
                </div>
                <div>
                  <strong>Started:</strong>{' '}
                  {currentSession.startTime.toLocaleTimeString()}
                </div>
                <div>
                  <strong>Source:</strong> {currentSession.dataSource}
                </div>
                {isAnalyzing && (
                  <div>
                    <strong>Duration:</strong>{' '}
                    {Math.floor(
                      (Date.now() - currentSession.startTime.getTime()) / 1000
                    )}
                    s
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Real-time Metrics */}
      {metrics?.realTime && (
        <Tabs defaultValue="current" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="current">Current Metrics</TabsTrigger>
            <TabsTrigger value="session">Session Summary</TabsTrigger>
            <TabsTrigger value="trends">Analysis & Trends</TabsTrigger>
          </TabsList>

          {/* Current Real-time Metrics */}
          <TabsContent value="current" className="space-y-4">
            <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Walking Speed</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-blue-600 text-2xl font-bold">
                    {formatMetric(metrics.realTime.speed, ' m/s')}
                  </div>
                  <Progress
                    value={metrics.realTime.speed * 33.33}
                    className="mt-2"
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    Target: 1.2-1.8 m/s
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Step Cadence</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-green-600 text-2xl font-bold">
                    {formatMetric(metrics.realTime.cadence, ' spm', 0)}
                  </div>
                  <Progress
                    value={(metrics.realTime.cadence / 180) * 100}
                    className="mt-2"
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    Target: 120-140 steps/min
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Rhythm Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-purple-600 text-2xl font-bold">
                    {formatMetric(metrics.realTime.rhythm, '%', 0)}
                  </div>
                  <Progress value={metrics.realTime.rhythm} className="mt-2" />
                  <p className="text-muted-foreground text-xs mt-1">
                    Consistency rating
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Gait Symmetry</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-orange-600 text-2xl font-bold">
                    {formatMetric(metrics.realTime.symmetry, '%', 0)}
                  </div>
                  <Progress
                    value={metrics.realTime.symmetry}
                    className="mt-2"
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    Left-right balance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Stability Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-teal-600 text-2xl font-bold">
                    {formatMetric(metrics.realTime.stability, '%', 0)}
                  </div>
                  <Progress
                    value={metrics.realTime.stability}
                    className="mt-2"
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    Movement steadiness
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">Step Length</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-red-600 text-2xl font-bold">
                    {formatMetric(metrics.realTime.stepLength, ' cm', 0)}
                  </div>
                  <Progress
                    value={(metrics.realTime.stepLength / 80) * 100}
                    className="mt-2"
                  />
                  <p className="text-muted-foreground text-xs mt-1">
                    Average stride distance
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Session Summary */}
          <TabsContent value="session" className="space-y-4">
            {metrics.session && (
              <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Session Statistics</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between">
                      <span>Total Steps:</span>
                      <span className="font-bold">
                        {metrics.session.totalSteps}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Speed:</span>
                      <span className="font-bold">
                        {formatMetric(metrics.session.avgSpeed, ' m/s')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Session Quality:</span>
                      <span className="font-bold">
                        {formatMetric(metrics.session.sessionQuality, '%', 0)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Est. Distance:</span>
                      <span className="font-bold">
                        {formatMetric(metrics.session.distanceCovered, ' m')}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Quality Assessment</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span>Overall Quality</span>
                        <Badge
                          variant={
                            metrics.session.sessionQuality > 80
                              ? 'default'
                              : metrics.session.sessionQuality > 60
                                ? 'secondary'
                                : 'destructive'
                          }
                        >
                          {metrics.session.sessionQuality > 80
                            ? 'Excellent'
                            : metrics.session.sessionQuality > 60
                              ? 'Good'
                              : 'Needs Improvement'}
                        </Badge>
                      </div>
                      <Progress
                        value={metrics.session.sessionQuality}
                        className="mt-2"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Analysis & Trends */}
          <TabsContent value="trends" className="space-y-6">
            {/* Local (heuristic) trends & recommendations */}
            {metrics.trends && (
              <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Local Trend Heuristics</CardTitle>
                    <CardDescription>
                      Derived from current real-time sensor feed
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span>Speed Trend:</span>
                      <Badge
                        variant={
                          metrics.trends.speedTrend === 'improving'
                            ? 'default'
                            : metrics.trends.speedTrend === 'stable'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {metrics.trends.speedTrend === 'improving'
                          ? '📈 Improving'
                          : metrics.trends.speedTrend === 'stable'
                            ? '📊 Stable'
                            : '📉 Declining'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Stability Trend:</span>
                      <Badge
                        variant={
                          metrics.trends.stabilityTrend === 'improving'
                            ? 'default'
                            : metrics.trends.stabilityTrend === 'stable'
                              ? 'secondary'
                              : 'destructive'
                        }
                      >
                        {metrics.trends.stabilityTrend === 'improving'
                          ? '📈 Improving'
                          : metrics.trends.stabilityTrend === 'stable'
                            ? '📊 Stable'
                            : '📉 Declining'}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recommendations</CardTitle>
                    <CardDescription>
                      Contextual guidance from live metrics
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {metrics.trends.recommendations.length > 0 ? (
                        metrics.trends.recommendations.map((rec, index) => (
                          <Alert key={index} className="py-2">
                            <AlertDescription className="text-sm">
                              💡 {rec}
                            </AlertDescription>
                          </Alert>
                        ))
                      ) : (
                        <Alert className="py-2">
                          <AlertDescription className="text-sm">
                            ✅ Your gait metrics look good! Keep up the great
                            work.
                          </AlertDescription>
                        </Alert>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Remote multi-metric aggregated trends */}
            <div className="md:grid-cols-3 grid grid-cols-1 gap-4">
              <Card className="col-span-1">
                <CardHeader>
                  <CardTitle>Aggregated Gait Trends</CardTitle>
                  <CardDescription>
                    Server-computed multi-metric regression
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <GaitTrendsPanel className="mt-1" />
                  {recentGait.isLoading && (
                    <p className="text-xs mt-2 text-gray-500">
                      Fetching recent gait history…
                    </p>
                  )}
                  {recentGait.error && (
                    <p className="text-xs text-rose-600 mt-2">
                      Remote trend fetch failed
                    </p>
                  )}
                </CardContent>
              </Card>
              <Card className="md:col-span-2 col-span-1">
                <CardHeader>
                  <CardTitle>Micro Trend Sparklines</CardTitle>
                  <CardDescription>
                    Recent sample evolution (last {remoteSnapshots.length}{' '}
                    samples)
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {remoteSnapshots.length === 0 && !recentGait.isLoading && (
                    <p className="text-xs text-gray-500">
                      No remote gait samples yet.
                    </p>
                  )}
                  <div className="flex flex-col divide-y divide-gray-100/60">
                    <SparklineRow
                      label="Speed (m/s)"
                      values={speedSeries}
                      trend={remoteTrends?.speed}
                      color="text-blue-600"
                    />
                    <SparklineRow
                      label="Cadence (spm)"
                      values={cadenceSeries}
                      trend={remoteTrends?.cadence}
                      color="text-green-600"
                    />
                    <SparklineRow
                      label="Asymmetry"
                      values={asymSeries}
                      trend={remoteTrends?.asymmetry}
                      color="text-orange-600"
                    />
                    <SparklineRow
                      label="Variability"
                      values={variabilitySeries}
                      trend={remoteTrends?.variability}
                      color="text-purple-600"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Help Information */}
      <Card>
        <CardHeader>
          <CardTitle>Real Sensor Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>📱 Device Requirements:</strong> This analysis uses your
              device's accelerometer and gyroscope sensors to measure real
              movement patterns.
            </p>
            <p>
              <strong>🚶 How to Use:</strong> Hold your device naturally while
              walking at a normal pace. The analysis works best during
              continuous walking for at least 30 seconds.
            </p>
            <p>
              <strong>🔒 Privacy:</strong> All sensor data is processed locally
              on your device. No movement data is transmitted or stored
              externally.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Default export for lazy loading
export default EnhancedGaitAnalyzer;
