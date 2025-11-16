/**
 * Risk scoring index MVP
 * Weighted composite scoring from multiple environmental factors
 */

export interface RiskFactor {
  name: string
  weight: number
  values: number[]
  normalize?: 'minmax' | 'zscore' | 'none'
  invert?: boolean // If true, higher values = lower risk
}

export interface RiskScoreResult {
  scores: number[]
  factors: Array<{
    name: string
    weight: number
    normalizedValues: number[]
    contribution: number[]
  }>
  statistics: {
    min: number
    max: number
    mean: number
    std: number
    percentiles: {
      p25: number
      p50: number
      p75: number
      p90: number
      p95: number
    }
  }
  metadata: {
    totalWeight: number
    factorCount: number
  }
}

/**
 * Normalize values using min-max scaling
 */
function normalizeMinMax(values: number[]): number[] {
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = max - min
  if (range === 0) return values.map(() => 0.5)
  return values.map((v) => (v - min) / range)
}

/**
 * Normalize values using z-score
 */
function normalizeZScore(values: number[]): number[] {
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  const std = Math.sqrt(variance)
  if (std === 0) return values.map(() => 0.5)
  return values.map((v) => (v - mean) / std)
}

/**
 * Calculate risk score from multiple weighted factors
 */
export function calculateRiskScore(factors: RiskFactor[]): RiskScoreResult {
  if (factors.length === 0) {
    throw new Error('At least one risk factor required')
  }

  // Validate all factors have same length
  const length = factors[0].values.length
  for (const factor of factors) {
    if (factor.values.length !== length) {
      throw new Error(`All factors must have same length. Factor "${factor.name}" has length ${factor.values.length}, expected ${length}`)
    }
  }

  // Normalize each factor
  const normalizedFactors = factors.map((factor) => {
    let normalized: number[]
    switch (factor.normalize || 'minmax') {
      case 'minmax':
        normalized = normalizeMinMax(factor.values)
        break
      case 'zscore':
        normalized = normalizeZScore(factor.values)
        // Convert z-scores to [0, 1] range (assuming normal distribution)
        normalized = normalized.map((z) => {
          // Use cumulative distribution function approximation
          const t = 1 / (1 + 0.2316419 * Math.abs(z))
          const d = 0.3989423 * Math.exp(-(z * z) / 2)
          const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))))
          return z < 0 ? p : 1 - p
        })
        break
      default:
        normalized = factor.values.map((v) => (Number.isFinite(v) ? v : 0))
    }

    // Invert if needed (higher values = lower risk)
    if (factor.invert) {
      normalized = normalized.map((v) => 1 - v)
    }

    // Clip to [0, 1]
    normalized = normalized.map((v) => Math.max(0, Math.min(1, v)))

    return {
      name: factor.name,
      weight: factor.weight,
      normalizedValues: normalized,
    }
  })

  // Calculate total weight
  const totalWeight = normalizedFactors.reduce((sum, f) => sum + f.weight, 0)
  if (totalWeight === 0) {
    throw new Error('Total weight cannot be zero')
  }

  // Calculate weighted composite score
  const scores: number[] = []
  const contributions: Array<number[]> = []

  for (let i = 0; i < length; i++) {
    let weightedSum = 0
    const contribs: number[] = []

    for (const factor of normalizedFactors) {
      const contribution = (factor.normalizedValues[i] * factor.weight) / totalWeight
      weightedSum += contribution
      contribs.push(contribution)
    }

    scores.push(Math.max(0, Math.min(1, weightedSum)))
    contributions.push(contribs)
  }

  // Calculate statistics
  const validScores = scores.filter(Number.isFinite)
  const sorted = [...validScores].sort((a, b) => a - b)

  const statistics = {
    min: sorted[0] ?? 0,
    max: sorted[sorted.length - 1] ?? 0,
    mean: validScores.reduce((a, b) => a + b, 0) / validScores.length,
    std: Math.sqrt(
      validScores.reduce((sum, s) => {
        const mean = validScores.reduce((a, b) => a + b, 0) / validScores.length
        return sum + (s - mean) ** 2
      }, 0) / validScores.length
    ),
    percentiles: {
      p25: sorted[Math.floor(sorted.length * 0.25)] ?? 0,
      p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
      p75: sorted[Math.floor(sorted.length * 0.75)] ?? 0,
      p90: sorted[Math.floor(sorted.length * 0.9)] ?? 0,
      p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0,
    },
  }

  return {
    scores,
    factors: normalizedFactors.map((f, idx) => ({
      name: f.name,
      weight: f.weight,
      normalizedValues: f.normalizedValues,
      contribution: contributions.map((c) => c[idx]),
    })),
    statistics,
    metadata: {
      totalWeight,
      factorCount: factors.length,
    },
  }
}
