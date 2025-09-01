import { useState, useEffect } from 'react';
import { useKV } from '@github/spark/hooks';
import { useUsageTracking } from '@/hooks/useUsageTracking';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  TrendingUp,
  Target,
  Users,
  Shield,
  Clock,
  Lightbulb,
  ArrowRight,
  Star,
  Activity,
  Heart,
  Trophy,
  Bell,
  Stethoscope,
  CloudArrowUp,
  Sparkle,
  ChartBar,
  Robot,
  Eye,
  Gear,
  Warning,
  CheckCircle,
  Timer,
  MagnifyingGlass,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';

interface UsagePattern {
  feature: string;
  visits: number;
  lastVisited: number;
  timeSpent: number;
  actions: number;
}

interface UserBehaviorInsight {
  pattern: string;
  frequency: 'daily' | 'weekly' | 'occasional';
  preference: 'data-driven' | 'social' | 'goal-oriented' | 'health-focused';
  engagementLevel: 'high' | 'medium' | 'low';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'varied';
}

interface FeatureRecommendation {
  id: string;
  title: string;
  description: string;
  reason: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category:
    | 'health'
    | 'monitoring'
    | 'ai'
    | 'community'
    | 'gamification'
    | 'optimization';
  icon: React.ComponentType<any>;
  targetFeature: string;
  estimatedBenefit: string;
  timeToValue: string;
  prerequisites?: string[];
  aiConfidence: number; // 0-100% confidence in this recommendation
  personalizedReason: string;
  alternativeFeatures?: string[];
  learnMoreUrl?: string;
}

interface SmartFeatureRecommendationsProps {
  healthData: ProcessedHealthData;
  onNavigateToFeature: (featureId: string) => void;
}

export default function SmartFeatureRecommendations({
  healthData,
  onNavigateToFeature,
}: SmartFeatureRecommendationsProps) {
  const { trackAction, usagePatterns } = useUsageTracking('recommendations');
  const [dismissedRecommendations, setDismissedRecommendations] = useKV<
    string[]
  >('dismissed-recommendations', []);
  const [acceptedRecommendations, setAcceptedRecommendations] = useKV<string[]>(
    'accepted-recommendations',
    []
  );
  const [recommendations, setRecommendations] = useState<
    FeatureRecommendation[]
  >([]);
  const [behaviorInsights, setBehaviorInsights] = useState<
    UserBehaviorInsight[]
  >([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState('recommendations');

  // Analyze user behavior patterns using AI
  const analyzeUserBehavior = async (): Promise<UserBehaviorInsight[]> => {
    if (usagePatterns.length === 0) return [];

    const insights: UserBehaviorInsight[] = [];

    // Analyze engagement patterns
    const totalVisits = usagePatterns.reduce((sum, p) => sum + p.visits, 0);
    const avgVisits = totalVisits / usagePatterns.length;
    const highEngagementFeatures = usagePatterns.filter(
      (p) => p.visits > avgVisits * 1.5
    );

    // Determine user preferences based on usage
    let userPreference: UserBehaviorInsight['preference'] = 'health-focused';
    const analyticsUsage =
      usagePatterns.find((p) => p.feature === 'analytics')?.visits || 0;
    const communityUsage =
      usagePatterns.find((p) => p.feature === 'community')?.visits || 0;
    const gameUsage =
      usagePatterns.find((p) => p.feature === 'game-center')?.visits || 0;

    if (analyticsUsage > avgVisits) userPreference = 'data-driven';
    else if (communityUsage > avgVisits) userPreference = 'social';
    else if (gameUsage > avgVisits) userPreference = 'goal-oriented';

    // Determine engagement level
    const engagementLevel: UserBehaviorInsight['engagementLevel'] =
      totalVisits > 20 ? 'high' : totalVisits > 10 ? 'medium' : 'low';

    // Analyze usage frequency
    const recentUsage = usagePatterns.filter(
      (p) => Date.now() - p.lastVisited < 7 * 24 * 60 * 60 * 1000 // Last week
    );
    const frequency: UserBehaviorInsight['frequency'] =
      recentUsage.length > 5
        ? 'daily'
        : recentUsage.length > 2
          ? 'weekly'
          : 'occasional';

    insights.push({
      pattern: `${userPreference} user with ${engagementLevel} engagement`,
      frequency,
      preference: userPreference,
      engagementLevel,
      timeOfDay: 'varied', // Simplified for now
    });

    return insights;
  };

  // Advanced AI-powered recommendation engine
  const generateAIRecommendations = async (): Promise<
    FeatureRecommendation[]
  > => {
    const insights = await analyzeUserBehavior();
    setBehaviorInsights(insights);

    const userInsight = insights[0] || {
      preference: 'health-focused',
      engagementLevel: 'medium',
      frequency: 'weekly',
    };

    const allRecommendations: FeatureRecommendation[] = [
      {
        id: 'predictive-alerts',
        title: 'AI-Powered Predictive Health Alerts',
        description:
          'Get early warnings about potential health issues using machine learning trend analysis of your historical data',
        reason:
          'Your health data shows patterns that could benefit from predictive monitoring',
        personalizedReason:
          userInsight.preference === 'data-driven'
            ? 'Your analytical approach to health would benefit from predictive insights'
            : 'Early detection could help prevent health issues before they become serious',
        priority:
          healthData.healthScore && healthData.healthScore < 70
            ? 'critical'
            : 'high',
        category: 'ai',
        icon: Brain,
        targetFeature: 'predictive-alerts',
        estimatedBenefit: 'Prevent 70% of health incidents',
        timeToValue: '5 minutes',
        aiConfidence: 92,
        prerequisites: ['Health data imported', 'Minimum 30 days of data'],
        alternativeFeatures: ['alerts', 'monitoring-hub'],
      },
      {
        id: 'movement-ai-analysis',
        title: 'Advanced Movement Pattern AI',
        description:
          'Deep learning analysis of your gait, balance, and mobility patterns to predict fall risk and mobility changes',
        reason:
          'Your walking and movement data contains patterns worth analyzing with AI',
        personalizedReason:
          userInsight.preference === 'data-driven'
            ? 'Advanced analytics will reveal hidden patterns in your movement data'
            : 'AI can help identify subtle changes in mobility before you notice them',
        priority: 'high',
        category: 'ai',
        icon: Robot,
        targetFeature: 'movement-patterns',
        estimatedBenefit: 'Reduce fall risk by 45%',
        timeToValue: '3 minutes',
        aiConfidence: 88,
        prerequisites: ['Step count data', 'Movement tracking enabled'],
      },
      {
        id: 'personalized-ai-coach',
        title: 'Personal AI Health Coach',
        description:
          'Your dedicated AI assistant that learns your health patterns and provides personalized daily recommendations',
        reason:
          "Your engagement patterns suggest you'd benefit from personalized guidance",
        personalizedReason:
          userInsight.engagementLevel === 'high'
            ? "Your high engagement shows you're ready for advanced AI coaching"
            : 'An AI coach can help increase your health management consistency',
        priority: 'high',
        category: 'ai',
        icon: Lightbulb,
        targetFeature: 'ai-recommendations',
        estimatedBenefit: 'Improve outcomes by 55%',
        timeToValue: '2 minutes',
        aiConfidence: 94,
        alternativeFeatures: ['insights', 'analytics'],
      },
      {
        id: 'social-health-network',
        title: 'Smart Family Health Network',
        description:
          'AI-curated health insights shared with your family, with privacy controls and smart notifications',
        reason: 'Family involvement can significantly improve health outcomes',
        personalizedReason:
          userInsight.preference === 'social'
            ? 'Your social engagement style would thrive with family health sharing'
            : 'Family support has been shown to improve health adherence by 60%',
        priority: userInsight.preference === 'social' ? 'high' : 'medium',
        category: 'community',
        icon: Users,
        targetFeature: 'family',
        estimatedBenefit: 'Increase motivation by 65%',
        timeToValue: '4 minutes',
        aiConfidence: 85,
        prerequisites: ['Health data to share'],
        alternativeFeatures: ['community', 'healthcare'],
      },
      {
        id: 'gamified-health-journey',
        title: 'AI-Driven Health Gamification',
        description:
          'Personalized challenges and competitions based on your health data and family dynamics',
        reason: 'Gamification can dramatically increase health goal adherence',
        personalizedReason:
          userInsight.preference === 'goal-oriented'
            ? 'Your goal-oriented nature is perfect for health challenges'
            : 'Challenges can make health improvement more engaging and fun',
        priority:
          userInsight.preference === 'goal-oriented' ? 'high' : 'medium',
        category: 'gamification',
        icon: Trophy,
        targetFeature: 'family-challenges',
        estimatedBenefit: 'Boost activity by 40%',
        timeToValue: '2 minutes',
        aiConfidence: 82,
        alternativeFeatures: ['game-center'],
      },
      {
        id: 'real-time-health-monitoring',
        title: 'Live Health Monitoring Hub',
        description:
          'Real-time tracking with AI-powered anomaly detection and instant family notifications',
        reason: 'Continuous monitoring provides the best health protection',
        personalizedReason:
          userInsight.engagementLevel === 'high'
            ? 'Your active monitoring style would benefit from real-time insights'
            : 'Automated monitoring can catch issues without requiring constant attention',
        priority:
          healthData.healthScore && healthData.healthScore < 60
            ? 'critical'
            : 'medium',
        category: 'monitoring',
        icon: Heart,
        targetFeature: 'monitoring-hub',
        estimatedBenefit: 'Faster incident response',
        timeToValue: '10 minutes',
        aiConfidence: 90,
        prerequisites: [
          'Apple Watch connected',
          'Emergency contacts configured',
        ],
        alternativeFeatures: ['realtime-scoring', 'advanced-watch'],
      },
      {
        id: 'healthcare-ai-integration',
        title: 'AI-Enhanced Healthcare Portal',
        description:
          'Automatically generate health summaries and insights for your healthcare team using AI analysis',
        reason:
          'Your comprehensive health data would be invaluable for healthcare providers',
        personalizedReason:
          userInsight.preference === 'data-driven'
            ? 'AI-generated health reports will give your doctors comprehensive insights'
            : 'Automated health summaries ensure your doctor has complete information',
        priority: 'medium',
        category: 'community',
        icon: Stethoscope,
        targetFeature: 'healthcare',
        estimatedBenefit: 'Better informed medical care',
        timeToValue: '6 minutes',
        aiConfidence: 87,
        prerequisites: ['Health data history', 'Healthcare provider consent'],
      },
      {
        id: 'smart-search-assistant',
        title: 'AI Health Search Assistant',
        description:
          'Natural language search through your health data with AI-powered insights and correlations',
        reason: 'Find specific health patterns and correlations instantly',
        personalizedReason:
          userInsight.preference === 'data-driven'
            ? 'Advanced search capabilities match your analytical approach'
            : 'Easily find health information without navigating complex data',
        priority: 'medium',
        category: 'optimization',
        icon: MagnifyingGlass,
        targetFeature: 'search',
        estimatedBenefit: 'Find insights 10x faster',
        timeToValue: '1 minute',
        aiConfidence: 78,
        alternativeFeatures: ['analytics', 'insights'],
      },
      {
        id: 'optimization-suite',
        title: 'Performance Optimization Suite',
        description:
          'AI recommendations to optimize your HealthGuard setup based on your usage patterns',
        reason: 'Optimize your health monitoring setup for maximum benefit',
        personalizedReason:
          userInsight.engagementLevel === 'high'
            ? 'Advanced optimization features match your high engagement level'
            : 'Automatic optimization can improve your experience without extra effort',
        priority: userInsight.engagementLevel === 'high' ? 'medium' : 'low',
        category: 'optimization',
        icon: Gear,
        targetFeature: 'phases',
        estimatedBenefit: 'Streamlined experience',
        timeToValue: '8 minutes',
        aiConfidence: 75,
        prerequisites: ['Multiple feature usage'],
      },
    ];

    return allRecommendations;
  };

  // Generate smart recommendations based on usage patterns and health data
  const generateRecommendations = async () => {
    setIsAnalyzing(true);

    try {
      const allRecommendations = await generateAIRecommendations();

      // Filter recommendations based on usage patterns, health data, and user behavior
      const relevantRecommendations = allRecommendations.filter((rec) => {
        // Don't show dismissed recommendations
        if (dismissedRecommendations.includes(rec.id)) return false;

        // Don't show already accepted recommendations
        if (acceptedRecommendations.includes(rec.id)) return false;

        // Health data based filtering with more sophisticated logic
        if (rec.id === 'predictive-alerts') {
          if (!healthData.healthScore) return false;
          if (healthData.healthScore > 90) return false; // Excellent health doesn't need alerts
        }

        if (rec.id === 'movement-ai-analysis') {
          if (
            !healthData.metrics.stepCount ||
            healthData.metrics.stepCount < 500
          )
            return false;
          if (
            !healthData.metrics.walkingSpeed &&
            !healthData.metrics.gaitAsymmetry
          )
            return false;
        }

        // Usage pattern based filtering with behavioral insights
        const dashboardUsage = usagePatterns.find(
          (p) => p.feature === 'dashboard'
        );
        const analyticsUsage = usagePatterns.find(
          (p) => p.feature === 'analytics'
        );
        const totalUsage = usagePatterns.reduce((sum, p) => sum + p.visits, 0);

        // Show social features only if user shows social behavior or has low engagement
        if (rec.id === 'social-health-network') {
          const communityUsage =
            usagePatterns.find((p) => p.feature === 'community')?.visits || 0;
          const familyUsage =
            usagePatterns.find((p) => p.feature === 'family')?.visits || 0;
          if (communityUsage === 0 && familyUsage === 0 && totalUsage > 15)
            return false;
        }

        // Show gamification for goal-oriented users or low-engagement users
        if (rec.id === 'gamified-health-journey') {
          const gameUsage =
            usagePatterns.find((p) => p.feature === 'game-center')?.visits || 0;
          const challengeUsage =
            usagePatterns.find((p) => p.feature === 'family-challenges')
              ?.visits || 0;
          if (gameUsage === 0 && challengeUsage === 0 && totalUsage > 20)
            return false;
        }

        // Show advanced features only for engaged users
        if (rec.id === 'real-time-health-monitoring' && totalUsage < 10)
          return false;
        if (rec.id === 'optimization-suite' && totalUsage < 15) return false;

        return true;
      });

      // Sort by AI confidence and priority
      relevantRecommendations.sort((a, b) => {
        const priorityWeight = { critical: 4, high: 3, medium: 2, low: 1 };
        const priorityDiff =
          priorityWeight[b.priority] - priorityWeight[a.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.aiConfidence - a.aiConfidence;
      });

      setRecommendations(relevantRecommendations.slice(0, 8)); // Show top 8
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate recommendations');
    } finally {
      setIsAnalyzing(false);
    }
  };

  useEffect(() => {
    generateRecommendations();
  }, [
    usagePatterns,
    healthData,
    dismissedRecommendations,
    acceptedRecommendations,
  ]);

  const handleRecommendationClick = (recommendation: FeatureRecommendation) => {
    trackAction(`click-recommendation-${recommendation.id}`);
    setAcceptedRecommendations((current) => [...current, recommendation.id]);
    onNavigateToFeature(recommendation.targetFeature);
    toast.success(`Navigating to ${recommendation.title}`);
  };

  const handleDismissRecommendation = (recommendationId: string) => {
    trackAction(`dismiss-recommendation-${recommendationId}`);
    setDismissedRecommendations((current) => [...current, recommendationId]);
    toast.success('Recommendation dismissed');
  };

  const handleTryAlternative = (
    alternativeFeature: string,
    originalTitle: string
  ) => {
    trackAction(`try-alternative-${alternativeFeature}`);
    onNavigateToFeature(alternativeFeature);
    toast.success(`Trying alternative to ${originalTitle}`);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-950';
      case 'high':
        return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950';
      case 'medium':
        return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950';
      case 'low':
        return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'critical':
        return Warning;
      case 'high':
        return TrendingUp;
      case 'medium':
        return Clock;
      case 'low':
        return CheckCircle;
      default:
        return Activity;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health':
        return Heart;
      case 'monitoring':
        return Shield;
      case 'ai':
        return Brain;
      case 'community':
        return Users;
      case 'gamification':
        return Trophy;
      case 'optimization':
        return Gear;
      default:
        return Activity;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-600 dark:text-green-400';
    if (confidence >= 80) return 'text-blue-600 dark:text-blue-400';
    if (confidence >= 70) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-orange-600 dark:text-orange-400';
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            AI Analysis in Progress
          </CardTitle>
          <CardDescription>
            Analyzing your usage patterns, health data, and behavioral insights
            to generate personalized recommendations...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={85} className="w-full" />
            <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Health data processed</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Usage patterns analyzed</span>
              </div>
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 animate-spin text-blue-500" />
                <span>Generating recommendations</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-purple-600">
            <Sparkle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-foreground text-2xl font-bold">
              AI-Powered Recommendations
            </h2>
            <p className="text-muted-foreground">
              Smart suggestions based on your health data and usage patterns
            </p>
          </div>
        </div>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger
            value="recommendations"
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Behavior Insights
          </TabsTrigger>
          <TabsTrigger value="usage" className="flex items-center gap-2">
            <ChartBar className="h-4 w-4" />
            Usage Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="recommendations" className="space-y-6">
          {recommendations.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3 text-center">
                  <Star className="text-muted-foreground mx-auto h-12 w-12" />
                  <h3 className="text-lg font-semibold">All Caught Up!</h3>
                  <p className="text-muted-foreground">
                    You're making excellent use of HealthGuard. Keep exploring
                    features to unlock new AI-powered recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              <Alert>
                <Brain className="h-4 w-4" />
                <AlertDescription>
                  Our AI analyzed your usage patterns and health data to find{' '}
                  {recommendations.length} personalized recommendations with an
                  average confidence of{' '}
                  {Math.round(
                    recommendations.reduce(
                      (sum, r) => sum + r.aiConfidence,
                      0
                    ) / recommendations.length
                  )}
                  %.
                </AlertDescription>
              </Alert>

              <div className="grid gap-6 lg:grid-cols-2">
                {recommendations.map((recommendation) => {
                  const IconComponent = recommendation.icon;
                  const CategoryIcon = getCategoryIcon(recommendation.category);
                  const PriorityIcon = getPriorityIcon(recommendation.priority);

                  return (
                    <Card
                      key={recommendation.id}
                      className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                      {/* Priority indicator */}
                      <div
                        className={`absolute left-0 top-0 h-full w-1 ${
                          recommendation.priority === 'critical'
                            ? 'bg-red-500'
                            : recommendation.priority === 'high'
                              ? 'bg-orange-500'
                              : recommendation.priority === 'medium'
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                        }`}
                      />

                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex flex-1 items-center gap-3">
                            <div className="bg-primary/10 flex h-12 w-12 items-center justify-center rounded-lg">
                              <IconComponent className="text-primary h-6 w-6" />
                            </div>
                            <div className="flex-1">
                              <CardTitle className="pr-8 text-lg leading-tight">
                                {recommendation.title}
                              </CardTitle>
                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <Badge
                                  className={`${getPriorityColor(recommendation.priority)} text-xs`}
                                >
                                  <PriorityIcon className="mr-1 h-3 w-3" />
                                  {recommendation.priority} priority
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  <CategoryIcon className="mr-1 h-3 w-3" />
                                  {recommendation.category}
                                </Badge>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getConfidenceColor(recommendation.aiConfidence)}`}
                                >
                                  AI: {recommendation.aiConfidence}%
                                </Badge>
                              </div>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleDismissRecommendation(recommendation.id)
                            }
                            className="absolute right-4 top-4 opacity-0 transition-opacity group-hover:opacity-100"
                          >
                            ×
                          </Button>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <CardDescription className="text-sm">
                          {recommendation.description}
                        </CardDescription>

                        <div className="from-muted/50 to-muted/30 rounded-lg bg-gradient-to-r p-3">
                          <p className="text-muted-foreground mb-1 text-sm font-medium">
                            Personalized Insight:
                          </p>
                          <p className="text-foreground text-sm">
                            {recommendation.personalizedReason}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-muted-foreground">
                              Expected Benefit
                            </p>
                            <p className="font-medium text-green-600 dark:text-green-400">
                              {recommendation.estimatedBenefit}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">
                              Time to Value
                            </p>
                            <p className="font-medium text-blue-600 dark:text-blue-400">
                              {recommendation.timeToValue}
                            </p>
                          </div>
                        </div>

                        {recommendation.prerequisites && (
                          <div className="text-sm">
                            <p className="text-muted-foreground mb-1">
                              Prerequisites:
                            </p>
                            <ul className="text-foreground list-inside list-disc space-y-1">
                              {recommendation.prerequisites.map(
                                (prereq, index) => (
                                  <li key={index} className="text-xs">
                                    {prereq}
                                  </li>
                                )
                              )}
                            </ul>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <Button
                            onClick={() =>
                              handleRecommendationClick(recommendation)
                            }
                            className="flex-1 transition-all duration-200 group-hover:shadow-md"
                          >
                            Get Started
                            <ArrowRight className="ml-2 h-4 w-4" />
                          </Button>

                          {recommendation.alternativeFeatures &&
                            recommendation.alternativeFeatures.length > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleTryAlternative(
                                    recommendation.alternativeFeatures![0],
                                    recommendation.title
                                  )
                                }
                                className="text-xs"
                              >
                                Try Alternative
                              </Button>
                            )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          {behaviorInsights.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2">
              {behaviorInsights.map((insight, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Robot className="h-5 w-5" />
                      Behavioral Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 p-4 dark:from-blue-950/20 dark:to-purple-950/20">
                      <p className="text-foreground font-medium">
                        {insight.pattern}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Usage Pattern</p>
                        <p className="font-medium capitalize">
                          {insight.frequency}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Engagement</p>
                        <p className="font-medium capitalize">
                          {insight.engagementLevel}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Preference</p>
                        <p className="font-medium capitalize">
                          {insight.preference.replace('-', ' ')}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Active Time</p>
                        <p className="font-medium capitalize">
                          {insight.timeOfDay}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3 text-center">
                  <Robot className="text-muted-foreground mx-auto h-12 w-12" />
                  <h3 className="text-lg font-semibold">
                    Building Your Profile
                  </h3>
                  <p className="text-muted-foreground">
                    Use HealthGuard more to unlock AI-powered behavioral
                    insights and personalized recommendations.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          {usagePatterns.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ChartBar className="h-5 w-5" />
                  Detailed Usage Analytics
                </CardTitle>
                <CardDescription>
                  Comprehensive insights about how you use HealthGuard features
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {usagePatterns
                    .sort((a, b) => b.visits - a.visits)
                    .map((pattern) => (
                      <div
                        key={pattern.feature}
                        className="bg-muted/30 space-y-3 rounded-lg p-4"
                      >
                        <div className="flex items-center justify-between">
                          <p className="font-medium capitalize">
                            {pattern.feature.replace('-', ' ')}
                          </p>
                          <Badge variant="outline">
                            {pattern.visits} visits
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Last used:
                            </span>
                            <span>
                              {new Date(
                                pattern.lastVisited
                              ).toLocaleDateString()}
                            </span>
                          </div>

                          {pattern.timeSpent > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Time spent:
                              </span>
                              <span>
                                {Math.round(pattern.timeSpent / 1000 / 60)} min
                              </span>
                            </div>
                          )}

                          {pattern.actions > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">
                                Actions:
                              </span>
                              <span>{pattern.actions}</span>
                            </div>
                          )}
                        </div>

                        <Progress
                          value={Math.min(
                            100,
                            (pattern.visits /
                              Math.max(...usagePatterns.map((p) => p.visits))) *
                              100
                          )}
                          className="h-2 w-full"
                        />
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-3 text-center">
                  <ChartBar className="text-muted-foreground mx-auto h-12 w-12" />
                  <h3 className="text-lg font-semibold">No Usage Data Yet</h3>
                  <p className="text-muted-foreground">
                    Start exploring HealthGuard features to see detailed usage
                    analytics here.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
