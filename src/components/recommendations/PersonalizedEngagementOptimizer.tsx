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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedHealthData } from '@/types';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Lightbulb,
  Sparkles,
  Target,
  Timer,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface EngagementPattern {
  timeOfDay: string;
  frequency: number;
  duration: number;
  features: string[];
  effectiveness: number;
}

interface PersonalizationProfile {
  preferredTime: string;
  engagementStyle: 'data-driven' | 'goal-oriented' | 'social' | 'gamified';
  motivationTriggers: string[];
  attentionSpan: 'short' | 'medium' | 'long';
  learningPreference: 'visual' | 'analytical' | 'interactive';
}

interface OptimizationRecommendation {
  id: string;
  type: 'timing' | 'content' | 'interaction' | 'motivation' | 'workflow';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  expectedImpact: number;
  timeToImplement: string;
  actions: string[];
  implemented: boolean;
}

type RecommendationType = OptimizationRecommendation['type'];
type RecommendationPriority = OptimizationRecommendation['priority'];

interface Props {
  healthData: ProcessedHealthData;
  onNavigateToFeature: (featureId: string) => void;
}

export default function PersonalizedEngagementOptimizer({
  healthData,
  onNavigateToFeature,
}: Readonly<Props>) {
  const [engagementData, setEngagementData] = useKV<{
    sessions: unknown[];
    patterns: EngagementPattern[];
    profile: PersonalizationProfile | null;
  }>('engagement-data', {
    sessions: [],
    patterns: [],
    profile: null,
  });
  const [recommendations, setRecommendations] = useKV<
    OptimizationRecommendation[]
  >('engagement-recommendations', []);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Safe fallbacks for KV values to satisfy strict typing
  const defaultEngagement: { sessions: unknown[]; patterns: EngagementPattern[]; profile: PersonalizationProfile | null } = {
    sessions: [],
    patterns: [],
    profile: null,
  };
  const currentEngagement = engagementData ?? defaultEngagement;
  const currentRecommendations = recommendations ?? [];

  // Generate personalized recommendations using LLM (if available) with a safe fallback
  const generateRecommendations = useCallback(async (
    patterns: EngagementPattern[],
    profile: PersonalizationProfile
  ): Promise<void> => {
    try {
      // Use Spark LLM if available; otherwise fall back
      interface SparkLike {
        llm: (prompt: string, model?: string, stream?: boolean) => Promise<string>;
        llmPrompt: (template: TemplateStringsArray, ...subs: unknown[]) => string;
      }
      const s = (globalThis as { spark?: SparkLike }).spark;
      if (!s) {
        throw new Error('Spark LLM not available');
      }

      const prompt = s.llmPrompt`
        Based on this user's engagement patterns and profile, generate 8-10 personalized optimization recommendations:

        Engagement Patterns: ${JSON.stringify(patterns)}
        User Profile: ${JSON.stringify(profile)}
        Health Data Score: ${healthData.healthScore || 0}

        Generate recommendations that focus on:
        1. Optimal timing for health monitoring
        2. Content personalization based on engagement style
        3. Interaction improvements for attention span
        4. Motivation triggers alignment
        5. Workflow optimization

        Return as JSON array with: id, type, priority, title, description, expectedImpact (0-100), timeToImplement, actions (array), implemented (false)
      `;

      const response = await s.llm(prompt, 'gpt-4o', true);
      const newRecommendations = JSON.parse(response) as OptimizationRecommendation[];
      setRecommendations(newRecommendations);
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback recommendations
      const fallbackRecommendations: OptimizationRecommendation[] = [
        {
          id: 'timing-1',
          type: 'timing',
          priority: 'high',
          title: 'Optimize Morning Health Check',
          description:
            'Your engagement is highest in the morning. Set up automated daily health summaries at 8 AM.',
          expectedImpact: 85,
          timeToImplement: '5 minutes',
          actions: [
            'Enable morning notifications',
            'Customize dashboard priority',
            'Set health score alerts',
          ],
          implemented: false,
        },
        {
          id: 'content-1',
          type: 'content',
          priority: 'high',
          title: 'Data-Driven Dashboard Focus',
          description:
            'Emphasize analytical insights and trends to match your data-driven engagement style.',
          expectedImpact: 78,
          timeToImplement: '2 minutes',
          actions: [
            'Prioritize analytics widgets',
            'Add trend comparisons',
            'Enable detailed metrics',
          ],
          implemented: false,
        },
        {
          id: 'interaction-1',
          type: 'interaction',
          priority: 'medium',
          title: 'Medium-Depth Content Chunks',
          description:
            'Break complex analyses into 10-15 minute digestible sections for optimal attention span.',
          expectedImpact: 72,
          timeToImplement: '1 minute',
          actions: [
            'Enable progressive disclosure',
            'Add reading time estimates',
            'Create summary cards',
          ],
          implemented: false,
        },
        {
          id: 'motivation-1',
          type: 'motivation',
          priority: 'high',
          title: 'Progress Achievement System',
          description:
            'Activate achievement-based progress tracking to trigger your motivation patterns.',
          expectedImpact: 82,
          timeToImplement: '3 minutes',
          actions: [
            'Enable health score goals',
            'Set weekly progress milestones',
            'Activate achievement badges',
          ],
          implemented: false,
        },
      ];
      setRecommendations(fallbackRecommendations);
    }
  }, [healthData.healthScore, setRecommendations]);

  const generateEngagementPatterns = useCallback(async () => {
    setIsAnalyzing(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const patterns: EngagementPattern[] = [
      {
        timeOfDay: 'morning',
        frequency: 0.85,
        duration: 12,
        features: ['dashboard', 'insights', 'fall-risk'],
        effectiveness: 0.92,
      },
      {
        timeOfDay: 'afternoon',
        frequency: 0.45,
        duration: 6,
        features: ['analytics', 'search'],
        effectiveness: 0.67,
      },
      {
        timeOfDay: 'evening',
        frequency: 0.78,
        duration: 18,
        features: ['game-center', 'family', 'community'],
        effectiveness: 0.88,
      },
    ];

    const profile: PersonalizationProfile = {
      preferredTime: 'morning',
      engagementStyle: 'data-driven',
      motivationTriggers: [
        'progress tracking',
        'health insights',
        'achievement goals',
      ],
      attentionSpan: 'medium',
      learningPreference: 'analytical',
    };

    setEngagementData((current) => ({
      sessions: current?.sessions ?? [],
      patterns,
      profile,
    }));

    // Generate personalized recommendations
    await generateRecommendations(patterns, profile);
    setIsAnalyzing(false);
    toast.success('Engagement analysis complete!');
  }, [generateRecommendations, setEngagementData]);


  // Simulate engagement pattern analysis (after callbacks declared)
  useEffect(() => {
    const patternsLen = currentEngagement.patterns.length;
    if (!patternsLen) {
      void generateEngagementPatterns().catch((error) => {
        console.error('Unhandled error in engagement pattern generation:', error);
      });
    }
  }, [currentEngagement.patterns.length, generateEngagementPatterns]);

  const implementRecommendation = (id: string) => {
    setRecommendations((current) =>
      (current ?? []).map((rec) =>
        rec.id === id ? { ...rec, implemented: true } : rec
      )
    );

    const recommendation = currentRecommendations.find((r) => r.id === id);
    if (recommendation) {
      toast.success(`Implemented: ${recommendation.title}`);
    }
  };

  const getEngagementScore = () => {
    if (!currentEngagement.patterns.length) return 0;
    const avgEffectiveness =
      currentEngagement.patterns.reduce((sum, p) => sum + p.effectiveness, 0) /
      currentEngagement.patterns.length;
    return Math.round(avgEffectiveness * 100);
  };

  const getRecommendationsByType = (type: RecommendationType) => {
  return currentRecommendations.filter((rec) => rec.type === type);
  };

  const getPriorityColor = (priority: RecommendationPriority) => {
    switch (priority) {
      case 'high':
        return 'text-destructive';
      case 'medium':
        return 'text-accent';
      case 'low':
        return 'text-muted-foreground';
      default:
        return 'text-foreground';
    }
  };

  const getTypeIcon = (type: RecommendationType) => {
    switch (type) {
      case 'timing':
        return Clock;
      case 'content':
        return BarChart3;
      case 'interaction':
        return Zap;
      case 'motivation':
        return Trophy;
      case 'workflow':
        return Target;
      default:
        return Lightbulb;
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="animate-Activity h-5 w-5" />
            Analyzing Engagement Patterns
          </CardTitle>
          <CardDescription>
            Processing your interaction data to create personalized optimization
            recommendations...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={66} className="w-full" />
            <div className="text-muted-foreground text-center text-sm">
              Analyzing usage patterns and generating personalized insights...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Engagement Score
                </p>
                <p className="text-primary text-3xl font-bold">
                  {getEngagementScore()}%
                </p>
              </div>
              <Activity className="text-primary h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Active Recommendations
                </p>
                <p className="text-accent text-3xl font-bold">
                  {currentRecommendations.filter((r) => !r.implemented).length}
                </p>
              </div>
              <Lightbulb className="text-accent h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Potential Impact
                </p>
                <p className="text-accent text-3xl font-bold">
                  +
                  {Math.round(
                    currentRecommendations
                      .filter((r) => !r.implemented)
                      .reduce((sum, r) => sum + r.expectedImpact, 0) / 10
                  )}
                  %
                </p>
              </div>
              <TrendingUp className="text-accent h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Insights */}
  {currentEngagement.profile && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Your Engagement Profile
            </CardTitle>
            <CardDescription>
              Based on your interaction patterns and preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Preferred Time</p>
                <Badge variant="outline" className="capitalize">
      {currentEngagement.profile.preferredTime}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Engagement Style</p>
                <Badge variant="outline" className="capitalize">
      {currentEngagement.profile.engagementStyle.replace('-', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Attention Span</p>
                <Badge variant="outline" className="capitalize">
      {currentEngagement.profile.attentionSpan}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Learning Style</p>
                <Badge variant="outline" className="capitalize">
      {currentEngagement.profile.learningPreference}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Personalized Optimization Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered suggestions to improve your VitalSense experience
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="timing">Timing</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
              <TabsTrigger value="interaction">Interaction</TabsTrigger>
              <TabsTrigger value="motivation">Motivation</TabsTrigger>
              <TabsTrigger value="workflow">Workflow</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4">
                {currentRecommendations.slice(0, 6).map((rec) => {
                  const IconComponent = getTypeIcon(rec.type);
                  return (
                    <div
                      key={rec.id}
                      className="space-y-3 rounded-lg border p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <IconComponent className="text-primary mt-0.5 h-5 w-5" />
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-medium">{rec.title}</h4>
                              <Badge
                                variant="outline"
                                className={`text-xs ${getPriorityColor(rec.priority)}`}
                              >
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-muted-foreground text-sm">
                              {rec.description}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-1 text-right">
                          <div className="text-primary text-sm font-medium">
                            +{rec.expectedImpact}%
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {rec.timeToImplement}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {rec.implemented ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Implemented
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => implementRecommendation(rec.id)}
                              className="text-xs"
                            >
                              Implement Now
                              <ArrowRight className="ml-1 h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className="text-xs capitalize"
                        >
                          {rec.type}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            </TabsContent>

            {(
              [
                'timing',
                'content',
                'interaction',
                'motivation',
                'workflow',
              ] as const
            ).map((type) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="grid gap-4">
                  {getRecommendationsByType(type).map((rec) => {
                    const IconComponent = getTypeIcon(rec.type);
                    return (
                      <div
                        key={rec.id}
                        className="space-y-4 rounded-lg border p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <IconComponent className="text-primary mt-0.5 h-5 w-5" />
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium">{rec.title}</h4>
                                <Badge
                                  variant="outline"
                                  className={`text-xs ${getPriorityColor(rec.priority)}`}
                                >
                                  {rec.priority}
                                </Badge>
                              </div>
                              <p className="text-muted-foreground text-sm">
                                {rec.description}
                              </p>
                            </div>
                          </div>
                          <div className="space-y-1 text-right">
                            <div className="text-primary text-lg font-semibold">
                              +{rec.expectedImpact}%
                            </div>
                            <div className="text-muted-foreground text-xs">
                              Expected Impact
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h5 className="mb-2 text-sm font-medium">
                              Implementation Steps:
                            </h5>
                            <ul className="space-y-1">
                {rec.actions.map((action, index) => (
                                <li
                  key={`${rec.id}-action-${index}`}
                                  className="text-muted-foreground flex items-center gap-2 text-sm"
                                >
                                  <div className="bg-primary h-1.5 w-1.5 rounded-full" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between border-t pt-2">
                            <div className="text-muted-foreground flex items-center gap-2 text-sm">
                              <Timer className="h-4 w-4" />
                              {rec.timeToImplement}
                            </div>
                            {rec.implemented ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="mr-1 h-3 w-3" />
                                Implemented
                              </Badge>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => implementRecommendation(rec.id)}
                              >
                                Implement Recommendation
                                <ArrowRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {getRecommendationsByType(type).length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No {type} recommendations available at this time. Check
                      back after more usage data is collected.
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Quick Optimization Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-2 p-4"
              onClick={() => onNavigateToFeature('usage-analytics')}
            >
              <BarChart3 className="text-primary h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">View Usage Analytics</div>
                <div className="text-muted-foreground text-xs">
                  Detailed engagement insights
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-2 p-4"
              onClick={() => onNavigateToFeature('usage-predictions')}
            >
              <Brain className="text-primary h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">AI Usage Predictions</div>
                <div className="text-muted-foreground text-xs">
                  Forecast engagement trends
                </div>
              </div>
            </Button>

            <Button
              variant="outline"
              className="flex h-auto flex-col items-start gap-2 p-4"
              onClick={() => generateEngagementPatterns()}
            >
              <Target className="text-primary h-5 w-5" />
              <div className="text-left">
                <div className="font-medium">Refresh Analysis</div>
                <div className="text-muted-foreground text-xs">
                  Update recommendations
                </div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
