#!/usr/bin/env node
/**
 * Test script for catalog API endpoints
 * Run with: node scripts/testing/test-api-endpoints.js
 */

const API_URL = process.env.API_URL || 'http://127.0.0.1:5055'

async function testEndpoint(name, method, path, body = null) {
  try {
    const options = {
      method,
      headers: { 'Content-Type': 'application/json' },
    }
    if (body) {
      options.body = JSON.stringify(body)
    }

    const response = await fetch(`${API_URL}${path}`, options)
    const data = await response.json()

    if (response.ok) {
      console.log(`✅ ${name}: OK`)
      return { success: true, data }
    } else {
      console.log(`❌ ${name}: FAILED - ${data.error || response.statusText}`)
      return { success: false, error: data.error || response.statusText }
    }
  } catch (error) {
    console.log(`❌ ${name}: ERROR - ${error.message}`)
    return { success: false, error: error.message }
  }
}

async function runTests() {
  console.log(`Testing API endpoints at ${API_URL}\n`)

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  }

  // Health check
  results.total++
  const health = await testEndpoint('Health Check', 'GET', '/health')
  if (health.success) results.passed++
  else results.failed++

  // Vector Spatial Operations
  console.log('\n--- Vector Spatial Operations ---')
  results.total++
  const spatialJoin = await testEndpoint(
    'Spatial Join',
    'POST',
    '/analysis/spatial-join',
    {
      queryBbox: { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 },
      targetFeatures: [
        {
          geometry: { type: 'Point', coordinates: [-122.45, 37.75] },
          properties: { name: 'Test' },
        },
      ],
    }
  )
  if (spatialJoin.success) results.passed++
  else results.failed++

  results.total++
  const buffer = await testEndpoint(
    'Buffer',
    'POST',
    '/analysis/buffer',
    { center: { x: -122.5, y: 37.7 }, radiusMeters: 1000 }
  )
  if (buffer.success) results.passed++
  else results.failed++

  // LiDAR Processing
  console.log('\n--- LiDAR Processing ---')
  results.total++
  const classify = await testEndpoint(
    'Ground Classification',
    'POST',
    '/analysis/lidar/classify',
    {
      points: [
        { x: 100, y: 200, z: 50 },
        { x: 101, y: 201, z: 52 },
      ],
    }
  )
  if (classify.success) results.passed++
  else results.failed++

  results.total++
  const dtm = await testEndpoint(
    'DTM Generation',
    'POST',
    '/analysis/lidar/dtm',
    {
      groundPoints: [
        { x: 100, y: 200, z: 50 },
        { x: 101, y: 201, z: 52 },
      ],
    }
  )
  if (dtm.success) results.passed++
  else results.failed++

  // Phase 4: AI & Explainability
  console.log('\n--- Phase 4: AI & Explainability ---')
  results.total++
  const riskScore = await testEndpoint(
    'Risk Scoring',
    'POST',
    '/analysis/risk-score',
    {
      factors: [
        { name: 'elevation', weight: 0.3, values: [10, 20, 15] },
        { name: 'slope', weight: 0.7, values: [5, 10, 8] },
      ],
    }
  )
  if (riskScore.success) results.passed++
  else results.failed++

  results.total++
  const uncertainty = await testEndpoint(
    'Uncertainty Map',
    'POST',
    '/analysis/explainability/uncertainty',
    {
      predictions: [0.2, 0.8, 0.5],
      confidence: [0.7, 0.9, 0.5],
    }
  )
  if (uncertainty.success) results.passed++
  else results.failed++

  results.total++
  const changeDetection = await testEndpoint(
    'Change Detection',
    'POST',
    '/analysis/change-detection',
    {
      before: [0.2, 0.3, 0.4],
      after: [0.3, 0.4, 0.5],
      threshold: 0.1,
    }
  )
  if (changeDetection.success) results.passed++
  else results.failed++

  // Model Registry & Jobs
  console.log('\n--- Model Registry & Jobs ---')
  results.total++
  const registerModel = await testEndpoint(
    'Register Model',
    'POST',
    '/models/register',
    {
      id: 'test-model-1',
      name: 'Test Model',
      type: 'segmentation',
      versions: [],
    }
  )
  if (registerModel.success) results.passed++
  else results.failed++

  results.total++
  const listModels = await testEndpoint('List Models', 'GET', '/models')
  if (listModels.success) results.passed++
  else results.failed++

  // Phase 5: Productization & Workflows
  console.log('\n--- Phase 5: Productization & Workflows ---')
  results.total++
  const createProject = await testEndpoint(
    'Create Project',
    'POST',
    '/projects',
    {
      id: 'test-project-1',
      name: 'Test Project',
      ownerId: 'user-1',
      description: 'Test project',
    }
  )
  if (createProject.success) results.passed++
  else results.failed++

  results.total++
  const listProjects = await testEndpoint('List Projects', 'GET', '/projects')
  if (listProjects.success) results.passed++
  else results.failed++

  if (createProject.success && createProject.data?.id) {
    results.total++
    const createAOI = await testEndpoint(
      'Create AOI',
      'POST',
      `/projects/${createProject.data.id}/aois`,
      {
        name: 'Test AOI',
        geometry: {
          type: 'Polygon',
          coordinates: [[[-122.5, 37.7], [-122.4, 37.7], [-122.4, 37.8], [-122.5, 37.8], [-122.5, 37.7]]],
        },
      }
    )
    if (createAOI.success) results.passed++
    else results.failed++

    results.total++
    const createRun = await testEndpoint(
      'Create Analysis Run',
      'POST',
      `/projects/${createProject.data.id}/runs`,
      {
        analysisType: 'ndvi',
        input: { nir: [0.5, 0.6], red: [0.3, 0.4] },
      }
    )
    if (createRun.success) results.passed++
    else results.failed++
  }

  results.total++
  const createSchedule = await testEndpoint(
    'Create Schedule',
    'POST',
    '/schedules',
    {
      projectId: 'test-project-1',
      analysisType: 'ndvi',
      scheduleType: 'daily',
      enabled: true,
    }
  )
  if (createSchedule.success) results.passed++
  else results.failed++

  results.total++
  const exportData = await testEndpoint(
    'Export Data',
    'POST',
    '/export',
    {
      data: [{ name: 'Test', value: 0.5 }],
      format: 'csv',
      options: { includeWatermark: true },
    }
  )
  if (exportData.success) results.passed++
  else results.failed++

  results.total++
  const createRole = await testEndpoint(
    'Create Role',
    'POST',
    '/rbac/roles',
    {
      name: 'Analyst',
      permissions: ['read', 'write'],
      resourceTypes: ['dataset', 'analysis'],
    }
  )
  if (createRole.success) results.passed++
  else results.failed++

  results.total++
  const getAuditLogs = await testEndpoint('Get Audit Logs', 'GET', '/rbac/audit')
  if (getAuditLogs.success) results.passed++
  else results.failed++

  // Summary
  console.log('\n--- Summary ---')
  console.log(`Total: ${results.total}`)
  console.log(`Passed: ${results.passed}`)
  console.log(`Failed: ${results.failed}`)
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`)

  process.exit(results.failed > 0 ? 1 : 0)
}

runTests().catch((error) => {
  console.error('Test runner error:', error)
  process.exit(1)
})
