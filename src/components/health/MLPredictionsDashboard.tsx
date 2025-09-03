/**
 * ML Predictions Dashboard Component
 * Displays machine learning fall risk predictions and model insights
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
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import {
  mlFallRiskPredictor,
  ModelPerformance,
  RiskPrediction,
} from '@/lib/mlFallRiskPredictor';
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Lightbulb,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MLPredictionsDashboardProps {
  healthData: ProcessedHealthData;
}

function MLPredictionsDashboard({ healthData }: MLPredictionsDashboardProps) {
  const [predictions, setPredictions] = useState<Map<string, RiskPrediction>>(
    new Map()
  );
  const [modelPerformance, setModelPerformance] = useState<
    Map<string, ModelPerformance>
  >(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTimeHorizon, setSelectedTimeHorizon] =
    useState<RiskPrediction['timeHorizon']>('24hours');

  useEffect(() => {
    generatePredictions();
    loadModelPerformance();
  }, [healthData, selectedTimeHorizon]);

  const generatePredictions = async () => {
    setIsLoading(true);
    try {
      const timeHorizons: RiskPrediction['timeHorizon'][] = [
        '1hour',
        '4hours',
        '12hours',
        '24hours',
        '7days',
      ];
      const newPredictions = new Map<string, RiskPrediction>();

      for (const horizon of timeHorizons) {
        const prediction = await mlFallRiskPredictor.predictFallRisk(
          healthData,
          horizon
        );
        newPredictions.set(horizon, prediction);
      }

      setPredictions(newPredictions);
    } catch (error) {
      toast.error('Failed to generate ML predictions');
      console.error('Prediction error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadModelPerformance = () => {
    const performance = mlFallRiskPredictor.getModelPerformance();
    setModelPerformance(performance);
  };

  const currentPrediction = predictions.get(selectedTimeHorizon);

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'high':
        return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'severe':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRiskIcon = (riskLevel: string) => {
    switch (riskLevel) {
      case 'low':
        return <CheckCircle className="h-5 w-5" />;
      case 'moderate':
        return <Shield className="h-5 w-5" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5" />;
      case 'severe':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <Shield className="h-5 w-5" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="animate-Activity h-5 w-5" />
              Generating ML Predictions...
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted animate-Activity h-4 rounded" />
              <div className="bg-muted animate-Activity h-4 w-3/4 rounded" />
              <div className="bg-muted animate-Activity h-4 w-1/2 rounded" />
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
            <Brain className="text-primary h-6 w-6" />
            Machine Learning Predictions
          </h2>
          <p className="text-muted-foreground">
            AI-powered fall risk assessment using multiple ML models
          </p>
        </div>
        <Button onClick={generatePredictions} variant="outline" size="sm">
          <Zap className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Current Prediction Card */}
      {currentPrediction && (
        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Current Risk Assessment
              </CardTitle>
              <div className="flex items-center gap-2">
                <Clock className="text-muted-foreground h-4 w-4" />
                <span className="text-muted-foreground text-sm">
                  {selectedTimeHorizon}
                </span>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Risk Score Display */}
            <div className="space-y-4 text-center">
              <div className="relative">
                <div className="mx-auto h-32 w-32">
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
                    <circle
                      cx="50"
                      cy="50"
                      r="40"
                      fill="none"
                      stroke={
                        currentPrediction.riskLevel === 'low'
                          ? 'rgb(34 197 94)'
                          : currentPrediction.riskLevel === 'moderate'
                            ? 'rgb(234 179 8)'
                            : currentPrediction.riskLevel === 'high'
                              ? 'rgb(249 115 22)'
                              : 'rgb(239 68 68)'
                      }
                      strokeWidth="8"
                      strokeLinecap="round"
                      strokeDasharray={`${currentPrediction.riskScore * 251.2} 251.2`}
                      className="transition-all duration-1000 ease-out"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {Math.round(currentPrediction.riskScore * 100)}
                      </div>
                      <div className="text-muted-foreground text-xs">
                        Risk Score
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Badge
                  className={`${getRiskColor(currentPrediction.riskLevel)} px-4 py-2 text-lg`}
                >
                  {getRiskIcon(currentPrediction.riskLevel)}
                  <span className="ml-2 capitalize">
                    {currentPrediction.riskLevel} Risk
                  </span>
                </Badge>
                <div className="text-muted-foreground text-sm">
                  Confidence: {Math.round(currentPrediction.confidence * 100)}%
                </div>
              </div>
            </div>

            {/* Alert if needed */}
            {currentPrediction.alertRequired && (
              <Alert className="border-destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  High fall risk detected. Consider immediate intervention and
                  caregiver notification.
                </AlertDescription>
              </Alert>
            )}

            {/* Time Horizon Selector */}
            <div className="space-y-3">
              <h4 className="font-medium text-foreground">Time Horizon</h4>
              <div className="grid grid-cols-5 gap-2">
                {(
                  ['1hour', '4hours', '12hours', '24hours', '7days'] as const
                ).map((horizon) => {
                  const prediction = predictions.get(horizon);
                  if (!prediction) return null;

                  return (
                    <Button
                      key={horizon}
                      variant={
                        selectedTimeHorizon === horizon ? 'default' : 'outline'
                      }
                      size="sm"
                      onClick={() => setSelectedTimeHorizon(horizon)}
                      className="text-xs"
                    >
                      {horizon}
                    </Button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="factors" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="factors">Risk Factors</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="models">Model Performance</TabsTrigger>
        </TabsList>

        {/* Risk Factors Tab */}
        <TabsContent value="factors" className="space-y-4">
          {currentPrediction?.primaryFactors && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Primary Risk Factors
                </CardTitle>
                <CardDescription>
                  Key factors contributing to your current fall risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentPrediction.primaryFactors.map((factor, index) => (
                    <div key={index} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-foreground">
                          {factor.factor}
                        </span>
                        <span className="text-muted-foreground text-sm">
                          {Math.round(factor.contribution * 100)}% impact
                        </span>
                      </div>
                      <Progress
                        value={factor.contribution * 100}
                        className="h-2"
                      />
                      <p className="text-muted-foreground text-sm">
                        {factor.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-4">
          {currentPrediction?.recommendations && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  AI-generated suggestions to reduce your fall risk
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentPrediction.recommendations.map(
                    (recommendation, index) => (
                      <div
                        key={index}
                        className="flex items-start gap-3 rounded-lg border p-3"
                      >
                        <div className="bg-primary text-primary-foreground flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-foreground">{recommendation}</p>
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Risk Trends by Time Horizon
              </CardTitle>
              <CardDescription>
                How your fall risk changes over different time periods
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from(predictions.entries()).map(
                  ([horizon, prediction]) => (
                    <div key={horizon} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-medium capitalize text-foreground">
                          {horizon}
                        </span>
                        <div className="flex items-center gap-2">
                          <Badge className={getRiskColor(prediction.riskLevel)}>
                            {prediction.riskLevel}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            {Math.round(prediction.riskScore * 100)}%
                          </span>
                        </div>
                      </div>
                      <Progress
                        value={prediction.riskScore * 100}
                        className="h-2"
                      />
                    </div>
                  )
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Model Performance Tab */}
        <TabsContent value="models" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from(modelPerformance.entries()).map(
              ([modelName, performance]) => (
                <Card key={modelName}>
                  <CardHeader>
                    <CardTitle className="text-lg capitalize">
                      {modelName.replace(/([A-Z])/g, ' $1')}
                    </CardTitle>
                    <CardDescription>Model performance metrics</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Accuracy</span>
                        <span className="font-medium">
                          {Math.round(performance.accuracy * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precision</span>
                        <span className="font-medium">
                          {Math.round(performance.precision * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Recall</span>
                        <span className="font-medium">
                          {Math.round(performance.recall * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">F1 Score</span>
                        <span className="font-medium">
                          {Math.round(performance.f1Score * 100)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">ROC AUC</span>
                        <span className="font-medium">
                          {Math.round(performance.roc_auc * 100)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default MLPredictionsDashboard;
