import { z } from 'zod';

// Envelope used for WebSocket messages
export const messageEnvelopeSchema = z.object({
  type: z.enum([
    'connection_established',
    'live_health_update',
    'historical_data_update',
    'emergency_alert',
    'error',
    'pong',
  ]),
  data: z.unknown().optional(),
  timestamp: z.string().datetime().optional(),
});

// Minimal live health metric structure
export const healthMetricSchema = z.object({
  type: z
    .enum(['heart_rate', 'walking_steadiness', 'steps', 'oxygen_saturation'])
    .describe('metric identifier'),
  value: z.number().describe('numeric value for the metric'),
  unit: z.string().optional(),
});

export const processedHealthDataSchema = z.object({
  type: healthMetricSchema.shape.type,
  value: z.number(),
  processedAt: z.string().datetime(),
  validated: z.boolean(),
  healthScore: z.number().optional(),
  fallRisk: z.enum(['low', 'moderate', 'high', 'critical']).optional(),
  alert: z
    .object({
      level: z.enum(['warning', 'critical']),
      message: z.string(),
    })
    .nullable()
    .optional(),
});

export type MessageEnvelope = z.infer<typeof messageEnvelopeSchema>;
export type HealthMetric = z.infer<typeof healthMetricSchema>;
export type ProcessedHealthData = z.infer<typeof processedHealthDataSchema>;
