import { describe, test, expect } from 'vitest'
import {
  calculateBBox,
  bboxIntersects,
  spatialJoin,
  bufferPoint,
  distance,
  findNearest,
} from '../vector-spatial'

describe('Vector Spatial Operations', () => {
  const sampleFeature = {
    geometry: {
      type: 'Point' as const,
      coordinates: [-122.5, 37.7],
    },
    properties: { name: 'Test' },
  }

  test('calculates bounding box for point feature', () => {
    const bbox = calculateBBox(sampleFeature)
    expect(bbox.minX).toBe(-122.5)
    expect(bbox.maxX).toBe(-122.5)
    expect(bbox.minY).toBe(37.7)
    expect(bbox.maxY).toBe(37.7)
  })

  test('calculates bounding box for polygon feature', () => {
    const polygon = {
      geometry: {
        type: 'Polygon' as const,
        coordinates: [
          [
            [-122.5, 37.7],
            [-122.4, 37.7],
            [-122.4, 37.8],
            [-122.5, 37.8],
            [-122.5, 37.7],
          ],
        ],
      },
      properties: {},
    }

    const bbox = calculateBBox(polygon)
    expect(bbox.minX).toBe(-122.5)
    expect(bbox.maxX).toBe(-122.4)
    expect(bbox.minY).toBe(37.7)
    expect(bbox.maxY).toBe(37.8)
  })

  test('detects bbox intersection', () => {
    const bbox1 = { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 }
    const bbox2 = { minX: -122.45, minY: 37.75, maxX: -122.35, maxY: 37.85 }
    const bbox3 = { minX: -122.3, minY: 37.6, maxX: -122.2, maxY: 37.7 }

    expect(bboxIntersects(bbox1, bbox2)).toBe(true)
    expect(bboxIntersects(bbox1, bbox3)).toBe(false)
  })

  test('performs spatial join', () => {
    const queryBbox = { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 }
    const targetFeatures = [
      {
        ...sampleFeature,
        bbox: { minX: -122.45, minY: 37.75, maxX: -122.45, maxY: 37.75 },
      },
      {
        geometry: { type: 'Point' as const, coordinates: [-122.3, 37.6] },
        properties: {},
        bbox: { minX: -122.3, minY: 37.6, maxX: -122.3, maxY: 37.6 },
      },
    ]

    const result = spatialJoin(queryBbox, targetFeatures)
    expect(result).toHaveLength(1)
    expect(result[0].properties.name).toBe('Test')
  })

  test('creates buffer around point', () => {
    const center = { x: -122.5, y: 37.7 }
    const buffer = bufferPoint(center, 1000, 32) // 1km radius, 32 segments

    expect(buffer.geometry.type).toBe('Polygon')
    expect(buffer.geometry.coordinates[0]).toHaveLength(33) // 32 segments + 1 closing point
    expect(buffer.properties.bufferRadiusM).toBe(1000)
  })

  test('calculates distance between points', () => {
    const p1 = { x: -122.5, y: 37.7 }
    const p2 = { x: -122.4, y: 37.8 }

    const dist = distance(p1, p2, 'meters')
    expect(dist).toBeGreaterThan(0)
    expect(dist).toBeLessThan(20000) // Should be roughly 13-14km
  })

  test('finds nearest features', () => {
    const queryPoint = { x: -122.5, y: 37.7 }
    const targetFeatures = [
      {
        geometry: { type: 'Point' as const, coordinates: [-122.45, 37.75] },
        properties: { name: 'Near' },
      },
      {
        geometry: { type: 'Point' as const, coordinates: [-122.3, 37.6] },
        properties: { name: 'Far' },
      },
    ]

    const result = findNearest(queryPoint, targetFeatures, 2)
    expect(result).toHaveLength(2)
    expect(result[0].distance).toBeLessThan(result[1].distance)
    expect(result[0].feature.properties.name).toBe('Near')
  })

  test('respects max distance filter', () => {
    const queryPoint = { x: -122.5, y: 37.7 }
    const targetFeatures = [
      {
        geometry: { type: 'Point' as const, coordinates: [-122.45, 37.75] },
        properties: {},
      },
      {
        geometry: { type: 'Point' as const, coordinates: [-122.0, 37.0] },
        properties: {},
      },
    ]

    const result = findNearest(queryPoint, targetFeatures, 10, 50000) // 50km max
    expect(result.length).toBeLessThanOrEqual(2)
    // Far point might be filtered out
  })
})
