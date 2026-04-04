import { describe, test, expect } from 'vitest'
import { calculateChangeMap, calculateMultiTemporalChange } from '../change-detection'

describe('Change Detection', () => {
  test('detects changes using absolute method', () => {
    const before = [0.2, 0.3, 0.4, 0.5, 0.6]
    const after = [0.3, 0.4, 0.5, 0.6, 0.7]
    const threshold = 0.1

    const result = calculateChangeMap(before, after, threshold, 'absolute')

    expect(result.changeMap).toHaveLength(5)
    expect(result.changeMagnitude).toHaveLength(5)
    expect(result.statistics.changedPixels).toBeGreaterThan(0)
    expect(result.statistics.changeRate).toBeGreaterThanOrEqual(0)
    expect(result.statistics.changeRate).toBeLessThanOrEqual(1)
  })

  test('detects changes using relative method', () => {
    const before = [10, 20, 30]
    const after = [15, 25, 35]
    const threshold = 0.2

    const result = calculateChangeMap(before, after, threshold, 'relative')

    expect(result.changeMap.every((v) => v === 0 || v === 1)).toBe(true)
    expect(result.statistics.meanChange).toBeGreaterThanOrEqual(0)
  })

  test('detects changes using normalized difference', () => {
    const before = [0.2, 0.4, 0.6]
    const after = [0.3, 0.5, 0.7]
    const threshold = 0.05

    const result = calculateChangeMap(before, after, threshold, 'normalized')

    expect(result.changeMap).toHaveLength(3)
    expect(result.changeMagnitude.every((m) => m >= 0)).toBe(true)
  })

  test('handles NaN values gracefully', () => {
    const before = [0.2, NaN, 0.4]
    const after = [0.3, 0.5, NaN]

    const result = calculateChangeMap(before, after, 0.1)

    expect(result.changeMap[1]).toBe(0) // NaN should be marked as no-change
    expect(result.changeMap[2]).toBe(0)
  })

  test('calculates multi-temporal change', () => {
    const timeSeries = [
      { time: 2020, values: [0.2, 0.3, 0.4] },
      { time: 2021, values: [0.3, 0.4, 0.5] },
      { time: 2022, values: [0.4, 0.5, 0.6] },
    ]

    const result = calculateMultiTemporalChange(timeSeries, 0.1)

    expect(result.changePoints).toHaveLength(2) // 2020->2021, 2021->2022
    expect(result.overallChange).toBeDefined()
    expect(result.overallChange.statistics.changedPixels).toBeGreaterThanOrEqual(0)
  })

  test('throws error for insufficient time periods', () => {
    const timeSeries = [{ time: 2020, values: [0.2, 0.3] }]

    expect(() => calculateMultiTemporalChange(timeSeries, 0.1)).toThrow(
      'At least two time periods'
    )
  })
})
