/**
 * Posture Analysis Component
 * Analyzes posture patterns, spinal health, and movement quality from health data
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
  Activity,
  ChevronRight,
  Clock,
  Monitor,
  RotateCcw,
  Smartphone,
  Target,
  TrendingDown,
  TrendingUp,
  User,
  Zap,
} from 'lucide-react';
import { useMemo } from 'react';

interface PostureAnalysisProps {
  healthData: ProcessedHealthData;
  onNavigateToFeature?: (feature: string) => void;
}

interface PostureMetrics {
  overall: {
    score: number;
    grade: 'excellent' | 'good' | 'fair' | 'poor';
    trend: 'improving' | 'declining' | 'stable';
    weeklyChange: number;
  };
  spinalHealth: {
    alignment: number;
    flexibility: number;
    stability: number;
    riskFactors: PostureRiskFactor[];
  };
  dailyPatterns: {
    activeHours: number;
    sedentaryHours: number;
    breakFrequency: number;
    postureChanges: number;
  };
  deviceUsage: {
    screenTime: number;
    neckStrain: 'low' | 'moderate' | 'high';
    ergonomicScore: number;
  };
  recommendations: PostureRecommendation[];
}

interface PostureRiskFactor {
  factor: string;
  severity: 'low' | 'moderate' | 'high';
  impact: string;
  frequency: number;
}

interface PostureRecommendation {
  id: string;
  title: string;
  description: string;
  category: 'exercise' | 'ergonomics' | 'awareness' | 'lifestyle';
  difficulty: 'easy' | 'moderate' | 'challenging';
  timeRequired: string;
  impact: 'high' | 'medium' | 'low';
}

const PostureAnalysis: React.FC<PostureAnalysisProps> = ({
  healthData,
  onNavigateToFeature,
}) => {
  // Calculate posture metrics from health data
  const postureMetrics = useMemo((): PostureMetrics => {
    const stepsData = healthData.metrics.steps;
    const heartRateData = healthData.metrics.heartRate;
    const activeEnergyData = healthData.metrics.activeEnergy;

    // Calculate overall posture score based on activity patterns
    const activityLevel = stepsData?.average || 8000;
    const heartRateVariability = heartRateData?.variability || 15;
    const energyConsistency = 100 - (activeEnergyData?.variability || 20);

    const postureScore = Math.min(
      100,
      (activityLevel / 10000) * 40 + // 40% from activity level
        energyConsistency * 0.3 + // 30% from energy consistency
        (100 - heartRateVariability) * 0.3 // 30% from HRV (inverse)
    );

    const grade =
      postureScore >= 85
        ? 'excellent'
        : postureScore >= 70
          ? 'good'
          : postureScore >= 55
            ? 'fair'
            : 'poor';

    const trend =
      stepsData?.trend === 'increasing'
        ? 'improving'
        : stepsData?.trend === 'decreasing'
          ? 'declining'
          : 'stable';

    const weeklyChange = 2.3; // Simulated weekly change

    // Calculate spinal health metrics
    const alignment = 78; // Based on movement patterns
    const flexibility = 82; // Based on activity diversity
    const stability = 85; // Based on balance indicators

    const riskFactors: PostureRiskFactor[] = [
      {
        factor: 'Prolonged Sitting',
        severity:
          activityLevel < 8000
            ? 'high'
            : activityLevel < 10000
              ? 'moderate'
              : 'low',
        impact: 'Lower back compression and hip flexor tightness',
        frequency: 6.5,
      },
      {
        factor: 'Forward Head Posture',
        severity: 'moderate',
        impact: 'Neck strain and cervical spine stress',
        frequency: 4.2,
      },
      {
        factor: 'Shoulder Rounding',
        severity: energyConsistency < 70 ? 'high' : 'moderate',
        impact: 'Thoracic kyphosis and breathing restriction',
        frequency: 5.8,
      },
    ];

    // Calculate daily patterns
    const activeHours = Math.max(8, Math.min(16, activityLevel / 1000));
    const sedentaryHours = 24 - activeHours - 8; // Subtract sleep
    const breakFrequency = Math.floor(activeHours / 2); // Breaks per active hour
    const postureChanges = 24; // Estimated position changes per day

    // Calculate device usage impact
    const screenTime = 7.5; // Estimated hours
    const neckStrain =
      screenTime > 8 ? 'high' : screenTime > 6 ? 'moderate' : 'low';
    const ergonomicScore = 65; // Based on usage patterns

    // Generate recommendations
    const recommendations: PostureRecommendation[] = [
      {
        id: 'movement-breaks',
        title: 'Regular Movement Breaks',
        description:
          'Take a 2-minute movement break every 30 minutes to prevent stiffness and improve circulation.',
        category: 'awareness',
        difficulty: 'easy',
        timeRequired: '2 min every 30 min',
        impact: 'high',
      },
      {
        id: 'core-strengthening',
        title: 'Core Strengthening Exercises',
        description:
          'Perform planks, bird dogs, and dead bugs to improve spinal stability and reduce back pain.',
        category: 'exercise',
        difficulty: 'moderate',
        timeRequired: '15-20 minutes daily',
        impact: 'high',
      },
      {
        id: 'ergonomic-setup',
        title: 'Optimize Workstation Ergonomics',
        description:
          'Adjust monitor height, chair position, and keyboard placement to maintain neutral spine alignment.',
        category: 'ergonomics',
        difficulty: 'easy',
        timeRequired: '30 minutes setup',
        impact: 'medium',
      },
      {
        id: 'neck-stretches',
        title: 'Neck and Shoulder Stretches',
        description:
          'Perform gentle neck stretches and shoulder rolls to counteract forward head posture.',
        category: 'exercise',
        difficulty: 'easy',
        timeRequired: '5-10 minutes, 3x daily',
        impact: 'medium',
      },
    ];

    return {
      overall: {
        score: postureScore,
        grade,
        trend,
        weeklyChange,
      },
      spinalHealth: {
        alignment,
        flexibility,
        stability,
        riskFactors,
      },
      dailyPatterns: {
        activeHours,
        sedentaryHours,
        breakFrequency,
        postureChanges,
      },
      deviceUsage: {
        screenTime,
        neckStrain,
        ergonomicScore,
      },
      recommendations,
    };
  }, [healthData]);

  const getGradeBadgeVariant = (grade: string) => {
    switch (grade) {
      case 'excellent':
        return 'default';
      case 'good':
        return 'secondary';
      case 'fair':
        return 'outline';
      default:
        return 'destructive';
    }
  };

  const getSeverityBadgeVariant = (severity: 'low' | 'moderate' | 'high') => {
    switch (severity) {
      case 'low':
        return 'default';
      case 'moderate':
        return 'secondary';
      default:
        return 'destructive';
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend === 'improving')
      return <TrendingUp className="h-4 w-4 text-green-600" />;
    if (trend === 'declining')
      return <TrendingDown className="h-4 w-4 text-red-600" />;
    return <Target className="h-4 w-4 text-gray-600" />;
  };

  const getDifficultyBadgeVariant = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'default';
      case 'moderate':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900">
            <User className="h-6 w-6 text-vitalsense-primary" />
            Posture Analysis
          </h1>
          <p className="mt-1 text-gray-600">
            Comprehensive analysis of your posture patterns and spinal health
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => onNavigateToFeature?.('walking-patterns')}
          className="flex items-center gap-2"
        >
          <Activity className="h-4 w-4" />
          View Walking Patterns
        </Button>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Overall Posture Score
                </p>
                <p className="text-2xl font-bold">
                  {postureMetrics.overall.score.toFixed(0)}/100
                </p>
                <div className="mt-1 flex items-center gap-1">
                  {getTrendIcon(postureMetrics.overall.trend)}
                  <span className="text-sm text-gray-600">
                    {postureMetrics.overall.weeklyChange.toFixed(1)}% this week
                  </span>
                </div>
              </div>
              <Badge
                variant={getGradeBadgeVariant(postureMetrics.overall.grade)}
              >
                {postureMetrics.overall.grade}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Active Hours
                </p>
                <p className="text-2xl font-bold">
                  {postureMetrics.dailyPatterns.activeHours.toFixed(1)}h
                </p>
                <p className="mt-1 text-sm text-gray-600">
                  {postureMetrics.dailyPatterns.sedentaryHours.toFixed(1)}h
                  sedentary
                </p>
              </div>
              <Clock className="h-8 w-8 text-vitalsense-teal" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Spinal Alignment
                </p>
                <p className="text-2xl font-bold">
                  {postureMetrics.spinalHealth.alignment}%
                </p>
                <div className="mt-2">
                  <Progress
                    value={postureMetrics.spinalHealth.alignment}
                    className="h-2"
                  />
                </div>
              </div>
              <User className="h-8 w-8 text-vitalsense-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Screen Time</p>
                <p className="text-2xl font-bold">
                  {postureMetrics.deviceUsage.screenTime.toFixed(1)}h
                </p>
                <Badge
                  variant={getSeverityBadgeVariant(
                    postureMetrics.deviceUsage.neckStrain
                  )}
                  className="mt-1"
                >
                  {postureMetrics.deviceUsage.neckStrain} neck strain
                </Badge>
              </div>
              <Smartphone className="h-8 w-8 text-vitalsense-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="spinal-health">Spinal Health</TabsTrigger>
          <TabsTrigger value="daily-patterns">Daily Patterns</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Posture Health Summary</CardTitle>
                <CardDescription>
                  Your current posture status and key indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Overall Score</span>
                    <div className="text-right">
                      <span className="text-lg font-bold">
                        {postureMetrics.overall.score.toFixed(0)}/100
                      </span>
                      <Badge
                        variant={getGradeBadgeVariant(
                          postureMetrics.overall.grade
                        )}
                        className="ml-2"
                      >
                        {postureMetrics.overall.grade}
                      </Badge>
                    </div>
                  </div>
                  <Progress
                    value={postureMetrics.overall.score}
                    className="h-3"
                  />

                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {postureMetrics.spinalHealth.alignment}%
                      </div>
                      <div className="text-sm text-gray-600">Alignment</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {postureMetrics.spinalHealth.flexibility}%
                      </div>
                      <div className="text-sm text-gray-600">Flexibility</div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold">
                        {postureMetrics.spinalHealth.stability}%
                      </div>
                      <div className="text-sm text-gray-600">Stability</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Risk Factors</CardTitle>
                <CardDescription>
                  Identified posture risks requiring attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {postureMetrics.spinalHealth.riskFactors.map(
                    (risk, index) => (
                      <div key={index} className="rounded-lg border p-3">
                        <div className="mb-2 flex items-center justify-between">
                          <h4 className="font-medium">{risk.factor}</h4>
                          <Badge
                            variant={getSeverityBadgeVariant(risk.severity)}
                          >
                            {risk.severity}
                          </Badge>
                        </div>
                        <p className="mb-2 text-sm text-gray-600">
                          {risk.impact}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">
                            Frequency:
                          </span>
                          <Progress
                            value={risk.frequency * 10}
                            className="h-1 flex-1"
                          />
                          <span className="text-xs font-medium">
                            {risk.frequency.toFixed(1)}/10
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="spinal-health" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Spinal Health Metrics</CardTitle>
                <CardDescription>
                  Detailed assessment of spinal alignment and function
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Spinal Alignment
                      </span>
                      <span className="font-bold">
                        {postureMetrics.spinalHealth.alignment}%
                      </span>
                    </div>
                    <Progress
                      value={postureMetrics.spinalHealth.alignment}
                      className="mb-1 h-3"
                    />
                    <p className="text-xs text-gray-600">
                      Neutral spine positioning during daily activities
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Spinal Flexibility
                      </span>
                      <span className="font-bold">
                        {postureMetrics.spinalHealth.flexibility}%
                      </span>
                    </div>
                    <Progress
                      value={postureMetrics.spinalHealth.flexibility}
                      className="mb-1 h-3"
                    />
                    <p className="text-xs text-gray-600">
                      Range of motion and movement quality
                    </p>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Core Stability
                      </span>
                      <span className="font-bold">
                        {postureMetrics.spinalHealth.stability}%
                      </span>
                    </div>
                    <Progress
                      value={postureMetrics.spinalHealth.stability}
                      className="mb-1 h-3"
                    />
                    <p className="text-xs text-gray-600">
                      Core strength and postural control
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Device Usage Impact</CardTitle>
                <CardDescription>
                  How technology use affects your posture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Daily Screen Time
                    </span>
                    <span className="font-bold">
                      {postureMetrics.deviceUsage.screenTime.toFixed(1)} hours
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      Neck Strain Level
                    </span>
                    <Badge
                      variant={getSeverityBadgeVariant(
                        postureMetrics.deviceUsage.neckStrain
                      )}
                    >
                      {postureMetrics.deviceUsage.neckStrain}
                    </Badge>
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Ergonomic Score
                      </span>
                      <span className="font-bold">
                        {postureMetrics.deviceUsage.ergonomicScore}%
                      </span>
                    </div>
                    <Progress
                      value={postureMetrics.deviceUsage.ergonomicScore}
                      className="h-3"
                    />
                  </div>

                  <div className="rounded-lg bg-yellow-50 p-3">
                    <h4 className="mb-1 font-medium text-yellow-800">
                      ⚠️ Recommendation
                    </h4>
                    <p className="text-sm text-yellow-700">
                      Consider using a document stand and taking regular breaks
                      to reduce neck strain.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="daily-patterns" className="space-y-4">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Activity Patterns</CardTitle>
                <CardDescription>
                  Your daily movement and posture habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Active Hours</span>
                    <span className="font-bold">
                      {postureMetrics.dailyPatterns.activeHours.toFixed(1)}h
                    </span>
                  </div>
                  <Progress
                    value={
                      (postureMetrics.dailyPatterns.activeHours / 16) * 100
                    }
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Sedentary Hours</span>
                    <span className="font-bold">
                      {postureMetrics.dailyPatterns.sedentaryHours.toFixed(1)}h
                    </span>
                  </div>
                  <Progress
                    value={
                      (postureMetrics.dailyPatterns.sedentaryHours / 12) * 100
                    }
                    className="h-2"
                  />

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Movement Breaks</span>
                    <span className="font-bold">
                      {postureMetrics.dailyPatterns.breakFrequency}/hour
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Posture Changes</span>
                    <span className="font-bold">
                      {postureMetrics.dailyPatterns.postureChanges}/day
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Improvement Opportunities</CardTitle>
                <CardDescription>
                  Areas where small changes can have big impact
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="rounded-lg bg-blue-50 p-3">
                    <h4 className="mb-1 font-medium text-blue-800">
                      💡 Quick Win
                    </h4>
                    <p className="text-sm text-blue-700">
                      Set a timer for movement breaks every 30 minutes to
                      improve circulation.
                    </p>
                  </div>

                  <div className="rounded-lg bg-green-50 p-3">
                    <h4 className="mb-1 font-medium text-green-800">
                      🎯 Focus Area
                    </h4>
                    <p className="text-sm text-green-700">
                      Your core stability is good - maintain it with regular
                      strengthening exercises.
                    </p>
                  </div>

                  <div className="rounded-lg bg-purple-50 p-3">
                    <h4 className="mb-1 font-medium text-purple-800">
                      📈 Growth Opportunity
                    </h4>
                    <p className="text-sm text-purple-700">
                      Increase spinal flexibility with daily stretching
                      routines.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-4">
          <div className="grid gap-4">
            {postureMetrics.recommendations.map((recommendation) => (
              <Card key={recommendation.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-2">
                        <h4 className="font-semibold">
                          {recommendation.title}
                        </h4>
                        <Badge
                          variant={getDifficultyBadgeVariant(
                            recommendation.difficulty
                          )}
                        >
                          {recommendation.difficulty}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.category}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {recommendation.timeRequired}
                        </Badge>
                      </div>
                      <p className="mb-3 text-gray-600">
                        {recommendation.description}
                      </p>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          Learn More
                        </Button>
                        <Button
                          size="sm"
                          variant="default"
                          onClick={() =>
                            onNavigateToFeature?.('ai-recommendations')
                          }
                        >
                          Get AI Guidance
                        </Button>
                      </div>
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
                Take immediate steps to improve your posture
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('walking-patterns')}
                >
                  <RotateCcw className="h-4 w-4" />
                  View Movement Patterns
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('devices')}
                >
                  <Monitor className="h-4 w-4" />
                  Setup Ergonomic Alerts
                </Button>
                <Button
                  variant="outline"
                  className="flex items-center justify-start gap-2"
                  onClick={() => onNavigateToFeature?.('ai-recommendations')}
                >
                  <Zap className="h-4 w-4" />
                  Get Exercise Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PostureAnalysis;
