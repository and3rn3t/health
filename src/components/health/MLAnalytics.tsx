import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { AnalyticsHealthData as ProcessedHealthData } from '@/lib/healthDataProcessor';
import {
  Activity,
  AlertTriangle,
  Brain,
  CheckCircle,
  Pause,
  Play,
  RefreshCw,
  Shield,
  Target,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

interface MLPrediction {
  date: string;
  predicted_health_score: number;
  predicted_fall_risk: number;
  predicted_steps: number;
  confidence: number;
  model_version: string;
  factors: {
    primary: string[];
    secondary: string[];
  };
}

interface MLModel {
  id: string;
  name: string;
  type: 'regression' | 'classification' | 'neural_network';
  accuracy: number;
  lastTrained: string;
  status: 'active' | 'training' | 'inactive';
  description: string;
}

interface AnomalyDetection {
  timestamp: string;
  metric: string;
  value: number;
  expected_range: [number, number];
  severity: 'low' | 'medium' | 'high' | 'critical';
  confidence: number;
  explanation: string;
}

interface MLAnalyticsProps {
  userId: string;
  healthData: ProcessedHealthData[];
  onPredictionGenerated?: (prediction: MLPrediction) => void;
}

export default function MLAnalytics({
  userId,
  healthData,
  onPredictionGenerated,
}: Readonly<MLAnalyticsProps>) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('predictions');
  const [selectedModel, setSelectedModel] = useState<string>('ensemble');
  const [predictionHorizon, setPredictionHorizon] = useState<
    '1d' | '7d' | '30d'
  >('7d');
  const [predictions, setPredictions] = useState<MLPrediction[]>([]);
  const [anomalies, setAnomalies] = useState<AnomalyDetection[]>([]);
  const [models, setModels] = useState<MLModel[]>([]);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const [modelPerformance, setModelPerformance] = useState({
    accuracy: 0,
    precision: 0,
    recall: 0,
    f1Score: 0,
  });

  // Initialize ML models and data
  useEffect(() => {
    setIsLoading(true);

    // Simulate loading ML models and generating predictions
    setTimeout(() => {
      // Mock ML models
      const mockModels: MLModel[] = [
        {
          id: 'ensemble',
          name: 'Ensemble Fall Risk Predictor',
          type: 'neural_network',
          accuracy: 94.2,
          lastTrained: '2024-01-15T10:30:00Z',
          status: 'active',
          description:
            'Combines multiple algorithms for optimal fall risk prediction',
        },
        {
          id: 'health_score',
          name: 'Health Score Regression',
          type: 'regression',
          accuracy: 89.7,
          lastTrained: '2024-01-14T15:45:00Z',
          status: 'active',
          description:
            'Predicts overall health score based on activity patterns',
        },
        {
          id: 'anomaly_detector',
          name: 'Anomaly Detection Model',
          type: 'classification',
          accuracy: 92.1,
          lastTrained: '2024-01-13T09:20:00Z',
          status: 'training',
          description: 'Identifies unusual patterns in health metrics',
        },
      ];

      // Generate mock predictions
      let days: number;
      if (predictionHorizon === '1d') {
        days = 1;
      } else if (predictionHorizon === '7d') {
        days = 7;
      } else {
        days = 30;
      }

      const mockPredictions: MLPrediction[] = [];

      for (let i = 1; i <= days; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);

        // Simulate ML predictions with realistic trends
        const baseHealthScore =
          75 + Math.sin(i * 0.2) * 10 + (Math.random() - 0.5) * 5;
        const baseFallRisk = Math.max(
          0,
          100 - baseHealthScore + (Math.random() - 0.5) * 10
        );
        const baseSteps =
          7000 + Math.cos(i * 0.15) * 1000 + (Math.random() - 0.5) * 500;
        const confidence = Math.max(60, 95 - i * 2); // Decreasing confidence over time

        mockPredictions.push({
          date: date.toISOString().split('T')[0],
          predicted_health_score: Math.round(baseHealthScore),
          predicted_fall_risk: Math.round(baseFallRisk),
          predicted_steps: Math.round(baseSteps),
          confidence: Math.round(confidence),
          model_version: 'v2.1.0',
          factors: {
            primary: ['walking_steadiness', 'activity_level', 'sleep_quality'],
            secondary: [
              'heart_rate_variability',
              'step_consistency',
              'recovery_time',
            ],
          },
        });
      }

      // Generate mock anomalies
      const mockAnomalies: AnomalyDetection[] = [
        {
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          metric: 'walking_steadiness',
          value: 45,
          expected_range: [65, 85],
          severity: 'high',
          confidence: 87,
          explanation:
            'Walking steadiness dropped significantly below normal range',
        },
        {
          timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
          metric: 'heart_rate',
          value: 95,
          expected_range: [65, 75],
          severity: 'medium',
          confidence: 92,
          explanation:
            'Elevated resting heart rate detected during sleep period',
        },
        {
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          metric: 'steps',
          value: 2100,
          expected_range: [6000, 9000],
          severity: 'low',
          confidence: 78,
          explanation: 'Daily step count significantly below typical pattern',
        },
      ];

      setModels(mockModels);
      setPredictions(mockPredictions);
      setAnomalies(mockAnomalies);
      setModelPerformance({
        accuracy: 94.2,
        precision: 91.8,
        recall: 89.3,
        f1Score: 90.5,
      });
      setIsLoading(false);
    }, 1500);
  }, [predictionHorizon, selectedModel, userId]);

  const generateNewPredictions = async () => {
    setIsLoading(true);

    // Simulate API call to ML service
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Trigger prediction generation with latest data
    const latestPrediction = predictions[0];
    if (latestPrediction && onPredictionGenerated) {
      onPredictionGenerated(latestPrediction);
    }

    setIsLoading(false);
  };

  const markTraining =
    (modelId: string) =>
    (m: MLModel): MLModel =>
      m.id === modelId ? { ...m, status: 'training' } : m;
  const finalizeTraining =
    (modelId: string) =>
    (m: MLModel): MLModel =>
      m.id === modelId
        ? {
            ...m,
            status: 'active',
            accuracy: Math.min(100, m.accuracy + Math.random() * 2),
            lastTrained: new Date().toISOString(),
          }
        : m;
  const retrainModel = (modelId: string) => {
    setModels((prev) => prev.map(markTraining(modelId)));
    setTimeout(
      () => setModels((prev) => prev.map(finalizeTraining(modelId))),
      10000
    );
  };

  const renderPredictionChart = () => {
    // Combine historical and predicted data
    const historicalData = healthData.slice(-7).map((d) => ({
      date: new Date(d.lastUpdated).toISOString().split('T')[0],
      actual_health_score: d.healthScore,
      // Approximate fall risk numeric via variability of walking steadiness (placeholder heuristic)
      actual_fall_risk: Math.min(
        100,
        Math.max(0, d.metrics.walkingSteadiness.variability * 1.2)
      ),
      type: 'historical',
    }));

    const combinedData = [
      ...historicalData,
      ...predictions.map((p) => ({
        date: p.date,
        predicted_health_score: p.predicted_health_score,
        predicted_fall_risk: p.predicted_fall_risk,
        confidence: p.confidence,
        type: 'predicted',
      })),
    ];

    return (
      <ResponsiveContainer width="100%" height={400}>
        <LineChart data={combinedData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />

          {/* Historical data */}
          <Line
            dataKey="actual_health_score"
            stroke="#10b981"
            strokeWidth={2}
            name="Historical Health Score"
          />
          <Line
            dataKey="actual_fall_risk"
            stroke="#ef4444"
            strokeWidth={2}
            name="Historical Fall Risk"
          />

          {/* Predicted data */}
          <Line
            dataKey="predicted_health_score"
            stroke="#10b981"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Predicted Health Score"
          />
          <Line
            dataKey="predicted_fall_risk"
            stroke="#ef4444"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Predicted Fall Risk"
          />

          {/* Reference line to separate historical from predicted */}
          <ReferenceLine
            x={new Date().toISOString().split('T')[0]}
            stroke="#6b7280"
            strokeDasharray="2 2"
          />
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderModelStatus = () => (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {models.map((model) => (
        <Card key={model.id}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{model.name}</CardTitle>
              <Badge
                variant={(() => {
                  switch (model.status) {
                    case 'active':
                      return 'default';
                    case 'training':
                      return 'secondary';
                    default:
                      return 'destructive';
                  }
                })()}
              >
                {model.status === 'active' && (
                  <CheckCircle className="mr-1 h-3 w-3" />
                )}
                {model.status === 'training' && (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                )}
                {model.status === 'inactive' && (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                {model.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="mb-1 flex justify-between text-sm">
                <span>Accuracy</span>
                <span>{model.accuracy.toFixed(1)}%</span>
              </div>
              <Progress value={model.accuracy} className="h-2" />
            </div>

            <div className="text-muted-foreground text-xs">
              <p>Type: {model.type.replace('_', ' ')}</p>
              <p>
                Last trained: {new Date(model.lastTrained).toLocaleDateString()}
              </p>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => retrainModel(model.id)}
                disabled={model.status === 'training'}
                className="flex-1"
              >
                {model.status === 'training' ? 'Training...' : 'Retrain'}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderAnomalies = () => (
    <div className="space-y-3">
      {anomalies.map((anomaly) => (
        <Alert
          key={`${anomaly.metric}-${anomaly.timestamp}`}
          className={(() => {
            switch (anomaly.severity) {
              case 'critical':
                return 'border-red-500';
              case 'high':
                return 'border-orange-500';
              case 'medium':
                return 'border-yellow-500';
              default:
                return 'border-blue-500';
            }
          })()}
        >
          <AlertTriangle className="h-4 w-4" />
          <div className="flex w-full items-start justify-between">
            <div className="space-y-1">
              <AlertDescription className="font-medium">
                {anomaly.metric.replace('_', ' ').toUpperCase()} Anomaly
                Detected
              </AlertDescription>
              <AlertDescription className="text-sm">
                {anomaly.explanation}
              </AlertDescription>
              <div className="text-muted-foreground flex items-center gap-4 text-xs">
                <span>Value: {anomaly.value}</span>
                <span>
                  Expected: {anomaly.expected_range[0]}-
                  {anomaly.expected_range[1]}
                </span>
                <span>Confidence: {anomaly.confidence}%</span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <Badge
                variant={(() => {
                  switch (anomaly.severity) {
                    case 'critical':
                    case 'high':
                      return 'destructive';
                    case 'medium':
                      return 'secondary';
                    default:
                      return 'default';
                  }
                })()}
              >
                {anomaly.severity}
              </Badge>
              <span className="text-muted-foreground text-xs">
                {new Date(anomaly.timestamp).toLocaleTimeString()}
              </span>
            </div>
          </div>
        </Alert>
      ))}
    </div>
  );

  const renderPredictionSummary = () => {
    if (predictions.length === 0) return null;

    const latestPrediction = predictions[0];
    const avgConfidence =
      predictions.reduce((sum, p) => sum + p.confidence, 0) /
      predictions.length;

    return (
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">
                  Next Health Score
                </p>
                <p className="text-2xl font-bold">
                  {latestPrediction.predicted_health_score}/100
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Fall Risk Level</p>
                <p className="text-2xl font-bold">
                  {latestPrediction.predicted_fall_risk}%
                </p>
              </div>
              <Shield className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Predicted Steps</p>
                <p className="text-2xl font-bold">
                  {latestPrediction.predicted_steps.toLocaleString()}
                </p>
              </div>
              <Activity className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Avg Confidence</p>
                <p className="text-2xl font-bold">
                  {Math.round(avgConfidence)}%
                </p>
              </div>
              <Brain className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-2xl font-bold">ML Analytics</h2>
          <Badge variant="secondary" className="flex items-center gap-1">
            <Brain className="h-3 w-3" />
            AI-Powered Insights
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Select value={selectedModel} onValueChange={setSelectedModel}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ensemble">Ensemble Model</SelectItem>
              <SelectItem value="health_score">Health Score Model</SelectItem>
              <SelectItem value="anomaly_detector">Anomaly Detector</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={predictionHorizon}
            onValueChange={(value: '1d' | '7d' | '30d') =>
              setPredictionHorizon(value)
            }
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">1 Day</SelectItem>
              <SelectItem value="7d">7 Days</SelectItem>
              <SelectItem value="30d">30 Days</SelectItem>
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIsRealTimeEnabled(!isRealTimeEnabled)}
            variant={isRealTimeEnabled ? 'default' : 'outline'}
            size="sm"
          >
            {isRealTimeEnabled ? (
              <Pause className="mr-2 h-4 w-4" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Real-time
          </Button>

          <Button onClick={generateNewPredictions} disabled={isLoading}>
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
            />
            Generate
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="anomalies">Anomalies</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="predictions" className="space-y-6">
          {renderPredictionSummary()}

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Health Predictions ({predictionHorizon})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-96 items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                renderPredictionChart()
              )}
            </CardContent>
          </Card>

          {/* Key Factors */}
          {predictions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Key Prediction Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-medium">Primary Factors</h4>
                    <div className="flex flex-wrap gap-2">
                      {predictions[0].factors.primary.map((factor) => (
                        <Badge key={factor} variant="default">
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="mb-2 font-medium">Secondary Factors</h4>
                    <div className="flex flex-wrap gap-2">
                      {predictions[0].factors.secondary.map((factor) => (
                        <Badge key={factor} variant="outline">
                          {factor.replace('_', ' ')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="anomalies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Real-time Anomaly Detection
              </CardTitle>
            </CardHeader>
            <CardContent>
              {anomalies.length > 0 ? (
                renderAnomalies()
              ) : (
                <div className="text-muted-foreground py-8 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <p>No anomalies detected in recent data</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="models" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                ML Model Status
              </CardTitle>
            </CardHeader>
            <CardContent>{renderModelStatus()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Accuracy</p>
                    <p className="text-2xl font-bold">
                      {modelPerformance.accuracy.toFixed(1)}%
                    </p>
                  </div>
                  <Progress
                    value={modelPerformance.accuracy}
                    className="h-2 w-16"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Precision</p>
                    <p className="text-2xl font-bold">
                      {modelPerformance.precision.toFixed(1)}%
                    </p>
                  </div>
                  <Progress
                    value={modelPerformance.precision}
                    className="h-2 w-16"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">Recall</p>
                    <p className="text-2xl font-bold">
                      {modelPerformance.recall.toFixed(1)}%
                    </p>
                  </div>
                  <Progress
                    value={modelPerformance.recall}
                    className="h-2 w-16"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-muted-foreground text-sm">F1 Score</p>
                    <p className="text-2xl font-bold">
                      {modelPerformance.f1Score.toFixed(1)}%
                    </p>
                  </div>
                  <Progress
                    value={modelPerformance.f1Score}
                    className="h-2 w-16"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <Alert>
            <Brain className="h-4 w-4" />
            <AlertDescription>
              Model performance metrics are updated automatically after each
              training cycle. The ensemble model combines multiple algorithms to
              achieve optimal prediction accuracy.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
}
