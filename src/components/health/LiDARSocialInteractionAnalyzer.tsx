/**
 * LiDAR Social Interaction Analysis
 * Multi-person movement coordination and interaction assessment
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  BarChart3,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  History,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';

interface ParticipantProfile {
  id: string;
  name: string;
  role: 'primary' | 'family' | 'friend' | 'professional';
  relationship: string;
  isPresent: boolean;
  position: { x: number; y: number; z: number };
  movementPattern: 'active' | 'supportive' | 'observing' | 'assisting';
}

interface SocialInteractionMetrics {
  // Proximity and Distance
  averageDistance: number;
  proximityPatterns: Record<string, number>;
  spatialCoordination: number;

  // Movement Synchronization
  movementSynchrony: number;
  gaitAdaptation: number;
  speedMatching: number;

  // Interaction Quality
  attentionFocus: number;
  responsiveness: number;
  supportBehaviors: number;
  communicationCues: number;

  // Social Behaviors
  eyeContact: number;
  sharedAttention: number;
  gestureCoordination: number;
  verbalCommunication: number;

  // Safety and Support
  fallRiskMitigation: number;
  assistanceProvided: number;
  environmentalAwareness: number;
}

interface SocialAnalysisConfig {
  sessionType: string;
  duration: number; // in minutes
  environment: 'home' | 'clinic' | 'outdoor' | 'facility';
  enablePrivacyMode: boolean;
  enableRealTimeCoaching: boolean;
  analysisDepth: 'basic' | 'detailed' | 'comprehensive';
}

interface SocialAnalysisSession {
  id: string;
  timestamp: Date;
  duration: number;
  participants: ParticipantProfile[];
  sessionType: string;
  environment: string;
  overallInteractionScore: number;
  caregivingEffectiveness: number;
  socialConnectedness: number;
  safetySupport: number;
  metrics: SocialInteractionMetrics;
  insights: string[];
  recommendations: string[];
  confidence: number;
}

const SESSION_TYPES = [
  {
    id: 'family_interaction',
    name: 'Family Interaction',
    duration: 20,
    description: 'Assess family member engagement and support',
  },
  {
    id: 'group_activity',
    name: 'Group Activity',
    duration: 30,
    description: 'Analyze multi-person coordination and cooperation',
  },
  {
    id: 'therapy_session',
    name: 'Therapy Session',
    duration: 25,
    description: 'Monitor therapeutic interaction effectiveness',
  },
  {
    id: 'daily_living',
    name: 'Daily Living Support',
    duration: 10,
    description: 'Evaluate assistance with daily activities',
  },
];

interface LiDARSocialInteractionAnalyzerProps {
  onAnalysisComplete?: (session: SocialAnalysisSession) => void;
  className?: string;
}

export const LiDARSocialInteractionAnalyzer =
  React.memo<LiDARSocialInteractionAnalyzerProps>(
    ({ onAnalysisComplete: _onAnalysisComplete, className = '' }) => {
      // Configuration and State
      const [config, setConfig] = useState<SocialAnalysisConfig>({
        sessionType: 'family_interaction',
        duration: 20,
        environment: 'home',
        enablePrivacyMode: false,
        enableRealTimeCoaching: true,
        analysisDepth: 'detailed',
      });

      // Session State
      const [isActive, setIsActive] = useState(false);
      const [isCalibrating, setIsCalibrating] = useState(false);
      const [sessionProgress, setSessionProgress] = useState(0);
      const [timeRemaining, setTimeRemaining] = useState(0);
      const [currentSession, setCurrentSession] =
        useState<SocialAnalysisSession | null>(null);
      const [currentMetrics, setCurrentMetrics] =
        useState<SocialInteractionMetrics | null>(null);

      // Participant Management
      const [detectedParticipants, setDetectedParticipants] = useState<
        ParticipantProfile[]
      >([]);

      // History and Persistence
      const [sessionHistory, setSessionHistory] = useKV<
        SocialAnalysisSession[]
      >('lidar-social-interaction-history', []);

      // Derived State
      const selectedSessionType = useMemo(
        () =>
          SESSION_TYPES.find((type) => type.id === config.sessionType) ||
          SESSION_TYPES[0],
        [config.sessionType]
      );

      // Analysis generation
      const generateSocialAnalysis = useCallback(
        async (
          sessionConfig: SocialAnalysisConfig,
          participants: ParticipantProfile[],
          metrics: SocialInteractionMetrics
        ): Promise<SocialAnalysisSession> => {
          const professionalParticipants = participants.filter(
            (p) => p.role === 'professional'
          );
          const socialParticipants = participants.filter(
            (p) => p.role === 'family' || p.role === 'friend'
          );

          // Calculate composite scores
          const caregivingEffectiveness = Math.round(
            (metrics.supportBehaviors * 0.3 +
              metrics.fallRiskMitigation * 0.25 +
              metrics.responsiveness * 0.25 +
              metrics.assistanceProvided * 0.2) *
              100
          );

          const socialConnectedness = Math.round(
            (metrics.eyeContact * 0.3 +
              metrics.sharedAttention * 0.25 +
              metrics.communicationCues * 0.25 +
              metrics.gestureCoordination * 0.2) *
              100
          );

          const safetySupport = Math.round(
            (metrics.fallRiskMitigation * 0.4 +
              metrics.environmentalAwareness * 0.3 +
              metrics.spatialCoordination * 0.3) *
              100
          );

          const overallInteractionScore = Math.round(
            caregivingEffectiveness * 0.3 +
              socialConnectedness * 0.25 +
              safetySupport * 0.25 +
              metrics.movementSynchrony * 100 * 0.2
          );

          // Generate insights
          const insights: string[] = [];
          const recommendations: string[] = [];

          if (metrics.movementSynchrony > 0.8) {
            insights.push(
              'Excellent movement coordination between participants'
            );
          } else if (metrics.movementSynchrony < 0.5) {
            insights.push('Limited movement synchronization observed');
            recommendations.push('Practice coordinated walking exercises');
          }

          if (professionalParticipants.length > 0 && metrics.supportBehaviors > 0.85) {
            insights.push('High-quality support behaviors demonstrated');
          } else if (professionalParticipants.length > 0 && metrics.supportBehaviors < 0.6) {
            insights.push('Opportunities for improved support');
            recommendations.push('Consider additional training programs');
          }

          if (socialParticipants.length > 0 && metrics.eyeContact < 0.4) {
            insights.push('Limited social engagement observed');
            recommendations.push('Encourage more face-to-face interaction');
          }

          if (metrics.fallRiskMitigation < 0.7) {
            insights.push('Fall risk mitigation could be improved');
            recommendations.push('Review safety protocols and positioning');
          }

          return {
            id: `social-session-${Date.now()}`,
            timestamp: new Date(),
            duration: sessionConfig.duration,
            participants,
            sessionType: sessionConfig.sessionType,
            environment: sessionConfig.environment,
            overallInteractionScore,
            caregivingEffectiveness,
            socialConnectedness,
            safetySupport,
            metrics,
            insights,
            recommendations,
            confidence: Math.min(
              0.95,
              0.75 + metrics.spatialCoordination * 0.2
            ),
          };
        },
        []
      );

      const completeSession = useCallback(async () => {
        if (!currentMetrics) return;

        setIsActive(false);

        // Generate comprehensive analysis
        const session = await generateSocialAnalysis(
          config,
          detectedParticipants,
          currentMetrics
        );
        setCurrentSession(session);

        // Save to history
        const updatedHistory = [...(sessionHistory || []), session];
        setSessionHistory(updatedHistory);

        console.log('Social interaction analysis completed:', session);
      }, [
        config,
        detectedParticipants,
        currentMetrics,
        sessionHistory,
        setSessionHistory,
        generateSocialAnalysis,
      ]);

      const stopSession = useCallback(() => {
        setIsActive(false);
        setSessionProgress(0);
        setTimeRemaining(0);
      }, []);

      // Participant detection and setup
      const scanForParticipants = useCallback(() => {
        setIsCalibrating(true);

        // Simulate LiDAR scanning process
        setTimeout(() => {
          const mockParticipants: ParticipantProfile[] = [
            {
              id: 'participant-1',
              name: 'Primary User',
              role: 'primary',
              relationship: 'self',
              isPresent: true,
              position: { x: 0, y: 0, z: 0 },
              movementPattern: 'active',
            },
            {
              id: 'participant-2',
              name: 'Family Member',
              role: 'family',
              relationship: 'spouse',
              isPresent: true,
              position: { x: 1.2, y: 0.1, z: 0 },
              movementPattern: 'supportive',
            },
            {
              id: 'participant-3',
              name: 'Family Member',
              role: 'family',
              relationship: 'child',
              isPresent: Math.random() > 0.3,
              position: { x: -0.8, y: 0.2, z: 0 },
              movementPattern: 'observing',
            },
          ];

          setDetectedParticipants(mockParticipants.filter((p) => p.isPresent));
          setIsCalibrating(false);
        }, 2000);
      }, []);

      // Social metrics simulation
      const updateSocialMetrics = useCallback(() => {
        if (!isActive || detectedParticipants.length < 2) return;

        const metrics: SocialInteractionMetrics = {
          averageDistance: Math.random() * 2 + 0.5,
          proximityPatterns: {
            'participant-1-participant-2': Math.random() * 2 + 0.8,
          },
          spatialCoordination: Math.random() * 0.4 + 0.6,
          movementSynchrony: Math.random() * 0.3 + 0.7,
          gaitAdaptation: Math.random() * 0.3 + 0.6,
          speedMatching: Math.random() * 0.4 + 0.5,
          attentionFocus: Math.random() * 0.3 + 0.7,
          responsiveness: Math.random() * 0.2 + 0.75,
          supportBehaviors: Math.random() * 0.3 + 0.6,
          communicationCues: Math.random() * 0.4 + 0.5,
          eyeContact: Math.random() * 0.5 + 0.4,
          sharedAttention: Math.random() * 0.3 + 0.6,
          gestureCoordination: Math.random() * 0.4 + 0.5,
          verbalCommunication: Math.random() * 0.3 + 0.6,
          fallRiskMitigation: Math.random() * 0.2 + 0.75,
          assistanceProvided: Math.random() * 0.4 + 0.5,
          environmentalAwareness: Math.random() * 0.3 + 0.6,
        };

        setCurrentMetrics(metrics);
      }, [isActive, detectedParticipants]);

      const startSession = useCallback(async () => {
        if (detectedParticipants.length < 2) {
          alert(
            'At least 2 participants required for social interaction analysis'
          );
          return;
        }

        setIsActive(true);
        setTimeRemaining(config.duration);
        setSessionProgress(0);
        setCurrentMetrics(null);
        setCurrentSession(null);

        console.log(
          `Starting social interaction analysis: ${selectedSessionType.name}`
        );

        // Start timer
        const startTime = Date.now();
        const timer = setInterval(() => {
          const elapsed = (Date.now() - startTime) / 1000;
          const remaining = Math.max(0, config.duration - elapsed);
          const progress = (elapsed / config.duration) * 100;

          setTimeRemaining(remaining);
          setSessionProgress(Math.min(progress, 100));

          if (remaining <= 0) {
            clearInterval(timer);
            completeSession();
          }

          // Simulate updating metrics
          if (!currentMetrics) {
            updateSocialMetrics();
          }
        }, 1000);
      }, [
        config,
        detectedParticipants,
        selectedSessionType.name,
        completeSession,
        currentMetrics,
        updateSocialMetrics,
      ]);

      // Configuration handlers
      const updateConfig = useCallback(
        (updates: Partial<SocialAnalysisConfig>) => {
          setConfig((prev) => ({ ...prev, ...updates }));
        },
        []
      );

      // Effects
      useEffect(() => {
        // Auto-scan for participants on mount
        const timer = setTimeout(() => {
          if (detectedParticipants.length === 0) {
            scanForParticipants();
          }
        }, 1000);

        return () => clearTimeout(timer);
      }, [detectedParticipants.length, scanForParticipants]);

      // Helper function to render participant content
      const renderParticipantContent = useCallback(() => {
        if (isCalibrating) {
          return (
            <div className="py-8 text-center">
              <Activity className="animate-spin text-blue-600 mx-auto mb-4 h-8 w-8" />
              <p className="text-muted-foreground">
                Scanning environment for participants...
              </p>
            </div>
          );
        }

        if (detectedParticipants.length > 0) {
          return (
            <div className="space-y-4">
              {detectedParticipants.map((participant) => (
                <Card key={participant.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <h4 className="font-semibold">{participant.name}</h4>
                          <Badge
                            variant={(() => {
                              if (participant.role === 'primary')
                                return 'default';
                              if (participant.role === 'professional')
                                return 'secondary';
                              return 'outline';
                            })()}
                          >
                            {participant.role}
                          </Badge>
                        </div>
                        <div className="text-muted-foreground text-sm">
                          <p>Relationship: {participant.relationship}</p>
                          <p>Movement Pattern: {participant.movementPattern}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={`w-3 h-3 rounded-full ${participant.isPresent ? 'bg-green-500' : 'bg-gray-300'}`}
                        />
                        <span className="text-xs text-muted-foreground">
                          {participant.isPresent ? 'Present' : 'Absent'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-center pt-4">
                <Button
                  onClick={startSession}
                  disabled={detectedParticipants.length < 2}
                  size="lg"
                >
                  <Users className="h-5 w-5 mr-2" />
                  Start Social Analysis
                </Button>
              </div>
            </div>
          );
        }

        return (
          <div className="py-8 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No participants detected</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Click "Scan for Participants" to detect people in the area
            </p>
          </div>
        );
      }, [isCalibrating, detectedParticipants, startSession]);

      // Helper function to render results content
      const renderResultsContent = useCallback(() => {
        if (currentSession) {
          return (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Session Results
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Scores */}
                <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-blue-600 text-2xl font-bold">
                        {currentSession.overallInteractionScore}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Overall Score
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-green-600 text-2xl font-bold">
                        {currentSession.caregivingEffectiveness}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Caregiving
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-purple-600 text-2xl font-bold">
                        {currentSession.socialConnectedness}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Social
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-orange-600 text-2xl font-bold">
                        {currentSession.safetySupport}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        Safety
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Insights */}
                {currentSession.insights.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Key Insights</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentSession.insights.map((insight) => (
                          <li
                            key={insight.slice(0, 20)}
                            className="flex items-start gap-2"
                          >
                            <CheckCircle className="text-blue-600 mt-0.5 h-4 w-4 flex-shrink-0" />
                            <span className="text-sm">{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Recommendations */}
                {currentSession.recommendations.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Recommendations</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {currentSession.recommendations.map(
                          (recommendation) => (
                            <li
                              key={recommendation.slice(0, 20)}
                              className="flex items-start gap-2"
                            >
                              <Target className="text-green-600 mt-0.5 h-4 w-4 flex-shrink-0" />
                              <span className="text-sm">{recommendation}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          );
        }

        if (sessionHistory && sessionHistory.length > 0) {
          const averageScores =
            sessionHistory.length > 0
              ? {
                  interaction:
                    sessionHistory.reduce(
                      (sum, s) => sum + s.overallInteractionScore,
                      0
                    ) / sessionHistory.length,
                  caregiving:
                    sessionHistory.reduce(
                      (sum, s) => sum + s.caregivingEffectiveness,
                      0
                    ) / sessionHistory.length,
                  social:
                    sessionHistory.reduce(
                      (sum, s) => sum + s.socialConnectedness,
                      0
                    ) / sessionHistory.length,
                  safety:
                    sessionHistory.reduce(
                      (sum, s) => sum + s.safetySupport,
                      0
                    ) / sessionHistory.length,
                }
              : null;

          return (
            <>
              {/* Historical Trends */}
              {averageScores && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="md:grid-cols-4 grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-blue-600 text-2xl font-bold">
                          {Math.round(averageScores.interaction)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Interaction
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-green-600 text-2xl font-bold">
                          {Math.round(averageScores.caregiving)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Caregiving
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-purple-600 text-2xl font-bold">
                          {Math.round(averageScores.social)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Social
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-orange-600 text-2xl font-bold">
                          {Math.round(averageScores.safety)}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          Avg Safety
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Session History */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" />
                    Session History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessionHistory.slice(0, 5).map((session) => (
                      <Card key={session.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="font-semibold">
                                {SESSION_TYPES.find(
                                  (t) => t.id === session.sessionType
                                )?.name || session.sessionType}
                              </div>
                              <div className="text-muted-foreground text-sm">
                                {session.timestamp.toLocaleDateString()} •{' '}
                                {session.participants.length} participants
                              </div>
                            </div>
                            <Badge variant="outline">
                              {session.environment}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-4 gap-4 text-center">
                            <div>
                              <div className="text-blue-600 font-semibold">
                                {session.overallInteractionScore}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Overall
                              </div>
                            </div>
                            <div>
                              <div className="text-green-600 font-semibold">
                                {session.caregivingEffectiveness}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Caregiving
                              </div>
                            </div>
                            <div>
                              <div className="text-purple-600 font-semibold">
                                {session.socialConnectedness}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Social
                              </div>
                            </div>
                            <div>
                              <div className="text-orange-600 font-semibold">
                                {session.safetySupport}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Safety
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          );
        }

        return (
          <Card>
            <CardContent className="p-8 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                No analysis results available
              </p>
              <p className="text-muted-foreground mt-1 text-sm">
                Complete a social interaction session to see results
              </p>
            </CardContent>
          </Card>
        );
      }, [currentSession, sessionHistory]);

      return (
        <div className={`mx-auto w-full max-w-6xl space-y-6 p-6 ${className}`}>
          {/* Header */}
          <Card>
            <CardHeader>
              <CardTitle className="gap-3 flex items-center">
                <Users className="text-blue-600 h-6 w-6" />
                LiDAR Social Interaction Analysis
              </CardTitle>
            </CardHeader>
          </Card>

          {/* Main Interface */}
          <Tabs defaultValue="setup" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="setup">Setup</TabsTrigger>
              <TabsTrigger value="analysis">Analysis</TabsTrigger>
              <TabsTrigger value="results">Results</TabsTrigger>
            </TabsList>

            {/* Setup Tab */}
            <TabsContent value="setup" className="space-y-6">
              {/* Session Configuration */}
              <Card>
                <CardHeader>
                  <CardTitle>Session Configuration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Session Type Selection */}
                  <div>
                    <div className="mb-3 text-sm font-medium">Session Type</div>
                    <div className="gap-3 md:grid-cols-2 grid grid-cols-1">
                      {SESSION_TYPES.map((type) => (
                        <Button
                          key={type.id}
                          variant={
                            config.sessionType === type.id
                              ? 'default'
                              : 'outline'
                          }
                          onClick={() =>
                            updateConfig({
                              sessionType: type.id,
                              duration: type.duration,
                            })
                          }
                          className="h-auto flex-col items-start p-4"
                        >
                          <div className="font-semibold">{type.name}</div>
                          <div className="text-muted-foreground text-xs mt-1">
                            {type.description}
                          </div>
                          <div className="text-muted-foreground text-xs mt-2">
                            Duration: {type.duration} minutes
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Environment and Options */}
                  <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
                    <div>
                      <div className="mb-2 text-sm font-medium">
                        Environment
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        {['home', 'clinic', 'outdoor', 'facility'].map(
                          (env) => (
                            <Button
                              key={env}
                              variant={
                                config.environment === env
                                  ? 'default'
                                  : 'outline'
                              }
                              size="sm"
                              onClick={() =>
                                updateConfig({
                                  environment:
                                    env as SocialAnalysisConfig['environment'],
                                })
                              }
                              className="capitalize"
                            >
                              {env}
                            </Button>
                          )
                        )}
                      </div>
                    </div>

                    <div>
                      <div className="mb-2 text-sm font-medium">Options</div>
                      <div className="space-y-2">
                        <Button
                          variant={
                            config.enablePrivacyMode ? 'default' : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            updateConfig({
                              enablePrivacyMode: !config.enablePrivacyMode,
                            })
                          }
                          className="w-full justify-start"
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Privacy Mode
                        </Button>
                        <Button
                          variant={
                            config.enableRealTimeCoaching
                              ? 'default'
                              : 'outline'
                          }
                          size="sm"
                          onClick={() =>
                            updateConfig({
                              enableRealTimeCoaching:
                                !config.enableRealTimeCoaching,
                            })
                          }
                          className="w-full justify-start"
                        >
                          <Heart className="mr-2 h-4 w-4" />
                          Real-time Coaching
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Participant Detection */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    Detected Participants
                    <Button
                      onClick={scanForParticipants}
                      disabled={isCalibrating}
                      size="sm"
                    >
                      {isCalibrating ? 'Scanning...' : 'Scan for Participants'}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>{renderParticipantContent()}</CardContent>
              </Card>
            </TabsContent>

            {/* Analysis Tab */}
            <TabsContent value="analysis" className="space-y-6">
              {isActive ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Active Session: {selectedSessionType.name}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Session Progress */}
                    <div>
                      <div className="mb-2 flex items-center justify-between">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-muted-foreground text-sm">
                          <Clock className="h-3 w-3 mr-1 inline" />
                          {Math.floor(timeRemaining / 60)}:
                          {String(Math.floor(timeRemaining % 60)).padStart(
                            2,
                            '0'
                          )}{' '}
                          remaining
                        </span>
                      </div>
                      <Progress value={sessionProgress} className="h-2" />
                    </div>

                    {/* Real-time Metrics */}
                    {currentMetrics && (
                      <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
                        <Card>
                          <CardContent className="p-4">
                            <div className="mb-2 text-center">
                              <div className="text-blue-600 text-2xl font-bold">
                                {Math.round(
                                  currentMetrics.movementSynchrony * 100
                                )}
                                %
                              </div>
                              <div className="text-muted-foreground text-sm">
                                Movement Sync
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-4">
                            <div className="mb-2 text-center">
                              <div className="text-green-600 text-2xl font-bold">
                                {Math.round(
                                  currentMetrics.supportBehaviors * 100
                                )}
                                %
                              </div>
                              <div className="text-muted-foreground text-sm">
                                Support Quality
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}

                    {/* Active Participants */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">
                          Active Participants
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {detectedParticipants.map((participant) => (
                            <div
                              key={participant.id}
                              className="flex items-center justify-between"
                            >
                              <div className="gap-3 flex items-center">
                                <div className="text-sm font-medium">
                                  {participant.name}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {participant.role}
                                </Badge>
                              </div>
                              <div
                                className={`w-3 h-3 rounded-full ${participant.isPresent ? 'bg-green-500' : 'bg-red-500'}`}
                              />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* Stop Button */}
                    <div className="flex justify-center">
                      <Button onClick={stopSession} variant="destructive">
                        Stop Session
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      Configure session and participants to start analysis
                    </p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            {/* Results Tab */}
            <TabsContent value="results" className="space-y-6">
              {renderResultsContent()}
            </TabsContent>
          </Tabs>
        </div>
      );
    }
  );

LiDARSocialInteractionAnalyzer.displayName = 'LiDARSocialInteractionAnalyzer';

export default LiDARSocialInteractionAnalyzer;
