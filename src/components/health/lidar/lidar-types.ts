/**
 * LiDAR Gait Analyzer — Shared types, schemas, and pure helpers.
 */

import type { EnvironmentRisk } from '@/lib/lidar/processing';
import { z } from 'zod/v3';

// ── Interfaces & Types ─────────────────────────────────────────────

export interface FallRiskLike {
  probability: number;
  riskLevel: 'low' | 'moderate' | 'high';
}

export interface FusedRisk extends FallRiskLike {
  components: { physiological: number; environment: number };
  explanation: string;
}

// Minimal Navigator XR surface to avoid 'any' while keeping code portable
export type XRNavigator = Navigator & {
  xr?: {
    isSessionSupported?: (mode: string) => Promise<boolean>;
    requestSession?: (
      mode: string,
      options?: Record<string, unknown>
    ) => Promise<unknown>;
  };
};

export type ProtocolType = 'none' | 'TUG' | '10MWT' | '6MWT';
export type QualityGrade = 'Excellent' | 'Good' | 'Fair' | 'Poor';

export interface LiDARGaitMetrics {
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

export interface LiDARSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  analysisType: 'quick' | 'comprehensive';
  metrics?: LiDARGaitMetrics;
  recommendations: readonly string[];
  status: 'recording' | 'completed' | 'analysing';
  notes?: string;
  environment?: 'indoor' | 'outdoor';
  tags?: string[];
  protocol?: Exclude<ProtocolType, 'none'>;
  qualityScore?: number;
  qualityGrade?: QualityGrade;
  environmentRisk?: EnvironmentRisk;
  fusedRisk?: FusedRisk;
}

export interface LiDARGaitAnalyzerProps {
  readonly onSessionComplete?: (session: LiDARSession) => void;
  readonly maxSessionDuration?: number;
}

export interface LiDARPreferences {
  environment: 'indoor' | 'outdoor';
  demoDurations: boolean;
  autoSave: boolean;
  simulate?: boolean;
}

export type BadgeVariant = 'default' | 'secondary' | 'outline' | 'destructive';
export type RiskLevel = EnvironmentRisk['riskLevel'];

// ── Zod Schemas ────────────────────────────────────────────────────

export const lidarGaitMetricsSchema = z.object({
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

export const lidarSessionSchema = z.object({
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

// ── Pure Helper Functions ──────────────────────────────────────────

export function fuseRisks(
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

export async function detectWebxrSupport(setSupported: (v: boolean) => void) {
  try {
    const nav = navigator as XRNavigator;
    const ok = (await nav?.xr?.isSessionSupported?.('immersive-ar')) ?? false;
    setSupported(Boolean(ok));
  } catch {
    setSupported(false);
  }
}

export function calcEffectiveDurationSec(
  protocol: ProtocolType,
  demoDurations: boolean | undefined,
  analysisType: 'quick' | 'comprehensive'
): number {
  if (protocol !== 'none') {
    const demo = Boolean(demoDurations);
    if (protocol === 'TUG') return 20;
    if (protocol === '10MWT') return demo ? 30 : 60;
    return demo ? 90 : 360;
  }
  if (demoDurations) {
    return analysisType === 'quick' ? 30 : 90;
  }
  return analysisType === 'quick' ? 300 : 1800;
}

export function getTargetLabel(
  analysisType: 'quick' | 'comprehensive',
  demoDurations?: boolean
): string {
  if (analysisType === 'quick') return demoDurations ? '30s' : '5m';
  return demoDurations ? '90s' : '30m';
}

export function formatTargetLabel(
  protocol: ProtocolType,
  demoDurations: boolean | undefined,
  analysisType: 'quick' | 'comprehensive'
): string {
  if (protocol === 'TUG') return '20s';
  if (protocol === '10MWT') return demoDurations ? '30s' : '60s';
  if (protocol === '6MWT') return demoDurations ? '90s' : '6m';
  return getTargetLabel(analysisType, demoDurations);
}

export function computeQuality(
  m: LiDARGaitMetrics,
  wasCalibrated: boolean
): { score: number; grade: QualityGrade } {
  const balance = m.stabilityMetrics.balanceScore;
  const lv = m.stabilityMetrics.lateralVariability;
  const lvScore = Math.max(0, Math.min(100, 110 - lv * 20));
  const cad = m.temporalMetrics.cadence;
  let cadScore = 60;
  if (cad >= 90 && cad <= 120) cadScore = 90;
  else if (cad >= 80 && cad < 90) cadScore = 75;
  else if (cad > 120 && cad <= 130) cadScore = 80;
  const fc = m.spatialMetrics.footClearance;
  const fcScore = fc >= 3 ? 90 : 65;
  let score = Math.round(
    balance * 0.4 + lvScore * 0.25 + cadScore * 0.2 + fcScore * 0.15
  );
  if (!wasCalibrated) score -= 15;
  score = Math.max(0, Math.min(100, score));
  let grade: QualityGrade;
  if (score >= 85) grade = 'Excellent';
  else if (score >= 70) grade = 'Good';
  else if (score >= 55) grade = 'Fair';
  else grade = 'Poor';
  return { score, grade };
}

export function getQualityBadgeVariant(q?: QualityGrade): BadgeVariant {
  if (!q || q === 'Excellent') return 'default';
  if (q === 'Good') return 'secondary';
  if (q === 'Fair') return 'outline';
  return 'destructive';
}

export function getRiskBadgeVariant(level: RiskLevel): BadgeVariant {
  if (level === 'high') return 'destructive';
  if (level === 'moderate') return 'secondary';
  return 'default';
}

export function renderChangeVsPrevious(
  current: LiDARSession,
  history: LiDARSession[]
) {
  const prev = history.find((s) => s.id !== current.id && s.metrics);
  const prevMetrics = prev?.metrics;
  if (!prevMetrics) {
    return null;
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
  return { dLen, dCad, dBal };
}
