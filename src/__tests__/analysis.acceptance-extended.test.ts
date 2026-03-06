import { describe, test, expect } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { calculateRiskScore } from '../lib/risk-scoring'
import { calculateChangeMap } from '../lib/change-detection'
import { calculateUncertaintyMap } from '../lib/explainability'
import { generateDTM, generateDSM, generateCHM } from '../lib/lidar'

async function loadJson(relativePath: string) {
  const filePath = path.resolve(process.cwd(), relativePath)
  const raw = await fs.readFile(filePath, 'utf8')
  return JSON.parse(raw)
}

describe('Acceptance - Risk Scoring', () => {
  test('calculates risk score with realistic factors', async () => {
    const factors = [
      {
        name: 'elevation',
        weight: 0.3,
        values: [10, 20, 15, 25, 30, 12, 18, 22],
        normalize: 'minmax' as const,
      },
      {
        name: 'water_proximity',
        weight: 0.4,
        values: [0.1, 0.3, 0.2, 0.4, 0.15, 0.35, 0.25, 0.45],
        invert: true, // Closer to water = higher risk
      },
      {
        name: 'slope',
        weight: 0.3,
        values: [5, 10, 8, 12, 6, 11, 9, 13],
        normalize: 'minmax' as const,
      },
    ]

    const result = calculateRiskScore(factors)

    // Sanity checks
    expect(result.scores.every((s) => s >= 0 && s <= 1)).toBe(true)
    expect(result.statistics.mean).toBeGreaterThanOrEqual(0)
    expect(result.statistics.mean).toBeLessThanOrEqual(1)
    expect(result.statistics.percentiles.p50).toBeGreaterThanOrEqual(0)
    expect(result.statistics.percentiles.p95).toBeGreaterThanOrEqual(result.statistics.percentiles.p50)
  })
})

describe('Acceptance - Change Detection', () => {
  test('detects significant changes between time periods', async () => {
    const before = [0.2, 0.3, 0.4, 0.5, 0.6, 0.3, 0.4, 0.5]
    const after = [0.3, 0.4, 0.5, 0.6, 0.7, 0.4, 0.5, 0.6]
    const threshold = 0.1

    const result = calculateChangeMap(before, after, threshold, 'absolute')

    // Should detect changes
    expect(result.statistics.changedPixels).toBeGreaterThan(0)
    expect(result.statistics.changeRate).toBeGreaterThan(0)
    expect(result.statistics.changeRate).toBeLessThanOrEqual(1)
    expect(result.statistics.meanChange).toBeGreaterThan(0)
  })

  test('handles no-change scenario', async () => {
    const values = [0.2, 0.3, 0.4, 0.5]
    const result = calculateChangeMap(values, values, 0.1)

    expect(result.statistics.changedPixels).toBe(0)
    expect(result.statistics.changeRate).toBe(0)
  })
})

describe('Acceptance - Explainability', () => {
  test('calculates uncertainty for predictions', async () => {
    const predictions = [0.1, 0.3, 0.5, 0.7, 0.9]
    const confidence = [0.6, 0.7, 0.5, 0.8, 0.9]

    const result = calculateUncertaintyMap(predictions, confidence)

    // High confidence should have low uncertainty
    expect(result.uncertainty[0]).toBeGreaterThan(result.uncertainty[4]) // 0.4 > 0.1
    expect(result.metadata.meanConfidence).toBeGreaterThan(0)
    expect(result.metadata.meanUncertainty).toBeLessThan(1)
  })
})

describe('Acceptance - LiDAR DTM/DSM/CHM', () => {
  test('generates DTM and DSM with consistent dimensions', async () => {
    const points = [
      { x: 100, y: 200, z: 50 },
      { x: 101, y: 201, z: 52 },
      { x: 102, y: 202, z: 48 },
      { x: 103, y: 203, z: 55 },
      { x: 104, y: 204, z: 60 },
    ]

    const dtm = generateDTM(points, 1.0)
    const dsm = generateDSM(points, 1.0, dtm.bbox)

    // Should have same bbox and cell size
    expect(dtm.bbox).toEqual(dsm.bbox)
    expect(dtm.cellSize).toBe(dsm.cellSize)

    // Generate CHM
    const chm = generateCHM(dsm, dtm)
    expect(chm.width).toBe(dsm.width)
    expect(chm.height).toBe(dsm.height)
    expect(chm.stats.min).toBeGreaterThanOrEqual(0) // CHM should be non-negative
  })
})
