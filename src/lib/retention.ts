// TTL policy (seconds) per health record type; adjust for production policy
const DAY = 24 * 60 * 60;
const policies: Record<string, number> = {
  heart_rate: 30 * DAY,
  steps: 30 * DAY,
  walking_steadiness: 180 * DAY,
  sleep: 90 * DAY,
  activity: 90 * DAY,
  fall_event: 365 * DAY,
};

export function getTtlSecondsForType(
  type: string,
  environment?: string
): number {
  const base = policies[type] ?? 30 * DAY;
  // Shorter TTLs in development to avoid lingering data
  if (environment && environment !== 'production')
    return Math.min(base, 2 * DAY);
  return base;
}

// Minimal KV interface used for retention purge
export type KVNamespaceLite = {
  list: (opts?: {
    prefix?: string;
    limit?: number;
  }) => Promise<{ keys: Array<{ name: string }> }>;
  delete: (key: string) => Promise<void>;
};

// Purge old health data based on TTL inferred from key format: health:{type}:{iso}
export async function purgeOldHealthData(
  env: { ENVIRONMENT?: string },
  kv: KVNamespaceLite,
  opts?: { limit?: number; prefix?: string }
): Promise<{ scanned: number; deleted: number }> {
  const limit = Math.max(1, Math.min(2000, opts?.limit ?? 1000));
  const prefix = opts?.prefix ?? 'health:';
  const listing = await kv.list({ prefix, limit });
  const now = Date.now();
  let scanned = 0;
  let deleted = 0;
  for (const k of listing.keys) {
    scanned += 1;
    const parts = k.name.split(':');
    if (parts.length < 3) continue;
    const type = parts[1];
    const iso = parts.slice(2).join(':');
    const ttlSec = getTtlSecondsForType(type, env.ENVIRONMENT);
    const ts = Date.parse(iso);
    if (!Number.isFinite(ts)) continue;
    const cutoff = ts + ttlSec * 1000;
    if (now > cutoff) {
      try {
        await kv.delete(k.name);
        deleted += 1;
      } catch {
        // Ignore delete errors in purge
      }
    }
  }
  return { scanned, deleted };
}
