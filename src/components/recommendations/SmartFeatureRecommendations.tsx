import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { useUsageTracking } from '@/hooks/useUsageTracking'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
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
  Sparkle
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface UsagePattern {
  feature: string
  visits: number
  lastVisited: number
  timeSpent: number
  actions: number
}

interface FeatureRecommendation {
  id: string
  title: string
  description: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  category: 'health' | 'monitoring' | 'ai' | 'community' | 'gamification'
  icon: React.ComponentType<any>
  targetFeature: string
  estimatedBenefit: string
  timeToValue: string
  prerequisites?: string[]
}

interface SmartFeatureRecommendationsProps {
  healthData: ProcessedHealthData
  onNavigateToFeature: (featureId: string) => void
}

export default function SmartFeatureRecommendations({ 
  healthData, 
  onNavigateToFeature 
}: SmartFeatureRecommendationsProps) {
  const { trackAction, usagePatterns } = useUsageTracking('recommendations')
  const [dismissedRecommendations, setDismissedRecommendations] = useKV<string[]>('dismissed-recommendations', [])
  const [recommendations, setRecommendations] = useState<FeatureRecommendation[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  // Track feature usage
  const trackFeatureUsage = (feature: string, timeSpent: number = 0, actions: number = 0) => {
    // This is now handled by the useUsageTracking hook in individual components
    trackAction(`navigation-to-${feature}`)
  }

  // Generate smart recommendations based on usage patterns and health data
  const generateRecommendations = async () => {
    setIsAnalyzing(true)
    
    try {
      const allRecommendations: FeatureRecommendation[] = [
        // Health-focused recommendations
        {
          id: 'predictive-alerts',
          title: 'Set Up Predictive Health Alerts',
          description: 'Get early warnings before health issues develop using AI trend analysis',
          reason: 'Your health score shows declining trends that could benefit from proactive monitoring',
          priority: 'high' as const,
          category: 'monitoring' as const,
          icon: Brain,
          targetFeature: 'predictive-alerts',
          estimatedBenefit: 'Prevent 70% of health incidents',
          timeToValue: '5 minutes',
          prerequisites: ['Health data imported']
        },
        {
          id: 'movement-patterns',
          title: 'Analyze Movement Patterns',
          description: 'Discover mobility trends and fall risk indicators from your gait data',
          reason: 'Your step count and walking data shows patterns worth analyzing',
          priority: 'high' as const,
          category: 'ai' as const,
          icon: Activity,
          targetFeature: 'movement-patterns',
          estimatedBenefit: 'Reduce fall risk by 40%',
          timeToValue: '2 minutes'
        },
        {
          id: 'family-dashboard',
          title: 'Share Progress with Family',
          description: 'Keep your family informed about your health improvements and milestones',
          reason: 'You\'ve been actively tracking health metrics - share your progress!',
          priority: 'medium' as const,
          category: 'community' as const,
          icon: Users,
          targetFeature: 'family',
          estimatedBenefit: 'Increase motivation by 60%',
          timeToValue: '3 minutes'
        },
        {
          id: 'health-challenges',
          title: 'Join Health Challenges',
          description: 'Compete with family members and achieve health goals together',
          reason: 'Your consistent health tracking suggests you\'d enjoy gamified goals',
          priority: 'medium' as const,
          category: 'gamification' as const,
          icon: Trophy,
          targetFeature: 'family-challenges',
          estimatedBenefit: 'Boost activity by 35%',
          timeToValue: '1 minute'
        },
        {
          id: 'ai-recommendations',
          title: 'Get Personalized AI Recommendations',
          description: 'Receive custom health advice based on your unique data patterns',
          reason: 'Your health data is rich enough for personalized AI insights',
          priority: 'high' as const,
          category: 'ai' as const,
          icon: Lightbulb,
          targetFeature: 'ai-recommendations',
          estimatedBenefit: 'Improve outcomes by 45%',
          timeToValue: '1 minute'
        },
        {
          id: 'real-time-monitoring',
          title: 'Enable Real-Time Health Monitoring',
          description: 'Get live updates on your health metrics and instant alerts',
          reason: 'Your active health management would benefit from real-time insights',
          priority: 'medium' as const,
          category: 'monitoring' as const,
          icon: Heart,
          targetFeature: 'monitoring-hub',
          estimatedBenefit: 'Faster response to changes',
          timeToValue: '10 minutes'
        },
        {
          id: 'healthcare-portal',
          title: 'Connect with Healthcare Providers',
          description: 'Share your health insights directly with your medical team',
          reason: 'Your comprehensive health data would be valuable for your doctors',
          priority: 'medium' as const,
          category: 'community' as const,
          icon: Stethoscope,
          targetFeature: 'healthcare',
          estimatedBenefit: 'Better informed care',
          timeToValue: '5 minutes'
        },
        {
          id: 'advanced-watch-integration',
          title: 'Set Up Advanced Apple Watch Features',
          description: 'Unlock fall detection, ECG analysis, and real-time health monitoring',
          reason: 'Maximize the potential of your health monitoring setup',
          priority: 'high' as const,
          category: 'monitoring' as const,
          icon: CloudArrowUp,
          targetFeature: 'advanced-watch',
          estimatedBenefit: 'Complete health coverage',
          timeToValue: '15 minutes'
        }
      ]

      // Filter recommendations based on usage patterns and health data
      const relevantRecommendations = allRecommendations.filter(rec => {
        // Don't show dismissed recommendations
        if (dismissedRecommendations.includes(rec.id)) return false

        // Health data based filtering
        if (rec.id === 'predictive-alerts' && healthData.healthScore && healthData.healthScore > 85) {
          return false // Don't suggest if health is excellent
        }

        if (rec.id === 'movement-patterns' && (!healthData.metrics.stepCount || healthData.metrics.stepCount < 1000)) {
          return false // Don't suggest if no walking data
        }

        // Usage pattern based filtering
        const dashboardUsage = usagePatterns.find(p => p.feature === 'dashboard')
        const analyticsUsage = usagePatterns.find(p => p.feature === 'analytics')
        
        if (rec.id === 'family-dashboard' && (!dashboardUsage || dashboardUsage.visits < 3)) {
          return false // Only suggest if user is engaged with dashboard
        }

        if (rec.id === 'ai-recommendations' && (!analyticsUsage || analyticsUsage.visits < 2)) {
          return false // Only suggest if user has explored analytics
        }

        return true
      })

      // Sort by priority and relevance
      relevantRecommendations.sort((a, b) => {
        const priorityWeight = { high: 3, medium: 2, low: 1 }
        return priorityWeight[b.priority] - priorityWeight[a.priority]
      })

      setRecommendations(relevantRecommendations.slice(0, 6)) // Show top 6
    } catch (error) {
      console.error('Error generating recommendations:', error)
      toast.error('Failed to generate recommendations')
    } finally {
      setIsAnalyzing(false)
    }
  }

  useEffect(() => {
    generateRecommendations()
  }, [usagePatterns, healthData, dismissedRecommendations])

  // Simulate tracking usage when component mounts
  useEffect(() => {
    // Usage tracking is now handled by the useUsageTracking hook
  }, [])

  const handleRecommendationClick = (recommendation: FeatureRecommendation) => {
    trackAction(`click-recommendation-${recommendation.id}`)
    onNavigateToFeature(recommendation.targetFeature)
    toast.success(`Navigating to ${recommendation.title}`)
  }

  const handleDismissRecommendation = (recommendationId: string) => {
    trackAction(`dismiss-recommendation-${recommendationId}`)
    setDismissedRecommendations(current => [...current, recommendationId])
    toast.success('Recommendation dismissed')
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 dark:text-red-400'
      case 'medium': return 'text-yellow-600 dark:text-yellow-400'
      case 'low': return 'text-green-600 dark:text-green-400'
      default: return 'text-muted-foreground'
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'health': return Heart
      case 'monitoring': return Shield
      case 'ai': return Brain
      case 'community': return Users
      case 'gamification': return Trophy
      default: return Activity
    }
  }

  if (isAnalyzing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 animate-pulse" />
            Analyzing Your Usage Patterns
          </CardTitle>
          <CardDescription>
            Generating personalized feature recommendations based on your health data and app usage...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Progress value={75} className="w-full" />
            <p className="text-sm text-muted-foreground text-center">
              Processing your health insights and usage patterns
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
            <Sparkle className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Smart Recommendations</h2>
            <p className="text-muted-foreground">AI-powered suggestions based on your health data and usage patterns</p>
          </div>
        </div>
      </div>

      {recommendations.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center space-y-3">
              <Star className="h-12 w-12 text-muted-foreground mx-auto" />
              <h3 className="text-lg font-semibold">All Caught Up!</h3>
              <p className="text-muted-foreground">
                You're making great use of HealthGuard. Keep exploring features to unlock new recommendations.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <Alert>
            <TrendingUp className="h-4 w-4" />
            <AlertDescription>
              Found {recommendations.length} personalized recommendations to enhance your health monitoring experience.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4 md:grid-cols-2">
            {recommendations.map((recommendation) => {
              const IconComponent = recommendation.icon
              const CategoryIcon = getCategoryIcon(recommendation.category)
              
              return (
                <Card key={recommendation.id} className="relative group hover:shadow-lg transition-all duration-200">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-lg leading-tight">{recommendation.title}</CardTitle>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className={getPriorityColor(recommendation.priority)}>
                              {recommendation.priority} priority
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              <CategoryIcon className="h-3 w-3 mr-1" />
                              {recommendation.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDismissRecommendation(recommendation.id)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm">
                      {recommendation.description}
                    </CardDescription>

                    <div className="p-3 bg-muted/50 rounded-lg">
                      <p className="text-sm font-medium text-muted-foreground mb-1">Why we recommend this:</p>
                      <p className="text-sm text-foreground">{recommendation.reason}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Expected Benefit</p>
                        <p className="font-medium text-green-600 dark:text-green-400">{recommendation.estimatedBenefit}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time to Value</p>
                        <p className="font-medium text-blue-600 dark:text-blue-400">{recommendation.timeToValue}</p>
                      </div>
                    </div>

                    {recommendation.prerequisites && (
                      <div className="text-sm">
                        <p className="text-muted-foreground mb-1">Prerequisites:</p>
                        <ul className="list-disc list-inside text-foreground">
                          {recommendation.prerequisites.map((prereq, index) => (
                            <li key={index}>{prereq}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <Button 
                      onClick={() => handleRecommendationClick(recommendation)}
                      className="w-full group-hover:shadow-md transition-all duration-200"
                    >
                      Get Started
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Usage Insights */}
      {usagePatterns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Your Usage Patterns
            </CardTitle>
            <CardDescription>
              Insights about how you use HealthGuard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {usagePatterns
                .sort((a, b) => b.visits - a.visits)
                .slice(0, 6)
                .map((pattern) => (
                  <div key={pattern.feature} className="p-3 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium capitalize">{pattern.feature.replace('-', ' ')}</p>
                      <Badge variant="outline" className="text-xs">{pattern.visits} visits</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Last used {new Date(pattern.lastVisited).toLocaleDateString()}
                    </p>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}