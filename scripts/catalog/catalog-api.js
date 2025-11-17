import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const logger = require('../observability/logger.cjs');
const metrics = require('../observability/metrics.cjs');
import compression from 'compression';

const PORT = process.env.CATALOG_PORT ? Number(process.env.CATALOG_PORT) : 5055;
const ROOT = process.cwd();
const CATALOG_DIR = path.join(ROOT, 'catalog');
const UPLOAD_DIR = path.join(ROOT, 'uploads');

function computeBasicStats(values) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0)
    return { min: NaN, max: NaN, mean: NaN, std: NaN, count: 0 };
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  for (const v of finite) {
    if (v < min) min = v;
    if (v > max) max = v;
    sum += v;
  }
  const mean = sum / finite.length;
  let varSum = 0;
  for (const v of finite) {
    const d = v - mean;
    varSum += d * d;
  }
  const variance = varSum / finite.length;
  return { min, max, mean, std: Math.sqrt(variance), count: finite.length };
}

function computeHistogram(values, bins, range = { min: -1, max: 1 }) {
  const counts = new Array(bins).fill(0);
  const width = (range.max - range.min) / bins;
  for (const v of values) {
    if (!Number.isFinite(v)) continue;
    if (v < range.min || v > range.max) continue;
    let idx = Math.floor((v - range.min) / width);
    if (idx === bins) idx = bins - 1;
    if (idx >= 0 && idx < bins) counts[idx]++;
  }
  return counts;
}

// Chunked processing for large arrays (memory-efficient)
function computeBasicStatsChunked(values, chunkSize = 10000) {
  let min = Infinity;
  let max = -Infinity;
  let sum = 0;
  let count = 0;
  let sumSq = 0;
  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, Math.min(i + chunkSize, values.length));
    for (const v of chunk) {
      if (!Number.isFinite(v)) continue;
      if (v < min) min = v;
      if (v > max) max = v;
      sum += v;
      count++;
      sumSq += v * v;
    }
  }
  if (count === 0) return { min: NaN, max: NaN, mean: NaN, std: NaN, count: 0 };
  const mean = sum / count;
  const variance = count > 1 ? sumSq / count - mean * mean : 0;
  const std = Math.sqrt(Math.max(0, variance));
  return { min: min === Infinity ? NaN : min, max: max === -Infinity ? NaN : max, mean, std, count };
}

function computeHistogramChunked(values, bins, range = { min: -1, max: 1 }, chunkSize = 10000) {
  const counts = new Array(bins).fill(0);
  const width = (range.max - range.min) / bins;
  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, Math.min(i + chunkSize, values.length));
    for (const v of chunk) {
      if (!Number.isFinite(v)) continue;
      if (v < range.min || v > range.max) continue;
      let idx = Math.floor((v - range.min) / width);
      if (idx === bins) idx = bins - 1;
      if (idx >= 0 && idx < bins) counts[idx]++;
    }
  }
  return counts;
}

function computeNdvi(nir, red, bins = 10, useChunked = false) {
  if (!Array.isArray(nir) || !Array.isArray(red)) {
    throw new Error('nir and red must be arrays');
  }
  if (nir.length !== red.length) {
    throw new Error('nir and red lengths must match');
  }
  const ndvi = new Array(nir.length);
  for (let i = 0; i < nir.length; i++) {
    const n = Number(nir[i]);
    const r = Number(red[i]);
    const denom = n + r;
    ndvi[i] = denom === 0 ? Number.NaN : (n - r) / denom;
  }
  const stats = useChunked && ndvi.length > 50000 ? computeBasicStatsChunked(ndvi) : computeBasicStats(ndvi);
  const counts = useChunked && ndvi.length > 50000 ? computeHistogramChunked(ndvi, bins, { min: -1, max: 1 }) : computeHistogram(ndvi, bins, { min: -1, max: 1 });
  return { stats, histogram: { bins, counts } };
}

function computeNdwi(green, nir, bins = 10, useChunked = false) {
  if (!Array.isArray(green) || !Array.isArray(nir)) {
    throw new Error('green and nir must be arrays');
  }
  if (green.length !== nir.length) {
    throw new Error('green and nir lengths must match');
  }
  const ndwi = new Array(green.length);
  for (let i = 0; i < green.length; i++) {
    const g = Number(green[i]);
    const n = Number(nir[i]);
    const denom = g + n;
    ndwi[i] = denom === 0 ? Number.NaN : (g - n) / denom;
  }
  const stats = useChunked && ndwi.length > 50000 ? computeBasicStatsChunked(ndwi) : computeBasicStats(ndwi);
  const counts = useChunked && ndwi.length > 50000 ? computeHistogramChunked(ndwi, bins, { min: -1, max: 1 }) : computeHistogram(ndwi, bins, { min: -1, max: 1 });
  return { stats, histogram: { bins, counts } };
}

function computeNdmi(nir, swir, bins = 10, useChunked = false) {
  if (!Array.isArray(nir) || !Array.isArray(swir)) {
    throw new Error('nir and swir must be arrays');
  }
  if (nir.length !== swir.length) {
    throw new Error('nir and swir lengths must match');
  }
  const ndmi = new Array(nir.length);
  for (let i = 0; i < nir.length; i++) {
    const n = Number(nir[i]);
    const s = Number(swir[i]);
    const denom = n + s;
    ndmi[i] = denom === 0 ? Number.NaN : (n - s) / denom;
  }
  const stats = useChunked && ndmi.length > 50000 ? computeBasicStatsChunked(ndmi) : computeBasicStats(ndmi);
  const counts = useChunked && ndmi.length > 50000 ? computeHistogramChunked(ndmi, bins, { min: -1, max: 1 }) : computeHistogram(ndmi, bins, { min: -1, max: 1 });
  return { stats, histogram: { bins, counts } };
}

function computeZonalStats(values, zones) {
  if (!Array.isArray(values) || !Array.isArray(zones)) {
    throw new Error('values and zones must be arrays');
  }
  if (values.length !== zones.length) {
    throw new Error('values and zones lengths must match');
  }
  const perZone = new Map();
  for (let i = 0; i < values.length; i++) {
    const z = String(zones[i]);
    const v = Number(values[i]);
    if (!perZone.has(z)) perZone.set(z, []);
    perZone.get(z).push(v);
  }
  const result = [];
  for (const [zoneId, arr] of perZone.entries()) {
    const stats = computeBasicStats(arr);
    result.push({ zoneId, min: stats.min, max: stats.max, mean: stats.mean, std: stats.std, count: stats.count });
  }
  return { zones: result };
}

function computeSlopeAspect(elev, width, height, cellSize = 1) {
  if (!Array.isArray(elev) || elev.length !== width * height) {
    throw new Error('elev length must be width*height')
  }
  const toIdx = (x, y) => y * width + x
  const slopes = new Array(elev.length).fill(NaN)
  const aspects = new Array(elev.length).fill(NaN)
  // Horn's method (3x3 kernel)
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const z1 = elev[toIdx(x - 1, y - 1)], z2 = elev[toIdx(x, y - 1)], z3 = elev[toIdx(x + 1, y - 1)]
      const z4 = elev[toIdx(x - 1, y    )],                 /* z5 */    z6 = elev[toIdx(x + 1, y    )]
      const z7 = elev[toIdx(x - 1, y + 1)], z8 = elev[toIdx(x, y + 1)], z9 = elev[toIdx(x + 1, y + 1)]
      const dzdx = ((z3 + 2 * z6 + z9) - (z1 + 2 * z4 + z7)) / (8 * cellSize)
      const dzdy = ((z7 + 2 * z8 + z9) - (z1 + 2 * z2 + z3)) / (8 * cellSize)
      const slopeRad = Math.atan(Math.sqrt(dzdx * dzdx + dzdy * dzdy))
      let aspectRad = Math.atan2(dzdy, -dzdx)
      if (aspectRad < 0) aspectRad = 2 * Math.PI + aspectRad
      slopes[toIdx(x, y)] = slopeRad * (180 / Math.PI)
      aspects[toIdx(x, y)] = aspectRad * (180 / Math.PI)
    }
  }
  const slopeStats = computeBasicStats(slopes.filter(Number.isFinite))
  const aspectStats = computeBasicStats(aspects.filter(Number.isFinite))
  return { slopes, aspects, slopeStats, aspectStats }
}

async function listJson(dir) {
  try {
    const files = await fs.readdir(dir, { withFileTypes: true });
    return files
      .filter((f) => f.isFile() && f.name.toLowerCase().endsWith('.json'))
      .map((f) => f.name.replace(/\.json$/i, ''));
  } catch {
    return [];
  }
}

async function readJson(filePath) {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw);
}

function resolveItemPath(id) {
  return path.join(CATALOG_DIR, 'items', `${id}.json`);
}
function resolveCollectionPath(id) {
  return path.join(CATALOG_DIR, 'collections', `${id}.json`);
}

// Tile generation utilities
function tileToBounds(z, x, y) {
  const n = Math.pow(2, z);
  const minX = (x / n) * 360 - 180;
  const maxX = ((x + 1) / n) * 360 - 180;
  const minY = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * (180 / Math.PI);
  const maxY = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * (180 / Math.PI);
  return { minX, minY, maxX, maxY };
}

// Simple in-memory tile cache (in production, use Redis or similar)
const tileCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCacheKey(type, z, x, y, style) {
  return `${type}/${z}/${x}/${y}/${style || 'default'}`;
}

function getCachedTile(key) {
  const cached = tileCache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  tileCache.delete(key);
  return null;
}

function setCachedTile(key, data) {
  // Limit cache size (simple LRU: remove oldest 10% when full)
  if (tileCache.size > 1000) {
    const entries = Array.from(tileCache.entries()).sort((a, b) => a[1].timestamp - b[1].timestamp);
    const evictCount = Math.floor(entries.length * 0.1);
    for (let i = 0; i < evictCount; i++) {
      tileCache.delete(entries[i][0]);
      metrics.recordCacheEviction();
    }
  }
  tileCache.set(key, { data, timestamp: Date.now() });
}

function generateRasterTile(z, x, y, style = 'default') {
  const bounds = tileToBounds(z, x, y);
  // Generate a simple colored tile based on position and style
  // In production, this would sample from actual COG/GeoTIFF data
  const centerLat = (bounds.minY + bounds.maxY) / 2;
  const centerLon = (bounds.minX + bounds.maxX) / 2;
  const value = (Math.sin(centerLat * Math.PI / 180) + 1) / 2; // Normalized value for styling

  let color;
  switch (style) {
    case 'satellite':
      color = `rgb(${Math.floor(value * 200 + 55)}, ${Math.floor(value * 200 + 55)}, ${Math.floor(value * 200 + 55)})`;
      break;
    case 'terrain':
      if (value < 0.33) {
        color = `rgb(0, ${Math.floor(value * 3 * 255)}, 0)`;
      } else if (value < 0.66) {
        const t = (value - 0.33) / 0.33;
        color = `rgb(${Math.floor(t * 139)}, ${Math.floor(139 - t * 69)}, 0)`;
      } else {
        const t = (value - 0.66) / 0.34;
        color = `rgb(${Math.floor(139 + t * 116)}, ${Math.floor(69 + t * 186)}, ${Math.floor(t * 255)})`;
      }
      break;
    case 'ndvi':
      if (value < 0.5) {
        color = `rgb(255, ${Math.floor(value * 2 * 255)}, 0)`;
      } else {
        const t = (value - 0.5) / 0.5;
        color = `rgb(${Math.floor(255 - t * 255)}, 255, 0)`;
      }
      break;
    case 'ndwi':
      color = `rgb(${Math.floor((1 - value) * 139)}, ${Math.floor((1 - value) * 69)}, ${Math.floor(value * 255)})`;
      break;
    default:
      color = `rgb(${Math.floor(value * 255)}, ${Math.floor(value * 255)}, ${Math.floor(value * 255)})`;
  }

  // Generate SVG and URL-encode it for data URI
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="${color}"/><text x="128" y="128" text-anchor="middle" fill="white" font-size="12">${z}/${x}/${y}</text></svg>`;
  const encodedSvg = encodeURIComponent(svg);

  return {
    z, x, y, bounds,
    style,
    color,
    type: 'raster',
    // In production, this would be actual PNG/JPEG image data
    imageData: `data:image/svg+xml,${encodedSvg}`
  };
}

function generateVectorTile(z, x, y, features = []) {
  const bounds = tileToBounds(z, x, y);
  // Filter features that intersect with tile bounds
  const tileFeatures = features.filter(f => {
    // Simple bbox intersection check
    if (!f.bbox) return false;
    return !(f.bbox.maxX < bounds.minX || f.bbox.minX > bounds.maxX ||
             f.bbox.maxY < bounds.minY || f.bbox.minY > bounds.maxY);
  });

  return {
    z, x, y, bounds,
    features: tileFeatures,
    type: 'vector',
    // In production, this would be MVT (Mapbox Vector Tile) binary format
    format: 'geojson'
  };
}

const app = express();

// Performance optimizations
// Response compression (gzip) for all responses
app.use(compression({
  filter: (req, res) => {
    // Compress responses larger than 1KB
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6, // Balance between compression and speed
}));

// Security headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// CORS headers (configurable)
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*';
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', CORS_ORIGIN);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  return next();
});

// Increased limit for large array processing (50MB)
app.use(express.json({ limit: '50mb' }));

// Observability middleware - request logging and metrics
app.use((req, res, next) => {
  const startTime = Date.now();
  const originalSend = res.send;

  res.send = function (body) {
    const duration = Date.now() - startTime;
    const path = req.route?.path || req.path;

    metrics.recordRequest(req.method, path, res.statusCode, duration);
    logger.request(req, res, duration, {
      contentLength: res.get('content-length'),
    });

    return originalSend.call(this, body);
  };

  next();
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const health = {
    ok: true,
    timestamp: new Date().toISOString(),
    uptime: {
      seconds: Math.floor((Date.now() - metrics.metrics.uptime.startTime) / 1000),
    },
    service: 'catalog-api',
    version: process.env.npm_package_version || '1.0.0',
  };

  res.json(health);
});

// Metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(metrics.getMetrics());
});

// NDVI stats endpoint: POST body { nir: number[], red: number[], bins?: number, chunked?: boolean }
app.post('/analysis/ndvi', (req, res) => {
  try {
    const { nir, red, bins, chunked } = req.body || {};
    // Simple safeguard against huge payloads
    if (Array.isArray(nir) && nir.length > 2_000_000) {
      return res.status(413).json({ error: 'nir too large' });
    }
    if (Array.isArray(red) && red.length > 2_000_000) {
      return res.status(413).json({ error: 'red too large' });
    }
    const useChunked = chunked === true || (Array.isArray(nir) && nir.length > 50000);
    const result = computeNdvi(
      nir,
      red,
      Number.isFinite(bins) ? Number(bins) : 10,
      useChunked
    );
    return res.json({ ...result, chunked: useChunked });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// NDWI stats endpoint: POST body { green: number[], nir: number[], bins?: number, chunked?: boolean }
app.post('/analysis/ndwi', (req, res) => {
  try {
    const { green, nir, bins, chunked } = req.body || {};
    if (Array.isArray(green) && green.length > 2_000_000) {
      return res.status(413).json({ error: 'green too large' });
    }
    if (Array.isArray(nir) && nir.length > 2_000_000) {
      return res.status(413).json({ error: 'nir too large' });
    }
    const useChunked = chunked === true || (Array.isArray(green) && green.length > 50000);
    const result = computeNdwi(
      green,
      nir,
      Number.isFinite(bins) ? Number(bins) : 10,
      useChunked
    );
    return res.json({ ...result, chunked: useChunked });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// NDMI stats endpoint: POST body { nir: number[], swir: number[], bins?: number, chunked?: boolean }
app.post('/analysis/ndmi', (req, res) => {
  try {
    const { nir, swir, bins, chunked } = req.body || {};
    if (Array.isArray(nir) && nir.length > 2_000_000) {
      return res.status(413).json({ error: 'nir too large' });
    }
    if (Array.isArray(swir) && swir.length > 2_000_000) {
      return res.status(413).json({ error: 'swir too large' });
    }
    const useChunked = chunked === true || (Array.isArray(nir) && nir.length > 50000);
    const result = computeNdmi(
      nir,
      swir,
      Number.isFinite(bins) ? Number(bins) : 10,
      useChunked
    );
    return res.json({ ...result, chunked: useChunked });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Cloud/shadow masking endpoint: POST { blue:number[], green:number[], red:number[], maskType?:'cloud'|'shadow'|'both', cloudThreshold?:number, shadowThreshold?:number }
app.post('/analysis/mask', (req, res) => {
  try {
    const { blue, green, red, maskType = 'both', cloudThreshold = 0.6, shadowThreshold = 0.15 } = req.body || {};
    if (!Array.isArray(blue) || !Array.isArray(green) || !Array.isArray(red)) {
      return res.status(400).json({ error: 'blue, green, and red must be arrays' });
    }
    if (blue.length !== green.length || green.length !== red.length) {
      return res.status(400).json({ error: 'All band arrays must have the same length' });
    }
    if (blue.length > 2_000_000) {
      return res.status(413).json({ error: 'Arrays too large' });
    }

    const masked = new Array(blue.length);
    let maskedCount = 0;
    const originalValues = [];
    const maskedValues = [];

    for (let i = 0; i < blue.length; i++) {
      const b = Number(blue[i]);
      const g = Number(green[i]);
      const r = Number(red[i]);
      const brightness = (b + g + r) / 3;
      let isMasked = false;

      if (maskType === 'cloud') {
        isMasked = brightness > cloudThreshold;
      } else if (maskType === 'shadow') {
        isMasked = brightness < shadowThreshold;
      } else if (maskType === 'both') {
        isMasked = brightness > cloudThreshold || brightness < shadowThreshold;
      }

      masked[i] = isMasked;
      if (isMasked) maskedCount++;

      if (Number.isFinite(brightness)) {
        originalValues.push(brightness);
        if (!isMasked) {
          maskedValues.push(brightness);
        }
      }
    }

    const originalStats = computeBasicStats(originalValues);
    const maskedStats = computeBasicStats(maskedValues);

    return res.json({
      masked,
      maskedCount,
      totalCount: blue.length,
      maskedPercent: (maskedCount / blue.length) * 100,
      stats: {
        original: originalStats,
        masked: maskedStats,
      },
      maskType,
      thresholds: { cloud: cloudThreshold, shadow: shadowThreshold },
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Zonal stats endpoint: POST { values:number[], zones:(string|number)[] }
app.post('/analysis/zonal-stats', (req, res) => {
  try {
    const { values, zones } = req.body || {};
    if (Array.isArray(values) && values.length > 2_000_000) {
      return res.status(413).json({ error: 'values too large' });
    }
    if (Array.isArray(zones) && zones.length > 2_000_000) {
      return res.status(413).json({ error: 'zones too large' });
    }
    const result = computeZonalStats(values, zones);
    return res.json(result);
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Terrain endpoint: POST { elevations:number[], width:number, height:number, cellSize?:number }
app.post('/analysis/terrain', (req, res) => {
  try {
    const { elevations, width, height, cellSize } = req.body || {}
    if (!Array.isArray(elevations) || !Number.isFinite(width) || !Number.isFinite(height)) {
      return res.status(400).json({ error: 'elevations[], width, height are required' })
    }
    if (elevations.length > 4_000_000) {
      return res.status(413).json({ error: 'elevations too large' })
    }
    const result = computeSlopeAspect(elevations, Number(width), Number(height), Number(cellSize) || 1)
    return res.json({ slope: result.slopeStats, aspect: result.aspectStats })
  } catch (e) {
    return res.status(400).json({ error: e.message || 'invalid request' })
  }
})

app.get('/catalog/items', async (_req, res) => {
  const ids = await listJson(path.join(CATALOG_DIR, 'items'));
  res.json({ items: ids });
});

app.get('/catalog/items/:id', async (req, res) => {
  const fp = resolveItemPath(req.params.id);
  try {
    const stat = await fs.stat(fp);
    if (!stat.isFile()) return res.status(404).json({ error: 'Not found' });
    const data = await readJson(fp);
    res.json(data);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

app.get('/catalog/collections', async (_req, res) => {
  const ids = await listJson(path.join(CATALOG_DIR, 'collections'));
  res.json({ collections: ids });
});

app.get('/catalog/collections/:id', async (req, res) => {
  const fp = resolveCollectionPath(req.params.id);
  try {
    const stat = await fs.stat(fp);
    if (!stat.isFile()) return res.status(404).json({ error: 'Not found' });
    const data = await readJson(fp);
    res.json(data);
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

async function ensureDir(dir) {
  try { await fs.mkdir(dir, { recursive: true }) } catch {}
}

// Upload small JSON payloads and retrieve by id
app.post('/upload/json', async (req, res) => {
  try {
    if (!req.body || typeof req.body !== 'object') {
      return res.status(400).json({ error: 'JSON body required' })
    }
    await ensureDir(UPLOAD_DIR)
    const id = `${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(9)), b => b.toString(36)).join('').slice(0, 6)}`
    const fp = path.join(UPLOAD_DIR, `${id}.json`)
    await fs.writeFile(fp, JSON.stringify(req.body, null, 2), 'utf8')
    const stat = await fs.stat(fp)
    return res.json({ id, bytes: stat.size })
  } catch (e) {
    return res.status(500).json({ error: e.message || 'upload failed' })
  }
})

app.get('/upload/:id', async (req, res) => {
  try {
    const fp = path.join(UPLOAD_DIR, `${req.params.id}.json`)
    const raw = await fs.readFile(fp, 'utf8')
    res.type('application/json').send(raw)
  } catch {
    res.status(404).json({ error: 'Not found' })
  }
})

// Raster tile endpoint: GET /tiles/raster/:z/:x/:y?style=default|satellite|terrain|ndvi|ndwi
app.get('/tiles/raster/:z/:x/:y', (req, res) => {
  try {
    const z = Number.parseInt(req.params.z, 10);
    const x = Number.parseInt(req.params.x, 10);
    const y = Number.parseInt(req.params.y, 10);
    const style = req.query.style || 'default';

    if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return res.status(400).json({ error: 'Invalid tile coordinates' });
    }
    if (z < 0 || z > 18 || x < 0 || y < 0) {
      return res.status(400).json({ error: 'Tile coordinates out of range' });
    }

    const cacheKey = getCacheKey('raster', z, x, y, style);
    const cached = getCachedTile(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const start = Date.now();
    const tile = generateRasterTile(z, x, y, style);
    const elapsed = Date.now() - start;
    setCachedTile(cacheKey, tile);

    res.json({ ...tile, cached: false, elapsedMs: elapsed });
  } catch (e) {
    logger.error('Tile generation error', e, { z, x, y, style });
    metrics.recordError('TileGenerationError', '/tiles/raster');
    return res.status(500).json({ error: e.message || 'Tile generation failed', stack: process.env.NODE_ENV === 'development' ? e.stack : undefined });
  }
});

// Vector tile endpoint: GET /tiles/vector/:z/:x/:y
app.get('/tiles/vector/:z/:x/:y', (req, res) => {
  try {
    const z = Number.parseInt(req.params.z, 10);
    const x = Number.parseInt(req.params.x, 10);
    const y = Number.parseInt(req.params.y, 10);

    if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return res.status(400).json({ error: 'Invalid tile coordinates' });
    }
    if (z < 0 || z > 18 || x < 0 || y < 0) {
      return res.status(400).json({ error: 'Tile coordinates out of range' });
    }

    const cacheKey = getCacheKey('vector', z, x, y);
    const cached = getCachedTile(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const start = Date.now();
    // In production, load actual vector features from catalog/geodatabase
    const tile = generateVectorTile(z, x, y, []);
    const elapsed = Date.now() - start;
    setCachedTile(cacheKey, tile);

    res.json({ ...tile, cached: false, elapsedMs: elapsed });
  } catch (e) {
    return res.status(500).json({ error: e.message || 'Tile generation failed' });
  }
});

// Tile info endpoint: GET /tiles/info
app.get('/tiles/info', (_req, res) => {
  res.json({
    formats: ['raster', 'vector'],
    styles: ['default', 'satellite', 'terrain', 'ndvi', 'ndwi'],
    scheme: 'xyz',
    minZoom: 0,
    maxZoom: 18,
    tileSize: 256,
    cache: {
      enabled: true,
      ttl: CACHE_TTL / 1000, // seconds
      size: tileCache.size,
      maxSize: 1000,
    },
  });
});

// Vector spatial operations

// Calculate bounding box for a feature
function calculateBBox(feature) {
  const coords = feature.geometry.coordinates;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  function processCoord(coord) {
    if (typeof coord === 'number') return;
    if (Array.isArray(coord)) {
      if (coord.length > 0 && typeof coord[0] === 'number') {
        const [x, y] = coord;
        minX = Math.min(minX, x); minY = Math.min(minY, y);
        maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
      } else {
        coord.forEach(processCoord);
      }
    }
  }
  processCoord(coords);
  return { minX, minY, maxX, maxY };
}

function bboxIntersects(bbox1, bbox2) {
  return !(bbox1.maxX < bbox2.minX || bbox1.minX > bbox2.maxX ||
           bbox1.maxY < bbox2.minY || bbox1.minY > bbox2.maxY);
}

function distance(p1, p2) {
  const R = 6371000; // Earth radius in meters
  const dLat = (p2.y - p1.y) * Math.PI / 180;
  const dLon = (p2.x - p1.x) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(p1.y * Math.PI / 180) * Math.cos(p2.y * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Spatial join: POST { queryBbox: {minX,minY,maxX,maxY}, targetFeatures: [...] }
app.post('/analysis/spatial-join', (req, res) => {
  try {
    const { queryBbox, targetFeatures } = req.body || {};
    if (!queryBbox || !Array.isArray(targetFeatures)) {
      return res.status(400).json({ error: 'queryBbox and targetFeatures array required' });
    }
    const results = targetFeatures.filter(f => {
      const bbox = f.bbox || calculateBBox(f);
      return bboxIntersects(queryBbox, bbox);
    });
    return res.json({ matched: results.length, features: results });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Buffer: POST { center: {x,y}, radiusMeters: number, segments?: number }
app.post('/analysis/buffer', (req, res) => {
  try {
    const { center, radiusMeters, segments = 32 } = req.body || {};
    if (!center || typeof radiusMeters !== 'number') {
      return res.status(400).json({ error: 'center {x,y} and radiusMeters required' });
    }
    const radiusDegrees = radiusMeters / 111000; // Approximation
    const coords = [];
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * 2 * Math.PI;
      coords.push([center.x + radiusDegrees * Math.cos(angle), center.y + radiusDegrees * Math.sin(angle)]);
    }
    const buffer = {
      geometry: { type: 'Polygon', coordinates: [[...coords]] },
      properties: { bufferRadiusM: radiusMeters, centerX: center.x, centerY: center.y }
    };
    return res.json({ buffer, bbox: calculateBBox(buffer) });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Proximity/Nearest: POST { queryPoint: {x,y}, targetFeatures: [...], maxResults?: number, maxDistanceMeters?: number }
app.post('/analysis/proximity', (req, res) => {
  try {
    const { queryPoint, targetFeatures, maxResults = 10, maxDistanceMeters } = req.body || {};
    if (!queryPoint || !Array.isArray(targetFeatures)) {
      return res.status(400).json({ error: 'queryPoint {x,y} and targetFeatures array required' });
    }
    const results = [];
    for (const f of targetFeatures) {
      if (f.geometry.type !== 'Point') continue;
      const coords = f.geometry.coordinates;
      const point = { x: coords[0], y: coords[1] };
      const dist = distance(queryPoint, point);
      if (maxDistanceMeters === undefined || dist <= maxDistanceMeters) {
        results.push({ feature: f, distance: dist });
      }
    }
    results.sort((a, b) => a.distance - b.distance);
    return res.json({ nearest: results.slice(0, maxResults) });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// LiDAR Processing

// Ground/non-ground classification: POST { points: [{x,y,z}], cellSize?: number, maxSlope?: number, initialHeight?: number, maxHeight?: number }
app.post('/analysis/lidar/classify', (req, res) => {
  try {
    const { points, cellSize = 1.0, maxSlope = 30.0, initialHeight = 0.5, maxHeight = 3.0 } = req.body || {};
    if (!Array.isArray(points) || points.length === 0) {
      return res.status(400).json({ error: 'points array required' });
    }
    if (points.length > 1_000_000) {
      return res.status(413).json({ error: 'too many points' });
    }

    // Find bbox
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of points) {
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
    }

    // Create grid
    const cols = Math.ceil((maxX - minX) / cellSize);
    const rows = Math.ceil((maxY - minY) / cellSize);
    const grid = new Array(rows).fill(null).map(() => new Array(cols).fill(null));

    // Find lowest point in each cell
    for (const p of points) {
      const col = Math.floor((p.x - minX) / cellSize);
      const row = Math.floor((p.y - minY) / cellSize);
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        if (grid[row][col] === null || p.z < grid[row][col]) {
          grid[row][col] = p.z;
        }
      }
    }

    // Classify points
    const classified = [];
    let groundCount = 0, nonGroundCount = 0;
    const groundZs = [], nonGroundZs = [];

    for (const p of points) {
      const col = Math.floor((p.x - minX) / cellSize);
      const row = Math.floor((p.y - minY) / cellSize);
      const cellZ = (row >= 0 && row < rows && col >= 0 && col < cols) ? grid[row][col] : null;
      const isGround = cellZ !== null && Math.abs(p.z - cellZ) <= initialHeight && p.z <= cellZ + maxHeight;

      classified.push({ ...p, classification: isGround ? 2 : 1 });
      if (isGround) {
        groundCount++;
        groundZs.push(p.z);
      } else {
        nonGroundCount++;
        nonGroundZs.push(p.z);
      }
    }

    function calcStats(vals) {
      if (vals.length === 0) return { minZ: NaN, maxZ: NaN, meanZ: NaN, stdZ: NaN };
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      return { minZ: Math.min(...vals), maxZ: Math.max(...vals), meanZ: mean, stdZ: Math.sqrt(variance) };
    }

    return res.json({
      points: classified,
      groundCount,
      nonGroundCount,
      stats: { ground: calcStats(groundZs), nonGround: calcStats(nonGroundZs) }
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// DTM generation: POST { groundPoints: [{x,y,z}], cellSize?: number, bbox?: {minX,minY,maxX,maxY} }
app.post('/analysis/lidar/dtm', (req, res) => {
  try {
    const { groundPoints, cellSize = 1.0, bbox } = req.body || {};
    if (!Array.isArray(groundPoints) || groundPoints.length === 0) {
      return res.status(400).json({ error: 'groundPoints array required' });
    }

    let bboxCalc = bbox;
    if (!bboxCalc) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of groundPoints) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      }
      bboxCalc = { minX, minY, maxX, maxY };
    }

    const cols = Math.ceil((bboxCalc.maxX - bboxCalc.minX) / cellSize);
    const rows = Math.ceil((bboxCalc.maxY - bboxCalc.minY) / cellSize);
    const grid = new Array(rows).fill(null).map(() => new Array(cols).fill(NaN));
    const cellSums = new Array(rows).fill(null).map(() => new Array(cols).fill(0));
    const cellCounts = new Array(rows).fill(null).map(() => new Array(cols).fill(0));

    for (const p of groundPoints) {
      const col = Math.floor((p.x - bboxCalc.minX) / cellSize);
      const row = Math.floor((p.y - bboxCalc.minY) / cellSize);
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        cellSums[row][col] += p.z;
        cellCounts[row][col]++;
      }
    }

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (cellCounts[row][col] > 0) {
          grid[row][col] = cellSums[row][col] / cellCounts[row][col];
        }
      }
    }

    const flatGrid = grid.flat();
    const validElevs = flatGrid.filter(v => Number.isFinite(v));
    const stats = validElevs.length > 0 ? {
      min: Math.min(...validElevs),
      max: Math.max(...validElevs),
      mean: validElevs.reduce((a, b) => a + b, 0) / validElevs.length
    } : { min: NaN, max: NaN, mean: NaN };

    return res.json({
      grid,
      bbox: bboxCalc,
      cellSize,
      width: cols,
      height: rows,
      stats
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// DSM generation: POST { allPoints: [{x,y,z}], cellSize?: number, bbox?: {minX,minY,maxX,maxY} }
app.post('/analysis/lidar/dsm', (req, res) => {
  try {
    const { allPoints, cellSize = 1.0, bbox } = req.body || {};
    if (!Array.isArray(allPoints) || allPoints.length === 0) {
      return res.status(400).json({ error: 'allPoints array required' });
    }

    let bboxCalc = bbox;
    if (!bboxCalc) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const p of allPoints) {
        minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
        maxX = Math.max(maxX, p.x); maxY = Math.max(maxY, p.y);
      }
      bboxCalc = { minX, minY, maxX, maxY };
    }

    const cols = Math.ceil((bboxCalc.maxX - bboxCalc.minX) / cellSize);
    const rows = Math.ceil((bboxCalc.maxY - bboxCalc.minY) / cellSize);
    const grid = new Array(rows).fill(null).map(() => new Array(cols).fill(NaN));

    for (const p of allPoints) {
      const col = Math.floor((p.x - bboxCalc.minX) / cellSize);
      const row = Math.floor((p.y - bboxCalc.minY) / cellSize);
      if (row >= 0 && row < rows && col >= 0 && col < cols) {
        if (isNaN(grid[row][col]) || p.z > grid[row][col]) {
          grid[row][col] = p.z;
        }
      }
    }

    const flatGrid = grid.flat();
    const validElevs = flatGrid.filter(v => Number.isFinite(v));
    const stats = validElevs.length > 0 ? {
      min: Math.min(...validElevs),
      max: Math.max(...validElevs),
      mean: validElevs.reduce((a, b) => a + b, 0) / validElevs.length
    } : { min: NaN, max: NaN, mean: NaN };

    return res.json({
      grid,
      bbox: bboxCalc,
      cellSize,
      width: cols,
      height: rows,
      stats
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// CHM generation: POST { dsm: {...}, dtm: {...} }
app.post('/analysis/lidar/chm', (req, res) => {
  try {
    const { dsm, dtm } = req.body || {};
    if (!dsm || !dtm || !dsm.grid || !dtm.grid) {
      return res.status(400).json({ error: 'dsm and dtm objects with grid required' });
    }
    if (dsm.width !== dtm.width || dsm.height !== dtm.height) {
      return res.status(400).json({ error: 'DSM and DTM must have same dimensions' });
    }

    const grid = new Array(dsm.height).fill(null).map(() => new Array(dsm.width).fill(NaN));
    const chmValues = [];

    for (let row = 0; row < dsm.height; row++) {
      for (let col = 0; col < dsm.width; col++) {
        const dsmVal = dsm.grid[row][col];
        const dtmVal = dtm.grid[row][col];
        if (Number.isFinite(dsmVal) && Number.isFinite(dtmVal)) {
          const chm = Math.max(0, dsmVal - dtmVal);
          grid[row][col] = chm;
          chmValues.push(chm);
        }
      }
    }

    const stats = chmValues.length > 0 ? {
      min: Math.min(...chmValues),
      max: Math.max(...chmValues),
      mean: chmValues.reduce((a, b) => a + b, 0) / chmValues.length
    } : { min: NaN, max: NaN, mean: NaN };

    return res.json({
      grid,
      bbox: dsm.bbox,
      cellSize: dsm.cellSize,
      width: dsm.width,
      height: dsm.height,
      stats
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Terrain derivatives: POST { dtm: {...} }
app.post('/analysis/lidar/terrain-derivatives', (req, res) => {
  try {
    const { dtm } = req.body || {};
    if (!dtm || !dtm.grid) {
      return res.status(400).json({ error: 'dtm object with grid required' });
    }

    const slope = new Array(dtm.height).fill(null).map(() => new Array(dtm.width).fill(NaN));
    const aspect = new Array(dtm.height).fill(null).map(() => new Array(dtm.width).fill(NaN));
    const slopeValues = [];
    const aspectValues = [];

    for (let row = 1; row < dtm.height - 1; row++) {
      for (let col = 1; col < dtm.width - 1; col++) {
        const z = dtm.grid[row][col];
        if (!Number.isFinite(z)) continue;

        const z11 = dtm.grid[row - 1][col - 1] ?? z;
        const z12 = dtm.grid[row - 1][col] ?? z;
        const z13 = dtm.grid[row - 1][col + 1] ?? z;
        const z21 = dtm.grid[row][col - 1] ?? z;
        const z23 = dtm.grid[row][col + 1] ?? z;
        const z31 = dtm.grid[row + 1][col - 1] ?? z;
        const z32 = dtm.grid[row + 1][col] ?? z;
        const z33 = dtm.grid[row + 1][col + 1] ?? z;

        const dx = ((z13 + 2 * z23 + z33) - (z11 + 2 * z21 + z31)) / (8 * dtm.cellSize);
        const dy = ((z31 + 2 * z32 + z33) - (z11 + 2 * z12 + z13)) / (8 * dtm.cellSize);

        const slopeRad = Math.atan(Math.sqrt(dx * dx + dy * dy));
        const slopeDeg = (slopeRad * 180) / Math.PI;
        slope[row][col] = slopeDeg;
        slopeValues.push(slopeDeg);

        const aspectRad = Math.atan2(dy, dx);
        let aspectDeg = (aspectRad * 180) / Math.PI;
        if (aspectDeg < 0) aspectDeg += 360;
        aspect[row][col] = aspectDeg;
        aspectValues.push(aspectDeg);
      }
    }

    const stats = {
      slope: slopeValues.length > 0 ? {
        min: Math.min(...slopeValues),
        max: Math.max(...slopeValues),
        mean: slopeValues.reduce((a, b) => a + b, 0) / slopeValues.length
      } : { min: NaN, max: NaN, mean: NaN },
      aspect: aspectValues.length > 0 ? {
        min: Math.min(...aspectValues),
        max: Math.max(...aspectValues),
        mean: aspectValues.reduce((a, b) => a + b, 0) / aspectValues.length
      } : { min: NaN, max: NaN, mean: NaN }
    };

    return res.json({ slope, aspect, stats });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Feature extraction: POST { chm: {...}, type: 'buildings'|'trees'|'both', params?: {...} }
app.post('/analysis/lidar/extract-features', (req, res) => {
  try {
    const { chm, type = 'both', params = {} } = req.body || {};
    if (!chm || !chm.grid) {
      return res.status(400).json({ error: 'chm object with grid required' });
    }

    const buildings = [];
    const trees = [];

    // Extract buildings
    if (type === 'buildings' || type === 'both') {
      const minHeight = params.minBuildingHeight || 2.5;
      const minArea = params.minBuildingArea || 20.0;
      const visited = new Set();

      function getKey(r, c) { return `${r},${c}`; }
      function isBuildingCell(r, c) {
        if (r < 0 || r >= chm.height || c < 0 || c >= chm.width) return false;
        const h = chm.grid[r][c];
        return Number.isFinite(h) && h >= minHeight;
      }

      function floodFill(sr, sc) {
        const cells = [];
        const stack = [{ row: sr, col: sc }];
        let minR = sr, minC = sc, maxR = sr, maxC = sc;
        while (stack.length > 0) {
          const { row, col } = stack.pop();
          const key = getKey(row, col);
          if (visited.has(key) || !isBuildingCell(row, col)) continue;
          visited.add(key);
          cells.push({ row, col });
          minR = Math.min(minR, row); minC = Math.min(minC, col);
          maxR = Math.max(maxR, row); maxC = Math.max(maxC, col);
          stack.push({ row: row - 1, col }, { row: row + 1, col }, { row, col: col - 1 }, { row, col: col + 1 });
        }
        return { cells, bbox: { minR, minC, maxR, maxC } };
      }

      for (let r = 0; r < chm.height; r++) {
        for (let c = 0; c < chm.width; c++) {
          const key = getKey(r, c);
          if (visited.has(key) || !isBuildingCell(r, c)) continue;
          const { cells, bbox } = floodFill(r, c);
          const area = cells.length * chm.cellSize * chm.cellSize;
          if (area < minArea) continue;
          const heights = cells.map(c => chm.grid[c.row][c.col]).filter(Number.isFinite);
          const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
          const maxH = Math.max(...heights);
          const minH = Math.min(...heights);
          const flatness = (maxH - minH) / (avgH + 0.1);
          const w = (bbox.maxC - bbox.minC + 1) * chm.cellSize;
          const h = (bbox.maxR - bbox.minR + 1) * chm.cellSize;
          const aspectRatio = Math.max(w, h) / Math.min(w, h);
          const conf = Math.min(1.0, (flatness < 0.3 ? 0.7 : 0.3) + (area > 100 ? 0.2 : 0));
          if (flatness < 0.3 || aspectRatio < 3) {
            buildings.push({
              id: `building-${buildings.length}`,
              type: 'building',
              bbox: {
                minX: chm.bbox.minX + bbox.minC * chm.cellSize,
                minY: chm.bbox.minY + bbox.minR * chm.cellSize,
                maxX: chm.bbox.minX + (bbox.maxC + 1) * chm.cellSize,
                maxY: chm.bbox.minY + (bbox.maxR + 1) * chm.cellSize
              },
              area,
              height: avgH,
              confidence: conf,
              properties: { cellCount: cells.length, avgHeight: avgH, maxHeight: maxH, minHeight: minH, width: w, height: h, aspectRatio, flatness }
            });
          }
        }
      }
    }

    // Extract trees
    if (type === 'trees' || type === 'both') {
      const minHeight = params.minTreeHeight || 1.5;
      const maxHeight = params.maxTreeHeight || 50.0;
      const minArea = params.minTreeArea || 2.0;
      const maxArea = params.maxTreeArea || 500.0;
      const visited = new Set();

      function getKey(r, c) { return `${r},${c}`; }
      function isTreeCell(r, c) {
        if (r < 0 || r >= chm.height || c < 0 || c >= chm.width) return false;
        const h = chm.grid[r][c];
        return Number.isFinite(h) && h >= minHeight && h <= maxHeight;
      }

      function floodFill(sr, sc) {
        const cells = [];
        const stack = [{ row: sr, col: sc }];
        let minR = sr, minC = sc, maxR = sr, maxC = sc;
        while (stack.length > 0) {
          const { row, col } = stack.pop();
          const key = getKey(row, col);
          if (visited.has(key) || !isTreeCell(row, col)) continue;
          visited.add(key);
          cells.push({ row, col });
          minR = Math.min(minR, row); minC = Math.min(minC, col);
          maxR = Math.max(maxR, row); maxC = Math.max(maxC, col);
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue;
              stack.push({ row: row + dr, col: col + dc });
            }
          }
        }
        return { cells, bbox: { minR, minC, maxR, maxC } };
      }

      for (let r = 0; r < chm.height; r++) {
        for (let c = 0; c < chm.width; c++) {
          const key = getKey(r, c);
          if (visited.has(key) || !isTreeCell(r, c)) continue;
          const { cells, bbox } = floodFill(r, c);
          const area = cells.length * chm.cellSize * chm.cellSize;
          if (area < minArea || area > maxArea) continue;
          const heights = cells.map(c => chm.grid[c.row][c.col]).filter(Number.isFinite);
          const avgH = heights.reduce((a, b) => a + b, 0) / heights.length;
          const maxH = Math.max(...heights);
          const minH = Math.min(...heights);
          const hStd = Math.sqrt(heights.reduce((s, h) => s + (h - avgH) ** 2, 0) / heights.length);
          const hVar = hStd / (avgH + 0.1);
          const w = (bbox.maxC - bbox.minC + 1) * chm.cellSize;
          const h = (bbox.maxR - bbox.minR + 1) * chm.cellSize;
          const perim = 2 * (w + h);
          const circ = (perim * perim) / (4 * Math.PI * area);
          const conf = Math.min(1.0, 0.5 + (hVar > 0.1 ? 0.2 : 0) + (area > 10 && area < 200 ? 0.3 : 0));
          trees.push({
            id: `tree-${trees.length}`,
            type: 'tree',
            bbox: {
              minX: chm.bbox.minX + bbox.minC * chm.cellSize,
              minY: chm.bbox.minY + bbox.minR * chm.cellSize,
              maxX: chm.bbox.minX + (bbox.maxC + 1) * chm.cellSize,
              maxY: chm.bbox.minY + (bbox.maxR + 1) * chm.cellSize
            },
            area,
            height: avgH,
            confidence: conf,
            properties: { cellCount: cells.length, avgHeight: avgH, maxHeight: maxH, minHeight: minH, heightStd: hStd, heightVariation: hVar, width: w, height: h, circularity: circ }
          });
        }
      }
    }

    return res.json({
      buildings,
      trees,
      summary: {
        buildingCount: buildings.length,
        treeCount: trees.length,
        totalFeatures: buildings.length + trees.length
      }
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// 3D Tiles: Simple point cloud tiles for visualization
// GET /tiles/3d/:z/:x/:y?format=json|pcd
app.get('/tiles/3d/:z/:x/:y', (req, res) => {
  try {
    const z = Number.parseInt(req.params.z, 10);
    const x = Number.parseInt(req.params.x, 10);
    const y = Number.parseInt(req.params.y, 10);
    const format = req.query.format || 'json';

    if (!Number.isFinite(z) || !Number.isFinite(x) || !Number.isFinite(y)) {
      return res.status(400).json({ error: 'Invalid tile coordinates' });
    }
    if (z < 0 || z > 18 || x < 0 || y < 0) {
      return res.status(400).json({ error: 'Tile coordinates out of range' });
    }

    const bounds = tileToBounds(z, x, y);

    // Generate sample point cloud data (in production, load from actual LiDAR data)
    const points = [];
    const numPoints = Math.min(1000, Math.pow(2, Math.max(0, 10 - z))); // Fewer points at higher zoom

    for (let i = 0; i < numPoints; i++) {
      const lon = bounds.minX + Math.random() * (bounds.maxX - bounds.minX);
      const lat = bounds.minY + Math.random() * (bounds.maxY - bounds.minY);
      const elevation = 50 + Math.random() * 100; // Sample elevation
      points.push({
        x: lon,
        y: lat,
        z: elevation,
        intensity: Math.random(),
        classification: Math.random() > 0.7 ? 2 : 1 // Ground or non-ground
      });
    }

    if (format === 'pcd') {
      // Simple PCD format header
      const header = `# .PCD v0.7 - Point Cloud Data file format
VERSION 0.7
FIELDS x y z intensity classification
SIZE 4 4 4 4 4
TYPE F F F F I
COUNT 1 1 1 1 1
WIDTH ${points.length}
HEIGHT 1
VIEWPOINT 0 0 0 1 0 0 0
POINTS ${points.length}
DATA ascii
`;
      const pcdData = points.map(p => `${p.x} ${p.y} ${p.z} ${p.intensity} ${p.classification}`).join('\n');
      res.type('text/plain').send(header + pcdData);
    } else {
      // JSON format
      res.json({
        z, x, y,
        bounds,
        format: 'json',
        points,
        count: points.length,
        metadata: {
          bbox: bounds,
          pointCount: points.length,
          hasIntensity: true,
          hasClassification: true
        }
      });
    }
  } catch (e) {
    return res.status(500).json({ error: e.message || '3D tile generation failed' });
  }
});

// 3D Tiles info
app.get('/tiles/3d/info', (_req, res) => {
  res.json({
    format: '3d-point-cloud',
    supportedFormats: ['json', 'pcd'],
    scheme: 'xyz',
    minZoom: 0,
    maxZoom: 18,
    pointFields: ['x', 'y', 'z', 'intensity', 'classification'],
    description: 'Simple 3D point cloud tiles for visualization'
  });
});

// Risk Scoring: POST { factors: [{name, weight, values, normalize?, invert?}] }
app.post('/analysis/risk-score', (req, res) => {
  try {
    const { factors } = req.body || {};
    if (!Array.isArray(factors) || factors.length === 0) {
      return res.status(400).json({ error: 'factors array required' });
    }

    const length = factors[0].values.length;
    for (const f of factors) {
      if (!Array.isArray(f.values) || f.values.length !== length) {
        return res.status(400).json({ error: `All factors must have same length. Factor "${f.name || 'unknown'}" has length ${f.values?.length || 0}, expected ${length}` });
      }
    }

    // Normalize factors
    function normalizeMinMax(vals) {
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const range = max - min;
      if (range === 0) return vals.map(() => 0.5);
      return vals.map(v => (v - min) / range);
    }

    function normalizeZScore(vals) {
      const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
      const variance = vals.reduce((s, v) => s + (v - mean) ** 2, 0) / vals.length;
      const std = Math.sqrt(variance);
      if (std === 0) return vals.map(() => 0.5);
      const zs = vals.map(v => (v - mean) / std);
      // Convert to [0,1] using CDF approximation
      return zs.map(z => {
        const t = 1 / (1 + 0.2316419 * Math.abs(z));
        const d = 0.3989423 * Math.exp(-(z * z) / 2);
        const p = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
        return z < 0 ? p : 1 - p;
      });
    }

    const normalized = factors.map(f => {
      let norm = f.values.map(v => Number.isFinite(v) ? v : 0);
      switch (f.normalize || 'minmax') {
        case 'minmax': norm = normalizeMinMax(norm); break;
        case 'zscore': norm = normalizeZScore(norm); break;
      }
      if (f.invert) norm = norm.map(v => 1 - v);
      norm = norm.map(v => Math.max(0, Math.min(1, v)));
      return { name: f.name, weight: f.weight || 1, normalizedValues: norm };
    });

    const totalWeight = normalized.reduce((s, f) => s + f.weight, 0);
    if (totalWeight === 0) {
      return res.status(400).json({ error: 'Total weight cannot be zero' });
    }

    const scores = [];
    const contributions = normalized.map(() => []);

    for (let i = 0; i < length; i++) {
      let sum = 0;
      normalized.forEach((f, idx) => {
        const contrib = (f.normalizedValues[i] * f.weight) / totalWeight;
        sum += contrib;
        contributions[idx].push(contrib);
      });
      scores.push(Math.max(0, Math.min(1, sum)));
    }

    const valid = scores.filter(Number.isFinite);
    const sorted = [...valid].sort((a, b) => a - b);

    return res.json({
      scores,
      factors: normalized.map((f, idx) => ({
        name: f.name,
        weight: f.weight,
        normalizedValues: f.normalizedValues,
        contribution: contributions[idx]
      })),
      statistics: {
        min: sorted[0] ?? 0,
        max: sorted[sorted.length - 1] ?? 0,
        mean: valid.reduce((a, b) => a + b, 0) / valid.length,
        std: Math.sqrt(valid.reduce((s, v) => {
          const m = valid.reduce((a, b) => a + b, 0) / valid.length;
          return s + (v - m) ** 2;
        }, 0) / valid.length),
        percentiles: {
          p25: sorted[Math.floor(sorted.length * 0.25)] ?? 0,
          p50: sorted[Math.floor(sorted.length * 0.5)] ?? 0,
          p75: sorted[Math.floor(sorted.length * 0.75)] ?? 0,
          p90: sorted[Math.floor(sorted.length * 0.9)] ?? 0,
          p95: sorted[Math.floor(sorted.length * 0.95)] ?? 0
        }
      },
      metadata: { totalWeight, factorCount: factors.length }
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Explainability: POST { predictions: number[], confidence?: number[] }
app.post('/analysis/explainability/uncertainty', (req, res) => {
  try {
    const { predictions, confidence } = req.body || {};
    if (!Array.isArray(predictions) || predictions.length === 0) {
      return res.status(400).json({ error: 'predictions array required' });
    }

    let conf = confidence;
    if (!conf) {
      conf = predictions.map(p => {
        const dist = Math.abs(p - 0.5);
        return dist * 2;
      });
    }
    conf = conf.map(c => Math.max(0, Math.min(1, c)));
    const uncertainty = conf.map(c => 1 - c);

    const validConf = conf.filter(Number.isFinite);
    const validUnc = uncertainty.filter(Number.isFinite);

    return res.json({
      values: predictions,
      confidence: conf,
      uncertainty,
      metadata: {
        minConfidence: validConf.length > 0 ? Math.min(...validConf) : 0,
        maxConfidence: validConf.length > 0 ? Math.max(...validConf) : 1,
        meanConfidence: validConf.length > 0 ? validConf.reduce((a, b) => a + b, 0) / validConf.length : 0.5,
        minUncertainty: validUnc.length > 0 ? Math.min(...validUnc) : 0,
        maxUncertainty: validUnc.length > 0 ? Math.max(...validUnc) : 1,
        meanUncertainty: validUnc.length > 0 ? validUnc.reduce((a, b) => a + b, 0) / validUnc.length : 0.5
      }
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Feature Importance: POST { features: [{name, values, weights?}] }
app.post('/analysis/explainability/feature-importance', (req, res) => {
  try {
    const { features } = req.body || {};
    if (!Array.isArray(features) || features.length === 0) {
      return res.status(400).json({ error: 'features array required' });
    }

    const length = features[0].values.length;
    for (const f of features) {
      if (!Array.isArray(f.values) || f.values.length !== length) {
        return res.status(400).json({ error: `All features must have same length` });
      }
    }

    const importances = features.map(f => {
      const weights = f.weights || f.values.map(() => 1);
      const weighted = f.values.map((v, i) => (Number.isFinite(v) ? v * weights[i] : 0));
      const total = weighted.reduce((a, b) => a + Math.abs(b), 0);
      return {
        feature: f.name,
        importance: total / length,
        contribution: weighted,
        relativeImportance: 0
      };
    });

    const totalImp = importances.reduce((s, f) => s + f.importance, 0);
    if (totalImp > 0) {
      importances.forEach(f => {
        f.relativeImportance = f.importance / totalImp;
      });
    }

    importances.sort((a, b) => b.importance - a.importance);

    return res.json({ features: importances });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Change Detection: POST { before: number[], after: number[], threshold?: number, method?: 'absolute'|'relative'|'normalized' }
app.post('/analysis/change-detection', (req, res) => {
  try {
    const { before, after, threshold = 0.1, method = 'absolute' } = req.body || {};
    if (!Array.isArray(before) || !Array.isArray(after)) {
      return res.status(400).json({ error: 'before and after arrays required' });
    }
    if (before.length !== after.length) {
      return res.status(400).json({ error: `Before and after arrays must have same length. Got ${before.length} and ${after.length}` });
    }

    const changeMap = [];
    const changeMagnitude = [];
    const changePixels = [];

    for (let i = 0; i < before.length; i++) {
      const b = before[i];
      const a = after[i];
      if (!Number.isFinite(b) || !Number.isFinite(a)) {
        changeMap.push(0);
        changeMagnitude.push(0);
        continue;
      }

      let change;
      switch (method) {
        case 'relative':
          change = b !== 0 ? (a - b) / b : 0;
          break;
        case 'normalized':
          change = a + b !== 0 ? (a - b) / (a + b) : 0;
          break;
        default:
          change = a - b;
      }

      const magnitude = Math.abs(change);
      changeMagnitude.push(magnitude);

      if (magnitude > threshold) {
        changeMap.push(1);
        changePixels.push(i);
      } else {
        changeMap.push(0);
      }
    }

    const validChanges = changeMagnitude.filter(m => m > 0);
    const changedCount = changePixels.length;

    return res.json({
      changeMap,
      changeMagnitude,
      statistics: {
        changedPixels: changedCount,
        unchangedPixels: before.length - changedCount,
        changeRate: before.length > 0 ? changedCount / before.length : 0,
        meanChange: validChanges.length > 0 ? validChanges.reduce((a, b) => a + b, 0) / validChanges.length : 0,
        maxChange: validChanges.length > 0 ? Math.max(...validChanges) : 0,
        minChange: validChanges.length > 0 ? Math.min(...validChanges) : 0
      },
      thresholds: {
        significantChange: threshold,
        changePixels: changePixels
      }
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Object Detection/Segmentation: POST { image: number[], model?: string, classes?: string[] }
// Simplified version - in production would use actual ML model
app.post('/analysis/object-detection', (req, res) => {
  try {
    const { image, model = 'default', classes = ['building', 'road', 'water', 'vegetation'] } = req.body || {};
    if (!Array.isArray(image) || image.length === 0) {
      return res.status(400).json({ error: 'image array required' });
    }

    // Simplified rule-based detection (in production, use actual ML model)
    const detections = [];
    const segmentation = image.map((val, idx) => {
      // Simple threshold-based classification
      let cls = 'background';
      let confidence = 0.5;

      if (val > 0.7) {
        cls = 'building';
        confidence = 0.8;
      } else if (val > 0.5 && val <= 0.7) {
        cls = 'road';
        confidence = 0.7;
      } else if (val > 0.3 && val <= 0.5) {
        cls = 'vegetation';
        confidence = 0.6;
      } else if (val > 0.1 && val <= 0.3) {
        cls = 'water';
        confidence = 0.65;
      }

      // Create bounding boxes for detected objects (simplified)
      if (cls !== 'background' && Math.random() > 0.95) {
        const size = 5 + Math.random() * 10;
        detections.push({
          class: cls,
          confidence: confidence + (Math.random() - 0.5) * 0.2,
          bbox: {
            x: idx % 100,
            y: Math.floor(idx / 100),
            width: size,
            height: size
          }
        });
      }

      return { class: cls, confidence };
    });

    // Calculate metrics
    const classCounts = {};
    classes.forEach(c => classCounts[c] = 0);
    segmentation.forEach(s => {
      if (classCounts[s.class] !== undefined) {
        classCounts[s.class]++;
      }
    });

    return res.json({
      detections: detections.slice(0, 50), // Limit to 50 detections
      segmentation,
      statistics: {
        totalPixels: image.length,
        classCounts,
        detectionCount: detections.length,
        meanConfidence: detections.length > 0
          ? detections.reduce((s, d) => s + d.confidence, 0) / detections.length
          : 0
      },
      metadata: {
        model,
        classes,
        method: 'rule-based' // In production: 'ml-model'
      }
    });
  } catch (e) {
    const endpoint = req.path || req.route?.path || 'unknown';
    logger.error('Analysis error', e, {
      endpoint,
      method: req.method,
      bodySize: JSON.stringify(req.body || {}).length
    });
    metrics.recordError(e.name || 'AnalysisError', endpoint);
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

// Model Registry
const modelRegistry = {
  models: new Map(),
  registerModel(model) {
    const now = new Date().toISOString();
    const full = { ...model, createdAt: now, updatedAt: now };
    this.models.set(model.id, full);
    return full;
  },
  getModel(id) { return this.models.get(id); },
  listModels() { return Array.from(this.models.values()); },
  addVersion(modelId, version) {
    const m = this.models.get(modelId);
    if (!m) throw new Error(`Model ${modelId} not found`);
    m.versions.push({ ...version, modelId });
    m.updatedAt = new Date().toISOString();
    if (!m.defaultVersion) m.defaultVersion = version.version;
    return version;
  }
};

// Inference Jobs
const jobQueue = {
  jobs: new Map(),
  processing: new Set(),
  createJob(modelId, input, opts = {}) {
    const id = `job-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const job = {
      id, modelId, modelVersion: opts.modelVersion, input,
      status: 'pending', createdAt: new Date().toISOString(),
      retryCount: 0, maxRetries: opts.maxRetries || 3, metadata: opts.metadata
    };
    this.jobs.set(id, job);
    return job;
  },
  getJob(id) { return this.jobs.get(id); },
  listJobs(status) {
    const jobs = Array.from(this.jobs.values());
    return status ? jobs.filter(j => j.status === status) : jobs;
  },
  updateJobStatus(id, status, result, error) {
    const job = this.jobs.get(id);
    if (!job) throw new Error(`Job ${id} not found`);
    job.status = status;
    if (status === 'running' && !job.startedAt) {
      job.startedAt = new Date().toISOString();
      this.processing.add(id);
    }
    if (['completed', 'failed', 'cancelled'].includes(status)) {
      job.completedAt = new Date().toISOString();
      this.processing.delete(id);
      if (result) job.result = result;
      if (error) job.error = error;
    }
    return job;
  }
};

// Model Registry endpoints
app.post('/models/register', (req, res) => {
  try {
    const model = modelRegistry.registerModel(req.body);
    res.json(model);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/models', (_req, res) => {
  res.json({ models: modelRegistry.listModels() });
});

app.get('/models/:id', (req, res) => {
  const model = modelRegistry.getModel(req.params.id);
  if (!model) return res.status(404).json({ error: 'Model not found' });
  res.json(model);
});

// Inference Jobs endpoints
app.post('/jobs/create', (req, res) => {
  try {
    const { modelId, input, modelVersion, maxRetries, metadata } = req.body || {};
    if (!modelId || !input) {
      return res.status(400).json({ error: 'modelId and input required' });
    }
    const job = jobQueue.createJob(modelId, input, { modelVersion, maxRetries, metadata });
    res.json(job);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/jobs', (req, res) => {
  const status = req.query.status;
  res.json({ jobs: jobQueue.listJobs(status) });
});

app.get('/jobs/:id', (req, res) => {
  const job = jobQueue.getJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Job not found' });
  res.json(job);
});

// Review Queue (for human-in-the-loop)
const reviewQueue = {
  reviews: new Map(),
  createReview(resultId, result, metadata = {}) {
    const id = `review-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const review = {
      id, resultId, result, metadata,
      status: 'pending', createdAt: new Date().toISOString(),
      reviewedAt: null, reviewer: null, corrections: null
    };
    this.reviews.set(id, review);
    return review;
  },
  getReview(id) { return this.reviews.get(id); },
  listReviews(status) {
    const reviews = Array.from(this.reviews.values());
    return status ? reviews.filter(r => r.status === status) : reviews;
  },
  submitReview(id, reviewer, corrections) {
    const review = this.reviews.get(id);
    if (!review) throw new Error(`Review ${id} not found`);
    review.status = 'reviewed';
    review.reviewedAt = new Date().toISOString();
    review.reviewer = reviewer;
    review.corrections = corrections;
    return review;
  }
};

app.post('/reviews/create', (req, res) => {
  try {
    const { resultId, result, metadata } = req.body || {};
    if (!resultId || !result) {
      return res.status(400).json({ error: 'resultId and result required' });
    }
    const review = reviewQueue.createReview(resultId, result, metadata);
    res.json(review);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/reviews', (req, res) => {
  const status = req.query.status;
  res.json({ reviews: reviewQueue.listReviews(status) });
});

app.get('/reviews/:id', (req, res) => {
  const review = reviewQueue.getReview(req.params.id);
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

app.post('/reviews/:id/submit', (req, res) => {
  try {
    const { reviewer, corrections } = req.body || {};
    if (!reviewer) {
      return res.status(400).json({ error: 'reviewer required' });
    }
    const review = reviewQueue.submitReview(req.params.id, reviewer, corrections);
    res.json(review);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Phase 5: Projects and AOI Workflows

const projectStore = {
  projects: new Map(),
  aois: new Map(),
  runs: new Map(),
  createProject(project) {
    const now = new Date().toISOString();
    const full = { ...project, aois: [], analysisRuns: [], createdAt: now, updatedAt: now };
    this.projects.set(project.id, full);
    return full;
  },
  getProject(id) { return this.projects.get(id); },
  listProjects(ownerId, orgId) {
    let projects = Array.from(this.projects.values());
    if (ownerId) projects = projects.filter(p => p.ownerId === ownerId);
    if (orgId) projects = projects.filter(p => p.organizationId === orgId);
    return projects;
  },
  addAOI(projectId, aoi) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    const id = `aoi-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const now = new Date().toISOString();
    const full = { ...aoi, id, projectId, createdAt: now, updatedAt: now };
    this.aois.set(id, full);
    project.aois.push(full);
    project.updatedAt = now;
    return full;
  },
  getAOI(id) { return this.aois.get(id); },
  listAOIs(projectId) {
    const project = this.projects.get(projectId);
    return project?.aois || [];
  },
  createAnalysisRun(projectId, run) {
    const project = this.projects.get(projectId);
    if (!project) throw new Error(`Project ${projectId} not found`);
    const id = `run-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const now = new Date().toISOString();
    const full = { ...run, id, projectId, status: 'pending', createdAt: now };
    this.runs.set(id, full);
    project.analysisRuns.push(full);
    project.updatedAt = now;
    return full;
  },
  getAnalysisRun(id) { return this.runs.get(id); },
  listAnalysisRuns(projectId, aoiId, status) {
    const project = this.projects.get(projectId);
    if (!project) return [];
    let runs = project.analysisRuns;
    if (aoiId) runs = runs.filter(r => r.aoiId === aoiId);
    if (status) runs = runs.filter(r => r.status === status);
    return runs;
  },
  updateAnalysisRunStatus(id, status, output, error) {
    const run = this.runs.get(id);
    if (!run) throw new Error(`Analysis run ${id} not found`);
    run.status = status;
    if (status === 'running' && !run.startedAt) run.startedAt = new Date().toISOString();
    if (['completed', 'failed', 'cancelled'].includes(status)) {
      run.completedAt = new Date().toISOString();
      if (output) run.output = output;
      if (error) run.error = error;
    }
    const project = this.projects.get(run.projectId);
    if (project) project.updatedAt = new Date().toISOString();
    return run;
  }
};

// Projects endpoints
app.post('/projects', (req, res) => {
  try {
    const project = projectStore.createProject(req.body);
    res.json(project);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/projects', (req, res) => {
  const { ownerId, organizationId } = req.query || {};
  res.json({ projects: projectStore.listProjects(ownerId, organizationId) });
});

app.get('/projects/:id', (req, res) => {
  const project = projectStore.getProject(req.params.id);
  if (!project) return res.status(404).json({ error: 'Project not found' });
  res.json(project);
});

// AOI endpoints
app.post('/projects/:projectId/aois', (req, res) => {
  try {
    // Calculate bbox from geometry
    const geom = req.body.geometry;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    function processCoords(c) {
      if (Array.isArray(c)) {
        if (c.length > 0 && typeof c[0] === 'number') {
          minX = Math.min(minX, c[0]); minY = Math.min(minY, c[1]);
          maxX = Math.max(maxX, c[0]); maxY = Math.max(maxY, c[1]);
        } else c.forEach(processCoords);
      }
    }
    processCoords(geom.coordinates);
    const aoi = projectStore.addAOI(req.params.projectId, {
      ...req.body,
      bbox: { minX, minY, maxX, maxY }
    });
    res.json(aoi);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/projects/:projectId/aois', (req, res) => {
  res.json({ aois: projectStore.listAOIs(req.params.projectId) });
});

app.get('/aois/:id', (req, res) => {
  const aoi = projectStore.getAOI(req.params.id);
  if (!aoi) return res.status(404).json({ error: 'AOI not found' });
  res.json(aoi);
});

// Analysis runs endpoints
app.post('/projects/:projectId/runs', (req, res) => {
  try {
    const run = projectStore.createAnalysisRun(req.params.projectId, req.body);
    res.json(run);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/projects/:projectId/runs', (req, res) => {
  const { aoiId, status } = req.query || {};
  res.json({ runs: projectStore.listAnalysisRuns(req.params.projectId, aoiId, status) });
});

app.get('/runs/:id', (req, res) => {
  const run = projectStore.getAnalysisRun(req.params.id);
  if (!run) return res.status(404).json({ error: 'Analysis run not found' });
  res.json(run);
});

app.patch('/runs/:id/status', (req, res) => {
  try {
    const { status, output, error } = req.body || {};
    const run = projectStore.updateAnalysisRunStatus(req.params.id, status, output, error);
    res.json(run);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Scheduling endpoints
const scheduler = {
  schedules: new Map(),
  jobs: new Map(),
  notificationConfigs: new Map(),
  createSchedule(schedule) {
    const id = `schedule-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const full = { ...schedule, id, runCount: 0, enabled: schedule.enabled !== false };
    full.nextRunAt = this.calculateNextRun(full);
    this.schedules.set(id, full);
    return full;
  },
  getSchedule(id) { return this.schedules.get(id); },
  listSchedules(projectId, enabled) {
    let schedules = Array.from(this.schedules.values());
    if (projectId) schedules = schedules.filter(s => s.projectId === projectId);
    if (enabled !== undefined) schedules = schedules.filter(s => s.enabled === enabled);
    return schedules;
  },
  calculateNextRun(schedule) {
    if (!schedule.enabled) return undefined;
    const now = new Date();
    let next = new Date(now);
    switch (schedule.scheduleType) {
      case 'daily': next.setDate(next.getDate() + 1); next.setHours(0, 0, 0, 0); break;
      case 'weekly': next.setDate(next.getDate() + 7); next.setHours(0, 0, 0, 0); break;
      case 'monthly': next.setMonth(next.getMonth() + 1); next.setDate(1); next.setHours(0, 0, 0, 0); break;
      default: return undefined;
    }
    return next.toISOString();
  }
};

app.post('/schedules', (req, res) => {
  try {
    const schedule = scheduler.createSchedule(req.body);
    res.json(schedule);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/schedules', (req, res) => {
  const { projectId, enabled } = req.query || {};
  res.json({ schedules: scheduler.listSchedules(projectId, enabled === 'true') });
});

app.get('/schedules/:id', (req, res) => {
  const schedule = scheduler.getSchedule(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Schedule not found' });
  res.json(schedule);
});

// Export endpoints
app.post('/export', (req, res) => {
  try {
    const { data, format, options = {} } = req.body || {};
    if (!data || !format) {
      return res.status(400).json({ error: 'data and format required' });
    }

    let content, contentType;
    const id = `export-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;

    switch (format) {
      case 'csv':
        contentType = 'text/csv';
        const keys = new Set();
        (Array.isArray(data) ? data : [data]).forEach(row => Object.keys(row).forEach(k => keys.add(k)));
        const headers = Array.from(keys);
        const rows = [headers.join(',')];
        (Array.isArray(data) ? data : [data]).forEach(row => {
          rows.push(headers.map(h => {
            const v = row[h];
            return v === null || v === undefined ? '' : String(v).includes(',') ? `"${String(v).replace(/"/g, '""')}"` : String(v);
          }).join(','));
        });
        if (options.includeWatermark) rows.push(`\n# Generated by Geospatial Health Platform - ${new Date().toISOString()}`);
        content = rows.join('\n');
        break;
      case 'geopackage':
      case 'geojson':
        contentType = 'application/json';
        content = JSON.stringify({ ...data, metadata: { exportedAt: new Date().toISOString(), version: options.version || '1.0.0' } }, null, 2);
        break;
      case 'pdf':
        contentType = 'text/html'; // Simplified
        content = `<html><body><h1>${data.title || 'Export'}</h1><pre>${JSON.stringify(data, null, 2)}</pre>${options.includeWatermark ? `<div style="position:fixed;bottom:10px;right:10px;color:#ccc;font-size:10px">Geospatial Health Platform - ${new Date().toISOString()}</div>` : ''}</body></html>`;
        break;
      default:
        return res.status(400).json({ error: `Unsupported format: ${format}` });
    }

    res.type(contentType).send(content);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// RBAC endpoints
const rbacStore = {
  users: new Map(),
  roles: new Map(),
  policies: new Map(),
  auditLogs: [],
  createRole(role) {
    const id = `role-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const full = { ...role, id };
    this.roles.set(id, full);
    return full;
  },
  createUser(user) {
    const id = `user-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const full = { ...user, id };
    this.users.set(id, full);
    return full;
  },
  createPolicy(policy) {
    const id = `policy-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`;
    const full = { ...policy, id };
    this.policies.set(id, full);
    return full;
  },
  checkPermission(userId, resourceType, permission, resourceId) {
    const user = this.users.get(userId);
    if (!user) {
      this.logAudit(userId, 'check_permission', resourceType, resourceId, 'denied', { reason: 'User not found' });
      return false;
    }
    // Simplified check - in production, implement full RBAC logic
    this.logAudit(userId, 'check_permission', resourceType, resourceId, 'allowed');
    return true;
  },
  logAudit(userId, action, resourceType, resourceId, result, details) {
    this.auditLogs.push({
      id: `audit-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(11)), b => b.toString(36)).join('').slice(0, 7)}`,
      userId, action, resourceType, resourceId,
      timestamp: new Date().toISOString(), result, details
    });
    if (this.auditLogs.length > 10000) this.auditLogs = this.auditLogs.slice(-10000);
  },
  getAuditLogs(userId, resourceType, startDate, endDate) {
    let logs = [...this.auditLogs];
    if (userId) logs = logs.filter(l => l.userId === userId);
    if (resourceType) logs = logs.filter(l => l.resourceType === resourceType);
    if (startDate) logs = logs.filter(l => l.timestamp >= startDate);
    if (endDate) logs = logs.filter(l => l.timestamp <= endDate);
    return logs.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }
};

app.post('/rbac/roles', (req, res) => {
  try {
    const role = rbacStore.createRole(req.body);
    res.json(role);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/rbac/users', (req, res) => {
  try {
    const user = rbacStore.createUser(req.body);
    res.json(user);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/rbac/policies', (req, res) => {
  try {
    const policy = rbacStore.createPolicy(req.body);
    res.json(policy);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.get('/rbac/audit', (req, res) => {
  const { userId, resourceType, startDate, endDate } = req.query || {};
  res.json({ logs: rbacStore.getAuditLogs(userId, resourceType, startDate, endDate) });
});

// 404 handler - must be before static files
app.use((req, res) => {
  logger.warn('Route not found', {
    method: req.method,
    path: req.path,
    ip: req.ip,
  });
  metrics.recordError('NotFound', req.path);
  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
});

// Error handler middleware (must be last, before static)
app.use((err, req, res, _next) => {
  const path = req.route?.path || req.path;
  const errorType = err.name || 'Error';
  const statusCode = err.statusCode || err.status || 500;

  metrics.recordError(errorType, path);
  logger.error('Request error', err, {
    method: req.method,
    path,
    statusCode,
  });

  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Static files should come last, after ALL API routes
app.use('/', express.static(path.join(ROOT, 'public')));

app.listen(PORT, () => {
  logger.info('Catalog API started', {
    port: PORT,
    env: process.env.NODE_ENV || 'development',
    logLevel: process.env.LOG_LEVEL || 'INFO',
  });
  console.log(`Catalog API running on http://127.0.0.1:${PORT}`);
  console.log(`Health: http://127.0.0.1:${PORT}/health`);
  console.log(`Metrics: http://127.0.0.1:${PORT}/metrics`);
  console.log(`Tile endpoints: /tiles/raster/:z/:x/:y, /tiles/vector/:z/:x/:y, /tiles/info`);
});
