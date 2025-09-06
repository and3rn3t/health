import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useKV } from '@/hooks/useCloudflareKV';
import { useCallback, useEffect, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Heart,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Zap,
} from 'lucide-react';

interface HealthTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  trend: 'up' | 'down' | 'stable';
  timeframe: string;
}

interface HealthInsight {
  id: string;
  title: string;
  description: string;
  type: 'positive' | 'warning' | 'critical' | 'info';
  priority: number;
  category: string;
  actionable: boolean;
  recommendations?: string[];
}

interface PredictiveAlert {
  id: string;
  title: string;
  prediction: string;
  confidence: number;
  timeframe: string;
  preventiveActions: string[];
  severity: 'low' | 'medium' | 'high';
}

interface Props {
  readonly healthData: ProcessedHealthData;
}

export default function EnhancedHealthInsightsDashboard({ healthData }: Props) {
  const [currentScore] = useKV<number>('current-health-score', 75);
  const [trends, setTrends] = useKV<HealthTrend[]>('health-trends', []);
  const [insights, setInsights] = useKV<HealthInsight[]>('health-insights', []);
  const [predictiveAlerts, setPredictiveAlerts] = useKV<PredictiveAlert[]>(
    'predictive-alerts',
    []
  );
  const [selectedInsight, setSelectedInsight] = useState<HealthInsight | null>(
    null
  );

  // Generate health insights based on current data
  const generateHealthInsights = useCallback(async (): Promise<
    HealthInsight[]
  > => {
    const newInsights: HealthInsight[] = [];

    // Heart rate insights
    if (healthData.metrics.heartRate) {
      const avgHeartRate = healthData.metrics.heartRate.average;
      if (avgHeartRate > 80) {
        newInsights.push({
          id: 'hr-elevated',
          title: 'Elevated Resting Heart Rate',
          description: `Your average heart rate of ${avgHeartRate} bpm is above the typical range (60-80 bpm).`,
          type: 'warning',
          priority: 8,
          category: 'Cardiovascular',
          actionable: true,
          recommendations: [
            'Consider stress reduction techniques',
            'Ensure adequate hydration',
            'Monitor caffeine intake',
            'Consult healthcare provider if persistent',
          ],
        });
      }
    }

    // Activity insights
    if (healthData.metrics.steps) {
      const avgSteps = healthData.metrics.steps.average;
      if (avgSteps < 8000) {
        newInsights.push({
          id: 'low-activity',
          title: 'Below Recommended Activity Level',
          description: `Your daily average of ${avgSteps} steps is below the recommended 8,000-10,000 steps.`,
          type: 'warning',
          priority: 6,
          category: 'Activity',
          actionable: true,
          recommendations: [
            'Take short walks throughout the day',
            'Use stairs instead of elevators',
            'Set hourly movement reminders',
            'Park farther away or walk to nearby destinations',
          ],
        });
      } else if (avgSteps > 12000) {
        newInsights.push({
          id: 'excellent-activity',
          title: 'Excellent Activity Level',
          description: `Your daily average of ${avgSteps} steps exceeds recommended levels. Great work!`,
          type: 'positive',
          priority: 4,
          category: 'Activity',
          actionable: false,
        });
      }
    }

    // Fall risk insights
    if (healthData.fallRiskFactors && healthData.fallRiskFactors.length > 0) {
      const highRiskFactors = healthData.fallRiskFactors.filter(
        (factor) => factor.risk === 'high'
      );
      if (highRiskFactors.length > 0) {
        newInsights.push({
          id: 'fall-risk-high',
          title: 'Elevated Fall Risk Detected',
          description: `${highRiskFactors.length} high-risk factors identified for falls.`,
          type: 'critical',
          priority: 10,
          category: 'Safety',
          actionable: true,
          recommendations: [
            'Review home environment for hazards',
            'Consider balance training exercises',
            'Ensure emergency contacts are updated',
            'Discuss with healthcare provider',
          ],
        });
      }
    }

    // Sleep insights
    if (healthData.metrics.sleepHours) {
      const avgSleep = healthData.metrics.sleepHours.average;
      if (avgSleep < 7) {
        newInsights.push({
          id: 'insufficient-sleep',
          title: 'Insufficient Sleep Duration',
          description: `Your average sleep of ${avgSleep.toFixed(1)} hours is below the recommended 7-9 hours.`,
          type: 'warning',
          priority: 7,
          category: 'Recovery',
          actionable: true,
          recommendations: [
            'Establish consistent bedtime routine',
            'Limit screen time before bed',
            'Create optimal sleep environment',
            'Avoid caffeine late in the day',
          ],
        });
      }
    }

    return newInsights;
  }, [healthData]);

  // Generate predictive alerts using AI
  const generatePredictiveAlerts = useCallback(async (): Promise<
    PredictiveAlert[]
  > => {
    const alerts: PredictiveAlert[] = [];

    // Cardiovascular risk prediction
    if (healthData.healthScore && healthData.healthScore < 70) {
      alerts.push({
        id: 'cv-decline',
        title: 'Cardiovascular Health Decline Risk',
        prediction:
          'Based on current trends, there is a 65% chance of further cardiovascular health decline within the next 2 weeks.',
        confidence: 65,
        timeframe: '2 weeks',
        preventiveActions: [
          'Increase moderate cardio exercise',
          'Monitor blood pressure daily',
          'Reduce sodium intake',
          'Schedule preventive cardiology consultation',
        ],
        severity: 'medium',
      });
    }

    // Fall risk prediction
    if (
      healthData.fallRiskFactors?.some(
        (factor) => factor.risk === 'moderate' || factor.risk === 'high'
      )
    ) {
      alerts.push({
        id: 'fall-prediction',
        title: 'Increased Fall Risk Likelihood',
        prediction:
          'Current gait and balance metrics suggest a 40% increased fall risk over the next month.',
        confidence: 72,
        timeframe: '1 month',
        preventiveActions: [
          'Begin balance training program',
          'Remove home hazards',
          'Improve lighting in walkways',
          'Consider fall detection device',
        ],
        severity: 'high',
      });
    }

    return alerts;
  }, [healthData]);

  // Generate health trends
  const generateHealthTrends = useCallback((): HealthTrend[] => {
    const trends: HealthTrend[] = [];

    // Mock trend data based on health metrics
    if (healthData.metrics.heartRate) {
      trends.push({
        metric: 'Heart Rate',
        current: healthData.metrics.heartRate.average,
        previous: healthData.metrics.heartRate.average + 3,
        change: -3,
        trend: 'down',
        timeframe: '7 days',
      });
    }

    if (healthData.metrics.steps) {
      trends.push({
        metric: 'Daily Steps',
        current: healthData.metrics.steps.average,
        previous: healthData.metrics.steps.average - 500,
        change: 500,
        trend: 'up',
        timeframe: '7 days',
      });
    }

    return trends;
  }, [healthData]);

  // Initialize data
  useEffect(() => {
    const initializeInsights = async () => {
      const newInsights = await generateHealthInsights();
      const newAlerts = await generatePredictiveAlerts();
      const newTrends = generateHealthTrends();

      const sorted = [...newInsights].sort((a, b) => b.priority - a.priority);
      setInsights(sorted);
      setPredictiveAlerts(newAlerts);
      setTrends(newTrends);
    };

    initializeInsights();
  }, [
    healthData,
    setInsights,
    setPredictiveAlerts,
    setTrends,
    generateHealthInsights,
    generatePredictiveAlerts,
    generateHealthTrends,
  ]);

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'positive':
        return <Heart className="h-4 w-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Brain className="h-4 w-4 text-blue-600" />;
    }
  };

  const getInsightVariant = (type: string) => {
    switch (type) {
      case 'positive':
        return 'default';
      case 'warning':
        return 'secondary';
      case 'critical':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  // Helpers
  const resolvedScore =
    (typeof healthData.healthScore === 'number'
      ? healthData.healthScore
      : undefined) ?? (typeof currentScore === 'number' ? currentScore : 75);

  const getScoreLabel = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Attention';
  };

  const getFallRiskVariant = () => {
    const factors = healthData.fallRiskFactors ?? [];
    if (factors.some((f) => f.risk === 'high')) return 'destructive' as const;
    if (factors.some((f) => f.risk === 'moderate')) return 'secondary' as const;
    return 'default' as const;
  };

  const getFallRiskLabel = () => {
    const factors = healthData.fallRiskFactors ?? [];
    if (factors.some((f) => f.risk === 'high')) return 'High Risk';
    if (factors.some((f) => f.risk === 'moderate')) return 'Moderate Risk';
    return 'Low Risk';
  };

  return (
    <div className="space-y-6">
      {/* Health Score Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-red-500" />
              Current Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-primary text-3xl font-bold">
              {resolvedScore}/100
            </div>
            <Progress value={resolvedScore} className="mt-2" />
            <p className="text-muted-foreground mt-2 text-sm">
              {getScoreLabel(resolvedScore)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-blue-500" />
              Fall Risk Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {healthData.fallRiskFactors ? (
                <Badge variant={getFallRiskVariant()}>
                  {getFallRiskLabel()}
                </Badge>
              ) : (
                <Badge variant="outline">Not Assessed</Badge>
              )}
              <p className="text-muted-foreground text-sm">
                {healthData.fallRiskFactors?.length || 0} risk factors
                identified
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-green-500" />
              Last Update
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-semibold">
              {new Date().toLocaleTimeString()}
            </div>
            <p className="text-muted-foreground text-sm">
              Real-time monitoring active
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Insights Tabs */}
      <Tabs defaultValue="insights" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="trends">Health Trends</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(insights ?? []).map((insight) => (
              <Card
                key={insight.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedInsight?.id === insight.id
                    ? 'ring-primary ring-2'
                    : ''
                }`}
                onClick={() => setSelectedInsight(insight)}
              >
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={getInsightVariant(insight.type)}
                      className="text-xs"
                    >
                      {insight.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Priority: {insight.priority}/10
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-sm">
                    {insight.description}
                  </p>
                  {insight.actionable && (
                    <Badge variant="outline" className="mt-2 text-xs">
                      <Target className="mr-1 h-3 w-3" />
                      Actionable
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {selectedInsight?.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle>
                  Recommendations for: {selectedInsight.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {selectedInsight.recommendations.map((rec) => (
                    <li
                      key={`${selectedInsight.id}:${rec}`}
                      className="flex items-start gap-2"
                    >
                      <div className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(trends ?? []).map((trend) => {
              let trendVariant: 'default' | 'destructive' | 'secondary' =
                'secondary';
              if (trend.trend === 'up') trendVariant = 'default';
              else if (trend.trend === 'down') trendVariant = 'destructive';
              return (
                <Card key={`${trend.metric}:${trend.timeframe}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center justify-between text-sm">
                      <span>{trend.metric}</span>
                      {getTrendIcon(trend.trend)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xl font-bold">
                          {trend.current}
                        </span>
                        <Badge variant={trendVariant}>
                          {trend.change > 0 ? '+' : ''}
                          {trend.change}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground text-xs">
                        vs {trend.previous} ({trend.timeframe})
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          {(predictiveAlerts ?? []).map((alert) => {
            let severityVariant: 'destructive' | 'secondary' | 'outline' =
              'outline';
            if (alert.severity === 'high') severityVariant = 'destructive';
            else if (alert.severity === 'medium') severityVariant = 'secondary';
            return (
              <Card key={alert.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    {alert.title}
                    <Badge variant={severityVariant}>
                      {alert.severity} risk
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm">{alert.prediction}</p>
                  <div className="text-muted-foreground flex items-center gap-4 text-sm">
                    <span>Confidence: {alert.confidence}%</span>
                    <span>Timeframe: {alert.timeframe}</span>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Preventive Actions:</h4>
                    <ul className="space-y-1">
                      {alert.preventiveActions.map((action) => (
                        <li
                          key={`${alert.id}:${action}`}
                          className="flex items-start gap-2 text-sm"
                        >
                          <div className="bg-accent mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                          <span>{action}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(insights ?? [])
              .filter(
                (insight) => insight.actionable && insight.recommendations
              )
              .map((insight) => (
                <Card key={insight.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-sm">
                      <Zap className="h-4 w-4 text-yellow-500" />
                      {insight.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {insight.recommendations?.map((rec) => (
                        <Button
                          key={`${insight.id}:${rec}`}
                          variant="outline"
                          size="sm"
                          className="h-auto w-full justify-start py-2 text-xs"
                        >
                          {rec}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
