// Shared type definitions for the health monitoring app

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  isPrimary: boolean;
}

export interface HealthMetric {
  value: number;
  date: string;
  unit?: string;
}

// LEGACY NOTICE:
// The legacy ProcessedHealthData interface below has been superseded by the
// zod schema-defined type exported from `@/schemas/health` and the richer
// analytics structure in `@/lib/healthDataProcessor`.
// To avoid silent divergence, we no longer define a conflicting interface here.
// Downstream code should import:
//   import type { ProcessedHealthData } from '@/schemas/health'
// or for the aggregated analytics object:
//   import type { ProcessedHealthData as ProcessorHealthData } from '@/lib/healthDataProcessor'
// Keeping Contact & HealthMetric for shared simple uses.

// Re-export the aggregated analytics structure (with metrics/time-series) as ProcessedHealthData
// to remain backward compatible with existing components.
export type { ProcessedHealthData } from '@/lib/healthDataProcessor';

// Provide an alias for the event-level processed record (single reading) defined by the zod schema.
// Use this when working with streaming or batch ingestion of individual metric records.
export type { ProcessedHealthData as ProcessedHealthRecord } from '@/schemas/health';
