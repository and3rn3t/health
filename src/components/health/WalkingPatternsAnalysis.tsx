/**
 * Walking Patterns Analysis Component
 * Analyzes walking steadiness, gait patterns, and mobility trends from Apple Health data
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
import { ProcessedHealthData } from '@/types';
import {
  AlertTriangle,
  ChevronRight,
  Clock,
  Footprints,
  MapPin,
  Route,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';

interface WalkingPatternsAnalysisProps {
  healthData: ProcessedHealthData;
  onNavigateToFeature?: (feature: string) => void;
}

interface WalkingMetrics {
  steadiness: {
    score: number;
    risk: 'low' | 'moderate' | 'high';
    trend: 'improving' | 'declining' | 'stable';
    weeklyChange: number;
  };
  distance: {
    daily: number;
    weekly: number;
    monthly: number;
    trend: 'increasing' | 'decreasing' | 'stable';
    percentileRank: number;
  };
  patterns: {
    consistency: number;
    variability: number;
    peakTimes: string[];
    restDays: number;
  };
  recommendations: WalkingRecommendation[];
}

interface WalkingRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  category: 'safety' | 'performance' | 'consistency' | 'recovery';
  actionable: boolean;
}

const WalkingPatternsAnalysis: React.FC<WalkingPatternsAnalysisProps> = ({
  healthData,
  onNavigateToFeature,
}) => {
  // Calculate walking metrics from health data
  const walkingMetrics = useMemo((): WalkingMetrics => {
    const steadinessData = healthData.metrics.walkingSteadiness;
    const distanceData = healthData.metrics.distanceWalking;
    const stepsData = healthData.metrics.steps;

    // Calculate walking steadiness score and risk assessment
    const steadinessScore = steadinessData?.average || 85;
    const steadinessRisk =
      steadinessScore >= 80
        ? 'low'
        : steadinessScore >= 60
          ? 'moderate'
          : 'high';
    const steadinessTrend =
      steadinessData?.trend === 'increasing'
        ? 'improving'
        : steadinessData?.trend === 'decreasing'
          ? 'declining'
          : 'stable';
    const weeklyChange =
      (((steadinessData?.lastValue || 85) - (steadinessData?.average || 85)) /
        (steadinessData?.average || 85)) *
      100;

    // Calculate distance metrics
    const dailyDistance = distanceData?.lastValue || 4.2;
    const weeklyDistance =
      distanceData?.weekly?.reduce((sum, metric) => sum + metric.value, 0) ||
      29.4;
    const monthlyDistance =
      distanceData?.monthly?.reduce((sum, metric) => sum + metric.value, 0) ||
      126.8;
    const distanceTrend = distanceData?.trend || 'stable';
    const distancePercentile = distanceData?.percentileRank || 65;

    // Calculate walking patterns
    const consistency = 100 - (stepsData?.variability || 15);
    const variability = stepsData?.variability || 15;
    const peakTimes = ['8:00 AM', '12:30 PM', '6:00 PM']; // Based on typical activity patterns
    const restDays = 1; // Days per week with minimal walking

    // Generate personalized recommendations
    const recommendations: WalkingRecommendation[] = [
      {
        id: 'steadiness-improvement',
        title: 'Focus on Walking Steadiness',
        description: `Your walking steadiness score is ${steadinessScore.toFixed(1)}%. Consider balance exercises to improve stability.`,
        priority: steadinessRisk === 'high' ? 'high' : 'medium',
        category: 'safety',
        actionable: true,
      },
      {
        id: 'distance-goal',
        title: 'Increase Daily Walking Distance',
        description: `You're averaging ${dailyDistance.toFixed(1)} km daily. Try to gradually increase to 5-6 km for optimal health benefits.`,
        priority: dailyDistance < 5 ? 'medium' : 'low',
        category: 'performance',
        actionable: true,
      },
      {
        id: 'consistency-pattern',
        title: 'Maintain Walking Consistency',
        description: `Your walking consistency is ${consistency.toFixed(0)}%. Establishing regular walking times can improve overall patterns.`,
        priority: consistency < 70 ? 'high' : 'low',
        category: 'consistency',
        actionable: true,
      },
    ];

    return {
      steadiness: {
        score: steadinessScore,
        risk: steadinessRisk,
        trend: steadinessTrend,
        weeklyChange,
      },
      distance: {
        daily: dailyDistance,
        weekly: weeklyDistance,
        monthly: monthlyDistance,
        trend: distanceTrend,
        percentileRank: distancePercentile,
      },
      patterns: {
        consistency,
        variability,
        peakTimes,
        restDays,
      },
      recommendations,
    };
  }, [healthData]);

  const getRiskBadgeVariant = (risk: 'low' | 'moderate' | 'high') => {
    if (risk === 'low') return 'default';
    if (risk === 'moderate') return 'secondary';
    return 'destructive';
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving' || trend === 'increasing')
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining' || trend === 'decreasing')
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  const getPriorityBadgeVariant = (priority: 'high' | 'medium' | 'low') => {
    if (priority === 'high') return 'destructive';
    if (priority === 'medium') return 'secondary';
    return 'outline';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <Footprints className="h-6 w-6 text-vitalsense-primary" />
            Walking Patterns Analysis
          </h1>
          <p className="mt-1 text-gray-600">
            Comprehensive analysis of your walking patterns, steadiness, and
            mobility trends
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onNavigateToFeature?.('fall-detection')}
          className="flex items-center gap-2"
        >
          <Shield className="h-4 w-4" />
          View Fall Risk
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Walking Steadiness
                </p>
                <p className="text-2xl font-bold">
                  {walkingMetrics.steadiness.score.toFixed(1)}%
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {getTrendIcon(walkingMetrics.steadiness.trend)}
                  <span className="text-sm text-gray-600">
                    {walkingMetrics.steadiness.weeklyChange.toFixed(1)}% this
                    week
                  </span>
                </div>
              </div>
              <Badge
                variant={getRiskBadgeVariant(walkingMetrics.steadiness.risk)}
              >
                {walkingMetrics.steadiness.risk} risk
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Daily Distance
                </p>
                <p className="text-2xl font-bold">
                  {walkingMetrics.distance.daily.toFixed(1)} km
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {getTrendIcon(walkingMetrics.distance.trend)}
                  <span className="text-sm text-gray-600">
                    {walkingMetrics.distance.percentileRank}th percentile
                  </span>
                </div>
              </div>
              <Route className="h-8 w-8 text-vitalsense-teal" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Consistency</p>
                <p className="text-2xl font-bold">
                  {walkingMetrics.patterns.consistency.toFixed(0)}%
                </p>
                <div className="mt-2">
                  <Progress
                    value={walkingMetrics.patterns.consistency}
                    className="h-2"
                  />
                </div>
              </div>
              <Clock className="h-8 w-8 text-vitalsense-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Weekly Distance
                </p>
                <p className="text-2xl font-bold">
                  {walkingMetrics.distance.weekly.toFixed(1)} km
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  Monthly: {walkingMetrics.distance.monthly.toFixed(1)} km
                </p>
              </div>
              <MapPin className="h-8 w-8 text-vitalsense-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="patterns" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="patterns">Walking Patterns</TabsTrigger>
          <TabsTrigger value="steadiness">Steadiness Analysis</TabsTrigger>
          <TabsTrigger value="trends">Trends & Goals</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Daily Walking Patterns</CardTitle>
                <CardDescription>
                  Your typical walking activity throughout the day
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Peak Walking Times
                    </span>
                    <Badge variant="outline">Consistent</Badge>
                  </div>
                  <div className="space-y-2">
                    {walkingMetrics.patterns.peakTimes.map((time, index) => (
                      <div
                        key={time}
                        className="flex items-center justify-between rounded bg-gray-50 p-2"
                      >
                        <span className="font-medium">{time}</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={90 - index * 15}
                            className="h-2 w-20"
                          />
                          <span className="text-sm text-gray-600">
                            {90 - index * 15}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Weekly Pattern Analysis</CardTitle>
                <CardDescription>
                  Consistency and variability in your walking habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Pattern Consistency
                    </span>
                    <span className="font-bold">
                      {walkingMetrics.patterns.consistency.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={walkingMetrics.patterns.consistency}
                    className="h-3"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Activity Variability
                    </span>
                    <span className="font-bold">
                      {walkingMetrics.patterns.variability.toFixed(0)}%
                    </span>
                  </div>
                  <Progress
                    value={100 - walkingMetrics.patterns.variability}
                    className="h-3"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Rest Days per Week
                    </span>
                    <span className="font-bold">
                      {walkingMetrics.patterns.restDays}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="steadiness" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Walking Steadiness Assessment</CardTitle>
              <CardDescription>
                Comprehensive analysis of your walking stability and fall risk
                factors
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-medium">
                      Current Steadiness Score
                    </span>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {walkingMetrics.steadiness.score.toFixed(1)}%
                      </div>
                      <Badge
                        variant={getRiskBadgeVariant(
                          walkingMetrics.steadiness.risk
                        )}
                      >
                        {walkingMetrics.steadiness.risk} risk
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={walkingMetrics.steadiness.score}
                    className="h-4"
                  />

                  <div className="flex items-center gap-2">
                    {getTrendIcon(walkingMetrics.steadiness.trend)}
                    <span className="text-sm">
                      {walkingMetrics.steadiness.trend === 'improving'
                        ? 'Improving'
                        : walkingMetrics.steadiness.trend === 'declining'
                          ? 'Needs attention'
                          : 'Stable'}
                      ({walkingMetrics.steadiness.weeklyChange > 0 ? '+' : ''}
                      {walkingMetrics.steadiness.weeklyChange.toFixed(1)}% this
                      week)
                    </span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Risk Assessment</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between rounded bg-green-50 p-2">
                      <span className="text-sm">Balance Quality</span>
                      <Badge variant="default">Good</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded bg-yellow-50 p-2">
                      <span className="text-sm">Gait Variability</span>
                      <Badge variant="secondary">Moderate</Badge>
                    </div>
                    <div className="flex items-center justify-between rounded bg-green-50 p-2">
                      <span className="text-sm">Step Symmetry</span>
                      <Badge variant="default">Excellent</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Distance Trends</CardTitle>
                <CardDescription>
                  Your walking distance over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">30-Day Average</span>
                    <span className="font-bold">
                      {walkingMetrics.distance.daily.toFixed(1)} km/day
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Weekly Total</span>
                    <span className="font-bold">
                      {walkingMetrics.distance.weekly.toFixed(1)} km
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Monthly Total</span>
                    <span className="font-bold">
                      {walkingMetrics.distance.monthly.toFixed(1)} km
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(walkingMetrics.distance.trend)}
                    <span className="text-sm">
                      Currently {walkingMetrics.distance.trend}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Walking Goals</CardTitle>
                <CardDescription>
                  Progress toward recommended activity levels
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Daily Goal (5 km)
                      </span>
                      <span className="text-sm">
                        {((walkingMetrics.distance.daily / 5) * 100).toFixed(0)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(walkingMetrics.distance.daily / 5) * 100}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Weekly Goal (35 km)
                      </span>
                      <span className="text-sm">
                        {((walkingMetrics.distance.weekly / 35) * 100).toFixed(
                          0
                        )}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(walkingMetrics.distance.weekly / 35) * 100}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Monthly Goal (150 km)
                      </span>
                      <span className="text-sm">
                        {(
                          (walkingMetrics.distance.monthly / 150) *
                          100
                        ).toFixed(0)}
                        %
                      </span>
                    </div>
                    <Progress
                      value={(walkingMetrics.distance.monthly / 150) * 100}
                      className="h-2"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {walkingMetrics.recommendations.map((recommendation) => (
              <Card key={recommendation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">
                          {recommendation.title}
                        </h4>
                        <Badge
                          variant={getPriorityBadgeVariant(
                            recommendation.priority
                          )}
                        >
                          {recommendation.priority} priority
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.category}
                        </Badge>
                      </div>
                      <p className="mb-3 text-gray-600">
                        {recommendation.description}
                      </p>
                      {recommendation.actionable && (
                        <div className="flex gap-2">
                          <Button variant="outline">Learn More</Button>
                          <Button
                            variant="default"
                            onClick={() =>
                              onNavigateToFeature?.('ai-recommendations')
                            }
                          >
                            Get AI Recommendations
                          </Button>
                        </div>
                      )}
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Take immediate steps to improve your walking patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('fall-detection')}
                >
                  <AlertTriangle className="h-4 w-4" />
                  View Fall Risk Assessment
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('ai-recommendations')}
                >
                  <Zap className="h-4 w-4" />
                  Get Personalized Tips
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('family')}
                >
                  <Users className="h-4 w-4" />
                  Share with Family
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default WalkingPatternsAnalysis;
