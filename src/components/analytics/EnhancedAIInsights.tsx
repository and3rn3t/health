/**
 * Enhanced AI Insights Component
 * Full-featured AI insights with advanced analysis
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
import { Textarea } from '@/components/ui/textarea';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Lightbulb,
  Sparkles,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { useOnceToast } from '@/hooks/useOnceToast';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { calculateTrend, extractTimeSeries } from '@/lib/analytics';
import type { AIInsight } from './AIInsightsCard';

interface EnhancedAIInsightsProps {
  healthData: ProcessedHealthData | null;
}

export default function EnhancedAIInsights({
  healthData,
}: EnhancedAIInsightsProps) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customQuery, setCustomQuery] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const { showOnce } = useOnceToast();

  const generateInsights = useCallback(async () => {
    if (!healthData) return;

    setIsGenerating(true);

    try {
      // Enhanced AI analysis
      const generatedInsights: AIInsight[] = [];

      // Comprehensive analysis of all metrics
      const steadiness = healthData.metrics?.walkingSteadiness?.average || 0;
      const steadinessTrend = healthData.metrics?.walkingSteadiness?.trend;
      const steadinessData = extractTimeSeries(healthData.metrics?.walkingSteadiness, '30d');
      const steadinessTrendAnalysis = steadinessData.length > 0 ? calculateTrend(steadinessData) : null;

      if (steadiness < 60 || steadinessTrend === 'decreasing') {
        generatedInsights.push({
          id: 'insight-steadiness',
          type: 'warning',
          title: 'Balance Improvement Needed',
          content: `Your walking steadiness is at ${Math.round(steadiness)}%. ${steadinessTrendAnalysis?.direction === 'declining' ? 'This has been declining recently, which may indicate increased fall risk.' : 'Consider daily balance exercises like tai chi, yoga, or specific balance training to improve stability and reduce fall risk.'}`,
          confidence: 85,
          priority: steadiness < 50 ? 'high' : 'medium',
          actionable: true,
          category: 'fall-prevention',
          impact: 8,
          timeframe: '2-4 weeks',
          relatedMetrics: ['walkingSteadiness'],
        });
      }

      const steps = healthData.metrics?.steps?.average || 0;
      const stepsTrend = healthData.metrics?.steps?.trend;
      const stepsData = extractTimeSeries(healthData.metrics?.steps, '30d');
      const stepsTrendAnalysis = stepsData.length > 0 ? calculateTrend(stepsData) : null;

      if (steps > 8000 && stepsTrend === 'increasing') {
        generatedInsights.push({
          id: 'insight-activity',
          type: 'achievement',
          title: 'Excellent Activity Progress',
          content: `Great job maintaining ${Math.round(steps).toLocaleString()} steps daily! Your activity is ${stepsTrendAnalysis?.direction === 'improving' ? 'improving' : 'stable'} and above recommended levels. This supports cardiovascular health and reduces fall risk.`,
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
          content: `Your average of ${Math.round(steps).toLocaleString()} steps is below recommended levels. Aim for 7,000-10,000 steps daily to improve cardiovascular health, maintain muscle strength, and reduce fall risk. Start with small increases of 500-1000 steps per day.`,
          confidence: 90,
          priority: 'medium',
          actionable: true,
          category: 'exercise',
          impact: 9,
          timeframe: '4-6 weeks',
          relatedMetrics: ['steps'],
        });
      }

      const sleep = healthData.metrics?.sleepHours?.average || 0;
      if (sleep < 7) {
        generatedInsights.push({
          id: 'insight-sleep',
          type: 'warning',
          title: 'Sleep Duration Concern',
          content: `Your average sleep of ${sleep.toFixed(1)} hours is below the recommended 7-9 hours. Poor sleep can increase fall risk, affect balance, impact cognitive function, and weaken the immune system. Consider establishing a consistent sleep schedule and creating a relaxing bedtime routine.`,
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
          content: `Your average sleep of ${sleep.toFixed(1)} hours is within the recommended range. Good sleep supports balance, recovery, cognitive function, and overall health. Continue maintaining this healthy pattern.`,
          confidence: 95,
          priority: 'low',
          actionable: false,
          category: 'sleep',
          impact: 6,
          relatedMetrics: ['sleepHours'],
        });
      }

      const heartRate = healthData.metrics?.heartRate?.average || 0;
      const heartRateVariability = healthData.metrics?.heartRate?.variability || 0;
      if (heartRate > 0 && heartRateVariability < 10) {
        generatedInsights.push({
          id: 'insight-heart',
          type: 'insight',
          title: 'Cardiovascular Health',
          content: `Your heart rate variability suggests ${heartRateVariability < 5 ? 'excellent' : 'good'} cardiovascular fitness. Continue current activity levels to maintain this. Regular exercise helps maintain heart health and reduces cardiovascular disease risk.`,
          confidence: 85,
          priority: 'low',
          actionable: false,
          category: 'cardiovascular',
          impact: 5,
          relatedMetrics: ['heartRate'],
        });
      }

      const healthScore = healthData.healthScore || 0;
      if (healthScore > 80) {
        generatedInsights.push({
          id: 'insight-health-score',
          type: 'achievement',
          title: 'Excellent Health Score',
          content: `Your health score of ${healthScore}/100 indicates excellent overall health management. Keep up the great work! Continue maintaining your current healthy habits.`,
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
          content: `Your health score of ${healthScore}/100 suggests areas for improvement. Focus on the recommendations above to enhance your overall health. Consider consulting with healthcare providers for personalized guidance.`,
          confidence: 85,
          priority: 'high',
          actionable: true,
          category: 'overall',
          impact: 10,
          timeframe: '4-8 weeks',
        });
      }

      if (healthData.fallRiskFactors && healthData.fallRiskFactors.length > 0) {
        generatedInsights.push({
          id: 'insight-fall-risk',
          type: 'prediction',
          title: 'Fall Risk Assessment',
          content: `Based on current metrics, ${healthData.fallRiskFactors.length} risk factor(s) identified. With proper interventions including balance exercises, strength training, and environmental modifications, risk can be reduced by 30-50% over the next 60 days.`,
          confidence: 75,
          priority: 'high',
          actionable: true,
          category: 'fall-prevention',
          impact: 9,
          timeframe: '60 days',
          relatedMetrics: ['walkingSteadiness', 'steps'],
        });
      }

      if (stepsTrendAnalysis && stepsTrendAnalysis.direction === 'improving') {
        generatedInsights.push({
          id: 'insight-trend-improving',
          type: 'prediction',
          title: 'Positive Activity Trend',
          content: `Your activity levels are improving. If this trend continues, you could reach ${Math.round(stepsTrendAnalysis.prediction?.nextValue || steps)} steps in the next 30 days. This positive trend supports overall health and fall prevention.`,
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
      showOnce('enhanced-ai-insights-generated', 'success', 'AI insights generated successfully!');
    } catch (error) {
      console.error('Error generating insights:', error);
      showOnce('enhanced-ai-insights-error', 'error', 'Failed to generate AI insights');
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

  const handleCustomQuery = async () => {
    if (!customQuery.trim()) return;

    setIsGenerating(true);
    try {
      // Enhanced local response based on health data
      const answer = `Based on your health data analysis:

Health Score: ${healthData?.healthScore ?? 0}/100
Steps: ${Math.round(healthData?.metrics?.steps?.average ?? 0).toLocaleString()}/day
Walking Steadiness: ${Math.round(healthData?.metrics?.walkingSteadiness?.average ?? 0)}%
Sleep: ${(healthData?.metrics?.sleepHours?.average ?? 0).toFixed(1)} hours/night

Regarding your question: "${customQuery}"

Here are personalized recommendations:
• Maintain daily steps at 7,000-10,000 for optimal health
• Add 10-15 minutes of balance exercises daily to improve steadiness
• Target 7-9 hours of sleep for better recovery and balance
• Consider strength training 2-3 times per week
• Stay hydrated and maintain a balanced diet

This guidance is informational and not medical advice. Consult healthcare providers for personalized medical recommendations.`;
      setCustomResponse(answer);
      showOnce('enhanced-ai-custom-query-success', 'success', 'Got your personalized answer!');
    } catch (_error) {
      showOnce('enhanced-ai-custom-query-error', 'error', 'Failed to get response');
    } finally {
      setIsGenerating(false);
    }
  };

  const getInsightIcon = (type: AIInsight['type']) => {
    switch (type) {
      case 'recommendation':
        return <Lightbulb className="h-5 w-5 text-blue-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-red-500" />;
      case 'achievement':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'prediction':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'insight':
        return <Sparkles className="h-5 w-5 text-yellow-500" />;
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

  const insightsByCategory = useMemo(() => {
    const categories: Record<string, AIInsight[]> = {};
    insights.forEach((insight) => {
      const category = insight.category || 'other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(insight);
    });
    return categories;
  }, [insights]);

  if (!healthData) {
    return (
      <div className="py-8 text-center text-gray-500">
        No health data available for AI analysis
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold">
            <Brain className="text-primary h-6 w-6" />
            AI Health Insights
          </h2>
          <p className="text-muted-foreground">
            Personalized analysis and recommendations based on your health data
          </p>
        </div>
        <Button
          onClick={generateInsights}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {isGenerating ? 'Analyzing...' : 'Refresh Insights'}
        </Button>
      </div>

      {/* Insights Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All ({insights.length})</TabsTrigger>
          <TabsTrigger value="high">High Priority ({insights.filter((i) => i.priority === 'high').length})</TabsTrigger>
          <TabsTrigger value="actionable">Actionable ({insights.filter((i) => i.actionable).length})</TabsTrigger>
          <TabsTrigger value="achievements">Achievements ({insights.filter((i) => i.type === 'achievement').length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {isGenerating && insights.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-3">
                  <Brain className="text-primary h-5 w-5 animate-pulse" />
                  <div className="flex-1">
                    <div className="font-medium">Analyzing your health data...</div>
                    <Progress value={65} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            insights.map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${getPriorityColor(insight.priority)}`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      {getInsightIcon(insight.type)}
                      {insight.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          insight.priority === 'high'
                            ? 'destructive'
                            : insight.priority === 'medium'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {insight.priority}
                      </Badge>
                      <Badge variant="outline">
                        {insight.confidence}% confident
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed mb-3">{insight.content}</p>
                  <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600">
                    {insight.actionable && (
                      <div className="flex items-center gap-1">
                        <CheckCircle className="h-3 w-3" />
                        <span>Actionable</span>
                      </div>
                    )}
                    {insight.timeframe && (
                      <div>Timeframe: {insight.timeframe}</div>
                    )}
                    {insight.impact && (
                      <div>Impact: {insight.impact}/10</div>
                    )}
                    {insight.category && (
                      <Badge variant="outline" className="text-xs">
                        {insight.category}
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="high" className="space-y-4">
          {insights
            .filter((i) => i.priority === 'high')
            .map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${getPriorityColor(insight.priority)}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{insight.content}</p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="actionable" className="space-y-4">
          {insights
            .filter((i) => i.actionable)
            .map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${getPriorityColor(insight.priority)}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{insight.content}</p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {insights
            .filter((i) => i.type === 'achievement')
            .map((insight) => (
              <Card
                key={insight.id}
                className={`border-l-4 ${getPriorityColor(insight.priority)}`}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {getInsightIcon(insight.type)}
                    {insight.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed">{insight.content}</p>
                </CardContent>
              </Card>
            ))}
        </TabsContent>
      </Tabs>

      {/* Custom Query Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Ask About Your Health
          </CardTitle>
          <CardDescription>
            Get personalized answers about your health data and recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="Ask me anything about your health data... (e.g., 'Why is my walking steadiness decreasing?' or 'What exercises would help my balance?')"
            value={customQuery}
            onChange={(e) => setCustomQuery(e.target.value)}
            rows={3}
          />
          <Button
            onClick={handleCustomQuery}
            disabled={isGenerating || !customQuery.trim()}
            className="w-full"
          >
            {isGenerating ? 'Thinking...' : 'Get AI Answer'}
          </Button>

          {customResponse && (
            <div className="bg-muted/30 mt-4 rounded-lg p-4">
              <div className="mb-2 flex items-center gap-2">
                <Brain className="text-primary h-4 w-4" />
                <span className="text-sm font-medium">AI Response:</span>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line">{customResponse}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Insight Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center md:grid-cols-4">
            <div>
              <div className="text-2xl font-bold text-red-500">
                {insights.filter((i) => i.priority === 'high').length}
              </div>
              <div className="text-muted-foreground text-sm">High Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-500">
                {insights.filter((i) => i.priority === 'medium').length}
              </div>
              <div className="text-muted-foreground text-sm">Medium Priority</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">
                {insights.filter((i) => i.type === 'achievement').length}
              </div>
              <div className="text-muted-foreground text-sm">Achievements</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-500">
                {insights.filter((i) => i.actionable).length}
              </div>
              <div className="text-muted-foreground text-sm">Actionable Items</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
