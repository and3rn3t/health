/**
 * LiDAR processing utilities
 * Ground/non-ground classification, DTM/DSM generation, etc.
 */

export interface LidarPoint {
  x: number
  y: number
  z: number
  intensity?: number
  classification?: number
}

export interface ClassificationResult {
  points: LidarPoint[]
  groundCount: number
  nonGroundCount: number
  stats: {
    ground: {
      minZ: number
      maxZ: number
      meanZ: number
      stdZ: number
    }
    nonGround: {
      minZ: number
      maxZ: number
      meanZ: number
      stdZ: number
    }
  }
}

/**
 * Simple ground classification using progressive morphological filter
 * This is a simplified version - production would use PDAL or similar
 */
export function classifyGroundNonGround(
  points: LidarPoint[],
  cellSize = 1.0,
  maxSlope = 30.0,
  initialHeight = 0.5,
  maxHeight = 3.0
): ClassificationResult {
  if (points.length === 0) {
    return {
      points: [],
      groundCount: 0,
      nonGroundCount: 0,
      stats: {
        ground: { minZ: NaN, maxZ: NaN, meanZ: NaN, stdZ: NaN },
        nonGround: { minZ: NaN, maxZ: NaN, meanZ: NaN, stdZ: NaN },
      },
    }
  }

  // Find bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity
  for (const p of points) {
    minX = Math.min(minX, p.x)
    minY = Math.min(minY, p.y)
    maxX = Math.max(maxX, p.x)
    maxY = Math.max(maxY, p.y)
  }

  // Create grid for ground surface estimation
  const cols = Math.ceil((maxX - minX) / cellSize)
  const rows = Math.ceil((maxY - minY) / cellSize)
  const grid: (number | null)[][] = new Array(rows)
    .fill(null)
    .map(() => new Array(cols).fill(null))

  // Find lowest point in each cell (initial ground estimate)
  for (const p of points) {
    const col = Math.floor((p.x - minX) / cellSize)
    const row = Math.floor((p.y - minY) / cellSize)
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      if (grid[row][col] === null || p.z < grid[row][col]!) {
        grid[row][col] = p.z
      }
    }
  }

  // Classify points: ground if within threshold of grid cell, else non-ground
  const classified: LidarPoint[] = []
  let groundCount = 0
  let nonGroundCount = 0
  const groundZs: number[] = []
  const nonGroundZs: number[] = []

  for (const p of points) {
    const col = Math.floor((p.x - minX) / cellSize)
    const row = Math.floor((p.y - minY) / cellSize)
    const cellZ = row >= 0 && row < rows && col >= 0 && col < cols ? grid[row][col] : null

    let isGround = false
    if (cellZ !== null) {
      const diff = Math.abs(p.z - cellZ)
      // Point is ground if close to cell minimum and not too high
      isGround = diff <= initialHeight && p.z <= cellZ + maxHeight
    } else {
      // Points outside grid: classify as non-ground
      isGround = false
    }

    classified.push({
      ...p,
      classification: isGround ? 2 : 1, // 2 = ground, 1 = unclassified/non-ground
    })

    if (isGround) {
      groundCount++
      groundZs.push(p.z)
    } else {
      nonGroundCount++
      nonGroundZs.push(p.z)
    }
  }

  // Calculate statistics
  function calcStats(values: number[]) {
    if (values.length === 0) {
      return { minZ: NaN, maxZ: NaN, meanZ: NaN, stdZ: NaN }
    }
    const mean = values.reduce((a, b) => a + b, 0) / values.length
    const variance =
      values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
    return {
      minZ: Math.min(...values),
      maxZ: Math.max(...values),
      meanZ: mean,
      stdZ: Math.sqrt(variance),
    }
  }

  return {
    points: classified,
    groundCount,
    nonGroundCount,
    stats: {
      ground: calcStats(groundZs),
      nonGround: calcStats(nonGroundZs),
    },
  }
}

/**
 * Generate DTM (Digital Terrain Model) from ground-classified points
 * Returns a grid of elevation values
 */
export function generateDTM(
  groundPoints: LidarPoint[],
  cellSize = 1.0,
  bbox?: { minX: number; minY: number; maxX: number; maxY: number }
): {
  grid: number[][]
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
  cellSize: number
  width: number
  height: number
} {
  if (groundPoints.length === 0) {
    throw new Error('No ground points provided')
  }

  // Calculate bbox if not provided
  if (!bbox) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const p of groundPoints) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    bbox = { minX, minY, maxX, maxY }
  }

  const cols = Math.ceil((bbox.maxX - bbox.minX) / cellSize)
  const rows = Math.ceil((bbox.maxY - bbox.minY) / cellSize)
  const grid: number[][] = new Array(rows)
    .fill(null)
    .map(() => new Array(cols).fill(NaN))

  // Average Z values in each cell
  const cellSums: number[][] = new Array(rows)
    .fill(null)
    .map(() => new Array(cols).fill(0))
  const cellCounts: number[][] = new Array(rows)
    .fill(null)
    .map(() => new Array(cols).fill(0))

  for (const p of groundPoints) {
    const col = Math.floor((p.x - bbox.minX) / cellSize)
    const row = Math.floor((p.y - bbox.minY) / cellSize)
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      cellSums[row][col] += p.z
      cellCounts[row][col]++
    }
  }

  // Calculate mean Z for each cell
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (cellCounts[row][col] > 0) {
        grid[row][col] = cellSums[row][col] / cellCounts[row][col]
      }
    }
  }

  return {
    grid,
    bbox,
    cellSize,
    width: cols,
    height: rows,
  }
}

/**
 * Generate DSM (Digital Surface Model) from all points (including non-ground)
 */
export function generateDSM(
  allPoints: LidarPoint[],
  cellSize = 1.0,
  bbox?: { minX: number; minY: number; maxX: number; maxY: number }
): {
  grid: number[][]
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
  cellSize: number
  width: number
  height: number
} {
  if (allPoints.length === 0) {
    throw new Error('No points provided')
  }

  // Calculate bbox if not provided
  if (!bbox) {
    let minX = Infinity,
      minY = Infinity,
      maxX = -Infinity,
      maxY = -Infinity
    for (const p of allPoints) {
      minX = Math.min(minX, p.x)
      minY = Math.min(minY, p.y)
      maxX = Math.max(maxX, p.x)
      maxY = Math.max(maxY, p.y)
    }
    bbox = { minX, minY, maxX, maxY }
  }

  const cols = Math.ceil((bbox.maxX - bbox.minX) / cellSize)
  const rows = Math.ceil((bbox.maxY - bbox.minY) / cellSize)
  const grid: number[][] = new Array(rows)
    .fill(null)
    .map(() => new Array(cols).fill(NaN))

  // Use maximum Z value in each cell (DSM = highest point)
  for (const p of allPoints) {
    const col = Math.floor((p.x - bbox.minX) / cellSize)
    const row = Math.floor((p.y - bbox.minY) / cellSize)
    if (row >= 0 && row < rows && col >= 0 && col < cols) {
      if (isNaN(grid[row][col]) || p.z > grid[row][col]) {
        grid[row][col] = p.z
      }
    }
  }

  return {
    grid,
    bbox,
    cellSize,
    width: cols,
    height: rows,
  }
}

/**
 * Generate Canopy Height Model (CHM) = DSM - DTM
 */
export function generateCHM(
  dsm: { grid: number[][]; bbox: { minX: number; minY: number; maxX: number; maxY: number }; cellSize: number; width: number; height: number },
  dtm: { grid: number[][]; bbox: { minX: number; minY: number; maxX: number; maxY: number }; cellSize: number; width: number; height: number }
): {
  grid: number[][]
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
  cellSize: number
  width: number
  height: number
  stats: { min: number; max: number; mean: number }
} {
  // Ensure grids are same size and aligned
  if (dsm.width !== dtm.width || dsm.height !== dtm.height) {
    throw new Error('DSM and DTM must have same dimensions')
  }

  const grid: number[][] = new Array(dsm.height)
    .fill(null)
    .map(() => new Array(dsm.width).fill(NaN))

  const chmValues: number[] = []

  for (let row = 0; row < dsm.height; row++) {
    for (let col = 0; col < dsm.width; col++) {
      const dsmVal = dsm.grid[row][col]
      const dtmVal = dtm.grid[row][col]
      if (Number.isFinite(dsmVal) && Number.isFinite(dtmVal)) {
        const chm = dsmVal - dtmVal
        grid[row][col] = Math.max(0, chm) // CHM should be non-negative
        chmValues.push(grid[row][col])
      }
    }
  }

  const stats =
    chmValues.length > 0
      ? {
          min: Math.min(...chmValues),
          max: Math.max(...chmValues),
          mean: chmValues.reduce((a, b) => a + b, 0) / chmValues.length,
        }
      : { min: NaN, max: NaN, mean: NaN }

  return {
    grid,
    bbox: dsm.bbox,
    cellSize: dsm.cellSize,
    width: dsm.width,
    height: dsm.height,
    stats,
  }
}

/**
 * Calculate terrain derivatives (slope, aspect) from DTM
 */
export function calculateTerrainDerivatives(dtm: {
  grid: number[][]
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
  cellSize: number
  width: number
  height: number
}): {
  slope: number[][]
  aspect: number[][]
  stats: {
    slope: { min: number; max: number; mean: number }
    aspect: { min: number; max: number; mean: number }
  }
} {
  const slope: number[][] = new Array(dtm.height)
    .fill(null)
    .map(() => new Array(dtm.width).fill(NaN))
  const aspect: number[][] = new Array(dtm.height)
    .fill(null)
    .map(() => new Array(dtm.width).fill(NaN))

  const slopeValues: number[] = []
  const aspectValues: number[] = []

  // Calculate slope and aspect using 3x3 window
  for (let row = 1; row < dtm.height - 1; row++) {
    for (let col = 1; col < dtm.width - 1; col++) {
      const z = dtm.grid[row][col]
      if (!Number.isFinite(z)) continue

      // Get neighbors (3x3 window)
      const z11 = dtm.grid[row - 1][col - 1] ?? z
      const z12 = dtm.grid[row - 1][col] ?? z
      const z13 = dtm.grid[row - 1][col + 1] ?? z
      const z21 = dtm.grid[row][col - 1] ?? z
      const z23 = dtm.grid[row][col + 1] ?? z
      const z31 = dtm.grid[row + 1][col - 1] ?? z
      const z32 = dtm.grid[row + 1][col] ?? z
      const z33 = dtm.grid[row + 1][col + 1] ?? z

      // Calculate gradients using Horn's method
      const dx =
        ((z13 + 2 * z23 + z33) - (z11 + 2 * z21 + z31)) / (8 * dtm.cellSize)
      const dy =
        ((z31 + 2 * z32 + z33) - (z11 + 2 * z12 + z13)) / (8 * dtm.cellSize)

      // Slope in degrees
      const slopeRad = Math.atan(Math.sqrt(dx * dx + dy * dy))
      const slopeDeg = (slopeRad * 180) / Math.PI
      slope[row][col] = slopeDeg
      slopeValues.push(slopeDeg)

      // Aspect in degrees (0-360, with 0 = North)
      const aspectRad = Math.atan2(dy, dx)
      let aspectDeg = (aspectRad * 180) / Math.PI
      if (aspectDeg < 0) aspectDeg += 360
      aspect[row][col] = aspectDeg
      aspectValues.push(aspectDeg)
    }
  }

  const stats = {
    slope:
      slopeValues.length > 0
        ? {
            min: Math.min(...slopeValues),
            max: Math.max(...slopeValues),
            mean: slopeValues.reduce((a, b) => a + b, 0) / slopeValues.length,
          }
        : { min: NaN, max: NaN, mean: NaN },
    aspect:
      aspectValues.length > 0
        ? {
            min: Math.min(...aspectValues),
            max: Math.max(...aspectValues),
            mean:
              aspectValues.reduce((a, b) => a + b, 0) / aspectValues.length,
          }
        : { min: NaN, max: NaN, mean: NaN },
  }

  return { slope, aspect, stats }
}
