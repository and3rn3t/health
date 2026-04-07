/**
 * LiDAR Gait Analyzer Component — Orchestrator
 *
 * Sub-components and shared logic extracted to:
 *   lidar/lidar-types.ts  — types, schemas, pure helpers
 *   lidar/LiDARControls.tsx
 *   lidar/LiDAROverview.tsx
 *   lidar/LiDARHistory.tsx
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
import { useKV } from '@/hooks/useCloudflareKV';
import {
  assessEnvironmentRisk,
  summarizeSurface,
} from '@/lib/lidar/processing';
import type { Point3D, PointCloud } from '@/lib/lidar/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { LiDARControls } from './lidar/LiDARControls';
import { LiDARHistory } from './lidar/LiDARHistory';
import { LiDAROverview } from './lidar/LiDAROverview';
import type {
  LiDARGaitAnalyzerProps,
  LiDARGaitMetrics,
  LiDARPreferences,
  LiDARSession,
  RiskLevel,
} from './lidar/lidar-types';
import {
  calcEffectiveDurationSec,
  computeQuality,
  detectWebxrSupport,
  formatTargetLabel,
  fuseRisks,
  lidarSessionSchema,
  type XRNavigator,
} from './lidar/lidar-types';

// Re-export for consumers (GaitDashboardClean)
export type { FusedRisk } from './lidar/lidar-types';

export function LiDARGaitAnalyzer({
  onSessionComplete,
  maxSessionDuration: _maxSessionDuration = 30,
}: LiDARGaitAnalyzerProps) {
  // NOSONAR
  const [currentSession, setCurrentSession] = useState<LiDARSession | null>(
    null
  );
  // Persist history in KV (dates normalized when read)
  const [sessionHistoryRaw = [], setSessionHistory] = useKV<LiDARSession[]>(
    'lidar-session-history',
    []
  );
  const sessionHistory = useMemo<LiDARSession[]>(() => {
    const parsed = sessionHistoryRaw
      .map((s) => {
        const r = lidarSessionSchema.safeParse(s);
        return r.success ? (r.data as LiDARSession) : null;
      })
      .filter((x): x is LiDARSession => x !== null);
    return parsed;
  }, [sessionHistoryRaw]);
  const [recordingProgress, setRecordingProgress] = useState(0);
  const [isLiDARAvailable, setIsLiDARAvailable] = useState(false);
  const [selectedAnalysisType, setSelectedAnalysisType] = useState<
    'quick' | 'comprehensive'
  >('quick');
  const [showNotification, setShowNotification] = useState<{
    message: string;
    type: 'success' | 'error';
  } | null>(null);
  const [calibrated, setCalibrated] = useState(false);
  const [notes, setNotes] = useState('');
  const [newTag, setNewTag] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [preferences, setPreferences] = useKV<LiDARPreferences>(
    'lidar-preferences',
    {
      environment: 'indoor',
      demoDurations: true,
      autoSave: true,
      simulate: false,
    }
  );
  const recordingIntervalRef = useRef<number | null>(null);
  const [liveCadence, setLiveCadence] = useState<number | null>(null);
  const liveCadenceBaseRef = useRef<number | null>(null);
  const [webxrSupported, setWebxrSupported] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<
    'none' | 'TUG' | '10MWT' | '6MWT'
  >('none');

  const updateSessionInHistory = useCallback(
    (updated: LiDARSession) => {
      setSessionHistory((prev) => {
        const arr = (prev ?? []).slice();
        const idx = arr.findIndex((s) => s.id === updated.id);
        if (idx >= 0) arr[idx] = updated;
        return arr;
      });
    },
    [setSessionHistory]
  );

  const availableTags = useMemo(() => {
    return Array.from(
      new Set(sessionHistory.flatMap((s) => s.tags ?? []))
    ).slice(0, 20);
  }, [sessionHistory]);

  const showMessage = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  const checkLiDARAvailability = useCallback(async () => {
    try {
      const hasLiDAR =
        navigator.userAgent.includes('iPhone') ||
        navigator.userAgent.includes('iPad');
      setIsLiDARAvailable(hasLiDAR);
      if (!hasLiDAR) {
        showMessage('LiDAR sensor not available on this device', 'error');
      }
    } catch (error) {
      console.error('Error checking LiDAR availability:', error);
      setIsLiDARAvailable(false);
    }
  }, []);

  useEffect(() => {
    checkLiDARAvailability();
  }, [checkLiDARAvailability]);

  useEffect(() => {
    let mounted = true;
    detectWebxrSupport((v) => {
      if (mounted) setWebxrSupported(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const generateRecommendations = useCallback(
    (metrics: LiDARGaitMetrics): readonly string[] => {
      const recommendations: string[] = [];
      if (metrics.spatialMetrics.stepLength < 60) {
        recommendations.push('Consider stride lengthening exercises');
      }
      if (metrics.spatialMetrics.footClearance < 3) {
        recommendations.push(
          'Practice high-stepping exercises to improve foot clearance'
        );
      }
      if (metrics.temporalMetrics.cadence < 100) {
        recommendations.push('Work on increasing walking cadence');
      }
      if (metrics.stabilityMetrics.balanceScore < 70) {
        recommendations.push('Consider balance training exercises');
      }
      if (recommendations.length === 0) {
        recommendations.push('Great gait patterns! Keep up the good work.');
      }
      return recommendations;
    },
    []
  );

  const generateMockMetrics = useCallback(
    (sessionId: string): LiDARGaitMetrics => {
      const baseMetrics = {
        // NOSONAR: Mock gait data - Math.random() acceptable throughout
        sessionId,
        spatialMetrics: {
          stepWidth: Math.round(8 + Math.random() * 4), // NOSONAR
          stepLength: Math.round(55 + Math.random() * 15), // NOSONAR
          strideLength: Math.round(110 + Math.random() * 30), // NOSONAR
          footClearance: Math.round(2 + Math.random() * 3), // NOSONAR
        },
        temporalMetrics: {
          cadence: Math.round(95 + Math.random() * 20), // NOSONAR
          swingTime: Math.round(35 + Math.random() * 10), // NOSONAR
          stanceTime: Math.round(55 + Math.random() * 10), // NOSONAR
          doubleSupportTime: Math.round(10 + Math.random() * 5), // NOSONAR
        },
        stabilityMetrics: {
          lateralVariability: Math.round(1 + Math.random() * 2), // NOSONAR
          postureStability: Math.round(75 + Math.random() * 20), // NOSONAR
          balanceScore: Math.round(70 + Math.random() * 25), // NOSONAR
        },
        recommendations: [] as readonly string[],
        analysisTimestamp: new Date(),
      };
      baseMetrics.recommendations = generateRecommendations(baseMetrics);
      return baseMetrics;
    },
    [generateRecommendations]
  );

  const getEffectiveDurationSec = useCallback(() => {
    return calcEffectiveDurationSec(
      selectedProtocol,
      preferences?.demoDurations,
      selectedAnalysisType
    );
  }, [preferences?.demoDurations, selectedAnalysisType, selectedProtocol]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // --- Synthetic environment and gait risk helpers ---
  function gaussianNoise(mean: number, std: number): number {
    const u1 = Math.random(); // NOSONAR: Box-Muller transform for simulation
    const u2 = Math.random(); // NOSONAR
    const r = Math.sqrt(-2.0 * Math.log(Math.max(1e-12, u1)));
    const theta = 2.0 * Math.PI * u2;
    return mean + std * r * Math.cos(theta);
  }

  const generateSyntheticPointCloud = useCallback(
    (env: 'indoor' | 'outdoor'): PointCloud => {
      const points: Point3D[] = [];
      const nx = 24;
      const ny = 24;
      const cell = 0.1;
      let slopeX: number;
      let slopeY: number;
      let rough: number;
      let obstacleRate: number;
      if (env === 'outdoor') {
        // NOSONAR: Synthetic environment generation
        slopeX = ((Math.random() * 6) / 180) * Math.PI; // NOSONAR
        slopeY = ((Math.random() * 4) / 180) * Math.PI; // NOSONAR
        rough = 0.008 + Math.random() * 0.007; // NOSONAR
        obstacleRate = 0.06 + Math.random() * 0.09; // NOSONAR
      } else {
        slopeX = ((Math.random() * 2) / 180) * Math.PI; // NOSONAR
        slopeY = ((Math.random() * 1) / 180) * Math.PI; // NOSONAR
        rough = 0.001 + Math.random() * 0.003; // NOSONAR
        obstacleRate = 0.01 + Math.random() * 0.03; // NOSONAR
      }
      const bumps = new Set<number>();
      const totalCells = nx * ny;
      const numBumps = Math.floor(totalCells * obstacleRate);
      while (bumps.size < numBumps)
        bumps.add(Math.floor(Math.random() * totalCells)); // NOSONAR
      for (let iy = 0; iy < ny; iy++) {
        for (let ix = 0; ix < nx; ix++) {
          const idx = iy * nx + ix;
          const x = (ix - nx / 2) * cell;
          const y = (iy - ny / 2) * cell;
          let z = Math.tan(slopeX) * x + Math.tan(slopeY) * y;
          z += gaussianNoise(0, rough);
          if (bumps.has(idx)) z += 0.02 + Math.random() * 0.04; // NOSONAR
          points.push({ x, y, z });
        }
      }
      return points;
    },
    []
  );

  const estimateGaitRisk = useCallback(
    (m: LiDARGaitMetrics): { probability: number; riskLevel: RiskLevel } => {
      const balance = m.stabilityMetrics.balanceScore;
      const lv = m.stabilityMetrics.lateralVariability;
      const cadence = m.temporalMetrics.cadence;
      const footClearance = m.spatialMetrics.footClearance;
      const wBalance = -0.04;
      const wLv = 0.25;
      const wCad = 0.03;
      const wFc = -0.15;
      const bias = -0.5;
      const score =
        bias +
        wBalance * (100 - balance) +
        wLv * lv +
        wCad * (Math.abs(cadence - 105) / 10) +
        wFc * Math.max(0, footClearance - 3);
      const p = 1 / (1 + Math.exp(-score));
      let level: RiskLevel = 'low';
      if (p >= 0.7) level = 'high';
      else if (p >= 0.4) level = 'moderate';
      return { probability: p, riskLevel: level };
    },
    []
  );

  const completeSession = useCallback(
    (sessionId: string) => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
        recordingIntervalRef.current = null;
      }
      const metrics = generateMockMetrics(sessionId);
      const env = preferences?.environment ?? 'indoor';
      const pc = generateSyntheticPointCloud(env);
      const surface = summarizeSurface(pc);
      const environmentRisk = assessEnvironmentRisk(surface);
      const gaitRisk = estimateGaitRisk(metrics);
      const fused = fuseRisks(gaitRisk, environmentRisk);
      const completedSession: LiDARSession = {
        ...currentSession!,
        endTime: new Date(),
        duration: getEffectiveDurationSec(),
        metrics,
        recommendations: metrics.recommendations,
        status: 'completed',
        environmentRisk,
        fusedRisk: fused,
        ...((): Partial<LiDARSession> => {
          const q = computeQuality(metrics, calibrated);
          return { qualityScore: q.score, qualityGrade: q.grade };
        })(),
      };

      setCurrentSession(completedSession);
      if (preferences?.autoSave !== false) {
        setSessionHistory((prev) =>
          [completedSession, ...(prev ?? [])].slice(0, 10)
        );
      }
      onSessionComplete?.(completedSession);
      showMessage('LiDAR gait analysis completed');
    },
    [
      currentSession,
      generateMockMetrics,
      getEffectiveDurationSec,
      onSessionComplete,
      calibrated,
      preferences?.autoSave,
      preferences?.environment,
      generateSyntheticPointCloud,
      estimateGaitRisk,
      setSessionHistory,
    ]
  );

  const startSession = () => {
    if (!isLiDARAvailable && !preferences?.simulate) {
      showMessage('LiDAR sensor required for gait analysis', 'error');
      return;
    }
    if (!calibrated) {
      showMessage('Please run calibration before starting analysis', 'error');
      return;
    }
    const sessionId = `session-${Date.now()}`;
    const newSession: LiDARSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      analysisType: selectedAnalysisType,
      recommendations: [],
      status: 'recording',
      environment: preferences?.environment,
      protocol: selectedProtocol === 'none' ? undefined : selectedProtocol,
    };
    setCurrentSession(newSession);
    setRecordingProgress(0);
    const base = Math.round(95 + Math.random() * 20); // NOSONAR: Demo simulation
    liveCadenceBaseRef.current = base;
    setLiveCadence(base);
    showMessage(
      `Starting ${selectedAnalysisType} analysis (${preferences?.demoDurations ? 'demo' : 'realistic'} duration)...`
    );
    const effectiveDurationSec = getEffectiveDurationSec();
    const interval = setInterval(() => {
      setRecordingProgress((prev) => {
        const newProgress = prev + 100 / effectiveDurationSec;
        if (newProgress >= 100) {
          clearInterval(interval);
          completeSession(sessionId);
          return 100;
        }
        return newProgress;
      });
      setLiveCadence((prev) => {
        const baseCad = liveCadenceBaseRef.current ?? 100;
        const jitter = Math.round((Math.random() - 0.5) * 6); // NOSONAR
        const candidate = (prev ?? baseCad) + jitter;
        return Math.min(140, Math.max(80, candidate));
      });
    }, 1000);
    recordingIntervalRef.current = interval as unknown as number;
  };

  const targetLabel = useMemo(
    () =>
      formatTargetLabel(
        selectedProtocol,
        preferences?.demoDurations,
        selectedAnalysisType
      ),
    [selectedAnalysisType, preferences?.demoDurations, selectedProtocol]
  );

  const lidarReady = isLiDARAvailable || preferences?.simulate === true;
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
            <Button
              onClick={() => {
                setCalibrated(true);
                showMessage('Calibration complete');
              }}
            >
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
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            if (!currentSession) return;
                            const updated: LiDARSession = {
                              ...currentSession,
                              notes,
                            };
                            setCurrentSession(updated);
                            updateSessionInHistory(updated);
                            showMessage('Notes saved');
                          }}
                        >
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
                              onClick={() => {
                                if (!currentSession) return;
                                const updated: LiDARSession = {
                                  ...currentSession,
                                  tags: (currentSession.tags ?? []).filter(
                                    (x) => x !== t
                                  ),
                                };
                                setCurrentSession(updated);
                                updateSessionInHistory(updated);
                              }}
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
                          onClick={() => {
                            const tag = newTag.trim();
                            if (!tag || !currentSession) return;
                            const updated: LiDARSession = {
                              ...currentSession,
                              tags: Array.from(
                                new Set([...(currentSession.tags ?? []), tag])
                              ),
                            };
                            setCurrentSession(updated);
                            updateSessionInHistory(updated);
                            setNewTag('');
                          }}
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
