import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { setTimeout } from 'node:timers/promises'

const API_URL = 'http://127.0.0.1:5055'
let apiProcess: any = null

async function waitForServer(maxWait = 10000) {
  const start = Date.now()
  while (Date.now() - start < maxWait) {
    try {
      const response = await fetch(`${API_URL}/health`)
      if (response.ok) return true
    } catch {
      // Server not ready yet
    }
    await setTimeout(200)
  }
  return false
}

beforeAll(async () => {
  // Start the API server
  apiProcess = spawn('node', ['scripts/catalog/catalog-api.js'], {
    stdio: 'pipe',
    env: { ...process.env, CATALOG_PORT: '5055' },
  })

  const ready = await waitForServer()
  if (!ready) {
    throw new Error('API server failed to start')
  }
}, 15000)

afterAll(async () => {
  if (apiProcess) {
    apiProcess.kill()
    await setTimeout(500)
  }
})

describe('Catalog API Integration Tests', () => {
  test('health endpoint responds', async () => {
    const response = await fetch(`${API_URL}/health`)
    expect(response.ok).toBe(true)
    const data = await response.json() as { ok: boolean }
    expect(data.ok).toBe(true)
  })

  describe('Vector Spatial Operations', () => {
    test('spatial join endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/spatial-join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryBbox: { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 },
          targetFeatures: [
            {
              geometry: { type: 'Point', coordinates: [-122.45, 37.75] },
              properties: { name: 'Test' },
            },
          ],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { matched: number; features: unknown[] }
      expect(data.matched).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(data.features)).toBe(true)
    })

    test('buffer endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/buffer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          center: { x: -122.5, y: 37.7 },
          radiusMeters: 1000,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { buffer: { geometry: { type: string } } }
      expect(data.buffer).toBeDefined()
      expect(data.buffer.geometry.type).toBe('Polygon')
    })

    test('proximity endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/proximity`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queryPoint: { x: -122.5, y: 37.7 },
          targetFeatures: [
            {
              geometry: { type: 'Point', coordinates: [-122.45, 37.75] },
              properties: {},
            },
          ],
          maxResults: 5,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { nearest: unknown[] }
      expect(Array.isArray(data.nearest)).toBe(true)
    })
  })

  describe('LiDAR Processing', () => {
    test('ground classification endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/lidar/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          points: [
            { x: 100, y: 200, z: 50 },
            { x: 101, y: 201, z: 52 },
            { x: 102, y: 202, z: 55 },
          ],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { groundCount: number; nonGroundCount: number; stats: unknown }
      expect(data.groundCount + data.nonGroundCount).toBe(3)
      expect(data.stats).toBeDefined()
    })

    test('DTM generation endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/lidar/dtm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groundPoints: [
            { x: 100, y: 200, z: 50 },
            { x: 101, y: 201, z: 52 },
          ],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { grid: unknown; width: number; height: number }
      expect(data.grid).toBeDefined()
      expect(data.width).toBeGreaterThan(0)
      expect(data.height).toBeGreaterThan(0)
    })

    test('DSM generation endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/lidar/dsm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          allPoints: [
            { x: 100, y: 200, z: 50 },
            { x: 101, y: 201, z: 60 },
          ],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { grid: unknown; stats: unknown }
      expect(data.grid).toBeDefined()
      expect(data.stats).toBeDefined()
    })
  })

  describe('Phase 4: AI & Explainability', () => {
    test('risk scoring endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/risk-score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          factors: [
            { name: 'elevation', weight: 0.3, values: [10, 20, 15] },
            { name: 'slope', weight: 0.7, values: [5, 10, 8] },
          ],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { scores: unknown[]; statistics: unknown }
      expect(data.scores).toHaveLength(3)
      expect(data.statistics).toBeDefined()
    })

    test('uncertainty endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/explainability/uncertainty`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          predictions: [0.2, 0.8, 0.5],
          confidence: [0.7, 0.9, 0.5],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { confidence: unknown[]; uncertainty: unknown[] }
      expect(data.confidence).toHaveLength(3)
      expect(data.uncertainty).toHaveLength(3)
    })

    test('change detection endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/change-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          before: [0.2, 0.3, 0.4],
          after: [0.3, 0.4, 0.5],
          threshold: 0.1,
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { changeMap: unknown[]; statistics: unknown }
      expect(data.changeMap).toHaveLength(3)
      expect(data.statistics).toBeDefined()
    })

    test('object detection endpoint', async () => {
      const response = await fetch(`${API_URL}/analysis/object-detection`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: [0.1, 0.2, 0.8, 0.7, 0.3],
        }),
      })

      expect(response.ok).toBe(true)
      const data = await response.json() as { segmentation: unknown[]; statistics: unknown }
      expect(data.segmentation).toHaveLength(5)
      expect(data.statistics).toBeDefined()
    })
  })

  describe('Model Registry & Jobs', () => {
    test('model registry endpoints', async () => {
      // Register a model
      const registerResponse = await fetch(`${API_URL}/models/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: 'test-model-1',
          name: 'Test Model',
          type: 'segmentation',
          versions: [],
        }),
      })

      expect(registerResponse.ok).toBe(true)

      // List models
      const listResponse = await fetch(`${API_URL}/models`)
      expect(listResponse.ok).toBe(true)
      const listData = await listResponse.json() as { models: unknown[] }
      expect(Array.isArray(listData.models)).toBe(true)
    })

    test('inference job endpoints', async () => {
      // Create a job
      const createResponse = await fetch(`${API_URL}/jobs/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelId: 'test-model-1',
          input: { image: [0.1, 0.2, 0.3] },
        }),
      })

      expect(createResponse.ok).toBe(true)
      const jobData = await createResponse.json() as { id: string; status: string }
      expect(jobData.id).toBeDefined()
      expect(jobData.status).toBe('pending')

      // List jobs
      const listResponse = await fetch(`${API_URL}/jobs`)
      expect(listResponse.ok).toBe(true)
    })

    test('review queue endpoints', async () => {
      // Create a review
      const createResponse = await fetch(`${API_URL}/reviews/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resultId: 'result-1',
          result: { predictions: [0.8, 0.9, 0.7] },
        }),
      })

      expect(createResponse.ok).toBe(true)
      const reviewData = await createResponse.json() as { id: string; status: string }
      expect(reviewData.id).toBeDefined()
      expect(reviewData.status).toBe('pending')
    })
  })
})
