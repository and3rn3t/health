/**
 * Feature extraction from LiDAR data
 * Rule-based detection of buildings and trees
 */

export interface ExtractedFeature {
  id: string
  type: 'building' | 'tree'
  bbox: { minX: number; minY: number; maxX: number; maxY: number }
  area: number
  height: number
  confidence: number
  properties: Record<string, unknown>
}

/**
 * Extract buildings from CHM/DSM using rule-based approach
 * Buildings: high elevation, rectangular shapes, relatively flat tops
 */
export function extractBuildings(
  chm: { grid: number[][]; bbox: { minX: number; minY: number; maxX: number; maxY: number }; cellSize: number; width: number; height: number },
  minHeight = 2.5,
  minArea = 20.0,
  _maxSlope = 15.0
): ExtractedFeature[] {
  const features: ExtractedFeature[] = []
  const visited = new Set<string>()

  function getCellKey(row: number, col: number): string {
    return `${row},${col}`
  }

  function isBuildingCell(row: number, col: number): boolean {
    if (row < 0 || row >= chm.height || col < 0 || col >= chm.width) return false
    const height = chm.grid[row][col]
    return Number.isFinite(height) && height >= minHeight
  }

  function floodFill(
    startRow: number,
    startCol: number
  ): { cells: Array<{ row: number; col: number }>; bbox: { minRow: number; minCol: number; maxRow: number; maxCol: number } } {
    const cells: Array<{ row: number; col: number }> = []
    const stack = [{ row: startRow, col: startCol }]
    let minRow = startRow,
      minCol = startCol,
      maxRow = startRow,
      maxCol = startCol

    while (stack.length > 0) {
      const { row, col } = stack.pop()!
      const key = getCellKey(row, col)

      if (visited.has(key) || !isBuildingCell(row, col)) continue

      visited.add(key)
      cells.push({ row, col })
      minRow = Math.min(minRow, row)
      minCol = Math.min(minCol, col)
      maxRow = Math.max(maxRow, row)
      maxCol = Math.max(maxCol, col)

      // 4-connected neighbors
      stack.push({ row: row - 1, col })
      stack.push({ row: row + 1, col })
      stack.push({ row, col: col - 1 })
      stack.push({ row, col: col + 1 })
    }

    return { cells, bbox: { minRow, minCol, maxRow, maxCol } }
  }

  // Find connected components
  for (let row = 0; row < chm.height; row++) {
    for (let col = 0; col < chm.width; col++) {
      const key = getCellKey(row, col)
      if (visited.has(key) || !isBuildingCell(row, col)) continue

      const { cells, bbox } = floodFill(row, col)
      const area = cells.length * chm.cellSize * chm.cellSize

      if (area < minArea) continue

      // Calculate average height and check for flatness
      const heights = cells.map((c) => chm.grid[c.row][c.col]).filter(Number.isFinite)
      const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length
      const maxHeight = Math.max(...heights)
      const minHeightInFeature = Math.min(...heights)
      const heightRange = maxHeight - minHeightInFeature

      // Simple flatness check: height variation should be small relative to average
      const flatness = heightRange / (avgHeight + 0.1)
      const isFlat = flatness < 0.3 // Less than 30% variation

      // Calculate aspect ratio (rough rectangularity check)
      const width = (bbox.maxCol - bbox.minCol + 1) * chm.cellSize
      const height = (bbox.maxRow - bbox.minRow + 1) * chm.cellSize
      const aspectRatio = Math.max(width, height) / Math.min(width, height)

      // Confidence based on flatness and size
      const confidence = Math.min(1.0, (isFlat ? 0.7 : 0.3) + (area > 100 ? 0.2 : 0))

      if (isFlat || aspectRatio < 3) {
        // Convert to geographic coordinates
        const minX = chm.bbox.minX + bbox.minCol * chm.cellSize
        const minY = chm.bbox.minY + bbox.minRow * chm.cellSize
        const maxX = chm.bbox.minX + (bbox.maxCol + 1) * chm.cellSize
        const maxY = chm.bbox.minY + (bbox.maxRow + 1) * chm.cellSize

        features.push({
          id: `building-${features.length}`,
          type: 'building',
          bbox: { minX, minY, maxX, maxY },
          area,
          height: avgHeight,
          confidence,
          properties: {
            cellCount: cells.length,
            avgHeight,
            maxHeight,
            minHeight: minHeightInFeature,
            width,
            height: height,
            aspectRatio,
            flatness,
          },
        })
      }
    }
  }

  return features
}

/**
 * Extract trees from CHM using rule-based approach
 * Trees: moderate height, circular/irregular shapes, variable heights
 */
export function extractTrees(
  chm: { grid: number[][]; bbox: { minX: number; minY: number; maxX: number; maxY: number }; cellSize: number; width: number; height: number },
  minHeight = 1.5,
  maxHeight = 50.0,
  minArea = 2.0,
  maxArea = 500.0
): ExtractedFeature[] {
  const features: ExtractedFeature[] = []
  const visited = new Set<string>()

  function getCellKey(row: number, col: number): string {
    return `${row},${col}`
  }

  function isTreeCell(row: number, col: number): boolean {
    if (row < 0 || row >= chm.height || col < 0 || col >= chm.width) return false
    const height = chm.grid[row][col]
    return Number.isFinite(height) && height >= minHeight && height <= maxHeight
  }

  function floodFill(
    startRow: number,
    startCol: number
  ): { cells: Array<{ row: number; col: number }>; bbox: { minRow: number; minCol: number; maxRow: number; maxCol: number } } {
    const cells: Array<{ row: number; col: number }> = []
    const stack = [{ row: startRow, col: startCol }]
    let minRow = startRow,
      minCol = startCol,
      maxRow = startRow,
      maxCol = startCol

    while (stack.length > 0) {
      const { row, col } = stack.pop()!
      const key = getCellKey(row, col)

      if (visited.has(key) || !isTreeCell(row, col)) continue

      visited.add(key)
      cells.push({ row, col })
      minRow = Math.min(minRow, row)
      minCol = Math.min(minCol, col)
      maxRow = Math.max(maxRow, row)
      maxCol = Math.max(maxCol, col)

      // 8-connected neighbors (trees can be irregular)
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue
          stack.push({ row: row + dr, col: col + dc })
        }
      }
    }

    return { cells, bbox: { minRow, minCol, maxRow, maxCol } }
  }

  // Find connected components
  for (let row = 0; row < chm.height; row++) {
    for (let col = 0; col < chm.width; col++) {
      const key = getCellKey(row, col)
      if (visited.has(key) || !isTreeCell(row, col)) continue

      const { cells, bbox } = floodFill(row, col)
      const area = cells.length * chm.cellSize * chm.cellSize

      if (area < minArea || area > maxArea) continue

      // Calculate height statistics
      const heights = cells.map((c) => chm.grid[c.row][c.col]).filter(Number.isFinite)
      const avgHeight = heights.reduce((a, b) => a + b, 0) / heights.length
      const maxHeightInFeature = Math.max(...heights)
      const minHeightInFeature = Math.min(...heights)
      const heightStd = Math.sqrt(
        heights.reduce((sum, h) => sum + (h - avgHeight) ** 2, 0) / heights.length
      )

      // Trees typically have more height variation than buildings
      const heightVariation = heightStd / (avgHeight + 0.1)

      // Calculate circularity (perimeter^2 / (4 * PI * area))
      const width = (bbox.maxCol - bbox.minCol + 1) * chm.cellSize
      const height = (bbox.maxRow - bbox.minRow + 1) * chm.cellSize
      const perimeter = 2 * (width + height) // Approximation
      const circularity = (perimeter * perimeter) / (4 * Math.PI * area)

      // Confidence based on height variation and size
      const confidence = Math.min(
        1.0,
        0.5 + (heightVariation > 0.1 ? 0.2 : 0) + (area > 10 && area < 200 ? 0.3 : 0)
      )

      // Convert to geographic coordinates
      const minX = chm.bbox.minX + bbox.minCol * chm.cellSize
      const minY = chm.bbox.minY + bbox.minRow * chm.cellSize
      const maxX = chm.bbox.minX + (bbox.maxCol + 1) * chm.cellSize
      const maxY = chm.bbox.minY + (bbox.maxRow + 1) * chm.cellSize

      features.push({
        id: `tree-${features.length}`,
        type: 'tree',
        bbox: { minX, minY, maxX, maxY },
        area,
        height: avgHeight,
        confidence,
        properties: {
          cellCount: cells.length,
          avgHeight,
          maxHeight: maxHeightInFeature,
          minHeight: minHeightInFeature,
          heightStd,
          heightVariation,
          width,
          height: height,
          circularity,
        },
      })
    }
  }

  return features
}
