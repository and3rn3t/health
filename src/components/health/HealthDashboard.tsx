import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Heart, Activity, Moon, TrendingUp, TrendingDown, Minus } from '@phosphor-icons/react'

interface HealthDashboardProps {
  healthData: any
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

  const { metrics, insights } = healthData

  return (
    <div className="space-y-6">
      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Daily Steps"
          value={metrics.steps?.average?.toLocaleString() || 'N/A'}
          unit="avg"
          trend={metrics.steps?.trend || 'stable'}
          icon={<Activity className="h-4 w-4" />}
          description="30-day average"
          progress={Math.min((metrics.steps?.average / 10000) * 100, 100)}
        />
        
        <MetricCard
          title="Resting Heart Rate"
          value={metrics.heartRate?.average || 'N/A'}
          unit="bpm"
          trend={metrics.heartRate?.trend || 'stable'}
          icon={<Heart className="h-4 w-4" />}
          description="30-day average"
        />
        
        <MetricCard
          title="Walking Steadiness"
          value={Math.round(metrics.walkingSteadiness?.average || 0)}
          unit="%"
          trend={metrics.walkingSteadiness?.trend || 'stable'}
          icon={<Activity className="h-4 w-4" />}
          description="Balance score"
          progress={metrics.walkingSteadiness?.average || 0}
          className={metrics.walkingSteadiness?.average < 60 ? 'border-accent' : ''}
        />
        
        <MetricCard
          title="Sleep"
          value={metrics.sleepHours?.average?.toFixed(1) || 'N/A'}
          unit="hrs"
          trend={metrics.sleepHours?.trend || 'stable'}
          icon={<Moon className="h-4 w-4" />}
          description="Average nightly"
          progress={Math.min((metrics.sleepHours?.average / 9) * 100, 100)}
        />
      </div>

      {/* Health Insights */}
      <Card>
        <CardHeader>
          <CardTitle>AI Health Insights</CardTitle>
          <CardDescription>
            Analysis based on your recent health data patterns
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

      {/* Recent Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Activity Trends</CardTitle>
            <CardDescription>Last 7 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {metrics.steps?.daily?.slice(-7).map((day: any, index: number) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 bg-secondary rounded-full h-2">
                      <div 
                        className="h-2 bg-primary rounded-full"
                        style={{ width: `${Math.min((day.value / 10000) * 100, 100)}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium w-16 text-right">
                      {day.value.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Fall Risk Indicators</CardTitle>
            <CardDescription>Key mobility metrics</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Walking Steadiness</span>
                <Badge variant={metrics.walkingSteadiness?.average > 70 ? 'default' : 'destructive'}>
                  {metrics.walkingSteadiness?.average > 70 ? 'Good' : 'At Risk'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Activity Level</span>
                <Badge variant={metrics.steps?.average > 5000 ? 'default' : 'secondary'}>
                  {metrics.steps?.average > 5000 ? 'Active' : 'Low'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Heart Rate Variability</span>
                <Badge variant="default">Normal</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}