/**
 * Movement Pattern Analysis Component
 * Advanced ML analysis of movement patterns for predictive fall risk assessment
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  FallPrediction,
  GaitMetrics,
  MovementPattern,
  movementPatternAnalyzer,
} from '@/lib/movementPatternAnalyzer';
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  // TrendingUp,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  RotateCcw,
  Target,
  Waves,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MovementPatternAnalysisProps {
  readonly healthData: ProcessedHealthData;
}

function MovementPatternAnalysis({ healthData }: MovementPatternAnalysisProps) {
  const [patterns, setPatterns] = useState<MovementPattern[]>([]);
  const [gaitMetrics, setGaitMetrics] = useState<GaitMetrics | null>(null);
  const [predictions, setPredictions] = useState<FallPrediction[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [selectedTimeframe, setSelectedTimeframe] = useState<
    '1hour' | '4hours' | '24hours' | '7days'
  >('24hours');
  type Anomaly = {
    type: string;
    severity: 'low' | 'moderate' | 'high' | 'critical';
    timestamp: string;
    description: string;
    score: number;
    affectedMetrics: string[];
    actions: string[];
  };
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);

  const analyzeMovementPatterns = useCallback(async () => {
    setIsAnalyzing(true);
    try {
      // Analyze movement patterns
      const detectedPatterns = await movementPatternAnalyzer.analyzePatterns(
        healthData,
        selectedTimeframe
      );
      setPatterns(detectedPatterns);

      // Extract gait metrics
      const gaitData =
        await movementPatternAnalyzer.extractGaitMetrics(healthData);
      setGaitMetrics(gaitData);

      // Generate fall predictions
      const fallPredictions = await movementPatternAnalyzer.predictFalls(
        healthData,
        selectedTimeframe
      );
      setPredictions(fallPredictions);

      // Detect anomalies
      const detectedAnomalies =
        await movementPatternAnalyzer.detectAnomalies(healthData);
      setAnomalies(detectedAnomalies);

      toast.success('Movement pattern analysis completed');
    } catch (error) {
      toast.error('Failed to analyze movement patterns');
      console.error('Analysis error:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [healthData, selectedTimeframe]);

  useEffect(() => {
    analyzeMovementPatterns();
  }, [analyzeMovementPatterns]);



  const getPatternRiskColor = (
    risk: 'low' | 'moderate' | 'high' | 'critical'
  ) => {
    switch (risk) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'critical':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (risk: string) => {
    switch (risk) {
      case 'low':
        return <CheckCircle className="h-4 w-4" />;
      case 'moderate':
        return <Eye className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'critical':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Activity className="h-4 w-4" />;
    }
  };

  if (isAnalyzing) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="animate-Activity h-5 w-5" />
              Analyzing Movement Patterns...
            </CardTitle>
            <CardDescription>
              Processing gait data, detecting anomalies, and generating
              predictive insights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                <span className="text-muted-foreground text-sm">
                  Processing movement data...
                </span>
              </div>
              <Progress value={33} className="h-2" />
              <div className="flex items-center gap-3">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                <span className="text-muted-foreground text-sm">
                  Extracting gait metrics...
                </span>
              </div>
              <Progress value={66} className="h-2" />
              <div className="flex items-center gap-3">
                <div className="border-primary h-6 w-6 animate-spin rounded-full border-2 border-t-transparent" />
                <span className="text-muted-foreground text-sm">
                  Generating predictions...
                </span>
              </div>
              <Progress value={100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Waves className="text-primary h-6 w-6" />
            Movement Pattern Analysis
          </h2>
          <p className="text-muted-foreground">
            Advanced ML analysis of gait patterns and movement behavior
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={analyzeMovementPatterns} variant="outline" size="sm">
            <RotateCcw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {anomalies.some((a) => a.severity === 'critical') && (
        <Alert className="border-destructive bg-destructive/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="font-medium">
            Critical movement anomalies detected. Immediate attention
            recommended.
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
            {(['1hour', '4hours', '24hours', '7days'] as const).map((timeframe) => {
              let label = '7 Days';
              if (timeframe === '1hour') label = '1 Hour';
              else if (timeframe === '4hours') label = '4 Hours';
              else if (timeframe === '24hours') label = '24 Hours';
              const variant = selectedTimeframe === timeframe ? 'default' : 'outline';
              return (
                <Button
                  key={timeframe}
                  variant={variant}
                  size="sm"
                  onClick={() => setSelectedTimeframe(timeframe)}
                  className="text-xs"
                >
                  {label}
                </Button>
              );
            })}
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
            <div className="grid gap-4 md:grid-cols-2">
              {/* Gait Stability */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Activity className="h-5 w-5" />
                    Gait Stability
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Step Regularity
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round(gaitMetrics.stepRegularity * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={gaitMetrics.stepRegularity * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Walking Steadiness
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round(gaitMetrics.walkingSteadiness * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={gaitMetrics.walkingSteadiness * 100}
                        className="h-2"
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Balance Score
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round(gaitMetrics.balanceScore * 100)}%
                        </span>
                      </div>
                      <Progress
                        value={gaitMetrics.balanceScore * 100}
                        className="h-2"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Gait Characteristics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="h-5 w-5" />
                    Gait Characteristics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Step Length
                    </span>
                    <span className="text-sm font-medium">
                      {gaitMetrics.stepLength.toFixed(1)} cm
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Step Frequency
                    </span>
                    <span className="text-sm font-medium">
                      {gaitMetrics.stepFrequency.toFixed(1)} steps/min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Walking Speed
                    </span>
                    <span className="text-sm font-medium">
                      {gaitMetrics.walkingSpeed.toFixed(1)} m/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Stride Variability
                    </span>
                    <span className="text-sm font-medium">
                      {(gaitMetrics.strideVariability * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-sm">
                      Double Support
                    </span>
                    <span className="text-sm font-medium">
                      {(gaitMetrics.doubleSupportTime * 100).toFixed(1)}%
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Overall Gait Assessment */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <BarChart3 className="h-5 w-5" />
                    Overall Gait Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-center">
                    <div className="relative mx-auto h-32 w-32">
                      <svg
                        className="h-full w-full -rotate-90 transform"
                        viewBox="0 0 100 100"
                      >
                        <circle
                          cx="50"
                          cy="50"
                          r="40"
                          fill="none"
                          stroke="rgb(226 232 240)"
                          strokeWidth="8"
                        />
                        {(() => {
                          const s = gaitMetrics.overallScore;
                          let stroke = 'rgb(239 68 68)';
                          if (s >= 0.8) stroke = 'rgb(34 197 94)';
                          else if (s >= 0.6) stroke = 'rgb(234 179 8)';
                          else if (s >= 0.4) stroke = 'rgb(249 115 22)';
                          return (
                            <circle
                              cx="50"
                              cy="50"
                              r="40"
                              fill="none"
                              stroke={stroke}
                              strokeWidth="8"
                              strokeLinecap="round"
                              strokeDasharray={`${gaitMetrics.overallScore * 251.2} 251.2`}
                              className="transition-all duration-1000 ease-out"
                            />
                          );
                        })()}
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-foreground">
                            {Math.round(gaitMetrics.overallScore * 100)}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            Gait Score
                          </div>
                        </div>
                      </div>
                    </div>

                    <Badge
                      className={getPatternRiskColor(gaitMetrics.riskLevel)}
                    >
                      {getRiskIcon(gaitMetrics.riskLevel)}
                      <span className="ml-2 capitalize">
                        {gaitMetrics.riskLevel} Risk
                      </span>
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Movement Patterns Tab */}
        <TabsContent value="patterns" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {patterns.map((pattern) => (
              <Card key={`${pattern.type}:${pattern.description}`}>
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
                    <div className="mb-1 flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Confidence
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(pattern.confidence * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={pattern.confidence * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Key Indicators:
                    </h4>
                    <ul className="text-muted-foreground space-y-1 text-sm">
                      {pattern.indicators.map((indicator) => (
                        <li key={`${pattern.type}:indicator:${indicator}`} className="flex items-start gap-2">
                          <div className="bg-primary mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
                          {indicator}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {pattern.recommendations.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        Recommendations:
                      </h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        {pattern.recommendations.map((rec) => (
                          <li key={`${pattern.type}:rec:${rec}`} className="flex items-start gap-2">
                            <div className="bg-accent mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full" />
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
      {predictions.map((prediction) => (
              <Card
        key={`${prediction.timeWindow}:${prediction.probability}:${prediction.confidence}`}
                className={
                  prediction.severity === 'critical' ? 'border-destructive' : ''
                }
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5" />
                      {prediction.timeWindow} Prediction
                    </CardTitle>
                    <Badge className={getPatternRiskColor(prediction.severity)}>
                      {getRiskIcon(prediction.severity)}
                      <span className="ml-1">{prediction.severity}</span>
                    </Badge>
                  </div>
                  <CardDescription>
                    Fall probability: {Math.round(prediction.probability * 100)}
                    % | Confidence: {Math.round(prediction.confidence * 100)}%
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="mb-1 flex justify-between">
                      <span className="text-muted-foreground text-sm">
                        Fall Risk Probability
                      </span>
                      <span className="text-sm font-medium">
                        {Math.round(prediction.probability * 100)}%
                      </span>
                    </div>
                    <Progress
                      value={prediction.probability * 100}
                      className="h-2"
                    />
                  </div>

                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-foreground">
                      Contributing Factors:
                    </h4>
                    <div className="space-y-2">
                      {prediction.factors.map((factor) => (
                        <div key={`${factor.name}:${factor.impact}`} className="space-y-1">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground text-sm">
                              {factor.name}
                            </span>
                            <span className="text-sm font-medium">
                              {Math.round(factor.impact * 100)}%
                            </span>
                          </div>
                          <Progress
                            value={factor.impact * 100}
                            className="h-1"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {prediction.interventions.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-foreground">
                        Suggested Interventions:
                      </h4>
                      <ul className="text-muted-foreground space-y-1 text-sm">
                        {prediction.interventions.map((intervention) => (
                          <li key={`${intervention}`} className="flex items-start gap-2">
                            <Zap className="text-accent mt-1 h-3 w-3 flex-shrink-0" />
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
        {anomalies.map((anomaly) => (
                <Card
          key={`${anomaly.type}:${anomaly.timestamp}:${anomaly.score}`}
                  className={
                    anomaly.severity === 'critical' ? 'border-destructive' : ''
                  }
                >
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <AlertTriangle className="h-5 w-5" />
                        {anomaly.type}
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={getPatternRiskColor(anomaly.severity)}
                        >
                          {getRiskIcon(anomaly.severity)}
                          <span className="ml-1">{anomaly.severity}</span>
                        </Badge>
                        <span className="text-muted-foreground text-xs">
                          {anomaly.timestamp}
                        </span>
                      </div>
                    </div>
                    <CardDescription>{anomaly.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="mb-1 flex justify-between">
                        <span className="text-muted-foreground text-sm">
                          Anomaly Score
                        </span>
                        <span className="text-sm font-medium">
                          {Math.round(anomaly.score * 100)}
                        </span>
                      </div>
                      <Progress value={anomaly.score * 100} className="h-2" />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <h4 className="mb-2 text-sm font-medium text-foreground">
                          Affected Metrics:
                        </h4>
                        <ul className="text-muted-foreground space-y-1 text-sm">
                          {anomaly.affectedMetrics.map((metric: string) => (
                            <li key={`${anomaly.type}:metric:${metric}`} className="flex items-center gap-2">
                              <div className="bg-destructive h-1.5 w-1.5 rounded-full" />
                              {metric}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {anomaly.actions.length > 0 && (
                        <div>
                          <h4 className="mb-2 text-sm font-medium text-foreground">
                            Recommended Actions:
                          </h4>
                          <ul className="text-muted-foreground space-y-1 text-sm">
                            {anomaly.actions.map((action: string) => (
                              <li key={`${anomaly.type}:action:${action}`} className="flex items-start gap-2">
                                <CheckCircle className="text-accent mt-1 h-3 w-3 flex-shrink-0" />
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
              <CardContent className="py-8 text-center">
                <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                <h3 className="mb-2 text-lg font-medium text-foreground">
                  No Anomalies Detected
                </h3>
                <p className="text-muted-foreground">
                  Your movement patterns appear normal for the selected
                  timeframe.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MovementPatternAnalysis;
