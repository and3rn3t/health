// TTL policy (seconds) per health record type; adjust for production policy
const DAY = 24 * 60 * 60
const policies: Record<string, number> = {
  heart_rate: 30 * DAY,
  steps: 30 * DAY,
  walking_steadiness: 180 * DAY,
  sleep: 90 * DAY,
  activity: 90 * DAY,
  fall_event: 365 * DAY,
}

export function getTtlSecondsForType(type: string, environment?: string): number {
  const base = policies[type] ?? 30 * DAY
  // Shorter TTLs in development to avoid lingering data
  if (environment && environment !== 'production') return Math.min(base, 2 * DAY)
  return base
}
