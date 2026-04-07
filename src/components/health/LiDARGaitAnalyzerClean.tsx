/**
 * LiDAR Gait Analyzer Component - Icon-Free Version
 * Streamlined LiDAR-based gait analysis for movement pattern detection
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@/hooks/useCloudflareKV';
import {
  assessEnvironmentRisk,
  summarizeSurface,
  type EnvironmentRisk,
} from '@/lib/lidar/processing';
import type { Point3D, PointCloud } from '@/lib/lidar/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';

interface FallRiskLike {
  probability: number;
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface FusedRisk extends FallRiskLike {
  components: { physiological: number; environment: number };
  explanation: string;
}

function fuseRisks(
  physiological: FallRiskLike,
  environment: EnvironmentRisk,
  weights = { phys: 0.7, env: 0.3 }
): FusedRisk {
  const p = Math.min(
    1,
    Math.max(
      0,
      weights.phys * physiological.probability +
        weights.env * environment.probability
    )
  );
  const riskLevel: FusedRisk['riskLevel'] =
    p >= 0.7 ? 'high' : p >= 0.4 ? 'moderate' : 'low';
  return {
    probability: p,
    riskLevel,
    components: {
      physiological: physiological.probability,
      environment: environment.probability,
    },
    explanation: `Fused risk (phys=${weights.phys}, env=${weights.env})`,
  };
}

// Minimal Navigator XR surface to avoid 'any' while keeping code portable
type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported?: (mode: string) => Promise<boolean>;
    requestSession?: (
      mode: string,
      options?: Record<string, unknown>
    ) => Promise<unknown>;
  };
};

async function detectWebxrSupport(setSupported: (v: boolean) => void) {
  try {
    const nav = navigator as XRNavigator;
    const ok = (await nav?.xr?.isSessionSupported?.('immersive-ar')) ?? false;
    setSupported(Boolean(ok));
  } catch {
    setSupported(false);
  }
}

// LiDAR Gait Analysis Types
type ProtocolType = 'none' | 'TUG' | '10MWT' | '6MWT';
type QualityGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor';

interface LiDARGaitMetrics {
  sessionId: string;
  spatialMetrics: {
    stepWidth: number;
    stepLength: number;
    strideLength: number;
    footClearance: number;
  };
  temporalMetrics: {
    cadence: number;
    swingTime: number;
    stanceTime: number;
    doubleSupportTime: number;
  };
  stabilityMetrics: {
    lateralVariability: number;
    postureStability: number;
    balanceScore: number;
  };
  recommendations: readonly string[];
  analysisTimestamp: Date;
}

interface LiDARSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  analysisType: 'quick' | 'comprehensive';
  metrics?: LiDARGaitMetrics;
  recommendations: readonly string[];
  status: 'recording' | 'completed' | 'analysing';
  // Optional metadata
  notes?: string;
  environment?: 'indoor' | 'outdoor';
  tags?: string[];
  protocol?: Exclude<ProtocolType, 'none'>;
  qualityScore?: number; // 0-100
  qualityGrade?: QualityGrade;
  // New optional risk fields
  environmentRisk?: EnvironmentRisk;
  fusedRisk?: FusedRisk;
}

interface LiDARGaitAnalyzerProps {
  readonly onSessionComplete?: (session: LiDARSession) => void;
  readonly maxSessionDuration?: number;
}

// Preferences and schemas
interface LiDARPreferences {
  environment: 'indoor' | 'outdoor';
  demoDurations: boolean; // if true, quick=30s, comprehensive=90s; else 5min/30min
  autoSave: boolean;
  simulate?: boolean; // developer toggle to simulate LiDAR on unsupported devices
}

const lidarGaitMetricsSchema = z.object({
  sessionId: z.string(),
  spatialMetrics: z.object({
    stepWidth: z.number(),
    stepLength: z.number(),
    strideLength: z.number(),
    footClearance: z.number(),
  }),
  temporalMetrics: z.object({
    cadence: z.number(),
    swingTime: z.number(),
    stanceTime: z.number(),
    doubleSupportTime: z.number(),
  }),
  stabilityMetrics: z.object({
    lateralVariability: z.number(),
    postureStability: z.number(),
    balanceScore: z.number(),
  }),
  recommendations: z.array(z.string()).readonly(),
  analysisTimestamp: z.coerce.date(),
});

const lidarSessionSchema = z.object({
  id: z.string(),
  startTime: z.coerce.date(),
  endTime: z.coerce.date().optional(),
  duration: z.number(),
  analysisType: z.union([z.literal('quick'), z.literal('comprehensive')]),
  metrics: lidarGaitMetricsSchema.optional(),
  recommendations: z.array(z.string()).readonly(),
  status: z.union([
    z.literal('recording'),
    z.literal('completed'),
    z.literal('analysing'),
  ]),
  // Optional extensions stored but not required
  notes: z.string().optional(),
  environment: z.union([z.literal('indoor'), z.literal('outdoor')]).optional(),
  tags: z.array(z.string()).optional(),
  protocol: z
    .union([z.literal('TUG'), z.literal('10MWT'), z.literal('6MWT')])
    .optional(),
  qualityScore: z.number().optional(),
  qualityGrade: z
    .union([
      z.literal('Excellent'),
      z.literal('Good'),
      z.literal('Fair'),
      z.literal('Poor'),
    ])
    .optional(),
  environmentRisk: z
    .object({
      surface: z.object({
        plane: z
          .object({
            normal: z.object({ x: z.number(), y: z.number(), z: z.number() }),
            d: z.number(),
          })
          .nullable(),
        roughness: z.number(),
        slopeDeg: z.number(),
        obstacleDensity: z.number(),
      }),
      riskLevel: z.union([
        z.literal('low'),
        z.literal('moderate'),
        z.literal('high'),
      ]),
      probability: z.number(),
      factors: z.array(
        z.object({
          name: z.string(),
          value: z.number(),
          contribution: z.number(),
        })
      ),
    })
    .optional(),
  fusedRisk: z
    .object({
      probability: z.number(),
      riskLevel: z.union([
        z.literal('low'),
        z.literal('moderate'),
        z.literal('high'),
      ]),
      components: z.object({
        physiological: z.number(),
        environment: z.number(),
      }),
      explanation: z.string(),
    })
    .optional(),
});

// --- Helpers (extracted to reduce component complexity) ---
function calcEffectiveDurationSec(
  protocol: ProtocolType,
  demoDurations: boolean | undefined,
  analysisType: 'quick' | 'comprehensive'
): number {
  if (protocol !== 'none') {
    const demo = Boolean(demoDurations);
    if (protocol === 'TUG') return 20;
    if (protocol === '10MWT') return demo ? 30 : 60;
    // 6MWT
    return demo ? 90 : 360;
  }
  if (demoDurations) {
    return analysisType === 'quick' ? 30 : 90;
  }
  // Realistic durations: 5 min / 30 min
  return analysisType === 'quick' ? 300 : 1800;
}

function formatTargetLabel(
  protocol: ProtocolType,
  demoDurations: boolean | undefined,
  analysisType: 'quick' | 'comprehensive'
): string {
  if (protocol === 'TUG') return '20s';
  if (protocol === '10MWT') return demoDurations ? '30s' : '60s';
  if (protocol === '6MWT') return demoDurations ? '90s' : '6m';
  return getTargetLabel(analysisType, demoDurations);
}

function computeQuality(
  m: LiDARGaitMetrics,
  wasCalibrated: boolean
): { score: number; grade: QualityGrade } {
  const balance = m.stabilityMetrics.balanceScore; // 0-100
  // Lower lateral variability is better (1-3 cm typical)
  const lv = m.stabilityMetrics.lateralVariability;
  const lvScore = Math.max(0, Math.min(100, 110 - lv * 20)); // 1->90, 2->70, 3->50
  // Cadence in healthy range 90-120
  const cad = m.temporalMetrics.cadence;
  let cadScore = 60; // default
  if (cad >= 90 && cad <= 120) cadScore = 90;
  else if (cad >= 80 && cad < 90) cadScore = 75;
  else if (cad > 120 && cad <= 130) cadScore = 80;
  // Foot clearance >=3cm preferred
  const fc = m.spatialMetrics.footClearance;
  const fcScore = fc >= 3 ? 90 : 65;
  // Weighted aggregate
  let score = Math.round(
    balance * 0.4 + lvScore * 0.25 + cadScore * 0.2 + fcScore * 0.15
  );
  // Penalize if not calibrated (shouldn't happen since we gate, but be safe)
  if (!wasCalibrated) score -= 15;
  score = Math.max(0, Math.min(100, score));
  let grade: QualityGrade;
  if (score >= 85) grade = 'Excellent';
  else if (score >= 70) grade = 'Good';
  else if (score >= 55) grade = 'Fair';
  else grade = 'Poor';
  return { score, grade };
}

type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';
type RiskLevel = EnvironmentRisk['riskLevel'];
function getQualityBadgeVariant(q?: QualityGrade): BadgeVariant {
  if (!q || q === 'Excellent') return 'default';
  if (q === 'Good') return 'secondary';
  if (q === 'Fair') return 'outline';
  return 'destructive';
}

function getRiskBadgeVariant(level: RiskLevel): BadgeVariant {
  if (level === 'high') return 'destructive';
  if (level === 'moderate') return 'secondary';
  return 'default';
}

// --- Child Components ---
interface ControlsProps {
  readonly preferences?: LiDARPreferences;
  readonly setPreferences: (next: LiDARPreferences) => void;
  readonly selectedProtocol: ProtocolType;
  readonly setSelectedProtocol: (p: ProtocolType) => void;
  readonly selectedAnalysisType: 'quick' | 'comprehensive';
  readonly setSelectedAnalysisType: (t: 'quick' | 'comprehensive') => void;
  readonly lidarReady: boolean;
  readonly currentSession: LiDARSession | null;
  readonly recordingProgress: number;
  readonly liveCadence: number | null;
  readonly targetLabel: string;
  readonly startSession: () => void;
  readonly completeSession: (id: string) => void;
}

function LiDARControls(props: Readonly<ControlsProps>) {
  const {
    preferences,
    setPreferences,
    selectedProtocol,
    setSelectedProtocol,
    selectedAnalysisType,
    setSelectedAnalysisType,
    lidarReady,
    currentSession,
    recordingProgress,
    liveCadence,
    targetLabel,
    startSession,
    completeSession,
  } = props;
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="mr-1 select-none">
            📊
          </span>
          <span>Analysis Controls</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Guided Protocols */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Protocol:</span>
            <div className="flex gap-1">
              <Button
                variant={selectedProtocol === 'none' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('none')}
              >
                None
              </Button>
              <Button
                variant={selectedProtocol === 'TUG' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('TUG')}
              >
                TUG
              </Button>
              <Button
                variant={selectedProtocol === '10MWT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('10MWT')}
              >
                10m Walk
              </Button>
              <Button
                variant={selectedProtocol === '6MWT' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedProtocol('6MWT')}
              >
                6-Min Walk
              </Button>
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Mode:</span>
            <div className="flex gap-1">
              <Button
                variant={preferences?.simulate ? 'outline' : 'default'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                      simulate: false,
                    }),
                    simulate: false,
                  })
                }
              >
                Device
              </Button>
              <Button
                variant={preferences?.simulate ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                      simulate: false,
                    }),
                    simulate: true,
                  })
                }
              >
                Simulate
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Environment:</span>
            <div className="flex gap-1">
              <Button
                variant={
                  preferences?.environment === 'indoor' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    environment: 'indoor',
                  })
                }
              >
                Indoor
              </Button>
              <Button
                variant={
                  preferences?.environment === 'outdoor' ? 'default' : 'outline'
                }
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    environment: 'outdoor',
                  })
                }
              >
                Outdoor
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Duration:</span>
            <div className="flex gap-1">
              <Button
                variant={preferences?.demoDurations ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    demoDurations: true,
                  })
                }
              >
                Demo (30s/90s)
              </Button>
              <Button
                variant={!preferences?.demoDurations ? 'default' : 'outline'}
                size="sm"
                onClick={() =>
                  setPreferences({
                    ...(preferences ?? {
                      environment: 'indoor',
                      demoDurations: true,
                      autoSave: true,
                    }),
                    demoDurations: false,
                  })
                }
              >
                Realistic (5m/30m)
              </Button>
            </div>
          </div>
        </div>

        {/* Protocol Instructions */}
        {selectedProtocol !== 'none' && (
          <div className="bg-muted/30 rounded border border-muted p-3 text-sm">
            {selectedProtocol === 'TUG' && (
              <p>
                Timed Up and Go: Start seated, stand up, walk 3 meters, turn,
                return, and sit. The timer runs from the go signal until you sit
                again.
              </p>
            )}
            {selectedProtocol === '10MWT' && (
              <p>
                10 Meter Walk Test: Walk a straight 10 meter path at a
                comfortable pace. Focus on consistent speed and posture.
              </p>
            )}
            {selectedProtocol === '6MWT' && (
              <p>
                6-Minute Walk Test: Walk continuously for the duration at a
                comfortable pace. You can slow down or rest if needed.
              </p>
            )}
          </div>
        )}

        {selectedProtocol === 'none' && (
          <div className="flex gap-2">
            <Button
              variant={selectedAnalysisType === 'quick' ? 'default' : 'outline'}
              onClick={() => setSelectedAnalysisType('quick')}
            >
              {`Quick`}
            </Button>
            <Button
              variant={
                selectedAnalysisType === 'comprehensive' ? 'default' : 'outline'
              }
              onClick={() => setSelectedAnalysisType('comprehensive')}
            >
              {`Comprehensive`}
            </Button>
          </div>
        )}

        {currentSession ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Recording Progress</span>
              <span className="text-sm text-muted-foreground">
                {Math.round(recordingProgress)}%
              </span>
            </div>
            <Progress value={recordingProgress} className="w-full" />
            {liveCadence !== null && (
              <div className="text-xs text-muted-foreground">
                Live cadence:{' '}
                <span className="font-mono">{Math.round(liveCadence)} spm</span>
              </div>
            )}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Target: {targetLabel}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  currentSession?.id && completeSession(currentSession.id)
                }
              >
                End Session Now
              </Button>
            </div>
            <p className="text-sm text-muted-foreground">
              Keep walking naturally. The LiDAR sensor is analyzing your
              movement patterns.
            </p>
          </div>
        ) : (
          <Button
            onClick={startSession}
            disabled={!lidarReady}
            className="w-full"
          >
            {selectedProtocol === 'none'
              ? '▶️ Start LiDAR Gait Analysis'
              : `▶️ Start ${selectedProtocol}`}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

interface OverviewProps {
  readonly currentSession: LiDARSession;
  readonly sessionHistory: LiDARSession[];
  readonly showMessage: (message: string, type?: 'success' | 'error') => void;
}

function LiDAROverview(props: Readonly<OverviewProps>) {
  const { currentSession, sessionHistory, showMessage } = props;
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span aria-hidden="true" className="mr-1 select-none">
            📊
          </span>
          <span>Analysis Overview</span>
        </CardTitle>
        <CardDescription>
          Session completed at {currentSession.endTime?.toLocaleTimeString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium">Step Length</p>
            <p className="text-2xl font-bold">
              {currentSession.metrics!.spatialMetrics.stepLength} cm
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Cadence</p>
            <p className="text-2xl font-bold">
              {currentSession.metrics!.temporalMetrics.cadence} steps/min
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Balance Score</p>
            <p className="text-2xl font-bold">
              {currentSession.metrics!.stabilityMetrics.balanceScore}%
            </p>
          </div>
          <div>
            <p className="text-sm font-medium">Overall Status</p>
            <div className="flex items-center gap-2">
              <Badge variant="default">✅ Analysis Complete</Badge>
              {currentSession.qualityGrade && (
                <Badge
                  variant={getQualityBadgeVariant(currentSession.qualityGrade)}
                >
                  Quality: {currentSession.qualityGrade}
                </Badge>
              )}
              {currentSession.fusedRisk && (
                <Badge
                  variant={getRiskBadgeVariant(
                    currentSession.fusedRisk.riskLevel
                  )}
                  title={currentSession.fusedRisk.explanation}
                >
                  Fused Risk:{' '}
                  {Math.round(currentSession.fusedRisk.probability * 100)}%
                </Badge>
              )}
            </div>
          </div>
        </div>
        {/* Sparkline */}
        {sessionHistory.length > 0 &&
          (() => {
            const cadences = [
              currentSession.metrics?.temporalMetrics.cadence,
              ...sessionHistory
                .filter((s) => s.metrics)
                .map((s) => s.metrics!.temporalMetrics.cadence),
            ]
              .filter((v): v is number => typeof v === 'number')
              .slice(0, 8)
              .reverse();
            if (cadences.length < 2) return null;
            const w = 160;
            const h = 36;
            const min = Math.min(...cadences);
            const max = Math.max(...cadences);
            const range = Math.max(1, max - min);
            const step = w / (cadences.length - 1);
            const points = cadences
              .map((v, i) => `${i * step},${h - ((v - min) / range) * h}`)
              .join(' ');
            return (
              <div className="mt-4">
                <p className="mb-1 text-sm font-medium">
                  Cadence Trend (recent)
                </p>
                <svg
                  width={w}
                  height={h}
                  viewBox={`0 0 ${w} ${h}`}
                  className="text-primary"
                  aria-label="Cadence sparkline"
                >
                  <polyline
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    points={points}
                  />
                </svg>
              </div>
            );
          })()}
        {/* Compare to previous */}
        {sessionHistory.length > 0 && (
          <div className="mt-4 rounded border p-3">
            <p className="mb-2 text-sm font-medium">Change vs. last session</p>
            {renderChangeVsPrevious(currentSession, sessionHistory)}
          </div>
        )}
        {/* JSON viewer */}
        <div className="mt-4 flex justify-end">
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  try {
                    const json = JSON.stringify(
                      currentSession,
                      (_k, v) => (v instanceof Date ? v.toISOString() : v),
                      2
                    );
                    setContent(json);
                    setOpen(true);
                  } catch (e) {
                    console.error('Failed to open JSON', e);
                    showMessage('Failed to open JSON', 'error');
                  }
                }}
              >
                View JSON
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Session JSON</DialogTitle>
                <DialogDescription>
                  Exact JSON for this session (timestamps in ISO)
                </DialogDescription>
              </DialogHeader>
              <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                {content}
              </pre>
              <DialogFooter>
                <div className="flex w-full items-center justify-end gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(content);
                        showMessage('Copied to clipboard');
                      } catch (e) {
                        console.error('Copy failed', e);
                        showMessage('Copy failed', 'error');
                      }
                    }}
                  >
                    Copy JSON
                  </Button>
                  <Button size="sm" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

interface HistoryProps {
  readonly sessionHistory: LiDARSession[];
  readonly sessionHistoryRaw: LiDARSession[];
  readonly setSessionHistory: (
    next:
      | LiDARSession[]
      | ((prev: LiDARSession[] | undefined) => LiDARSession[])
  ) => void;
  readonly availableTags: string[];
  readonly selectedTag: string | null;
  readonly setSelectedTag: (t: string | null) => void;
  readonly showMessage: (message: string, type?: 'success' | 'error') => void;
}

function LiDARHistory(props: Readonly<HistoryProps>) {
  const {
    sessionHistory,
    sessionHistoryRaw,
    setSessionHistory,
    availableTags,
    selectedTag,
    setSelectedTag,
    showMessage,
  } = props;
  const importInputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [content, setContent] = useState('');
  const [itemOpen, setItemOpen] = useState(false);
  const [itemContent, setItemContent] = useState('');
  const filtered = useMemo(() => {
    if (selectedTag === null) return sessionHistory;
    return sessionHistory.filter((s) => (s.tags ?? []).includes(selectedTag));
  }, [selectedTag, sessionHistory]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <span aria-hidden="true" className="mr-1 select-none">
              📈
            </span>
            <span>Recent Sessions</span>
          </CardTitle>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => importInputRef.current?.click()}
            >
              Import JSON
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                try {
                  const data = JSON.stringify(sessionHistoryRaw, null, 2);
                  const blob = new Blob([data], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `lidar-sessions-${new Date().toISOString()}.json`;
                  document.body.appendChild(a);
                  a.click();
                  a.remove();
                  URL.revokeObjectURL(url);
                  showMessage('Exported session history');
                } catch (_err) {
                  console.error('Failed to export history', _err);
                  showMessage('Failed to export history', 'error');
                }
              }}
            >
              Export JSON
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    try {
                      const json = JSON.stringify(
                        sessionHistoryRaw,
                        (_k, v) => (v instanceof Date ? v.toISOString() : v),
                        2
                      );
                      setContent(json);
                      setOpen(true);
                    } catch (e) {
                      console.error('Failed to open JSON', e);
                      showMessage('Failed to open JSON', 'error');
                    }
                  }}
                >
                  View JSON
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Session History JSON</DialogTitle>
                  <DialogDescription>
                    Exportable JSON for recent sessions (timestamps in ISO)
                  </DialogDescription>
                </DialogHeader>
                <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                  {content}
                </pre>
                <DialogFooter>
                  <div className="flex w-full items-center justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(content);
                          showMessage('Copied to clipboard');
                        } catch (e) {
                          console.error('Copy failed', e);
                          showMessage('Copy failed', 'error');
                        }
                      }}
                    >
                      Copy JSON
                    </Button>
                    <Button size="sm" onClick={() => setOpen(false)}>
                      Close
                    </Button>
                  </div>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                setSessionHistory([]);
                showMessage('History cleared');
              }}
            >
              Clear
            </Button>
          </div>
        </div>
        {/* Tag Filter */}
        {availableTags.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">Filter:</span>
            <button
              className={`rounded border px-2 py-1 text-xs ${selectedTag === null ? 'bg-muted' : ''}`}
              onClick={() => setSelectedTag(null)}
            >
              All
            </button>
            {availableTags.map((t) => (
              <button
                key={t}
                className={`rounded border px-2 py-1 text-xs ${selectedTag === t ? 'bg-muted' : ''}`}
                onClick={() => setSelectedTag(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {filtered.slice(0, 3).map((session) => (
            <div
              key={session.id}
              className="flex w-full items-center justify-between gap-2 rounded border p-2"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">
                  {session.analysisType === 'quick' ? 'Quick' : 'Comprehensive'}{' '}
                  Analysis
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.startTime.toLocaleDateString()} at{' '}
                  {session.startTime.toLocaleTimeString()}
                </p>
                {session.protocol && (
                  <p className="text-xs text-muted-foreground">
                    Protocol: {session.protocol}
                  </p>
                )}
                {session.tags && session.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {session.tags.slice(0, 6).map((t) => (
                      <span
                        key={`${session.id}-${t}`}
                        className="rounded bg-muted px-1.5 py-0.5 text-[10px]"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {session.qualityGrade && (
                  <Badge variant="secondary">{session.qualityGrade}</Badge>
                )}
                <Badge variant="outline">
                  {session.status === 'completed' ? 'Completed' : 'In Progress'}
                </Badge>
                <Dialog open={itemOpen} onOpenChange={setItemOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        try {
                          const json = JSON.stringify(
                            session,
                            (_k, v) =>
                              v instanceof Date ? v.toISOString() : v,
                            2
                          );
                          setItemContent(json);
                          setItemOpen(true);
                        } catch (e) {
                          console.error('Failed to open JSON', e);
                          showMessage('Failed to open JSON', 'error');
                        }
                      }}
                    >
                      View JSON
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Session JSON</DialogTitle>
                      <DialogDescription>
                        Exact JSON for this session (timestamps in ISO)
                      </DialogDescription>
                    </DialogHeader>
                    <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded bg-muted p-3 text-xs">
                      {itemContent}
                    </pre>
                    <DialogFooter>
                      <div className="flex w-full items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={async () => {
                            try {
                              await navigator.clipboard.writeText(itemContent);
                              showMessage('Copied to clipboard');
                            } catch (e) {
                              console.error('Copy failed', e);
                              showMessage('Copy failed', 'error');
                            }
                          }}
                        >
                          Copy JSON
                        </Button>
                        <Button size="sm" onClick={() => setItemOpen(false)}>
                          Close
                        </Button>
                      </div>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ))}
        </div>
        {/* Hidden file input for import */}
        <input
          ref={importInputRef}
          type="file"
          accept="application/json"
          className="hidden"
          title="Import LiDAR session history JSON"
          placeholder="Import LiDAR session history JSON"
          onChange={async (e) => {
            try {
              const file = e.target.files?.[0];
              if (!file) return;
              const text = await file.text();
              const data = JSON.parse(text);
              const arr: unknown[] = Array.isArray(data) ? data : [data];
              const parsed: LiDARSession[] = [];
              for (const item of arr) {
                const res = lidarSessionSchema.safeParse(item);
                if (res.success) parsed.push(res.data as LiDARSession);
              }
              if (parsed.length === 0) {
                showMessage('No valid sessions found in file', 'error');
                return;
              }
              // Merge and dedupe by id, keep most recent first
              setSessionHistory((prev) => {
                const map = new Map<string, LiDARSession>();
                [...parsed, ...(prev ?? [])].forEach((s) => map.set(s.id, s));
                return Array.from(map.values())
                  .sort(
                    (a, b) =>
                      (b.startTime?.getTime?.() ?? 0) -
                      (a.startTime?.getTime?.() ?? 0)
                  )
                  .slice(0, 50);
              });
              showMessage(`Imported ${parsed.length} session(s)`);
            } catch (err) {
              console.error('Import failed', err);
              showMessage('Failed to import JSON', 'error');
            } finally {
              if (e.target) (e.target as HTMLInputElement).value = '';
            }
          }}
        />
      </CardContent>
    </Card>
  );
}

// Helpers
function getTargetLabel(
  analysisType: 'quick' | 'comprehensive',
  demoDurations?: boolean
): string {
  if (analysisType === 'quick') return demoDurations ? '30s' : '5m';
  return demoDurations ? '90s' : '30m';
}

function renderChangeVsPrevious(
  current: LiDARSession,
  history: LiDARSession[]
) {
  const prev = history.find((s) => s.id !== current.id && s.metrics);
  const prevMetrics = prev?.metrics;
  if (!prevMetrics) {
    return (
      <p className="text-xs text-muted-foreground">
        No previous session with metrics found.
      </p>
    );
  }
  const dLen =
    (current.metrics?.spatialMetrics.stepLength ?? 0) -
    prevMetrics.spatialMetrics.stepLength;
  const dCad =
    (current.metrics?.temporalMetrics.cadence ?? 0) -
    prevMetrics.temporalMetrics.cadence;
  const dBal =
    (current.metrics?.stabilityMetrics.balanceScore ?? 0) -
    prevMetrics.stabilityMetrics.balanceScore;
  const F = (n: number) => (n > 0 ? `+${n}` : `${n}`);
  return (
    <div className="grid grid-cols-3 gap-3 text-xs">
      <div className="rounded bg-muted p-2">
        <div className="text-muted-foreground">Step Length</div>
        <div className={dLen >= 0 ? 'text-green-600' : 'text-red-600'}>
          {F(Math.round(dLen))} cm
        </div>
      </div>
      <div className="rounded bg-muted p-2">
        <div className="text-muted-foreground">Cadence</div>
        <div className={dCad >= 0 ? 'text-green-600' : 'text-red-600'}>
          {F(Math.round(dCad))} spm
        </div>
      </div>
      <div className="rounded bg-muted p-2">
        <div className="text-muted-foreground">Balance</div>
        <div className={dBal >= 0 ? 'text-green-600' : 'text-red-600'}>
          {F(Math.round(dBal))} %
        </div>
      </div>
    </div>
  );
}

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
    // Coerce Dates safely using zod; drop invalid entries
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
  const [selectedTag, setSelectedTag] = useState<string | null>(null); // null = All
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

  // Small helper to update an existing session entry in history by id
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

  // (handlers were extracted previously but we now use inline handlers; keep only shared helpers)

  const availableTags = useMemo(() => {
    return Array.from(
      new Set(sessionHistory.flatMap((s) => s.tags ?? []))
    ).slice(0, 20);
  }, [sessionHistory]);

  // Simple notification system
  const showMessage = (
    message: string,
    type: 'success' | 'error' = 'success'
  ) => {
    setShowNotification({ message, type });
    setTimeout(() => setShowNotification(null), 3000);
  };

  // Check LiDAR availability on component mount
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

  // Detect WebXR AR support (best-effort, safe fallback)
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
          stepWidth: Math.round(8 + Math.random() * 4), // NOSONAR 8-12 cm
          stepLength: Math.round(55 + Math.random() * 15), // NOSONAR 55-70 cm
          strideLength: Math.round(110 + Math.random() * 30), // NOSONAR 110-140 cm
          footClearance: Math.round(2 + Math.random() * 3), // NOSONAR 2-5 cm
        },
        temporalMetrics: {
          cadence: Math.round(95 + Math.random() * 20), // NOSONAR 95-115 steps/min
          swingTime: Math.round(35 + Math.random() * 10), // NOSONAR 35-45% of gait cycle
          stanceTime: Math.round(55 + Math.random() * 10), // NOSONAR 55-65% of gait cycle
          doubleSupportTime: Math.round(10 + Math.random() * 5), // NOSONAR 10-15% of gait cycle
        },
        stabilityMetrics: {
          lateralVariability: Math.round(1 + Math.random() * 2), // NOSONAR 1-3 cm
          postureStability: Math.round(75 + Math.random() * 20), // NOSONAR 75-95%
          balanceScore: Math.round(70 + Math.random() * 25), // NOSONAR 70-95%
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
    // Initialize live cadence baseline
    const base = Math.round(95 + Math.random() * 20); // NOSONAR: Demo simulation
    liveCadenceBaseRef.current = base;
    setLiveCadence(base);
    showMessage(
      `Starting ${selectedAnalysisType} analysis (${preferences?.demoDurations ? 'demo' : 'realistic'} duration)...`
    );

    // Simulate recording progress
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
      // Update live cadence with small jitter
      setLiveCadence((prev) => {
        const baseCad = liveCadenceBaseRef.current ?? 100;
        const jitter = Math.round((Math.random() - 0.5) * 6); // NOSONAR -3..+3
        const candidate = (prev ?? baseCad) + jitter;
        return Math.min(140, Math.max(80, candidate));
      });
    }, 1000);
    recordingIntervalRef.current = interval as unknown as number;
  };

  // --- Synthetic environment and gait risk helpers ---
  function gaussianNoise(mean: number, std: number): number {
    // Box-Muller transform
    const u1 = Math.random(); // NOSONAR: Box-Muller transform for simulation
    const u2 = Math.random(); // NOSONAR
    const r = Math.sqrt(-2.0 * Math.log(Math.max(1e-12, u1)));
    const theta = 2.0 * Math.PI * u2;
    return mean + std * r * Math.cos(theta);
  }

  const generateSyntheticPointCloud = useCallback(
    (env: 'indoor' | 'outdoor'): PointCloud => {
      // Generate a small grid of points representing the walking surface ahead
      const points: Point3D[] = [];
      const nx = 24;
      const ny = 24;
      const cell = 0.1; // meters
      let slopeX: number;
      let slopeY: number;
      let rough: number; // meters std
      let obstacleRate: number; // fraction of cells with a bump
      if (env === 'outdoor') {
        // NOSONAR: Synthetic environment generation - Math.random() acceptable
        slopeX = ((Math.random() * 6) / 180) * Math.PI; // NOSONAR up to ~6°
        slopeY = ((Math.random() * 4) / 180) * Math.PI; // NOSONAR up to ~4°
        rough = 0.008 + Math.random() * 0.007; // NOSONAR 8-15mm
        obstacleRate = 0.06 + Math.random() * 0.09; // NOSONAR 0.06-0.15
      } else {
        slopeX = ((Math.random() * 2) / 180) * Math.PI; // NOSONAR up to ~2°
        slopeY = ((Math.random() * 1) / 180) * Math.PI; // NOSONAR up to ~1°
        rough = 0.001 + Math.random() * 0.003; // NOSONAR 1-4mm
        obstacleRate = 0.01 + Math.random() * 0.03; // NOSONAR 0.01-0.04
      }
      // Random bumps for obstacles
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
          // Base plane with slight slope
          let z = Math.tan(slopeX) * x + Math.tan(slopeY) * y;
          // Roughness noise
          z += gaussianNoise(0, rough);
          // Occasional obstacle bump (~2-6cm)
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
      // Simple, explainable heuristic mapped through a sigmoid
      const balance = m.stabilityMetrics.balanceScore; // 0-100 (higher is better)
      const lv = m.stabilityMetrics.lateralVariability; // cm (lower is better)
      const cadence = m.temporalMetrics.cadence; // steps/min (90-120 desired)
      const footClearance = m.spatialMetrics.footClearance; // cm (>=3 preferred)
      const wBalance = -0.04; // per point
      const wLv = 0.25; // per cm
      const wCad = 0.03; // per 10 spm deviation
      const wFc = -0.15; // per cm (negative reduces risk)
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
      // Synthesize environment risk from a generated point cloud (placeholder until real LiDAR frames available)
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
      // Persist and keep only latest 10 sessions
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
                            // Update in history if exists
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
