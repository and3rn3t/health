/**
 * Enhanced Analytics Dashboard
 * Comprehensive health analytics with visualizations, trends, and insights
 */

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart3,
  Download,
  Filter,
  TrendingUp,
  Activity,
  AlertTriangle,
  Target,
  Calendar,
} from 'lucide-react';
import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { TimeRange } from '@/lib/analytics';
import { extractTimeSeries, generateAnalyticsSummary } from '@/lib/analytics';
import TimeSeriesChart from './TimeSeriesChart';
import CorrelationMatrix from './CorrelationMatrix';
import AnomalyDetectionPanel from './AnomalyDetectionPanel';
import PatternDetectionPanel from './PatternDetectionPanel';
import PredictiveAnalytics from './PredictiveAnalytics';
import MetricComparisonCard from './MetricComparisonCard';
import AnalyticsExporter from './AnalyticsExporter';
import AIInsightsCard from './AIInsightsCard';

interface EnhancedAnalyticsDashboardProps {
  healthData: ProcessedHealthData | null;
  historicalData?: ProcessedHealthData[];
}

export default function EnhancedAnalyticsDashboard({
  healthData,
  historicalData = [],
}: EnhancedAnalyticsDashboardProps) {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [selectedMetric, setSelectedMetric] = useState<string>('steps');

  // Statistics - must be before early return to satisfy React Hooks rules
  const analyticsSummary = useMemo(() => {
    if (!healthData) {
      return {
        timeRange,
        totalDataPoints: 0,
        metricsAnalyzed: [],
        overallHealthScore: 0,
        healthScoreTrend: 'stable' as const,
        keyInsights: [],
        anomalies: 0,
        correlations: [],
        patterns: [],
      };
    }
    const allData = historicalData.length > 0 ? [...historicalData, healthData] : [healthData];
    return generateAnalyticsSummary(allData, timeRange);
  }, [healthData, historicalData, timeRange]);

  // Early return check - must be after all hooks
  if (!healthData) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="text-center">
          <BarChart3 className="text-gray-400 mx-auto mb-4 h-16 w-16" />
          <h2 className="text-2xl font-bold mb-2">No Health Data</h2>
          <p className="text-gray-600">
            Import your Apple Health data to view comprehensive analytics
          </p>
        </div>
      </div>
    );
  }


  const metrics = [
    { value: 'steps', label: 'Steps' },
    { value: 'heartRate', label: 'Heart Rate' },
    { value: 'walkingSteadiness', label: 'Walking Steadiness' },
    { value: 'sleepHours', label: 'Sleep Hours' },
  ];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <BarChart3 className="h-8 w-8" />
            Health Analytics
          </h1>
          <p className="text-gray-600 mt-1">
            Comprehensive analysis of your health data patterns and trends
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={(value) => setTimeRange(value as TimeRange)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
              <SelectItem value="90d">90 Days</SelectItem>
              <SelectItem value="1y">1 Year</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <AnalyticsExporter
            healthData={healthData}
            analyticsSummary={analyticsSummary}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Data Points</div>
            <div className="text-2xl font-bold">{analyticsSummary.totalDataPoints}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Health Score</div>
            <div className="text-2xl font-bold">{analyticsSummary.overallHealthScore.toFixed(1)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Metrics Analyzed</div>
            <div className="text-2xl font-bold">{analyticsSummary.metricsAnalyzed.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-500 mb-1">Anomalies</div>
            <div className="text-2xl font-bold">{analyticsSummary.anomalies}</div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights Card */}
      <AIInsightsCard healthData={healthData} compact={false} />

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <MetricComparisonCard
                key={metric.value}
                healthData={healthData}
                metric={metric.value as any}
                period={timeRange === '7d' ? '7d' : timeRange === '30d' ? '30d' : '90d'}
              />
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TimeSeriesChart
              title="Steps Over Time"
              data={extractTimeSeries(healthData.metrics.steps, timeRange)}
              unit="steps"
              color="#3b82f6"
              showTrend={true}
            />
            <TimeSeriesChart
              title="Heart Rate Over Time"
              data={extractTimeSeries(healthData.metrics.heartRate, timeRange)}
              unit="bpm"
              color="#ef4444"
              showTrend={true}
            />
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <TimeSeriesChart
              title="Steps Trend"
              data={extractTimeSeries(healthData.metrics.steps, timeRange)}
              unit="steps"
              color="#3b82f6"
              showTrend={true}
              showPrediction={true}
            />
            <TimeSeriesChart
              title="Heart Rate Trend"
              data={extractTimeSeries(healthData.metrics.heartRate, timeRange)}
              unit="bpm"
              color="#ef4444"
              showTrend={true}
              showPrediction={true}
            />
            <TimeSeriesChart
              title="Walking Steadiness Trend"
              data={extractTimeSeries(healthData.metrics.walkingSteadiness, timeRange)}
              unit="%"
              color="#10b981"
              showTrend={true}
              showPrediction={true}
            />
            <TimeSeriesChart
              title="Sleep Hours Trend"
              data={extractTimeSeries(healthData.metrics.sleepHours, timeRange)}
              unit="hours"
              color="#8b5cf6"
              showTrend={true}
              showPrediction={true}
            />
          </div>
        </TabsContent>

        {/* Correlations Tab */}
        <TabsContent value="correlations">
          <CorrelationMatrix healthData={healthData} />
        </TabsContent>

        {/* Anomalies Tab */}
        <TabsContent value="anomalies" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <AnomalyDetectionPanel
              healthData={healthData}
              metric="steps"
            />
            <AnomalyDetectionPanel
              healthData={healthData}
              metric="heartRate"
            />
            <AnomalyDetectionPanel
              healthData={healthData}
              metric="walkingSteadiness"
            />
            <AnomalyDetectionPanel
              healthData={healthData}
              metric="sleepHours"
            />
          </div>
        </TabsContent>

        {/* Patterns Tab */}
        <TabsContent value="patterns" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <PatternDetectionPanel
              healthData={healthData}
              metric="steps"
            />
            <PatternDetectionPanel
              healthData={healthData}
              metric="heartRate"
            />
            <PatternDetectionPanel
              healthData={healthData}
              metric="walkingSteadiness"
            />
            <PatternDetectionPanel
              healthData={healthData}
              metric="sleepHours"
            />
          </div>
        </TabsContent>

        {/* Predictions Tab */}
        <TabsContent value="predictions">
          <PredictiveAnalytics healthData={healthData} forecastDays={30} />
        </TabsContent>

        {/* AI Insights Tab */}
        <TabsContent value="ai-insights">
          <EnhancedAIInsights healthData={healthData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
