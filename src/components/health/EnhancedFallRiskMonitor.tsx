/**
 * Real-Time Fall Risk Monitoring Dashboard
 * Enhanced monitoring with predictive analytics and adaptive alerts
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
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  Footprints,
  Heart,
  LineChart,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface EnhancedMetrics {
  walkingSpeed: number;
  steadinessScore: number;
  gaitAsymmetry: number;
  balanceConfidence: number;
  heartRateVariability: number;
  fatigueLevel: number;
  environmentalRisk: number;
  predictedRisk24h: number;
  predictedRisk7d: number;
}

interface PredictiveAlert {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  description: string;
  confidence: number;
  timeToEvent: number; // hours
  interventions: string[];
  timestamp: Date;
}

interface AdaptiveThreshold {
  metric: string;
  value: number;
  isAdaptive: boolean;
  personalizedFor: string;
  lastAdjusted: Date;
  confidence: number;
}

interface MonitoringSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number; // minutes
  averageRisk: number;
  peakRisk: number;
  alertsTriggered: number;
  interventionsApplied: number;
  qualityScore: number; // 0-100
}

function PredictiveAnalyticsDashboard({
  metrics,
}: {
  metrics: EnhancedMetrics;
}) {
  const getRiskColor = (risk: number) => {
    if (risk >= 0.8) return 'text-red-600';
    if (risk >= 0.6) return 'text-orange-600';
    if (risk >= 0.4) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getRiskLevel = (risk: number) => {
    if (risk >= 0.8) return 'Critical';
    if (risk >= 0.6) return 'High';
    if (risk >= 0.4) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {/* Current Risk Status */}
      <Card className="col-span-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            AI-Powered Risk Prediction
          </CardTitle>
          <CardDescription>
            Machine learning analysis of current and predicted fall risk
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Risk</span>
                <Badge
                  variant={
                    metrics.predictedRisk24h >= 0.6
                      ? 'destructive'
                      : 'secondary'
                  }
                >
                  {getRiskLevel(metrics.predictedRisk24h)}
                </Badge>
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={metrics.predictedRisk24h * 100}
                  className="flex-1"
                />
                <span
                  className={`font-mono text-sm ${getRiskColor(metrics.predictedRisk24h)}`}
                >
                  {(metrics.predictedRisk24h * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">24-Hour Forecast</span>
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={metrics.predictedRisk24h * 100}
                  className="flex-1"
                />
                <span
                  className={`font-mono text-sm ${getRiskColor(metrics.predictedRisk24h)}`}
                >
                  {(metrics.predictedRisk24h * 100).toFixed(0)}%
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">7-Day Trend</span>
                <LineChart className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex items-center gap-2">
                <Progress
                  value={metrics.predictedRisk7d * 100}
                  className="flex-1"
                />
                <span
                  className={`font-mono text-sm ${getRiskColor(metrics.predictedRisk7d)}`}
                >
                  {(metrics.predictedRisk7d * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Walking Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Footprints className="h-5 w-5" />
            Gait Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Walking Speed</span>
              <span className="font-mono text-sm">
                {metrics.walkingSpeed.toFixed(2)} m/s
              </span>
            </div>
            <Progress
              value={(metrics.walkingSpeed / 1.4) * 100}
              className="h-2"
            />
            <p className="text-muted-foreground text-xs">
              Target: 1.2-1.4 m/s for optimal mobility
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Gait Asymmetry</span>
              <span
                className={`font-mono text-sm ${
                  metrics.gaitAsymmetry <= 3
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`}
              >
                {metrics.gaitAsymmetry.toFixed(1)}%
              </span>
            </div>
            <Progress
              value={Math.min(100, (metrics.gaitAsymmetry / 10) * 100)}
              className={`h-2 ${metrics.gaitAsymmetry > 5 ? 'bg-red-100' : ''}`}
            />
            <p className="text-muted-foreground text-xs">
              Normal: &lt;3% asymmetry between left/right steps
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Advanced Balance Assessment */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Shield className="h-5 w-5" />
            Balance & Stability
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Walking Steadiness</span>
              <Badge
                variant={
                  metrics.steadinessScore >= 70 ? 'default' : 'secondary'
                }
              >
                {metrics.steadinessScore}%
              </Badge>
            </div>
            <Progress value={metrics.steadinessScore} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Balance Confidence</span>
              <span className="font-mono text-sm">
                {metrics.balanceConfidence.toFixed(1)}/10
              </span>
            </div>
            <Progress value={metrics.balanceConfidence * 10} className="h-2" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Environmental Risk</span>
              <span
                className={`font-mono text-sm ${(() => {
                  if (metrics.environmentalRisk > 0.6) return 'text-red-600';
                  if (metrics.environmentalRisk > 0.3) return 'text-yellow-600';
                  return 'text-green-600';
                })()}`}
              >
                {(metrics.environmentalRisk * 100).toFixed(0)}%
              </span>
            </div>
            <Progress value={metrics.environmentalRisk * 100} className="h-2" />
            <p className="text-muted-foreground text-xs">
              Weather, lighting, surface conditions
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Physiological Indicators */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Heart className="h-5 w-5 text-red-500" />
            Physiological State
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Heart Rate Variability</span>
              <span className="font-mono text-sm">
                {metrics.heartRateVariability} ms
              </span>
            </div>
            <Progress
              value={(metrics.heartRateVariability / 50) * 100}
              className="h-2"
            />
            <p className="text-muted-foreground text-xs">
              Higher HRV indicates better autonomic function
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Fatigue Level</span>
              <Badge
                variant={
                  metrics.fatigueLevel > 0.6 ? 'destructive' : 'secondary'
                }
              >
                {(() => {
                  if (metrics.fatigueLevel > 0.7) return 'High';
                  if (metrics.fatigueLevel > 0.4) return 'Moderate';
                  return 'Low';
                })()}
              </Badge>
            </div>
            <Progress value={metrics.fatigueLevel * 100} className="h-2" />
            <p className="text-muted-foreground text-xs">
              Based on sleep, activity, and stress markers
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function PredictiveAlertsPanel({ alerts }: { alerts: PredictiveAlert[] }) {
  const getSeverityIcon = (severity: PredictiveAlert['severity']) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <Eye className="h-4 w-4 text-yellow-600" />;
      default:
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
    }
  };

  const getTypeColor = (type: PredictiveAlert['type']) => {
    switch (type) {
      case 'immediate':
        return 'border-red-200 bg-red-50';
      case 'short_term':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <div className="space-y-4">
      {alerts.length === 0 ? (
        <Card>
          <CardContent className="p-6 text-center">
            <CheckCircle className="mx-auto mb-3 h-12 w-12 text-green-600" />
            <h3 className="font-medium text-green-800">All Clear</h3>
            <p className="mt-1 text-sm text-green-600">
              No immediate fall risk concerns detected
            </p>
          </CardContent>
        </Card>
      ) : (
        alerts.map((alert) => (
          <Alert key={alert.id} className={getTypeColor(alert.type)}>
            <div className="flex items-start gap-3">
              {getSeverityIcon(alert.severity)}
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium">{alert.title}</h4>
                  <Badge variant="outline" className="text-xs">
                    {alert.confidence}% confidence
                  </Badge>
                </div>
                <AlertDescription className="text-sm">
                  {alert.description}
                </AlertDescription>
                <div className="text-muted-foreground mt-2 flex items-center gap-4 text-xs">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {alert.timeToEvent}h to potential event
                  </span>
                  <span className="flex items-center gap-1">
                    <Target className="h-3 w-3" />
                    {alert.interventions.length} interventions available
                  </span>
                </div>
              </div>
            </div>
          </Alert>
        ))
      )}
    </div>
  );
}

function AdaptiveThresholdsPanel({
  thresholds,
  onThresholdToggle,
}: {
  thresholds: AdaptiveThreshold[];
  onThresholdToggle: (metricId: string, enabled: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="text-muted-foreground mb-4 text-sm">
        Adaptive thresholds automatically adjust based on your personal patterns
        and response to interventions, improving accuracy over time.
      </div>

      {thresholds.map((threshold) => (
        <Card key={threshold.metric}>
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h4 className="font-medium">{threshold.metric}</h4>
                <p className="text-muted-foreground text-sm">
                  Personalized for {threshold.personalizedFor}
                </p>
              </div>
              <Switch
                checked={threshold.isAdaptive}
                onCheckedChange={(checked) =>
                  onThresholdToggle(threshold.metric, checked)
                }
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Current Threshold</span>
                <p className="font-mono">{threshold.value.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Confidence</span>
                <p className="font-mono">
                  {(threshold.confidence * 100).toFixed(0)}%
                </p>
              </div>
              <div>
                <span className="text-muted-foreground">Last Updated</span>
                <p className="text-xs">
                  {threshold.lastAdjusted.toLocaleDateString()}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function EnhancedFallRiskMonitor() {
  const [metrics, setMetrics] = useState<EnhancedMetrics>({
    walkingSpeed: 1.15,
    steadinessScore: 72,
    gaitAsymmetry: 4.2,
    balanceConfidence: 7.8,
    heartRateVariability: 35,
    fatigueLevel: 0.3,
    environmentalRisk: 0.2,
    predictedRisk24h: 0.35,
    predictedRisk7d: 0.42,
  });

  const [alerts] = useState<PredictiveAlert[]>([
    {
      id: 'alert-1',
      type: 'short_term',
      severity: 'warning',
      title: 'Gait Asymmetry Increasing',
      description:
        'Your gait asymmetry has increased 15% over the past 3 days. This may indicate fatigue or compensation patterns.',
      confidence: 87,
      timeToEvent: 12,
      interventions: ['Balance exercises', 'Gait training', 'Rest period'],
      timestamp: new Date(),
    },
  ]);

  const [thresholds, setThresholds] = useState<AdaptiveThreshold[]>([
    {
      metric: 'Walking Steadiness',
      value: 65,
      isAdaptive: true,
      personalizedFor: 'your activity patterns',
      lastAdjusted: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      confidence: 0.92,
    },
    {
      metric: 'Gait Asymmetry',
      value: 4.5,
      isAdaptive: true,
      personalizedFor: 'your baseline gait pattern',
      lastAdjusted: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      confidence: 0.88,
    },
    {
      metric: 'Balance Confidence',
      value: 6.5,
      isAdaptive: false,
      personalizedFor: 'clinical guidelines',
      lastAdjusted: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      confidence: 0.75,
    },
  ]);

  const [isMonitoring, setIsMonitoring] = useState(false);
  const [monitoringSession, setMonitoringSession] =
    useState<MonitoringSession | null>(null);

  const handleThresholdToggle = (metricId: string, enabled: boolean) => {
    setThresholds((prev) =>
      prev.map((t) =>
        t.metric === metricId
          ? { ...t, isAdaptive: enabled, lastAdjusted: new Date() }
          : t
      )
    );

    toast.success(
      `${enabled ? 'Enabled' : 'Disabled'} adaptive thresholds for ${metricId}`
    );
  };

  const startMonitoring = () => {
    setIsMonitoring(true);
    const session: MonitoringSession = {
      id: `session-${Date.now()}`,
      startTime: new Date(),
      duration: 0,
      averageRisk: metrics.predictedRisk24h,
      peakRisk: metrics.predictedRisk24h,
      alertsTriggered: 0,
      interventionsApplied: 0,
      qualityScore: 95,
    };
    setMonitoringSession(session);
    toast.success('Enhanced monitoring started');
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
    if (monitoringSession) {
      const endTime = new Date();
      const duration = Math.round(
        (endTime.getTime() - monitoringSession.startTime.getTime()) / 60000
      );
      setMonitoringSession({
        ...monitoringSession,
        endTime,
        duration,
      });
      toast.info(`Monitoring session completed: ${duration} minutes`);
    }
  };

  // Simulate real-time updates
  useEffect(() => {
    if (!isMonitoring) return;

    const interval = setInterval(() => {
      setMetrics((prev) => ({
        ...prev,
        walkingSpeed: Math.max(
          0.8,
          Math.min(1.6, prev.walkingSpeed + (Math.random() - 0.5) * 0.05)
        ),
        steadinessScore: Math.max(
          40,
          Math.min(100, prev.steadinessScore + (Math.random() - 0.5) * 2)
        ),
        gaitAsymmetry: Math.max(
          0,
          Math.min(15, prev.gaitAsymmetry + (Math.random() - 0.5) * 0.3)
        ),
        predictedRisk24h: Math.max(
          0,
          Math.min(1, prev.predictedRisk24h + (Math.random() - 0.5) * 0.02)
        ),
      }));
    }, 2000);

    return () => clearInterval(interval);
  }, [isMonitoring]);

  return (
    <div className="space-y-6">
      {/* Header with monitoring controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                Enhanced Fall Risk Monitor
              </CardTitle>
              <CardDescription>
                AI-powered predictive analytics with adaptive learning
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {monitoringSession && (
                <div className="text-muted-foreground text-sm">
                  Session:{' '}
                  {Math.round(
                    (Date.now() - monitoringSession.startTime.getTime()) / 60000
                  )}
                  min
                </div>
              )}
              <Button
                variant={isMonitoring ? 'destructive' : 'default'}
                onClick={isMonitoring ? stopMonitoring : startMonitoring}
                className="min-w-[120px]"
              >
                {isMonitoring ? (
                  <>
                    <Activity className="mr-2 h-4 w-4" />
                    Stop Monitor
                  </>
                ) : (
                  <>
                    <Zap className="mr-2 h-4 w-4" />
                    Start Monitor
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue="analytics" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analytics">Predictive Analytics</TabsTrigger>
          <TabsTrigger value="alerts">Smart Alerts</TabsTrigger>
          <TabsTrigger value="thresholds">Adaptive Thresholds</TabsTrigger>
          <TabsTrigger value="insights">ML Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="analytics" className="space-y-6">
          <PredictiveAnalyticsDashboard metrics={metrics} />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Predictive Alert System
              </CardTitle>
              <CardDescription>
                AI-powered early warning system with personalized interventions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PredictiveAlertsPanel alerts={alerts} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="thresholds" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Adaptive Thresholds
              </CardTitle>
              <CardDescription>
                Machine learning-optimized thresholds that adapt to your
                personal patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdaptiveThresholdsPanel
                thresholds={thresholds}
                onThresholdToggle={handleThresholdToggle}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LineChart className="h-5 w-5" />
                Machine Learning Insights
              </CardTitle>
              <CardDescription>
                Deep analysis of patterns and predictive factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <h4 className="font-medium">Key Risk Drivers</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gait Asymmetry</span>
                      <Badge variant="destructive">High Impact</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Fatigue Level</span>
                      <Badge variant="secondary">Medium Impact</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Environmental Factors</span>
                      <Badge variant="outline">Low Impact</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Intervention Effectiveness</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Balance Training</span>
                      <span className="font-mono text-sm text-green-600">
                        92% effective
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Gait Practice</span>
                      <span className="font-mono text-sm text-green-600">
                        87% effective
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Environmental Mods</span>
                      <span className="font-mono text-sm text-blue-600">
                        74% effective
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
