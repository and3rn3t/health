import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  AlertTriangle,
  TrendingDown,
  Brain,
  Bell,
  Settings,
  Activity,
  Heart,
  Zap,
  Clock,
  Target,
  ChartLine,
  Warning,
  CheckCircle,
  XCircle,
} from '@phosphor-icons/react';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { toast } from 'sonner';

interface HealthAlert {
  id: string;
  type: 'decline' | 'risk' | 'anomaly' | 'prediction';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  metric: string;
  currentValue: number;
  predictedValue: number;
  confidence: number;
  timeframe: string;
  triggered: Date;
  acknowledged: boolean;
  recommendations: string[];
}

interface AlertConfig {
  enabled: boolean;
  sensitivity: 'low' | 'medium' | 'high';
  timeframe: number; // days to look ahead
  thresholds: {
    decline: number; // percentage decline to trigger
    confidence: number; // minimum confidence level
  };
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

interface TrendAnalysis {
  metric: string;
  direction: 'improving' | 'stable' | 'declining' | 'concerning';
  slope: number;
  confidence: number;
  prediction: {
    nextWeek: number;
    nextMonth: number;
    confidence: number;
  };
  riskFactors: string[];
}

interface PredictiveHealthAlertsProps {
  healthData: ProcessedHealthData;
}

export default function PredictiveHealthAlerts({
  healthData,
}: PredictiveHealthAlertsProps) {
  const [alerts, setAlerts] = useKV<HealthAlert[]>(
    'predictive-health-alerts',
    []
  );
  const [alertConfig, setAlertConfig] = useKV<AlertConfig>('alert-config', {
    enabled: true,
    sensitivity: 'medium',
    timeframe: 30,
    thresholds: {
      decline: 15,
      confidence: 0.7,
    },
    notifications: {
      email: true,
      push: true,
      sms: false,
    },
  });
  const [trendAnalysis, setTrendAnalysis] = useState<TrendAnalysis[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('alerts');

  // Simulate ML trend analysis
  const generateTrendAnalysis = async () => {
    setIsAnalyzing(true);

    try {
      // Simulate ML processing time
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const metrics = Object.keys(healthData.metrics || {});
      const analysis: TrendAnalysis[] = [];

      for (const metric of metrics.slice(0, 6)) {
        const currentValue = healthData.metrics[metric];
        const slope = (Math.random() - 0.5) * 0.4; // Random slope between -0.2 and 0.2
        const confidence = 0.6 + Math.random() * 0.35; // Random confidence between 0.6 and 0.95

        let direction: TrendAnalysis['direction'] = 'stable';
        if (slope < -0.1)
          direction = slope < -0.15 ? 'concerning' : 'declining';
        else if (slope > 0.05) direction = 'improving';

        const nextWeekPrediction = currentValue * (1 + slope * 0.25);
        const nextMonthPrediction = currentValue * (1 + slope);

        const riskFactors = [];
        if (direction === 'declining' || direction === 'concerning') {
          riskFactors.push('Decreasing trend detected');
          if (confidence > 0.8) riskFactors.push('High confidence prediction');
          if (slope < -0.15) riskFactors.push('Rapid decline rate');
        }

        analysis.push({
          metric,
          direction,
          slope,
          confidence,
          prediction: {
            nextWeek: nextWeekPrediction,
            nextMonth: nextMonthPrediction,
            confidence,
          },
          riskFactors,
        });
      }

      setTrendAnalysis(analysis);

      // Generate alerts based on analysis
      const newAlerts: HealthAlert[] = [];

      for (const trend of analysis) {
        if (
          trend.direction === 'concerning' ||
          (trend.direction === 'declining' &&
            trend.confidence > alertConfig.thresholds.confidence)
        ) {
          const decline = Math.abs(trend.slope) * 100;

          if (decline >= alertConfig.thresholds.decline) {
            newAlerts.push({
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              type: 'decline',
              severity:
                decline > 25 ? 'critical' : decline > 20 ? 'high' : 'medium',
              title: `Predicted Decline in ${trend.metric}`,
              description: `ML analysis predicts a ${decline.toFixed(1)}% decline in ${trend.metric} over the next ${alertConfig.timeframe} days`,
              metric: trend.metric,
              currentValue: healthData.metrics[trend.metric],
              predictedValue: trend.prediction.nextMonth,
              confidence: trend.confidence,
              timeframe: `${alertConfig.timeframe} days`,
              triggered: new Date(),
              acknowledged: false,
              recommendations: generateRecommendations(trend.metric, decline),
            });
          }
        }
      }

      if (newAlerts.length > 0) {
        setAlerts((current) => [...current, ...newAlerts]);
        toast.warning(
          `${newAlerts.length} new predictive health alerts generated`
        );
      } else {
        toast.success('Analysis complete - no concerning trends detected');
      }
    } catch (error) {
      toast.error('Failed to analyze health trends');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const generateRecommendations = (
    metric: string,
    decline: number
  ): string[] => {
    const recommendations: string[] = [];

    if (metric.toLowerCase().includes('heart')) {
      recommendations.push('Increase cardiovascular exercise gradually');
      recommendations.push('Monitor blood pressure regularly');
      recommendations.push('Consider consulting a cardiologist');
    } else if (metric.toLowerCase().includes('step')) {
      recommendations.push('Set incremental daily step goals');
      recommendations.push('Try low-impact activities like swimming');
      recommendations.push('Use movement reminders throughout the day');
    } else if (metric.toLowerCase().includes('sleep')) {
      recommendations.push('Establish a consistent sleep schedule');
      recommendations.push('Create a relaxing bedtime routine');
      recommendations.push('Limit screen time before bed');
    } else {
      recommendations.push('Monitor this metric more closely');
      recommendations.push('Discuss with your healthcare provider');
      recommendations.push('Consider lifestyle modifications');
    }

    if (decline > 25) {
      recommendations.push('Seek immediate medical attention');
    }

    return recommendations;
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts((current) =>
      current.map((alert) =>
        alert.id === alertId ? { ...alert, acknowledged: true } : alert
      )
    );
    toast.success('Alert acknowledged');
  };

  const dismissAlert = (alertId: string) => {
    setAlerts((current) => current.filter((alert) => alert.id !== alertId));
    toast.success('Alert dismissed');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getTrendIcon = (direction: string) => {
    switch (direction) {
      case 'improving':
        return <TrendingDown className="h-4 w-4 rotate-180 text-green-500" />;
      case 'stable':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-orange-500" />;
      case 'concerning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  const unacknowledgedAlerts = alerts.filter((alert) => !alert.acknowledged);
  const criticalAlerts = alerts.filter(
    (alert) => alert.severity === 'critical'
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Brain className="text-primary h-6 w-6" />
            Predictive Health Alerts
          </h2>
          <p className="text-muted-foreground">
            AI-powered trend analysis and early warning system for health
            decline
          </p>
        </div>
        <Button
          onClick={generateTrendAnalysis}
          disabled={isAnalyzing}
          className="flex items-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Analyzing...
            </>
          ) : (
            <>
              <ChartLine className="h-4 w-4" />
              Run Analysis
            </>
          )}
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Active Alerts
                </p>
                <p className="text-2xl font-bold">
                  {unacknowledgedAlerts.length}
                </p>
              </div>
              <Bell className="text-primary h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Critical Alerts
                </p>
                <p className="text-destructive text-2xl font-bold">
                  {criticalAlerts.length}
                </p>
              </div>
              <AlertTriangle className="text-destructive h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Metrics Tracked
                </p>
                <p className="text-2xl font-bold">{trendAnalysis.length}</p>
              </div>
              <Target className="text-primary h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  System Status
                </p>
                <p className="text-sm font-semibold text-green-600">Active</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Critical Alerts Banner */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <span className="font-semibold">Critical Health Alert:</span>{' '}
            {criticalAlerts.length} metric(s) showing concerning decline
            patterns. Immediate attention recommended.
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="alerts" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Alerts ({unacknowledgedAlerts.length})
          </TabsTrigger>
          <TabsTrigger value="trends" className="flex items-center gap-2">
            <ChartLine className="h-4 w-4" />
            Trend Analysis
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-semibold">No Active Alerts</h3>
                <p className="text-muted-foreground">
                  Your health metrics are stable. Run analysis to check for new
                  trends.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <Card
                  key={alert.id}
                  className={`${alert.acknowledged ? 'opacity-60' : ''}`}
                >
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-3 w-3 rounded-full ${getSeverityColor(alert.severity)}`}
                        />
                        <div>
                          <CardTitle className="text-lg">
                            {alert.title}
                          </CardTitle>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {alert.type}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {alert.severity}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {new Date(alert.triggered).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {!alert.acknowledged && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => acknowledgeAlert(alert.id)}
                          >
                            Acknowledge
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => dismissAlert(alert.id)}
                        >
                          <XCircle className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground">{alert.description}</p>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          Current Value
                        </Label>
                        <p className="font-semibold">
                          {alert.currentValue.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          Predicted Value
                        </Label>
                        <p className="text-destructive font-semibold">
                          {alert.predictedValue.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          Confidence
                        </Label>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={alert.confidence * 100}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium">
                            {(alert.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label className="mb-2 block text-sm font-medium">
                        Recommendations
                      </Label>
                      <ul className="space-y-1">
                        {alert.recommendations.map((rec, index) => (
                          <li
                            key={index}
                            className="text-muted-foreground flex items-center gap-2 text-sm"
                          >
                            <div className="bg-primary h-1 w-1 rounded-full" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          {trendAnalysis.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <ChartLine className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Trend Analysis Available
                </h3>
                <p className="text-muted-foreground">
                  Run analysis to generate ML-powered trend predictions for your
                  health metrics.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {trendAnalysis.map((trend, index) => (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getTrendIcon(trend.direction)}
                        <div>
                          <CardTitle className="text-lg">
                            {trend.metric}
                          </CardTitle>
                          <CardDescription className="capitalize">
                            {trend.direction} trend detected
                          </CardDescription>
                        </div>
                      </div>
                      <Badge
                        variant={
                          trend.direction === 'concerning'
                            ? 'destructive'
                            : trend.direction === 'improving'
                              ? 'default'
                              : 'secondary'
                        }
                      >
                        {trend.direction}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          Next Week Prediction
                        </Label>
                        <p className="font-semibold">
                          {trend.prediction.nextWeek.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          Next Month Prediction
                        </Label>
                        <p className="font-semibold">
                          {trend.prediction.nextMonth.toFixed(1)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-muted-foreground text-xs">
                          Prediction Confidence
                        </Label>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={trend.confidence * 100}
                            className="flex-1"
                          />
                          <span className="text-sm font-medium">
                            {(trend.confidence * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    </div>

                    {trend.riskFactors.length > 0 && (
                      <div>
                        <Label className="mb-2 block text-sm font-medium">
                          Risk Factors
                        </Label>
                        <div className="flex flex-wrap gap-2">
                          {trend.riskFactors.map((factor, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Alert Configuration</CardTitle>
              <CardDescription>
                Configure how predictive health alerts are generated and
                delivered
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base">Enable Predictive Alerts</Label>
                  <p className="text-muted-foreground text-sm">
                    Turn on AI-powered health decline predictions
                  </p>
                </div>
                <Switch
                  checked={alertConfig.enabled}
                  onCheckedChange={(enabled) =>
                    setAlertConfig((current) => ({ ...current, enabled }))
                  }
                />
              </div>

              <Separator />

              <div className="space-y-4">
                <div>
                  <Label className="text-base">Alert Sensitivity</Label>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Higher sensitivity generates more alerts for smaller changes
                  </p>
                  <Select
                    value={alertConfig.sensitivity}
                    onValueChange={(sensitivity: 'low' | 'medium' | 'high') =>
                      setAlertConfig((current) => ({ ...current, sensitivity }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">
                        Low - Only major changes
                      </SelectItem>
                      <SelectItem value="medium">
                        Medium - Balanced approach
                      </SelectItem>
                      <SelectItem value="high">
                        High - Detect subtle changes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-base">Prediction Timeframe</Label>
                  <p className="text-muted-foreground mb-3 text-sm">
                    How far ahead to predict health trends (days)
                  </p>
                  <Input
                    type="number"
                    min="7"
                    max="90"
                    value={alertConfig.timeframe}
                    onChange={(e) =>
                      setAlertConfig((current) => ({
                        ...current,
                        timeframe: parseInt(e.target.value) || 30,
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-base">Decline Threshold</Label>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Minimum percentage decline to trigger alert
                  </p>
                  <Input
                    type="number"
                    min="5"
                    max="50"
                    value={alertConfig.thresholds.decline}
                    onChange={(e) =>
                      setAlertConfig((current) => ({
                        ...current,
                        thresholds: {
                          ...current.thresholds,
                          decline: parseInt(e.target.value) || 15,
                        },
                      }))
                    }
                  />
                </div>

                <div>
                  <Label className="text-base">Minimum Confidence</Label>
                  <p className="text-muted-foreground mb-3 text-sm">
                    Minimum ML confidence level (0.5 - 0.95)
                  </p>
                  <Input
                    type="number"
                    min="0.5"
                    max="0.95"
                    step="0.05"
                    value={alertConfig.thresholds.confidence}
                    onChange={(e) =>
                      setAlertConfig((current) => ({
                        ...current,
                        thresholds: {
                          ...current.thresholds,
                          confidence: parseFloat(e.target.value) || 0.7,
                        },
                      }))
                    }
                  />
                </div>
              </div>

              <Separator />

              <div>
                <Label className="mb-4 block text-base">
                  Notification Preferences
                </Label>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Email Notifications</Label>
                      <p className="text-muted-foreground text-sm">
                        Receive alerts via email
                      </p>
                    </div>
                    <Switch
                      checked={alertConfig.notifications.email}
                      onCheckedChange={(email) =>
                        setAlertConfig((current) => ({
                          ...current,
                          notifications: { ...current.notifications, email },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Push Notifications</Label>
                      <p className="text-muted-foreground text-sm">
                        Receive alerts on your device
                      </p>
                    </div>
                    <Switch
                      checked={alertConfig.notifications.push}
                      onCheckedChange={(push) =>
                        setAlertConfig((current) => ({
                          ...current,
                          notifications: { ...current.notifications, push },
                        }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label>SMS Notifications</Label>
                      <p className="text-muted-foreground text-sm">
                        Receive alerts via text message
                      </p>
                    </div>
                    <Switch
                      checked={alertConfig.notifications.sms}
                      onCheckedChange={(sms) =>
                        setAlertConfig((current) => ({
                          ...current,
                          notifications: { ...current.notifications, sms },
                        }))
                      }
                    />
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
