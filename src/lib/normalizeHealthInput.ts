import { aggregateHealthRecords } from '@/lib/aggregateHealthRecords';
import type { MetricData, ProcessedHealthData } from '@/lib/healthDataProcessor';
import { recordTelemetry, registerNormalizationStatsProvider } from '@/lib/telemetry';
import type { ProcessedHealthRecord } from '@/types';

// Simple in-memory LRU-style cache for aggregated record sets
interface AggregationCacheEntry {
  key: string;
  aggregated: ReturnType<typeof aggregateHealthRecords>;
  lastAccess: number;
  hits: number;
}

const AGGREGATION_CACHE_LIMIT = 50;
const aggregationCache: Map<string, AggregationCacheEntry> = new Map();
let cacheHits = 0;
let cacheMisses = 0;

function buildRecordsSignature(records: ProcessedHealthRecord[]): string {
  if (!records.length) return 'empty';
  const sorted = [...records].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
  const first = sorted[0].timestamp;
  const last = sorted[sorted.length - 1].timestamp;
  // Sample up to first 20 records to keep key small
  const sample = sorted.slice(0, 20);
  const parts: string[] = [String(records.length), first, last];
  for (const r of sample) {
    parts.push(r.type, Number.isFinite(r.value) ? String(Math.round(r.value * 100) / 100) : 'na');
  }
  return parts.join('|');
}

function getCachedAggregation(records: ProcessedHealthRecord[]): ReturnType<typeof aggregateHealthRecords> {
  const key = buildRecordsSignature(records);
  const entry = aggregationCache.get(key);
  if (entry) {
    entry.lastAccess = Date.now();
    entry.hits++;
    cacheHits++;
    recordTelemetry('normalization_cache', {
      event: 'hit',
      size: aggregationCache.size,
      hits: cacheHits,
      misses: cacheMisses,
    });
    return entry.aggregated;
  }
  const aggregated = aggregateHealthRecords(records);
  cacheMisses++;
  // Enforce size limit (remove least recently accessed)
  if (aggregationCache.size >= AGGREGATION_CACHE_LIMIT) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [k, v] of aggregationCache.entries()) {
      if (v.lastAccess < oldestTime) {
        oldestTime = v.lastAccess;
        oldestKey = k;
      }
    }
    if (oldestKey) aggregationCache.delete(oldestKey);
  }
  aggregationCache.set(key, { key, aggregated, lastAccess: Date.now(), hits: 1 });
  recordTelemetry('normalization_cache', {
    event: 'miss',
    size: aggregationCache.size,
    hits: cacheHits,
    misses: cacheMisses,
  });
  return aggregated;
}

export function clearNormalizationCache(): void {
  aggregationCache.clear();
  cacheHits = 0;
  cacheMisses = 0;
  recordTelemetry('normalization_cache', { event: 'cleared', size: 0, hits: 0, misses: 0 });
}

// Register stats provider for external inspection
registerNormalizationStatsProvider(() => ({
  size: aggregationCache.size,
  hits: cacheHits,
  misses: cacheMisses,
  hitRate: cacheHits + cacheMisses === 0 ? 0 : cacheHits / (cacheHits + cacheMisses),
  entries: Array.from(aggregationCache.values())
    .sort((a, b) => b.hits - a.hits)
    .slice(0, 10)
    .map((e) => ({ key: e.key, hits: e.hits, lastAccess: e.lastAccess })),
}));

export function isProcessedHealthData(obj: unknown): obj is ProcessedHealthData {
  return !!obj && typeof obj === 'object' && 'metrics' in obj && 'lastUpdated' in obj;
}

/**
 * Normalize raw record(s) or already-aggregated snapshot into a ProcessedHealthData analytics snapshot.
 * Lightweight aggregation only; caller layers can perform richer feature extraction later.
 */
export function normalizeToHealthData(
  input: ProcessedHealthData | ProcessedHealthRecord | ProcessedHealthRecord[],
  options: { bypassCache?: boolean } = {}
): ProcessedHealthData {
  if (isProcessedHealthData(input)) return input;
  const records = Array.isArray(input) ? input : [input];
  const agg = options.bypassCache ? aggregateHealthRecords(records) : getCachedAggregation(records);
  // Always emit a fresh snapshot object to keep lastUpdated meaningful
  const now = new Date().toISOString();
  const toMetric = (avg: number): MetricData => ({
    daily: [],
    weekly: [],
    monthly: [],
    average: avg,
    trend: 'stable',
    variability: 0,
    reliability: 100,
    lastValue: avg,
    percentileRank: 50,
  });
  return {
    lastUpdated: now,
    dataQuality: {
      completeness: 100,
      consistency: 100,
      recency: 100,
      overall: 'good',
    },
    metrics: {
      steps: toMetric(agg.averageSteps),
      heartRate: toMetric(agg.averageHeartRate),
      walkingSteadiness: toMetric(agg.averageWalkingSteadiness),
      sleepHours: toMetric(0),
    },
    insights: [],
    fallRiskFactors: [],
    healthScore: 100 - Math.max(agg.riskScores.fallRisk, agg.riskScores.cardiovascularRisk) * 0.5,
  };
}
