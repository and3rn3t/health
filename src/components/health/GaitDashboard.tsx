/**
 * Advanced Gait Dashboard Component
 * Comprehensive gait analysis combining LiDAR and movement pattern analysis
 */

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
import {
  Activity,
  Brain,
  CheckCircle,
  Clock,
  Eye,
  Heart,
  Play,
  Target,
  Timer,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LiDARGaitAnalyzer } from './LiDARGaitAnalyzer';
import { WalkingPatternVisualizer } from './WalkingPatternVisualizer';

interface GaitAnalysisSession {
  id: string;
  type: 'lidar' | 'pattern' | 'combined';
  startTime: Date;
  endTime?: Date;
  status: 'idle' | 'recording' | 'analyzing' | 'completed' | 'error';
  data?: Record<string, unknown>;
  insights: string[];
  recommendations: readonly string[];
  riskScore: number;
}

type DashboardView = 'analysis' | 'history' | 'insights' | 'settings';
type AnalysisMode = 'lidar' | 'pattern' | 'combined';

interface GaitDashboardProps {
  readonly enableLiDAR?: boolean;
  readonly enablePatternAnalysis?: boolean;
  readonly autoSave?: boolean;
}

export function GaitDashboard({
  enableLiDAR = true,
  enablePatternAnalysis = true,
  autoSave = true,
}: GaitDashboardProps) {
  const [activeSession, setActiveSession] =
    useState<GaitAnalysisSession | null>(null);
  const [sessionHistory, setSessionHistory] = useState<GaitAnalysisSession[]>(
    []
  );
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>('combined');
  const [isRecording, setIsRecording] = useState(false);
  const [dashboardView, setDashboardView] = useState<DashboardView>('analysis');

  const showToast = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    console.log(`[${type.toUpperCase()}] ${message}`);
    // In a real app, this would show a toast notification
  };

  const startGaitAnalysis = useCallback(async (mode: AnalysisMode) => {
    const sessionId = `gait_${Date.now()}`;
    const newSession: GaitAnalysisSession = {
      id: sessionId,
      type: mode,
      startTime: new Date(),
      status: 'recording',
      insights: [],
      recommendations: [],
      riskScore: 0,
    };

    setActiveSession(newSession);
    setIsRecording(true);
    setAnalysisMode(mode);

    showToast(`Starting ${mode} gait analysis...`);
  }, []);

  const stopGaitAnalysis = useCallback(async () => {
    if (activeSession && isRecording) {
      const completedSession: GaitAnalysisSession = {
        ...activeSession,
        endTime: new Date(),
        status: 'analyzing',
      };

      setActiveSession(completedSession);
      setIsRecording(false);

      // Simulate analysis processing
      setTimeout(() => {
        const finalSession: GaitAnalysisSession = {
          ...completedSession,
          status: 'completed',
          insights: generateInsights(completedSession.type),
          recommendations: generateRecommendations(completedSession.type),
          riskScore: Math.random() * 100,
        };

        setActiveSession(finalSession);
        setSessionHistory((prev) => [finalSession, ...prev]);

        if (autoSave) {
          saveSession(finalSession);
        }

        showToast('Gait analysis completed');
      }, 3000);
    }
  }, [activeSession, isRecording, autoSave]);

  const generateInsights = (type: string): string[] => {
    const baseInsights = [
      'Walking steadiness within normal range',
      'Consistent step rhythm detected',
      'Balanced left-right foot placement',
    ];

    switch (type) {
      case 'lidar':
        return [
          ...baseInsights,
          'High-precision spatial measurements captured',
          'Detailed kinematic chain analysis completed',
          'Environmental context factors recorded',
        ];
      case 'pattern':
        return [
          ...baseInsights,
          'Movement pattern classification performed',
          'Temporal gait parameters analyzed',
          'Walking pattern consistency evaluated',
        ];
      case 'combined':
        return [
          ...baseInsights,
          'Comprehensive multi-modal analysis completed',
          'Cross-validated measurements obtained',
          'Enhanced accuracy through sensor fusion',
        ];
      default:
        return baseInsights;
    }
  };

  const generateRecommendations = (type: string): readonly string[] => {
    const baseRecs = [
      'Maintain current activity level',
      'Continue regular walking routine',
      'Monitor for any pattern changes',
    ];

    switch (type) {
      case 'lidar':
        return [
          ...baseRecs,
          'Consider periodic LiDAR assessments',
          'Focus on spatial awareness exercises',
        ];
      case 'pattern':
        return [
          ...baseRecs,
          'Practice rhythm-based walking exercises',
          'Work on movement consistency',
        ];
      case 'combined':
        return [
          ...baseRecs,
          'Comprehensive gait training program recommended',
          'Regular multi-modal assessments beneficial',
        ];
      default:
        return baseRecs;
    }
  };

  const saveSession = async (session: GaitAnalysisSession) => {
    try {
      // Simulate saving to storage
      localStorage.setItem(
        `gait_session_${session.id}`,
        JSON.stringify(session)
      );
      showToast('Session data saved');
    } catch (error) {
      showToast('Failed to save session data', 'error');
      console.error('Save error:', error);
    }
  };

  const exportData = useCallback(async () => {
    try {
      const exportData = {
        sessions: sessionHistory,
        exportDate: new Date().toISOString(),
        metadata: {
          totalSessions: sessionHistory.length,
          analysisTypes: [...new Set(sessionHistory.map((s) => s.type))],
        },
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gait_analysis_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast('Data exported successfully');
    } catch (error) {
      showToast('Failed to export data', 'error');
      console.error('Export error:', error);
    }
  }, [sessionHistory]);

  const getRiskColor = (score: number) => {
    if (score < 25) return 'text-green-600 bg-green-50 border-green-200';
    if (score < 50) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score < 75) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getRiskLevel = (score: number) => {
    if (score < 25) return 'Low';
    if (score < 50) return 'Moderate';
    if (score < 75) return 'High';
    return 'Critical';
  };

  // Load saved sessions on component mount
  useEffect(() => {
    const loadSavedSessions = () => {
      try {
        const keys = Object.keys(localStorage).filter((key) =>
          key.startsWith('gait_session_')
        );
        const sessions = keys
          .map((key) => {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
          })
          .filter(Boolean);

        setSessionHistory(
          sessions.sort(
            (a, b) =>
              new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
          )
        );
      } catch (error) {
        console.error('Failed to load saved sessions:', error);
      }
    };

    loadSavedSessions();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-bold text-foreground">
            <Activity className="text-primary h-8 w-8" />
            Advanced Gait Analysis
          </h1>
          <p className="text-muted-foreground">
            Comprehensive walking pattern analysis using LiDAR and AI-powered
            insights
          </p>
        </div>
        <div className="flex items-center gap-2">
          {activeSession && (
            <Badge
              variant="outline"
              className={
                activeSession.status === 'recording'
                  ? 'bg-blue-50 text-blue-700'
                  : activeSession.status === 'analyzing'
                    ? 'bg-yellow-50 text-yellow-700'
                    : activeSession.status === 'completed'
                      ? 'bg-green-50 text-green-700'
                      : 'bg-gray-50 text-gray-700'
              }
            >
              {activeSession.status === 'recording' && (
                <div className="mr-2 h-2 w-2 animate-pulse rounded-full bg-blue-500" />
              )}
              {activeSession.status}
            </Badge>
          )}
          <Button onClick={exportData} variant="outline" size="sm">
            Export Data
          </Button>
        </div>
      </div>

      {/* Quick Action Panel */}
      {!isRecording && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Start Analysis Session
            </CardTitle>
            <CardDescription>
              Choose an analysis mode to begin gait assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {enableLiDAR && (
                <Button
                  onClick={() => startGaitAnalysis('lidar')}
                  className="flex h-auto flex-col items-center gap-2 p-4"
                  variant="outline"
                >
                  <Target className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-semibold">LiDAR Analysis</div>
                    <div className="text-muted-foreground text-xs">
                      High-precision spatial measurements
                    </div>
                  </div>
                </Button>
              )}

              {enablePatternAnalysis && (
                <Button
                  onClick={() => startGaitAnalysis('pattern')}
                  className="flex h-auto flex-col items-center gap-2 p-4"
                  variant="outline"
                >
                  <Activity className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-semibold">Pattern Analysis</div>
                    <div className="text-muted-foreground text-xs">
                      Movement pattern recognition
                    </div>
                  </div>
                </Button>
              )}

              {enableLiDAR && enablePatternAnalysis && (
                <Button
                  onClick={() => startGaitAnalysis('combined')}
                  className="flex h-auto flex-col items-center gap-2 p-4"
                  variant="default"
                >
                  <Brain className="h-6 w-6" />
                  <div className="text-center">
                    <div className="font-semibold">Combined Analysis</div>
                    <div className="text-muted-foreground text-xs">
                      Multi-modal comprehensive assessment
                    </div>
                  </div>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Session Control */}
      {isRecording && activeSession && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Timer className="h-5 w-5 text-blue-500" />
              Recording{' '}
              {activeSession.type.charAt(0).toUpperCase() +
                activeSession.type.slice(1)}{' '}
              Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-muted-foreground text-sm">
                  Started: {activeSession.startTime.toLocaleTimeString()}
                </div>
                <Badge variant="secondary">{activeSession.type}</Badge>
              </div>
              <Button onClick={stopGaitAnalysis} variant="destructive">
                Stop Analysis
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Dashboard */}
      <Tabs
        value={dashboardView}
        onValueChange={(value: string) =>
          setDashboardView(value as DashboardView)
        }
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Live Analysis</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="history">Session History</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {analysisMode === 'lidar' || analysisMode === 'combined' ? (
            <LiDARGaitAnalyzer
              onSessionComplete={(session) => {
                console.log('LiDAR session completed:', session);
              }}
            />
          ) : null}

          {analysisMode === 'pattern' || analysisMode === 'combined' ? (
            <WalkingPatternVisualizer
              isLiveMode={isRecording}
              onPatternDetected={(pattern) => {
                console.log('Pattern detected:', pattern);
              }}
            />
          ) : null}

          {!isRecording && !activeSession && (
            <Card>
              <CardContent className="py-12 text-center">
                <Activity className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Active Analysis
                </h3>
                <p className="text-muted-foreground">
                  Start an analysis session to begin gait assessment
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {activeSession && activeSession.status === 'completed' ? (
            <>
              {/* Risk Assessment */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-5 w-5" />
                    Overall Risk Assessment
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4 text-center">
                    <div
                      className={`inline-flex items-center rounded-lg border px-4 py-3 ${getRiskColor(activeSession.riskScore)}`}
                    >
                      <span className="mr-3 text-3xl font-bold">
                        {Math.round(activeSession.riskScore)}
                      </span>
                      <div>
                        <div className="font-semibold">
                          {getRiskLevel(activeSession.riskScore)} Risk
                        </div>
                        <div className="text-sm opacity-90">
                          Fall Risk Score
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* AI Insights */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    AI-Generated Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSession.insights.map((insight, index) => (
                      <div
                        key={`insight-${index}`}
                        className="flex items-start gap-2"
                      >
                        <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-500" />
                        <span className="text-sm">{insight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Personalized Recommendations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {activeSession.recommendations.map((rec, index) => (
                      <div
                        key={`rec-${index}`}
                        className="flex items-start gap-2"
                      >
                        <Target className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Brain className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Insights Available
                </h3>
                <p className="text-muted-foreground">
                  Complete a gait analysis session to view AI-generated insights
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {sessionHistory.length > 0 ? (
            <div className="space-y-4">
              {sessionHistory.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {session.type === 'lidar' && (
                          <Target className="h-5 w-5" />
                        )}
                        {session.type === 'pattern' && (
                          <Activity className="h-5 w-5" />
                        )}
                        {session.type === 'combined' && (
                          <Brain className="h-5 w-5" />
                        )}
                        {session.type.charAt(0).toUpperCase() +
                          session.type.slice(1)}{' '}
                        Analysis
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {session.startTime.toLocaleDateString()}
                        </Badge>
                        <Badge className={getRiskColor(session.riskScore)}>
                          {getRiskLevel(session.riskScore)} Risk
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Duration
                        </div>
                        <div className="font-semibold">
                          {session.endTime
                            ? Math.round(
                                (new Date(session.endTime).getTime() -
                                  new Date(session.startTime).getTime()) /
                                  1000
                              ) + 's'
                            : 'In Progress'}
                        </div>
                      </div>
                      <div>
                        <div className="text-muted-foreground text-sm">
                          Risk Score
                        </div>
                        <div className="font-semibold">
                          {Math.round(session.riskScore)}/100
                        </div>
                      </div>
                    </div>
                    {session.insights.length > 0 && (
                      <div className="mt-4">
                        <div className="text-muted-foreground mb-2 text-sm">
                          Key Insight
                        </div>
                        <div className="text-sm">{session.insights[0]}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <Clock className="mx-auto mb-4 h-12 w-12 text-gray-400" />
                <h3 className="mb-2 text-lg font-semibold">
                  No Session History
                </h3>
                <p className="text-muted-foreground">
                  Completed analysis sessions will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Analysis Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium">Available Analysis Types</h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={enableLiDAR} readOnly />
                    <span className="text-sm">LiDAR Analysis</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={enablePatternAnalysis}
                      readOnly
                    />
                    <span className="text-sm">Pattern Analysis</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" checked={autoSave} readOnly />
                    <span className="text-sm">Auto-save Sessions</span>
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Data Management</h4>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={exportData}>
                    Export All Data
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const keys = Object.keys(localStorage).filter((key) =>
                        key.startsWith('gait_session_')
                      );
                      keys.forEach((key) => localStorage.removeItem(key));
                      setSessionHistory([]);
                      showToast('All session data cleared');
                    }}
                  >
                    Clear All Sessions
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>System Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-muted-foreground">Total Sessions</div>
                  <div className="font-semibold">{sessionHistory.length}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">LiDAR Available</div>
                  <div className="font-semibold">
                    {enableLiDAR ? 'Yes' : 'No'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Pattern Analysis</div>
                  <div className="font-semibold">
                    {enablePatternAnalysis ? 'Enabled' : 'Disabled'}
                  </div>
                </div>
                <div>
                  <div className="text-muted-foreground">Auto-save</div>
                  <div className="font-semibold">{autoSave ? 'On' : 'Off'}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
