import { describe, test, expect } from 'vitest'
import {
  calculateUncertaintyMap,
  calculateFeatureImportance,
  calculateFeatureAttribution,
} from '../explainability'

describe('Explainability - Uncertainty', () => {
  test('calculates uncertainty from predictions', () => {
    const predictions = [0.2, 0.8, 0.5, 0.9, 0.1]
    const result = calculateUncertaintyMap(predictions)

    expect(result.values).toEqual(predictions)
    expect(result.confidence).toHaveLength(5)
    expect(result.uncertainty).toHaveLength(5)
    expect(result.confidence.every((c) => c >= 0 && c <= 1)).toBe(true)
    expect(result.uncertainty.every((u) => u >= 0 && u <= 1)).toBe(true)
  })

  test('uses provided confidence values', () => {
    const predictions = [0.5, 0.5, 0.5]
    const confidence = [0.9, 0.5, 0.1]
    const result = calculateUncertaintyMap(predictions, confidence)

    expect(result.confidence).toEqual(confidence)
    expect(result.uncertainty[0]).toBeCloseTo(0.1, 5) // 1 - 0.9
    expect(result.uncertainty[2]).toBeCloseTo(0.9, 5) // 1 - 0.1
  })

  test('calculates metadata statistics', () => {
    const predictions = [0.1, 0.5, 0.9]
    const confidence = [0.8, 0.5, 0.9]
    const result = calculateUncertaintyMap(predictions, confidence)

    expect(result.metadata.meanConfidence).toBeGreaterThan(0)
    expect(result.metadata.meanConfidence).toBeLessThanOrEqual(1)
    expect(result.metadata.meanUncertainty).toBeGreaterThan(0)
    expect(result.metadata.meanUncertainty).toBeLessThanOrEqual(1)
  })
})

describe('Explainability - Feature Importance', () => {
  test('calculates feature importance from multiple features', () => {
    const features = [
      { name: 'NDVI', values: [0.3, 0.5, 0.4, 0.6] },
      { name: 'elevation', values: [100, 200, 150, 250] },
      { name: 'slope', values: [5, 10, 8, 12] },
    ]

    const result = calculateFeatureImportance(features)

    expect(result).toHaveLength(3)
    expect(result[0].relativeImportance).toBeGreaterThanOrEqual(0)
    expect(result[0].relativeImportance).toBeLessThanOrEqual(1)
    // Relative importance should sum to 1
    const total = result.reduce((sum, f) => sum + f.relativeImportance, 0)
    expect(total).toBeCloseTo(1, 5)
  })

  test('sorts features by importance (descending)', () => {
    const features = [
      { name: 'low', values: [1, 1, 1, 1] },
      { name: 'high', values: [100, 100, 100, 100] },
    ]

    const result = calculateFeatureImportance(features)
    expect(result[0].feature).toBe('high')
    expect(result[0].importance).toBeGreaterThan(result[1].importance)
  })

  test('handles weighted features', () => {
    const features = [
      { name: 'feature1', values: [1, 2, 3], weights: [1, 1, 1] },
      { name: 'feature2', values: [1, 2, 3], weights: [2, 2, 2] },
    ]

    const result = calculateFeatureImportance(features)
    expect(result[0].importance).toBeGreaterThan(result[1].importance)
  })
})

describe('Explainability - Feature Attribution', () => {
  test('calculates feature attribution', () => {
    const features = [
      { name: 'factor1', value: 0.8, weight: 0.5 },
      { name: 'factor2', value: 0.6, weight: 0.3 },
      { name: 'factor3', value: 0.4, weight: 0.2 },
    ]

    const result = calculateFeatureAttribution(0.7, features)

    expect(result).toHaveLength(3)
    expect(result.every((a) => a.attribution >= 0 && a.attribution <= 1)).toBe(true)
    expect(result.every((a) => a.percentage >= 0 && a.percentage <= 100)).toBe(true)
  })

  test('sorts attributions by contribution (descending)', () => {
    const features = [
      { name: 'low', value: 0.1, weight: 0.1 },
      { name: 'high', value: 0.9, weight: 0.9 },
    ]

    const result = calculateFeatureAttribution(0.5, features)
    expect(result[0].feature).toBe('high')
    expect(result[0].attribution).toBeGreaterThan(result[1].attribution)
  })
})
