/**
 * VitalSense Landing Page
 * Welcome experience and quick access to key features
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { IOS26Button } from '@/components/ui/ios26-button-system';
import { EnhancedVitalSenseStatusCard } from '@/components/ui/ios26-enhanced-components';
import { Progress } from '@/components/ui/progress';
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Heart,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

// Simple inline sparkline component (SVG path) moved out for lint clarity
const Sparkline = ({
  values,
  className,
  strokeClass = 'stroke-vitalsense-teal',
  width = 120,
  height = 28,
  title,
}: Readonly<{
  values: number[];
  className?: string;
  strokeClass?: string;
  width?: number;
  height?: number;
  title?: string;
}>) => {
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1; // avoid div by zero
  const stepX = width / (values.length - 1 || 1);
  const points = values.map((v, i) => {
    const x = i * stepX;
    const y = height - ((v - min) / range) * height;
    return `${x},${y}`;
  });
  return (
    <svg
      className={className}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      aria-hidden
    >
      {title ? <title>{title}</title> : null}
      <polyline
        fill="none"
        vectorEffect="non-scaling-stroke"
        strokeWidth={2}
        className={strokeClass}
        points={points.join(' ')}
      />
    </svg>
  );
};

interface LandingPageProps {
  readonly healthData: ProcessedHealthData | null;
  readonly onNavigateToFeature: (featureId: string) => void;
  readonly fallRiskScore: number;
  readonly onRefreshData?: () => Promise<void> | void;
}

interface QuickStat {
  label: string;
  value: string;
  icon: React.ElementType;
  color: string;
  trend?: string;
  action?: string;
  delta?: number;
}

interface FeatureCard {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  status: 'active' | 'available' | 'setup';
  priority: 'high' | 'medium' | 'low';
}

export default function LandingPage({
  healthData,
  onNavigateToFeature,
  fallRiskScore,
  onRefreshData,
}: LandingPageProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [healthScore, setHealthScore] = useState(0);
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '90d'>(
    '7d'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (healthData) {
      setHealthScore(healthData.healthScore || 0);
    }
  }, [healthData]);

  const lastUpdatedLabel = useMemo(() => {
    if (!healthData?.lastUpdated) return '';
    const d = new Date(healthData.lastUpdated);
    return d.toLocaleString();
  }, [healthData?.lastUpdated]);

  // Compute a fallback fall risk score when a value isn't provided
  const computedFallRisk = useMemo(() => {
    if (fallRiskScore && fallRiskScore > 0) return fallRiskScore;
    if (!healthData) return 0;
    const ws = healthData.metrics.walkingSteadiness?.average ?? 100;
    // Map walking steadiness (100% -> 0 risk, 0% -> 4.0 risk)
    const score = ((100 - ws) / 25) * 1.0; // 0..4
    return Math.max(0, Math.min(4, Math.round(score * 10) / 10));
  }, [fallRiskScore, healthData]);

  // Helpers for timeframe-sliced stats
  const getSliceValues = (values: number[], n: number) =>
    values.slice(Math.max(0, values.length - n));

  const getTimeframeCount = (tf: typeof timeframe) => {
    switch (tf) {
      case 'today':
        return 1;
      case '7d':
        return 7;
      case '30d':
        return 30;
      case '90d':
      default:
        return 90;
    }
  };

  const avg = (arr: number[]) =>
    arr.length
      ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100
      : 0;

  const pct = (curr: number, prev: number | undefined) => {
    if (prev == null || prev === 0) return undefined;
    return Math.round(((curr - prev) / prev) * 100);
  };

  // Sparkline component defined above (moved out of component scope)

  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getQuickStats = (): QuickStat[] => {
    if (!healthData) return [];

    const getHealthScoreTrend = (score: number) => {
      if (score > 75) return 'Excellent';
      if (score > 50) return 'Good';
      return 'Monitor';
    };

    const getFallRiskColor = (score: number) => {
      if (score > 2.5) return 'text-red-500';
      if (score > 1.5) return 'text-yellow-500';
      return 'text-green-500';
    };

    const getFallRiskTrend = (score: number) => {
      if (score > 2.5) return 'High Risk';
      if (score > 1.5) return 'Moderate';
      return 'Low Risk';
    };

    const tfCount = getTimeframeCount(timeframe);
    const stepsVals = healthData.metrics.steps.daily.map((d) => d.value);
    const wsVals = healthData.metrics.walkingSteadiness.daily.map(
      (d) => d.value
    );
    const stepsSlice = getSliceValues(stepsVals, tfCount);
    const wsSlice = getSliceValues(wsVals, tfCount);
    const stepsPrevAvg =
      stepsVals.length >= tfCount * 2
        ? avg(
            stepsVals.slice(
              stepsVals.length - tfCount * 2,
              stepsVals.length - tfCount
            )
          )
        : undefined;
    const wsPrevAvg =
      wsVals.length >= tfCount * 2
        ? avg(
            wsVals.slice(wsVals.length - tfCount * 2, wsVals.length - tfCount)
          )
        : undefined;
    const stepsValue =
      timeframe === 'today'
        ? stepsVals[stepsVals.length - 1] || 0
        : avg(stepsSlice);
    const wsValue =
      timeframe === 'today' ? wsVals[wsVals.length - 1] || 0 : avg(wsSlice);
    const stepsDelta = pct(stepsValue, stepsPrevAvg);
    const wsDelta = pct(wsValue, wsPrevAvg);

    return [
      {
        label: 'Health Score',
        value: `${healthScore}/100`,
        icon: Heart,
        color: 'text-red-500',
        trend: getHealthScoreTrend(healthScore),
        action: 'insights',
      },
      {
        label: 'Fall Risk',
        value:
          (computedFallRisk > 0 ? `${computedFallRisk.toFixed(1)}` : 'Low') +
          '/4.0',
        icon: Shield,
        color: getFallRiskColor(computedFallRisk),
        trend: getFallRiskTrend(computedFallRisk),
        action: 'fall-risk',
      },
      {
        label: timeframe === 'today' ? 'Steps Today' : `Steps (${timeframe})`,
        value: stepsValue.toLocaleString(),
        icon: Activity,
        color: 'text-blue-500',
        trend: stepsValue > 8000 ? 'Great!' : 'Keep going',
        action: 'analytics',
        delta: stepsDelta,
      },
      {
        label:
          timeframe === 'today'
            ? 'Walking Steadiness'
            : `Walking Steadiness (${timeframe})`,
        value: `${Math.round(wsValue)}%`,
        icon: Target,
        color: (wsValue || 0) > 70 ? 'text-green-500' : 'text-yellow-500',
        trend: (wsValue || 0) > 70 ? 'Stable' : 'Monitor',
        action: 'fall-risk',
        delta: wsDelta,
      },
    ];
  };

  const getFeatureCards = (): FeatureCard[] => {
    return [
      {
        id: 'fall-risk',
        title: 'Fall Risk & Walking',
        description: 'AI-powered fall prevention with LiDAR analysis',
        icon: Shield,
        color: 'bg-gradient-to-br from-red-500 to-pink-600',
        status: healthData ? 'active' : 'available',
        priority: 'high',
      },
      {
        id: 'insights',
        title: 'Health Insights',
        description: 'Comprehensive analysis of your health trends',
        icon: BarChart3,
        color: 'bg-gradient-to-br from-blue-500 to-cyan-600',
        status: healthData ? 'active' : 'setup',
        priority: 'high',
      },
      {
        id: 'ai-recommendations',
        title: 'AI Recommendations',
        description: 'Personalized suggestions based on your patterns',
        icon: Brain,
        color: 'bg-gradient-to-br from-purple-500 to-indigo-600',
        status: healthData ? 'active' : 'available',
        priority: 'high',
      },
      {
        id: 'realtime-scoring',
        title: 'Live Health Score',
        description: 'Real-time health monitoring and scoring',
        icon: Zap,
        color: 'bg-gradient-to-br from-green-500 to-emerald-600',
        status: healthData ? 'active' : 'available',
        priority: 'medium',
      },
      {
        id: 'family',
        title: 'Family Dashboard',
        description: 'Share health insights with your care team',
        icon: Users,
        color: 'bg-gradient-to-br from-orange-500 to-amber-600',
        status: 'available',
        priority: 'medium',
      },
      {
        id: 'emergency',
        title: 'Emergency Alerts',
        description: 'Automated emergency detection and response',
        icon: AlertTriangle,
        color: 'bg-gradient-to-br from-red-600 to-rose-700',
        status: 'active',
        priority: 'high',
      },
    ];
  };

  const quickStats = getQuickStats();
  const featureCards = getFeatureCards();
  const highPriorityFeatures = featureCards.filter(
    (f) => f.priority === 'high'
  );
  const otherFeatures = featureCards.filter((f) => f.priority !== 'high');

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-vitalsense-text-primary text-3xl font-bold">
              {getTimeOfDayGreeting()}! 👋
            </h1>
            <p className="text-vitalsense-text-muted mt-1">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
            {lastUpdatedLabel && (
              <p className="text-muted-foreground text-xs mt-1">
                Last updated: {lastUpdatedLabel}
              </p>
            )}
          </div>
          <div className="gap-3 flex items-center">
            <Badge
              variant="outline"
              className="border-vitalsense-teal text-vitalsense-teal"
            >
              <Smartphone className="h-3 w-3 mr-1" />
              iOS Ready
            </Badge>
            <Badge
              variant="outline"
              className="border-vitalsense-purple text-vitalsense-purple"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
          </div>
        </div>

        {/* Timeframe Toggle + Refresh */}
        {healthData && (
          <div className="flex items-center justify-end gap-2">
            {(['today', '7d', '30d', '90d'] as const).map((tf) => (
              <Button
                key={tf}
                size="sm"
                variant={timeframe === tf ? 'default' : 'outline'}
                onClick={() => setTimeframe(tf)}
                aria-pressed={timeframe === tf}
              >
                {tf.toUpperCase()}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              disabled={isRefreshing}
              onClick={async () => {
                if (isRefreshing) return;
                setIsRefreshing(true);
                try {
                  if (onRefreshData) {
                    await onRefreshData();
                  } else {
                    onNavigateToFeature('healthkit-guide');
                  }
                } finally {
                  setIsRefreshing(false);
                }
              }}
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Updating…' : 'Update Now'}
            </Button>
          </div>
        )}

        {/* Health Status Overview */}
        {healthData && (
          <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-4">
            {quickStats.slice(0, 2).map((stat) => {
              // Use Enhanced Status Cards for first two critical stats
              const getTrendDirection = (
                trend: string
              ): 'up' | 'down' | 'stable' => {
                if (trend === 'Excellent' || trend === 'Great!') return 'up';
                if (trend === 'High Risk' || trend === 'Monitor') return 'down';
                return 'stable';
              };

              const getStatusFromTrend = (
                trend: string
              ): 'excellent' | 'good' | 'fair' => {
                if (trend === 'Excellent') return 'excellent';
                if (trend === 'Good') return 'good';
                return 'fair';
              };

              return (
                <EnhancedVitalSenseStatusCard
                  key={stat.label}
                  type={stat.label.includes('Risk') ? 'fallRisk' : 'health'}
                  status={getStatusFromTrend(stat.trend || '')}
                  title={stat.label}
                  value={stat.value}
                  subtitle={`Current ${stat.label.toLowerCase()} status`}
                  showTrend={true}
                  trendDirection={getTrendDirection(stat.trend || '')}
                  trendValue={stat.trend}
                  interactive={true}
                  onCardClick={() =>
                    stat.action && onNavigateToFeature(stat.action)
                  }
                  className="cursor-pointer"
                />
              );
            })}
            {quickStats.slice(2).map((stat) => {
              // Use standard cards for remaining stats
              const IconComponent = stat.icon;
              const tfCount = getTimeframeCount(timeframe);
              const isSteps = stat.label.startsWith('Steps');
              const isWS = stat.label.startsWith('Walking Steadiness');
              const stepsData = isSteps
                ? getSliceValues(
                    healthData.metrics.steps.daily.map((d) => d.value),
                    tfCount
                  )
                : [];
              const wsData = isWS
                ? getSliceValues(
                    healthData.metrics.walkingSteadiness.daily.map(
                      (d) => d.value
                    ),
                    tfCount
                  )
                : [];
              return (
                <Card
                  key={stat.label}
                  className="cursor-pointer transition-all hover:shadow-lg"
                  onClick={() =>
                    stat.action && onNavigateToFeature(stat.action)
                  }
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-muted-foreground text-sm font-medium">
                          {stat.label}
                        </p>
                        <p className="text-2xl font-bold">{stat.value}</p>
                        {stat.trend && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {stat.trend}
                          </Badge>
                        )}
                        {typeof stat.delta === 'number' && (
                          <div className="mt-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${stat.delta >= 0 ? 'border-green-500 text-green-600 dark:text-green-400' : 'border-red-500 text-red-600 dark:text-red-400'}`}
                              aria-label={`${Math.abs(stat.delta)} percent ${stat.delta >= 0 ? 'increase' : 'decrease'} vs previous period`}
                            >
                              {stat.delta >= 0 ? '▲' : '▼'}{' '}
                              {Math.abs(stat.delta)}% vs prev
                            </Badge>
                          </div>
                        )}
                      </div>
                      <IconComponent className={`h-8 w-8 ${stat.color}`} />
                    </div>
                    {(isSteps || isWS) && (
                      <div className="mt-3">
                        <Sparkline
                          values={isSteps ? stepsData : wsData}
                          strokeClass={
                            isSteps ? 'stroke-blue-500' : 'stroke-emerald-500'
                          }
                          width={220}
                          height={40}
                          className="opacity-80"
                          title={`${stat.label} trend (${timeframe})`}
                        />
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Quick Actions - No Data State */}
      {!healthData && (
        <Alert className="border-l-4 border-l-vitalsense-primary bg-vitalsense-primary/5">
          <Heart className="h-4 w-4 text-vitalsense-primary" />
          <AlertDescription>
            <div className="space-y-3">
              <p className="font-medium text-vitalsense-primary">
                Welcome to VitalSense! Get started by importing your Apple
                Health data.
              </p>
              <IOS26Button
                variant="primary"
                size="medium"
                icon="smartphone"
                onClick={() => onNavigateToFeature('import')}
                className="text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light bg-vitalsense-primary"
              >
                Import Health Data
              </IOS26Button>
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Health Score Progress */}
      {healthData && healthScore > 0 && (
        <Card className="border-l-4 border-l-vitalsense-primary">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-vitalsense-primary" />
              Your Health Journey
            </CardTitle>
            <CardDescription>
              Overall health score based on your activity, walking patterns, and
              risk factors
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Health Score</span>
                <span className="text-2xl font-bold text-vitalsense-primary">
                  {healthScore}/100
                </span>
              </div>
              <Progress
                value={healthScore}
                className="bg-vitalsense-background-muted h-3"
              />
              <div className="text-muted-foreground flex justify-between text-sm">
                <span>Needs Attention</span>
                <span>Good</span>
                <span>Excellent</span>
              </div>
              <Button
                onClick={() => onNavigateToFeature('insights')}
                variant="outline"
                className="w-full"
              >
                View Detailed Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Featured Health Tools */}
      <div className="space-y-6">
        <div>
          <h2 className="text-vitalsense-text-primary text-2xl font-semibold">
            Featured Health Tools
          </h2>
          <p className="text-vitalsense-text-muted mt-1">
            Core features to monitor and improve your health
          </p>
        </div>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {highPriorityFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={feature.id}
                className="group cursor-pointer overflow-hidden transition-all hover:shadow-xl"
                onClick={() => onNavigateToFeature(feature.id)}
              >
                <div className={`h-2 ${feature.color}`} />
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <div className={`p-3 rounded-lg ${feature.color}`}>
                      <IconComponent className="h-6 w-6 text-white" />
                    </div>
                    <Badge
                      variant={
                        feature.status === 'active' ? 'default' : 'secondary'
                      }
                      className="text-xs"
                    >
                      {feature.status === 'active' && 'Active'}
                      {feature.status === 'available' && 'Available'}
                      {feature.status === 'setup' && 'Setup Required'}
                    </Badge>
                  </div>
                  <CardTitle className="transition-colors group-hover:text-vitalsense-primary">
                    {feature.title}
                  </CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    className="group-hover:text-vitalsense-primary-contrast w-full transition-colors group-hover:bg-vitalsense-primary"
                  >
                    {feature.status === 'setup' ? 'Set Up' : 'Open'} →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Additional Features */}
      <div className="space-y-6">
        <div>
          <h2 className="text-vitalsense-text-primary text-xl font-semibold">
            Additional Features
          </h2>
          <p className="text-vitalsense-text-muted mt-1">
            Expand your health monitoring capabilities
          </p>
        </div>

        <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {otherFeatures.map((feature) => {
            const IconComponent = feature.icon;
            return (
              <Card
                key={feature.id}
                className="cursor-pointer transition-all hover:shadow-md"
                onClick={() => onNavigateToFeature(feature.id)}
              >
                <CardContent className="flex items-center gap-4 p-4">
                  <div className={`rounded-lg p-2 ${feature.color}`}>
                    <IconComponent className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{feature.title}</p>
                    <p className="text-muted-foreground text-sm">
                      {feature.description}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {feature.status}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Quick Actions Footer */}
      <div className="bg-card rounded-lg border p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="font-semibold">Need Help Getting Started?</h3>
            <p className="text-muted-foreground text-sm">
              Explore our setup guides and integration tutorials
            </p>
          </div>
          <div className="flex gap-2">
            <IOS26Button
              variant="tinted"
              size="medium"
              icon="smartphone"
              onClick={() => onNavigateToFeature('healthkit-guide')}
            >
              Setup Guide
            </IOS26Button>
            <IOS26Button
              variant="primary"
              size="medium"
              icon="clock"
              onClick={() => onNavigateToFeature('system-status')}
              className="text-vitalsense-primary-contrast hover:bg-vitalsense-primary-light bg-vitalsense-primary"
            >
              System Status
            </IOS26Button>
          </div>
        </div>
      </div>
    </div>
  );
}
