import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useHealthInsights } from '@/hooks/useHealthInsights';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
} from '@/lib/icons';

import type { InsightsDashboardProps } from './insights/types';

export type {
  HealthInsight,
  HealthTrend,
  PredictiveAlert,
} from './insights/types';

export default function EnhancedHealthInsightsDashboard({
  healthData,
  onNavigate,
}: InsightsDashboardProps) {
  const {
    insights,
    trends,
    predictiveAlerts,
    selectedInsight,
    setSelectedInsight,
    resolvedScore,
  } = useHealthInsights(healthData);

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
        <Card
          className={onNavigate ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}
          onClick={onNavigate ? () => onNavigate('analytics') : undefined}
          role={onNavigate ? 'button' : undefined}
          tabIndex={onNavigate ? 0 : undefined}
          onKeyDown={onNavigate ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('analytics');
            }
          } : undefined}
        >
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

        <Card
          className={onNavigate ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}
          onClick={onNavigate ? () => onNavigate('fall-detection') : undefined}
          role={onNavigate ? 'button' : undefined}
          tabIndex={onNavigate ? 0 : undefined}
          onKeyDown={onNavigate ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onNavigate('fall-detection');
            }
          } : undefined}
        >
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
                <Card
                  key={`${trend.metric}:${trend.timeframe}`}
                  className={onNavigate ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}
                  onClick={onNavigate ? () => onNavigate('analytics') : undefined}
                  role={onNavigate ? 'button' : undefined}
                  tabIndex={onNavigate ? 0 : undefined}
                  onKeyDown={onNavigate ? (e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      onNavigate('analytics');
                    }
                  } : undefined}
                >
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
              <Card
                key={alert.id}
                className={onNavigate ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}
                onClick={onNavigate ? () => {
                  // Navigate to fall detection for fall-related alerts, analytics for others
                  const target = alert.id.includes('fall') ? 'fall-detection' : 'analytics';
                  onNavigate(target);
                } : undefined}
                role={onNavigate ? 'button' : undefined}
                tabIndex={onNavigate ? 0 : undefined}
                onKeyDown={onNavigate ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const target = alert.id.includes('fall') ? 'fall-detection' : 'analytics';
                    onNavigate(target);
                  }
                } : undefined}
              >
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
