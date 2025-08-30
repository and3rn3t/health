import { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MagnifyingGlass, X, TrendUp, TrendDown, Heart, Activity, Shield, Clock, Target } from '@phosphor-icons/react'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface HealthSearchProps {
  healthData: ProcessedHealthData
  onNavigateToInsight?: (category: string, metric?: string) => void
}

interface SearchResult {
  id: string
  category: 'metrics' | 'trends' | 'recommendations' | 'risk-factors' | 'achievements'
  title: string
  description: string
  value?: string | number
  trend?: 'up' | 'down' | 'stable'
  priority?: 'high' | 'medium' | 'low'
  tags: string[]
  navigateTo?: { tab: string; metric?: string }
}

export default function HealthSearch({ healthData, onNavigateToInsight }: HealthSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Generate searchable content from health data
  const searchableContent = useMemo((): SearchResult[] => {
    const results: SearchResult[] = []

    // Metrics
    if (healthData.metrics) {
      Object.entries(healthData.metrics).forEach(([key, metric]) => {
        if (metric && typeof metric === 'object' && 'value' in metric) {
          results.push({
            id: `metric-${key}`,
            category: 'metrics',
            title: metric.name || key.replace(/([A-Z])/g, ' $1').trim(),
            description: `Current value: ${metric.value} ${metric.unit || ''}`,
            value: metric.value,
            trend: metric.trend as 'up' | 'down' | 'stable',
            tags: [key, 'metric', metric.category || 'health'],
            navigateTo: { tab: 'analytics', metric: key }
          })
        }
      })
    }

    // Health insights and trends
    if (healthData.insights) {
      healthData.insights.forEach((insight, index) => {
        results.push({
          id: `insight-${index}`,
          category: 'trends',
          title: insight.title || 'Health Insight',
          description: insight.description || insight.message || '',
          priority: insight.severity as 'high' | 'medium' | 'low',
          tags: ['insight', 'trend', insight.category || 'general'],
          navigateTo: { tab: 'dashboard' }
        })
      })
    }

    // Fall risk factors
    if (healthData.fallRiskFactors) {
      healthData.fallRiskFactors.forEach((factor, index) => {
        results.push({
          id: `risk-${index}`,
          category: 'risk-factors',
          title: factor.factor || 'Risk Factor',
          description: factor.description || `${factor.risk} risk factor`,
          priority: factor.risk as 'high' | 'medium' | 'low',
          tags: ['fall-risk', 'safety', factor.factor?.toLowerCase() || 'risk'],
          navigateTo: { tab: 'fall-risk' }
        })
      })
    }

    // Recommendations
    if (healthData.recommendations) {
      healthData.recommendations.forEach((rec, index) => {
        results.push({
          id: `recommendation-${index}`,
          category: 'recommendations',
          title: rec.title || 'Health Recommendation',
          description: rec.description || '',
          priority: rec.priority as 'high' | 'medium' | 'low',
          tags: ['recommendation', 'action', rec.category?.toLowerCase() || 'health'],
          navigateTo: { tab: 'ai-recommendations' }
        })
      })
    }

    // Achievements and milestones
    if (healthData.achievements) {
      healthData.achievements.forEach((achievement, index) => {
        results.push({
          id: `achievement-${index}`,
          category: 'achievements',
          title: achievement.title || 'Achievement',
          description: achievement.description || '',
          tags: ['achievement', 'milestone', 'progress'],
          navigateTo: { tab: 'game-center' }
        })
      })
    }

    return results
  }, [healthData])

  // Filter results based on search query and category
  const filteredResults = useMemo(() => {
    let results = searchableContent

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(result => result.category === selectedCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      results = results.filter(result => 
        result.title.toLowerCase().includes(query) ||
        result.description.toLowerCase().includes(query) ||
        result.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return results
  }, [searchableContent, searchQuery, selectedCategory])

  const handleResultClick = (result: SearchResult) => {
    if (result.navigateTo && onNavigateToInsight) {
      onNavigateToInsight(result.navigateTo.tab, result.navigateTo.metric)
    }
  }

  const categoryIcons = {
    metrics: Heart,
    trends: TrendUp,
    'risk-factors': Shield,
    recommendations: Target,
    achievements: Activity
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'metrics': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'trends': return 'bg-green-50 text-green-700 border-green-200'
      case 'risk-factors': return 'bg-red-50 text-red-700 border-red-200'
      case 'recommendations': return 'bg-purple-50 text-purple-700 border-purple-200'
      case 'achievements': return 'bg-yellow-50 text-yellow-700 border-yellow-200'
      default: return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high': return 'destructive'
      case 'medium': return 'secondary'
      case 'low': return 'outline'
      default: return 'outline'
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MagnifyingGlass className="h-5 w-5" />
            Search Health Insights
          </CardTitle>
          <CardDescription>
            Find specific metrics, trends, recommendations, and insights from your health data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <MagnifyingGlass className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search for metrics, trends, recommendations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Category Filters */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="text-xs">
                All ({searchableContent.length})
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">
                <Heart className="h-3 w-3 mr-1" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">
                <TrendUp className="h-3 w-3 mr-1" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="risk-factors" className="text-xs">
                <Shield className="h-3 w-3 mr-1" />
                Risks
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs">
                <Target className="h-3 w-3 mr-1" />
                Tips
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs">
                <Activity className="h-3 w-3 mr-1" />
                Goals
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Search Results */}
      <div className="space-y-4">
        {filteredResults.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <MagnifyingGlass className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {searchQuery ? 'No results found' : 'Start searching'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery 
                  ? `No results found for "${searchQuery}". Try different keywords.`
                  : 'Enter keywords to search through your health insights, metrics, and recommendations.'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Search Results ({filteredResults.length})
              </h3>
              {searchQuery && (
                <Badge variant="outline" className="text-xs">
                  "{searchQuery}"
                </Badge>
              )}
            </div>

            <div className="grid gap-3">
              {filteredResults.map((result) => {
                const IconComponent = categoryIcons[result.category] || Activity
                return (
                  <Card 
                    key={result.id} 
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4 text-muted-foreground" />
                            <h4 className="font-medium text-foreground">{result.title}</h4>
                            {result.trend && (
                              <div className="flex items-center">
                                {result.trend === 'up' && <TrendUp className="h-3 w-3 text-green-500" />}
                                {result.trend === 'down' && <TrendDown className="h-3 w-3 text-red-500" />}
                              </div>
                            )}
                          </div>
                          
                          <p className="text-sm text-muted-foreground">
                            {result.description}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getCategoryColor(result.category)}`}
                            >
                              {result.category.replace('-', ' ')}
                            </Badge>
                            
                            {result.priority && (
                              <Badge 
                                variant={getPriorityColor(result.priority) as any}
                                className="text-xs"
                              >
                                {result.priority} priority
                              </Badge>
                            )}

                            {result.value && (
                              <Badge variant="secondary" className="text-xs">
                                {result.value}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <Button variant="ghost" size="sm" className="text-xs">
                          View →
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Insights */}
      {!searchQuery && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Insights</CardTitle>
            <CardDescription>Popular searches and trending insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Button
                variant="outline"
                onClick={() => setSearchQuery('heart rate')}
                className="justify-start h-auto p-3"
              >
                <Heart className="h-4 w-4 mr-2 text-red-500" />
                <div className="text-left">
                  <div className="font-medium text-xs">Heart Rate</div>
                  <div className="text-xs text-muted-foreground">Cardio metrics</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => setSearchQuery('fall risk')}
                className="justify-start h-auto p-3"
              >
                <Shield className="h-4 w-4 mr-2 text-orange-500" />
                <div className="text-left">
                  <div className="font-medium text-xs">Fall Risk</div>
                  <div className="text-xs text-muted-foreground">Safety insights</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => setSearchQuery('sleep')}
                className="justify-start h-auto p-3"
              >
                <Clock className="h-4 w-4 mr-2 text-blue-500" />
                <div className="text-left">
                  <div className="font-medium text-xs">Sleep</div>
                  <div className="text-xs text-muted-foreground">Rest patterns</div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => setSearchQuery('steps')}
                className="justify-start h-auto p-3"
              >
                <Activity className="h-4 w-4 mr-2 text-green-500" />
                <div className="text-left">
                  <div className="font-medium text-xs">Activity</div>
                  <div className="text-xs text-muted-foreground">Movement data</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}