import { useState, useEffect } from 'react'
import { useKV } from '@github/spark/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Brain, 
  TrendingUp, 
  Clock, 
  Target, 
  Eye, 
  Lightbulb, 
  Activity, 
  Users, 
  BarChart3,
  Sparkle,
  Heart,
  Shield,
  CheckCircle,
  AlertCircle,
  Calendar,
  ArrowRight
} from '@phosphor-icons/react'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface FeatureUsage {
  featureId: string
  featureName: string
  category: string
  usageCount: number
  lastUsed: Date
  avgSessionTime: number
  effectivenessScore: number
}

interface AIRecommendation {
  id: string
  type: 'feature' | 'insight' | 'health_action'
  title: string
  description: string
  confidence: number
  implemented: boolean
  implementedDate?: Date
  impactScore?: number
}

interface UsageAnalytics {
  totalSessions: number
  avgSessionTime: number
  mostUsedFeatures: FeatureUsage[]
  aiRecommendations: AIRecommendation[]
  personalizationScore: number
  healthImprovementScore: number
  engagementTrends: Array<{ date: string; engagement: number; aiOptimizations: number }>
}

interface Props {
  healthData: ProcessedHealthData
}

export default function UsageAnalyticsDashboard({ healthData }: Props) {
  const [analyticsData, setAnalyticsData] = useKV<UsageAnalytics>('usage-analytics', {
    totalSessions: 47,
    avgSessionTime: 8.3,
    mostUsedFeatures: [
      {
        featureId: 'dashboard',
        featureName: 'Health Dashboard',
        category: 'Core',
        usageCount: 156,
        lastUsed: new Date(),
        avgSessionTime: 4.2,
        effectivenessScore: 92
      },
      {
        featureId: 'fall-risk',
        featureName: 'Fall Risk Monitor',
        category: 'Safety',
        usageCount: 89,
        lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        avgSessionTime: 6.8,
        effectivenessScore: 88
      },
      {
        featureId: 'ai-recommendations',
        featureName: 'AI Recommendations',
        category: 'AI',
        usageCount: 67,
        lastUsed: new Date(Date.now() - 24 * 60 * 60 * 1000),
        avgSessionTime: 5.1,
        effectivenessScore: 94
      },
      {
        featureId: 'analytics',
        featureName: 'Health Analytics',
        category: 'Insights',
        usageCount: 54,
        lastUsed: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        avgSessionTime: 7.2,
        effectivenessScore: 86
      },
      {
        featureId: 'realtime-scoring',
        featureName: 'Live Health Score',
        category: 'Monitoring',
        usageCount: 43,
        lastUsed: new Date(Date.now() - 12 * 60 * 60 * 1000),
        avgSessionTime: 3.5,
        effectivenessScore: 91
      }
    ],
    aiRecommendations: [
      {
        id: '1',
        type: 'feature',
        title: 'Enable Predictive Health Alerts',
        description: 'Based on your health patterns, predictive alerts could prevent 3 potential health incidents',
        confidence: 87,
        implemented: true,
        implementedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        impactScore: 92
      },
      {
        id: '2',
        type: 'health_action',
        title: 'Optimize Sleep Schedule',
        description: 'AI detected irregular sleep patterns affecting your health score by 12 points',
        confidence: 91,
        implemented: true,
        implementedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        impactScore: 89
      },
      {
        id: '3',
        type: 'insight',
        title: 'Focus on Movement Patterns',
        description: 'Your gait analysis shows 15% improvement potential with targeted exercises',
        confidence: 84,
        implemented: false
      },
      {
        id: '4',
        type: 'feature',
        title: 'Set Up Family Dashboard',
        description: 'Sharing progress with family increases adherence by 34% for similar users',
        confidence: 78,
        implemented: false
      }
    ],
    personalizationScore: 89,
    healthImprovementScore: 76,
    engagementTrends: [
      { date: '2024-01-01', engagement: 65, aiOptimizations: 12 },
      { date: '2024-01-08', engagement: 72, aiOptimizations: 18 },
      { date: '2024-01-15', engagement: 78, aiOptimizations: 23 },
      { date: '2024-01-22', engagement: 85, aiOptimizations: 29 },
      { date: '2024-01-29', engagement: 89, aiOptimizations: 34 }
    ]
  })

  const [selectedTimeframe, setSelectedTimeframe] = useState<'week' | 'month' | 'quarter'>('month')

  // AI Optimization Metrics
  const aiOptimizationMetrics = {
    featureRecommendations: analyticsData.aiRecommendations.filter(r => r.type === 'feature').length,
    healthActionSuggestions: analyticsData.aiRecommendations.filter(r => r.type === 'health_action').length,
    insightGeneration: analyticsData.aiRecommendations.filter(r => r.type === 'insight').length,
    implementationRate: Math.round((analyticsData.aiRecommendations.filter(r => r.implemented).length / analyticsData.aiRecommendations.length) * 100),
    avgImpactScore: Math.round(analyticsData.aiRecommendations.filter(r => r.impactScore).reduce((acc, r) => acc + (r.impactScore || 0), 0) / analyticsData.aiRecommendations.filter(r => r.impactScore).length)
  }

  const generateNewInsights = async () => {
    const prompt = spark.llmPrompt`Based on this health data and usage patterns, generate 2 new AI optimization insights:
    
    Health Score: ${healthData.healthScore}
    Recent Usage: ${analyticsData.mostUsedFeatures.slice(0, 3).map(f => f.featureName).join(', ')}
    Personalization Score: ${analyticsData.personalizationScore}
    
    Format as JSON array with: type, title, description, confidence (60-95)`

    try {
      const response = await spark.llm(prompt, "gpt-4o", true)
      const newInsights = JSON.parse(response)
      
      const updatedRecommendations = [...analyticsData.aiRecommendations, ...newInsights.map((insight: any, index: number) => ({
        id: `new-${Date.now()}-${index}`,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        confidence: insight.confidence,
        implemented: false
      }))]

      setAnalyticsData(current => ({
        ...current,
        aiRecommendations: updatedRecommendations
      }))
    } catch (error) {
      console.error('Failed to generate insights:', error)
    }
  }

  const implementRecommendation = (id: string) => {
    setAnalyticsData(current => ({
      ...current,
      aiRecommendations: current.aiRecommendations.map(rec => 
        rec.id === id 
          ? { 
              ...rec, 
              implemented: true, 
              implementedDate: new Date(),
              impactScore: Math.floor(Math.random() * 20) + 75 // Simulate impact score
            }
          : rec
      )
    }))
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Usage Analytics
          </h2>
          <p className="text-muted-foreground">
            Discover how AI personalizes and optimizes your HealthGuard experience
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={selectedTimeframe === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('week')}
          >
            Week
          </Button>
          <Button
            variant={selectedTimeframe === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('month')}
          >
            Month
          </Button>
          <Button
            variant={selectedTimeframe === 'quarter' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedTimeframe('quarter')}
          >
            Quarter
          </Button>
        </div>
      </div>

      {/* AI Optimization Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Personalization Score</p>
                <p className="text-2xl font-bold text-primary">{analyticsData.personalizationScore}%</p>
              </div>
              <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sparkle className="h-4 w-4 text-primary" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={analyticsData.personalizationScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Health Impact</p>
                <p className="text-2xl font-bold text-accent">{analyticsData.healthImprovementScore}%</p>
              </div>
              <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center">
                <Heart className="h-4 w-4 text-accent" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={analyticsData.healthImprovementScore} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">AI Recommendations</p>
                <p className="text-2xl font-bold text-foreground">{analyticsData.aiRecommendations.length}</p>
              </div>
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <Lightbulb className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="outline" className="text-xs">
                {aiOptimizationMetrics.implementationRate}% implemented
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Impact Score</p>
                <p className="text-2xl font-bold text-foreground">{aiOptimizationMetrics.avgImpactScore || 'N/A'}</p>
              </div>
              <div className="h-8 w-8 bg-muted rounded-lg flex items-center justify-center">
                <Target className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
            <div className="mt-2">
              <Badge variant="secondary" className="text-xs">
                AI-driven improvements
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="optimization" className="space-y-6">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-4 gap-1 h-auto p-1">
          <TabsTrigger value="optimization" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI Optimization
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Feature Usage
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="engagement" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Engagement Trends
          </TabsTrigger>
        </TabsList>

        {/* AI Optimization Tab */}
        <TabsContent value="optimization" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Optimization Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Optimization Breakdown
                </CardTitle>
                <CardDescription>
                  How AI improves your HealthGuard experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Target className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Feature Recommendations</p>
                      <p className="text-sm text-muted-foreground">Personalized feature suggestions</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{aiOptimizationMetrics.featureRecommendations}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-accent/10 rounded-lg flex items-center justify-center">
                      <Heart className="h-4 w-4 text-accent" />
                    </div>
                    <div>
                      <p className="font-medium">Health Action Insights</p>
                      <p className="text-sm text-muted-foreground">AI-driven health improvements</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{aiOptimizationMetrics.healthActionSuggestions}</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 bg-muted-foreground/10 rounded-lg flex items-center justify-center">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-medium">Pattern Recognition</p>
                      <p className="text-sm text-muted-foreground">Behavioral insights from data</p>
                    </div>
                  </div>
                  <Badge variant="secondary">{aiOptimizationMetrics.insightGeneration}</Badge>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Implementation Success Rate</span>
                    <span className="text-lg font-bold text-primary">{aiOptimizationMetrics.implementationRate}%</span>
                  </div>
                  <Progress value={aiOptimizationMetrics.implementationRate} className="mt-2 h-2" />
                </div>
              </CardContent>
            </Card>

            {/* Personalization Insights */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkle className="h-5 w-5" />
                  Personalization Engine
                </CardTitle>
                <CardDescription>
                  How AI adapts to your unique health profile
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Health Pattern Recognition</span>
                      <span className="text-sm text-muted-foreground">92%</span>
                    </div>
                    <Progress value={92} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Behavioral Adaptation</span>
                      <span className="text-sm text-muted-foreground">88%</span>
                    </div>
                    <Progress value={88} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Predictive Accuracy</span>
                      <span className="text-sm text-muted-foreground">85%</span>
                    </div>
                    <Progress value={85} className="h-2" />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Content Relevance</span>
                      <span className="text-sm text-muted-foreground">91%</span>
                    </div>
                    <Progress value={91} className="h-2" />
                  </div>
                </div>

                <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-start gap-3">
                    <Brain className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="font-medium text-primary">AI Learning Status</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your AI model has analyzed {analyticsData.totalSessions} sessions and is continuously improving based on your health patterns and preferences.
                      </p>
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={generateNewInsights}
                  className="w-full"
                  variant="outline"
                >
                  <Sparkle className="h-4 w-4 mr-2" />
                  Generate New AI Insights
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Feature Usage Tab */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Feature Usage Analytics
              </CardTitle>
              <CardDescription>
                Your most used features and their effectiveness scores
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.mostUsedFeatures.map((feature, index) => (
                  <div key={feature.featureId} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                        <span className="text-sm font-bold text-primary">#{index + 1}</span>
                      </div>
                      <div>
                        <p className="font-medium">{feature.featureName}</p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{feature.usageCount} uses</span>
                          <span>•</span>
                          <span>{feature.avgSessionTime} min avg</span>
                          <span>•</span>
                          <Badge variant="outline" className="text-xs">
                            {feature.category}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Effectiveness</span>
                        <Badge 
                          variant={feature.effectivenessScore >= 90 ? "default" : feature.effectivenessScore >= 80 ? "secondary" : "outline"}
                          className="text-xs"
                        >
                          {feature.effectivenessScore}%
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Last used: {feature.lastUsed.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                AI-Generated Recommendations
              </CardTitle>
              <CardDescription>
                Personalized suggestions to optimize your health monitoring experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.aiRecommendations.map((recommendation) => (
                  <div key={recommendation.id} className="p-4 border rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge 
                            variant={recommendation.type === 'feature' ? 'default' : recommendation.type === 'health_action' ? 'secondary' : 'outline'}
                            className="text-xs"
                          >
                            {recommendation.type.replace('_', ' ')}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {recommendation.confidence}% confidence
                          </Badge>
                          {recommendation.implemented && (
                            <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Implemented
                            </Badge>
                          )}
                        </div>
                        <h4 className="font-medium mb-1">{recommendation.title}</h4>
                        <p className="text-sm text-muted-foreground mb-3">{recommendation.description}</p>
                        
                        {recommendation.implemented && recommendation.impactScore && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">Impact Score:</span>
                            <Badge variant="outline" className="text-xs">
                              {recommendation.impactScore}%
                            </Badge>
                            <span className="text-muted-foreground">•</span>
                            <span className="text-muted-foreground">
                              Implemented {recommendation.implementedDate?.toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {!recommendation.implemented && (
                        <Button
                          size="sm"
                          onClick={() => implementRecommendation(recommendation.id)}
                          className="ml-4"
                        >
                          <ArrowRight className="h-4 w-4 mr-1" />
                          Try It
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Engagement Trends Tab */}
        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Engagement & AI Optimization Trends
              </CardTitle>
              <CardDescription>
                How AI optimizations have improved your engagement over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Trend Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-accent" />
                      <span className="text-sm font-medium">Engagement Growth</span>
                    </div>
                    <p className="text-2xl font-bold text-accent">+37%</p>
                    <p className="text-xs text-muted-foreground">Since AI optimization</p>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">AI Optimizations</span>
                    </div>
                    <p className="text-2xl font-bold text-primary">34</p>
                    <p className="text-xs text-muted-foreground">Total improvements made</p>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">Session Quality</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">+42%</p>
                    <p className="text-xs text-muted-foreground">Time per insight</p>
                  </div>
                </div>

                {/* Trends Chart Placeholder */}
                <div className="space-y-4">
                  <h4 className="font-medium">Weekly Engagement & AI Optimization Timeline</h4>
                  <div className="space-y-2">
                    {analyticsData.engagementTrends.map((trend, index) => (
                      <div key={trend.date} className="flex items-center gap-4 p-3 bg-muted rounded-lg">
                        <div className="text-sm font-medium min-w-20">
                          Week {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm">Engagement</span>
                            <span className="text-sm font-medium">{trend.engagement}%</span>
                          </div>
                          <Progress value={trend.engagement} className="h-2" />
                        </div>
                        <div className="flex items-center gap-2">
                          <Brain className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{trend.aiOptimizations}</span>
                          <span className="text-xs text-muted-foreground">optimizations</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}