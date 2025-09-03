import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  Brain,
  Clock,
  Eye,
  Shield,
  Target,
  TrendingUp,
  Zap,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';

interface FallRiskPrediction {
  id: string;
  timestamp: Date;
  overallRiskScore: number; // 0-100
  timeToNextFall: number; // estimated hours
  confidence: number;
  contributingFactors: {
    postural: number;
    gait: number;
    balance: number;
    environmental: number;
    cognitive: number;
  };
  riskFactors: RiskFactor[];
  interventions: Intervention[];
  mlModelVersion: string;
}

interface RiskFactor {
  id: string;
  category: 'critical' | 'high' | 'moderate' | 'low';
  description: string;
  impact: number; // 0-100
  evidence: string[];
  trend: 'increasing' | 'stable' | 'decreasing';
}

interface Intervention {
  id: string;
  type: 'immediate' | 'short_term' | 'long_term';
  priority: number;
  description: string;
  expectedOutcome: string;
  estimatedEffectiveness: number;
}

interface BiomechanicalPattern {
  id: string;
  pattern: string;
  frequency: number;
  severity: number;
  firstDetected: Date;
  lastDetected: Date;
  progression: 'improving' | 'stable' | 'worsening';
}

export const LiDARFallPredictionEngine: React.FC = () => {
  const [prediction, setPrediction] = useState<FallRiskPrediction | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [patterns, setPatterns] = useState<BiomechanicalPattern[]>([]);

  const generateRiskFactors = (): RiskFactor[] => {
    const factors = [
      {
        id: 'rf_1',
        category: 'high' as const,
        description: 'Increased anterior postural sway',
        impact: 75,
        evidence: [
          'LiDAR depth analysis',
          'Historical trend',
          'Comparative baseline',
        ],
        trend: 'increasing' as const,
      },
      {
        id: 'rf_2',
        category: 'moderate' as const,
        description: 'Asymmetric gait pattern detected',
        impact: 45,
        evidence: ['Kinematic chain analysis', 'Step length variability'],
        trend: 'stable' as const,
      },
      {
        id: 'rf_3',
        category: 'critical' as const,
        description: 'Delayed balance reaction time',
        impact: 85,
        evidence: ['Weight shift analysis', 'Recovery patterns'],
        trend: 'increasing' as const,
      },
    ];

    return factors.slice(0, Math.floor(Math.random() * 3) + 1);
  };

  const generateInterventions = (): Intervention[] => {
    return [
      {
        id: 'int_1',
        type: 'immediate',
        priority: 1,
        description: 'Postural awareness training with LiDAR feedback',
        expectedOutcome: 'Improved spinal alignment',
        estimatedEffectiveness: 85,
      },
      {
        id: 'int_2',
        type: 'short_term',
        priority: 2,
        description: 'Balance training with visual feedback',
        expectedOutcome: 'Enhanced stability index',
        estimatedEffectiveness: 70,
      },
      {
        id: 'int_3',
        type: 'long_term',
        priority: 3,
        description: 'Comprehensive gait retraining program',
        expectedOutcome: 'Symmetrical movement patterns',
        estimatedEffectiveness: 90,
      },
    ];
  };

  const updateBiomechanicalPatterns = () => {
    const newPatterns: BiomechanicalPattern[] = [
      {
        id: 'pattern_1',
        pattern: 'Forward head posture during walking',
        frequency: 8,
        severity: 65,
        firstDetected: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        lastDetected: new Date(),
        progression: 'worsening',
      },
      {
        id: 'pattern_2',
        pattern: 'Reduced hip extension in stance phase',
        frequency: 12,
        severity: 40,
        firstDetected: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        lastDetected: new Date(),
        progression: 'stable',
      },
      {
        id: 'pattern_3',
        pattern: 'Increased trunk sway variability',
        frequency: 6,
        severity: 55,
        firstDetected: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        lastDetected: new Date(),
        progression: 'improving',
      },
    ];

    setPatterns(newPatterns);
  };

  const generatePrediction = useCallback(() => {
    const now = new Date();

    // Simulate advanced ML prediction
    const newPrediction: FallRiskPrediction = {
      id: `pred_${Date.now()}`,
      timestamp: now,
      overallRiskScore: Math.random() * 40 + 20, // 20-60 for demo
      timeToNextFall: Math.random() * 168 + 24, // 24-192 hours
      confidence: Math.random() * 15 + 85, // 85-100%
      contributingFactors: {
        postural: Math.random() * 30 + 20,
        gait: Math.random() * 25 + 15,
        balance: Math.random() * 35 + 25,
        environmental: Math.random() * 20 + 10,
        cognitive: Math.random() * 15 + 5,
      },
      riskFactors: generateRiskFactors(),
      interventions: generateInterventions(),
      mlModelVersion: 'v2.1.3-lidar',
    };

    setPrediction(newPrediction);
    updateBiomechanicalPatterns();
  }, []);

  useEffect(() => {
    // Simulate real-time AI analysis
    const interval = setInterval(() => {
      generatePrediction();
    }, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [generatePrediction]);

  const startAdvancedAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    // Simulate progressive analysis
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      setAnalysisProgress(i);
    }

    setIsAnalyzing(false);
    generatePrediction();
  };

  const getRiskColor = (score: number) => {
    if (score < 25) return 'text-green-600';
    if (score < 50) return 'text-yellow-600';
    if (score < 75) return 'text-orange-600';
    return 'text-red-600';
  };

  const getRiskBadgeColor = (category: string) => {
    switch (category) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrendBadgeColor = (trend: string) => {
    if (trend === 'increasing') return 'border-red-300 text-red-700';
    if (trend === 'decreasing') return 'border-green-300 text-green-700';
    return 'border-gray-300 text-gray-700';
  };

  const getProgressionBadgeColor = (progression: string) => {
    if (progression === 'worsening') return 'border-red-300 text-red-700';
    if (progression === 'improving') return 'border-green-300 text-green-700';
    return 'border-gray-300 text-gray-700';
  };

  const getInterventionBadgeColor = (type: string) => {
    if (type === 'immediate') return 'border-red-300 text-red-700';
    if (type === 'short_term') return 'border-yellow-300 text-yellow-700';
    return 'border-green-300 text-green-700';
  };

  if (!prediction) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <Brain className="mx-auto mb-4 h-12 w-12 text-purple-600" />
          <h2 className="mb-2 text-2xl font-bold">AI Fall Prediction Engine</h2>
          <p className="mb-4 text-gray-600">
            Advanced machine learning analysis using LiDAR sensor data
          </p>
          <Button onClick={startAdvancedAnalysis} disabled={isAnalyzing}>
            {isAnalyzing ? (
              <>
                <Activity className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="mr-2 h-4 w-4" />
                Start AI Analysis
              </>
            )}
          </Button>

          {isAnalyzing && (
            <div className="mt-4">
              <Progress value={analysisProgress} className="w-full" />
              <p className="mt-2 text-sm text-gray-600">
                Processing LiDAR data and biomechanical patterns...
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <Brain className="mx-auto mb-2 h-10 w-10 text-purple-600" />
        <h2 className="text-2xl font-bold">AI Fall Prediction Engine</h2>
        <p className="text-sm text-gray-600">
          Last updated: {prediction.timestamp.toLocaleTimeString()}
        </p>
      </div>

      {/* Overall Risk Score */}
      <Card className="border-l-4 border-l-purple-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Fall Risk Prediction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <div className="text-center">
              <div className="text-sm text-gray-600">Overall Risk Score</div>
              <div
                className={`text-4xl font-bold ${getRiskColor(prediction.overallRiskScore)}`}
              >
                {prediction.overallRiskScore.toFixed(1)}%
              </div>
              <Progress value={prediction.overallRiskScore} className="mt-2" />
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600">
                Estimated Time to Risk Event
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {Math.floor(prediction.timeToNextFall)} hours
              </div>
              <div className="mt-1 text-sm text-gray-500">
                {Math.floor(prediction.timeToNextFall / 24)} days
              </div>
            </div>

            <div className="text-center">
              <div className="text-sm text-gray-600">Prediction Confidence</div>
              <div className="text-2xl font-bold text-green-600">
                {prediction.confidence.toFixed(1)}%
              </div>
              <Badge variant="secondary" className="mt-1">
                Model {prediction.mlModelVersion}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contributing Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Risk Factor Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(prediction.contributingFactors).map(
              ([factor, value]) => (
                <div key={factor} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500"></div>
                    <span className="font-medium capitalize">{factor}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={value} className="w-24" />
                    <span className="w-12 font-mono text-sm">
                      {value.toFixed(1)}%
                    </span>
                  </div>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Risk Factors */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Identified Risk Factors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prediction.riskFactors.map((factor) => (
              <div key={factor.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <Badge className={getRiskBadgeColor(factor.category)}>
                      {factor.category.toUpperCase()}
                    </Badge>
                    <h4 className="mt-1 font-semibold">{factor.description}</h4>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Impact</div>
                    <div
                      className={`text-lg font-bold ${getRiskColor(factor.impact)}`}
                    >
                      {factor.impact}%
                    </div>
                  </div>
                </div>

                <div className="mb-2 text-sm text-gray-600">
                  <strong>Evidence:</strong> {factor.evidence.join(', ')}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm">Trend:</span>
                  <Badge
                    variant="outline"
                    className={getTrendBadgeColor(factor.trend)}
                  >
                    {factor.trend}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Biomechanical Patterns */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Movement Pattern Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <div key={pattern.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h4 className="font-semibold">{pattern.pattern}</h4>
                    <div className="text-sm text-gray-600">
                      Detected {pattern.frequency} times in last 7 days
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={getProgressionBadgeColor(pattern.progression)}
                  >
                    {pattern.progression}
                  </Badge>
                </div>

                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Severity:</span>
                    <span
                      className={`ml-1 font-medium ${getRiskColor(pattern.severity)}`}
                    >
                      {pattern.severity}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">First seen:</span>
                    <span className="ml-1">
                      {Math.floor(
                        (Date.now() - pattern.firstDetected.getTime()) /
                          (24 * 60 * 60 * 1000)
                      )}{' '}
                      days ago
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recommended Interventions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            AI-Recommended Interventions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {prediction.interventions.map((intervention) => (
              <div key={intervention.id} className="rounded-lg border p-4">
                <div className="mb-2 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                      {intervention.priority}
                    </div>
                    <div>
                      <Badge
                        variant="outline"
                        className={getInterventionBadgeColor(intervention.type)}
                      >
                        {intervention.type.replace('_', ' ').toUpperCase()}
                      </Badge>
                      <h4 className="mt-1 font-semibold">
                        {intervention.description}
                      </h4>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600">Effectiveness</div>
                    <div className="text-lg font-bold text-green-600">
                      {intervention.estimatedEffectiveness}%
                    </div>
                  </div>
                </div>

                <div className="ml-8 text-sm text-gray-600">
                  <strong>Expected outcome:</strong>{' '}
                  {intervention.expectedOutcome}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Controls */}
      <div className="flex justify-center gap-2">
        <Button onClick={startAdvancedAnalysis} disabled={isAnalyzing}>
          {isAnalyzing ? (
            <>
              <Activity className="mr-2 h-4 w-4 animate-spin" />
              Re-analyzing...
            </>
          ) : (
            <>
              <Brain className="mr-2 h-4 w-4" />
              Run Deep Analysis
            </>
          )}
        </Button>
        <Button variant="outline" onClick={generatePrediction}>
          <Clock className="mr-2 h-4 w-4" />
          Refresh Prediction
        </Button>
      </div>

      {isAnalyzing && (
        <Alert>
          <Activity className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Performing deep learning analysis on LiDAR biomechanical data...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LiDARFallPredictionEngine;
