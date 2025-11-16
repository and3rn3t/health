/**
 * Change detection (multi-temporal)
 * Per-pixel change maps from before/after imagery
 */

export interface ChangeMapResult {
  changeMap: number[]
  changeMagnitude: number[]
  changeDirection: 'increase' | 'decrease' | 'no-change'
  statistics: {
    changedPixels: number
    unchangedPixels: number
    changeRate: number
    meanChange: number
    maxChange: number
    minChange: number
  }
  thresholds: {
    significantChange: number
    changePixels: number[]
  }
}

/**
 * Calculate change map from before/after values
 */
export function calculateChangeMap(
  before: number[],
  after: number[],
  threshold = 0.1,
  method: 'absolute' | 'relative' | 'normalized' = 'absolute'
): ChangeMapResult {
  if (before.length !== after.length) {
    throw new Error(`Before and after arrays must have same length. Got ${before.length} and ${after.length}`)
  }

  const changeMap: number[] = []
  const changeMagnitude: number[] = []
  const changeDirection: Array<'increase' | 'decrease' | 'no-change'> = []
  const changePixels: number[] = []

  for (let i = 0; i < before.length; i++) {
    const b = before[i]
    const a = after[i]

    if (!Number.isFinite(b) || !Number.isFinite(a)) {
      changeMap.push(0)
      changeMagnitude.push(0)
      changeDirection.push('no-change')
      continue
    }

    let change: number
    switch (method) {
      case 'relative':
        // Relative change: (after - before) / before
        change = b !== 0 ? (a - b) / b : 0
        break
      case 'normalized':
        // Normalized difference: (after - before) / (after + before)
        change = a + b !== 0 ? (a - b) / (a + b) : 0
        break
      default:
        // Absolute change
        change = a - b
    }

    const magnitude = Math.abs(change)
    changeMagnitude.push(magnitude)

    if (magnitude > threshold) {
      changeMap.push(1)
      changeDirection.push(change > 0 ? 'increase' : 'decrease')
      changePixels.push(i)
    } else {
      changeMap.push(0)
      changeDirection.push('no-change')
    }
  }

  const validChanges = changeMagnitude.filter((m) => m > 0)
  const changedCount = changePixels.length
  const unchangedCount = before.length - changedCount

  return {
    changeMap,
    changeMagnitude,
    changeDirection: changeDirection as any,
    statistics: {
      changedPixels: changedCount,
      unchangedPixels: unchangedCount,
      changeRate: before.length > 0 ? changedCount / before.length : 0,
      meanChange: validChanges.length > 0 ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length : 0,
      maxChange: validChanges.length > 0 ? Math.max(...validChanges) : 0,
      minChange: validChanges.length > 0 ? Math.min(...validChanges) : 0,
    },
    thresholds: {
      significantChange: threshold,
      changePixels: changePixels,
    },
  }
}

/**
 * Calculate multi-temporal change (detect changes across multiple time periods)
 */
export function calculateMultiTemporalChange(
  timeSeries: Array<{ time: number; values: number[] }>,
  threshold = 0.1
): {
  changePoints: Array<{ fromTime: number; toTime: number; changeMap: number[]; statistics: any }>
  overallChange: ChangeMapResult
} {
  if (timeSeries.length < 2) {
    throw new Error('At least two time periods required for multi-temporal change detection')
  }

  // Sort by time
  const sorted = [...timeSeries].sort((a, b) => a.time - b.time)

  // Calculate change between consecutive periods
  const changePoints = []
  for (let i = 1; i < sorted.length; i++) {
    const before = sorted[i - 1].values
    const after = sorted[i].values
    const change = calculateChangeMap(before, after, threshold)
    changePoints.push({
      fromTime: sorted[i - 1].time,
      toTime: sorted[i].time,
      changeMap: change.changeMap,
      statistics: change.statistics,
    })
  }

  // Calculate overall change (first to last)
  const overallChange = calculateChangeMap(
    sorted[0].values,
    sorted[sorted.length - 1].values,
    threshold
  )

  return {
    changePoints,
    overallChange,
  }
}
