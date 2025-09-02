import RecentHealthData from '@/components/health/RecentHealthData';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  VitalSenseBrandHeader,
  VitalSenseStatusCard,
} from '@/components/ui/vitalsense-components';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { HealthColorMap, getVitalSenseClasses } from '@/lib/vitalsense-colors';
import {
  Activity,
  Brain,
  Heart,
  Minus,
  Moon,
  Shield,
  TrendingDown,
  TrendingUp,
} from '@phosphor-icons/react';

interface HealthDashboardProps {
  healthData: ProcessedHealthData | null;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  trend: 'increasing' | 'decreasing' | 'stable';
  icon: React.ReactNode;
  description?: string;
  progress?: number;
  className?: string;
}

function MetricCard({
  title,
  value,
  unit,
  trend,
  icon,
  description,
  progress,
  className,
}: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return (
          <TrendingUp
            className={`h-4 w-4 ${getVitalSenseClasses.text.success}`}
          />
        );
      case 'decreasing':
        return (
          <TrendingDown
            className={`h-4 w-4 ${getVitalSenseClasses.text.error}`}
          />
        );
      default:
        return (
          <Minus className={`h-4 w-4 ${getVitalSenseClasses.text.mutedText}`} />
        );
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case 'increasing':
        return getVitalSenseClasses.text.success;
      case 'decreasing':
        return getVitalSenseClasses.text.error;
      default:
        return getVitalSenseClasses.text.mutedText;
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          {icon}
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">{getTrendIcon()}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && (
            <span className="text-muted-foreground ml-1 text-sm font-normal">
              {unit}
            </span>
          )}
        </div>
        {description && (
          <p className={`text-xs ${getTrendColor()} mt-1`}>{description}</p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
}

export default function HealthDashboard({ healthData }: HealthDashboardProps) {
  const { trackAction } = useUsageTracking('dashboard');

  if (!healthData || !healthData.metrics) {
    return (
      <div className="py-8 text-center">
        <p className="text-muted-foreground">No health data available</p>
      </div>
    );
  }

  const { metrics, insights, dataQuality, healthScore, fallRiskFactors } =
    healthData;

  const getDataQualityColor = () => {
    const quality = dataQuality?.overall || 'poor';
    return (
      HealthColorMap.dataQuality[
        quality as keyof typeof HealthColorMap.dataQuality
      ] || getVitalSenseClasses.text.error
    );
  };

  const getHealthScoreColor = () => {
    const score = healthScore || 0;
    if (score >= 80) return getVitalSenseClasses.text.success;
    if (score >= 60) return getVitalSenseClasses.text.warning;
    return getVitalSenseClasses.text.error;
  };

  return (
    <div className="space-y-6">
      {/* VitalSense Branded Header */}
      <VitalSenseBrandHeader
        title="Health Dashboard"
        subtitle="Real-time insights from your Apple Health data"
        icon={<Heart className="h-6 w-6" />}
        variant="primary"
      >
        <Badge
          variant="outline"
          className={`${getVitalSenseClasses.border.success} ${getVitalSenseClasses.text.success}`}
        >
          Live Data
        </Badge>
      </VitalSenseBrandHeader>

      {/* Key Health Metrics using VitalSense Status Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <VitalSenseStatusCard
          type="health"
          status={
            healthScore >= 80
              ? 'excellent'
              : healthScore >= 60
                ? 'good'
                : healthScore >= 40
                  ? 'fair'
                  : 'poor'
          }
          title="Health Score"
          value={healthScore || 0}
          subtitle={`Based on ${Object.keys(metrics).length} metrics`}
        />

        <VitalSenseStatusCard
          type="system"
          status={
            (dataQuality?.overall as 'excellent' | 'good' | 'fair' | 'poor') ||
            'poor'
          }
          title="Data Quality"
          value={dataQuality?.overall || 'Unknown'}
          subtitle={`${dataQuality?.completeness || 0}% complete data`}
        />

        <VitalSenseStatusCard
          type="fallRisk"
          status={
            fallRiskFactors?.some((f) => f.risk === 'high')
              ? 'high'
              : fallRiskFactors?.some((f) => f.risk === 'moderate')
                ? 'moderate'
                : 'low'
          }
          title="Fall Risk"
          value={fallRiskFactors?.length || 0}
          subtitle="Risk factors identified"
        />

        <VitalSenseStatusCard
          type="activity"
          status="moderate"
          title="Activity Level"
          value={metrics.steps?.value || 0}
          subtitle="Steps today"
        />
      </div>

      {/* Detailed Health Metrics */}
      <div className="space-y-4">
        <h3
          className={`text-lg font-semibold ${getVitalSenseClasses.text.primary}`}
        >
          Detailed Metrics
        </h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <MetricCard
            title="Daily Steps"
            value={metrics.steps?.average?.toLocaleString() || 'N/A'}
            unit="avg"
            trend={metrics.steps?.trend || 'stable'}
            icon={<Activity className="h-4 w-4" />}
            description={`${metrics.steps?.percentileRank || 0}th percentile`}
            progress={Math.min(
              ((metrics.steps?.average || 0) / 10000) * 100,
              100
            )}
          />

          <MetricCard
            title="Resting Heart Rate"
            value={Math.round(metrics.heartRate?.average || 0)}
            unit="bpm"
            trend={metrics.heartRate?.trend || 'stable'}
            icon={<Heart className="h-4 w-4" />}
            description={`Reliability: ${metrics.heartRate?.reliability || 0}%`}
          />

          <MetricCard
            title="Walking Steadiness"
            value={Math.round(metrics.walkingSteadiness?.average || 0)}
            unit="%"
            trend={metrics.walkingSteadiness?.trend || 'stable'}
            icon={<Activity className="h-4 w-4" />}
            description={`Variability: ${metrics.walkingSteadiness?.variability?.toFixed(1) || '0.0'}%`}
            progress={metrics.walkingSteadiness?.average || 0}
            className={
              (metrics.walkingSteadiness?.average || 100) < 60
                ? 'border-destructive/20'
                : ''
            }
          />

          <MetricCard
            title="Sleep"
            value={metrics.sleepHours?.average?.toFixed(1) || 'N/A'}
            unit="hrs"
            trend={metrics.sleepHours?.trend || 'stable'}
            icon={<Moon className="h-4 w-4" />}
            description="Average nightly"
            progress={Math.min(
              ((metrics.sleepHours?.average || 0) / 9) * 100,
              100
            )}
          />
        </div>

        {/* Enhanced Insights Section */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                AI Health Insights
              </CardTitle>
              <CardDescription>
                Analysis based on your health data patterns and trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {insights?.map((insight: string, index: number) => (
                  <div
                    key={index}
                    className="bg-muted/30 flex items-start gap-3 rounded-lg p-3"
                  >
                    <div className="bg-primary mt-2 h-2 w-2 flex-shrink-0 rounded-full" />
                    <p className="text-sm">{insight}</p>
                  </div>
                )) || (
                  <p className="text-muted-foreground">
                    No insights available yet.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Fall Risk Factors
              </CardTitle>
              <CardDescription>
                Identified risk factors and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {fallRiskFactors?.map((factor, index) => (
                  <div key={index} className="space-y-2 rounded-lg border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {factor.factor}
                      </span>
                      <Badge
                        variant={
                          factor.risk === 'high'
                            ? 'destructive'
                            : factor.risk === 'moderate'
                              ? 'secondary'
                              : 'default'
                        }
                      >
                        {factor.risk} risk
                      </Badge>
                    </div>
                    <p className="text-muted-foreground text-xs">
                      {factor.recommendation}
                    </p>
                  </div>
                )) || (
                  <p className="text-muted-foreground">
                    No significant risk factors identified.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Activity Trends Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends</CardTitle>
            <CardDescription>
              Last 14 days step count progression
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.steps?.daily?.slice(-14)?.map((day, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-muted-foreground w-16 text-sm">
                    {new Date(day.date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                  <div className="mx-4 flex flex-1 items-center gap-3">
                    <Progress
                      value={Math.min((day.value / 10000) * 100, 100)}
                      className="h-2 flex-1"
                    />
                    <span className="w-20 text-right text-sm font-medium">
                      {day.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              )) || (
                <p className="text-muted-foreground py-4 text-center">
                  No activity data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent processed entries */}
      <RecentHealthData />
    </div>
  );
}
