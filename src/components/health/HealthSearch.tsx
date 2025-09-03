import { useState, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Search,
  X,
  TrendingUp,
  TrendingDown,
  Heart,
  Activity,
  Shield,
  Clock,
  Target,
  Filter,
  Calendar,
  LineChart,
} from 'lucide-react';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';

interface HealthSearchProps {
  healthData: ProcessedHealthData;
  onNavigateToInsight?: (category: string, metric?: string) => void;
}

interface SearchResult {
  id: string;
  category:
    | 'metrics'
    | 'trends'
    | 'recommendations'
    | 'risk-factors'
    | 'achievements';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  priority?: 'high' | 'medium' | 'low';
  tags: string[];
  navigateTo?: { tab: string; metric?: string };
  date?: Date;
  healthScore?: number;
  numericValue?: number;
}

interface FilterOptions {
  dateRange: {
    enabled: boolean;
    startDate: string;
    endDate: string;
  };
  healthScore: {
    enabled: boolean;
    min: number;
    max: number;
  };
  valueRange: {
    enabled: boolean;
    min: number;
    max: number;
  };
}

/**
 * HealthSearch Component
 *
 * Provides comprehensive search functionality for health data with advanced filtering:
 * - Text search across metrics, trends, recommendations, risk factors, and achievements
 * - Category filtering by data type
 * - Date range filtering with quick presets (7d, 30d)
 * - Health score threshold filtering (0-100 range)
 * - Metric value range filtering for numeric data
 *
 * Features collapsible advanced filters with active filter indicators
 * and contextual result display showing dates and scores.
 */
export default function HealthSearch({
  healthData,
  onNavigateToInsight,
}: HealthSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    dateRange: {
      enabled: false,
      startDate: '',
      endDate: '',
    },
    healthScore: {
      enabled: false,
      min: 0,
      max: 100,
    },
    valueRange: {
      enabled: false,
      min: 0,
      max: 100,
    },
  });

  // Helper function to parse dates and add context
  const getContextualDate = (daysAgo: number = 0) => {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  };

  // Helper function to extract numeric value for filtering
  const extractNumericValue = (value: any): number | null => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const match = value.match(/[\d.]+/);
      return match ? parseFloat(match[0]) : null;
    }
    return null;
  };

  // Generate searchable content from health data
  const searchableContent = useMemo((): SearchResult[] => {
    const results: SearchResult[] = [];

    // Metrics
    if (healthData.metrics) {
      Object.entries(healthData.metrics).forEach(([key, metric]) => {
        if (metric && typeof metric === 'object' && 'value' in metric) {
          const numericValue = extractNumericValue(metric.value);
          results.push({
            id: `metric-${key}`,
            category: 'metrics',
            title: metric.name || key.replace(/([A-Z])/g, ' $1').trim(),
            description: `Current value: ${metric.value} ${metric.unit || ''}`,
            value: metric.value,
            trend: metric.trend as 'up' | 'down' | 'stable',
            tags: [key, 'metric', metric.category || 'health'],
            navigateTo: { tab: 'analytics', metric: key },
            date: getContextualDate(Math.floor(Math.random() * 30)), // Simulate recent data
            healthScore: healthData.healthScore || 75,
            numericValue: numericValue,
          });
        }
      });
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
          navigateTo: { tab: 'dashboard' },
          date: getContextualDate(Math.floor(Math.random() * 7)), // Recent insights
          healthScore: healthData.healthScore || 75,
        });
      });
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
          navigateTo: { tab: 'fall-risk' },
          date: getContextualDate(Math.floor(Math.random() * 14)), // Risk assessments
          healthScore: healthData.healthScore || 75,
        });
      });
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
          tags: [
            'recommendation',
            'action',
            rec.category?.toLowerCase() || 'health',
          ],
          navigateTo: { tab: 'ai-recommendations' },
          date: getContextualDate(Math.floor(Math.random() * 3)), // Recent recommendations
          healthScore: healthData.healthScore || 75,
        });
      });
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
          navigateTo: { tab: 'game-center' },
          date: getContextualDate(Math.floor(Math.random() * 21)), // Past achievements
          healthScore: healthData.healthScore || 75,
        });
      });
    }

    return results;
  }, [healthData]);

  // Filter results based on search query, category, and advanced filters
  const filteredResults = useMemo(() => {
    let results = searchableContent;

    // Filter by category
    if (selectedCategory !== 'all') {
      results = results.filter(
        (result) => result.category === selectedCategory
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (result) =>
          result.title.toLowerCase().includes(query) ||
          result.description.toLowerCase().includes(query) ||
          result.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }

    // Apply advanced filters
    if (
      filters.dateRange.enabled &&
      filters.dateRange.startDate &&
      filters.dateRange.endDate
    ) {
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      results = results.filter((result) => {
        if (!result.date) return false;
        return result.date >= startDate && result.date <= endDate;
      });
    }

    if (filters.healthScore.enabled) {
      results = results.filter((result) => {
        if (result.healthScore === undefined) return false;
        return (
          result.healthScore >= filters.healthScore.min &&
          result.healthScore <= filters.healthScore.max
        );
      });
    }

    if (filters.valueRange.enabled) {
      results = results.filter((result) => {
        if (result.numericValue === null || result.numericValue === undefined)
          return false;
        return (
          result.numericValue >= filters.valueRange.min &&
          result.numericValue <= filters.valueRange.max
        );
      });
    }

    return results;
  }, [searchableContent, searchQuery, selectedCategory, filters]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.dateRange.enabled) count++;
    if (filters.healthScore.enabled) count++;
    if (filters.valueRange.enabled) count++;
    return count;
  }, [filters]);

  // Clear all filters
  const clearAllFilters = () => {
    setFilters({
      dateRange: { enabled: false, startDate: '', endDate: '' },
      healthScore: { enabled: false, min: 0, max: 100 },
      valueRange: { enabled: false, min: 0, max: 100 },
    });
    setSearchQuery('');
    setSelectedCategory('all');
  };

  // Quick date range presets
  const setQuickDateRange = (days: number) => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - days);

    setFilters((prev) => ({
      ...prev,
      dateRange: {
        enabled: true,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
      },
    }));
  };

  const handleResultClick = (result: SearchResult) => {
    if (result.navigateTo && onNavigateToInsight) {
      onNavigateToInsight(result.navigateTo.tab, result.navigateTo.metric);
    }
  };

  const categoryIcons = {
    metrics: Heart,
    trends: TrendingUp,
    'risk-factors': Shield,
    recommendations: Target,
    achievements: Activity,
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'metrics':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'trends':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'risk-factors':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'recommendations':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'achievements':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      case 'low':
        return 'outline';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Health Insights
          </CardTitle>
          <CardDescription>
            Find specific metrics, trends, recommendations, and insights from
            your health data. Use advanced filters to narrow results by date
            range, health score, or metric values.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform" />
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
                className="absolute right-1 top-1/2 h-6 w-6 -translate-y-1/2 transform p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {/* Advanced Filters Toggle */}
          <div className="flex items-center justify-between">
            <Collapsible
              open={showAdvancedFilters}
              onOpenChange={setShowAdvancedFilters}
            >
              <CollapsibleTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <Filter className="h-4 w-4" />
                  Advanced Filters
                  {activeFiltersCount > 0 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-5 px-1.5 text-xs"
                    >
                      {activeFiltersCount}
                    </Badge>
                  )}
                </Button>
              </CollapsibleTrigger>

              <CollapsibleContent className="mt-4">
                <Card>
                  <CardContent className="space-y-4 p-4">
                    {/* Date Range Filter */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={filters.dateRange.enabled}
                            onChange={(e) =>
                              setFilters((prev) => ({
                                ...prev,
                                dateRange: {
                                  ...prev.dateRange,
                                  enabled: e.target.checked,
                                },
                              }))
                            }
                            className="rounded border-border"
                          />
                          <Calendar className="h-4 w-4" />
                          Filter by Date Range
                        </Label>
                        {filters.dateRange.enabled && (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setQuickDateRange(7)}
                              className="h-6 text-xs"
                            >
                              7d
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setQuickDateRange(30)}
                              className="h-6 text-xs"
                            >
                              30d
                            </Button>
                          </div>
                        )}
                      </div>

                      {filters.dateRange.enabled && (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Start Date</Label>
                            <Input
                              type="date"
                              value={filters.dateRange.startDate}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  dateRange: {
                                    ...prev.dateRange,
                                    startDate: e.target.value,
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                          <div>
                            <Label className="text-xs">End Date</Label>
                            <Input
                              type="date"
                              value={filters.dateRange.endDate}
                              onChange={(e) =>
                                setFilters((prev) => ({
                                  ...prev,
                                  dateRange: {
                                    ...prev.dateRange,
                                    endDate: e.target.value,
                                  },
                                }))
                              }
                              className="text-sm"
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Health Score Filter */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.healthScore.enabled}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              healthScore: {
                                ...prev.healthScore,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-border"
                        />
                        <LineChart className="h-4 w-4" />
                        Filter by Health Score
                      </Label>

                      {filters.healthScore.enabled && (
                        <div className="space-y-2">
                          <div className="text-muted-foreground flex justify-between text-xs">
                            <span>
                              Score: {filters.healthScore.min} -{' '}
                              {filters.healthScore.max}
                            </span>
                          </div>
                          <Slider
                            value={[
                              filters.healthScore.min,
                              filters.healthScore.max,
                            ]}
                            onValueChange={([min, max]) =>
                              setFilters((prev) => ({
                                ...prev,
                                healthScore: { ...prev.healthScore, min, max },
                              }))
                            }
                            max={100}
                            min={0}
                            step={5}
                            className="w-full"
                          />
                          <div className="text-muted-foreground flex justify-between text-xs">
                            <span>Poor (0)</span>
                            <span>Excellent (100)</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Value Range Filter */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={filters.valueRange.enabled}
                          onChange={(e) =>
                            setFilters((prev) => ({
                              ...prev,
                              valueRange: {
                                ...prev.valueRange,
                                enabled: e.target.checked,
                              },
                            }))
                          }
                          className="rounded border-border"
                        />
                        <Target className="h-4 w-4" />
                        Filter by Metric Values
                      </Label>

                      {filters.valueRange.enabled && (
                        <div className="space-y-2">
                          <div className="text-muted-foreground flex justify-between text-xs">
                            <span>
                              Range: {filters.valueRange.min} -{' '}
                              {filters.valueRange.max}
                            </span>
                          </div>
                          <Slider
                            value={[
                              filters.valueRange.min,
                              filters.valueRange.max,
                            ]}
                            onValueChange={([min, max]) =>
                              setFilters((prev) => ({
                                ...prev,
                                valueRange: { ...prev.valueRange, min, max },
                              }))
                            }
                            max={1000}
                            min={0}
                            step={10}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>

                    {/* Clear Filters */}
                    {activeFiltersCount > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={clearAllFilters}
                        className="w-full"
                      >
                        <X className="mr-2 h-3 w-3" />
                        Clear All Filters
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Category Filters */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="all" className="text-xs">
                All ({searchableContent.length})
              </TabsTrigger>
              <TabsTrigger value="metrics" className="text-xs">
                <Heart className="mr-1 h-3 w-3" />
                Metrics
              </TabsTrigger>
              <TabsTrigger value="trends" className="text-xs">
                <TrendingUp className="mr-1 h-3 w-3" />
                Trends
              </TabsTrigger>
              <TabsTrigger value="risk-factors" className="text-xs">
                <Shield className="mr-1 h-3 w-3" />
                Risks
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="text-xs">
                <Target className="mr-1 h-3 w-3" />
                Tips
              </TabsTrigger>
              <TabsTrigger value="achievements" className="text-xs">
                <Activity className="mr-1 h-3 w-3" />
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
              <Search className="text-muted-foreground mb-4 h-12 w-12" />
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {searchQuery || activeFiltersCount > 0
                  ? 'No results found'
                  : 'Start searching'}
              </h3>
              <p className="text-muted-foreground">
                {searchQuery || activeFiltersCount > 0
                  ? `No results found${searchQuery ? ` for "${searchQuery}"` : ''}${activeFiltersCount > 0 ? ' with current filters' : ''}. Try adjusting your search criteria.`
                  : 'Enter keywords to search through your health insights, metrics, and recommendations.'}
              </p>
              {activeFiltersCount > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFilters}
                  className="mt-4"
                >
                  <X className="mr-2 h-3 w-3" />
                  Clear All Filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-foreground">
                Search Results ({filteredResults.length})
                {activeFiltersCount > 0 && (
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    • {activeFiltersCount} filter
                    {activeFiltersCount > 1 ? 's' : ''} active
                  </span>
                )}
              </h3>
              <div className="flex items-center gap-2">
                {searchQuery && (
                  <Badge variant="outline" className="text-xs">
                    "{searchQuery}"
                  </Badge>
                )}
                {activeFiltersCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearAllFilters}
                    className="h-6 text-xs"
                  >
                    <X className="mr-1 h-3 w-3" />
                    Clear
                  </Button>
                )}
              </div>
            </div>

            <div className="grid gap-3">
              {filteredResults.map((result) => {
                const IconComponent =
                  categoryIcons[result.category] || Activity;
                return (
                  <Card
                    key={result.id}
                    className="cursor-pointer transition-shadow hover:shadow-md"
                    onClick={() => handleResultClick(result)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center gap-2">
                            <IconComponent className="text-muted-foreground h-4 w-4" />
                            <h4 className="font-medium text-foreground">
                              {result.title}
                            </h4>
                            {result.trend && (
                              <div className="flex items-center">
                                {result.trend === 'up' && (
                                  <TrendingUp className="h-3 w-3 text-green-500" />
                                )}
                                {result.trend === 'down' && (
                                  <TrendingDown className="h-3 w-3 text-red-500" />
                                )}
                              </div>
                            )}
                          </div>

                          <p className="text-muted-foreground text-sm">
                            {result.description}
                          </p>

                          <div className="flex flex-wrap items-center gap-2">
                            <Badge
                              variant="outline"
                              className={`text-xs ${getCategoryColor(result.category)}`}
                            >
                              {result.category.replace('-', ' ')}
                            </Badge>

                            {result.priority && (
                              <Badge
                                variant={
                                  getPriorityColor(result.priority) as any
                                }
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

                            {result.date && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="mr-1 h-3 w-3" />
                                {result.date.toLocaleDateString()}
                              </Badge>
                            )}

                            {result.healthScore && (
                              <Badge variant="outline" className="text-xs">
                                <LineChart className="mr-1 h-3 w-3" />
                                Score: {result.healthScore}
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
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Quick Insights */}
      {!searchQuery && activeFiltersCount === 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Insights</CardTitle>
            <CardDescription>
              Popular searches and trending insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <Button
                variant="outline"
                onClick={() => setSearchQuery('heart rate')}
                className="h-auto justify-start p-3"
              >
                <Heart className="mr-2 h-4 w-4 text-red-500" />
                <div className="text-left">
                  <div className="text-xs font-medium">Heart Rate</div>
                  <div className="text-muted-foreground text-xs">
                    Cardio metrics
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => setSearchQuery('fall risk')}
                className="h-auto justify-start p-3"
              >
                <Shield className="mr-2 h-4 w-4 text-orange-500" />
                <div className="text-left">
                  <div className="text-xs font-medium">Fall Risk</div>
                  <div className="text-muted-foreground text-xs">
                    Safety insights
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => setSearchQuery('sleep')}
                className="h-auto justify-start p-3"
              >
                <Clock className="mr-2 h-4 w-4 text-blue-500" />
                <div className="text-left">
                  <div className="text-xs font-medium">Sleep</div>
                  <div className="text-muted-foreground text-xs">
                    Rest patterns
                  </div>
                </div>
              </Button>

              <Button
                variant="outline"
                onClick={() => setSearchQuery('steps')}
                className="h-auto justify-start p-3"
              >
                <Activity className="mr-2 h-4 w-4 text-green-500" />
                <div className="text-left">
                  <div className="text-xs font-medium">Activity</div>
                  <div className="text-muted-foreground text-xs">
                    Movement data
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
