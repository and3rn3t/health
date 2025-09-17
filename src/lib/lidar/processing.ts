import type { Point3D, PointCloud } from './types';

export interface PlaneModel {
  normal: { x: number; y: number; z: number };
  d: number; // plane: ax + by + cz + d = 0
}

export interface SurfaceStats {
  plane: PlaneModel | null;
  roughness: number; // std dev of residuals (meters)
  slopeDeg: number; // plane inclination in degrees
  obstacleDensity: number; // obstacles / m^2 (approx)
}

// Basic vector helpers
function cross(a: Point3D, b: Point3D): Point3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x,
  };
}
function sub(a: Point3D, b: Point3D): Point3D {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}
function norm(v: Point3D): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export function fitPlaneRansac(
  points: PointCloud,
  iterations = 100,
  threshold = 0.02
): PlaneModel | null {
  if (points.length < 3) return null;
  let best: { model: PlaneModel; inliers: number } | null = null;
  for (let i = 0; i < iterations; i++) {
    const i1 = Math.floor(Math.random() * points.length);
    const i2 = Math.floor(Math.random() * points.length);
    const i3 = Math.floor(Math.random() * points.length);
    if (i1 === i2 || i2 === i3 || i1 === i3) continue;
    const p1 = points[i1];
    const p2 = points[i2];
    const p3 = points[i3];
    const n = cross(sub(p2, p1), sub(p3, p1));
    const nNorm = norm(n);
    if (nNorm < 1e-6) continue; // degenerate
    const a = n.x / nNorm;
    const b = n.y / nNorm;
    const c = n.z / nNorm;
    const d = -(a * p1.x + b * p1.y + c * p1.z);
    const model: PlaneModel = { normal: { x: a, y: b, z: c }, d };
    // count inliers
    let inliers = 0;
    for (const p of points) {
      const dist = Math.abs(a * p.x + b * p.y + c * p.z + d);
      if (dist <= threshold) inliers++;
    }
    if (!best || inliers > best.inliers) best = { model, inliers };
  }
  return best?.model ?? null;
}

export function computeResidualStd(
  points: PointCloud,
  plane: PlaneModel | null
): number {
  if (!plane || points.length === 0) return 0;
  const {
    normal: { x: a, y: b, z: c },
    d,
  } = plane;
  const residuals = points.map((p) =>
    Math.abs(a * p.x + b * p.y + c * p.z + d)
  );
  const mean = residuals.reduce((s, v) => s + v, 0) / residuals.length;
  const variance =
    residuals.reduce((s, v) => s + (v - mean) * (v - mean), 0) /
    Math.max(1, residuals.length - 1);
  return Math.sqrt(variance);
}

export function planeInclinationDeg(plane: PlaneModel | null): number {
  if (!plane) return 0;
  const { z } = plane.normal;
  // angle from horizontal plane (z axis normal)
  const theta = Math.acos(Math.min(1, Math.max(-1, Math.abs(z))));
  return (theta * 180) / Math.PI;
}

export function estimateObstacleDensity(
  points: PointCloud,
  cellSize = 0.25,
  heightThreshold = 0.05
): number {
  if (points.length === 0) return 0;
  const grid = new Map<string, { minZ: number; maxZ: number }>();
  for (const p of points) {
    const gx = Math.floor(p.x / cellSize);
    const gy = Math.floor(p.y / cellSize);
    const key = `${gx},${gy}`;
    const c = grid.get(key);
    if (!c) grid.set(key, { minZ: p.z, maxZ: p.z });
    else {
      c.minZ = Math.min(c.minZ, p.z);
      c.maxZ = Math.max(c.maxZ, p.z);
    }
  }
  let obstacles = 0;
  for (const cell of grid.values()) {
    if (cell.maxZ - cell.minZ > heightThreshold) obstacles++;
  }
  const area = grid.size * cellSize * cellSize;
  if (area <= 0) return 0;
  return obstacles / area; // per m^2
}

export function summarizeSurface(points: PointCloud): SurfaceStats {
  const plane = fitPlaneRansac(points);
  const roughness = computeResidualStd(points, plane);
  const slopeDeg = planeInclinationDeg(plane);
  const obstacleDensity = estimateObstacleDensity(points);
  return { plane, roughness, slopeDeg, obstacleDensity };
}

export interface EnvironmentRisk {
  surface: SurfaceStats;
  riskLevel: 'low' | 'moderate' | 'high';
  probability: number; // 0..1
  factors: Array<{ name: string; value: number; contribution: number }>;
}

export function assessEnvironmentRisk(surface: SurfaceStats): EnvironmentRisk {
  const wSlope = 0.04; // per degree
  const wRough = 10.0; // per meter std
  const wObs = 0.6; // per obstacle/m^2
  const bias = -1.0;
  const score =
    bias +
    wSlope * surface.slopeDeg +
    wRough * surface.roughness +
    wObs * surface.obstacleDensity;
  const probability = 1 / (1 + Math.exp(-score));
  let riskLevel: EnvironmentRisk['riskLevel'] = 'low';
  if (probability >= 0.7) riskLevel = 'high';
  else if (probability >= 0.4) riskLevel = 'moderate';
  const factors = [
    {
      name: 'slopeDeg',
      value: surface.slopeDeg,
      contribution: wSlope * surface.slopeDeg,
    },
    {
      name: 'roughness',
      value: surface.roughness,
      contribution: wRough * surface.roughness,
    },
    {
      name: 'obstacleDensity',
      value: surface.obstacleDensity,
      contribution: wObs * surface.obstacleDensity,
    },
  ];
  return { surface, riskLevel, probability, factors };
}
