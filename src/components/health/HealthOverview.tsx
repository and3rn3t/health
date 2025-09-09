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
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  Heart,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';

interface HealthOverviewProps {
  healthData: ProcessedHealthData;
  onNavigateToFeature: (feature: string) => void;
}

export default function HealthOverview({
  healthData,
  onNavigateToFeature,
}: HealthOverviewProps) {
  // Calculate key metrics
  const healthScore = healthData.healthScore || 0;
  const fallRiskLevel = healthData.fallRiskFactors?.length || 0;
  const dataQuality = healthData.dataQuality?.overall || 'fair';

  // Sample trending data (in a real app, this would come from historical data)
  const trends = {
    heartRate: {
      current: healthData.metrics?.heartRate?.resting || 72,
      change: -2,
    },
    steps: { current: healthData.metrics?.steps?.daily || 8500, change: 12 },
    sleep: {
      current: healthData.metrics?.sleep?.hoursSlept || 7.5,
      change: 0.5,
    },
    energy: {
      current: healthData.metrics?.activeEnergy?.total || 450,
      change: -18,
    },
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80)
      return 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800';
    if (score >= 60)
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950 dark:border-yellow-800';
    return 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800';
  };

  const getTrendIcon = (change: number) => {
    return change > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-600" />
    ) : change < 0 ? (
      <TrendingDown className="h-4 w-4 text-red-600" />
    ) : (
      <div className="h-4 w-4" />
    );
  };

  const getTrendText = (change: number, unit: string = '') => {
    if (change === 0) return 'No change';
    const direction = change > 0 ? 'up' : 'down';
    return `${Math.abs(change)}${unit} ${direction}`;
  };

  return (
    <div className="space-y-12">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Health Overview</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Your comprehensive health dashboard with key metrics and insights
        </p>
      </div>

      {/* Overall Health Score */}
      <Card className={`${getScoreBgColor(healthScore)} border-2`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white dark:bg-gray-800">
                <Heart className="h-6 w-6 text-red-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Overall Health Score</CardTitle>
                <CardDescription>
                  Based on your recent health data
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${getScoreColor(healthScore)}`}
              >
                {healthScore}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                out of 100
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-3">
          <Progress value={healthScore} className="h-3" />
          <div className="mt-3 flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Data quality:{' '}
              <Badge variant="outline" className="ml-1">
                {dataQuality}
              </Badge>
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToFeature('enhanced-analytics')}
            >
              View Details
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="my-8 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
        {/* Heart Rate */}
        <Card className="p-4 transition-shadow hover:shadow-md">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Resting Heart Rate
              </CardTitle>
              {getTrendIcon(trends.heartRate.change)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{trends.heartRate.current}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              bpm • {getTrendText(trends.heartRate.change, ' bpm')}
            </div>
          </CardContent>
        </Card>

        {/* Steps */}
        <Card className="p-4 transition-shadow hover:shadow-md">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Daily Steps</CardTitle>
              {getTrendIcon(trends.steps.change)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">
              {trends.steps.current.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              steps • {getTrendText(trends.steps.change, '%')}
            </div>
          </CardContent>
        </Card>

        {/* Sleep */}
        <Card className="p-4 transition-shadow hover:shadow-md">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Sleep Duration
              </CardTitle>
              {getTrendIcon(trends.sleep.change)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{trends.sleep.current}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              hours • {getTrendText(trends.sleep.change, ' hrs')}
            </div>
          </CardContent>
        </Card>

        {/* Active Energy */}
        <Card className="p-4 transition-shadow hover:shadow-md">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">
                Active Energy
              </CardTitle>
              {getTrendIcon(trends.energy.change)}
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-2xl font-bold">{trends.energy.current}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              cal • {getTrendText(trends.energy.change, ' cal')}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Feature Quick Access */}
      <div className="my-8 grid grid-cols-1 gap-8 lg:grid-cols-2 xl:grid-cols-3">
        {/* Fall Risk Monitoring */}
        <Card
          className="cursor-pointer p-2 transition-shadow hover:shadow-md"
          onClick={() => onNavigateToFeature('fall-detection')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-950">
                <Shield className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <CardTitle className="text-base">Fall Risk Monitor</CardTitle>
                <CardDescription>
                  Real-time fall risk assessment
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">
                  {fallRiskLevel === 0
                    ? 'Low Risk'
                    : fallRiskLevel <= 2
                      ? 'Medium Risk'
                      : 'High Risk'}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {fallRiskLevel} risk factors identified
                </div>
              </div>
              <Badge variant={fallRiskLevel === 0 ? 'default' : 'destructive'}>
                {fallRiskLevel === 0 ? 'Safe' : 'Monitor'}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Gait Analysis */}
        <Card
          className="cursor-pointer p-2 transition-shadow hover:shadow-md"
          onClick={() => onNavigateToFeature('gait-analysis')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-950">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-base">Gait Analysis</CardTitle>
                <CardDescription>Walking pattern insights</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Normal Pattern</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Stable walking detected
                </div>
              </div>
              <Badge variant="default">Stable</Badge>
            </div>
          </CardContent>
        </Card>

        {/* AI Recommendations */}
        <Card
          className="cursor-pointer p-2 transition-shadow hover:shadow-md"
          onClick={() => onNavigateToFeature('ai-recommendations')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-950">
                <Zap className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-base">AI Recommendations</CardTitle>
                <CardDescription>Personalized health insights</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">3 New Insights</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Based on your patterns
                </div>
              </div>
              <Badge variant="outline">New</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Health Alerts */}
        <Card
          className="cursor-pointer p-2 transition-shadow hover:shadow-md"
          onClick={() => onNavigateToFeature('alerts')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-950">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
              <div>
                <CardTitle className="text-base">Health Alerts</CardTitle>
                <CardDescription>Important notifications</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">All Clear</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  No active alerts
                </div>
              </div>
              <Badge variant="default">Healthy</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Activity Tracking */}
        <Card
          className="cursor-pointer p-2 transition-shadow hover:shadow-md"
          onClick={() => onNavigateToFeature('movement-patterns')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-950">
                <Activity className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-base">Activity Patterns</CardTitle>
                <CardDescription>Movement analysis</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">Active Today</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Good movement patterns
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Family Dashboard */}
        <Card
          className="cursor-pointer p-2 transition-shadow hover:shadow-md"
          onClick={() => onNavigateToFeature('family')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-950">
                <Users className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <CardTitle className="text-base">Family Dashboard</CardTitle>
                <CardDescription>Share with caregivers</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold">2 Watchers</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Family members connected
                </div>
              </div>
              <Badge variant="outline">Connected</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Recent Health Insights
          </CardTitle>
          <CardDescription>
            AI-powered insights based on your recent health data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                <TrendingUp className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Improved Sleep Quality</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Your sleep duration has increased by 30 minutes on average
                  this week.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
                <Activity className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Consistent Activity Level</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  You've maintained a steady activity level throughout the week.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 rounded-lg border p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950">
                <Heart className="h-4 w-4 text-yellow-600" />
              </div>
              <div className="flex-1">
                <p className="font-medium">Heart Rate Variability</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Consider monitoring stress levels - HRV shows some variation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToFeature('ai-recommendations')}
            >
              View All Insights
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onNavigateToFeature('enhanced-analytics')}
            >
              Detailed Analytics
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
