import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import type {
  AnalyticsHealthData,
  FallRiskFactor,
  MetricData,
} from '@/lib/healthDataProcessor';
import {
  Activity,
  Brain,
  FlaskConical,
  Network,
  Sparkles,
  Wrench,
} from 'lucide-react';

// Health feature modules (some are named exports)
import AIInsights from '@/components/health/AIInsights';
import AIRecommendations from '@/components/health/AIRecommendations';
import { EnhancedGaitAnalyzer } from '@/components/health/EnhancedGaitAnalyzer';
import MLAnalytics from '@/components/health/MLAnalytics';
import { WalkingPatternVisualizer } from '@/components/health/WalkingPatternVisualizerClean';
import { WSTokenSettings } from '@/components/health/WSTokenSettings';

// Minimal mock analytics objects for demos (kept lightweight; not persisted)
const mkMetric = (
  average: number,
  opts: Partial<MetricData> = {}
): MetricData => ({
  daily: [{ date: new Date().toISOString().split('T')[0], value: average }],
  weekly: [{ date: new Date().toISOString().split('T')[0], value: average }],
  monthly: [{ date: new Date().toISOString().split('T')[0], value: average }],
  average,
  trend: 'stable',
  variability: 10,
  reliability: 90,
  lastValue: average,
  percentileRank: 50,
  ...opts,
});

const mkAnalytics = (
  overrides: Partial<AnalyticsHealthData> = {}
): AnalyticsHealthData => ({
  lastUpdated: new Date().toISOString(),
  dataQuality: {
    completeness: 95,
    consistency: 92,
    recency: 98,
    overall: 'good',
  },
  metrics: {
    steps: mkMetric(7900),
    heartRate: mkMetric(68),
    walkingSteadiness: mkMetric(58, { trend: 'decreasing', variability: 22 }),
    sleepHours: mkMetric(6.8),
  },
  insights: [],
  fallRiskFactors: [] as FallRiskFactor[],
  healthScore: 82,
  ...overrides,
});

const analyticsNow = mkAnalytics();
const analyticsYesterday = mkAnalytics({
  lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  metrics: {
    steps: mkMetric(7600),
    heartRate: mkMetric(69),
    walkingSteadiness: mkMetric(60, { trend: 'stable', variability: 18 }),
    sleepHours: mkMetric(7),
  },
  healthScore: 80,
});

export default function ShowcaseLabs() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <FlaskConical className="h-6 w-6 text-primary" />
            Labs & Showcase
          </h2>
          <p className="text-muted-foreground">
            Explore advanced VitalSense components that are built and ready to
            preview.
          </p>
        </div>
        <Badge variant="secondary">Developer Preview</Badge>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <AlertDescription className="text-sm">
          These modules showcase capabilities and UI patterns. Some use
          simulated data or device features and may require permissions when
          available.
        </AlertDescription>
      </Alert>

      {/* AI Insights & Recommendations */}
      <Card className="ios-26-surface-elevated border-white/10 text-foreground backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Brain className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Personalized analysis and action plans derived from your health
            patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div>
            <AIInsights healthData={analyticsNow} />
          </div>
          <div>
            <AIRecommendations healthData={analyticsNow} />
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ML Analytics */}
      <Card className="ios-26-surface-elevated border-white/10 text-foreground backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Sparkles className="h-5 w-5" />
            ML Analytics (Predictions & Anomalies)
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Mocked predictive analytics and anomaly detection visualizations.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-foreground">
          <MLAnalytics
            userId="demo-user"
            healthData={[analyticsYesterday, analyticsNow]}
          />
        </CardContent>
      </Card>

      {/* Gait & Walking Visualizers */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="ios-26-surface-elevated border-white/10 text-foreground backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5" />
              Enhanced Gait Analyzer
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Starts real device sensor analysis when supported; otherwise
              previews UI flow.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-foreground">
            <EnhancedGaitAnalyzer />
          </CardContent>
        </Card>

        <Card className="ios-26-surface-elevated border-white/10 text-foreground backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Activity className="h-5 w-5" />
              Walking Pattern Visualizer
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              Simulated live gait metrics with session history.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-foreground">
            <WalkingPatternVisualizer />
          </CardContent>
        </Card>
      </div>

      {/* WebSocket Tools */}
      <Card className="ios-26-surface-elevated border-white/10 text-foreground backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Network className="h-5 w-5" />
            WebSocket Tools & Architecture
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            Token configuration and a detailed end-to-end WebSocket architecture
            guide.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 text-foreground">
          <div className="rounded border p-3 text-foreground">
            <div className="mb-2 text-sm font-medium text-foreground">
              Device Token & Connection
            </div>
            <WSTokenSettings />
          </div>
          <div className="rounded border p-3 text-foreground">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-foreground">
              <Wrench className="h-4 w-4" />
              Architecture Guide
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
