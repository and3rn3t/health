/**
 * VitalSense Landing Page - iOS 26 HIG Optimized
 * Redesigned for better visual hierarchy, touch targets, and user experience
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
import { InteractiveCard } from '@/components/ui/interactive-card';
import { IOS26Button } from '@/components/ui/ios26-button-system';
import { EnhancedVitalSenseStatusCard } from '@/components/ui/ios26-enhanced-components';
import { useLiveRegion } from '@/hooks/useLiveRegion';
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  ChevronRight,
  Heart,
  Plus,
  RefreshCcw,
  Shield,
  Smartphone,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface LandingPageOptimizedProps {
  readonly healthData: ProcessedHealthData | null;
  readonly onNavigateToFeature: (featureId: string) => void;
  readonly fallRiskScore: number;
  readonly onRefreshData?: () => Promise<void> | void;
}

interface HealthMetric {
  id: string;
  label: string;
  value: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'stable';
  icon: React.ElementType;
  color: string;
  action: string;
  priority: 'critical' | 'important' | 'normal';
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  color: string;
  action: string;
  featured: boolean;
}

export default function LandingPageOptimized({
  healthData,
  onNavigateToFeature,
  fallRiskScore,
  onRefreshData,
}: LandingPageOptimizedProps) {
  const [timeframe, setTimeframe] = useState<'today' | '7d' | '30d' | '90d'>(
    'today'
  );
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live region for screen readers
  const _announceToScreenReader = useLiveRegion();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Time of day greeting
  const getTimeOfDayGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  // Calculate health metrics with proper iOS 26 prioritization
  const getHealthMetrics = (): HealthMetric[] => {
    if (!healthData) return [];

    const healthScore =
      healthData.healthScore ||
      Math.round(
        (healthData.metrics.steps.average / 10000) * 40 +
          (healthData.metrics.walkingSteadiness.average || 0) * 0.6
      );

    const computedFallRisk = fallRiskScore || 0;

    return [
      {
        id: 'health-score',
        label: 'Health Score',
        value: `${healthScore}`,
        trend:
          healthScore > 75
            ? 'Excellent'
            : healthScore > 50
              ? 'Good'
              : 'Needs Attention',
        trendDirection:
          healthScore > 75 ? 'up' : healthScore > 50 ? 'stable' : 'down',
        icon: Heart,
        color: 'text-red-500',
        action: 'analytics',
        priority: 'critical',
      },
      {
        id: 'fall-risk',
        label: 'Fall Risk',
        value: computedFallRisk > 0 ? `${computedFallRisk.toFixed(1)}` : 'Low',
        trend:
          computedFallRisk > 2.5
            ? 'High Risk'
            : computedFallRisk > 1.5
              ? 'Moderate'
              : 'Low Risk',
        trendDirection:
          computedFallRisk > 2.5
            ? 'down'
            : computedFallRisk > 1.5
              ? 'stable'
              : 'up',
        icon: Shield,
        color:
          computedFallRisk > 2.5
            ? 'text-red-500'
            : computedFallRisk > 1.5
              ? 'text-yellow-500'
              : 'text-green-500',
        action: 'fall-detection',
        priority: 'critical',
      },
      {
        id: 'steps',
        label: 'Daily Steps',
        value:
          healthData.metrics.steps.daily[
            healthData.metrics.steps.daily.length - 1
          ]?.value.toLocaleString() || '0',
        trend: 'Active',
        trendDirection: 'up',
        icon: Activity,
        color: 'text-blue-500',
        action: 'analytics',
        priority: 'important',
      },
      {
        id: 'walking',
        label: 'Walking Steadiness',
        value: `${Math.round(healthData.metrics.walkingSteadiness.daily[healthData.metrics.walkingSteadiness.daily.length - 1]?.value || 0)}%`,
        trend: 'Stable',
        trendDirection: 'stable',
        icon: Target,
        color: 'text-green-500',
        action: 'fall-detection',
        priority: 'important',
      },
    ];
  };

  // Get quick actions following iOS 26 patterns
  const getQuickActions = (): QuickAction[] => {
    return [
      {
        id: 'fall-risk',
        title: 'Fall Risk Analysis',
        description: 'AI-powered fall prevention with LiDAR',
        icon: Shield,
        color: 'bg-gradient-to-br from-red-500 to-pink-600',
        action: 'fall-detection',
        featured: true,
      },
      {
        id: 'health-analytics',
        title: 'Health Analytics',
        description: 'Comprehensive health data insights',
        icon: BarChart3,
        color: 'bg-gradient-to-br from-blue-500 to-indigo-600',
        action: 'analytics',
        featured: true,
      },
      {
        id: 'ai-insights',
        title: 'AI Insights',
        description: 'Personalized health recommendations',
        icon: Brain,
        color: 'bg-gradient-to-br from-purple-500 to-pink-600',
        action: 'advanced-analytics',
        featured: true,
      },
      {
        id: 'emergency',
        title: 'Emergency Contacts',
        description: 'Manage emergency response settings',
        icon: AlertTriangle,
        color: 'bg-gradient-to-br from-orange-500 to-red-600',
        action: 'emergency-contacts',
        featured: false,
      },
      {
        id: 'family',
        title: 'Family Dashboard',
        description: 'Share health data with caregivers',
        icon: Users,
        color: 'bg-gradient-to-br from-green-500 to-teal-600',
        action: 'caregiver',
        featured: false,
      },
      {
        id: 'device-sync',
        title: 'Device Sync',
        description: 'Connect devices directly or via iOS app',
        icon: Smartphone,
        color: 'bg-gradient-to-br from-teal-500 to-cyan-600',
        action: 'device-sync',
        featured: false,
      },
    ];
  };

  const healthMetrics = getHealthMetrics();
  const quickActions = getQuickActions();
  const featuredActions = quickActions.filter((action) => action.featured);
  const otherActions = quickActions.filter((action) => !action.featured);
  const criticalMetrics = healthMetrics.filter(
    (metric) => metric.priority === 'critical'
  );
  const importantMetrics = healthMetrics.filter(
    (metric) => metric.priority === 'important'
  );

  return (
    <div className="min-h-screen bg-background">
      {/* iOS 26 Large Title Header */}
      <div className="pt-safe-top px-2 py-6 sm:px-4">
        <div className="space-y-4">
          {/* Large Title Section */}
          <div className="space-y-2">
            <h1 className="text-4xl font-bold tracking-tight text-foreground">
              {getTimeOfDayGreeting()}
            </h1>
            <p className="text-lg text-muted-foreground">
              {currentTime.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>

          {/* Status Badges - iOS 26 Style */}
          <div className="flex items-center gap-3">
            <Badge
              variant="secondary"
              className="dark:bg-green-950 dark:text-green-300 dark:border-green-800 border-green-200 bg-green-50 text-green-700"
            >
              <Smartphone className="mr-1 h-3 w-3" />
              iOS Ready
            </Badge>
            <Badge
              variant="secondary"
              className="dark:bg-purple-950 dark:text-purple-300 dark:border-purple-800 border-purple-200 bg-purple-50 text-purple-700"
            >
              <Sparkles className="mr-1 h-3 w-3" />
              AI Powered
            </Badge>
          </div>
        </div>
      </div>

      {/* Critical Health Metrics - Prominent Display */}
      {healthData && criticalMetrics.length > 0 && (
        <div className="px-2 py-6 sm:px-4">
          <div className="space-y-6">
            <h2 className="text-2xl font-semibold text-foreground">
              Health Overview
            </h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {criticalMetrics.map((metric) => (
                <EnhancedVitalSenseStatusCard
                  key={metric.id}
                  type={metric.id === 'fall-risk' ? 'fallRisk' : 'health'}
                  status={
                    metric.trendDirection === 'up'
                      ? 'excellent'
                      : metric.trendDirection === 'stable'
                        ? 'good'
                        : 'fair'
                  }
                  title={metric.label}
                  value={metric.value}
                  subtitle={metric.trend}
                  showTrend={true}
                  trendDirection={metric.trendDirection}
                  trendValue={metric.trend}
                  interactive={true}
                  onCardClick={() => onNavigateToFeature(metric.action)}
                  className="transform cursor-pointer transition-all hover:scale-[1.02] active:scale-[0.98]"
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Time Range Controls - iOS 26 Segmented Control */}
      {healthData && (
        <div className="px-2 py-6 sm:px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center rounded-xl bg-muted p-1">
              {(['today', '7d', '30d', '90d'] as const).map((tf) => (
                <Button
                  key={tf}
                  size="sm"
                  variant="ghost"
                  onClick={() => setTimeframe(tf)}
                  aria-pressed={timeframe === tf}
                  className={`min-h-[44px] rounded-lg px-4 text-sm font-medium transition-all ${
                    timeframe === tf
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tf === 'today' ? 'Today' : tf.toUpperCase()}
                </Button>
              ))}
            </div>
            <Button
              variant="outline"
              size="default"
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
              className="min-h-[44px] px-6"
            >
              <RefreshCcw
                className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
              />
              {isRefreshing ? 'Updating…' : 'Update'}
            </Button>
          </div>
        </div>
      )}

      {/* Additional Metrics - Compact Display */}
      {healthData && importantMetrics.length > 0 && (
        <div className="px-2 pb-8 sm:px-4">
          <div className="grid grid-cols-2 gap-4">
            {importantMetrics.map((metric) => {
              const IconComponent = metric.icon;
              return (
                <Card
                  key={metric.id}
                  className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                  onClick={() => onNavigateToFeature(metric.action)}
                >
                  <CardContent className="p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <IconComponent className={`h-5 w-5 ${metric.color}`} />
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        {metric.label}
                      </p>
                      <p className="text-2xl font-bold text-foreground">
                        {metric.value}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Featured Actions - iOS 26 Large Cards */}
      <div className="px-2 py-6 sm:px-4">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            Featured Tools
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featuredActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <InteractiveCard
                  key={action.id}
                  onClick={() => onNavigateToFeature(action.action)}
                  className="group transform overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <div className={`h-2 ${action.color}`} />
                  <CardHeader className="pb-4 pt-6">
                    <div className="mb-3 flex items-center justify-between">
                      <div className={`rounded-xl p-3 ${action.color}`}>
                        <IconComponent className="h-6 w-6 text-white" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground transition-colors group-hover:text-foreground" />
                    </div>
                    <CardTitle className="text-lg font-semibold text-foreground transition-colors group-hover:text-primary">
                      {action.title}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {action.description}
                    </CardDescription>
                  </CardHeader>
                </InteractiveCard>
              );
            })}
          </div>
        </div>
      </div>

      {/* Additional Actions - Compact List */}
      <div className="px-2 py-6 sm:px-4">
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-foreground">More Tools</h2>
          <div className="space-y-3">
            {otherActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Card
                  key={action.id}
                  className="cursor-pointer transition-all hover:shadow-sm active:scale-[0.99]"
                  onClick={() => onNavigateToFeature(action.action)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4">
                      <div className={`rounded-lg p-2 ${action.color}`}>
                        <IconComponent className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-foreground">
                          {action.title}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>

      {/* Setup CTA - iOS 26 Bottom Action */}
      {!healthData && (
        <div className="pb-safe-bottom px-2 sm:px-4">
          <Card className="from-primary/10 to-accent/10 border-primary/20 bg-gradient-to-r">
            <CardContent className="p-6">
              <div className="space-y-4 text-center">
                <div className="bg-primary/20 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-lg font-semibold text-foreground">
                    Get Started with VitalSense
                  </h3>
                  <p className="text-muted-foreground">
                    Connect your Apple Health data to unlock personalized
                    insights
                  </p>
                </div>
                <IOS26Button
                  variant="primary"
                  size="large"
                  icon="smartphone"
                  onClick={() => onNavigateToFeature('healthkit-guide')}
                  className="min-h-[50px] w-full"
                >
                  Setup Health Data
                </IOS26Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Bottom Padding for Safe Area */}
      <div className="h-safe-bottom" />
    </div>
  );
}
