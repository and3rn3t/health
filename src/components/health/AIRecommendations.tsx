import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { 
  Brain, 
  Target, 
  TrendUp, 
  Clock, 
  Heart, 
  Activity, 
  Shield, 
  Lightbulb,
  CheckCircle,
  AlertTriangle,
  Calendar,
  Zap,
  Award
} from '@phosphor-icons/react'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'
import { useKV } from '@github/spark/hooks'
import { toast } from 'sonner'

interface Recommendation {
  id: string
  title: string
  description: string
  category: 'exercise' | 'nutrition' | 'sleep' | 'medical' | 'lifestyle' | 'fall-prevention'
  priority: 'low' | 'medium' | 'high' | 'critical'
  impact: number // 1-10 scale
  difficulty: 'easy' | 'moderate' | 'challenging'
  timeframe: string
  actionSteps: string[]
  reasoning: string
  evidence: string[]
  completed?: boolean
  dateDismissed?: string
}

interface AIRecommendationsProps {
  healthData: ProcessedHealthData
}

const AIRecommendations = ({ healthData }: AIRecommendationsProps) => {
  const [recommendations, setRecommendations] = useKV<Recommendation[]>('ai-recommendations', [])
  const [completedRecommendations, setCompletedRecommendations] = useKV<string[]>('completed-recommendations', [])
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lastGenerated, setLastGenerated] = useKV<string>('last-recommendations-generated', '')

  // Generate AI recommendations based on health data
  const generateRecommendations = async () => {
    setIsGenerating(true)
    try {
      const prompt = spark.llmPrompt`
        Based on this health data analysis, generate personalized health recommendations:
        
        Health Score: ${healthData.healthScore}/100
        Fall Risk Factors: ${JSON.stringify(healthData.fallRiskFactors || [])}
        Key Metrics: ${JSON.stringify(healthData.metrics)}
        Health Trends: ${JSON.stringify(healthData.trends || [])}
        
        Generate 8-12 specific, actionable recommendations covering:
        - Exercise and movement optimization
        - Nutrition improvements
        - Sleep quality enhancement
        - Medical follow-ups
        - Lifestyle modifications
        - Fall prevention strategies
        
        For each recommendation, provide:
        - Clear title and description
        - Category classification
        - Priority level (low/medium/high/critical)
        - Impact score (1-10)
        - Difficulty level
        - Estimated timeframe
        - 3-5 specific action steps
        - Scientific reasoning
        - Supporting evidence points
        
        Focus on recommendations that are:
        - Personalized to the specific health data patterns
        - Evidence-based and medically sound
        - Actionable with clear next steps
        - Prioritized by potential health impact
        - Realistic for the user's current health status
      `

      const response = await spark.llm(prompt, 'gpt-4o', true)
      const generatedRecs = JSON.parse(response)
      
      // Add unique IDs and format recommendations
      const formattedRecs: Recommendation[] = generatedRecs.map((rec: any, index: number) => ({
        id: `rec-${Date.now()}-${index}`,
        title: rec.title,
        description: rec.description,
        category: rec.category,
        priority: rec.priority,
        impact: rec.impact,
        difficulty: rec.difficulty,
        timeframe: rec.timeframe,
        actionSteps: rec.actionSteps,
        reasoning: rec.reasoning,
        evidence: rec.evidence,
        completed: false
      }))
      
      setRecommendations(formattedRecs)
      setLastGenerated(new Date().toISOString())
      toast.success('AI recommendations generated successfully!')
    } catch (error) {
      console.error('Error generating recommendations:', error)
      toast.error('Failed to generate recommendations. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  // Mark recommendation as completed
  const completeRecommendation = (id: string) => {
    setRecommendations(current => 
      current.map(rec => 
        rec.id === id ? { ...rec, completed: true } : rec
      )
    )
    setCompletedRecommendations(current => [...current, id])
    toast.success('Recommendation marked as completed!')
  }

  // Dismiss recommendation
  const dismissRecommendation = (id: string) => {
    setRecommendations(current => 
      current.map(rec => 
        rec.id === id ? { ...rec, dateDismissed: new Date().toISOString() } : rec
      )
    )
    toast.success('Recommendation dismissed')
  }

  // Filter recommendations
  const filteredRecommendations = recommendations.filter(rec => {
    if (rec.dateDismissed) return false
    if (activeCategory === 'all') return true
    if (activeCategory === 'completed') return rec.completed
    if (activeCategory === 'active') return !rec.completed
    return rec.category === activeCategory
  })

  // Get priority color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  // Get category icon
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'exercise': return Activity
      case 'nutrition': return Heart
      case 'sleep': return Clock
      case 'medical': return Shield
      case 'lifestyle': return Target
      case 'fall-prevention': return Shield
      default: return Lightbulb
    }
  }

  // Calculate completion statistics
  const totalRecommendations = recommendations.length
  const completedCount = recommendations.filter(rec => rec.completed).length
  const completionRate = totalRecommendations > 0 ? (completedCount / totalRecommendations) * 100 : 0

  useEffect(() => {
    // Auto-generate recommendations if none exist and we have health data
    if (recommendations.length === 0 && healthData.metrics && Object.keys(healthData.metrics).length > 0) {
      generateRecommendations()
    }
  }, [healthData])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Brain className="h-6 w-6 text-primary" />
            AI Health Recommendations
          </h2>
          <p className="text-muted-foreground">
            Personalized interventions powered by AI analysis of your health data
          </p>
        </div>
        <Button 
          onClick={generateRecommendations}
          disabled={isGenerating}
          className="flex items-center gap-2"
        >
          <Zap className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Refresh Recommendations'}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalRecommendations}</p>
                <p className="text-sm text-muted-foreground">Total Recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completedCount}</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <TrendUp className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{completionRate.toFixed(0)}%</p>
                <p className="text-sm text-muted-foreground">Completion Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {recommendations.filter(rec => rec.priority === 'high' || rec.priority === 'critical').length}
                </p>
                <p className="text-sm text-muted-foreground">High Priority</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Overview */}
      {totalRecommendations > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Progress Overview
            </CardTitle>
            <CardDescription>
              Your health improvement journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Overall Progress</span>
                  <span>{completedCount}/{totalRecommendations} completed</span>
                </div>
                <Progress value={completionRate} className="h-2" />
              </div>
              {lastGenerated && (
                <p className="text-sm text-muted-foreground">
                  Last updated: {new Date(lastGenerated).toLocaleDateString()}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Personalized Recommendations</CardTitle>
          <CardDescription>
            AI-generated interventions tailored to your health data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeCategory} onValueChange={setActiveCategory}>
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="exercise">Exercise</TabsTrigger>
              <TabsTrigger value="nutrition">Nutrition</TabsTrigger>
              <TabsTrigger value="sleep">Sleep</TabsTrigger>
              <TabsTrigger value="medical">Medical</TabsTrigger>
              <TabsTrigger value="fall-prevention">Fall Prevention</TabsTrigger>
            </TabsList>

            <TabsContent value={activeCategory} className="mt-6">
              {filteredRecommendations.length === 0 ? (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No recommendations found</h3>
                  <p className="text-muted-foreground">
                    {recommendations.length === 0 
                      ? 'Generate AI recommendations to get personalized health interventions.'
                      : 'Try a different category or generate new recommendations.'
                    }
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {filteredRecommendations
                      .sort((a, b) => {
                        // Sort by priority first, then by impact
                        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
                        const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] || 0
                        const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] || 0
                        if (aPriority !== bPriority) return bPriority - aPriority
                        return b.impact - a.impact
                      })
                      .map((recommendation) => {
                        const CategoryIcon = getCategoryIcon(recommendation.category)
                        return (
                          <Card key={recommendation.id} className={`transition-all ${recommendation.completed ? 'opacity-75' : ''}`}>
                            <CardHeader>
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center gap-3 mb-2">
                                    <CategoryIcon className="h-5 w-5 text-primary" />
                                    <Badge 
                                      variant="outline" 
                                      className={getPriorityColor(recommendation.priority)}
                                    >
                                      {recommendation.priority.toUpperCase()}
                                    </Badge>
                                    <Badge variant="secondary">
                                      Impact: {recommendation.impact}/10
                                    </Badge>
                                    <Badge variant="outline">
                                      {recommendation.difficulty}
                                    </Badge>
                                  </div>
                                  <CardTitle className={recommendation.completed ? 'line-through' : ''}>
                                    {recommendation.title}
                                  </CardTitle>
                                  <CardDescription>
                                    {recommendation.description}
                                  </CardDescription>
                                </div>
                                <div className="flex gap-2">
                                  {!recommendation.completed && (
                                    <Button
                                      size="sm"
                                      onClick={() => completeRecommendation(recommendation.id)}
                                      className="flex items-center gap-1"
                                    >
                                      <CheckCircle className="h-4 w-4" />
                                      Complete
                                    </Button>
                                  )}
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => dismissRecommendation(recommendation.id)}
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                {/* Timeframe and Category */}
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {recommendation.timeframe}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <CategoryIcon className="h-4 w-4" />
                                    {recommendation.category.replace('-', ' ')}
                                  </div>
                                </div>

                                {/* Action Steps */}
                                <div>
                                  <h4 className="font-semibold mb-2">Action Steps:</h4>
                                  <ul className="space-y-1">
                                    {recommendation.actionSteps.map((step, index) => (
                                      <li key={index} className="flex items-start gap-2 text-sm">
                                        <span className="text-primary font-semibold mt-1">{index + 1}.</span>
                                        <span>{step}</span>
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <Separator />

                                {/* Reasoning and Evidence */}
                                <div className="grid md:grid-cols-2 gap-4">
                                  <div>
                                    <h4 className="font-semibold mb-2">Why This Helps:</h4>
                                    <p className="text-sm text-muted-foreground">
                                      {recommendation.reasoning}
                                    </p>
                                  </div>
                                  <div>
                                    <h4 className="font-semibold mb-2">Supporting Evidence:</h4>
                                    <ul className="space-y-1">
                                      {recommendation.evidence.map((evidence, index) => (
                                        <li key={index} className="text-sm text-muted-foreground flex items-start gap-1">
                                          <span className="text-primary">•</span>
                                          <span>{evidence}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )
                      })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

export default AIRecommendations