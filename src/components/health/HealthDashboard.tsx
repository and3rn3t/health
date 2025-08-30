import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Heart, Activity, Moon, TrendingUp, TrendingDown, Minus, Brain, Shield, Scale } from '@phosphor-icons/react'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'

interface HealthDashboardProps {
  healthData: ProcessedHealthData | null
}

interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  trend: 'increasing' | 'decreasing' | 'stable'
  icon: React.ReactNode
  description?: string
  progress?: number
  className?: string
}

function MetricCard({ title, value, unit, trend, icon, description, progress, className }: MetricCardProps) {
  const getTrendIcon = () => {
    switch (trend) {
      case 'increasing':
        return <TrendingUp className="h-4 w-4 text-green-500" />
      case 'decreasing':
        return <TrendingDown className="h-4 w-4 text-red-500" />
      default:
        return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'increasing':
        return 'text-green-600'
      case 'decreasing':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
        <div className="flex items-center gap-1">
          {getTrendIcon()}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}
          {unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {description && (
          <p className={`text-xs ${getTrendColor()} mt-1`}>
            {description}
          </p>
        )}
        {progress !== undefined && (
          <Progress value={progress} className="mt-3" />
        )}
      </CardContent>
    </Card>
  )
}

export default function HealthDashboard({ healthData }: HealthDashboardProps) {
  if (!healthData || !healthData.metrics) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No health data available</p>
      </div>
    )
  }

  const { metrics, insights, dataQuality, healthScore, fallRiskFactors } = healthData

  const getDataQualityColor = () => {
    switch (dataQuality?.overall) {
      case 'excellent': return 'text-green-600'
      case 'good': return 'text-blue-600'
      case 'fair': return 'text-yellow-600'
      default: return 'text-red-600'
    }
  }

  const getHealthScoreColor = () => {
    const score = healthScore || 0
    if (score >= 80) return 'text-green-600'
    if (score >= 60) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Health Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Brain className="h-4 w-4 text-primary" />
              Health Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getHealthScoreColor()}`}>
              {healthScore || 0}
              <span className="text-sm font-normal text-muted-foreground ml-1">/100</span>
            </div>
            <Progress value={healthScore || 0} className="mt-3" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Fall Risk
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {fallRiskFactors?.filter(f => f.risk === 'high').length > 0 ? 'High' :
               fallRiskFactors?.filter(f => f.risk === 'moderate').length > 0 ? 'Moderate' : 'Low'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fallRiskFactors?.length || 0} risk factors identified
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Scale className="h-4 w-4" />
              Data Quality
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold capitalize ${getDataQualityColor()}`}>
              {dataQuality?.overall || 'Unknown'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {(dataQuality?.completeness ?? 0)}% complete
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Steps"
          value={metrics.steps?.average?.toLocaleString() || 'N/A'}
          unit="avg"
          trend={metrics.steps?.trend || 'stable'}
          icon={<Activity className="h-4 w-4" />}
          description={`${metrics.steps?.percentileRank || 0}th percentile`}
          progress={Math.min(((metrics.steps?.average || 0) / 10000) * 100, 100)}
        />
        
        <MetricCard
          title="Resting Heart Rate"
          value={Math.round(metrics.heartRate?.average || 0)}
          unit="bpm"
          trend={metrics.heartRate?.trend || 'stable'}
          icon={<Heart className="h-4 w-4" />}
          description={`Reliability: ${metrics.heartRate?.reliability || 0}%`}
        />
        
        <MetricCard
          title="Walking Steadiness"
          value={Math.round(metrics.walkingSteadiness?.average || 0)}
          unit="%"
          trend={metrics.walkingSteadiness?.trend || 'stable'}
          icon={<Activity className="h-4 w-4" />}
          description={`Variability: ${metrics.walkingSteadiness?.variability?.toFixed(1) || '0.0'}%`}
          progress={metrics.walkingSteadiness?.average || 0}
          className={(metrics.walkingSteadiness?.average || 100) < 60 ? 'border-destructive/20' : ''}
        />
        
        <MetricCard
          title="Sleep"
          value={metrics.sleepHours?.average?.toFixed(1) || 'N/A'}
          unit="hrs"
          trend={metrics.sleepHours?.trend || 'stable'}
          icon={<Moon className="h-4 w-4" />}
          description="Average nightly"
          progress={Math.min(((metrics.sleepHours?.average || 0) / 9) * 100, 100)}
        />
      </div>

      {/* Enhanced Insights Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              AI Health Insights
            </CardTitle>
            <CardDescription>
              Analysis based on your health data patterns and trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights?.map((insight: string, index: number) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-muted/30 rounded-lg">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <p className="text-sm">{insight}</p>
                </div>
              )) || (
                <p className="text-muted-foreground">No insights available yet.</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Fall Risk Factors
            </CardTitle>
            <CardDescription>
              Identified risk factors and recommendations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {fallRiskFactors?.map((factor, index) => (
                <div key={index} className="space-y-2 p-3 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{factor.factor}</span>
                    <Badge 
                      variant={factor.risk === 'high' ? 'destructive' : 
                              factor.risk === 'moderate' ? 'secondary' : 'default'}
                    >
                      {factor.risk} risk
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {factor.recommendation}
                  </p>
                </div>
              )) || (
                <p className="text-muted-foreground">No significant risk factors identified.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Trends Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Activity Trends</CardTitle>
          <CardDescription>Last 14 days step count progression</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.steps?.daily?.slice(-14)?.map((day, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground w-16">
                  {new Date(day.date).toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </span>
                <div className="flex items-center gap-3 flex-1 mx-4">
                  <div className="flex-1 bg-secondary rounded-full h-2">
                    <div 
                      className="h-2 bg-primary rounded-full transition-all duration-300"
                      style={{ width: `${Math.min((day.value / 10000) * 100, 100)}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-20 text-right">
                    {day.value.toLocaleString()}
                  </span>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">No activity data available</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}