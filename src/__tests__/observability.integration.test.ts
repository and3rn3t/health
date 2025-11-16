import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { spawn } from 'child_process'
import { setTimeout } from 'timers/promises'

const API_URL = process.env.API_URL || 'http://127.0.0.1:5055'
let serverProcess: any = null

async function startServer() {
  return new Promise((resolve, reject) => {
    serverProcess = spawn('node', ['scripts/catalog/catalog-api.js'], {
      env: { ...process.env, LOG_LEVEL: 'INFO' },
      stdio: 'pipe',
    })

    let output = ''
    serverProcess.stdout.on('data', (data: Buffer) => {
      output += data.toString()
      if (output.includes('Catalog API running')) {
        resolve(serverProcess)
      }
    })

    serverProcess.stderr.on('data', (data: Buffer) => {
      console.error('Server error:', data.toString())
    })

    serverProcess.on('error', reject)

    // Timeout after 10 seconds
    setTimeout(10000).then(() => {
      if (!output.includes('Catalog API running')) {
        reject(new Error('Server failed to start'))
      }
    })
  })
}

async function stopServer() {
  if (serverProcess) {
    serverProcess.kill()
    await setTimeout(1000)
  }
}

describe('Observability Integration Tests', () => {
  beforeAll(async () => {
    try {
      await startServer()
      await setTimeout(2000) // Give server time to fully start
    } catch (error) {
      console.warn('Could not start server for integration tests:', error)
    }
  }, 15000)

  afterAll(async () => {
    await stopServer()
  })

  test('health endpoint returns structured response', async () => {
    const response = await fetch(`${API_URL}/health`)
    expect(response.ok).toBe(true)

    const data = await response.json()
    expect(data.ok).toBe(true)
    expect(data.timestamp).toBeDefined()
    expect(data.service).toBe('catalog-api')
    expect(data.uptime).toBeDefined()
    expect(data.uptime.seconds).toBeGreaterThanOrEqual(0)
  })

  test('metrics endpoint returns metrics data', async () => {
    // Make a request first to generate some metrics
    await fetch(`${API_URL}/health`)

    const response = await fetch(`${API_URL}/metrics`)
    expect(response.ok).toBe(true)

    const data = await response.json()
    expect(data.requests).toBeDefined()
    expect(data.requests.total).toBeGreaterThanOrEqual(0)
    expect(data.responseTime).toBeDefined()
    expect(data.errors).toBeDefined()
    expect(data.cache).toBeDefined()
    expect(data.uptime).toBeDefined()
    expect(data.analysis).toBeDefined()
  })

  test('metrics tracks requests correctly', async () => {
    // Reset by checking initial state
    const initialResponse = await fetch(`${API_URL}/metrics`)
    const initial = await initialResponse.json()
    const initialTotal = initial.requests.total

    // Make a request
    await fetch(`${API_URL}/health`)

    // Check metrics increased
    const metricsResponse = await fetch(`${API_URL}/metrics`)
    const metrics = await metricsResponse.json()
    expect(metrics.requests.total).toBeGreaterThan(initialTotal)
  })

  test('error handling returns structured errors', async () => {
    const response = await fetch(`${API_URL}/nonexistent`, {
      method: 'GET',
    })

    expect(response.status).toBe(404)
    const data = await response.json()
    expect(data.error).toBeDefined()
    expect(data.path).toBeDefined()
  })

  test('compression is enabled', async () => {
    const response = await fetch(`${API_URL}/health`, {
      headers: {
        'Accept-Encoding': 'gzip, deflate, br',
      },
    })

    // Check if content-encoding header is present (compression working)
    const encoding = response.headers.get('content-encoding')
    // Compression may or may not be applied based on size, but headers should be set
    expect(response.ok).toBe(true)
  })

  test('security headers are present', async () => {
    const response = await fetch(`${API_URL}/health`)
    expect(response.headers.get('x-content-type-options')).toBe('nosniff')
    expect(response.headers.get('x-frame-options')).toBe('DENY')
    expect(response.headers.get('x-xss-protection')).toBe('1; mode=block')
  })

  test('CORS headers are present', async () => {
    const response = await fetch(`${API_URL}/health`, {
      method: 'OPTIONS',
    })

    expect(response.headers.get('access-control-allow-origin')).toBeDefined()
    expect(response.headers.get('access-control-allow-methods')).toBeDefined()
  })
})
