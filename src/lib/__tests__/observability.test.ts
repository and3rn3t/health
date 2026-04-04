import { describe, test, expect, beforeEach } from 'vitest'
import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const logger = require('../../../scripts/observability/logger.cjs')
const metrics = require('../../../scripts/observability/metrics.cjs')

describe('Observability - Logger', () => {
  test('logger has all required methods', () => {
    expect(typeof logger.debug).toBe('function')
    expect(typeof logger.info).toBe('function')
    expect(typeof logger.warn).toBe('function')
    expect(typeof logger.error).toBe('function')
    expect(typeof logger.request).toBe('function')
  })

  test('logger formats structured logs', () => {
    const consoleSpy = { log: console.log }
    const originalLog = console.log
    let logOutput = ''

    console.log = (message: string) => {
      logOutput = message
    }

    logger.info('Test message', { key: 'value' })
    expect(logOutput).toContain('"level":"INFO"')
    expect(logOutput).toContain('"message":"Test message"')
    expect(logOutput).toContain('"key":"value"')
    expect(logOutput).toContain('"service":"catalog-api"')
    expect(logOutput).toContain('"timestamp"')

    console.log = originalLog
  })

  test('logger includes error details', () => {
    const consoleSpy = { error: console.error }
    const originalError = console.error
    let errorOutput = ''

    console.error = (message: string) => {
      errorOutput = message
    }

    const testError = new Error('Test error')
    logger.error('Error occurred', testError, { context: 'test' })

    expect(errorOutput).toContain('"level":"ERROR"')
    expect(errorOutput).toContain('"message":"Error occurred"')
    expect(errorOutput).toContain('"context":"test"')
    expect(errorOutput).toContain('"error"')

    console.error = originalError
  })

  test('logger respects log level', () => {
    const originalLevel = process.env.LOG_LEVEL
    process.env.LOG_LEVEL = 'ERROR'

    const consoleSpy = { log: console.log }
    const originalLog = console.log
    let logCount = 0

    console.log = () => {
      logCount++
    }

    logger.debug('Debug message')
    logger.info('Info message')
    logger.warn('Warn message')
    logger.error('Error message')

    // Only error should be logged
    expect(logCount).toBe(1)

    console.log = originalLog
    if (originalLevel) {
      process.env.LOG_LEVEL = originalLevel
    } else {
      delete process.env.LOG_LEVEL
    }
  })
})

describe('Observability - Metrics', () => {
  beforeEach(() => {
    metrics.reset()
  })

  test('metrics tracks requests', () => {
    metrics.recordRequest('GET', '/test', 200, 50)
    metrics.recordRequest('POST', '/analysis/ndvi', 200, 100)

    const m = metrics.getMetrics()
    expect(m.requests.total).toBe(2)
    expect(m.requests.byMethod.GET).toBe(1)
    expect(m.requests.byMethod.POST).toBe(1)
    expect(m.requests.byPath['/test']).toBe(1)
    expect(m.requests.byPath['/analysis/ndvi']).toBe(1)
    expect(m.requests.byStatus[200]).toBe(2)
  })

  test('metrics calculates response time percentiles', () => {
    // Record various response times
    const times = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]
    times.forEach((time) => {
      metrics.recordRequest('GET', '/test', 200, time)
    })

    const m = metrics.getMetrics()
    expect(m.responseTime.p50).toBeGreaterThanOrEqual(40)
    expect(m.responseTime.p50).toBeLessThanOrEqual(60)
    expect(m.responseTime.p95).toBeGreaterThanOrEqual(90)
    expect(m.responseTime.p99).toBeGreaterThanOrEqual(95)
    expect(m.responseTime.avg).toBeGreaterThan(0)
  })

  test('metrics tracks errors', () => {
    metrics.recordRequest('GET', '/test', 404, 10)
    metrics.recordRequest('POST', '/analysis/ndvi', 400, 20)
    metrics.recordError('ValidationError', '/analysis/ndvi')

    const m = metrics.getMetrics()
    expect(m.errors.total).toBeGreaterThanOrEqual(2)
    expect(m.errors.byType.ValidationError).toBe(1)
    expect(m.errors.byPath['/analysis/ndvi']).toBeGreaterThanOrEqual(1)
  })

  test('metrics tracks analysis operations', () => {
    metrics.recordAnalysis('ndvi', 50, true)
    metrics.recordAnalysis('ndvi', 60, true)
    metrics.recordAnalysis('ndvi', 70, false)

    const m = metrics.getMetrics()
    expect(m.analysis.ndvi.count).toBe(3)
    expect(m.analysis.ndvi.avgTime).toBeGreaterThan(50)
    expect(m.analysis.ndvi.errorRate).toBeCloseTo(1 / 3, 2)
  })

  test('metrics tracks cache operations', () => {
    metrics.recordCacheHit()
    metrics.recordCacheHit()
    metrics.recordCacheMiss()
    metrics.recordCacheEviction()

    const m = metrics.getMetrics()
    expect(m.cache.hits).toBe(2)
    expect(m.cache.misses).toBe(1)
    expect(m.cache.evictions).toBe(1)
    expect(m.cache.hitRate).toBeGreaterThan(60) // 2/3 = 66.67%
  })

  test('metrics tracks uptime', () => {
    // Wait a tiny bit to ensure uptime > 0
    const start = Date.now()
    while (Date.now() - start < 1) {
      // Busy wait
    }
    const m = metrics.getMetrics()
    expect(m.uptime.milliseconds).toBeGreaterThanOrEqual(0)
    expect(m.uptime.seconds).toBeGreaterThanOrEqual(0)
    expect(m.uptime.minutes).toBeGreaterThanOrEqual(0)
    expect(m.uptime.hours).toBeGreaterThanOrEqual(0)
    expect(m.uptime.startTime).toBeDefined()
  })

  test('metrics reset works', () => {
    metrics.recordRequest('GET', '/test', 200, 50)
    metrics.recordError('TestError', '/test')

    let m = metrics.getMetrics()
    expect(m.requests.total).toBe(1)
    expect(m.errors.total).toBe(1)

    metrics.reset()

    m = metrics.getMetrics()
    expect(m.requests.total).toBe(0)
    expect(m.errors.total).toBe(0)
    expect(m.uptime.startTime).toBeDefined()
  })
})
