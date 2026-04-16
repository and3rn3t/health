/**
 * useLiDARSession — consolidated state & logic for LiDAR gait analysis.
 *
 * Extracts 11+ useState calls, refs, effects, and session lifecycle
 * from LiDARGaitAnalyzerClean.tsx into a single composable hook.
 */

import { useKV } from '@/hooks/useLocalKV';
import {
  assessEnvironmentRisk,
  summarizeSurface,
} from '@/lib/lidar/processing';
import type { Point3D, PointCloud } from '@/lib/lidar/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import type {
  LiDARGaitMetrics,
  LiDARPreferences,
  LiDARSession,
  RiskLevel,
} from '@/components/health/lidar/lidar-types';
import {
  calcEffectiveDurationSec,
  computeQuality,
  detectWebxrSupport,
  formatTargetLabel,
  fuseRisks,
  lidarSessionSchema,
  type ProtocolType,
} from '@/components/health/lidar/lidar-types';

// ── Mock / simulation helpers (pure functions) ─────────────────────

function gaussianNoise(mean: number, std: number): number {
  const u1 = Math.random(); // NOSONAR: Box-Muller transform for simulation
  const u2 = Math.random(); // NOSONAR
  const r = Math.sqrt(-2.0 * Math.log(Math.max(1e-12, u1)));
  const theta = 2.0 * Math.PI * u2;
  return mean + std * r * Math.cos(theta);
}

function generateSyntheticPointCloud(env: 'indoor' | 'outdoor'): PointCloud {
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
}

function generateRecommendations(
  metrics: LiDARGaitMetrics
): readonly string[] {
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
}

function generateMockMetrics(sessionId: string): LiDARGaitMetrics {
  // NOSONAR: Mock gait data — Math.random() acceptable throughout
  const baseMetrics: LiDARGaitMetrics = {
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
    recommendations: [],
    analysisTimestamp: new Date(),
  };
  baseMetrics.recommendations = generateRecommendations(baseMetrics);
  return baseMetrics;
}

function estimateGaitRisk(
  m: LiDARGaitMetrics
): { probability: number; riskLevel: RiskLevel } {
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
}

// ── Hook ───────────────────────────────────────────────────────────

interface UseLiDARSessionOptions {
  onSessionComplete?: (session: LiDARSession) => void;
  maxSessionDuration?: number;
}

export function useLiDARSession({
  onSessionComplete,
}: UseLiDARSessionOptions = {}) {
  // ── Persisted state ──────────────────────────────────────────────
  const [sessionHistoryRaw = [], setSessionHistory] = useKV<LiDARSession[]>(
    'lidar-session-history',
    []
  );
  const [preferences, setPreferences] = useKV<LiDARPreferences>(
    'lidar-preferences',
    {
      environment: 'indoor',
      demoDurations: true,
      autoSave: true,
      simulate: false,
    }
  );

  // ── Local state ──────────────────────────────────────────────────
  const [currentSession, setCurrentSession] = useState<LiDARSession | null>(
    null
  );
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
  const [liveCadence, setLiveCadence] = useState<number | null>(null);
  const [webxrSupported, setWebxrSupported] = useState(false);
  const [selectedProtocol, setSelectedProtocol] = useState<ProtocolType>(
    'none'
  );

  // ── Refs ─────────────────────────────────────────────────────────
  const recordingIntervalRef = useRef<number | null>(null);
  const liveCadenceBaseRef = useRef<number | null>(null);

  // ── Derived state ────────────────────────────────────────────────
  const sessionHistory = useMemo<LiDARSession[]>(() => {
    return sessionHistoryRaw
      .map((s) => {
        const r = lidarSessionSchema.safeParse(s);
        return r.success ? (r.data as LiDARSession) : null;
      })
      .filter((x): x is LiDARSession => x !== null);
  }, [sessionHistoryRaw]);

  const availableTags = useMemo(() => {
    return Array.from(
      new Set(sessionHistory.flatMap((s) => s.tags ?? []))
    ).slice(0, 20);
  }, [sessionHistory]);

  const lidarReady = isLiDARAvailable || preferences?.simulate === true;

  const targetLabel = useMemo(
    () =>
      formatTargetLabel(
        selectedProtocol,
        preferences?.demoDurations,
        selectedAnalysisType
      ),
    [selectedAnalysisType, preferences?.demoDurations, selectedProtocol]
  );

  // ── Helpers ──────────────────────────────────────────────────────
  const showMessage = useCallback(
    (message: string, type: 'success' | 'error' = 'success') => {
      setShowNotification({ message, type });
      setTimeout(() => setShowNotification(null), 3000);
    },
    []
  );

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

  const getEffectiveDurationSec = useCallback(() => {
    return calcEffectiveDurationSec(
      selectedProtocol,
      preferences?.demoDurations,
      selectedAnalysisType
    );
  }, [preferences?.demoDurations, selectedAnalysisType, selectedProtocol]);

  // ── Session lifecycle ────────────────────────────────────────────
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
      getEffectiveDurationSec,
      onSessionComplete,
      calibrated,
      preferences?.autoSave,
      preferences?.environment,
      setSessionHistory,
      showMessage,
    ]
  );

  const startSession = useCallback(() => {
    if (!isLiDARAvailable && !preferences?.simulate) {
      showMessage('LiDAR sensor required for gait analysis', 'error');
      return;
    }
    if (!calibrated) {
      showMessage(
        'Please run calibration before starting analysis',
        'error'
      );
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
  }, [
    calibrated,
    completeSession,
    getEffectiveDurationSec,
    isLiDARAvailable,
    preferences?.demoDurations,
    preferences?.environment,
    preferences?.simulate,
    selectedAnalysisType,
    selectedProtocol,
    showMessage,
  ]);

  const calibrate = useCallback(() => {
    setCalibrated(true);
    showMessage('Calibration complete');
  }, [showMessage]);

  const saveNotes = useCallback(() => {
    if (!currentSession) return;
    const updated: LiDARSession = { ...currentSession, notes };
    setCurrentSession(updated);
    updateSessionInHistory(updated);
    showMessage('Notes saved');
  }, [currentSession, notes, showMessage, updateSessionInHistory]);

  const addTag = useCallback(() => {
    const tag = newTag.trim();
    if (!tag || !currentSession) return;
    const updated: LiDARSession = {
      ...currentSession,
      tags: Array.from(new Set([...(currentSession.tags ?? []), tag])),
    };
    setCurrentSession(updated);
    updateSessionInHistory(updated);
    setNewTag('');
  }, [currentSession, newTag, updateSessionInHistory]);

  const removeTag = useCallback(
    (tag: string) => {
      if (!currentSession) return;
      const updated: LiDARSession = {
        ...currentSession,
        tags: (currentSession.tags ?? []).filter((x) => x !== tag),
      };
      setCurrentSession(updated);
      updateSessionInHistory(updated);
    },
    [currentSession, updateSessionInHistory]
  );

  // ── Effects ──────────────────────────────────────────────────────
  useEffect(() => {
    const checkLiDAR = async () => {
      try {
        const hasLiDAR =
          navigator.userAgent.includes('iPhone') ||
          navigator.userAgent.includes('iPad');
        setIsLiDARAvailable(hasLiDAR);
      } catch {
        setIsLiDARAvailable(false);
      }
    };
    void checkLiDAR();
  }, []);

  useEffect(() => {
    let mounted = true;
    void detectWebxrSupport((v) => {
      if (mounted) setWebxrSupported(v);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  // ── Public API ───────────────────────────────────────────────────
  return {
    // Session
    currentSession,
    sessionHistory,
    sessionHistoryRaw,
    setSessionHistory,
    recordingProgress,
    startSession,
    completeSession,

    // Preferences & settings
    preferences,
    setPreferences,
    selectedProtocol,
    setSelectedProtocol,
    selectedAnalysisType,
    setSelectedAnalysisType,

    // Calibration
    calibrated,
    calibrate,

    // Device capabilities
    isLiDARAvailable,
    lidarReady,
    webxrSupported,

    // UI state
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

    // Session mutation helpers
    saveNotes,
    addTag,
    removeTag,
  } as const;
}
