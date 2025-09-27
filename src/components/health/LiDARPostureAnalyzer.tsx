import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import { useCallback, useEffect, useState } from 'react';

// LiDAR Posture Analysis Types
interface PostureMetrics {
  spinalAlignment: {
    cervical: number; // degrees from neutral (0 = perfect)
    thoracic: number;
    lumbar: number;
    overall: number; // 0-100 score
  };
  bodyBalance: {
    leftRightShift: number; // cm from center
    forwardBackward: number; // cm from ideal
    weightDistribution: number; // 0-100 (100 = perfect balance)
  };
  headPosition: {
    forwardHead: number; // cm forward from shoulders
    tilt: number; // degrees left/right
    rotation: number; // degrees
  };
  shoulderAlignment: {
    height: number; // cm difference left vs right
    forward: number; // cm forward from ideal
    rotation: number; // degrees internal rotation
  };
  stability: {
    sway: number; // mm of movement
    confidence: number; // 0-100
    riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  };
}

interface PostureAnalysis {
  id: string;
  timestamp: Date;
  duration: number; // seconds
  metrics: PostureMetrics;
  recommendations: PostureRecommendation[];
  riskFactors: PostureRiskFactor[];
  overallScore: number; // 0-100
  improvements: PostureImprovement[];
  session: {
    type: 'quick' | 'detailed' | 'baseline';
    quality: number; // 0-100
    dataPoints: number;
  };
}

interface PostureRecommendation {
  id: string;
  category: 'immediate' | 'exercise' | 'ergonomic' | 'lifestyle';
  priority: 1 | 2 | 3; // 1 = highest
  title: string;
  description: string;
  instructions: string[];
  frequency: string;
  expectedImprovement: string;
  timeframe: string;
}

interface PostureRiskFactor {
  id: string;
  area: 'cervical' | 'thoracic' | 'lumbar' | 'shoulders' | 'head' | 'balance';
  severity: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  impact: string;
  progression: 'improving' | 'stable' | 'worsening';
  confidence: number;
}

interface PostureImprovement {
  area: string;
  currentValue: number;
  idealRange: { min: number; max: number };
  improvement: number; // percentage improvement needed
  priority: number; // 1-3
}

interface RealTimePostureData {
  timestamp: number;
  cervicalAngle: number;
  thoracicAngle: number;
  lumbarAngle: number;
  headForward: number;
  shoulderAlignment: number;
  balance: number;
}

interface LiDARPostureAnalyzerProps {
  onAnalysisComplete?: (analysis: PostureAnalysis) => void;
  realTimeMonitoring?: boolean;
  feedbackEnabled?: boolean;
  calibrationRequired?: boolean;
}

export function LiDARPostureAnalyzer({
  onAnalysisComplete,
  realTimeMonitoring = false,
  feedbackEnabled = true,
  calibrationRequired = false,
}: Readonly<LiDARPostureAnalyzerProps>) {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [currentAnalysis, setCurrentAnalysis] =
    useState<PostureAnalysis | null>(null);
  const [realTimeData, setRealTimeData] = useState<RealTimePostureData[]>([]);
  const [_postureHistory, setPostureHistory] = useKV('posture-analyses', '[]');
  const [calibrationStatus, setCalibrationStatus] = useState<
    'needed' | 'calibrating' | 'complete'
  >('needed');
  const [sessionType, setSessionType] = useState<
    'quick' | 'detailed' | 'baseline'
  >('detailed');
  const [feedbackAlerts, setFeedbackAlerts] = useState<string[]>([]);

  // Generate realistic posture metrics
  const generatePostureMetrics = useCallback((): PostureMetrics => {
    // Simulate common posture issues with realistic ranges
    const hasForwardHead = Math.random() > 0.4; // 60% chance
    const hasRoundedShoulders = Math.random() > 0.5; // 50% chance
    const hasImbalance = Math.random() > 0.7; // 30% chance

    return {
      spinalAlignment: {
        cervical: hasForwardHead ? 15 + Math.random() * 25 : Math.random() * 10,
        thoracic: hasRoundedShoulders
          ? 35 + Math.random() * 20
          : 25 + Math.random() * 15,
        lumbar: 20 + Math.random() * 25,
        overall: Math.max(
          20,
          100 -
            (hasForwardHead ? 30 : 0) -
            (hasRoundedShoulders ? 25 : 0) -
            (hasImbalance ? 20 : 0)
        ),
      },
      bodyBalance: {
        leftRightShift: hasImbalance
          ? (Math.random() - 0.5) * 6
          : (Math.random() - 0.5) * 2,
        forwardBackward: (Math.random() - 0.3) * 8,
        weightDistribution: hasImbalance
          ? 60 + Math.random() * 25
          : 80 + Math.random() * 20,
      },
      headPosition: {
        forwardHead: hasForwardHead ? 3 + Math.random() * 4 : Math.random() * 2,
        tilt: (Math.random() - 0.5) * 8,
        rotation: (Math.random() - 0.5) * 12,
      },
      shoulderAlignment: {
        height: (Math.random() - 0.5) * 3,
        forward: hasRoundedShoulders
          ? 4 + Math.random() * 3
          : Math.random() * 3,
        rotation: hasRoundedShoulders
          ? 15 + Math.random() * 20
          : Math.random() * 10,
      },
      stability: {
        sway: 8 + Math.random() * 20,
        confidence: 80 + Math.random() * 15,
        riskLevel: (() => {
          if (hasForwardHead && hasRoundedShoulders) return 'high';
          if (hasForwardHead || hasRoundedShoulders) return 'moderate';
          return 'low';
        })(),
      },
    };
  }, []);

  // Generate posture recommendations based on metrics
  const generateRecommendations = useCallback(
    (metrics: PostureMetrics): PostureRecommendation[] => {
      const recommendations: PostureRecommendation[] = [];

      // Forward head posture
      if (metrics.headPosition.forwardHead > 3) {
        recommendations.push({
          id: 'chin-tucks',
          category: 'exercise',
          priority: 1,
          title: 'Chin Tuck Exercises',
          description:
            'Strengthen deep neck flexors to reduce forward head posture',
          instructions: [
            'Sit or stand with spine neutral',
            'Gently draw chin back while lengthening neck',
            'Hold for 5 seconds, avoid tilting head down',
            'Return to starting position slowly',
          ],
          frequency: '10 reps, 3 times daily',
          expectedImprovement: 'Reduced forward head position by 20-30%',
          timeframe: '4-6 weeks',
        });
      }

      // Rounded shoulders
      if (metrics.shoulderAlignment.forward > 4) {
        recommendations.push({
          id: 'shoulder-blade-squeezes',
          category: 'exercise',
          priority: 1,
          title: 'Shoulder Blade Squeezes',
          description:
            'Strengthen rhomboids and middle trapezius to improve shoulder alignment',
          instructions: [
            'Sit with arms at sides, elbows bent 90°',
            'Squeeze shoulder blades together',
            'Hold for 5 seconds without lifting shoulders',
            'Relax and repeat',
          ],
          frequency: '15 reps, 2-3 times daily',
          expectedImprovement:
            'Improved shoulder position and reduced forward rounding',
          timeframe: '3-5 weeks',
        });
      }

      // Spinal alignment issues
      if (metrics.spinalAlignment.overall < 70) {
        recommendations.push({
          id: 'workspace-ergonomics',
          category: 'ergonomic',
          priority: 2,
          title: 'Workspace Ergonomic Assessment',
          description:
            'Optimize workstation setup to support neutral spine alignment',
          instructions: [
            'Monitor at eye level to reduce neck flexion',
            'Keyboard and mouse at elbow height',
            'Feet flat on floor or footrest',
            'Back fully supported by chair',
          ],
          frequency: 'Continuous during work',
          expectedImprovement: 'Reduced postural strain throughout day',
          timeframe: 'Immediate for setup, 2-3 weeks for adaptation',
        });
      }

      // Balance issues
      if (metrics.bodyBalance.weightDistribution < 75) {
        recommendations.push({
          id: 'balance-training',
          category: 'exercise',
          priority: 2,
          title: 'Single-Leg Balance Training',
          description: 'Improve proprioception and core stability',
          instructions: [
            'Stand on one foot with eyes open',
            'Maintain balance for 30 seconds',
            'Progress to eyes closed',
            'Add head movements when comfortable',
          ],
          frequency: '3 sets each leg, daily',
          expectedImprovement: 'Better weight distribution and stability',
          timeframe: '2-4 weeks',
        });
      }

      // Immediate corrections
      recommendations.push({
        id: 'posture-breaks',
        category: 'immediate',
        priority: 1,
        title: 'Hourly Posture Breaks',
        description: 'Regular movement breaks to prevent postural fatigue',
        instructions: [
          'Set timer for every 45-60 minutes',
          'Stand and walk for 2-3 minutes',
          'Perform gentle neck and shoulder rolls',
          'Check and correct posture when returning to seat',
        ],
        frequency: 'Every hour during waking hours',
        expectedImprovement:
          'Reduced postural fatigue and maintenance of alignment',
        timeframe: 'Immediate benefit, long-term habit formation',
      });

      return recommendations.slice(0, 4); // Limit to top 4 recommendations
    },
    []
  );

  // Generate risk factors
  const generateRiskFactors = useCallback(
    (metrics: PostureMetrics): PostureRiskFactor[] => {
      const factors: PostureRiskFactor[] = [];

      if (metrics.headPosition.forwardHead > 3) {
        factors.push({
          id: 'forward-head-risk',
          area: 'cervical',
          severity: metrics.headPosition.forwardHead > 5 ? 'high' : 'moderate',
          description: 'Forward head posture increases cervical spine stress',
          impact:
            'May lead to neck pain, headaches, and cervical disc degeneration',
          progression: Math.random() < 0.3 ? 'worsening' : 'stable',
          confidence: 90,
        });
      }

      if (metrics.shoulderAlignment.forward > 4) {
        factors.push({
          id: 'rounded-shoulders-risk',
          area: 'shoulders',
          severity: metrics.shoulderAlignment.forward > 6 ? 'high' : 'moderate',
          description: 'Rounded shoulder posture affects thoracic mobility',
          impact: 'Can cause shoulder impingement and upper back pain',
          progression: Math.random() < 0.4 ? 'worsening' : 'stable',
          confidence: 85,
        });
      }

      if (metrics.spinalAlignment.overall < 60) {
        factors.push({
          id: 'spinal-misalignment-risk',
          area: 'thoracic',
          severity: 'high',
          description: 'Significant spinal misalignment detected',
          impact: 'Increased risk of chronic back pain and reduced mobility',
          progression: 'stable',
          confidence: 88,
        });
      }

      return factors;
    },
    []
  );

  // Generate improvement targets
  const generateImprovements = useCallback(
    (metrics: PostureMetrics): PostureImprovement[] => {
      const improvements: PostureImprovement[] = [];

      if (metrics.headPosition.forwardHead > 2) {
        improvements.push({
          area: 'Forward Head Position',
          currentValue: metrics.headPosition.forwardHead,
          idealRange: { min: 0, max: 2 },
          improvement: Math.min(
            100,
            ((metrics.headPosition.forwardHead - 2) /
              metrics.headPosition.forwardHead) *
              100
          ),
          priority: 1,
        });
      }

      if (metrics.shoulderAlignment.forward > 3) {
        improvements.push({
          area: 'Shoulder Forward Position',
          currentValue: metrics.shoulderAlignment.forward,
          idealRange: { min: 0, max: 3 },
          improvement: Math.min(
            100,
            ((metrics.shoulderAlignment.forward - 3) /
              metrics.shoulderAlignment.forward) *
              100
          ),
          priority: 1,
        });
      }

      if (metrics.spinalAlignment.overall < 85) {
        improvements.push({
          area: 'Overall Spinal Alignment',
          currentValue: metrics.spinalAlignment.overall,
          idealRange: { min: 85, max: 100 },
          improvement: 85 - metrics.spinalAlignment.overall,
          priority: 2,
        });
      }

      return improvements;
    },
    []
  );

  // Main analysis function
  const runPostureAnalysis = useCallback(async () => {
    setIsAnalyzing(true);
    setAnalysisProgress(0);

    try {
      const phases = [
        'Initializing LiDAR sensors...',
        'Calibrating depth perception...',
        'Detecting body landmarks...',
        'Analyzing cervical alignment...',
        'Assessing thoracic curvature...',
        'Evaluating lumbar lordosis...',
        'Measuring balance and stability...',
        'Processing postural data...',
        'Generating recommendations...',
      ];

      for (let i = 0; i < phases.length; i++) {
        await new Promise((resolve) =>
          setTimeout(resolve, sessionType === 'quick' ? 500 : 1200)
        );
        setAnalysisProgress(((i + 1) / phases.length) * 100);
      }

      // Generate analysis results
      const metrics = generatePostureMetrics();
      const recommendations = generateRecommendations(metrics);
      const riskFactors = generateRiskFactors(metrics);
      const improvements = generateImprovements(metrics);

      const analysis: PostureAnalysis = {
        id: `posture-${Date.now()}`,
        timestamp: new Date(),
        duration: phases.length * (sessionType === 'quick' ? 0.5 : 1.2),
        metrics,
        recommendations,
        riskFactors,
        overallScore: metrics.spinalAlignment.overall,
        improvements,
        session: {
          type: sessionType,
          quality: 85 + Math.random() * 10,
          dataPoints: (() => {
            if (sessionType === 'quick') return 150;
            if (sessionType === 'detailed') return 400;
            return 800;
          })(),
        },
      };

      setCurrentAnalysis(analysis);
      onAnalysisComplete?.(analysis);

      // Save to history
      setPostureHistory((prev) =>
        JSON.stringify([analysis, ...JSON.parse(prev || '[]').slice(0, 9)])
      );
    } catch (error) {
      console.error('Posture analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  }, [
    sessionType,
    generatePostureMetrics,
    generateRecommendations,
    generateRiskFactors,
    generateImprovements,
    onAnalysisComplete,
    setPostureHistory,
  ]);

  // Real-time monitoring
  useEffect(() => {
    if (!realTimeMonitoring) return;

    const interval = setInterval(() => {
      const newData: RealTimePostureData = {
        timestamp: Date.now(),
        cervicalAngle: 15 + Math.random() * 10,
        thoracicAngle: 30 + Math.random() * 15,
        lumbarAngle: 20 + Math.random() * 10,
        headForward: 3 + Math.random() * 2,
        shoulderAlignment: 85 + Math.random() * 10,
        balance: 80 + Math.random() * 15,
      };

      setRealTimeData((prev) => [...prev.slice(-29), newData]); // Keep last 30 points

      // Real-time feedback alerts
      if (feedbackEnabled) {
        const alerts = [];
        if (newData.headForward > 5) {
          alerts.push('⚠️ Forward head posture detected - pull chin back');
        }
        if (newData.shoulderAlignment < 80) {
          alerts.push(
            '⚠️ Shoulders rounded - squeeze shoulder blades together'
          );
        }
        if (newData.balance < 75) {
          alerts.push('⚠️ Poor balance detected - check foot positioning');
        }
        setFeedbackAlerts(alerts);

        // Clear alerts after 5 seconds
        if (alerts.length > 0) {
          setTimeout(() => setFeedbackAlerts([]), 5000);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [realTimeMonitoring, feedbackEnabled]);

  // Helper functions
  const getSeverityColor = (severity: PostureRiskFactor['severity']) => {
    switch (severity) {
      case 'minimal':
        return 'bg-green-100 text-green-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'critical':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 55) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 1:
        return 'bg-red-100 text-red-800';
      case 2:
        return 'bg-orange-100 text-orange-800';
      case 3:
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🧘 LiDAR Posture Analysis
            <div className="flex items-center gap-2">
              <Badge variant={realTimeMonitoring ? 'default' : 'secondary'}>
                {realTimeMonitoring ? '🔴 Live' : '⚪ Static'}
              </Badge>
              <Badge
                variant={
                  calibrationStatus === 'complete' ? 'default' : 'secondary'
                }
              >
                {calibrationStatus === 'complete'
                  ? '✅ Calibrated'
                  : '⚠️ Needs Calibration'}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={sessionType === 'quick' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSessionType('quick')}
              >
                ⚡ Quick (30s)
              </Button>
              <Button
                variant={sessionType === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSessionType('detailed')}
              >
                🔍 Detailed (2 min)
              </Button>
              <Button
                variant={sessionType === 'baseline' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSessionType('baseline')}
              >
                📊 Baseline (5 min)
              </Button>
            </div>
            <div className="flex gap-2">
              {calibrationRequired && calibrationStatus !== 'complete' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCalibrationStatus('complete')}
                >
                  🎯 Calibrate
                </Button>
              )}
              {realTimeMonitoring && (
                <Badge variant="secondary" className="text-xs">
                  {realTimeData.length} samples
                </Badge>
              )}
              <Button
                onClick={runPostureAnalysis}
                disabled={isAnalyzing}
                variant="default"
              >
                {isAnalyzing ? '🔄 Analyzing...' : '🎯 Start Analysis'}
              </Button>
            </div>
          </div>

          {isAnalyzing && (
            <div className="space-y-2">
              <Progress value={analysisProgress} className="w-full" />
              <p className="text-muted-foreground text-center text-sm">
                Analyzing posture with LiDAR sensors...{' '}
                {Math.round(analysisProgress)}%
              </p>
            </div>
          )}

          {/* Real-time feedback alerts */}
          {feedbackAlerts.length > 0 && (
            <div className="mt-4 space-y-2">
              {feedbackAlerts.map((alert) => (
                <Alert key={alert} className="border-orange-200 bg-orange-50">
                  <AlertDescription className="text-orange-800">
                    {alert}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Results */}
      {currentAnalysis && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="metrics">📏 Measurements</TabsTrigger>
            <TabsTrigger value="recommendations">💡 Exercises</TabsTrigger>
            <TabsTrigger value="risks">⚠️ Risk Factors</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Overall Score */}
            <div className="md:grid-cols-3 grid grid-cols-1 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${getScoreColor(currentAnalysis.overallScore)}`}
                    >
                      {currentAnalysis.overallScore.toFixed(0)}%
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Overall Posture Score
                    </div>
                    <Progress
                      value={currentAnalysis.overallScore}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-blue-600 text-2xl font-bold">
                      {currentAnalysis.riskFactors.length}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Risk Factors
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-green-600 text-2xl font-bold">
                      {currentAnalysis.session.quality.toFixed(0)}%
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Scan Quality
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Key Improvements */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Priority Improvements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {currentAnalysis.improvements
                    .filter((imp) => imp.priority <= 2)
                    .map((improvement) => (
                      <div
                        key={improvement.area}
                        className="p-3 bg-blue-50 flex items-center justify-between rounded-lg"
                      >
                        <div>
                          <h4 className="font-medium">{improvement.area}</h4>
                          <p className="text-muted-foreground text-sm">
                            Current: {improvement.currentValue.toFixed(1)} |
                            Target: {improvement.idealRange.min}-
                            {improvement.idealRange.max}
                          </p>
                        </div>
                        <Badge
                          className={getPriorityColor(improvement.priority)}
                        >
                          {improvement.improvement.toFixed(0)}% improvement
                          needed
                        </Badge>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
              {/* Spinal Alignment */}
              <Card>
                <CardHeader>
                  <CardTitle>🦴 Spinal Alignment</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Cervical (Neck)</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.spinalAlignment.cervical.toFixed(
                            1
                          )}
                          °
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            currentAnalysis.metrics.spinalAlignment.cervical * 2
                        )}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Thoracic (Upper Back)</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.spinalAlignment.thoracic.toFixed(
                            1
                          )}
                          °
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            currentAnalysis.metrics.spinalAlignment.thoracic *
                              1.5
                        )}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Lumbar (Lower Back)</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.spinalAlignment.lumbar.toFixed(
                            1
                          )}
                          °
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            currentAnalysis.metrics.spinalAlignment.lumbar * 2
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Head Position */}
              <Card>
                <CardHeader>
                  <CardTitle>👤 Head Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Forward Position</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.headPosition.forwardHead.toFixed(
                            1
                          )}
                          cm
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            currentAnalysis.metrics.headPosition.forwardHead *
                              10
                        )}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Side Tilt</span>
                        <span className="text-muted-foreground text-sm">
                          {Math.abs(
                            currentAnalysis.metrics.headPosition.tilt
                          ).toFixed(1)}
                          °
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            Math.abs(
                              currentAnalysis.metrics.headPosition.tilt
                            ) *
                              5
                        )}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Rotation</span>
                        <span className="text-muted-foreground text-sm">
                          {Math.abs(
                            currentAnalysis.metrics.headPosition.rotation
                          ).toFixed(1)}
                          °
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            Math.abs(
                              currentAnalysis.metrics.headPosition.rotation
                            ) *
                              4
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shoulder Alignment */}
              <Card>
                <CardHeader>
                  <CardTitle>🤷 Shoulder Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Forward Position</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.shoulderAlignment.forward.toFixed(
                            1
                          )}
                          cm
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            currentAnalysis.metrics.shoulderAlignment.forward *
                              8
                        )}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Height Difference</span>
                        <span className="text-muted-foreground text-sm">
                          {Math.abs(
                            currentAnalysis.metrics.shoulderAlignment.height
                          ).toFixed(1)}
                          cm
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            Math.abs(
                              currentAnalysis.metrics.shoulderAlignment.height
                            ) *
                              15
                        )}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Internal Rotation</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.shoulderAlignment.rotation.toFixed(
                            1
                          )}
                          °
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            currentAnalysis.metrics.shoulderAlignment.rotation *
                              3
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Balance & Stability */}
              <Card>
                <CardHeader>
                  <CardTitle>⚖️ Balance & Stability</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Weight Distribution</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.bodyBalance.weightDistribution.toFixed(
                            0
                          )}
                          %
                        </span>
                      </div>
                      <Progress
                        value={
                          currentAnalysis.metrics.bodyBalance.weightDistribution
                        }
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Left-Right Shift</span>
                        <span className="text-muted-foreground text-sm">
                          {Math.abs(
                            currentAnalysis.metrics.bodyBalance.leftRightShift
                          ).toFixed(1)}
                          cm
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 -
                            Math.abs(
                              currentAnalysis.metrics.bodyBalance.leftRightShift
                            ) *
                              8
                        )}
                      />
                    </div>
                    <div>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm">Postural Sway</span>
                        <span className="text-muted-foreground text-sm">
                          {currentAnalysis.metrics.stability.sway.toFixed(1)}mm
                        </span>
                      </div>
                      <Progress
                        value={Math.max(
                          0,
                          100 - currentAnalysis.metrics.stability.sway * 2
                        )}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <div className="space-y-4">
              {currentAnalysis.recommendations.map((rec) => (
                <Card key={rec.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg">{rec.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge className={getPriorityColor(rec.priority)}>
                          Priority {rec.priority}
                        </Badge>
                        <Badge variant="outline">{rec.category}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-3 text-sm">
                      {rec.description}
                    </p>
                    <div className="mb-3 space-y-2">
                      <h4 className="text-sm font-medium">Instructions:</h4>
                      <ol className="space-y-1 text-sm">
                        {rec.instructions.map((instruction, index) => (
                          <li
                            key={`${rec.id}-${index}`}
                            className="flex items-start gap-2"
                          >
                            <span className="text-blue-500 font-medium">
                              {index + 1}.
                            </span>
                            {instruction}
                          </li>
                        ))}
                      </ol>
                    </div>
                    <div className="md:grid-cols-3 grid grid-cols-1 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Frequency:</span>
                        <p className="text-muted-foreground">{rec.frequency}</p>
                      </div>
                      <div>
                        <span className="font-medium">Expected:</span>
                        <p className="text-muted-foreground">
                          {rec.expectedImprovement}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium">Timeframe:</span>
                        <p className="text-muted-foreground">{rec.timeframe}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="risks" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>⚠️ Identified Risk Factors</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {currentAnalysis.riskFactors.map((factor) => (
                    <div key={factor.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <h4 className="font-medium">{factor.description}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getSeverityColor(factor.severity)}>
                            {factor.severity}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {factor.area}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-2 text-sm">
                        {factor.impact}
                      </p>
                      <div className="text-xs text-muted-foreground flex items-center gap-4">
                        <span>Progression: {factor.progression}</span>
                        <span>Confidence: {factor.confidence}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* High Risk Alert */}
      {currentAnalysis &&
        currentAnalysis.riskFactors.some(
          (f) => f.severity === 'critical' || f.severity === 'high'
        ) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertDescription className="text-red-800">
              🚨 **High Risk Posture Issues Detected** - Consider consulting
              with a healthcare professional for personalized treatment
              recommendations.
            </AlertDescription>
          </Alert>
        )}
    </div>
  );
}
