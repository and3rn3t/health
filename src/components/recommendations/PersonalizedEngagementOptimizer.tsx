import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Target, 
  TrendingUp, 
  Clock, 
  Users, 
  Brain, 
  CheckCircle, 
  AlertTriangle,
  Calendar,
  Activity,
  Heart,
  Trophy,
  Lightbulb,
  Timer,
  BarChart3,
  Zap,
  Star,
  ArrowRight,
  Sparkle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface EngagementPattern {
  timeOfDay: string
  frequency: number
  duration: number
  features: string[]
  effectiveness: number
}

interface PersonalizationProfile {
  preferredTime: string
  engagementStyle: 'data-driven' | 'goal-oriented' | 'social' | 'gamified'
  motivationTriggers: string[]
  attentionSpan: 'short' | 'medium' | 'long'
  learningPreference: 'visual' | 'analytical' | 'interactive'
}

interface OptimizationRecommendation {
  id: string
  type: 'timing' | 'content' | 'interaction' | 'motivation' | 'workflow'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  expectedImpact: number
  timeToImplement: string
  actions: string[]
  implemented: boolean
}

interface Props {
  healthData: ProcessedHealthData
  onNavigateToFeature: (featureId: string) => void
}

export default function PersonalizedEngagementOptimizer({ healthData, onNavigateToFeature }: Props) {
  const [engagementData, setEngagementData] = useKV('engagement-data', {
    sessions: [],
    patterns: [],
    profile: null
  })
  const [recommendations, setRecommendations] = useKV<OptimizationRecommendation[]>('engagement-recommendations', [])
  const [selectedTab, setSelectedTab] = useState('overview')
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Simulate engagement pattern analysis
  useEffect(() => {
    if (!engagementData.patterns.length) {
      generateEngagementPatterns()
    }
  }, [])

  const generateEngagementPatterns = async () => {
    setIsAnalyzing(true)

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000))

    const patterns: EngagementPattern[] = [
      {
        timeOfDay: 'morning',
        frequency: 0.85,
        duration: 12,
        features: ['dashboard', 'insights', 'fall-risk'],
        effectiveness: 0.92
      },
      {
        timeOfDay: 'afternoon',
        frequency: 0.45,
        duration: 6,
        features: ['analytics', 'search'],
        effectiveness: 0.67
      },
      {
        timeOfDay: 'evening',
        frequency: 0.78,
        duration: 18,
        features: ['game-center', 'family', 'community'],
        effectiveness: 0.88
      }
    ]

    const profile: PersonalizationProfile = {
      preferredTime: 'morning',
      engagementStyle: 'data-driven',
      motivationTriggers: ['progress tracking', 'health insights', 'achievement goals'],
      attentionSpan: 'medium',
      learningPreference: 'analytical'
    }

    setEngagementData(current => ({
      ...current,
      patterns,
      profile
    }))

    // Generate personalized recommendations
    await generateRecommendations(patterns, profile)
    setIsAnalyzing(false)
    toast.success('Engagement analysis complete!')
  }

  const generateRecommendations = async (patterns: EngagementPattern[], profile: PersonalizationProfile) => {
    const prompt = spark.llmPrompt`
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
    `

    try {
      const response = await spark.llm(prompt, 'gpt-4o', true)
      const newRecommendations = JSON.parse(response)
      setRecommendations(newRecommendations)
    } catch (error) {
      console.error('Error generating recommendations:', error)
      // Fallback recommendations
      const fallbackRecommendations: OptimizationRecommendation[] = [
        {
          id: 'timing-1',
          type: 'timing',
          priority: 'high',
          title: 'Optimize Morning Health Check',
          description: 'Your engagement is highest in the morning. Set up automated daily health summaries at 8 AM.',
          expectedImpact: 85,
          timeToImplement: '5 minutes',
          actions: ['Enable morning notifications', 'Customize dashboard priority', 'Set health score alerts'],
          implemented: false
        },
        {
          id: 'content-1',
          type: 'content',
          priority: 'high',
          title: 'Data-Driven Dashboard Focus',
          description: 'Emphasize analytical insights and trends to match your data-driven engagement style.',
          expectedImpact: 78,
          timeToImplement: '2 minutes',
          actions: ['Prioritize analytics widgets', 'Add trend comparisons', 'Enable detailed metrics'],
          implemented: false
        },
        {
          id: 'interaction-1',
          type: 'interaction',
          priority: 'medium',
          title: 'Medium-Depth Content Chunks',
          description: 'Break complex analyses into 10-15 minute digestible sections for optimal attention span.',
          expectedImpact: 72,
          timeToImplement: '1 minute',
          actions: ['Enable progressive disclosure', 'Add reading time estimates', 'Create summary cards'],
          implemented: false
        },
        {
          id: 'motivation-1',
          type: 'motivation',
          priority: 'high',
          title: 'Progress Achievement System',
          description: 'Activate achievement-based progress tracking to trigger your motivation patterns.',
          expectedImpact: 82,
          timeToImplement: '3 minutes',
          actions: ['Enable health score goals', 'Set weekly progress milestones', 'Activate achievement badges'],
          implemented: false
        }
      ]
      setRecommendations(fallbackRecommendations)
    }
  }

  const implementRecommendation = (id: string) => {
    setRecommendations(current => 
      current.map(rec => 
        rec.id === id ? { ...rec, implemented: true } : rec
      )
    )
    
    const recommendation = recommendations.find(r => r.id === id)
    if (recommendation) {
      toast.success(`Implemented: ${recommendation.title}`)
    }
  }

  const getEngagementScore = () => {
    if (!engagementData.patterns.length) return 0
    const avgEffectiveness = engagementData.patterns.reduce((sum, p) => sum + p.effectiveness, 0) / engagementData.patterns.length
    return Math.round(avgEffectiveness * 100)
  }

  const getRecommendationsByType = (type: string) => {
    return recommendations.filter(rec => rec.type === type)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-destructive'
      case 'medium': return 'text-accent'
      case 'low': return 'text-muted-foreground'
      default: return 'text-foreground'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'timing': return Clock
      case 'content': return BarChart3
      case 'interaction': return Zap
      case 'motivation': return Trophy
      case 'workflow': return Target
      default: return Lightbulb
    }
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Analyzing Engagement Patterns
          </CardTitle>
          <CardDescription>
            Processing your interaction data to create personalized optimization recommendations...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={66} className="w-full" />
            <div className="text-sm text-muted-foreground text-center">
              Analyzing usage patterns and generating personalized insights...
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Engagement Score</p>
                <p className="text-3xl font-bold text-primary">{getEngagementScore()}%</p>
              </div>
              <Activity className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Recommendations</p>
                <p className="text-3xl font-bold text-accent">{recommendations.filter(r => !r.implemented).length}</p>
              </div>
              <Lightbulb className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Potential Impact</p>
                <p className="text-3xl font-bold text-accent">
                  +{Math.round(recommendations.filter(r => !r.implemented).reduce((sum, r) => sum + r.expectedImpact, 0) / 10)}%
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* User Profile Insights */}
      {engagementData.profile && (
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <p className="text-sm font-medium">Preferred Time</p>
                <Badge variant="outline" className="capitalize">
                  {engagementData.profile.preferredTime}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Engagement Style</p>
                <Badge variant="outline" className="capitalize">
                  {engagementData.profile.engagementStyle.replace('-', ' ')}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Attention Span</p>
                <Badge variant="outline" className="capitalize">
                  {engagementData.profile.attentionSpan}
                </Badge>
              </div>
              <div className="space-y-2">
                <p className="text-sm font-medium">Learning Style</p>
                <Badge variant="outline" className="capitalize">
                  {engagementData.profile.learningPreference}
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
            <Sparkle className="h-5 w-5" />
            Personalized Optimization Recommendations
          </CardTitle>
          <CardDescription>
            AI-powered suggestions to improve your HealthGuard experience
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
                {recommendations.slice(0, 6).map((rec) => {
                  const IconComponent = getTypeIcon(rec.type)
                  return (
                    <div key={rec.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <IconComponent className="h-5 w-5 mt-0.5 text-primary" />
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
                            <p className="text-sm text-muted-foreground">{rec.description}</p>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="text-sm font-medium text-primary">+{rec.expectedImpact}%</div>
                          <div className="text-xs text-muted-foreground">{rec.timeToImplement}</div>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {rec.implemented ? (
                            <Badge variant="default" className="text-xs">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Implemented
                            </Badge>
                          ) : (
                            <Button 
                              size="sm" 
                              onClick={() => implementRecommendation(rec.id)}
                              className="text-xs"
                            >
                              Implement Now
                              <ArrowRight className="h-3 w-3 ml-1" />
                            </Button>
                          )}
                        </div>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {rec.type}
                        </Badge>
                      </div>
                    </div>
                  )
                })}
              </div>
            </TabsContent>

            {(['timing', 'content', 'interaction', 'motivation', 'workflow'] as const).map((type) => (
              <TabsContent key={type} value={type} className="space-y-4">
                <div className="grid gap-4">
                  {getRecommendationsByType(type).map((rec) => {
                    const IconComponent = getTypeIcon(rec.type)
                    return (
                      <div key={rec.id} className="border rounded-lg p-4 space-y-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <IconComponent className="h-5 w-5 mt-0.5 text-primary" />
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
                              <p className="text-sm text-muted-foreground">{rec.description}</p>
                            </div>
                          </div>
                          <div className="text-right space-y-1">
                            <div className="text-lg font-semibold text-primary">+{rec.expectedImpact}%</div>
                            <div className="text-xs text-muted-foreground">Expected Impact</div>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <div>
                            <h5 className="text-sm font-medium mb-2">Implementation Steps:</h5>
                            <ul className="space-y-1">
                              {rec.actions.map((action, index) => (
                                <li key={index} className="text-sm text-muted-foreground flex items-center gap-2">
                                  <div className="w-1.5 h-1.5 bg-primary rounded-full" />
                                  {action}
                                </li>
                              ))}
                            </ul>
                          </div>

                          <div className="flex items-center justify-between pt-2 border-t">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Timer className="h-4 w-4" />
                              {rec.timeToImplement}
                            </div>
                            {rec.implemented ? (
                              <Badge variant="default" className="text-xs">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Implemented
                              </Badge>
                            ) : (
                              <Button 
                                size="sm" 
                                onClick={() => implementRecommendation(rec.id)}
                              >
                                Implement Recommendation
                                <ArrowRight className="h-4 w-4 ml-2" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {getRecommendationsByType(type).length === 0 && (
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      No {type} recommendations available at this time. Check back after more usage data is collected.
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onNavigateToFeature('usage-analytics')}
            >
              <BarChart3 className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">View Usage Analytics</div>
                <div className="text-xs text-muted-foreground">Detailed engagement insights</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => onNavigateToFeature('usage-predictions')}
            >
              <Brain className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">AI Usage Predictions</div>
                <div className="text-xs text-muted-foreground">Forecast engagement trends</div>
              </div>
            </Button>

            <Button 
              variant="outline" 
              className="h-auto p-4 flex flex-col items-start gap-2"
              onClick={() => generateEngagementPatterns()}
            >
              <Target className="h-5 w-5 text-primary" />
              <div className="text-left">
                <div className="font-medium">Refresh Analysis</div>
                <div className="text-xs text-muted-foreground">Update recommendations</div>
              </div>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}