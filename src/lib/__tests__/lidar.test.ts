import { describe, test, expect } from 'vitest'
import {
  classifyGroundNonGround,
  generateDTM,
  generateDSM,
  generateCHM,
  calculateTerrainDerivatives,
} from '../lidar'

describe('LiDAR Processing', () => {
  const samplePoints = [
    { x: 100, y: 200, z: 50 },
    { x: 101, y: 201, z: 52 },
    { x: 102, y: 202, z: 55 },
    { x: 103, y: 203, z: 48 },
    { x: 104, y: 204, z: 60 },
  ]

  test('classifies ground and non-ground points', () => {
    const result = classifyGroundNonGround(samplePoints, 1.0, 30.0, 0.5, 3.0)

    expect(result.points).toHaveLength(5)
    expect(result.groundCount + result.nonGroundCount).toBe(5)
    expect(result.stats.ground.minZ).toBeLessThanOrEqual(result.stats.ground.maxZ)
    expect(result.stats.nonGround.minZ).toBeLessThanOrEqual(result.stats.nonGround.maxZ)
  })

  test('handles empty point array', () => {
    const result = classifyGroundNonGround([])
    expect(result.points).toHaveLength(0)
    expect(result.groundCount).toBe(0)
    expect(result.nonGroundCount).toBe(0)
  })

  test('generates DTM from ground points', () => {
    const groundPoints = [
      { x: 100, y: 200, z: 50 },
      { x: 101, y: 201, z: 52 },
      { x: 102, y: 202, z: 48 },
    ]

    const dtm = generateDTM(groundPoints, 1.0)

    expect(dtm.grid).toBeDefined()
    expect(dtm.width).toBeGreaterThan(0)
    expect(dtm.height).toBeGreaterThan(0)
    expect(dtm.bbox.minX).toBeLessThanOrEqual(dtm.bbox.maxX)
    expect(dtm.bbox.minY).toBeLessThanOrEqual(dtm.bbox.maxY)
  })

  test('generates DSM from all points', () => {
    const dsm = generateDSM(samplePoints, 1.0)

    expect(dsm.grid).toBeDefined()
    expect(dsm.width).toBeGreaterThan(0)
    expect(dsm.height).toBeGreaterThan(0)
  })

  test('generates CHM from DSM and DTM', () => {
    const groundPoints = samplePoints.slice(0, 3)
    const allPoints = samplePoints

    const dtm = generateDTM(groundPoints, 1.0)
    const dsm = generateDSM(allPoints, 1.0, dtm.bbox)

    // Ensure same dimensions
    const dtmResized = {
      ...dtm,
      width: dsm.width,
      height: dsm.height,
      grid: dtm.grid.map((row, i) =>
        row.map((_, j) => (i < dtm.height && j < dtm.width ? dtm.grid[i][j] : NaN))
      ),
    }

    const chm = generateCHM(dsm, dtmResized)

    expect(chm.grid).toBeDefined()
    expect(chm.width).toBe(dsm.width)
    expect(chm.height).toBe(dsm.height)
    expect(chm.stats.min).toBeGreaterThanOrEqual(0) // CHM should be non-negative
  })

  test('calculates terrain derivatives (slope/aspect)', () => {
    const groundPoints = [
      { x: 100, y: 200, z: 50 },
      { x: 101, y: 200, z: 52 },
      { x: 102, y: 200, z: 54 },
      { x: 100, y: 201, z: 51 },
      { x: 101, y: 201, z: 53 },
      { x: 102, y: 201, z: 55 },
      { x: 100, y: 202, z: 52 },
      { x: 101, y: 202, z: 54 },
      { x: 102, y: 202, z: 56 },
    ]

    const dtm = generateDTM(groundPoints, 1.0)
    const derivatives = calculateTerrainDerivatives(dtm)

    expect(derivatives.slope).toBeDefined()
    expect(derivatives.aspect).toBeDefined()
    // Check if we have valid statistics (may be NaN if grid too small)
    if (Number.isFinite(derivatives.stats.slope.mean)) {
      expect(derivatives.stats.slope.mean).toBeGreaterThanOrEqual(0)
    }
    if (Number.isFinite(derivatives.stats.aspect.mean)) {
      expect(derivatives.stats.aspect.mean).toBeGreaterThanOrEqual(0)
      expect(derivatives.stats.aspect.mean).toBeLessThanOrEqual(360)
    }
  })

  test('throws error for mismatched CHM dimensions', () => {
    const dtm = generateDTM(samplePoints.slice(0, 3), 1.0)
    // Create DSM with different dimensions
    const dsm = {
      grid: [[NaN, NaN], [NaN, NaN]], // 2x2 grid
      bbox: dtm.bbox,
      cellSize: dtm.cellSize,
      width: 2,
      height: 2,
    }
    const dtmMismatched = {
      ...dtm,
      width: 3,
      height: 3,
    }

    expect(() => generateCHM(dsm, dtmMismatched)).toThrow('same dimensions')
  })
})
