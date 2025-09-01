import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  ArrowUp,
  ArrowDown,
  Activity,
  Heart,
  BarChart3,
  Zap,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Info,
  Minus,
} from '@phosphor-icons/react';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { toast } from 'sonner';

interface TrendData {
  timestamp: number;
  value: number;
  category: string;
  metric: string;
}

interface HealthTrend {
  metric: string;
  current: number;
  previous: number;
  change: number;
  changePercent: number;
  trend: 'up' | 'down' | 'stable';
  category: string;
  unit: string;
  status: 'good' | 'warning' | 'critical' | 'neutral';
  insight: string;
  recommendation?: string;
}

interface LiveInsight {
  id: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical' | 'success';
  timestamp: number;
  category: string;
  actionable: boolean;
  recommendation?: string;
}

interface HealthInsightsDashboardProps {
  healthData: ProcessedHealthData;
}

export default function HealthInsightsDashboard({
  healthData,
}: HealthInsightsDashboardProps) {
  const [trendHistory, setTrendHistory] = useKV<TrendData[]>(
    'health-trend-history',
    []
  );
  const [liveInsights, setLiveInsights] = useKV<LiveInsight[]>(
    'live-health-insights',
    []
  );
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [autoRefresh, setAutoRefresh] = useKV('insights-auto-refresh', true);

  // Simulate real-time data updates
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      // Add current health data to trend history
      const now = Date.now();
      const newTrendData: TrendData[] = [];

      if (healthData.metrics) {
        // Heart rate trends
        if (healthData.metrics.heartRate) {
          newTrendData.push({
            timestamp: now,
            value: healthData.metrics.heartRate.average || 0,
            category: 'cardiovascular',
            metric: 'heartRate',
          });
        }

        // Steps trends
        if (healthData.metrics.steps) {
          newTrendData.push({
            timestamp: now,
            value: healthData.metrics.steps.total || 0,
            category: 'activity',
            metric: 'steps',
          });
        }

        // Sleep trends
        if (healthData.metrics.sleep) {
          newTrendData.push({
            timestamp: now,
            value: healthData.metrics.sleep.totalHours || 0,
            category: 'recovery',
            metric: 'sleep',
          });
        }

        // Update trend history (keep last 100 entries)
        setTrendHistory((currentHistory) => {
          const updated = [...currentHistory, ...newTrendData];
          return updated.slice(-100);
        });
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [healthData, autoRefresh, setTrendHistory]);

  // Generate live insights based on current health data and trends
  const generateLiveInsights = async () => {
    setIsAnalyzing(true);

    try {
      const insights: LiveInsight[] = [];
      const now = Date.now();

      // Analyze heart rate patterns
      if (healthData.metrics?.heartRate) {
        const avgHR = healthData.metrics.heartRate.average || 0;
        if (avgHR > 100) {
          insights.push({
            id: `hr-elevated-${now}`,
            title: 'Elevated Heart Rate Detected',
            description: `Your average heart rate is ${avgHR} BPM, which is above normal resting range.`,
            severity: 'warning',
            timestamp: now,
            category: 'cardiovascular',
            actionable: true,
            recommendation:
              'Consider relaxation techniques or consult your healthcare provider if persistent.',
          });
        } else if (avgHR >= 60 && avgHR <= 80) {
          insights.push({
            id: `hr-optimal-${now}`,
            title: 'Optimal Heart Rate Range',
            description: `Your heart rate of ${avgHR} BPM is in the healthy range.`,
            severity: 'success',
            timestamp: now,
            category: 'cardiovascular',
            actionable: false,
          });
        }
      }

      // Analyze activity levels
      if (healthData.metrics?.steps) {
        const dailySteps = healthData.metrics.steps.total || 0;
        if (dailySteps < 8000) {
          insights.push({
            id: `steps-low-${now}`,
            title: 'Activity Goal Not Met',
            description: `You've taken ${dailySteps.toLocaleString()} steps today. Aim for 8,000+ steps for optimal health.`,
            severity: 'warning',
            timestamp: now,
            category: 'activity',
            actionable: true,
            recommendation:
              'Try taking a 15-minute walk or using stairs instead of elevators.',
          });
        } else if (dailySteps >= 10000) {
          insights.push({
            id: `steps-excellent-${now}`,
            title: 'Excellent Activity Level!',
            description: `Outstanding! You've achieved ${dailySteps.toLocaleString()} steps today.`,
            severity: 'success',
            timestamp: now,
            category: 'activity',
            actionable: false,
          });
        }
      }

      // Analyze sleep patterns
      if (healthData.metrics?.sleep) {
        const sleepHours = healthData.metrics.sleep.totalHours || 0;
        if (sleepHours < 7) {
          insights.push({
            id: `sleep-insufficient-${now}`,
            title: 'Insufficient Sleep Detected',
            description: `You got ${sleepHours.toFixed(1)} hours of sleep. Adults need 7-9 hours for optimal recovery.`,
            severity: 'warning',
            timestamp: now,
            category: 'recovery',
            actionable: true,
            recommendation:
              'Consider establishing a consistent bedtime routine and avoiding screens before bed.',
          });
        } else if (sleepHours >= 7 && sleepHours <= 9) {
          insights.push({
            id: `sleep-optimal-${now}`,
            title: 'Great Sleep Duration',
            description: `You achieved ${sleepHours.toFixed(1)} hours of sleep, which is within the optimal range.`,
            severity: 'success',
            timestamp: now,
            category: 'recovery',
            actionable: false,
          });
        }
      }

      // Analyze fall risk factors
      if (healthData.fallRiskFactors && healthData.fallRiskFactors.length > 0) {
        const highRiskFactors = healthData.fallRiskFactors.filter(
          (factor) => factor.risk === 'high'
        );
        if (highRiskFactors.length > 0) {
          insights.push({
            id: `fall-risk-high-${now}`,
            title: 'Elevated Fall Risk Detected',
            description: `${highRiskFactors.length} high-risk factors identified: ${highRiskFactors.map((f) => f.factor).join(', ')}.`,
            severity: 'critical',
            timestamp: now,
            category: 'safety',
            actionable: true,
            recommendation:
              'Review balance exercises and consider discussing with your healthcare provider.',
          });
        }
      }

      // Overall health score insight
      if (healthData.healthScore) {
        if (healthData.healthScore >= 80) {
          insights.push({
            id: `health-score-excellent-${now}`,
            title: 'Excellent Health Score',
            description: `Your health score of ${healthData.healthScore}/100 indicates excellent overall health.`,
            severity: 'success',
            timestamp: now,
            category: 'overall',
            actionable: false,
          });
        } else if (healthData.healthScore < 60) {
          insights.push({
            id: `health-score-needs-attention-${now}`,
            title: 'Health Score Needs Attention',
            description: `Your health score of ${healthData.healthScore}/100 suggests areas for improvement.`,
            severity: 'warning',
            timestamp: now,
            category: 'overall',
            actionable: true,
            recommendation:
              'Focus on improving sleep, activity levels, and monitoring key health metrics.',
          });
        }
      }

      // Update live insights (keep last 20)
      setLiveInsights((currentInsights) => {
        const filtered = currentInsights.filter(
          (insight) => now - insight.timestamp < 24 * 60 * 60 * 1000 // Keep insights from last 24 hours
        );
        return [...filtered, ...insights].slice(-20);
      });

      toast.success(`Generated ${insights.length} new health insights`);
    } catch (error) {
      toast.error('Failed to analyze health data');
      console.error('Insight generation error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Calculate health trends
  const calculateTrends = (): HealthTrend[] => {
    const trends: HealthTrend[] = [];

    if (!healthData.metrics) return trends;

    // Heart Rate Trend
    if (healthData.metrics.heartRate) {
      const current = healthData.metrics.heartRate.average || 0;
      const historical = trendHistory
        .filter((t) => t.metric === 'heartRate')
        .slice(-10);
      const previous =
        historical.length > 0
          ? historical[historical.length - 1]?.value || current
          : current;
      const change = current - previous;
      const changePercent = previous > 0 ? (change / previous) * 100 : 0;

      trends.push({
        metric: 'Heart Rate',
        current,
        previous,
        change,
        changePercent,
        trend:
          Math.abs(changePercent) < 2
            ? 'stable'
            : changePercent > 0
              ? 'up'
              : 'down',
        category: 'cardiovascular',
        unit: 'BPM',
        status:
          current >= 60 && current <= 80
            ? 'good'
            : current > 100
              ? 'warning'
              : 'neutral',
        insight:
          current >= 60 && current <= 80
            ? 'Heart rate is in optimal range'
            : current > 100
              ? 'Heart rate is elevated - consider rest'
              : 'Heart rate is below normal range',
      });
    }

    // Steps Trend
    if (healthData.metrics.steps) {
      const current = healthData.metrics.steps.total || 0;
      const historical = trendHistory
        .filter((t) => t.metric === 'steps')
        .slice(-7); // Last 7 days
      const avgPrevious =
        historical.length > 0
          ? historical.reduce((sum, t) => sum + t.value, 0) / historical.length
          : current;
      const change = current - avgPrevious;
      const changePercent = avgPrevious > 0 ? (change / avgPrevious) * 100 : 0;

      trends.push({
        metric: 'Daily Steps',
        current,
        previous: Math.round(avgPrevious),
        change: Math.round(change),
        changePercent,
        trend:
          Math.abs(changePercent) < 5
            ? 'stable'
            : changePercent > 0
              ? 'up'
              : 'down',
        category: 'activity',
        unit: 'steps',
        status:
          current >= 8000 ? 'good' : current < 5000 ? 'warning' : 'neutral',
        insight:
          current >= 10000
            ? 'Excellent activity level!'
            : current >= 8000
              ? 'Good activity level'
              : 'Consider increasing daily activity',
        recommendation:
          current < 8000 ? 'Aim for at least 8,000 steps daily' : undefined,
      });
    }

    // Sleep Trend
    if (healthData.metrics.sleep) {
      const current = healthData.metrics.sleep.totalHours || 0;
      const historical = trendHistory
        .filter((t) => t.metric === 'sleep')
        .slice(-7); // Last 7 days
      const avgPrevious =
        historical.length > 0
          ? historical.reduce((sum, t) => sum + t.value, 0) / historical.length
          : current;
      const change = current - avgPrevious;
      const changePercent = avgPrevious > 0 ? (change / avgPrevious) * 100 : 0;

      trends.push({
        metric: 'Sleep Duration',
        current,
        previous: avgPrevious,
        change,
        changePercent,
        trend:
          Math.abs(changePercent) < 5
            ? 'stable'
            : changePercent > 0
              ? 'up'
              : 'down',
        category: 'recovery',
        unit: 'hours',
        status:
          current >= 7 && current <= 9
            ? 'good'
            : current < 6
              ? 'warning'
              : 'neutral',
        insight:
          current >= 7 && current <= 9
            ? 'Sleep duration is optimal'
            : current < 7
              ? 'Consider improving sleep habits'
              : 'Sleep duration is above average',
        recommendation:
          current < 7 ? 'Aim for 7-9 hours of sleep nightly' : undefined,
      });
    }

    return trends;
  };

  const trends = calculateTrends();
  const filteredInsights =
    selectedCategory === 'all'
      ? liveInsights
      : liveInsights.filter((insight) => insight.category === selectedCategory);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <Info className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="text-muted-foreground h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground text-2xl font-bold">
            Health Insights Dashboard
          </h2>
          <p className="text-muted-foreground">
            Live trending data and personalized health insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh((current) => !current)}
            className={autoRefresh ? 'border-green-200 bg-green-50' : ''}
          >
            <Zap className="mr-2 h-4 w-4" />
            {autoRefresh ? 'Live' : 'Paused'}
          </Button>
          <Button onClick={generateLiveInsights} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <div className="mr-2 h-4 w-4 animate-spin">⟳</div>
            ) : (
              <BarChart3 className="mr-2 h-4 w-4" />
            )}
            Analyze Now
          </Button>
        </div>
      </div>

      {/* Real-time Health Trends */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Live Health Trends
          </CardTitle>
          <CardDescription>
            Real-time tracking of your key health metrics with trend analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {trends.map((trend) => (
              <div key={trend.metric} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-foreground font-medium">
                    {trend.metric}
                  </h4>
                  {getTrendIcon(trend.trend)}
                </div>

                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-foreground text-2xl font-bold">
                      {trend.metric === 'Sleep Duration'
                        ? trend.current.toFixed(1)
                        : Math.round(trend.current).toLocaleString()}
                    </span>
                    <span className="text-muted-foreground text-sm">
                      {trend.unit}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs ${getStatusColor(trend.status)}`}
                    >
                      {trend.status === 'good'
                        ? 'Optimal'
                        : trend.status === 'warning'
                          ? 'Needs Attention'
                          : 'Monitor'}
                    </Badge>
                    {Math.abs(trend.changePercent) > 1 && (
                      <div className="flex items-center gap-1 text-xs">
                        {trend.changePercent > 0 ? (
                          <ArrowUp className="h-3 w-3 text-green-500" />
                        ) : (
                          <ArrowDown className="h-3 w-3 text-red-500" />
                        )}
                        <span
                          className={
                            trend.changePercent > 0
                              ? 'text-green-600'
                              : 'text-red-600'
                          }
                        >
                          {Math.abs(trend.changePercent).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>

                  <p className="text-muted-foreground text-xs">
                    {trend.insight}
                  </p>
                  {trend.recommendation && (
                    <p className="rounded border border-blue-200 bg-blue-50 p-2 text-xs text-blue-600">
                      💡 {trend.recommendation}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Live Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Live Health Insights
          </CardTitle>
          <CardDescription>
            AI-powered insights and recommendations based on your current health
            data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs
            value={selectedCategory}
            onValueChange={setSelectedCategory}
            className="space-y-4"
          >
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="cardiovascular">Heart</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="recovery">Sleep</TabsTrigger>
              <TabsTrigger value="safety">Safety</TabsTrigger>
              <TabsTrigger value="overall">Overall</TabsTrigger>
            </TabsList>

            <div className="space-y-3">
              {filteredInsights.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  <Clock className="mx-auto mb-2 h-8 w-8 opacity-50" />
                  <p>No insights available yet</p>
                  <p className="text-sm">
                    Click "Analyze Now" to generate insights
                  </p>
                </div>
              ) : (
                filteredInsights
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .map((insight) => (
                    <div
                      key={insight.id}
                      className="border-border bg-card flex items-start gap-3 rounded-lg border p-4"
                    >
                      <div
                        className={`rounded-full p-2 ${
                          insight.severity === 'critical'
                            ? 'bg-red-100'
                            : insight.severity === 'warning'
                              ? 'bg-yellow-100'
                              : insight.severity === 'success'
                                ? 'bg-green-100'
                                : 'bg-blue-100'
                        }`}
                      >
                        {getSeverityIcon(insight.severity)}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-foreground font-medium">
                            {insight.title}
                          </h4>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                getSeverityColor(insight.severity) as any
                              }
                              className="text-xs"
                            >
                              {insight.category}
                            </Badge>
                            <span className="text-muted-foreground text-xs">
                              {new Date(insight.timestamp).toLocaleTimeString()}
                            </span>
                          </div>
                        </div>

                        <p className="text-muted-foreground text-sm">
                          {insight.description}
                        </p>

                        {insight.recommendation && (
                          <div className="rounded border border-blue-200 bg-blue-50 p-3">
                            <p className="text-sm text-blue-800">
                              <strong>Recommendation:</strong>{' '}
                              {insight.recommendation}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Health Score Progress */}
      {healthData.healthScore && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5" />
              Overall Health Score
            </CardTitle>
            <CardDescription>
              Your comprehensive health score based on all tracked metrics
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Current Score</span>
                <span className="text-foreground text-2xl font-bold">
                  {healthData.healthScore}/100
                </span>
              </div>

              <Progress value={healthData.healthScore} className="h-3" />

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Poor</p>
                  <div className="h-2 rounded bg-red-200" />
                  <p className="text-xs">0-59</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Good</p>
                  <div className="h-2 rounded bg-yellow-200" />
                  <p className="text-xs">60-79</p>
                </div>
                <div className="space-y-1">
                  <p className="text-muted-foreground text-xs">Excellent</p>
                  <div className="h-2 rounded bg-green-200" />
                  <p className="text-xs">80-100</p>
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground text-sm">
                  {healthData.healthScore >= 80
                    ? 'Excellent health! Keep up the great work.'
                    : healthData.healthScore >= 60
                      ? 'Good health with room for improvement.'
                      : 'Focus on improving key health metrics.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
