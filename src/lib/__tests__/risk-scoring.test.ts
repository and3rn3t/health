import { describe, test, expect } from 'vitest'
import { calculateRiskScore } from '../risk-scoring'

describe('Risk Scoring', () => {
  test('calculates weighted composite score from multiple factors', () => {
    const factors = [
      { name: 'elevation', weight: 0.3, values: [10, 20, 15, 25] },
      { name: 'water_proximity', weight: 0.4, values: [0.1, 0.3, 0.2, 0.4], invert: true },
      { name: 'slope', weight: 0.3, values: [5, 10, 8, 12] },
    ]

    const result = calculateRiskScore(factors)

    expect(result.scores).toHaveLength(4)
    expect(result.scores.every((s) => s >= 0 && s <= 1)).toBe(true)
    expect(result.factors).toHaveLength(3)
    expect(result.statistics.min).toBeGreaterThanOrEqual(0)
    expect(result.statistics.max).toBeLessThanOrEqual(1)
    expect(result.metadata.factorCount).toBe(3)
    expect(result.metadata.totalWeight).toBeGreaterThan(0)
  })

  test('handles min-max normalization', () => {
    const factors = [
      { name: 'factor1', weight: 1, values: [0, 50, 100], normalize: 'minmax' as const },
    ]

    const result = calculateRiskScore(factors)
    expect(result.factors[0].normalizedValues[0]).toBe(0)
    expect(result.factors[0].normalizedValues[2]).toBe(1)
  })

  test('handles factor inversion', () => {
    const factors = [
      { name: 'factor1', weight: 1, values: [0.1, 0.5, 0.9], invert: true },
    ]

    const result = calculateRiskScore(factors)
    // Inverted: high values become low risk
    expect(result.factors[0].normalizedValues[0]).toBeGreaterThan(
      result.factors[0].normalizedValues[2]
    )
  })

  test('throws error for mismatched factor lengths', () => {
    const factors = [
      { name: 'factor1', weight: 1, values: [1, 2, 3] },
      { name: 'factor2', weight: 1, values: [1, 2] }, // Different length
    ]

    expect(() => calculateRiskScore(factors)).toThrow('same length')
  })

  test('calculates percentiles correctly', () => {
    const factors = [
      { name: 'factor1', weight: 1, values: Array.from({ length: 100 }, (_, i) => i) },
    ]

    const result = calculateRiskScore(factors)
    expect(result.statistics.percentiles.p50).toBeGreaterThanOrEqual(0.4)
    expect(result.statistics.percentiles.p50).toBeLessThanOrEqual(0.6)
    expect(result.statistics.percentiles.p95).toBeGreaterThan(result.statistics.percentiles.p50)
  })
})
