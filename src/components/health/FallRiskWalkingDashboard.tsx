/**
 * Comprehensive Fall Risk & Walking Analysis Dashboard
 * Combines multiple assessment methods for complete fall risk evaluation
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
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  Footprints,
  Phone,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface FallRiskWalkingDashboardProps {
  healthData: ProcessedHealthData;
}

interface WalkingMetrics {
  walkingSpeed: number;
  stepLength: number;
  walkingAsymmetry: number;
  doubleSupportTime: number;
  walkingSteadiness: number;
  cadence: number;
  stairClimbingSpeed: number;
  sixMinuteWalkDistance: number;
}

interface FallRiskAssessment {
  overallScore: number;
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  riskFactors: FallRiskFactor[];
  recommendations: string[];
  lastAssessment: Date;
}

interface FallRiskFactor {
  name: string;
  value: number;
  unit: string;
  score: number;
  severity: 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  recommendation: string;
}

interface BalanceAssessment {
  score: number;
  maxScore: number;
  indicators: BalanceIndicator[];
  assessmentDate: Date;
}

interface BalanceIndicator {
  type: 'stability' | 'asymmetry' | 'mobility' | 'coordination';
  severity: 'mild' | 'moderate' | 'severe';
  description: string;
}

function WalkingMetricsCard({
  walkingMetrics,
}: {
  walkingMetrics: WalkingMetrics;
}) {
  const getMetricStatus = (value: number, normalRange: [number, number]) => {
    if (value >= normalRange[0] && value <= normalRange[1]) return 'normal';
    if (value < normalRange[0] * 0.8 || value > normalRange[1] * 1.2)
      return 'concerning';
    return 'attention';
  };

  const metrics = [
    {
      label: 'Walking Speed',
      value: walkingMetrics.walkingSpeed,
      unit: 'm/s',
      normalRange: [1.2, 1.4] as [number, number],
      description: 'Normal: 1.2-1.4 m/s for healthy adults',
      icon: <Footprints className="h-4 w-4" />,
    },
    {
      label: 'Step Length',
      value: walkingMetrics.stepLength,
      unit: 'm',
      normalRange: [0.6, 0.8] as [number, number],
      description: 'Normal: 0.6-0.8m per step',
      icon: <Target className="h-4 w-4" />,
    },
    {
      label: 'Walking Asymmetry',
      value: walkingMetrics.walkingAsymmetry,
      unit: '%',
      normalRange: [0, 3] as [number, number],
      description: 'Normal: <3% difference between legs',
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      label: 'Double Support Time',
      value: walkingMetrics.doubleSupportTime,
      unit: '%',
      normalRange: [20, 25] as [number, number],
      description: 'Normal: 20-25% of gait cycle',
      icon: <Clock className="h-4 w-4" />,
    },
    {
      label: 'Walking Steadiness',
      value: walkingMetrics.walkingSteadiness,
      unit: '%',
      normalRange: [70, 100] as [number, number],
      description: 'Apple HealthKit stability measure',
      icon: <Shield className="h-4 w-4" />,
    },
    {
      label: 'Cadence',
      value: walkingMetrics.cadence,
      unit: 'steps/min',
      normalRange: [100, 120] as [number, number],
      description: 'Normal: 100-120 steps per minute',
      icon: <Activity className="h-4 w-4" />,
    },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Footprints className="h-5 w-5" />
          Gait & Walking Analysis
        </CardTitle>
        <CardDescription>
          Comprehensive assessment of walking patterns and gait metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {metrics.map((metric) => {
          const status = getMetricStatus(metric.value, metric.normalRange);

          return (
            <div key={metric.label} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {metric.icon}
                  <span className="font-medium">{metric.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">
                    {metric.value.toFixed(2)}
                    {metric.unit}
                  </span>
                  <Badge
                    variant={
                      status === 'normal'
                        ? 'default'
                        : status === 'attention'
                          ? 'secondary'
                          : 'destructive'
                    }
                  >
                    {status === 'normal'
                      ? 'Normal'
                      : status === 'attention'
                        ? 'Monitor'
                        : 'Concerning'}
                  </Badge>
                </div>
              </div>

              <div className="space-y-1">
                <Progress
                  value={Math.min(
                    100,
                    (metric.value / metric.normalRange[1]) * 100
                  )}
                  className={`h-2 ${status === 'concerning' ? 'bg-red-100' : ''}`}
                />
                <p className="text-muted-foreground text-xs">
                  {metric.description}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}

function FallRiskGauge({ assessment }: { assessment: FallRiskAssessment }) {
  const getRiskBg = (level: string) => {
    switch (level) {
      case 'low':
        return 'bg-green-100';
      case 'moderate':
        return 'bg-yellow-100';
      case 'high':
        return 'bg-orange-100';
      case 'critical':
        return 'bg-red-100';
      default:
        return 'bg-gray-100';
    }
  };

  const strokeDasharray = 2 * Math.PI * 40;
  const strokeDashoffset =
    strokeDasharray - (assessment.overallScore / 4) * strokeDasharray;

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Shield className="h-5 w-5" />
          Fall Risk Assessment
        </CardTitle>
        <CardDescription>
          Overall fall risk score based on multiple factors
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-4">
        <div className="relative h-32 w-32">
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
                assessment.riskLevel === 'low'
                  ? 'rgb(34 197 94)'
                  : assessment.riskLevel === 'moderate'
                    ? 'rgb(234 179 8)'
                    : assessment.riskLevel === 'high'
                      ? 'rgb(249 115 22)'
                      : 'rgb(239 68 68)'
              }
              strokeWidth="8"
              strokeDasharray={strokeDasharray}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold">
              {assessment.overallScore.toFixed(1)}
            </span>
            <span className="text-muted-foreground text-xs">/ 4.0</span>
          </div>
        </div>

        <Badge
          variant={
            assessment.riskLevel === 'critical'
              ? 'destructive'
              : assessment.riskLevel === 'high'
                ? 'secondary'
                : 'default'
          }
          className={`text-sm ${getRiskBg(assessment.riskLevel)}`}
        >
          {assessment.riskLevel.charAt(0).toUpperCase() +
            assessment.riskLevel.slice(1)}{' '}
          Risk
        </Badge>

        <div className="space-y-2 text-center">
          <p className="text-muted-foreground text-sm">
            Last assessed: {assessment.lastAssessment.toLocaleDateString()}
          </p>
          <p className="text-muted-foreground text-xs">
            {assessment.riskFactors.length} risk factors identified
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function RiskFactorsAnalysis({
  assessment,
}: {
  assessment: FallRiskAssessment;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Risk Factors Analysis
        </CardTitle>
        <CardDescription>
          Detailed breakdown of factors contributing to fall risk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {assessment.riskFactors.map((factor, index) => (
          <div key={index} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium">{factor.name}</span>
                <Badge
                  variant={
                    factor.severity === 'critical'
                      ? 'destructive'
                      : factor.severity === 'high'
                        ? 'secondary'
                        : 'default'
                  }
                >
                  {factor.severity}
                </Badge>
              </div>
              <span className="font-mono text-sm">
                {factor.value.toFixed(2)} {factor.unit}
              </span>
            </div>

            <Progress
              value={(factor.score / 4) * 100}
              className={`h-2 ${factor.severity === 'critical' || factor.severity === 'high' ? 'bg-red-100' : ''}`}
            />

            <div className="space-y-1">
              <p className="text-muted-foreground text-sm">
                {factor.description}
              </p>
              <p className="text-sm text-blue-600">{factor.recommendation}</p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function BalanceAssessmentCard({ balance }: { balance: BalanceAssessment }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Eye className="h-5 w-5" />
          Balance Assessment
        </CardTitle>
        <CardDescription>
          Clinical balance evaluation based on gait metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2 text-center">
          <div className="text-3xl font-bold">
            {balance.score.toFixed(1)}
            <span className="text-muted-foreground text-lg">
              /{balance.maxScore}
            </span>
          </div>
          <Progress
            value={(balance.score / balance.maxScore) * 100}
            className="h-3"
          />
          <p className="text-muted-foreground text-sm">
            Balance Score (0-10 clinical scale)
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="font-medium">Balance Indicators</h4>
          {balance.indicators.map((indicator, index) => (
            <div
              key={index}
              className="flex items-center justify-between rounded border p-2"
            >
              <div className="flex items-center gap-2">
                <div
                  className={`h-2 w-2 rounded-full ${
                    indicator.severity === 'mild'
                      ? 'bg-green-500'
                      : indicator.severity === 'moderate'
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                />
                <span className="text-sm font-medium capitalize">
                  {indicator.type}
                </span>
              </div>
              <Badge
                variant={
                  indicator.severity === 'severe' ? 'destructive' : 'secondary'
                }
              >
                {indicator.severity}
              </Badge>
            </div>
          ))}
        </div>

        <p className="text-muted-foreground text-xs">
          Assessment date: {balance.assessmentDate.toLocaleDateString()}
        </p>
      </CardContent>
    </Card>
  );
}

function RecommendationsPanel({
  assessment,
}: {
  assessment: FallRiskAssessment;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5" />
          Personalized Recommendations
        </CardTitle>
        <CardDescription>
          Evidence-based interventions to reduce fall risk
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {assessment.recommendations.map((recommendation, index) => (
          <div
            key={index}
            className="flex items-start gap-3 rounded-lg border-l-4 border-blue-500 bg-blue-50 p-3"
          >
            <ArrowRight className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
            <p className="text-sm">{recommendation}</p>
          </div>
        ))}

        {assessment.riskLevel === 'high' ||
        assessment.riskLevel === 'critical' ? (
          <Alert className="border-l-4 border-red-500 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              <strong>High fall risk detected.</strong> We recommend consulting
              with your healthcare provider immediately for a comprehensive fall
              risk assessment and potential interventions.
            </AlertDescription>
          </Alert>
        ) : null}
      </CardContent>
    </Card>
  );
}

export default function FallRiskWalkingDashboard({
  healthData,
}: FallRiskWalkingDashboardProps) {
  const [walkingMetrics, setWalkingMetrics] = useState<WalkingMetrics>({
    walkingSpeed: 1.25,
    stepLength: 0.72,
    walkingAsymmetry: 2.1,
    doubleSupportTime: 22.5,
    walkingSteadiness: 78,
    cadence: 110,
    stairClimbingSpeed: 0.35,
    sixMinuteWalkDistance: 450,
  });

  const [fallRiskAssessment] = useState<FallRiskAssessment>({
    overallScore: 2.1,
    riskLevel: 'moderate',
    riskFactors: [
      {
        name: 'Walking Speed',
        value: 1.25,
        unit: 'm/s',
        score: 1.5,
        severity: 'low',
        description: 'Walking speed is within normal range for age group',
        recommendation: 'Maintain current activity level with regular walks',
      },
      {
        name: 'Walking Steadiness',
        value: 78,
        unit: '%',
        score: 2.0,
        severity: 'moderate',
        description: 'Walking steadiness shows some instability patterns',
        recommendation:
          'Consider balance training exercises and physical therapy',
      },
      {
        name: 'Step Asymmetry',
        value: 2.1,
        unit: '%',
        score: 1.0,
        severity: 'low',
        description: 'Gait asymmetry is within normal limits',
        recommendation: 'Continue current activity patterns',
      },
    ],
    recommendations: [
      'Practice daily balance exercises (10-15 minutes)',
      'Consider tai chi or yoga classes for balance improvement',
      'Ensure adequate lighting in all walking areas',
      'Remove trip hazards from home environment',
      'Regular strength training focusing on leg muscles',
      'Annual eye examination to ensure optimal vision',
    ],
    lastAssessment: new Date(),
  });

  const [balanceAssessment] = useState<BalanceAssessment>({
    score: 7.8,
    maxScore: 10.0,
    indicators: [
      {
        type: 'stability',
        severity: 'mild',
        description: 'Minor stability concerns during walking',
      },
      {
        type: 'mobility',
        severity: 'mild',
        description: 'Good overall mobility patterns',
      },
    ],
    assessmentDate: new Date(),
  });

  useEffect(() => {
    // In a real implementation, this would fetch data from the health APIs
    if (healthData && healthData.metrics) {
      // Update walking metrics based on real health data
      const updatedMetrics = {
        ...walkingMetrics,
        walkingSteadiness:
          healthData.metrics.walkingSteadiness?.average ||
          walkingMetrics.walkingSteadiness,
      };
      setWalkingMetrics(updatedMetrics);
    }
  }, [healthData, walkingMetrics, setWalkingMetrics]);

  return (
    <div className="space-y-6">
      {/* Header with Current Status */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Shield className="h-8 w-8" />
            Fall Risk & Walking Analysis
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive assessment of fall risk factors and walking patterns
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Phone className="mr-2 h-4 w-4" />
            Contact Caregiver
          </Button>
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Share Report
          </Button>
        </div>
      </div>

      {/* Quick Status Overview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Shield
                className={`h-5 w-5 ${
                  fallRiskAssessment.riskLevel === 'low'
                    ? 'text-green-500'
                    : fallRiskAssessment.riskLevel === 'moderate'
                      ? 'text-yellow-500'
                      : 'text-red-500'
                }`}
              />
              <div>
                <p className="text-muted-foreground text-sm">Fall Risk</p>
                <p className="font-semibold capitalize">
                  {fallRiskAssessment.riskLevel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Footprints className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-muted-foreground text-sm">Walking Speed</p>
                <p className="font-semibold">
                  {walkingMetrics.walkingSpeed.toFixed(2)} m/s
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-muted-foreground text-sm">Balance Score</p>
                <p className="font-semibold">
                  {balanceAssessment.score.toFixed(1)}/10
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-purple-500" />
              <div>
                <p className="text-muted-foreground text-sm">Steadiness</p>
                <p className="font-semibold">
                  {walkingMetrics.walkingSteadiness}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="gait">Gait Analysis</TabsTrigger>
          <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <FallRiskGauge assessment={fallRiskAssessment} />
            <BalanceAssessmentCard balance={balanceAssessment} />
          </div>

          <RiskFactorsAnalysis assessment={fallRiskAssessment} />
        </TabsContent>

        <TabsContent value="gait" className="space-y-6">
          <WalkingMetricsCard walkingMetrics={walkingMetrics} />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gait Pattern Trends</CardTitle>
                <CardDescription>
                  Walking pattern changes over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Walking speed improving over 30 days
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-red-500" />
                    <span className="text-sm">
                      Slight increase in step asymmetry
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">
                      Steadiness within normal range
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Mobility Assessment</CardTitle>
                <CardDescription>
                  Functional mobility evaluation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">6-Minute Walk Test</span>
                    <span className="font-mono text-sm">
                      {walkingMetrics.sixMinuteWalkDistance}m
                    </span>
                  </div>
                  <Progress
                    value={(walkingMetrics.sixMinuteWalkDistance / 600) * 100}
                  />

                  <div className="flex justify-between">
                    <span className="text-sm">Stair Climbing Speed</span>
                    <span className="font-mono text-sm">
                      {walkingMetrics.stairClimbingSpeed} m/s
                    </span>
                  </div>
                  <Progress
                    value={(walkingMetrics.stairClimbingSpeed / 0.5) * 100}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="risk" className="space-y-6">
          <RiskFactorsAnalysis assessment={fallRiskAssessment} />
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          <RecommendationsPanel assessment={fallRiskAssessment} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
