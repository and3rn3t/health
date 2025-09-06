/**
 * Lightweight in-memory telemetry emitter (PII-safe).
 * Only emits aggregate/system metrics – never raw health values.
 */
export interface TelemetryEvent {
  name: string;
  timestamp: string;
  data: Record<string, string | number | boolean | undefined>;
}

const MAX_BUFFER = 200;
const buffer: TelemetryEvent[] = [];
type TelemetryListener = (event: TelemetryEvent) => void;
const listeners = new Set<TelemetryListener>();

export function recordTelemetry(
  name: string,
  data: Record<string, string | number | boolean | undefined>
): void {
  const event: TelemetryEvent = {
    name,
    timestamp: new Date().toISOString(),
    data,
  };
  buffer.push(event);
  if (buffer.length > MAX_BUFFER) buffer.shift();
  // Notify listeners (try/catch isolated per listener)
  if (listeners.size) {
    for (const l of listeners) {
      try {
        l(event);
      } catch {
        /* swallow */
      }
    }
  }
  if (import.meta.env.DEV) {
    // Dev-only console emission to avoid noise in production logs
    // Redact any suspicious keys defensively
    const blocked = /value|payload|health|steps|heart|sleep|raw|record/i;
    const safe: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(data)) {
      safe[k] = blocked.test(k) ? '[redacted]' : v;
    }
    console.debug('[telemetry]', name, safe);
  }
}

export function getTelemetryBuffer(filterName?: string): TelemetryEvent[] {
  if (!filterName) return [...buffer];
  return buffer.filter((e) => e.name === filterName);
}

export function subscribeTelemetry(listener: TelemetryListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export interface NormalizationCacheStats {
  size: number;
  hits: number;
  misses: number;
  entries: Array<{ key: string; hits: number; lastAccess: number }>;
  hitRate: number;
}

// These setters will be wired by normalization utility (avoid circular import)
let statsProvider: (() => NormalizationCacheStats) | null = null;
export function registerNormalizationStatsProvider(
  fn: () => NormalizationCacheStats
): void {
  statsProvider = fn;
}

export function getNormalizationStats(): NormalizationCacheStats | null {
  return statsProvider ? statsProvider() : null;
}
