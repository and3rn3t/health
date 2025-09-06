/**
 * Comprehensive Fall Risk & Walking Management Dashboard
 * Main entry point for all fall risk and walking-related features
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ProcessedHealthData } from '@/types';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Brain,
  Calendar,
  Download,
  Eye,
  Footprints,
  Heart,
  Phone,
  Settings,
  Shield,
  Target,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AdvancedCaregiverAlerts,
  EnhancedFallRiskMonitor,
  FallRiskInterventions,
  FallRiskMonitor,
  FallRiskWalkingDashboard,
  LiDAREnvironmentalHazardDetector,
  LiDARFallPredictionEngine,
  LiDARTrainingAssistant,
  WalkingPatternMonitor,
} from './fall-risk-components';
// import AdvancedCaregiverAlerts from './AdvancedCaregiverAlerts';
// import EnhancedFallRiskMonitor from './EnhancedFallRiskMonitor';
import FallHistory from './FallHistory';
// import FallRiskInterventions from './FallRiskInterventions';
// import FallRiskMonitor from './FallRiskMonitor';
// import FallRiskWalkingDashboard from './FallRiskWalkingDashboard';
// import LiDAREnvironmentalHazardDetector from './LiDAREnvironmentalHazardDetector';
// import LiDARFallPredictionEngine from './LiDARFallPredictionEngine';
// import LiDARTrainingAssistant from './LiDARTrainingAssistant';
// import WalkingPatternMonitor from './WalkingPatternMonitor';

interface FallRiskWalkingManagerProps {
  healthData: ProcessedHealthData;
}

type TrendDirection = 'improving' | 'stable' | 'declining';

interface DashboardStats {
  fallRiskLevel: 'low' | 'moderate' | 'high' | 'critical';
  fallRiskScore: number;
  walkingSpeed: number;
  walkingSteadiness: number;
  balanceScore: number;
  interventionsCompleted: number;
  totalInterventions: number;
  lastAssessment: Date;
  recentTrends: {
    riskTrend: TrendDirection;
    speedTrend: TrendDirection;
    steadinessTrend: TrendDirection;
  };
}

interface QuickAlert {
  id: string;
  type: 'risk_increase' | 'intervention_due' | 'assessment_due' | 'emergency';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  actionRequired: boolean;
  timestamp: Date;
}

function DashboardOverview({ stats }: { stats: DashboardStats }) {
  const getRiskColor = (level: string) => {
    switch (level) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'critical':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Activity className="h-4 w-4 text-blue-500" />;
    }
  };

  const completionRate =
    stats.totalInterventions > 0
      ? (stats.interventionsCompleted / stats.totalInterventions) * 100
      : 0;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
      {/* Fall Risk Level */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Fall Risk Level</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge className={getRiskColor(stats.fallRiskLevel)}>
                  {stats.fallRiskLevel}
                </Badge>
                {getTrendIcon(stats.recentTrends.riskTrend)}
              </div>
              <p className="mt-2 text-2xl font-bold">
                {stats.fallRiskScore.toFixed(1)}/4.0
              </p>
            </div>
            <Shield className="text-muted-foreground h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      {/* Walking Performance */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Walking Speed</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-medium">
                  {stats.walkingSpeed.toFixed(2)} m/s
                </span>
                {getTrendIcon(stats.recentTrends.speedTrend)}
              </div>
              <p className="mt-2 text-2xl font-bold">
                {stats.walkingSteadiness}%
              </p>
              <p className="text-muted-foreground text-xs">Steadiness</p>
            </div>
            <Footprints className="text-muted-foreground h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      {/* Balance Score */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Balance Score</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-medium">Clinical Assessment</span>
                {getTrendIcon(stats.recentTrends.steadinessTrend)}
              </div>
              <p className="mt-2 text-2xl font-bold">
                {stats.balanceScore.toFixed(1)}/10
              </p>
            </div>
            <Eye className="text-muted-foreground h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      {/* Interventions Progress */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Interventions</p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-sm font-medium">
                  {stats.interventionsCompleted}/{stats.totalInterventions}{' '}
                  Complete
                </span>
              </div>
              <p className="mt-2 text-2xl font-bold">
                {completionRate.toFixed(0)}%
              </p>
            </div>
            <Target className="text-muted-foreground h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QuickAlertsPanel({ alerts }: { alerts: QuickAlert[] }) {
  const getAlertColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'border-red-500 bg-red-50';
      case 'warning':
        return 'border-yellow-500 bg-yellow-50';
      default:
        return 'border-blue-500 bg-blue-50';
    }
  };

  const getAlertIcon = (type: string, severity: string) => {
    if (severity === 'critical')
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    switch (type) {
      case 'risk_increase':
        return <TrendingUp className="h-4 w-4 text-orange-500" />;
      case 'intervention_due':
        return <Target className="h-4 w-4 text-blue-500" />;
      case 'assessment_due':
        return <Calendar className="h-4 w-4 text-purple-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            System Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <Activity className="mx-auto mb-2 h-8 w-8 text-green-500" />
            <p className="text-muted-foreground text-sm">All systems normal</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Active Alerts ({alerts.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className={`rounded-lg border-l-4 p-3 ${getAlertColor(alert.severity)}`}
          >
            <div className="flex items-start gap-3">
              {getAlertIcon(alert.type, alert.severity)}
              <div className="flex-1">
                <p className="text-sm font-medium">{alert.title}</p>
                <p className="text-muted-foreground text-sm">{alert.message}</p>
                <p className="text-muted-foreground mt-1 text-xs">
                  {alert.timestamp.toLocaleString()}
                </p>
                {alert.actionRequired && (
                  <Button size="sm" className="mt-2">
                    Take Action
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ActionPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Quick Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button className="w-full justify-start" variant="outline">
          <Activity className="mr-2 h-4 w-4" />
          Start Walking Session
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <BarChart3 className="mr-2 h-4 w-4" />
          Run Fall Risk Assessment
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Contact Caregiver
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Phone className="mr-2 h-4 w-4" />
          Emergency Contacts
        </Button>
        <Button className="w-full justify-start" variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Health Report
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FallRiskWalkingManager({
  healthData,
}: FallRiskWalkingManagerProps) {
  const [fallRiskScore, setFallRiskScore] = useState(2.3);
  const [activeTab, setActiveTab] = useState('dashboard');

  // Mock dashboard stats - in real app, these would be calculated from health data
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    fallRiskLevel: 'moderate',
    fallRiskScore: 2.3,
    walkingSpeed: 1.25,
    walkingSteadiness: 78,
    balanceScore: 7.8,
    interventionsCompleted: 2,
    totalInterventions: 6,
    lastAssessment: new Date(),
    recentTrends: {
      riskTrend: 'stable',
      speedTrend: 'improving',
      steadinessTrend: 'stable',
    },
  });

  const [quickAlerts] = useState<QuickAlert[]>([
    {
      id: '1',
      type: 'intervention_due',
      severity: 'warning',
      title: 'Balance Exercise Due',
      message: 'Your daily balance training session is scheduled for today.',
      actionRequired: true,
      timestamp: new Date(),
    },
  ]);

  useEffect(() => {
    // Update stats based on health data
    if (healthData && healthData.metrics) {
      setDashboardStats((prev) => ({
        ...prev,
        walkingSteadiness:
          healthData.metrics.walkingSteadiness?.average ||
          prev.walkingSteadiness,
        lastAssessment: new Date(),
      }));
    }
  }, [healthData]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold">
            <Shield className="h-8 w-8" />
            Fall Risk & Walking Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive fall prevention and walking pattern analysis
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Users className="mr-2 h-4 w-4" />
            Share with Caregiver
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Critical Alerts */}
      {dashboardStats.fallRiskLevel === 'critical' && (
        <Alert className="border-l-4 border-red-500 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>Critical fall risk detected.</strong> Please contact your
            healthcare provider immediately and consider having someone assist
            with daily activities.
          </AlertDescription>
        </Alert>
      )}

      {/* Dashboard Overview */}
      <DashboardOverview stats={dashboardStats} />

      {/* Quick Status Row */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <QuickAlertsPanel alerts={quickAlerts} />
        </div>
        <div>
          <ActionPanel />
        </div>
      </div>

      {/* Main Content Tabs */}
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-9">
          <TabsTrigger value="dashboard">Overview</TabsTrigger>
          <TabsTrigger value="assessment">Assessment</TabsTrigger>
          <TabsTrigger value="walking">Walking</TabsTrigger>
          <TabsTrigger value="lidar">LiDAR</TabsTrigger>
          <TabsTrigger value="interventions">Interventions</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
          <TabsTrigger value="enhanced">AI Monitor</TabsTrigger>
          <TabsTrigger value="caregivers">Caregivers</TabsTrigger>
          <TabsTrigger value="monitor">Live</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <FallRiskWalkingDashboard healthData={healthData} />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-6">
          <FallRiskMonitor
            healthData={healthData}
            fallRiskScore={fallRiskScore}
            setFallRiskScore={setFallRiskScore}
          />
        </TabsContent>

        <TabsContent value="walking" className="space-y-6">
          <WalkingPatternMonitor />
        </TabsContent>

        <TabsContent value="lidar" className="space-y-6">
          <Tabs defaultValue="posture" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="posture">Posture Analysis</TabsTrigger>
              <TabsTrigger value="prediction">AI Prediction</TabsTrigger>
              <TabsTrigger value="environment">Environment</TabsTrigger>
              <TabsTrigger value="training">Training Assistant</TabsTrigger>
            </TabsList>

            <TabsContent value="posture">
              {/* <LiDARPostureAnalyzer /> */}
              <div className="text-muted-foreground p-4 text-center">
                LiDAR Posture Analysis feature coming soon
              </div>
            </TabsContent>

            <TabsContent value="prediction">
              <LiDARFallPredictionEngine />
            </TabsContent>

            <TabsContent value="environment">
              <LiDAREnvironmentalHazardDetector />
            </TabsContent>

            <TabsContent value="training">
              <LiDARTrainingAssistant />
            </TabsContent>
          </Tabs>
        </TabsContent>

        <TabsContent value="interventions" className="space-y-6">
          <FallRiskInterventions />
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <FallHistory />
        </TabsContent>

        <TabsContent value="enhanced" className="space-y-6">
          <EnhancedFallRiskMonitor />
        </TabsContent>

        <TabsContent value="caregivers" className="space-y-6">
          <AdvancedCaregiverAlerts />
        </TabsContent>

        <TabsContent value="monitor" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Real-time Monitoring
                </CardTitle>
                <CardDescription>
                  Live analysis of movement patterns and fall risk indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="py-8 text-center">
                  <Brain className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                  <p className="text-muted-foreground mb-4">
                    Real-time monitoring requires connection to health sensors
                  </p>
                  <Button>
                    <Activity className="mr-2 h-4 w-4" />
                    Connect Device
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Health Integration
                </CardTitle>
                <CardDescription>
                  Connect with healthcare providers and caregivers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Button className="w-full justify-start" variant="outline">
                    <Phone className="mr-2 h-4 w-4" />
                    Contact Healthcare Provider
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Users className="mr-2 h-4 w-4" />
                    Notify Emergency Contact
                  </Button>
                  <Button className="w-full justify-start" variant="outline">
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule Assessment
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
