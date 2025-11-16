import { describe, test, expect } from 'vitest'
import { extractBuildings, extractTrees } from '../features'

describe('Feature Extraction', () => {
  // Create a simple CHM grid with some buildings and trees
  const createCHM = (width: number, height: number, cellSize: number) => {
    const grid: number[][] = []
    for (let row = 0; row < height; row++) {
      const rowData: number[] = []
      for (let col = 0; col < width; col++) {
        // Create some patterns: buildings (high, flat) and trees (moderate, variable)
        if (row >= 5 && row < 10 && col >= 5 && col < 10) {
          rowData.push(5.0) // Building area
        } else if (row >= 15 && row < 18 && col >= 15 && col < 18) {
          rowData.push(3.0) // Tree area
        } else {
          rowData.push(0.5) // Ground
        }
      }
      grid.push(rowData)
    }

    return {
      grid,
      bbox: { minX: 0, minY: 0, maxX: width * cellSize, maxY: height * cellSize },
      cellSize,
      width,
      height,
    }
  }

  test('extracts buildings from CHM', () => {
    const chm = createCHM(20, 20, 1.0)
    const buildings = extractBuildings(chm, 2.5, 20.0, 15.0)

    expect(buildings.length).toBeGreaterThan(0)
    expect(buildings.every((b) => b.type === 'building')).toBe(true)
    expect(buildings.every((b) => b.height >= 2.5)).toBe(true)
    expect(buildings.every((b) => b.area >= 20.0)).toBe(true)
  })

  test('extracts trees from CHM', () => {
    const chm = createCHM(20, 20, 1.0)
    const trees = extractTrees(chm, 1.5, 50.0, 2.0, 500.0)

    expect(trees.length).toBeGreaterThan(0)
    expect(trees.every((t) => t.type === 'tree')).toBe(true)
    expect(trees.every((t) => t.height >= 1.5 && t.height <= 50.0)).toBe(true)
  })

  test('respects minimum area thresholds', () => {
    const chm = createCHM(20, 20, 1.0)
    const buildings = extractBuildings(chm, 2.5, 100.0, 15.0) // High min area

    // Should filter out small features
    expect(buildings.every((b) => b.area >= 100.0)).toBe(true)
  })

  test('calculates feature properties correctly', () => {
    const chm = createCHM(20, 20, 1.0)
    const buildings = extractBuildings(chm, 2.5, 20.0, 15.0)

    if (buildings.length > 0) {
      const b = buildings[0]
      expect(b.bbox.minX).toBeLessThanOrEqual(b.bbox.maxX)
      expect(b.bbox.minY).toBeLessThanOrEqual(b.bbox.maxY)
      expect(b.confidence).toBeGreaterThanOrEqual(0)
      expect(b.confidence).toBeLessThanOrEqual(1)
      expect(b.properties).toBeDefined()
    }
  })
})
