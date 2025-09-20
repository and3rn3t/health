import { z } from 'zod';

// Mail used for WebSocket messages
export const messageEnvelopeSchema = z.object({
  type: z.enum([
    'connection_established',
    'live_health_update',
    'historical_data_update',
    'emergency_alert',
    'client_presence',
    'error',
    'pong',
  ]),
  data: z.unknown().optional(),
  timestamp: z.string().datetime().optional(),
});

// Enhanced health metric types
export const healthMetricTypeSchema = z.enum([
  'heart_rate',
  'walking_steadiness',
  'steps',
  // Gait, posture, and stability-focused metrics
  'gait_speed', // meters/second
  'cadence', // steps/min
  'stride_length', // meters
  'step_asymmetry', // percent 0-100
  'double_support_time', // percent 0-100
  'posture_angle', // degrees forward lean (+ forward)
  'stability_index', // 0-100 composite stability score
  'sway_balance', // sway index or cm
  'oxygen_saturation',
  'sleep_hours',
  'body_weight',
  'active_energy',
  'distance_walking',
  'blood_pressure_systolic',
  'blood_pressure_diastolic',
  'body_temperature',
  'respiratory_rate',
  'fall_event',
]);

// Raw health metric from device
export const healthMetricSchema = z.object({
  type: healthMetricTypeSchema,
  value: z.number().describe('numeric value for the metric'),
  unit: z.string().optional(),
  timestamp: z.string().datetime().optional(),
  deviceId: z.string().optional(),
  userId: z.string().optional(),
  source: z
    .string()
    .optional()
    .describe('data source like Apple Watch, manual entry'),
  confidence: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('confidence level of the reading'),
});

// Batch upload for multiple metrics
export const healthMetricBatchSchema = z.object({
  metrics: z.array(healthMetricSchema),
  uploadedAt: z.string().datetime(),
  deviceInfo: z
    .object({
      deviceId: z.string(),
      deviceType: z.string(),
      osVersion: z.string().optional(),
      appVersion: z.string().optional(),
    })
    .optional(),
});

// Enhanced processed health data with analytics
export const processedHealthDataSchema = z.object({
  id: z.string().uuid().optional(),
  type: healthMetricTypeSchema,
  value: z.number(),
  unit: z.string().optional(),
  timestamp: z.string().datetime(),
  processedAt: z.string().datetime(),
  validated: z.boolean(),

  // Analytics and insights
  healthScore: z.number().min(0).max(100).optional(),
  fallRisk: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
  trendAnalysis: z
    .object({
      direction: z.enum(['improving', 'stable', 'declining']),
      confidence: z.number().min(0).max(1),
      changePercent: z.number().optional(),
    })
    .optional(),

  // Contextual data
  anomalyScore: z
    .number()
    .min(0)
    .max(1)
    .optional()
    .describe('how unusual this reading is'),
  correlatedMetrics: z
    .array(z.string())
    .optional()
    .describe('related metrics that influenced this reading'),

  // Alert and notification system
  alert: z
    .object({
      level: z.enum(['info', 'warning', 'critical', 'emergency']),
      message: z.string(),
      actionRequired: z.boolean().optional(),
      expiresAt: z.string().datetime().optional(),
    })
    .nullable()
    .optional(),

  // Data lineage
  source: z.object({
    deviceId: z.string().optional(),
    userId: z.string(),
    collectedAt: z.string().datetime(),
    processingPipeline: z.string().optional(),
  }),

  // Quality metrics
  dataQuality: z
    .object({
      completeness: z.number().min(0).max(100),
      accuracy: z.number().min(0).max(100),
      timeliness: z.number().min(0).max(100),
      consistency: z.number().min(0).max(100),
    })
    .optional(),
});

// Live gait snapshot (lightweight, ephemeral)
export const liveGaitSnapshotSchema = z.object({
  speed: z.number().min(0).max(4).describe('walking speed m/s'),
  stepFrequency: z.number().min(0).max(300).describe('steps per minute'),
  asymmetry: z.number().min(0).max(1).nullable().optional(),
  variability: z.number().min(0).max(1).nullable().optional(),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  capturedAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
  source: z.string().default('ios_device'),
});

export const liveBalanceProgressSchema = z.object({
  percent: z.number().min(0).max(100),
  instantaneousStability: z.number().min(0).max(1).nullable().optional(),
  elapsedSeconds: z.number().min(0),
  testKind: z.string().optional(),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  capturedAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

export const liveBalanceResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  componentScores: z.record(z.number().min(0).max(100)),
  testKind: z.string().optional(),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  capturedAt: z
    .string()
    .datetime()
    .default(() => new Date().toISOString()),
});

// Aggregated response schemas
export const liveGaitRecentResponseSchema = z.object({
  ok: z.literal(true),
  userId: z.string(),
  count: z.number(),
  snapshots: z.array(liveGaitSnapshotSchema),
  rolling: z
    .object({
      speedAvg: z.number().nullable(),
      speedVar: z.number().nullable(),
      cadenceAvg: z.number().nullable(),
      asymAvg: z.number().nullable(),
      variabilityAvg: z.number().nullable(),
    })
    .optional(),
  trend: z
    .object({
      direction: z.enum(['improving', 'stable', 'declining']).nullable(),
      slope: z
        .number()
        .nullable()
        .describe(
          'approximate slope of speed over time (m/s per sample index)'
        ),
      confidence: z.number().min(0).max(1).nullable(),
      sampleCount: z.number().optional(),
      relativeSlope: z.number().nullable().optional(),
      severity: z
        .enum([
          'strong_improvement',
          'moderate_improvement',
          'mild_improvement',
          'stable',
          'mild_decline',
          'moderate_decline',
          'strong_decline',
          'insufficient_data',
        ])
        .optional(),
    })
    .optional(),
  trends: z
    .record(
      z.object({
        direction: z.enum(['improving', 'stable', 'declining']).nullable(),
        slope: z.number().nullable(),
        confidence: z.number().min(0).max(1).nullable(),
        sampleCount: z.number().optional(),
        relativeSlope: z.number().nullable().optional(),
        severity: z
          .enum([
            'strong_improvement',
            'moderate_improvement',
            'mild_improvement',
            'stable',
            'mild_decline',
            'moderate_decline',
            'strong_decline',
            'insufficient_data',
          ])
          .optional(),
      })
    )
    .optional(),
});

export const liveBalanceRecentResponseSchema = z.object({
  ok: z.literal(true),
  userId: z.string(),
  results: z.array(liveBalanceResultSchema).optional(),
  lastProgress: liveBalanceProgressSchema.optional(),
});

export type LiveGaitSnapshot = z.infer<typeof liveGaitSnapshotSchema>;
export type LiveBalanceProgress = z.infer<typeof liveBalanceProgressSchema>;
export type LiveBalanceResult = z.infer<typeof liveBalanceResultSchema>;
export const liveGaitSnapshotBatchSchema = z.object({
  snapshots: z.array(liveGaitSnapshotSchema).min(1).max(50),
  userId: z.string().optional(),
  deviceId: z.string().optional(),
  capturedAt: z.string().datetime().optional(),
});
export type LiveGaitSnapshotBatch = z.infer<typeof liveGaitSnapshotBatchSchema>;

export type MessageEnvelope = z.infer<typeof messageEnvelopeSchema>;
export type HealthMetric = z.infer<typeof healthMetricSchema>;
export type HealthMetricBatch = z.infer<typeof healthMetricBatchSchema>;
export type ProcessedHealthData = z.infer<typeof processedHealthDataSchema>;
export type HealthMetricType = z.infer<typeof healthMetricTypeSchema>;
