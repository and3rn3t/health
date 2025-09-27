/**
 * LiDAR Integration Manager Component
 * Central hub for all LiDAR features and functionalities
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
import { useKV } from '@github/spark/hooks';
import { useCallback, useEffect, useState } from 'react';
import { LiDARCognitiveAnalyzer } from './LiDARCognitiveAnalyzer';
import { LiDAREnhancedVisualizations } from './LiDAREnhancedVisualizations';
import { LiDAREnvironmentalHazardDetector } from './LiDAREnvironmentalHazardDetector';
import { LiDARFallPredictionEngine } from './LiDARFallPredictionEngine';
import { LiDARGaitAnalyzer } from './LiDARGaitAnalyzerClean';
import { LiDARPostureAnalyzer } from './LiDARPostureAnalyzer';
import { LiDARSocialInteractionAnalyzer } from './LiDARSocialInteractionAnalyzer';
import { LiDARTrainingAssistant } from './LiDARTrainingAssistant';

// Type aliases for better code organization
type AccuracyLevel = 'high' | 'medium' | 'low';
type SystemStatus = 'operational' | 'degraded' | 'unavailable';
type BatteryImpact = 'low' | 'medium' | 'high';
type AnalysisFrequency = 'continuous' | 'onDemand' | 'scheduled';
type DataRetention = 'minimal' | 'standard' | 'extended';
type PrivacyLevel = 'high' | 'medium' | 'low';
type NotificationType = 'info' | 'success' | 'warning' | 'error';

// LiDAR Integration Types
interface LiDARCapabilities {
  available: boolean;
  version: string;
  accuracy: AccuracyLevel;
  maxRange: number; // meters
  pointCloudSupport: boolean;
  depthMappingSupport: boolean;
}

interface LiDARSystemHealth {
  status: SystemStatus;
  lastCalibration: Date | null;
  temperature: number;
  batteryImpact: BatteryImpact;
  performanceScore: number; // 0-100
}

interface LiDARUserPreferences {
  enabledFeatures: {
    gaitAnalysis: boolean;
    postureAnalysis: boolean;
    environmentalHazards: boolean;
    fallPrediction: boolean;
    trainingAssistant: boolean;
    cognitiveAnalysis: boolean;
    socialInteraction: boolean;
    enhancedVisualizations: boolean;
  };
  analysisFrequency: AnalysisFrequency;
  dataRetention: DataRetention;
  privacyLevel: PrivacyLevel;
  shareWithCaregivers: boolean;
}

interface LiDARSystemStats {
  totalSessions: number;
  totalAnalysisTime: number; // minutes
  averageAccuracy: number;
  featuresUsed: Record<string, number>;
  improvementMetrics: {
    postureImprovement: number;
    balanceImprovement: number;
    gaitStability: number;
    fallRiskReduction: number;
  };
}

interface LiDARIntegrationManagerProps {
  readonly onSystemStatusChange?: (status: LiDARSystemHealth) => void;
  readonly defaultActiveFeature?: string;
  readonly enableAdvancedFeatures?: boolean;
  readonly debugMode?: boolean;
}

export function LiDARIntegrationManager({
  onSystemStatusChange,
  defaultActiveFeature = 'overview',
  enableAdvancedFeatures: _enableAdvancedFeatures = true,
  debugMode = false,
}: LiDARIntegrationManagerProps) {
  // State management
  const [activeFeature, setActiveFeature] = useState(defaultActiveFeature);
  const [lidarCapabilities, setLidarCapabilities] =
    useState<LiDARCapabilities | null>(null);
  const [systemHealth, setSystemHealth] = useState<LiDARSystemHealth | null>(
    null
  );
  const [userPreferences] = useKV<LiDARUserPreferences>('lidar-preferences', {
    enabledFeatures: {
      gaitAnalysis: true,
      postureAnalysis: true,
      environmentalHazards: true,
      fallPrediction: true,
      trainingAssistant: true,
      cognitiveAnalysis: true,
      socialInteraction: true,
      enhancedVisualizations: true,
    },
    analysisFrequency: 'onDemand',
    dataRetention: 'standard',
    privacyLevel: 'medium',
    shareWithCaregivers: false,
  });
  const [systemStats, setSystemStats] = useKV<LiDARSystemStats>('lidar-stats', {
    totalSessions: 0,
    totalAnalysisTime: 0,
    averageAccuracy: 0,
    featuresUsed: {},
    improvementMetrics: {
      postureImprovement: 0,
      balanceImprovement: 0,
      gaitStability: 0,
      fallRiskReduction: 0,
    },
  });
  const [notification, setNotification] = useState<{
    message: string;
    type: NotificationType;
  } | null>(null);

  // LiDAR system detection and initialization
  const initializeLiDARSystem = useCallback(async () => {
    try {
      // Simulate LiDAR capability detection
      const hasLiDAR =
        navigator.userAgent.includes('iPhone') ||
        navigator.userAgent.includes('iPad') ||
        debugMode;

      if (hasLiDAR) {
        const capabilities: LiDARCapabilities = {
          available: true,
          version: '2.0',
          accuracy: 'high',
          maxRange: 5.0,
          pointCloudSupport: true,
          depthMappingSupport: true,
        };

        const health: LiDARSystemHealth = {
          status: 'operational',
          lastCalibration: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
          temperature: 32 + Math.random() * 10, // 32-42°C
          batteryImpact: 'medium',
          performanceScore: 85 + Math.random() * 15,
        };

        setLidarCapabilities(capabilities);
        setSystemHealth(health);
        onSystemStatusChange?.(health);

        setNotification({
          message: 'LiDAR system initialized successfully',
          type: 'success',
        });
      } else {
        setLidarCapabilities({
          available: false,
          version: 'N/A',
          accuracy: 'low',
          maxRange: 0,
          pointCloudSupport: false,
          depthMappingSupport: false,
        });

        setSystemHealth({
          status: 'unavailable',
          lastCalibration: null,
          temperature: 0,
          batteryImpact: 'low',
          performanceScore: 0,
        });

        setNotification({
          message: 'LiDAR sensor not available on this device',
          type: 'warning',
        });
      }
    } catch (error) {
      console.error('LiDAR initialization error:', error);
      setNotification({
        message: 'Failed to initialize LiDAR system',
        type: 'error',
      });
    }
  }, [debugMode, onSystemStatusChange]);

  // Initialize system on mount
  useEffect(() => {
    initializeLiDARSystem();
  }, [initializeLiDARSystem]);

  // Clear notifications after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Update system stats when features are used
  const updateStats = useCallback(
    (feature: string, sessionDuration = 0) => {
      setSystemStats((prev) => {
        if (!prev) {
          return {
            totalSessions: 1,
            totalAnalysisTime: sessionDuration,
            averageAccuracy: 0,
            featuresUsed: { [feature]: 1 },
            improvementMetrics: {
              postureImprovement: 0,
              balanceImprovement: 0,
              gaitStability: 0,
              fallRiskReduction: 0,
            },
          };
        }
        return {
          ...prev,
          totalSessions: prev.totalSessions + 1,
          totalAnalysisTime: prev.totalAnalysisTime + sessionDuration,
          featuresUsed: {
            ...prev.featuresUsed,
            [feature]: (prev.featuresUsed[feature] || 0) + 1,
          },
        };
      });
    },
    [setSystemStats]
  );

  // Performance monitoring
  const performanceLevel = systemHealth?.performanceScore || 0;
  const getPerformanceColor = () => {
    if (performanceLevel >= 80) return 'bg-green-500';
    if (performanceLevel >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getSystemStatusBadge = () => {
    if (!systemHealth)
      return <Badge variant="secondary">Initializing...</Badge>;

    switch (systemHealth.status) {
      case 'operational':
        return <Badge variant="default">Operational</Badge>;
      case 'degraded':
        return <Badge variant="outline">Degraded</Badge>;
      case 'unavailable':
        return <Badge variant="secondary">Unavailable</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <Alert
          className={(() => {
            if (notification.type === 'error') return 'border-red-500';
            if (notification.type === 'warning') return 'border-yellow-500';
            if (notification.type === 'success') return 'border-green-500';
            return 'border-blue-500';
          })()}
        >
          <AlertDescription>{notification.message}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="gap-3 text-foreground flex items-center text-3xl font-bold">
            <span className="text-2xl">🎯</span> LiDAR Health Suite
          </h1>
          <p className="text-muted-foreground mt-1">
            Advanced health monitoring using LiDAR sensing technology
          </p>
        </div>
        <div className="gap-3 flex items-center">
          {getSystemStatusBadge()}
          {systemHealth?.status === 'operational' && (
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${getPerformanceColor()}`}
              />
              <span className="text-muted-foreground text-sm">
                {performanceLevel}% Performance
              </span>
            </div>
          )}
        </div>
      </div>

      {/* System Status Overview */}
      {lidarCapabilities && systemHealth && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>⚙️</span> System Status
            </CardTitle>
            <CardDescription>
              LiDAR system health and capabilities overview
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
              <div>
                <div className="text-muted-foreground text-sm font-medium">
                  Status
                </div>
                <div className="text-lg font-semibold capitalize">
                  {systemHealth.status}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm font-medium">
                  Accuracy
                </div>
                <div className="text-lg font-semibold capitalize">
                  {lidarCapabilities.accuracy}
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm font-medium">
                  Range
                </div>
                <div className="text-lg font-semibold">
                  {lidarCapabilities.maxRange}m
                </div>
              </div>
              <div>
                <div className="text-muted-foreground text-sm font-medium">
                  Performance
                </div>
                <div className="flex items-center gap-2">
                  <Progress value={performanceLevel} className="flex-1" />
                  <span className="text-sm">{performanceLevel}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Feature Interface */}
      <Tabs
        value={activeFeature}
        onValueChange={setActiveFeature}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-9">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger
            value="gait"
            disabled={!userPreferences?.enabledFeatures.gaitAnalysis}
          >
            Gait
          </TabsTrigger>
          <TabsTrigger
            value="posture"
            disabled={!userPreferences?.enabledFeatures.postureAnalysis}
          >
            Posture
          </TabsTrigger>
          <TabsTrigger
            value="hazards"
            disabled={!userPreferences?.enabledFeatures.environmentalHazards}
          >
            Hazards
          </TabsTrigger>
          <TabsTrigger
            value="falls"
            disabled={!userPreferences?.enabledFeatures.fallPrediction}
          >
            Falls
          </TabsTrigger>
          <TabsTrigger
            value="training"
            disabled={!userPreferences?.enabledFeatures.trainingAssistant}
          >
            Training
          </TabsTrigger>
          <TabsTrigger
            value="cognitive"
            disabled={!userPreferences?.enabledFeatures.cognitiveAnalysis}
          >
            Cognitive
          </TabsTrigger>
          <TabsTrigger
            value="social"
            disabled={!userPreferences?.enabledFeatures.socialInteraction}
          >
            Social
          </TabsTrigger>
          <TabsTrigger
            value="visualizations"
            disabled={!userPreferences?.enabledFeatures.enhancedVisualizations}
          >
            3D Viz
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* System Statistics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Usage Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Total Sessions
                  </span>
                  <span className="font-semibold">
                    {systemStats?.totalSessions || 0}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Analysis Time
                  </span>
                  <span className="font-semibold">
                    {Math.round((systemStats?.totalAnalysisTime || 0) / 60)}h
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Avg. Accuracy
                  </span>
                  <span className="font-semibold">
                    {systemStats?.averageAccuracy || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveFeature('gait')}
                  disabled={!lidarCapabilities?.available}
                >
                  🚶 Start Gait Analysis
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveFeature('posture')}
                  disabled={!lidarCapabilities?.available}
                >
                  🧍 Check Posture
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => setActiveFeature('hazards')}
                  disabled={!lidarCapabilities?.available}
                >
                  ⚠️ Scan Environment
                </Button>
              </CardContent>
            </Card>

            {/* Improvement Metrics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Health Improvements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Posture</span>
                  <span className="text-green-600 font-semibold">
                    +{systemStats?.improvementMetrics.postureImprovement || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">Balance</span>
                  <span className="text-green-600 font-semibold">
                    +{systemStats?.improvementMetrics.balanceImprovement || 0}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground text-sm">
                    Fall Risk
                  </span>
                  <span className="text-green-600 font-semibold">
                    -{systemStats?.improvementMetrics.fallRiskReduction || 0}%
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="gait" className="space-y-4">
          <LiDARGaitAnalyzer
            onSessionComplete={(session) => {
              updateStats('gait', session.duration);
              setNotification({
                message: 'Gait analysis session completed successfully',
                type: 'success',
              });
            }}
          />
        </TabsContent>

        <TabsContent value="posture" className="space-y-4">
          <LiDARPostureAnalyzer
            onAnalysisComplete={(_analysis) => {
              updateStats('posture');
              setNotification({
                message: 'Posture analysis completed',
                type: 'success',
              });
            }}
          />
        </TabsContent>

        <TabsContent value="hazards" className="space-y-4">
          <LiDAREnvironmentalHazardDetector
            onHazardDetected={(hazard) => {
              setNotification({
                message: `Environmental hazard detected: ${hazard.type}`,
                type: 'warning',
              });
            }}
            onAssessmentComplete={(_assessment) => {
              updateStats('hazards');
              setNotification({
                message: 'Environmental assessment completed',
                type: 'success',
              });
            }}
          />
        </TabsContent>

        <TabsContent value="falls" className="space-y-4">
          <LiDARFallPredictionEngine
            onPredictionComplete={(prediction) => {
              updateStats('falls');
              setNotification({
                message: `Fall risk assessment: ${prediction.riskLevel} risk`,
                type: prediction.riskLevel === 'high' ? 'warning' : 'info',
              });
            }}
            realTimeAnalysis={true}
            alertThreshold={75}
            monitoringEnabled={true}
          />
        </TabsContent>

        <TabsContent value="training" className="space-y-4">
          <LiDARTrainingAssistant
            onSessionComplete={(results) => {
              updateStats('training', results.timeSpent);
              setNotification({
                message: `Training session completed with ${results.overallScore}% score`,
                type: 'success',
              });
            }}
          />
        </TabsContent>

        <TabsContent value="cognitive" className="space-y-4">
          <LiDARCognitiveAnalyzer />
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <LiDARSocialInteractionAnalyzer />
        </TabsContent>

        <TabsContent value="visualizations" className="space-y-4">
          <LiDAREnhancedVisualizations
            onVisualizationChange={(_data) => {
              updateStats('visualizations');
              setNotification({
                message: '3D visualization session completed',
                type: 'success',
              });
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
