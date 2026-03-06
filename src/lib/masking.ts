import { computeBasicStats } from './stats'

export interface MaskingResult {
  masked: boolean[]
  maskedCount: number
  totalCount: number
  maskedPercent: number
  stats: {
    original: ReturnType<typeof computeBasicStats>
    masked: ReturnType<typeof computeBasicStats>
  }
}

/**
 * Simple cloud masking based on brightness threshold
 * Clouds typically have high reflectance in visible bands
 */
export function maskClouds(
  blue: number[],
  green: number[],
  red: number[],
  threshold = 0.6
): MaskingResult {
  if (blue.length !== green.length || green.length !== red.length) {
    throw new Error('All band arrays must have the same length')
  }
  const masked: boolean[] = new Array(blue.length)
  let maskedCount = 0
  const originalValues: number[] = []
  const maskedValues: number[] = []

  for (let i = 0; i < blue.length; i++) {
    const b = Number(blue[i])
    const g = Number(green[i])
    const r = Number(red[i])
    // Simple cloud detection: high brightness in all visible bands
    const brightness = (b + g + r) / 3
    const isCloud = brightness > threshold
    masked[i] = isCloud
    if (isCloud) maskedCount++

    // Collect values for stats
    if (Number.isFinite(brightness)) {
      originalValues.push(brightness)
      if (!isCloud) {
        maskedValues.push(brightness)
      }
    }
  }

  return {
    masked,
    maskedCount,
    totalCount: blue.length,
    maskedPercent: (maskedCount / blue.length) * 100,
    stats: {
      original: computeBasicStats(originalValues),
      masked: computeBasicStats(maskedValues),
    },
  }
}

/**
 * Simple shadow masking based on low brightness
 * Shadows typically have low reflectance across all bands
 */
export function maskShadows(
  blue: number[],
  green: number[],
  red: number[],
  threshold = 0.15
): MaskingResult {
  if (blue.length !== green.length || green.length !== red.length) {
    throw new Error('All band arrays must have the same length')
  }
  const masked: boolean[] = new Array(blue.length)
  let maskedCount = 0
  const originalValues: number[] = []
  const maskedValues: number[] = []

  for (let i = 0; i < blue.length; i++) {
    const b = Number(blue[i])
    const g = Number(green[i])
    const r = Number(red[i])
    // Simple shadow detection: low brightness in all visible bands
    const brightness = (b + g + r) / 3
    const isShadow = brightness < threshold
    masked[i] = isShadow
    if (isShadow) maskedCount++

    // Collect values for stats
    if (Number.isFinite(brightness)) {
      originalValues.push(brightness)
      if (!isShadow) {
        maskedValues.push(brightness)
      }
    }
  }

  return {
    masked,
    maskedCount,
    totalCount: blue.length,
    maskedPercent: (maskedCount / blue.length) * 100,
    stats: {
      original: computeBasicStats(originalValues),
      masked: computeBasicStats(maskedValues),
    },
  }
}

/**
 * Combined cloud and shadow masking
 */
export function maskCloudsAndShadows(
  blue: number[],
  green: number[],
  red: number[],
  cloudThreshold = 0.6,
  shadowThreshold = 0.15
): MaskingResult {
  if (blue.length !== green.length || green.length !== red.length) {
    throw new Error('All band arrays must have the same length')
  }
  const masked: boolean[] = new Array(blue.length)
  let maskedCount = 0
  const originalValues: number[] = []
  const maskedValues: number[] = []

  for (let i = 0; i < blue.length; i++) {
    const b = Number(blue[i])
    const g = Number(green[i])
    const r = Number(red[i])
    const brightness = (b + g + r) / 3
    const isCloud = brightness > cloudThreshold
    const isShadow = brightness < shadowThreshold
    const isMasked = isCloud || isShadow
    masked[i] = isMasked
    if (isMasked) maskedCount++

    if (Number.isFinite(brightness)) {
      originalValues.push(brightness)
      if (!isMasked) {
        maskedValues.push(brightness)
      }
    }
  }

  return {
    masked,
    maskedCount,
    totalCount: blue.length,
    maskedPercent: (maskedCount / blue.length) * 100,
    stats: {
      original: computeBasicStats(originalValues),
      masked: computeBasicStats(maskedValues),
    },
  }
}
