import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Shield, AlertTriangle, TrendingDown, Activity, Heart, Phone } from '@phosphor-icons/react'

interface FallRiskMonitorProps {
  healthData: any
  fallRiskScore: number
  setFallRiskScore: (score: number) => void
}

interface RiskFactorProps {
  label: string
  value: number
  threshold: number
  unit?: string
  description: string
}

function RiskFactor({ label, value, threshold, unit, description }: RiskFactorProps) {
  const isRisk = value < threshold
  const percentage = Math.max(0, Math.min(100, (value / threshold) * 100))

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {value}{unit}
          </span>
          {isRisk && <AlertTriangle className="h-4 w-4 text-accent" />}
        </div>
      </div>
      <Progress 
        value={percentage} 
        className={`h-2 ${isRisk ? 'bg-red-100' : ''}`}
      />
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  )
}

function FallRiskGauge({ score }: { score: number }) {
  const getRiskLevel = (score: number) => {
    if (score < 30) return { level: 'Low', color: 'text-green-600', bgColor: 'bg-green-100' }
    if (score < 70) return { level: 'Moderate', color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
    return { level: 'High', color: 'text-red-600', bgColor: 'bg-red-100' }
  }

  const risk = getRiskLevel(score)

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={`${(score / 100) * 314} 314`}
            className={risk.color}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-xs text-muted-foreground">Risk Score</span>
        </div>
      </div>
      <Badge variant={score > 70 ? 'destructive' : score > 30 ? 'secondary' : 'default'} className="text-sm">
        {risk.level} Risk
      </Badge>
    </div>
  )
}

export default function FallRiskMonitor({ healthData, fallRiskScore, setFallRiskScore }: FallRiskMonitorProps) {
  useEffect(() => {
    if (healthData && healthData.metrics) {
      // Calculate fall risk based on multiple factors
      const walkingSteadiness = healthData.metrics.walkingSteadiness?.average || 100
      const activityLevel = healthData.metrics.steps?.average || 10000
      const heartRateVariability = 100 // Mock value
      
      // Risk calculation algorithm
      let risk = 0
      
      // Walking steadiness (40% of risk)
      if (walkingSteadiness < 50) risk += 40
      else if (walkingSteadiness < 70) risk += 20
      
      // Activity level (30% of risk)
      if (activityLevel < 3000) risk += 30
      else if (activityLevel < 5000) risk += 15
      
      // Heart rate variability (20% of risk)
      if (heartRateVariability < 70) risk += 20
      else if (heartRateVariability < 85) risk += 10
      
      // Age factor (10% of risk) - mock
      risk += 10
      
      setFallRiskScore(Math.min(100, risk))
    }
  }, [healthData, setFallRiskScore])

  if (!healthData || !healthData.metrics) {
    return (
      <Card>
        <CardContent className="text-center py-8">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Import health data to assess fall risk</p>
        </CardContent>
      </Card>
    )
  }

  const { metrics } = healthData
  const isHighRisk = fallRiskScore > 70

  return (
    <div className="space-y-6">
      {isHighRisk && (
        <Alert className="border-accent bg-accent/10">
          <AlertTriangle className="h-4 w-4 text-accent" />
          <AlertDescription className="text-accent-foreground">
            <strong>High fall risk detected.</strong> Consider consulting with your healthcare provider 
            and review the recommendations below.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Score Display */}
        <Card className="lg:col-span-1">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Fall Risk Assessment
            </CardTitle>
            <CardDescription>
              Based on your recent health metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <FallRiskGauge score={fallRiskScore} />
          </CardContent>
        </Card>

        {/* Risk Factors */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Risk Factors Analysis</CardTitle>
            <CardDescription>
              Key metrics that influence your fall risk assessment
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <RiskFactor
              label="Walking Steadiness"
              value={Math.round(metrics.walkingSteadiness?.average || 0)}
              threshold={70}
              unit="%"
              description="Measures balance and gait stability during walking"
            />
            <RiskFactor
              label="Daily Activity"
              value={metrics.steps?.average || 0}
              threshold={5000}
              unit=" steps"
              description="Higher activity levels are associated with better balance"
            />
            <RiskFactor
              label="Heart Rate Variability"
              value={85}
              threshold={70}
              unit="%"
              description="Indicator of cardiovascular fitness and autonomic function"
            />
            <RiskFactor
              label="Sleep Quality"
              value={metrics.sleepHours?.average || 0}
              threshold={7}
              unit=" hrs"
              description="Adequate sleep is crucial for balance and coordination"
            />
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {fallRiskScore > 70 && (
                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <h4 className="font-medium text-accent-foreground mb-2">High Priority</h4>
                  <ul className="text-sm space-y-1 text-accent-foreground">
                    <li>• Schedule appointment with healthcare provider</li>
                    <li>• Consider physical therapy evaluation</li>
                    <li>• Review home safety hazards</li>
                  </ul>
                </div>
              )}
              
              {metrics.walkingSteadiness?.average < 70 && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Balance Improvement</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Practice tai chi or yoga</li>
                    <li>• Single-leg standing exercises</li>
                    <li>• Walking heel-to-toe practice</li>
                  </ul>
                </div>
              )}
              
              {metrics.steps?.average < 5000 && (
                <div className="p-3 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Activity Increase</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>• Start with 10-minute walks</li>
                    <li>• Use stairs when possible</li>
                    <li>• Join group exercise classes</li>
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Emergency Preparedness
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Alert>
                <AlertDescription>
                  In case of a fall, emergency contacts will be automatically notified. 
                  Ensure your contacts are up to date.
                </AlertDescription>
              </Alert>
              
              <div className="space-y-2">
                <h4 className="font-medium">Fall Prevention Tips:</h4>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  <li>• Remove loose rugs and clutter</li>
                  <li>• Install grab bars in bathroom</li>
                  <li>• Ensure adequate lighting</li>
                  <li>• Wear non-slip shoes</li>
                  <li>• Keep emergency phone accessible</li>
                </ul>
              </div>
              
              <Button variant="outline" className="w-full">
                Update Emergency Contacts
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}