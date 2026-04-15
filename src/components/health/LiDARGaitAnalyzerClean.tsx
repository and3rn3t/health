/**
 * LiDAR Gait Analyzer Component — Orchestrator
 *
 * State & logic extracted to useLiDARSession hook.
 * Sub-components in lidar/LiDARControls, LiDAROverview, LiDARHistory.
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
import { useLiDARSession } from '@/hooks/useLiDARSession';

import { LiDARControls } from './lidar/LiDARControls';
import { LiDARHistory } from './lidar/LiDARHistory';
import { LiDAROverview } from './lidar/LiDAROverview';
import type { LiDARGaitAnalyzerProps } from './lidar/lidar-types';
import { type XRNavigator } from './lidar/lidar-types';

// Re-export for consumers (GaitDashboardClean)
export type { FusedRisk } from './lidar/lidar-types';

export function LiDARGaitAnalyzer({
  onSessionComplete,
  maxSessionDuration = 30,
}: LiDARGaitAnalyzerProps) {
  const {
    currentSession,
    sessionHistory,
    sessionHistoryRaw,
    setSessionHistory,
    recordingProgress,
    startSession,
    completeSession,
    preferences,
    setPreferences,
    selectedProtocol,
    setSelectedProtocol,
    selectedAnalysisType,
    setSelectedAnalysisType,
    calibrated,
    calibrate,
    lidarReady,
    webxrSupported,
    showNotification,
    showMessage,
    liveCadence,
    targetLabel,
    notes,
    setNotes,
    newTag,
    setNewTag,
    selectedTag,
    setSelectedTag,
    availableTags,
    saveNotes,
    addTag,
    removeTag,
  } = useLiDARSession({ onSessionComplete, maxSessionDuration });

  let badgeLabel = 'LiDAR Unavailable';
  if (lidarReady) {
    badgeLabel = preferences?.simulate ? 'Simulated' : 'LiDAR Ready';
  }

  if (!lidarReady && currentSession === null) {
    return (
      <Card className="text-center">
        <CardContent className="pt-6">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-xl text-gray-400">
            🎯
          </div>
          <h3 className="mb-2 text-lg font-semibold">LiDAR Not Available</h3>
          <p className="text-muted-foreground">
            LiDAR sensor is required for precise gait analysis. This feature is
            available on iPhone 12 Pro and newer devices.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calibration */}
      {!calibrated && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span aria-hidden="true" className="mr-1 select-none">
                🧭
              </span>
              <span>Calibration Required</span>
            </CardTitle>
            <CardDescription>
              Place your device at chest height, hold steady, and face forward
              to calibrate the LiDAR reference.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              Calibration ensures accurate step length, cadence, and balance
              measurements.
            </p>
            <Button onClick={calibrate}>
              Begin Calibration
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification */}
      {showNotification && (
        <Alert
          className={
            showNotification.type === 'error'
              ? 'border-red-500'
              : 'border-green-500'
          }
        >
          <AlertDescription>{showNotification.message}</AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <span
              aria-hidden="true"
              className="mr-1 select-none text-xl text-primary"
            >
              🎯
            </span>
            <span>LiDAR Gait Analyzer</span>
          </h2>
          <p className="text-muted-foreground">
            High-precision movement analysis using LiDAR technology
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={lidarReady ? 'default' : 'secondary'}>
            {badgeLabel}
          </Badge>
          {webxrSupported && (
            <Button
              size="sm"
              variant="outline"
              onClick={async () => {
                try {
                  const nav = navigator as XRNavigator;
                  const supported =
                    (await nav?.xr?.isSessionSupported?.('immersive-ar')) ??
                    false;
                  if (!supported) {
                    showMessage(
                      'WebXR AR not supported on this device',
                      'error'
                    );
                    return;
                  }
                  if (nav.xr?.requestSession) {
                    await nav.xr
                      .requestSession('immersive-ar', {
                        requiredFeatures: ['hit-test'],
                      })
                      .catch(() => undefined);
                  }
                  showMessage('WebXR session starting (beta)');
                } catch (e) {
                  console.error('WebXR error', e);
                  showMessage('Failed to start WebXR AR session', 'error');
                }
              }}
            >
              Try WebXR (beta)
            </Button>
          )}
        </div>
      </div>
      {preferences?.simulate && (
        <Alert className="border-yellow-500">
          <AlertDescription>
            Simulation mode enabled. Metrics are generated for demo purposes.
          </AlertDescription>
        </Alert>
      )}

      {/* Analysis Controls */}
      <LiDARControls
        preferences={preferences}
        setPreferences={(next) => setPreferences(next)}
        selectedProtocol={selectedProtocol}
        setSelectedProtocol={setSelectedProtocol}
        selectedAnalysisType={selectedAnalysisType}
        setSelectedAnalysisType={setSelectedAnalysisType}
        lidarReady={lidarReady}
        currentSession={currentSession}
        recordingProgress={recordingProgress}
        liveCadence={liveCadence}
        targetLabel={targetLabel}
        startSession={startSession}
        completeSession={completeSession}
      />

      {/* Current Session Results */}
      {currentSession &&
        currentSession.status === 'completed' &&
        currentSession.metrics && (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="metrics">Detailed Metrics</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <LiDAROverview
                currentSession={currentSession}
                sessionHistory={sessionHistory}
                showMessage={showMessage}
              />
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      📏 Spatial Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Step Width:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.stepWidth} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Step Length:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.stepLength} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stride Length:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.strideLength} cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Foot Clearance:</span>
                      <span className="font-mono">
                        {currentSession.metrics.spatialMetrics.footClearance} cm
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      ⏱️ Temporal Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Cadence:</span>
                      <span className="font-mono">
                        {currentSession.metrics.temporalMetrics.cadence}{' '}
                        steps/min
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Swing Time:</span>
                      <span className="font-mono">
                        {currentSession.metrics.temporalMetrics.swingTime}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stance Time:</span>
                      <span className="font-mono">
                        {currentSession.metrics.temporalMetrics.stanceTime}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Double Support:</span>
                      <span className="font-mono">
                        {
                          currentSession.metrics.temporalMetrics
                            .doubleSupportTime
                        }
                        %
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      ⚖️ Stability Metrics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span>Lateral Variability:</span>
                      <span className="font-mono">
                        {
                          currentSession.metrics.stabilityMetrics
                            .lateralVariability
                        }{' '}
                        cm
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Posture Stability:</span>
                      <span className="font-mono">
                        {
                          currentSession.metrics.stabilityMetrics
                            .postureStability
                        }
                        %
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Balance Score:</span>
                      <span className="font-mono">
                        {currentSession.metrics.stabilityMetrics.balanceScore}%
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🌎 Environment Risk
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {currentSession.environmentRisk ? (
                      <>
                        <div className="flex justify-between">
                          <span>Risk Level:</span>
                          <span className="font-mono">
                            {currentSession.environmentRisk.riskLevel}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Probability:</span>
                          <span className="font-mono">
                            {Math.round(
                              currentSession.environmentRisk.probability * 100
                            )}
                            %
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Slope:</span>
                          <span className="font-mono">
                            {currentSession.environmentRisk.surface.slopeDeg.toFixed(
                              1
                            )}
                            °
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Roughness:</span>
                          <span className="font-mono">
                            {currentSession.environmentRisk.surface.roughness.toFixed(
                              3
                            )}{' '}
                            m
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Obstacles:</span>
                          <span className="font-mono">
                            {currentSession.environmentRisk.surface.obstacleDensity.toFixed(
                              2
                            )}{' '}
                            /m²
                          </span>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No environment risk computed.
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <span aria-hidden="true" className="mr-1 select-none">
                      🎯
                    </span>
                    <span>Personalized Recommendations</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {currentSession.recommendations.map((rec, index) => (
                      <div
                        key={`rec-${rec.slice(0, 20)}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <span className="mt-0.5 text-green-500">✅</span>
                        <span className="text-sm">{rec}</span>
                      </div>
                    ))}
                    {/* Notes */}
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Session Notes</p>
                      <textarea
                        className="w-full rounded border bg-background p-2 text-sm"
                        rows={3}
                        placeholder="Add any observations or context..."
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                      />
                      <div className="flex justify-end">
                        <Button size="sm" variant="outline" onClick={saveNotes}>
                          Save Notes
                        </Button>
                      </div>
                    </div>
                    {/* Tags */}
                    <div className="mt-4 space-y-2">
                      <p className="text-sm font-medium">Tags</p>
                      <div className="flex flex-wrap gap-2">
                        {(currentSession?.tags ?? []).map((t) => (
                          <span
                            key={t}
                            className="rounded bg-muted px-2 py-1 text-xs"
                          >
                            {t}
                            <button
                              className="ml-2 text-muted-foreground hover:text-foreground"
                              onClick={() => removeTag(t)}
                              aria-label={`Remove tag ${t}`}
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          className="flex-1 rounded border bg-background px-2 py-1 text-sm"
                          placeholder="Add a tag (e.g., morning, outdoor)"
                        />
                        <Button
                          size="sm"
                          onClick={addTag}
                        >
                          Add Tag
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

      {/* Session History */}
      {sessionHistory.length > 0 && (
        <LiDARHistory
          sessionHistory={sessionHistory}
          sessionHistoryRaw={sessionHistoryRaw}
          setSessionHistory={setSessionHistory}
          availableTags={availableTags}
          selectedTag={selectedTag}
          setSelectedTag={setSelectedTag}
          showMessage={showMessage}
        />
      )}
    </div>
  );
}
