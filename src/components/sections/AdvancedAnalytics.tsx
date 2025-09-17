import AIInsights from '@/components/health/AIInsights';
import AIRecommendations from '@/components/health/AIRecommendations';
import { EnhancedGaitAnalyzer } from '@/components/health/EnhancedGaitAnalyzer';
import MLAnalytics from '@/components/health/MLAnalytics';
import { WalkingPatternVisualizer } from '@/components/health/WalkingPatternVisualizerClean';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { predictFallRisk } from '@/lib/ai/features/fallRiskFeatures';
import type { FallRiskFactor, MetricData } from '@/lib/healthDataProcessor';
import type { ProcessedHealthData as UIProcessed } from '@/types';
import {
  Activity,
  BarChart3,
  Brain,
  Footprints,
  ShieldAlert,
} from 'lucide-react';

// Lightweight mock analytics to power the components without external calls
const mkMetric = (
  average: number,
  opts: Partial<MetricData> = {}
): MetricData => ({
  daily: [{ date: new Date().toISOString().split('T')[0], value: average }],
  weekly: [{ date: new Date().toISOString().split('T')[0], value: average }],
  monthly: [{ date: new Date().toISOString().split('T')[0], value: average }],
  average,
  trend: 'stable',
  variability: 12,
  reliability: 90,
  lastValue: average,
  percentileRank: 50,
  ...opts,
});

const mkAnalytics = (overrides: Partial<UIProcessed> = {}): UIProcessed => ({
  lastUpdated: new Date().toISOString(),
  dataQuality: {
    completeness: 95,
    consistency: 92,
    recency: 98,
    overall: 'good',
  },
  metrics: {
    steps: mkMetric(8200),
    heartRate: mkMetric(67),
    walkingSteadiness: mkMetric(59, { trend: 'decreasing', variability: 20 }),
    sleepHours: mkMetric(6.9),
  },
  insights: [],
  fallRiskFactors: [] as FallRiskFactor[],
  healthScore: 83,
  ...overrides,
});

const analyticsNow: UIProcessed = mkAnalytics();
const analyticsYesterday: UIProcessed = mkAnalytics({
  lastUpdated: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  metrics: {
    steps: mkMetric(7800),
    heartRate: mkMetric(69),
    walkingSteadiness: mkMetric(61, { trend: 'stable', variability: 18 }),
    sleepHours: mkMetric(7.1),
  },
  healthScore: 81,
});

export default function AdvancedAnalytics() {
  const fallRisk = predictFallRisk(analyticsNow);
  const riskColorClass = (() => {
    if (fallRisk.riskLevel === 'high') return 'text-red-500';
    if (fallRisk.riskLevel === 'moderate') return 'text-yellow-500';
    return 'text-green-500';
  })();
  return (
    <div className="md:space-y-10 text-foreground space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <BarChart3 className="text-primary h-6 w-6" />
            Advanced Health Analytics
          </h2>
          <p className="text-muted-foreground">
            AI and ML-driven analysis with focus on fall risk and gait metrics.
          </p>
        </div>
      </div>

      {/* AI Insights & Recommendations */}
      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI Insights & Recommendations
          </CardTitle>
          <CardDescription>
            Personalized insights and action plans derived from measured
            patterns.
          </CardDescription>
        </CardHeader>
        <CardContent className="md:grid-cols-2 grid gap-8">
          <div>
            <AIInsights healthData={analyticsNow} />
          </div>
          <div>
            <AIRecommendations healthData={analyticsNow} />
          </div>
        </CardContent>
      </Card>

      {/* AI Decision Engine (Fall Risk) */}
      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5" />
            AI Decision Engine — Fall Risk
          </CardTitle>
          <CardDescription>
            Logistic regression inference using normalized gait and lifestyle
            features.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="md:grid-cols-4 gap-5 md:gap-6 grid grid-cols-1">
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground text-sm">Probability</div>
              <div className="text-2xl font-bold">
                {Math.round(fallRisk.probability * 100)}%
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground text-sm">Risk Level</div>
              <div className={`text-2xl font-bold ${riskColorClass}`}>
                {fallRisk.riskLevel.toUpperCase()}
              </div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground text-sm">Model</div>
              <div className="text-2xl font-bold">{fallRisk.modelVersion}</div>
            </div>
            <div className="rounded-lg border p-4">
              <div className="text-muted-foreground text-sm">Score (logit)</div>
              <div className="text-2xl font-bold">
                {fallRisk.score.toFixed(2)}
              </div>
            </div>
          </div>

          <div className="mt-7 md:mt-8">
            <div className="mb-2 text-sm font-medium">
              Top contributing factors
            </div>
            <div className="gap-2.5 md:gap-3 flex flex-wrap">
              {fallRisk.contributions.slice(0, 6).map((c) => (
                <span
                  key={c.feature}
                  className={`px-3 text-xs rounded-full py-1 ${c.contribution >= 0 ? 'bg-red-50 text-red-700 border-red-200 border' : 'bg-green-50 text-green-700 border-green-200 border'}`}
                  title={`weight ${c.weight.toFixed(3)} × value ${c.value.toFixed(2)} = ${c.contribution.toFixed(3)}`}
                >
                  {c.feature.replace(/_/g, ' ')}:{' '}
                  {c.contribution >= 0 ? '+' : ''}
                  {c.contribution.toFixed(3)}
                </span>
              ))}
            </div>
          </div>

          <div className="gap-3.5 md:gap-4 md:grid-cols-5 mt-7 md:mt-8 grid grid-cols-1">
            {Object.entries(fallRisk.inputs).map(([k, v]) => (
              <div key={k} className="p-3 text-xs rounded-md border">
                <div className="text-muted-foreground">
                  {k.replace(/_/g, ' ')}
                </div>
                <div className="font-mono">{v.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* ML Analytics */}
      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Machine Learning Predictions & Anomalies
          </CardTitle>
          <CardDescription>
            Predictive fall risk modeling, health score forecasting, and anomaly
            detection.
          </CardDescription>
        </CardHeader>
        <CardContent className="md:space-y-6 space-y-4">
          <MLAnalytics
            userId="demo-user"
            healthData={[analyticsYesterday, analyticsNow]}
          />
        </CardContent>
      </Card>

      {/* Gait & Walking Visualizers */}
      <div className="md:grid-cols-2 gap-7 md:gap-8 grid">
        <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Enhanced Gait Analyzer
            </CardTitle>
            <CardDescription>
              Uses real device sensors when available; otherwise previews.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <EnhancedGaitAnalyzer />
          </CardContent>
        </Card>

        <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Footprints className="h-5 w-5" />
              Walking Pattern Visualizer
            </CardTitle>
            <CardDescription>
              Real-time stride, cadence, and steadiness visualization.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WalkingPatternVisualizer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
