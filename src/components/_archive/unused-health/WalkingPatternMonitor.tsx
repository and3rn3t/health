/**
 * Real-time Walking Pattern Monitor
 * Analyzes walking patterns and provides immediate feedback
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
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  Footprints,
  Pause,
  Play,
  Square,
  Zap,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface WalkingSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // seconds
  steps: number;
  distance: number; // meters
  averageSpeed: number; // m/s
  cadence: number; // steps/min
  asymmetryScore: number; // percentage
  steadinessScore: number; // percentage
  doubleSupportTime: number; // percentage
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface RealTimeMetrics {
  currentSpeed: number;
  currentCadence: number;
  currentAsymmetry: number;
  currentSteadiness: number;
  stepCount: number;
  distance: number;
  duration: number;
}

interface WalkingAlert {
  type: 'speed' | 'asymmetry' | 'steadiness' | 'cadence';
  severity: 'info' | 'warning' | 'critical';
  message: string;
  timestamp: Date;
}

function RealTimeMetricsCard({ metrics }: { metrics: RealTimeMetrics }) {
  const getSpeedStatus = (speed: number) => {
    if (speed >= 1.2) return { status: 'excellent', color: 'text-green-600' };
    if (speed >= 1.0) return { status: 'good', color: 'text-blue-600' };
    if (speed >= 0.8) return { status: 'fair', color: 'text-yellow-600' };
    return { status: 'needs attention', color: 'text-red-600' };
  };

  const getCadenceStatus = (cadence: number) => {
    if (cadence >= 100 && cadence <= 120)
      return { status: 'optimal', color: 'text-green-600' };
    if (cadence >= 90 && cadence <= 130)
      return { status: 'good', color: 'text-blue-600' };
    return { status: 'monitor', color: 'text-yellow-600' };
  };

  const speedStatus = getSpeedStatus(metrics.currentSpeed);
  const cadenceStatus = getCadenceStatus(metrics.currentCadence);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Live Walking Metrics
        </CardTitle>
        <CardDescription>
          Real-time analysis of walking performance
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Speed */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              <span className="font-medium">Walking Speed</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-lg ${speedStatus.color}`}>
                {metrics.currentSpeed.toFixed(2)} m/s
              </span>
              <Badge
                variant={
                  speedStatus.status === 'excellent' ? 'default' : 'secondary'
                }
              >
                {speedStatus.status}
              </Badge>
            </div>
          </div>
          <Progress
            value={Math.min(100, (metrics.currentSpeed / 1.4) * 100)}
            className="h-2"
          />
        </div>

        {/* Cadence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span className="font-medium">Cadence</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`font-mono text-lg ${cadenceStatus.color}`}>
                {metrics.currentCadence} spm
              </span>
              <Badge
                variant={
                  cadenceStatus.status === 'optimal' ? 'default' : 'secondary'
                }
              >
                {cadenceStatus.status}
              </Badge>
            </div>
          </div>
          <Progress
            value={Math.min(100, (metrics.currentCadence / 120) * 100)}
            className="h-2"
          />
        </div>

        {/* Asymmetry */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              <span className="font-medium">Gait Asymmetry</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-lg ${
                  metrics.currentAsymmetry <= 3
                    ? 'text-green-600'
                    : metrics.currentAsymmetry <= 5
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {metrics.currentAsymmetry.toFixed(1)}%
              </span>
              <Badge
                variant={
                  metrics.currentAsymmetry <= 3 ? 'default' : 'secondary'
                }
              >
                {metrics.currentAsymmetry <= 3 ? 'normal' : 'monitor'}
              </Badge>
            </div>
          </div>
          <Progress
            value={Math.min(100, (metrics.currentAsymmetry / 10) * 100)}
            className={`h-2 ${metrics.currentAsymmetry > 5 ? 'bg-red-100' : ''}`}
          />
        </div>

        {/* Steadiness */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              <span className="font-medium">Walking Steadiness</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`font-mono text-lg ${
                  metrics.currentSteadiness >= 70
                    ? 'text-green-600'
                    : metrics.currentSteadiness >= 50
                      ? 'text-yellow-600'
                      : 'text-red-600'
                }`}
              >
                {metrics.currentSteadiness}%
              </span>
              <Badge
                variant={
                  metrics.currentSteadiness >= 70 ? 'default' : 'secondary'
                }
              >
                {metrics.currentSteadiness >= 70 ? 'stable' : 'unstable'}
              </Badge>
            </div>
          </div>
          <Progress value={metrics.currentSteadiness} className="h-2" />
        </div>

        {/* Session Stats */}
        <div className="space-y-2 border-t pt-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold">{metrics.stepCount}</p>
              <p className="text-muted-foreground text-xs">Steps</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {metrics.distance.toFixed(0)}m
              </p>
              <p className="text-muted-foreground text-xs">Distance</p>
            </div>
            <div>
              <p className="text-2xl font-bold">
                {Math.floor(metrics.duration / 60)}:
                {(metrics.duration % 60).toString().padStart(2, '0')}
              </p>
              <p className="text-muted-foreground text-xs">Duration</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WalkingSessionCard({ session }: { session: WalkingSession }) {
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600 bg-green-100';
      case 'good':
        return 'text-blue-600 bg-blue-100';
      case 'fair':
        return 'text-yellow-600 bg-yellow-100';
      case 'poor':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Walking Session</CardTitle>
          <Badge className={getQualityColor(session.quality)}>
            {session.quality}
          </Badge>
        </div>
        <CardDescription>
          {session.startTime.toLocaleTimeString()} -{' '}
          {session.endTime?.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Duration</span>
              <span className="font-mono text-sm">
                {Math.floor(session.duration / 60)}m {session.duration % 60}s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Steps</span>
              <span className="font-mono text-sm">{session.steps}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Distance</span>
              <span className="font-mono text-sm">
                {session.distance.toFixed(0)}m
              </span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Avg Speed</span>
              <span className="font-mono text-sm">
                {session.averageSpeed.toFixed(2)} m/s
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Cadence</span>
              <span className="font-mono text-sm">{session.cadence} spm</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground text-sm">Steadiness</span>
              <span className="font-mono text-sm">
                {session.steadinessScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Quality Indicators */}
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Quality Metrics</h4>
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs">Asymmetry</span>
              <span
                className={`text-xs ${
                  session.asymmetryScore <= 3
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {session.asymmetryScore.toFixed(1)}%
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs">Double Support</span>
              <span
                className={`text-xs ${
                  session.doubleSupportTime <= 25
                    ? 'text-green-600'
                    : 'text-red-600'
                }`}
              >
                {session.doubleSupportTime.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsPanel({ alerts }: { alerts: WalkingAlert[] }) {
  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical')
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    if (severity === 'warning')
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <CheckCircle className="h-4 w-4 text-blue-500" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Walking Alerts
        </CardTitle>
        <CardDescription>
          Real-time feedback and recommendations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="py-4 text-center">
            <CheckCircle className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-muted-foreground text-sm">
              No alerts - walking pattern looks good!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert, index) => (
              <div
                key={index}
                className={`rounded-lg border-l-4 p-3 ${
                  alert.severity === 'critical'
                    ? 'border-red-500 bg-red-50'
                    : alert.severity === 'warning'
                      ? 'border-yellow-500 bg-yellow-50'
                      : 'border-blue-500 bg-blue-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type, alert.severity)}
                  <div className="flex-1">
                    <p className="text-sm font-medium capitalize">
                      {alert.type} Alert
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {alert.message}
                    </p>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {alert.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function WalkingPatternMonitor() {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [realtimeMetrics, setRealtimeMetrics] = useState<RealTimeMetrics>({
    currentSpeed: 0,
    currentCadence: 0,
    currentAsymmetry: 0,
    currentSteadiness: 0,
    stepCount: 0,
    distance: 0,
    duration: 0,
  });
  const [walkingSessions, setWalkingSessions] = useState<WalkingSession[]>([]);
  const [alerts, setAlerts] = useState<WalkingAlert[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = () => {
    setIsRecording(true);
    setIsPaused(false);
    setSessionStartTime(new Date());
    setRealtimeMetrics({
      currentSpeed: 0,
      currentCadence: 0,
      currentAsymmetry: 0,
      currentSteadiness: 0,
      stepCount: 0,
      distance: 0,
      duration: 0,
    });
    setAlerts([]);

    // Simulate real-time data updates
    intervalRef.current = setInterval(() => {
      setRealtimeMetrics((prev) => {
        const newDuration = prev.duration + 1;
        const newSteps = prev.stepCount + Math.random() * 2; // Simulate step detection
        const newDistance = prev.distance + (Math.random() * 0.5 + 0.5); // Simulate distance
        const newSpeed = newDistance / newDuration || 0;
        const newCadence = newSteps / (newDuration / 60) || 0;

        // Simulate some variation in metrics
        const newAsymmetry = 1 + Math.random() * 4; // 1-5% asymmetry
        const newSteadiness = 65 + Math.random() * 30; // 65-95% steadiness

        // Generate alerts based on metrics
        const newAlerts = [...alerts];
        if (newSpeed < 0.8 && newDuration > 10) {
          newAlerts.push({
            type: 'speed',
            severity: 'warning',
            message:
              'Walking speed is below recommended level. Try to maintain a steady pace.',
            timestamp: new Date(),
          });
        }
        if (newAsymmetry > 5) {
          newAlerts.push({
            type: 'asymmetry',
            severity: 'warning',
            message:
              'Gait asymmetry detected. Focus on even steps with both legs.',
            timestamp: new Date(),
          });
        }
        if (newSteadiness < 50) {
          newAlerts.push({
            type: 'steadiness',
            severity: 'critical',
            message:
              'Low walking steadiness detected. Consider slowing down or taking a break.',
            timestamp: new Date(),
          });
        }

        setAlerts(newAlerts.slice(-5)); // Keep only last 5 alerts

        return {
          currentSpeed: newSpeed,
          currentCadence: newCadence,
          currentAsymmetry: newAsymmetry,
          currentSteadiness: newSteadiness,
          stepCount: Math.floor(newSteps),
          distance: newDistance,
          duration: newDuration,
        };
      });
    }, 1000);

    toast.success('Walking session started');
  };

  const pauseRecording = () => {
    setIsPaused(true);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    toast.info('Recording paused');
  };

  const resumeRecording = () => {
    setIsPaused(false);
    // Resume interval
    startRecording();
    toast.info('Recording resumed');
  };

  const stopRecording = () => {
    setIsRecording(false);
    setIsPaused(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Create session record
    if (sessionStartTime && realtimeMetrics.duration > 0) {
      const session: WalkingSession = {
        id: Date.now().toString(),
        startTime: sessionStartTime,
        endTime: new Date(),
        duration: realtimeMetrics.duration,
        steps: realtimeMetrics.stepCount,
        distance: realtimeMetrics.distance,
        averageSpeed: realtimeMetrics.currentSpeed,
        cadence: realtimeMetrics.currentCadence,
        asymmetryScore: realtimeMetrics.currentAsymmetry,
        steadinessScore: realtimeMetrics.currentSteadiness,
        doubleSupportTime: 20 + Math.random() * 10, // Simulated
        quality:
          realtimeMetrics.currentSpeed > 1.0 &&
          realtimeMetrics.currentSteadiness > 70
            ? 'excellent'
            : realtimeMetrics.currentSpeed > 0.8 &&
                realtimeMetrics.currentSteadiness > 50
              ? 'good'
              : realtimeMetrics.currentSpeed > 0.6
                ? 'fair'
                : 'poor',
      };

      setWalkingSessions((prev) => [session, ...prev.slice(0, 4)]); // Keep last 5 sessions
    }

    setSessionStartTime(null);
    toast.success('Walking session completed');
  };

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-3 text-2xl font-bold">
            <Footprints className="h-7 w-7" />
            Walking Pattern Monitor
          </h2>
          <p className="text-muted-foreground">
            Real-time analysis of walking patterns and gait metrics
          </p>
        </div>

        {/* Recording Controls */}
        <div className="flex items-center gap-2">
          {!isRecording ? (
            <Button
              onClick={startRecording}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Recording
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              {isPaused ? (
                <Button
                  onClick={resumeRecording}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Resume
                </Button>
              ) : (
                <Button
                  onClick={pauseRecording}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Pause className="h-4 w-4" />
                  Pause
                </Button>
              )}
              <Button
                onClick={stopRecording}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Stop
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Recording Status */}
      {isRecording && (
        <Alert className="border-l-4 border-green-500 bg-green-50">
          <Activity className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            <strong>Recording active</strong> - Walking pattern analysis in
            progress
            {isPaused && <span className="ml-2 text-yellow-600">(Paused)</span>}
          </AlertDescription>
        </Alert>
      )}

      {/* Real-time Metrics */}
      {isRecording && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <RealTimeMetricsCard metrics={realtimeMetrics} />
          </div>
          <div>
            <AlertsPanel alerts={alerts} />
          </div>
        </div>
      )}

      {/* Session History */}
      {walkingSessions.length > 0 && (
        <div>
          <h3 className="mb-4 text-lg font-semibold">
            Recent Walking Sessions
          </h3>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {walkingSessions.map((session) => (
              <WalkingSessionCard key={session.id} session={session} />
            ))}
          </div>
        </div>
      )}

      {/* Getting Started */}
      {!isRecording && walkingSessions.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center">
            <Footprints className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
            <h3 className="mb-2 text-lg font-semibold">
              Start Your First Walking Session
            </h3>
            <p className="text-muted-foreground mb-4">
              Click "Start Recording" to begin monitoring your walking patterns
              in real-time. We'll analyze your gait metrics and provide
              immediate feedback.
            </p>
            <Button
              onClick={startRecording}
              className="flex items-center gap-2"
            >
              <Play className="h-4 w-4" />
              Start Walking Analysis
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
