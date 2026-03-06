/**
 * Tile generation utilities for raster and vector data
 * Supports XYZ tile scheme (z/x/y) and basic styling
 */

export interface TileBounds {
  minX: number
  minY: number
  maxX: number
  maxY: number
}

export interface TileCoord {
  z: number
  x: number
  y: number
}

/**
 * Convert tile coordinates to Web Mercator bounds
 */
export function tileToBounds(z: number, x: number, y: number): TileBounds {
  const n = Math.pow(2, z)
  const minX = (x / n) * 360 - 180
  const maxX = ((x + 1) / n) * 360 - 180
  const minY = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * (180 / Math.PI)
  const maxY = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * (180 / Math.PI)
  return { minX, minY, maxX, maxY }
}

/**
 * Convert lat/lon to tile coordinates
 */
export function latLonToTile(lat: number, lon: number, z: number): { x: number; y: number } {
  const n = Math.pow(2, z)
  const x = Math.floor(((lon + 180) / 360) * n)
  const latRad = (lat * Math.PI) / 180
  const y = Math.floor(((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n)
  return { x, y }
}

/**
 * Generate a simple raster tile (256x256 PNG placeholder)
 * In production, this would sample from actual raster data
 */
export function generateRasterTile(
  z: number,
  x: number,
  y: number,
  data?: { values: number[]; width: number; height: number; bbox: TileBounds }
): { buffer: Buffer; contentType: string } {
  // For now, return a simple colored tile
  // In production, this would sample from COG/GeoTIFF using GDAL
  const bounds = tileToBounds(z, x, y)
  const color = `rgb(${Math.floor((bounds.minX + 180) / 360 * 255)}, ${Math.floor((bounds.minY + 90) / 180 * 255)}, 128)`

  // Return a minimal 1x1 PNG (in production, use sharp or similar to generate 256x256)
  // For now, we'll return a JSON representation that the API can convert
  return {
    buffer: Buffer.from(JSON.stringify({ z, x, y, bounds, color, type: 'raster' })),
    contentType: 'application/json',
  }
}

/**
 * Generate a vector tile (MVT format placeholder)
 * In production, this would use actual vector data and proper MVT encoding
 */
export function generateVectorTile(
  z: number,
  x: number,
  y: number,
  features?: Array<{ geometry: any; properties: Record<string, any> }>
): { buffer: Buffer; contentType: string } {
  const bounds = tileToBounds(z, x, y)
  // For now, return JSON representation
  // In production, encode as MVT (Mapbox Vector Tile)
  return {
    buffer: Buffer.from(JSON.stringify({
      z,
      x,
      y,
      bounds,
      features: features || [],
      type: 'vector',
    })),
    contentType: 'application/json',
  }
}

/**
 * Apply style preset to tile data
 */
export type StylePreset = 'default' | 'satellite' | 'terrain' | 'ndvi' | 'ndwi'

export function applyStylePreset(
  preset: StylePreset,
  value: number,
  min?: number,
  max?: number
): string {
  const normalized = min !== undefined && max !== undefined && max !== min
    ? (value - min) / (max - min)
    : 0.5

  switch (preset) {
    case 'satellite':
      // Natural color
      return `rgb(${Math.floor(value * 255)}, ${Math.floor(value * 255)}, ${Math.floor(value * 255)})`
    case 'terrain':
      // Elevation colors (green to brown to white)
      if (normalized < 0.33) {
        return `rgb(0, ${Math.floor(normalized * 3 * 255)}, 0)`
      } else if (normalized < 0.66) {
        const t = (normalized - 0.33) / 0.33
        return `rgb(${Math.floor(t * 139)}, ${Math.floor(139 - t * 69)}, 0)`
      } else {
        const t = (normalized - 0.66) / 0.34
        return `rgb(${Math.floor(139 + t * 116)}, ${Math.floor(69 + t * 186)}, ${Math.floor(t * 255)})`
      }
    case 'ndvi':
      // NDVI colors (red to yellow to green)
      if (normalized < 0.5) {
        return `rgb(255, ${Math.floor(normalized * 2 * 255)}, 0)`
      } else {
        const t = (normalized - 0.5) / 0.5
        return `rgb(${Math.floor(255 - t * 255)}, 255, 0)`
      }
    case 'ndwi':
      // NDWI colors (brown to blue)
      return `rgb(${Math.floor((1 - normalized) * 139)}, ${Math.floor((1 - normalized) * 69)}, ${Math.floor(normalized * 255)})`
    default:
      return `rgb(${Math.floor(normalized * 255)}, ${Math.floor(normalized * 255)}, ${Math.floor(normalized * 255)})`
  }
}
