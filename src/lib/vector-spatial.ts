/**
 * Vector spatial operations: joins, buffers, proximity
 */

export interface Point {
  x: number
  y: number
}

export interface BBox {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface Feature {
  id?: string | number
  geometry: {
    type: 'Point' | 'LineString' | 'Polygon'
    coordinates: number[] | number[][] | number[][][]
  }
  properties: Record<string, any>
  bbox?: BBox
}

/**
 * Calculate bounding box for a feature
 */
export function calculateBBox(feature: Feature): BBox {
  const coords = feature.geometry.coordinates
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity

  function processCoord(coord: number | number[] | number[][] | number[][][]) {
    if (typeof coord === 'number') return
    if (Array.isArray(coord)) {
      if (coord.length > 0 && typeof coord[0] === 'number') {
        // Point: [x, y]
        const [x, y] = coord as number[]
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      } else {
        // Nested arrays
        coord.forEach(processCoord)
      }
    }
  }

  processCoord(coords)
  return { minX, minY, maxX, maxY }
}

/**
 * Check if two bounding boxes intersect
 */
export function bboxIntersects(bbox1: BBox, bbox2: BBox): boolean {
  return !(
    bbox1.maxX < bbox2.minX ||
    bbox1.minX > bbox2.maxX ||
    bbox1.maxY < bbox2.minY ||
    bbox1.minY > bbox2.maxY
  )
}

/**
 * Spatial join: find features in target that intersect with query bbox
 */
export function spatialJoin(
  queryBbox: BBox,
  targetFeatures: Feature[]
): Feature[] {
  return targetFeatures.filter((feature) => {
    const bbox = feature.bbox || calculateBBox(feature)
    return bboxIntersects(queryBbox, bbox)
  })
}

/**
 * Create a buffer around a point (simple circular buffer)
 * Returns a polygon approximation
 */
export function bufferPoint(
  center: Point,
  radiusMeters: number,
  segments = 32
): Feature {
  // Simple approximation: assume 1 degree ≈ 111km at equator
  // For more accuracy, would need proper CRS transformation
  const radiusDegrees = radiusMeters / 111000

  const coordinates: number[][] = []
  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * 2 * Math.PI
    const x = center.x + radiusDegrees * Math.cos(angle)
    const y = center.y + radiusDegrees * Math.sin(angle)
    coordinates.push([x, y])
  }

  return {
    geometry: {
      type: 'Polygon',
      coordinates: [coordinates],
    },
    properties: {
      bufferRadiusM: radiusMeters,
      centerX: center.x,
      centerY: center.y,
    },
  }
}

/**
 * Calculate distance between two points (Haversine formula)
 */
export function distance(
  p1: Point,
  p2: Point,
  unit: 'meters' | 'kilometers' = 'meters'
): number {
  const R = unit === 'meters' ? 6371000 : 6371 // Earth radius
  const dLat = ((p2.y - p1.y) * Math.PI) / 180
  const dLon = ((p2.x - p1.x) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((p1.y * Math.PI) / 180) *
      Math.cos((p2.y * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Find nearest features to a query point
 */
export function findNearest(
  queryPoint: Point,
  targetFeatures: Feature[],
  maxResults = 10,
  maxDistanceMeters?: number
): Array<{ feature: Feature; distance: number }> {
  const results: Array<{ feature: Feature; distance: number }> = []

  for (const feature of targetFeatures) {
    if (feature.geometry.type !== 'Point') continue
    const coords = feature.geometry.coordinates as number[]
    const point: Point = { x: coords[0], y: coords[1] }
    const dist = distance(queryPoint, point)

    if (maxDistanceMeters === undefined || dist <= maxDistanceMeters) {
      results.push({ feature, distance: dist })
    }
  }

  results.sort((a, b) => a.distance - b.distance)
  return results.slice(0, maxResults)
}
