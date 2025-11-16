import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';

const PORT = process.env.CATALOG_PORT ? Number(process.env.CATALOG_PORT) : 5055;
const ROOT = process.cwd();
const CATALOG_DIR = path.join(ROOT, 'catalog');

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

function computeNdvi(nir, red, bins = 10) {
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
  const stats = computeBasicStats(ndvi);
  const counts = computeHistogram(ndvi, bins, { min: -1, max: 1 });
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

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

// NDVI stats endpoint: POST body { nir: number[], red: number[], bins?: number }
app.post('/analysis/ndvi', (req, res) => {
  try {
    const { nir, red, bins } = req.body || {};
    // Simple safeguard against huge payloads
    if (Array.isArray(nir) && nir.length > 2_000_000) {
      return res.status(413).json({ error: 'nir too large' });
    }
    if (Array.isArray(red) && red.length > 2_000_000) {
      return res.status(413).json({ error: 'red too large' });
    }
    const result = computeNdvi(
      nir,
      red,
      Number.isFinite(bins) ? Number(bins) : 10
    );
    return res.json(result);
  } catch (e) {
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
    return res.status(400).json({ error: e.message || 'invalid request' });
  }
});

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

app.use('/', express.static(path.join(ROOT, 'public')));

app.listen(PORT, () => {
  console.log(`Catalog API running on http://127.0.0.1:${PORT}`);
});
