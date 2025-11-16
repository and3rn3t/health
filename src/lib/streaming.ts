/**
 * Streaming/chunked processing utilities for large arrays
 */

export interface ChunkedStats {
  min: number
  max: number
  sum: number
  count: number
  sumSq: number
}

/**
 * Initialize empty chunked stats accumulator
 */
export function initChunkedStats(): ChunkedStats {
  return { min: Infinity, max: -Infinity, sum: 0, count: 0, sumSq: 0 }
}

/**
 * Update chunked stats with a chunk of values
 */
export function updateChunkedStats(acc: ChunkedStats, values: number[]): ChunkedStats {
  for (const v of values) {
    if (!Number.isFinite(v)) continue
    if (v < acc.min) acc.min = v
    if (v > acc.max) acc.max = v
    acc.sum += v
    acc.count++
    acc.sumSq += v * v
  }
  return acc
}

/**
 * Finalize chunked stats to get mean and std
 */
export function finalizeChunkedStats(acc: ChunkedStats): {
  min: number
  max: number
  mean: number
  std: number
  count: number
} {
  if (acc.count === 0) {
    return { min: NaN, max: NaN, mean: NaN, std: NaN, count: 0 }
  }
  const mean = acc.sum / acc.count
  const variance = acc.count > 1 ? (acc.sumSq / acc.count) - mean * mean : 0
  const std = Math.sqrt(Math.max(0, variance))
  return {
    min: acc.min === Infinity ? NaN : acc.min,
    max: acc.max === -Infinity ? NaN : acc.max,
    mean,
    std,
    count: acc.count,
  }
}

/**
 * Compute histogram in chunks (for large arrays)
 */
export function computeHistogramChunked(
  values: number[],
  bins: number,
  range: { min: number; max: number },
  chunkSize = 10000
): number[] {
  const counts = new Array(bins).fill(0)
  const width = (range.max - range.min) / bins

  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, Math.min(i + chunkSize, values.length))
    for (const v of chunk) {
      if (!Number.isFinite(v)) continue
      if (v < range.min || v > range.max) continue
      let idx = Math.floor((v - range.min) / width)
      if (idx === bins) idx = bins - 1
      if (idx >= 0 && idx < bins) counts[idx]++
    }
  }
  return counts
}

/**
 * Parse array from text (CSV, space-separated, newline-separated) in chunks
 */
export function parseArrayChunked(
  text: string,
  chunkSize = 10000
): { values: number[]; errors: string[] } {
  const values: number[] = []
  const errors: string[] = []
  // Normalize separators: commas, spaces, newlines
  const parts = text
    .split(/[,\s\n\r]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0)

  for (let i = 0; i < parts.length; i += chunkSize) {
    const chunk = parts.slice(i, Math.min(i + chunkSize, parts.length))
    for (const part of chunk) {
      const num = Number(part)
      if (Number.isFinite(num)) {
        values.push(num)
      } else if (part.length > 0) {
        errors.push(`Invalid number at position ${i + chunk.indexOf(part)}: "${part}"`)
      }
    }
  }
  return { values, errors }
}
