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
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  Brain,
  Heart,
  Minus,
  Pause,
  Play,
  TrendingDown,
  TrendingUp,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';

interface HealthMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  weight: number;
  lastUpdated: Date;
}

interface HealthScoreData {
  overall: number;
  cardiovascular: number;
  activity: number;
  recovery: number;
  stability: number;
  timestamp: Date;
}

export default function RealTimeHealthScoring() {
  const DEFAULT_SCORE = useMemo<HealthScoreData>(
    () => ({
      overall: 75,
      cardiovascular: 78,
      activity: 72,
      recovery: 80,
      stability: 73,
      timestamp: new Date(),
    }),
    []
  );
  const [isConnected, setIsConnected] = useKV<string>(
    'apple-Watch-connected',
    'false'
  );
  const [isMonitoring, setIsMonitoring] = useKV<string>(
    'health-monitoring-active',
    'false'
  );
  const [currentScore, setCurrentScore] = useKV<HealthScoreData>(
    'current-health-score',
  DEFAULT_SCORE
  );
  const [realtimeMetrics, setRealtimeMetrics] = useKV<HealthMetric[]>(
    'realtime-metrics',
    []
  );
  const [scoreHistory, setScoreHistory] = useKV<HealthScoreData[]>(
    'score-history',
    []
  );
  const [alerts, setAlerts] = useKV<string[]>('health-score-alerts', []);

  // Simulate Apple Watch connection
  const toggleConnection = async () => {
    if (isConnected !== 'true') {
      toast.loading('Connecting to Apple Watch...');
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setIsConnected('true');
      toast.success('Connected to Apple Watch');

      // Initialize with current metrics
      const initialMetrics: HealthMetric[] = [
        {
          name: 'Heart Rate',
          value: 72,
          unit: 'bpm',
          trend: 'stable',
          weight: 0.3,
          lastUpdated: new Date(),
        },
        {
          name: 'Heart Rate Variability',
          value: 45,
          unit: 'ms',
          trend: 'up',
          weight: 0.25,
          lastUpdated: new Date(),
        },
        {
          name: 'Activity Level',
          value: 68,
          unit: '%',
          trend: 'up',
          weight: 0.2,
          lastUpdated: new Date(),
        },
        {
          name: 'Movement Quality',
          value: 82,
          unit: '%',
          trend: 'stable',
          weight: 0.15,
          lastUpdated: new Date(),
        },
        {
          name: 'Balance Score',
          value: 75,
          unit: '%',
          trend: 'down',
          weight: 0.1,
          lastUpdated: new Date(),
        },
      ];
      setRealtimeMetrics(initialMetrics);
    } else {
      setIsConnected('false');
      setIsMonitoring('false');
      toast.info('Disconnected from Apple Watch');
      setRealtimeMetrics([]);
    }
  };

  const toggleMonitoring = () => {
    if (isConnected !== 'true') {
      toast.error('Please connect to Apple Watch first');
      return;
    }

    setIsMonitoring((current) => (current === 'true' ? 'false' : 'true'));
    if (isMonitoring !== 'true') {
      toast.success('Started real-time health monitoring');
    } else {
      toast.info('Paused real-time health monitoring');
    }
  };

  // Calculate weighted health score
  const calculateHealthScore = useCallback(
    (metrics: HealthMetric[]): HealthScoreData => {
      const base = currentScore ?? DEFAULT_SCORE;
      if (metrics.length === 0) return base;

    let totalWeightedScore = 0;
    let totalWeight = 0;

    const categoryScores = {
      cardiovascular: 0,
      activity: 0,
      recovery: 0,
      stability: 0,
    };

    metrics.forEach((metric) => {
      const normalizedValue = Math.min(100, Math.max(0, metric.value));
      totalWeightedScore += normalizedValue * metric.weight;
      totalWeight += metric.weight;

      // Categorize metrics
      if (metric.name.includes('Heart')) {
        categoryScores.cardiovascular += normalizedValue * 0.5;
      } else if (metric.name.includes('Activity')) {
        categoryScores.activity += normalizedValue;
      } else if (
        metric.name.includes('Recovery') ||
        metric.name.includes('HRV')
      ) {
        categoryScores.recovery += normalizedValue;
      } else {
        categoryScores.stability += normalizedValue;
      }
    });

      const overall =
        totalWeight > 0 ? Math.round(totalWeightedScore / totalWeight) : 75;

      return {
        overall,
        cardiovascular: Math.round(categoryScores.cardiovascular),
        activity: Math.round(categoryScores.activity),
        recovery: Math.round(categoryScores.recovery),
        stability: Math.round(categoryScores.stability),
        timestamp: new Date(),
      };
    },
  [currentScore, DEFAULT_SCORE]
  );

  const transformMetrics = useCallback((currentMetrics: HealthMetric[]) => {
    return currentMetrics.map((metric) => {
      // Simulate realistic variations
      const variation = (Math.random() - 0.5) * 4; // ±2 units
      let newValue = metric.value + variation;

      // Apply bounds based on metric type
      if (metric.name === 'Heart Rate') {
        newValue = Math.max(50, Math.min(120, newValue));
      } else if (metric.name === 'Heart Rate Variability') {
        newValue = Math.max(20, Math.min(80, newValue));
      } else {
        newValue = Math.max(0, Math.min(100, newValue));
      }

      // Determine trend
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (Math.abs(variation) > 1) {
        trend = variation > 0 ? 'up' : 'down';
      }

      return {
        ...metric,
        value: Math.round(newValue * 10) / 10,
        trend,
        lastUpdated: new Date(),
      };
    });
  }, []);

  // Simulate real-time updates
  useEffect(() => {
    if (isConnected !== 'true' || isMonitoring !== 'true') return;

    const interval = setInterval(() => {
      setRealtimeMetrics((old) => transformMetrics(old ?? []));
    }, 3000);

    return () => clearInterval(interval);
  }, [isConnected, isMonitoring, setRealtimeMetrics, transformMetrics]);

  // Update health score when metrics change
  useEffect(() => {
    if ((realtimeMetrics ?? []).length > 0) {
      const newScore = calculateHealthScore(realtimeMetrics ?? []);
      setCurrentScore(newScore);

      // Add to history every minute (simulated)
      setScoreHistory((current) => {
        const updated = [...(current ?? []), newScore].slice(-50); // Keep last 50 entries
        return updated;
      });

      // Check for alerts
      const newAlerts: string[] = [];

      if (newScore.overall < 60) {
        newAlerts.push('Overall health score is below normal range');
      }

      if (newScore.cardiovascular < 50) {
        newAlerts.push('Cardiovascular metrics need attention');
      }

  const heartRateMetric = (realtimeMetrics ?? []).find(
        (m) => m.name === 'Heart Rate'
      );
      if (
        heartRateMetric &&
        (heartRateMetric.value > 100 || heartRateMetric.value < 60)
      ) {
        newAlerts.push('Heart rate outside normal range');
      }

      setAlerts(newAlerts);
    }
  }, [realtimeMetrics, calculateHealthScore, setCurrentScore, setScoreHistory, setAlerts]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreVariant = (score: number) => {
    if (score >= 80) return 'default';
    if (score >= 60) return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-3 w-3 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-3 w-3 text-red-600" />;
      default:
        return <Minus className="h-3 w-3 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-red-500" />
            Real-Time Health Score Monitoring
          </CardTitle>
          <CardDescription>
            Live health scoring with Apple Watch integration for continuous
            monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isConnected === 'true' ? (
                <div className="flex items-center gap-2">
                  <Wifi className="h-5 w-5 text-green-600" />
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800"
                  >
                    Apple Watch Connected
                  </Badge>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <WifiOff className="h-5 w-5 text-gray-500" />
                  <Badge variant="outline">Not Connected</Badge>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant={isConnected === 'true' ? 'outline' : 'default'}
                onClick={toggleConnection}
                className="flex items-center gap-2"
              >
                <Heart className="h-4 w-4" />
                {isConnected === 'true' ? 'Disconnect' : 'Connect Watch'}
              </Button>

              {isConnected === 'true' && (
                <Button
                  variant={isMonitoring === 'true' ? 'destructive' : 'default'}
                  onClick={toggleMonitoring}
                  className="flex items-center gap-2"
                >
                  {isMonitoring === 'true' ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isMonitoring === 'true' ? 'Pause' : 'Start'} Monitoring
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Score Overview */}
      {isConnected === 'true' && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Overall Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="relative">
                  {(() => {
                    const cs = currentScore ?? DEFAULT_SCORE;
                    return (
                  <div
                      className={`text-4xl font-bold ${getScoreColor(cs.overall)}`}
                  >
                      {cs.overall}
                  </div>
                    );
                  })()}
                  <div className="text-muted-foreground text-center text-sm">
                    / 100
                  </div>
                </div>
              </div>
              <Progress value={(currentScore ?? DEFAULT_SCORE).overall} className="mt-4" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Cardiovascular</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getScoreColor((currentScore ?? DEFAULT_SCORE).cardiovascular)}`}
              >
                {(currentScore ?? DEFAULT_SCORE).cardiovascular}
              </div>
              <Progress value={(currentScore ?? DEFAULT_SCORE).cardiovascular} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getScoreColor((currentScore ?? DEFAULT_SCORE).activity)}`}
              >
                {(currentScore ?? DEFAULT_SCORE).activity}
              </div>
              <Progress value={(currentScore ?? DEFAULT_SCORE).activity} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Recovery</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getScoreColor((currentScore ?? DEFAULT_SCORE).recovery)}`}
              >
                {(currentScore ?? DEFAULT_SCORE).recovery}
              </div>
              <Progress value={(currentScore ?? DEFAULT_SCORE).recovery} className="mt-2" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Stability</CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${getScoreColor((currentScore ?? DEFAULT_SCORE).stability)}`}
              >
                {(currentScore ?? DEFAULT_SCORE).stability}
              </div>
              <Progress value={(currentScore ?? DEFAULT_SCORE).stability} className="mt-2" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Live Metrics */}
  {isConnected === 'true' && (realtimeMetrics ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Live Health Metrics
              {isMonitoring === 'true' && (
                <div className="flex items-center gap-1">
                  <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-sm text-green-600">Live</span>
                </div>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {(realtimeMetrics ?? []).map((metric) => (
                <div
          key={`${metric.name}-${metric.lastUpdated.getTime()}`}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <div className="font-medium">{metric.name}</div>
                    <div className="text-muted-foreground text-sm">
                      Updated {metric.lastUpdated.toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-semibold">
                      {metric.value} {metric.unit}
                    </span>
                    {getTrendIcon(metric.trend)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerts */}
    {(alerts ?? []).length > 0 && (
        <div className="space-y-2">
      {(alerts ?? []).map((alert) => (
            <Alert key={alert} variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{alert}</AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* AI Insights */}
  {isConnected === 'true' && isMonitoring === 'true' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Health Insights
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="mb-2 font-medium">Current Trend</h4>
                <p className="text-muted-foreground text-sm">
                  Your health score has been{' '}
                  {(currentScore ?? DEFAULT_SCORE).overall >= 75 ? 'stable' : 'declining'} over the
                  last hour.
                  {(currentScore ?? DEFAULT_SCORE).cardiovascular > 80 &&
                    ' Excellent cardiovascular performance detected.'}
                </p>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="mb-2 font-medium">Recommendations</h4>
                <p className="text-muted-foreground text-sm">
      {(currentScore ?? DEFAULT_SCORE).activity < 70
                    ? 'Consider light movement to improve activity score.'
                    : 'Great activity levels! Keep up the good work.'}
                </p>
              </div>
            </div>

    {(currentScore ?? DEFAULT_SCORE).overall < 70 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Your health score is below optimal range. Consider consulting
                  with healthcare providers or adjusting daily activities based
                  on the metrics above.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Score History Preview */}
  {(scoreHistory ?? []).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Score History</CardTitle>
            <CardDescription>
              Health score trends over recent monitoring sessions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
      {(scoreHistory ?? [])
                .slice(-5)
                .reverse()
        .map((score) => (
                  <div
          key={score.timestamp.toISOString()}
                    className="flex items-center justify-between rounded border p-2"
                  >
                    <span className="text-muted-foreground text-sm">
                      {score.timestamp.toLocaleString()}
                    </span>
                    <Badge variant={getScoreVariant(score.overall)}>
                      {score.overall}/100
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
