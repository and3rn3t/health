/**
 * VitalSense Main Dashboard
 *
 * Impressive landing experience for new users with health data import,
 * personalized insights, and smooth onboarding flow.
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
import { VitalSenseStatusCard } from '@/components/ui/vitalsense-components';
import { getVitalSenseClasses } from '@/lib/vitalsense-colors';
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  Heart,
  MessageCircle,
  Shield,
  Smartphone,
  Sparkles,
  TrendingUp,
  Upload,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface VitalSenseMainDashboardProps {
  healthData?: ProcessedHealthData;
  onNavigateToFeature: (feature: string) => void;
  onHealthDataImport: (data: ProcessedHealthData) => void;
}

interface DashboardMetric {
  id: string;
  label: string;
  value: string | number;
  unit?: string;
  icon: React.ElementType;
  color: string;
  trend?: {
    direction: 'up' | 'down' | 'stable';
    value: string;
  };
  status: 'excellent' | 'good' | 'fair' | 'poor';
}

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
}

export default function VitalSenseMainDashboard({
  healthData,
  onNavigateToFeature,
  onHealthDataImport,
}: VitalSenseMainDashboardProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [onboardingProgress, setOnboardingProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getTimeGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDashboardMetrics = (): DashboardMetric[] => {
    if (!healthData) return [];

    return [
      {
        id: 'health-score',
        label: 'Health Score',
        value: healthData.healthScore || 0,
        unit: '/100',
        icon: Heart,
        color: getVitalSenseClasses.text.success,
        trend: {
          direction: 'up',
          value: '+2 this week',
        },
        status: healthData.healthScore > 75 ? 'excellent' : 'good',
      },
      {
        id: 'fall-risk',
        label: 'Fall Risk',
        value: (healthData as any).fallRiskScore || 0,
        unit: '/5',
        icon: Shield,
        color:
          (healthData as any).fallRiskScore > 2.5
            ? 'text-red-500'
            : 'text-green-500',
        status: (healthData as any).fallRiskScore > 2.5 ? 'poor' : 'excellent',
      },
      {
        id: 'daily-activity',
        label: 'Daily Activity',
        value: (healthData as any).activityLevel || 'Moderate',
        icon: Activity,
        color: getVitalSenseClasses.text.primary,
        status: 'good',
      },
      {
        id: 'trends',
        label: 'Health Trends',
        value: (healthData as any).trends?.length || 0,
        unit: 'insights',
        icon: TrendingUp,
        color: getVitalSenseClasses.text.teal,
        status: 'good',
      },
    ];
  };

  const getOnboardingSteps = (): OnboardingStep[] => {
    const hasHealthData = !!healthData;

    return [
      {
        id: 'import-data',
        title: 'Import Your Health Data',
        description: 'Connect your Apple Health data for personalized insights',
        icon: Upload,
        completed: hasHealthData,
        action: () => onNavigateToFeature('health-data-import'),
        actionLabel: hasHealthData ? 'Update Data' : 'Import Now',
      },
      {
        id: 'setup-monitoring',
        title: 'Configure Monitoring',
        description:
          'Set up fall risk alerts and health monitoring preferences',
        icon: Shield,
        completed:
          hasHealthData && (healthData as any).fallRiskScore !== undefined,
        action: () => onNavigateToFeature('health-settings'),
        actionLabel: 'Configure',
      },
      {
        id: 'connect-devices',
        title: 'Connect Devices',
        description: 'Link your Apple Watch for real-time monitoring',
        icon: Smartphone,
        completed: false,
        action: () => onNavigateToFeature('connected-devices'),
        actionLabel: 'Connect',
      },
      {
        id: 'family-access',
        title: 'Add Family Members',
        description: 'Share insights with caregivers and family',
        icon: Users,
        completed: false,
        action: () => onNavigateToFeature('family-dashboard'),
        actionLabel: 'Add Family',
      },
    ];
  };

  useEffect(() => {
    const steps = getOnboardingSteps();
    const completedSteps = steps.filter((step) => step.completed).length;
    setOnboardingProgress((completedSteps / steps.length) * 100);
  }, [healthData]);

  const metrics = getDashboardMetrics();
  const onboardingSteps = getOnboardingSteps();
  const hasHealthData = !!healthData;

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Header - Compact */}
      <div className="py-4 text-center">
        <div className="mb-4">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-vitalsense-primary to-vitalsense-teal shadow-lg">
            <Heart className="h-7 w-7 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
            {getTimeGreeting()}, welcome to{' '}
            <span className={getVitalSenseClasses.text.primary}>
              VitalSense
            </span>
          </h1>
          <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-300">
            Your comprehensive health insights platform
          </p>
        </div>

        <div className="mt-3 text-sm text-gray-500 dark:text-gray-400">
          {currentTime.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}{' '}
          •{' '}
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true,
          })}
        </div>
      </div>

      {/* Onboarding Progress */}
      {onboardingProgress < 100 && (
        <Card className="border-l-4 border-l-vitalsense-primary bg-gradient-to-r from-blue-50 to-teal-50 dark:from-blue-900/20 dark:to-teal-900/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles
                className={`h-5 w-5 ${getVitalSenseClasses.text.primary}`}
              />
              Get Started with VitalSense
            </CardTitle>
            <CardDescription>
              Complete these steps to unlock the full potential of your health
              monitoring
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Setup Progress</span>
                <Badge variant="secondary">
                  {Math.round(onboardingProgress)}% Complete
                </Badge>
              </div>
              <Progress value={onboardingProgress} className="h-2" />

              <div className="grid gap-3">
                {onboardingSteps.map((step) => (
                  <div
                    key={step.id}
                    className={`flex items-center justify-between rounded-lg border p-3 transition-colors ${
                      step.completed
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {step.completed ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <step.icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                      )}
                      <div>
                        <p
                          className={`font-medium ${step.completed ? 'text-green-900 dark:text-green-400' : 'text-gray-900 dark:text-gray-200'}`}
                        >
                          {step.title}
                        </p>
                        <p
                          className={`text-sm ${step.completed ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                          {step.description}
                        </p>
                      </div>
                    </div>

                    {!step.completed && step.action && (
                      <Button
                        variant="outline"
                        onClick={step.action}
                        className="flex items-center gap-1"
                      >
                        {step.actionLabel}
                        <ArrowRight className="h-3 w-3" />
                      </Button>
                    )}

                    {step.completed && (
                      <Badge
                        variant="outline"
                        className="border-green-300 text-green-700"
                      >
                        Complete
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Health Metrics Dashboard */}
      {hasHealthData ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Your Health Overview
            </h2>
            <Button
              variant="outline"
              onClick={() => onNavigateToFeature('health-analytics')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              View Analytics
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metrics.map((metric) => (
              <VitalSenseStatusCard
                key={metric.id}
                type="health"
                status={metric.status}
                title={metric.label}
                value={`${metric.value}${metric.unit || ''}`}
                subtitle={metric.trend ? metric.trend.value : undefined}
                className="cursor-pointer transition-shadow hover:shadow-md"
              />
            ))}
          </div>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Access your most-used features and get personalized
                recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Button
                  variant="outline"
                  className="flex h-auto items-center justify-start gap-3 p-4"
                  onClick={() => onNavigateToFeature('fall-risk')}
                >
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  <div className="text-left">
                    <div className="font-medium">Fall Risk Analysis</div>
                    <div className="text-sm text-gray-500">
                      Monitor stability trends
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="flex h-auto items-center justify-start gap-3 p-4"
                  onClick={() => onNavigateToFeature('ai-recommendations')}
                >
                  <Brain className="h-5 w-5 text-purple-500" />
                  <div className="text-left">
                    <div className="font-medium">AI Insights</div>
                    <div className="text-sm text-gray-500">
                      Personalized recommendations
                    </div>
                  </div>
                </Button>

                <Button
                  variant="outline"
                  className="flex h-auto items-center justify-start gap-3 p-4"
                  onClick={() => onNavigateToFeature('real-time-monitoring')}
                >
                  <Zap className="h-5 w-5 text-green-500" />
                  <div className="text-left">
                    <div className="font-medium">Live Monitoring</div>
                    <div className="text-sm text-gray-500">
                      Real-time health tracking
                    </div>
                  </div>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Health Insights */}
          {healthData.insights && healthData.insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-yellow-500" />
                  Today's Health Insights
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {healthData.insights.slice(0, 3).map((insight) => (
                    <div
                      key={`insight-${insight.substring(0, 20).replace(/\s+/g, '-')}`}
                      className="flex items-start gap-3 rounded-lg border bg-gradient-to-r from-blue-50 to-purple-50 p-3"
                    >
                      <MessageCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-500" />
                      <p className="text-sm text-gray-700">{insight}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ) : (
        /* No Data State - Impressive Onboarding */
        <div className="space-y-6">
          <Card className="from-vitalsense-primary/5 to-vitalsense-teal/5 border-vitalsense-primary/20 border-2 border-dashed bg-gradient-to-br p-8 text-center">
            <CardContent className="space-y-6">
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-r from-vitalsense-primary to-vitalsense-teal">
                <Upload className="h-12 w-12 text-white" />
              </div>

              <div>
                <h3 className="mb-2 text-2xl font-bold text-gray-900">
                  Let's Get Your Health Data Connected
                </h3>
                <p className="mx-auto max-w-md text-gray-600">
                  Import your Apple Health data to unlock personalized insights,
                  fall risk monitoring, and AI-powered recommendations.
                </p>
              </div>

              <Button
                size="lg"
                onClick={() => onNavigateToFeature('health-data-import')}
                className="hover:from-vitalsense-primary/90 hover:to-vitalsense-teal/90 bg-gradient-to-r from-vitalsense-primary to-vitalsense-teal px-8 py-3 text-white"
              >
                <Upload className="mr-2 h-5 w-5" />
                Import Health Data
              </Button>

              <div className="space-y-1 text-sm text-gray-500">
                <p>✓ HIPAA-compliant data processing</p>
                <p>✓ Advanced fall risk analysis</p>
                <p>✓ Personalized health insights</p>
              </div>
            </CardContent>
          </Card>

          {/* Feature Preview */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Card
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => onNavigateToFeature('health-analytics')}
            >
              <CardHeader>
                <BarChart3 className="mb-2 h-8 w-8 text-blue-500" />
                <CardTitle>Health Analytics</CardTitle>
                <CardDescription>
                  Comprehensive analysis of your health trends and patterns
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => onNavigateToFeature('fall-risk')}
            >
              <CardHeader>
                <Shield className="mb-2 h-8 w-8 text-green-500" />
                <CardTitle>Fall Risk Monitor</CardTitle>
                <CardDescription>
                  Advanced algorithms to assess and prevent fall risks
                </CardDescription>
              </CardHeader>
            </Card>

            <Card
              className="cursor-pointer transition-shadow hover:shadow-lg"
              onClick={() => onNavigateToFeature('family-dashboard')}
            >
              <CardHeader>
                <Users className="mb-2 h-8 w-8 text-purple-500" />
                <CardTitle>Family Connect</CardTitle>
                <CardDescription>
                  Share health insights with caregivers and family members
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
