import { createFileRoute } from '@tanstack/react-router';
import { Suspense, useEffect, useMemo, useState } from 'react';
import { DashboardSkeleton } from '@/components/ui/DashboardSkeleton';
import { useHealthData } from '@/contexts/HealthDataContext';
import { HealthScoreHero } from '@/components/health/dashboard/HealthScoreHero';
import { MetricPill } from '@/components/health/dashboard/MetricPill';
import { QuickActionCard } from '@/components/health/dashboard/QuickActionCard';
import { DailyProgressRing } from '@/components/health/dashboard/DailyProgressRing';
import { DeviceStatusCard } from '@/components/health/DeviceStatusCard';
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Activity,
  Brain,
  Footprints,
  Heart,
  Plus,
  RefreshCcw,
  Scan,
  Shield,
  Smartphone,
  Sparkles,
  Target,
} from '@/lib/icons';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function useGreeting(): string {
  const [hour, setHour] = useState(() => new Date().getHours());

  useEffect(() => {
    const id = setInterval(() => setHour(new Date().getHours()), 60_000);
    return () => clearInterval(id);
  }, []);

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formattedDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

// ---------------------------------------------------------------------------
// Dashboard Page
// ---------------------------------------------------------------------------

function DashboardPage() {
  const { healthData, fallRiskScore, refreshData } = useHealthData();
  const { hasConnectedDevices } = useDeviceManagement();
  const greeting = useGreeting();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const healthScore = useMemo(() => {
    if (!healthData) return 0;
    return (
      healthData.healthScore ||
      Math.round(
        (healthData.metrics.steps.average / 10_000) * 40 +
          (healthData.metrics.walkingSteadiness.average || 0) * 0.6
      )
    );
  }, [healthData]);

  const latestSteps = useMemo(() => {
    const daily = healthData?.metrics.steps.daily;
    return daily?.[daily.length - 1]?.value ?? 0;
  }, [healthData]);

  const latestSteadiness = useMemo(() => {
    const daily = healthData?.metrics.walkingSteadiness.daily;
    return Math.round(daily?.[daily.length - 1]?.value ?? 0);
  }, [healthData]);

  const latestHeartRate = useMemo(() => {
    const daily = healthData?.metrics.heartRate.daily;
    return Math.round(daily?.[daily.length - 1]?.value ?? 0);
  }, [healthData]);

  const handleRefresh = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    try {
      await refreshData();
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <div className="min-h-screen bg-background pb-safe-bottom">
        <div className="mx-auto max-w-6xl px-3 py-4 sm:px-4 lg:px-6">
          {/* ── Header ─────────────────────────────── */}
          <header className="mb-6 space-y-3">
            <div className="flex items-end justify-between">
              <div className="space-y-1">
                <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                  {greeting}
                </h1>
                <p className="text-base text-muted-foreground">
                  {formattedDate()}
                </p>
              </div>
              <Button
                variant="outline"
                size="default"
                disabled={isRefreshing}
                onClick={handleRefresh}
                className="min-h-[44px] shrink-0 px-4"
              >
                <RefreshCcw
                  className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`}
                />
                {isRefreshing ? 'Updating…' : 'Update'}
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="secondary"
                className="border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300"
              >
                <Smartphone className="mr-1 h-3 w-3" />
                iOS Ready
              </Badge>
              <Badge
                variant="secondary"
                className="border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-300"
              >
                <Sparkles className="mr-1 h-3 w-3" />
                AI Powered
              </Badge>
            </div>
          </header>

          {/* ── Two-column layout (desktop) ────────── */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* ── Left column (2/3) ────────────────── */}
            <div className="space-y-6 lg:col-span-2">
              {/* Health Score Hero */}
              {healthData && (
                <HealthScoreHero score={healthScore} label="Health Score" />
              )}

              {/* Metric pills — horizontal scroll on mobile, grid on desktop */}
              {healthData && (
                <div className="flex gap-3 overflow-x-auto pb-1 sm:grid sm:grid-cols-2 sm:overflow-visible lg:grid-cols-4">
                  <MetricPill
                    icon={Heart}
                    label="Heart Rate"
                    value={latestHeartRate ? `${latestHeartRate} bpm` : '—'}
                    trend={healthData.metrics.heartRate.trend === 'stable' ? 'stable' : healthData.metrics.heartRate.trend === 'increasing' ? 'up' : 'down'}
                    trendLabel={healthData.metrics.heartRate.trend}
                    iconColor="text-red-500"
                  />
                  <MetricPill
                    icon={Activity}
                    label="Steps"
                    value={latestSteps.toLocaleString()}
                    trend={healthData.metrics.steps.trend === 'stable' ? 'stable' : healthData.metrics.steps.trend === 'increasing' ? 'up' : 'down'}
                    trendLabel={healthData.metrics.steps.trend}
                    iconColor="text-blue-500"
                  />
                  <MetricPill
                    icon={Target}
                    label="Steadiness"
                    value={`${latestSteadiness}%`}
                    trend={healthData.metrics.walkingSteadiness.trend === 'stable' ? 'stable' : healthData.metrics.walkingSteadiness.trend === 'increasing' ? 'up' : 'down'}
                    trendLabel={healthData.metrics.walkingSteadiness.trend}
                    iconColor="text-green-500"
                  />
                  <MetricPill
                    icon={Shield}
                    label="Fall Risk"
                    value={fallRiskScore > 0 ? fallRiskScore.toFixed(1) : 'Low'}
                    trend={fallRiskScore > 2.5 ? 'down' : fallRiskScore > 1.5 ? 'stable' : 'up'}
                    trendLabel={fallRiskScore > 2.5 ? 'High' : fallRiskScore > 1.5 ? 'Moderate' : 'Low'}
                    iconColor={fallRiskScore > 2.5 ? 'text-red-500' : fallRiskScore > 1.5 ? 'text-yellow-500' : 'text-green-500'}
                  />
                </div>
              )}

              {/* Quick actions */}
              <section>
                <h2 className="mb-3 text-xl font-semibold text-foreground">
                  Quick Actions
                </h2>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <QuickActionCard
                    icon={Footprints}
                    title="Gait Analysis"
                    description="Step patterns & walking quality"
                    to="/gait-analysis"
                    iconBg="bg-gradient-to-br from-blue-500 to-indigo-600"
                  />
                  <QuickActionCard
                    icon={Scan}
                    title="LiDAR & Posture"
                    description="3D posture assessment"
                    to="/lidar-posture"
                    iconBg="bg-gradient-to-br from-purple-500 to-pink-600"
                  />
                  <QuickActionCard
                    icon={Shield}
                    title="Fall Risk Analysis"
                    description="AI-powered fall prevention"
                    to="/fall-risk"
                    iconBg="bg-gradient-to-br from-red-500 to-pink-600"
                  />
                  <QuickActionCard
                    icon={Brain}
                    title="AI Insights"
                    description="Personalized health recommendations"
                    to="/settings"
                    iconBg="bg-gradient-to-br from-teal-500 to-cyan-600"
                  />
                </div>
              </section>
            </div>

            {/* ── Right column (1/3) ───────────────── */}
            <div className="space-y-6">
              {/* Daily progress ring */}
              {healthData && (
                <DailyProgressRing
                  segments={[
                    {
                      label: 'Steps',
                      current: latestSteps,
                      goal: 10_000,
                      color: 'stroke-red-500',
                    },
                    {
                      label: 'Steadiness',
                      current: latestSteadiness,
                      goal: 100,
                      color: 'stroke-green-500',
                    },
                    {
                      label: 'Heart Rate',
                      current: Math.min(latestHeartRate, 120),
                      goal: 120,
                      color: 'stroke-blue-500',
                    },
                  ]}
                />
              )}

              {/* Device status */}
              {!hasConnectedDevices && (
                <DeviceStatusCard compact showQuickActions />
              )}

              {/* Setup CTA when no health data */}
              {!healthData && (
                <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-accent/10">
                  <CardContent className="space-y-4 p-6 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                      <Plus className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <h3 className="text-lg font-semibold text-foreground">
                        Get Started with VitalSense
                      </h3>
                      <p className="text-muted-foreground">
                        Connect your Apple Health data to unlock personalized insights
                      </p>
                    </div>
                    <Button
                      variant="prominent"
                      size="lg"
                      onClick={handleRefresh}
                      className="min-h-[50px] w-full"
                    >
                      Setup Health Data
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </Suspense>
  );
}

export const Route = createFileRoute('/')({
  component: DashboardPage,
  context: () => ({ label: 'Dashboard' }),
});
