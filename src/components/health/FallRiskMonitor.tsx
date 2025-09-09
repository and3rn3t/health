/**
 * Fall Risk Monitor - Comprehensive fall risk assessment and monitoring dashboard
 * Focused on real-time fall detection, risk assessment, and prevention strategies
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
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Calendar,
  Eye,
  Footprints,
  Heart,
  Phone,
  Shield,
  Target,
  Users,
} from 'lucide-react';
import { useState } from 'react';

interface FallRiskMonitorProps {
  healthData: ProcessedHealthData;
  onNavigateToFeature?: (feature: string) => void;
}

export default function FallRiskMonitor({
  healthData,
  onNavigateToFeature: _onNavigateToFeature,
}: FallRiskMonitorProps) {
  const [activeMonitoringTab, setActiveMonitoringTab] = useState('overview');

  // Calculate fall risk metrics
  const fallRiskFactors = healthData.fallRiskFactors || [];
  const fallRiskLevel = fallRiskFactors.length;
  const overallRiskScore = Math.min(fallRiskLevel * 20, 100);

  // Risk categorization
  const getRiskCategory = (score: number) => {
    if (score <= 20)
      return {
        level: 'Low',
        color: 'green',
        description: 'Low fall risk - maintain current activity levels',
      };
    if (score <= 40)
      return {
        level: 'Low-Medium',
        color: 'yellow',
        description: 'Some risk factors present - monitor closely',
      };
    if (score <= 60)
      return {
        level: 'Medium',
        color: 'orange',
        description: 'Moderate risk - intervention recommended',
      };
    if (score <= 80)
      return {
        level: 'Medium-High',
        color: 'red',
        description: 'High risk - immediate attention needed',
      };
    return {
      level: 'High',
      color: 'red',
      description: 'Critical risk - urgent intervention required',
    };
  };

  const riskCategory = getRiskCategory(overallRiskScore);

  // Sample gait and balance metrics (would come from sensors in real app)
  const gaitMetrics = {
    stepLength: 0.65, // meters
    walkingSpeed: 1.2, // m/s
    stepSymmetry: 0.92, // ratio
    balanceScore: 85, // out of 100
    doubleSupportTime: 0.25, // seconds
    cadence: 110, // steps per minute
  };

  // Recent fall incidents (sample data)
  const recentIncidents = [
    {
      date: '2025-09-06',
      type: 'Near Fall',
      location: 'Kitchen',
      severity: 'Low',
      recovered: true,
    },
    {
      date: '2025-09-04',
      type: 'Balance Loss',
      location: 'Bathroom',
      severity: 'Medium',
      recovered: true,
    },
  ];

  // Environmental risk factors
  const environmentalRisks = [
    {
      factor: 'Lighting',
      status: 'Good',
      recommendation: 'Maintain current lighting levels',
    },
    {
      factor: 'Floor Surfaces',
      status: 'Attention Needed',
      recommendation: 'Check for loose rugs or wet areas',
    },
    {
      factor: 'Handrails',
      status: 'Good',
      recommendation: 'All handrails secure and accessible',
    },
    {
      factor: 'Stairs',
      status: 'Monitor',
      recommendation: 'Consider additional lighting on stairs',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight">Fall Risk Monitor</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Real-time fall detection and comprehensive risk assessment
        </p>
      </div>

      {/* Current Risk Status */}
      <Card
        className={`border-l-4 ${
          riskCategory.color === 'green'
            ? 'border-l-green-500 bg-green-50 dark:bg-green-950'
            : riskCategory.color === 'yellow'
              ? 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-950'
              : riskCategory.color === 'orange'
                ? 'border-l-orange-500 bg-orange-50 dark:bg-orange-950'
                : 'border-l-red-500 bg-red-50 dark:bg-red-950'
        }`}
      >
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield
                className={`h-6 w-6 ${
                  riskCategory.color === 'green'
                    ? 'text-green-600'
                    : riskCategory.color === 'yellow'
                      ? 'text-yellow-600'
                      : riskCategory.color === 'orange'
                        ? 'text-orange-600'
                        : 'text-red-600'
                }`}
              />
              <div>
                <CardTitle className="text-xl">
                  Current Fall Risk Level
                </CardTitle>
                <CardDescription>{riskCategory.description}</CardDescription>
              </div>
            </div>
            <Badge
              variant={
                riskCategory.color === 'green' ? 'default' : 'destructive'
              }
              className="text-sm"
            >
              {riskCategory.level} Risk
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Risk Score</span>
                <span className="font-medium">{overallRiskScore}/100</span>
              </div>
              <Progress
                value={overallRiskScore}
                className={`h-2 ${
                  riskCategory.color === 'green'
                    ? '[&>div]:bg-green-500'
                    : riskCategory.color === 'yellow'
                      ? '[&>div]:bg-yellow-500'
                      : riskCategory.color === 'orange'
                        ? '[&>div]:bg-orange-500'
                        : '[&>div]:bg-red-500'
                }`}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Risk Factors:
                </span>
                <span className="ml-2 font-medium">
                  {fallRiskLevel} identified
                </span>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400">
                  Last Assessment:
                </span>
                <span className="ml-2 font-medium">2 hours ago</span>
              </div>
            </div>

            {fallRiskLevel > 2 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Multiple risk factors detected. Consider consulting with
                  healthcare provider for intervention strategies.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      <Tabs
        value={activeMonitoringTab}
        onValueChange={setActiveMonitoringTab}
        className="space-y-8"
      >
        <TabsList className="grid w-full grid-cols-4 gap-1">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="gait" className="flex items-center gap-2">
            <Footprints className="h-4 w-4" />
            Gait Analysis
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="prevention" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Prevention
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* Real-time Monitoring Status */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-green-600" />
                  Real-time Monitoring
                </CardTitle>
                <CardDescription>
                  Current monitoring status and sensor data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <span>Apple Watch</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>iPhone Sensors</span>
                  <Badge
                    variant="default"
                    className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  >
                    Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span>Emergency Contacts</span>
                  <Badge variant="outline">2 configured</Badge>
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <Phone className="mr-2 h-4 w-4" />
                    Test Emergency Alert
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  AI Risk Assessment
                </CardTitle>
                <CardDescription>
                  Machine learning analysis of fall risk patterns
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Movement Pattern Analysis</span>
                    <span className="font-medium">Normal</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Balance Confidence</span>
                    <span className="font-medium">85%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Medication Effects</span>
                    <span className="font-medium">Low Impact</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Environmental Hazards</span>
                    <span className="font-medium">2 detected</span>
                  </div>
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Detailed Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Risk Factors Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Identified Risk Factors</CardTitle>
              <CardDescription>
                Current factors that may increase fall risk
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {fallRiskFactors.map((riskFactor, index) => (
                  <div
                    key={`factor-${index}`}
                    className="flex items-center gap-3 rounded-lg border bg-gray-50 p-4 dark:bg-gray-900"
                  >
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    <span className="text-sm font-medium">
                      {riskFactor.factor}
                    </span>
                  </div>
                ))}
                {fallRiskFactors.length === 0 && (
                  <div className="col-span-full py-12 text-center text-gray-500">
                    <Shield className="mx-auto mb-3 h-8 w-8 text-green-500" />
                    <p>No significant risk factors detected</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gait" className="space-y-8">
          {/* Gait Metrics */}
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Gait Analysis</CardTitle>
                <CardDescription>
                  Walking pattern and stability metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Walking Speed</span>
                    <span className="font-medium">
                      {gaitMetrics.walkingSpeed} m/s
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Step Length</span>
                    <span className="font-medium">
                      {gaitMetrics.stepLength} m
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Step Symmetry</span>
                    <span className="font-medium">
                      {(gaitMetrics.stepSymmetry * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Cadence</span>
                    <span className="font-medium">
                      {gaitMetrics.cadence} steps/min
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Double Support Time</span>
                    <span className="font-medium">
                      {gaitMetrics.doubleSupportTime} sec
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Balance Assessment</CardTitle>
                <CardDescription>
                  Current balance and stability scores
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span>Overall Balance Score</span>
                    <span className="font-medium">
                      {gaitMetrics.balanceScore}/100
                    </span>
                  </div>
                  <Progress value={gaitMetrics.balanceScore} className="h-2" />
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Score based on postural sway, reaction time, and stability
                  during movement.
                </div>
                <div className="pt-4">
                  <Button variant="outline" className="w-full">
                    <Target className="mr-2 h-4 w-4" />
                    Start Balance Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-8">
          {/* Recent Incidents */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Incidents</CardTitle>
              <CardDescription>
                Fall incidents and near-miss events in the past 30 days
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentIncidents.length > 0 ? (
                <div className="space-y-4">
                  {recentIncidents.map((incident, index) => (
                    <div
                      key={`incident-${incident.date}-${incident.type}-${index}`}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            incident.severity === 'Low'
                              ? 'bg-yellow-500'
                              : incident.severity === 'Medium'
                                ? 'bg-orange-500'
                                : 'bg-red-500'
                          }`}
                        />
                        <div>
                          <div className="font-medium">{incident.type}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {incident.location} • {incident.date}
                          </div>
                        </div>
                      </div>
                      <Badge
                        variant={incident.recovered ? 'default' : 'destructive'}
                      >
                        {incident.recovered
                          ? 'Recovered'
                          : 'Assistance Required'}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-gray-500">
                  <Shield className="mx-auto mb-3 h-8 w-8 text-green-500" />
                  <p>No incidents recorded in the past 30 days</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="prevention" className="space-y-8">
          {/* Environmental Risk Assessment */}
          <Card>
            <CardHeader>
              <CardTitle>Environmental Risk Assessment</CardTitle>
              <CardDescription>
                Home environment safety evaluation and recommendations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-5">
                {environmentalRisks.map((risk, index) => (
                  <div
                    key={`env-risk-${risk.factor}-${index}`}
                    className="flex items-center justify-between rounded-lg border p-4"
                  >
                    <div>
                      <div className="font-medium">{risk.factor}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        {risk.recommendation}
                      </div>
                    </div>
                    <Badge
                      variant={
                        risk.status === 'Good'
                          ? 'default'
                          : risk.status === 'Monitor'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {risk.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Intervention Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Interventions</CardTitle>
              <CardDescription>
                Personalized recommendations to reduce fall risk
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-start gap-3 rounded-lg bg-blue-50 p-4 dark:bg-blue-950">
                  <Target className="mt-0.5 h-5 w-5 text-blue-600" />
                  <div>
                    <div className="font-medium">Balance Training</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      30 minutes of balance exercises, 3 times per week
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-green-50 p-4 dark:bg-green-950">
                  <Heart className="mt-0.5 h-5 w-5 text-green-600" />
                  <div>
                    <div className="font-medium">Strength Training</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Focus on leg and core strength exercises
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3 rounded-lg bg-purple-50 p-4 dark:bg-purple-950">
                  <Users className="mt-0.5 h-5 w-5 text-purple-600" />
                  <div>
                    <div className="font-medium">Healthcare Consultation</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Review medications and discuss fall prevention strategies
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
