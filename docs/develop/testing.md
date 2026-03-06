# Testing Guide

This document describes the testing strategy and how to run tests for the geospatial health platform.

## Test Types

### 1. Unit Tests
Unit tests for individual library functions, located in `src/lib/__tests__/`:

- **risk-scoring.test.ts** - Risk scoring calculations
- **explainability.test.ts** - Uncertainty maps and feature importance
- **change-detection.test.ts** - Multi-temporal change detection
- **vector-spatial.test.ts** - Spatial operations (joins, buffers, proximity)
- **lidar.test.ts** - LiDAR processing (classification, DTM/DSM, CHM, terrain derivatives)
- **features.test.ts** - Feature extraction (buildings, trees)

### 2. Integration Tests
API integration tests in `src/__tests__/catalog-api.integration.test.ts`:
- Tests all API endpoints end-to-end
- Requires API server to be running
- Tests request/response cycles

### 3. Acceptance Tests
Acceptance tests with golden datasets in:
- **analysis.acceptance.test.ts** - Original NDVI, zonal stats, DTM tests
- **analysis.acceptance-extended.test.ts** - Extended tests for new features

### 4. API Endpoint Tests
Standalone script for testing API endpoints:
- **scripts/testing/test-api-endpoints.js** - Quick smoke tests for all endpoints

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suites
```bash
# Geospatial library tests only (Phase 2-3)
npm run test:geospatial

# Phase 5 workflow tests
npm run test:phase5

# API integration tests (requires server running)
npm test src/__tests__/catalog-api.integration.test.ts

# Acceptance tests
npm test src/__tests__/analysis.acceptance*.test.ts
```

### Run API Endpoint Tests
```bash
# Start API server first (in another terminal)
npm run catalog:api

# Then run endpoint tests
npm run test:api
```

### Run Tests with UI
```bash
npm run test:ui
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

## Test Coverage

### Phase 2: Core Raster/Vector Analysis
- ✅ Vector spatial operations (joins, buffers, proximity)
- ✅ Unit tests for all spatial functions
- ✅ Integration tests for API endpoints

### Phase 3: LiDAR Processing
- ✅ Ground/non-ground classification
- ✅ DTM/DSM generation
- ✅ CHM generation
- ✅ Terrain derivatives (slope/aspect)
- ✅ Feature extraction (buildings, trees)
- ✅ Unit tests for all LiDAR functions
- ✅ Integration tests for API endpoints

### Phase 4: Advanced AI & Explainability
- ✅ Risk scoring
- ✅ Explainability (uncertainty, feature importance)
- ✅ Change detection
- ✅ Object detection/segmentation
- ✅ Model registry
- ✅ Inference jobs
- ✅ Review queue
- ✅ Unit tests for all AI functions
- ✅ Integration tests for API endpoints

### Phase 5: Productization & Workflows
- ✅ Projects and AOI workflows
- ✅ Scheduled analyses and notifications
- ✅ Export functionality (PDF/CSV/GeoPackage)
- ✅ RBAC and audit trail
- ✅ Unit tests for all workflow functions (39 tests)
- ✅ Integration tests for API endpoints

## Adding New Tests

### Unit Test Template
```typescript
import { describe, test, expect } from 'vitest'
import { yourFunction } from '../your-module'

describe('Your Module', () => {
  test('does something correctly', () => {
    const result = yourFunction(input)
    expect(result).toMatchExpectedOutput()
  })
})
```

### Integration Test Template
```typescript
test('endpoint works correctly', async () => {
  const response = await fetch(`${API_URL}/your-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* test data */ }),
  })
  expect(response.ok).toBe(true)
  const data = await response.json()
  expect(data).toMatchExpectedStructure()
})
```

## Golden Datasets

Golden datasets are stored in `fixtures/golden/` and represent expected outputs for acceptance tests. When updating algorithms, update golden datasets accordingly.

## Continuous Integration

Tests should be run in CI/CD pipelines:
- On every pull request
- Before merging to main
- On scheduled basis for regression detection

## Test Maintenance

- Update tests when adding new features
- Update golden datasets when algorithm behavior changes
- Keep test data realistic but minimal
- Ensure tests are deterministic (no random data without seeds)
