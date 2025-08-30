/**
 * Movement Pattern Analysis Component
 * Advanced ML analysis of movement patterns for predictive fall risk assessment
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Activity, 
  TrendUp, 
  Brain, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  BarChart3,
  Target,
  Zap,
  Waves,
  Eye,
  ArrowsClockwise
} from '@phosphor-icons/react'
import { ProcessedHealthData } from '@/lib/healthDataProcessor'
import { movementPatternAnalyzer, MovementPattern, GaitMetrics, FallPrediction } from '@/lib/movementPatternAnalyzer'
import { toast } from 'sonner'

interface MovementPatternAnalysisProps {
  healthData: ProcessedHealthData
}

function MovementPatternAnalysis({ healthData }: MovementPatternAnalysisProps) {
  const [patterns, setPatterns] = useState<MovementPattern[]>([])
  const [gaitMetrics, setGaitMetrics] = useState<GaitMetrics | null>(null)
  const [predictions, setPredictions] = useState<FallPrediction[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(true)
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1hour' | '4hours' | '24hours' | '7days'>('24hours')
  const [anomalies, setAnomalies] = useState<any[]>([])

  useEffect(() => {
    analyzeMovementPatterns()
  }, [healthData, selectedTimeframe])

  const analyzeMovementPatterns = async () => {
    setIsAnalyzing(true)
    try {
      // Analyze movement patterns
      const detectedPatterns = await movementPatternAnalyzer.analyzePatterns(healthData, selectedTimeframe)
      setPatterns(detectedPatterns)

      // Extract gait metrics
      const gaitData = await movementPatternAnalyzer.extractGaitMetrics(healthData)
      setGaitMetrics(gaitData)

      // Generate fall predictions
      const fallPredictions = await movementPatternAnalyzer.predictFalls(healthData, selectedTimeframe)
      setPredictions(fallPredictions)

      // Detect anomalies
      const detectedAnomalies = await movementPatternAnalyzer.detectAnomalies(healthData)
      setAnomalies(detectedAnomalies)

      toast.success('Movement pattern analysis completed')
    } catch (error) {
      toast.error('Failed to analyze movement patterns')
      console.error('Analysis error:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const getPatternRiskColor = (risk: 'low' | 'moderate' | 'high' | 'critical') => {
    switch (risk) {
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low': return <CheckCircle className="h-4 w-4" />
      case 'moderate': return <Eye className="h-4 w-4" />
      case 'high': return <AlertTriangle className="h-4 w-4" />
      case 'critical': return <AlertTriangle className="h-4 w-4" />
      default: return <Activity className="h-4 w-4" />
    }
  }

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 animate-pulse" />
              Analyzing Movement Patterns...
            </CardTitle>
            <CardDescription>
              Processing gait data, detecting anomalies, and generating predictive insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Processing movement data...</span>
              </div>
              <Progress value={33} className="h-2" />
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Extracting gait metrics...</span>
              </div>
              <Progress value={66} className="h-2" />
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-muted-foreground">Generating predictions...</span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Waves className="h-6 w-6 text-primary" />
            Movement Pattern Analysis
          </h2>
          <p className="text-muted-foreground">
            Advanced ML analysis of gait patterns and movement behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={analyzeMovementPatterns} variant="outline" size="sm">
            <ArrowsClockwise className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {anomalies.some(a => a.severity === 'critical') && (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Critical movement anomalies detected. Immediate attention recommended.
          </AlertDescription>
        </Alert>
      )}

      {/* Timeframe Selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Timeframe</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            {(['1hour', '4hours', '24hours', '7days'] as const).map((timeframe) => (
              <Button
                key={timeframe}
                variant={selectedTimeframe === timeframe ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeframe(timeframe)}
                className="text-xs"
              >
                {timeframe === '1hour' ? '1 Hour' :
                 timeframe === '4hours' ? '4 Hours' :
                 timeframe === '24hours' ? '24 Hours' : '7 Days'}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="gait" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="gait">Gait Metrics</TabsTrigger>
          <TabsTrigger value="patterns">Movement Patterns</TabsTrigger>
          <TabsTrigger value="predictions">Fall Predictions</TabsTrigger>
          <TabsTrigger value="anomalies">Anomaly Detection</TabsTrigger>
        </TabsList>

        {/* Gait Metrics Tab */}
        <TabsContent value="gait" className="space-y-4">
          {gaitMetrics && (
            <div className="grid md:grid-cols-2 gap-4">
              {/* Gait Stability */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Gait Stability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Step Regularity</span>
                        <span className="text-sm font-medium">{Math.round(gaitMetrics.stepRegularity * 100)}%</span>
                      </div>
                      <Progress value={gaitMetrics.stepRegularity * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Walking Steadiness</span>
                        <span className="text-sm font-medium">{Math.round(gaitMetrics.walkingSteadiness * 100)}%</span>
                      </div>
                      <Progress value={gaitMetrics.walkingSteadiness * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Balance Score</span>
                        <span className="text-sm font-medium">{Math.round(gaitMetrics.balanceScore * 100)}%</span>
                      </div>
                      <Progress value={gaitMetrics.balanceScore * 100} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gait Characteristics */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Gait Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Step Length</span>
                    <span className="text-sm font-medium">{gaitMetrics.stepLength.toFixed(1)} cm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Step Frequency</span>
                    <span className="text-sm font-medium">{gaitMetrics.stepFrequency.toFixed(1)} steps/min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Walking Speed</span>
                    <span className="text-sm font-medium">{gaitMetrics.walkingSpeed.toFixed(1)} m/s</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Stride Variability</span>
                    <span className="text-sm font-medium">{(gaitMetrics.strideVariability * 100).toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Double Support</span>
                    <span className="text-sm font-medium">{(gaitMetrics.doubleSupportTime * 100).toFixed(1)}%</span>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Gait Assessment */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Overall Gait Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center space-y-4">
                    <div className="relative w-32 h-32 mx-auto">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="rgb(226 232 240)"
                          strokeWidth="8"
                        />
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke={gaitMetrics.overallScore >= 0.8 ? 'rgb(34 197 94)' : 
                                 gaitMetrics.overallScore >= 0.6 ? 'rgb(234 179 8)' :
                                 gaitMetrics.overallScore >= 0.4 ? 'rgb(249 115 22)' : 'rgb(239 68 68)'}
                          strokeWidth="8"
                          strokeLinecap="round"
                          strokeDasharray={`${gaitMetrics.overallScore * 251.2} 251.2`}
                          className="transition-all duration-1000 ease-out"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {Math.round(gaitMetrics.overallScore * 100)}
                          </div>
                          <div className="text-xs text-muted-foreground">Gait Score</div>
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={getPatternRiskColor(gaitMetrics.riskLevel)}>
                      {getRiskIcon(gaitMetrics.riskLevel)}
                      <span className="ml-2 capitalize">{gaitMetrics.riskLevel} Risk</span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Movement Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {patterns.map((pattern, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{pattern.type}</CardTitle>
                    <Badge className={getPatternRiskColor(pattern.riskLevel)}>
                      {getRiskIcon(pattern.riskLevel)}
                      <span className="ml-1">{pattern.riskLevel}</span>
                    </Badge>
                  </div>
                  <CardDescription>{pattern.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Confidence</span>
                      <span className="text-sm font-medium">{Math.round(pattern.confidence * 100)}%</span>
                    </div>
                    <Progress value={pattern.confidence * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Key Indicators:</h4>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {pattern.indicators.map((indicator, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <div className="w-1.5 h-1.5 bg-primary rounded-full mt-2 flex-shrink-0" />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pattern.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Recommendations:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {pattern.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Fall Predictions Tab */}
        <TabsContent value="predictions" className="space-y-4">
          <div className="space-y-4">
            {predictions.map((prediction, index) => (
              <Card key={index} className={prediction.severity === 'critical' ? 'border-destructive' : ''}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5" />
                      {prediction.timeWindow} Prediction
                    </CardTitle>
                    <Badge className={getPatternRiskColor(prediction.severity)}>
                      {getRiskIcon(prediction.severity)}
                      <span className="ml-1">{prediction.severity}</span>
                    </Badge>
                  </div>
                  <CardDescription>
                    Fall probability: {Math.round(prediction.probability * 100)}% | 
                    Confidence: {Math.round(prediction.confidence * 100)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-muted-foreground">Fall Risk Probability</span>
                      <span className="text-sm font-medium">{Math.round(prediction.probability * 100)}%</span>
                    </div>
                    <Progress 
                      value={prediction.probability * 100} 
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">Contributing Factors:</h4>
                    <div className="space-y-2">
                      {prediction.factors.map((factor, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-sm text-muted-foreground">{factor.name}</span>
                            <span className="text-sm font-medium">{Math.round(factor.impact * 100)}%</span>
                          </div>
                          <Progress value={factor.impact * 100} className="h-1" />
                        </div>
                      ))}
                    </div>
                  </div>

                  {prediction.interventions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">Suggested Interventions:</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        {prediction.interventions.map((intervention, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <Zap className="w-3 h-3 text-accent mt-1 flex-shrink-0" />
                            {intervention}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Anomaly Detection Tab */}
        <TabsContent value="anomalies" className="space-y-4">
          {anomalies.length > 0 ? (
            <div className="space-y-4">
              {anomalies.map((anomaly, index) => (
                <Card key={index} className={anomaly.severity === 'critical' ? 'border-destructive' : ''}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        {anomaly.type}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getPatternRiskColor(anomaly.severity)}>
                          {getRiskIcon(anomaly.severity)}
                          <span className="ml-1">{anomaly.severity}</span>
                        </Badge>
                        <span className="text-xs text-muted-foreground">{anomaly.timestamp}</span>
                      </div>
                    </div>
                    <CardDescription>{anomaly.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-muted-foreground">Anomaly Score</span>
                        <span className="text-sm font-medium">{Math.round(anomaly.score * 100)}</span>
                      </div>
                      <Progress value={anomaly.score * 100} className="h-2" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <h4 className="text-sm font-medium text-foreground mb-2">Affected Metrics:</h4>
                        <ul className="text-sm text-muted-foreground space-y-1">
                          {anomaly.affectedMetrics.map((metric, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                              {metric}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {anomaly.actions.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium text-foreground mb-2">Recommended Actions:</h4>
                          <ul className="text-sm text-muted-foreground space-y-1">
                            {anomaly.actions.map((action, idx) => (
                              <li key={idx} className="flex items-start gap-2">
                                <CheckCircle className="w-3 h-3 text-accent mt-1 flex-shrink-0" />
                                {action}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-8">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No Anomalies Detected</h3>
                <p className="text-muted-foreground">
                  Your movement patterns appear normal for the selected timeframe.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

export default MovementPatternAnalysis