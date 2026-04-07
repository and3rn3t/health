/**
 * AI Insights Card Component
 * Compact card version for dashboard display
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  ChevronRight,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useMemo, useState, useCallback, useEffect } from 'react';
import { useOnceToast } from '@/hooks/useOnceToast';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { calculateTrend, extractTimeSeries } from '@/lib/analytics';
import EnhancedAIInsights from './EnhancedAIInsights';

export interface AIInsight {
  id: string;
  type: 'recommendation' | 'warning' | 'achievement' | 'prediction' | 'insight';
  title: string;
  content: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  category?: string;
  impact?: number;
  timeframe?: string;
  relatedMetrics?: string[];
}

interface AIInsightsCardProps {
  healthData: ProcessedHealthData | null;
  compact?: boolean;
}

export default function AIInsightsCard({
  healthData,
  compact = false,
}: AIInsightsCardProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const { showOnce } = useOnceToast();

  const generateInsights = useCallback(async () => {
    if (!healthData) return;

    setIsGenerating(true);

    try {
      // Simulate AI analysis with more sophisticated insights
      const generatedInsights: AIInsight[] = [];

      // Analyze walking steadiness
      const steadiness = healthData.metrics?.walkingSteadiness?.average || 0;
      const steadinessTrend = healthData.metrics?.walkingSteadiness?.trend;
      const steadinessData = extractTimeSeries(healthData.metrics?.walkingSteadiness, '30d');
      const steadinessTrendAnalysis = steadinessData.length > 0 ? calculateTrend(steadinessData) : null;

      if (steadiness < 60 || steadinessTrend === 'decreasing') {
        generatedInsights.push({
          id: 'insight-steadiness',
          type: 'warning',
          title: 'Balance Improvement Needed',
          content: `Your walking steadiness is at ${Math.round(steadiness)}%. ${steadinessTrendAnalysis?.direction === 'declining' ? 'This has been declining recently.' : 'Consider daily balance exercises to improve stability and reduce fall risk.'}`,
          confidence: 85,
          priority: steadiness < 50 ? 'high' : 'medium',
          actionable: true,
          category: 'fall-prevention',
          impact: 8,
          timeframe: '2-4 weeks',
          relatedMetrics: ['walkingSteadiness'],
        });
      }

      // Analyze activity levels
      const steps = healthData.metrics?.steps?.average || 0;
      const stepsTrend = healthData.metrics?.steps?.trend;
      const stepsData = extractTimeSeries(healthData.metrics?.steps, '30d');
      const stepsTrendAnalysis = stepsData.length > 0 ? calculateTrend(stepsData) : null;

      if (steps > 8000 && stepsTrend === 'increasing') {
        generatedInsights.push({
          id: 'insight-activity',
          type: 'achievement',
          title: 'Excellent Activity Progress',
          content: `Great job maintaining ${Math.round(steps).toLocaleString()} steps daily! Your activity is ${stepsTrendAnalysis?.direction === 'improving' ? 'improving' : 'stable'} and above recommended levels.`,
          confidence: 95,
          priority: 'low',
          actionable: false,
          category: 'exercise',
          impact: 7,
          relatedMetrics: ['steps'],
        });
      } else if (steps < 5000) {
        generatedInsights.push({
          id: 'insight-activity-low',
          type: 'recommendation',
          title: 'Increase Daily Activity',
          content: `Your average of ${Math.round(steps).toLocaleString()} steps is below recommended levels. Aim for 7,000-10,000 steps daily to improve cardiovascular health and reduce fall risk.`,
          confidence: 90,
          priority: 'medium',
          actionable: true,
          category: 'exercise',
          impact: 9,
          timeframe: '4-6 weeks',
          relatedMetrics: ['steps'],
        });
      }

      // Analyze sleep
      const sleep = healthData.metrics?.sleepHours?.average || 0;
      if (sleep < 7) {
        generatedInsights.push({
          id: 'insight-sleep',
          type: 'warning',
          title: 'Sleep Duration Concern',
          content: `Your average sleep of ${sleep.toFixed(1)} hours is below the recommended 7-9 hours. Poor sleep can increase fall risk, affect balance, and impact overall health.`,
          confidence: 90,
          priority: 'high',
          actionable: true,
          category: 'sleep',
          impact: 9,
          timeframe: '1-2 weeks',
          relatedMetrics: ['sleepHours'],
        });
      } else if (sleep >= 7 && sleep <= 9) {
        generatedInsights.push({
          id: 'insight-sleep-good',
          type: 'achievement',
          title: 'Healthy Sleep Patterns',
          content: `Your average sleep of ${sleep.toFixed(1)} hours is within the recommended range. Good sleep supports balance, recovery, and overall health.`,
          confidence: 95,
          priority: 'low',
          actionable: false,
          category: 'sleep',
          impact: 6,
          relatedMetrics: ['sleepHours'],
        });
      }

      // Analyze heart rate
      const heartRate = healthData.metrics?.heartRate?.average || 0;
      const heartRateVariability = healthData.metrics?.heartRate?.variability || 0;
      if (heartRate > 0 && heartRateVariability < 10) {
        generatedInsights.push({
          id: 'insight-heart',
          type: 'insight',
          title: 'Cardiovascular Health',
          content: `Your heart rate variability suggests ${heartRateVariability < 5 ? 'excellent' : 'good'} cardiovascular fitness. Continue current activity levels to maintain this.`,
          confidence: 85,
          priority: 'low',
          actionable: false,
          category: 'cardiovascular',
          impact: 5,
          relatedMetrics: ['heartRate'],
        });
      }

      // Health score insights
      const healthScore = healthData.healthScore || 0;
      if (healthScore > 80) {
        generatedInsights.push({
          id: 'insight-health-score',
          type: 'achievement',
          title: 'Excellent Health Score',
          content: `Your health score of ${healthScore}/100 indicates excellent overall health management. Keep up the great work!`,
          confidence: 95,
          priority: 'low',
          actionable: false,
          category: 'overall',
          impact: 7,
        });
      } else if (healthScore < 60) {
        generatedInsights.push({
          id: 'insight-health-score-low',
          type: 'warning',
          title: 'Health Score Needs Attention',
          content: `Your health score of ${healthScore}/100 suggests areas for improvement. Focus on the recommendations above to enhance your overall health.`,
          confidence: 85,
          priority: 'high',
          actionable: true,
          category: 'overall',
          impact: 10,
          timeframe: '4-8 weeks',
        });
      }

      // Fall risk insights
      if (healthData.fallRiskFactors && healthData.fallRiskFactors.length > 0) {
        generatedInsights.push({
          id: 'insight-fall-risk',
          type: 'prediction',
          title: 'Fall Risk Assessment',
          content: `Based on current metrics, ${healthData.fallRiskFactors.length} risk factor(s) identified. With proper interventions, risk can be reduced by 30-50% over the next 60 days.`,
          confidence: 75,
          priority: 'high',
          actionable: true,
          category: 'fall-prevention',
          impact: 9,
          timeframe: '60 days',
          relatedMetrics: ['walkingSteadiness', 'steps'],
        });
      }

      // Trend-based predictions
      if (stepsTrendAnalysis && stepsTrendAnalysis.direction === 'improving') {
        generatedInsights.push({
          id: 'insight-trend-improving',
          type: 'prediction',
          title: 'Positive Activity Trend',
          content: `Your activity levels are improving. If this trend continues, you could reach ${Math.round(stepsTrendAnalysis.prediction?.nextValue || steps)} steps in the next 30 days.`,
          confidence: stepsTrendAnalysis.confidence * 100,
          priority: 'low',
          actionable: false,
          category: 'exercise',
          impact: 6,
          timeframe: '30 days',
          relatedMetrics: ['steps'],
        });
      }

      setInsights(generatedInsights);
      showOnce('ai-insights-card-generated', 'success', 'AI insights generated successfully!');
    } catch (error) {
      console.error('Error generating insights:', error);
      showOnce('ai-insights-card-error', 'error', 'Failed to generate AI insights');
    } finally {
      setIsGenerating(false);
    }
    }, [healthData, showOnce]);

  useEffect(() => {
    // Only auto-generate if we don't have insights yet
    if (healthData && insights.length === 0) {
      generateInsights();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [healthData]); // Only depend on healthData, not the function

  const topInsights = useMemo(() => {
    return insights
      .sort((a, b) => {
        const priorityOrder = { high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      })
      .slice(0, compact ? 2 : 3);
  }, [insights, compact]);

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="h-4 w-4 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'achievement':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'prediction':
        return <TrendingUp className="h-4 w-4 text-purple-500" />;
      case 'insight':
        return <Sparkles className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getPriorityColor = (priority: AIInsight['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-red-200 bg-red-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'low':
        return 'border-green-200 bg-green-50';
    }
  };

  if (!healthData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-500">No health data available</p>
        </CardContent>
      </Card>
    );
  }

  const handleCardClick = () => {
    if (insights.length > topInsights.length) {
      setIsOpen(true);
    }
  };

  return (
    <>
      <Card
        className={`relative overflow-hidden ${insights.length > topInsights.length ? 'cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]' : ''}`}
        onClick={insights.length > topInsights.length ? handleCardClick : undefined}
        role={insights.length > topInsights.length ? 'button' : undefined}
        tabIndex={insights.length > topInsights.length ? 0 : undefined}
        onKeyDown={insights.length > topInsights.length ? (e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleCardClick();
          }
        } : undefined}
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 rounded-lg p-2">
                <Brain className="text-primary h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Insights</CardTitle>
                <CardDescription className="text-xs">
                  {insights.length} personalized insights
                </CardDescription>
              </div>
            </div>
            {!compact && (
              <Button
                variant="ghost"
                size="sm"
                onClick={generateInsights}
                disabled={isGenerating}
              >
                <Zap className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {isGenerating && insights.length === 0 ? (
            <div className="flex items-center gap-3 py-4">
              <Brain className="text-primary h-5 w-5 animate-pulse" />
              <div className="flex-1">
                <div className="text-sm font-medium">Analyzing...</div>
                <Progress value={65} className="mt-2 h-1" />
              </div>
            </div>
          ) : topInsights.length > 0 ? (
            <>
              {topInsights.map((insight) => (
                <div
                  key={insight.id}
                  className={`rounded-lg border-l-4 p-3 ${getPriorityColor(insight.priority)}`}
                >
                  <div className="flex items-start gap-2">
                    {getInsightIcon(insight.type)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-semibold">{insight.title}</h4>
                        <Badge
                          variant={
                            insight.priority === 'high'
                              ? 'destructive'
                              : insight.priority === 'medium'
                                ? 'secondary'
                                : 'default'
                          }
                          className="text-xs"
                        >
                          {insight.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-700 line-clamp-2">
                        {insight.content}
                      </p>
                      {insight.actionable && (
                        <div className="mt-2 flex items-center gap-2 text-xs text-gray-600">
                          <CheckCircle className="h-3 w-3" />
                          <span>Actionable</span>
                          {insight.timeframe && (
                            <span>• {insight.timeframe}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {insights.length > topInsights.length && (
                <Dialog open={isOpen} onOpenChange={setIsOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="w-full" size="sm">
                      View All {insights.length} Insights
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5" />
                        AI Health Insights
                      </DialogTitle>
                      <DialogDescription>
                        Comprehensive AI-powered analysis of your health data
                      </DialogDescription>
                    </DialogHeader>
                    <EnhancedAIInsights healthData={healthData} />
                  </DialogContent>
                </Dialog>
              )}
            </>
          ) : (
            <div className="py-4 text-center text-sm text-gray-500">
              No insights available. Generate insights to see recommendations.
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
