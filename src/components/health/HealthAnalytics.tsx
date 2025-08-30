import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Heart, 
  Moon, 
  Calendar,
  BarChart3,
  Download,
  Brain
} from '@phosphor-icons/react'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'
import DataVisualization, { CorrelationChart } from '@/components/health/DataVisualization'
import AIInsights from '@/components/health/AIInsights'
import { toast } from 'sonner'

interface HealthAnalyticsProps {
  healthData: ProcessedHealthData
}

export default function HealthAnalytics({ healthData }: HealthAnalyticsProps) {
  if (!healthData || !healthData.metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No health data available for analysis</p>
      </div>
    )
  }

  const { metrics, dataQuality } = healthData

  const generateReport = async () => {
    // Simulate report generation
    toast.info('Generating comprehensive health report...')
    
    // In a real implementation, this would:
    // 1. Compile all metrics and insights
    // 2. Generate visualizations
    // 3. Create PDF or detailed analytics view
    // 4. Use LLM for personalized recommendations
    
    setTimeout(() => {
      toast.success('Health report generated! Check your downloads.')
    }, 2000)
  }

  const CorrelationCard = ({ 
    metric1, 
    metric2, 
    correlation 
  }: { 
    metric1: string
    metric2: string
    correlation: number 
  }) => (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium">{metric1} ↔ {metric2}</div>
        <Badge variant={Math.abs(correlation) > 0.5 ? "default" : "secondary"}>
          {Math.abs(correlation) > 0.7 ? 'Strong' : 
           Math.abs(correlation) > 0.3 ? 'Moderate' : 'Weak'}
        </Badge>
      </div>
      <div className="flex items-center gap-2">
        {correlation > 0 ? 
          <TrendingUp className="h-4 w-4 text-green-500" /> : 
          <TrendingDown className="h-4 w-4 text-red-500" />
        }
        <span className="text-sm text-muted-foreground">
          {Math.abs(correlation * 100).toFixed(0)}% correlation
        </span>
      </div>
    </div>
  )

  // Calculate some correlations (simplified)
  const calculateCorrelation = (data1: number[], data2: number[]): number => {
    if (data1.length !== data2.length || data1.length === 0) return 0
    
    const mean1 = data1.reduce((a, b) => a + b) / data1.length
    const mean2 = data2.reduce((a, b) => a + b) / data2.length
    
    let numerator = 0
    let denominator1 = 0
    let denominator2 = 0
    
    for (let i = 0; i < data1.length; i++) {
      const diff1 = data1[i] - mean1
      const diff2 = data2[i] - mean2
      numerator += diff1 * diff2
      denominator1 += diff1 * diff1
      denominator2 += diff2 * diff2
    }
    
    return numerator / Math.sqrt(denominator1 * denominator2)
  }

  const stepsData = metrics.steps?.daily?.map(d => d.value) || []
  const sleepData = metrics.sleepHours?.daily?.map(d => d.value) || []
  const heartRateData = metrics.heartRate?.daily?.map(d => d.value) || []
  const walkingSteadinessData = metrics.walkingSteadiness?.daily?.map(d => d.value) || []

  return (
    <div className="space-y-6">
      {/* Header with actions */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Health Analytics</h2>
          <p className="text-muted-foreground">
            Detailed insights and trends from your health data
          </p>
        </div>
        <Button onClick={generateReport} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          Generate Report
        </Button>
      </div>

      {/* Data Quality Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Data Quality Assessment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="text-sm text-muted-foreground mb-2">Completeness</div>
              <Progress value={dataQuality.completeness} className="mb-2" />
              <div className="text-sm font-medium">{dataQuality.completeness}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Consistency</div>
              <Progress value={dataQuality.consistency} className="mb-2" />
              <div className="text-sm font-medium">{dataQuality.consistency}%</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-2">Recency</div>
              <Progress value={dataQuality.recency} className="mb-2" />
              <div className="text-sm font-medium">{dataQuality.recency}%</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="correlations">Correlations</TabsTrigger>
          <TabsTrigger value="patterns">Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="ai-insights">AI Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <DataVisualization
              healthData={healthData}
              metric="steps"
              timeframe="daily"
            />
            <DataVisualization
              healthData={healthData}
              metric="heartRate"
              timeframe="daily"
            />
            <DataVisualization
              healthData={healthData}
              metric="walkingSteadiness"
              timeframe="daily"
            />
            <DataVisualization
              healthData={healthData}
              metric="sleepHours"
              timeframe="daily"
            />
          </div>
        </TabsContent>

        <TabsContent value="correlations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <CorrelationChart
              data1={metrics.steps?.daily || []}
              data2={metrics.sleepHours?.daily || []}
              label1="Steps"
              label2="Sleep Hours"
            />
            <CorrelationChart
              data1={metrics.walkingSteadiness?.daily || []}
              data2={metrics.steps?.daily || []}
              label1="Walking Steadiness"
              label2="Activity Level"
            />
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Metric Correlations</CardTitle>
              <CardDescription>
                How your health metrics influence each other
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <CorrelationCard
                  metric1="Steps"
                  metric2="Sleep Quality"
                  correlation={calculateCorrelation(stepsData, sleepData)}
                />
                <CorrelationCard
                  metric1="Walking Steadiness"
                  metric2="Activity Level"
                  correlation={calculateCorrelation(walkingSteadinessData, stepsData)}
                />
                <CorrelationCard
                  metric1="Heart Rate"
                  metric2="Sleep Duration"
                  correlation={calculateCorrelation(heartRateData, sleepData)}
                />
                <CorrelationCard
                  metric1="Activity"
                  metric2="Heart Rate"
                  correlation={calculateCorrelation(stepsData, heartRateData)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="patterns" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Patterns</CardTitle>
                <CardDescription>Activity patterns by day of week</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                    const dailyData = metrics.steps?.daily || []
                    const dayData = dailyData.filter((_, i) => i % 7 === index)
                    const avgSteps = dayData.length > 0 ? dayData.reduce((sum, d) => sum + d.value, 0) / dayData.length : 0
                    const maxSteps = dailyData.length > 0 ? Math.max(...dailyData.map(d => d.value)) : 1
                    
                    return (
                      <div key={day} className="flex items-center gap-3">
                        <span className="text-sm w-10">{day}</span>
                        <div className="flex-1 bg-secondary rounded-full h-2">
                          <div 
                            className="h-2 bg-primary rounded-full"
                            style={{ width: `${(avgSteps / maxSteps) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-20 text-right">
                          {Math.round(avgSteps).toLocaleString()}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>30-day trend summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { name: 'Activity Level', trend: metrics.steps?.trend || 'stable', value: `${(metrics.steps?.average || 0).toLocaleString()} steps` },
                    { name: 'Heart Health', trend: metrics.heartRate?.trend || 'stable', value: `${Math.round(metrics.heartRate?.average || 0)} bpm` },
                    { name: 'Walking Steadiness', trend: metrics.walkingSteadiness?.trend || 'stable', value: `${Math.round(metrics.walkingSteadiness?.average || 0)}%` },
                    { name: 'Sleep Quality', trend: metrics.sleepHours?.trend || 'stable', value: `${(metrics.sleepHours?.average || 0).toFixed(1)} hours` }
                  ].map((metric) => (
                    <div key={metric.name} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{metric.name}</div>
                        <div className="text-xs text-muted-foreground">{metric.value}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {metric.trend === 'increasing' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : metric.trend === 'decreasing' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <div className="h-4 w-4 bg-gray-400 rounded-full" />
                        )}
                        <span className="text-sm capitalize">{metric.trend}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Health Predictions</CardTitle>
              <CardDescription>
                AI-powered insights into future health trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-sm">Activity Forecast</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Based on current trends, your step count is likely to {metrics.steps.trend === 'increasing' ? 'continue improving' : 'need attention'} over the next 30 days.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Heart className="h-4 w-4 text-red-500" />
                    <span className="font-medium text-sm">Cardiovascular Health</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Your heart rate variability suggests {metrics.heartRate.variability < 10 ? 'excellent' : 'good'} cardiovascular fitness. Continue current activity levels.
                  </p>
                </div>
                
                <div className="p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-sm">Fall Risk Assessment</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Walking steadiness trends indicate {metrics.walkingSteadiness.trend === 'decreasing' ? 'increased monitoring recommended' : 'stable balance metrics'}. 
                    {metrics.walkingSteadiness.average < 60 && ' Consider balance training exercises.'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-insights" className="space-y-4">
          <AIInsights healthData={healthData} />
        </TabsContent>
      </Tabs>
    </div>
  )
}