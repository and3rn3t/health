/**
 * Test data and sample values for local testing
 * Provides realistic sample data for all features
 */

const TestData = {
  // NDVI sample data
  ndvi: {
    nir: [0.8, 0.75, 0.7, 0.85, 0.9, 0.65, 0.72, 0.88, 0.68, 0.82],
    red: [0.2, 0.25, 0.3, 0.15, 0.1, 0.35, 0.28, 0.12, 0.32, 0.18],
  },

  // Zonal statistics
  zonal: {
    values: [0.1, 0.3, 0.5, 0.2, 0.7, 0.4, 0.6, 0.3, 0.5, 0.8],
    zones: [1, 1, 2, 2, 3, 3, 1, 2, 3, 1],
  },

  // Terrain/Elevation
  terrain: {
    elevations: [50, 52, 55, 48, 60, 53, 57, 49, 61, 54],
  },

  // Cloud/Shadow masking
  masking: {
    rgb: {
      r: [0.8, 0.7, 0.9, 0.6, 0.85],
      g: [0.75, 0.65, 0.88, 0.55, 0.82],
      b: [0.7, 0.6, 0.85, 0.5, 0.8],
    },
    cloudMask: [0, 1, 0, 0, 1],
    shadowMask: [0, 0, 1, 0, 0],
  },

  // NDWI
  ndwi: {
    green: [0.6, 0.65, 0.7, 0.55, 0.75],
    nir: [0.3, 0.35, 0.4, 0.25, 0.45],
  },

  // NDMI
  ndmi: {
    nir: [0.8, 0.75, 0.85, 0.7, 0.9],
    swir: [0.4, 0.45, 0.5, 0.35, 0.55],
  },

  // Vector spatial operations
  vector: {
    spatialJoin: {
      queryBbox: { minX: -122.5, minY: 37.7, maxX: -122.4, maxY: 37.8 },
      targetFeatures: [
        {
          geometry: { type: 'Point', coordinates: [-122.45, 37.75] },
          properties: { name: 'Feature 1', type: 'building' },
        },
        {
          geometry: { type: 'Point', coordinates: [-122.3, 37.6] },
          properties: { name: 'Feature 2', type: 'tree' },
        },
        {
          geometry: { type: 'Point', coordinates: [-122.48, 37.76] },
          properties: { name: 'Feature 3', type: 'water' },
        },
      ],
    },
    buffer: {
      center: { x: -122.5, y: 37.7 },
      radiusMeters: 1000,
    },
    proximity: {
      queryPoint: { x: -122.5, y: 37.7 },
      targetFeatures: [
        {
          geometry: { type: 'Point', coordinates: [-122.45, 37.75] },
          properties: { name: 'Near Point' },
        },
        {
          geometry: { type: 'Point', coordinates: [-122.3, 37.6] },
          properties: { name: 'Far Point' },
        },
      ],
      maxResults: 5,
    },
  },

  // LiDAR
  lidar: {
    points: [
      { x: 100, y: 200, z: 50 },
      { x: 101, y: 201, z: 52 },
      { x: 102, y: 202, z: 55 },
      { x: 103, y: 203, z: 48 },
      { x: 104, y: 204, z: 60 },
      { x: 105, y: 205, z: 53 },
      { x: 106, y: 206, z: 57 },
      { x: 107, y: 207, z: 49 },
    ],
    groundPoints: [
      { x: 100, y: 200, z: 50 },
      { x: 101, y: 201, z: 52 },
      { x: 102, y: 202, z: 48 },
      { x: 103, y: 203, z: 51 },
    ],
    allPoints: [
      { x: 100, y: 200, z: 50 },
      { x: 101, y: 201, z: 60 },
      { x: 102, y: 202, z: 55 },
      { x: 103, y: 203, z: 65 },
    ],
  },

  // CHM and Terrain Derivatives
  chm: {
    dsm: {
      grid: [
        [50, 52, 55, 48],
        [51, 60, 58, 50],
        [53, 59, 57, 52],
        [49, 54, 56, 51],
      ],
      bbox: { minX: 100, minY: 200, maxX: 104, maxY: 204 },
      cellSize: 1.0,
      width: 4,
      height: 4,
    },
    dtm: {
      grid: [
        [50, 51, 52, 48],
        [50, 51, 52, 49],
        [51, 52, 53, 50],
        [49, 50, 51, 48],
      ],
      bbox: { minX: 100, minY: 200, maxX: 104, maxY: 204 },
      cellSize: 1.0,
      width: 4,
      height: 4,
    },
  },

  // Feature extraction
  featureExtraction: {
    chm: {
      grid: [
        [0.5, 0.5, 0.5, 0.5, 0.5],
        [0.5, 5.0, 5.0, 5.0, 0.5],
        [0.5, 5.0, 5.0, 5.0, 0.5],
        [0.5, 5.0, 5.0, 5.0, 0.5],
        [0.5, 0.5, 0.5, 0.5, 0.5],
      ],
      bbox: { minX: 0, minY: 0, maxX: 5, maxY: 5 },
      cellSize: 1.0,
      width: 5,
      height: 5,
    },
  },

  // Phase 4: AI & Explainability
  riskScoring: {
    factors: [
      {
        name: 'elevation',
        weight: 0.3,
        values: [10, 20, 15, 25, 30, 12, 18, 22],
        normalize: 'minmax',
      },
      {
        name: 'water_proximity',
        weight: 0.4,
        values: [0.1, 0.3, 0.2, 0.4, 0.15, 0.35, 0.25, 0.45],
        invert: true,
      },
      {
        name: 'slope',
        weight: 0.3,
        values: [5, 10, 8, 12, 6, 11, 9, 13],
        normalize: 'minmax',
      },
    ],
  },

  explainability: {
    uncertainty: {
      predictions: [0.1, 0.3, 0.5, 0.7, 0.9],
      confidence: [0.6, 0.7, 0.5, 0.8, 0.9],
    },
    featureImportance: {
      features: [
        { name: 'NDVI', values: [0.3, 0.5, 0.4, 0.6, 0.5] },
        { name: 'elevation', values: [100, 200, 150, 250, 180] },
        { name: 'slope', values: [5, 10, 8, 12, 9] },
      ],
    },
  },

  changeDetection: {
    before: [0.2, 0.3, 0.4, 0.5, 0.6, 0.3, 0.4, 0.5],
    after: [0.3, 0.4, 0.5, 0.6, 0.7, 0.4, 0.5, 0.6],
    threshold: 0.1,
    method: 'absolute',
  },

  objectDetection: {
    image: [0.1, 0.2, 0.8, 0.7, 0.3, 0.4, 0.6, 0.5, 0.9, 0.2],
  },

  // Phase 5: Productization
  project: {
    id: 'test-project-1',
    name: 'Test Project',
    ownerId: 'user-1',
    description: 'Sample project for testing',
  },

  aoi: {
    name: 'Test AOI',
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [-122.5, 37.7],
          [-122.4, 37.7],
          [-122.4, 37.8],
          [-122.5, 37.8],
          [-122.5, 37.7],
        ],
      ],
    },
  },

  schedule: {
    projectId: 'test-project-1',
    analysisType: 'ndvi',
    scheduleType: 'daily',
    enabled: true,
  },

  export: {
    csv: [
      { name: 'Feature 1', value: 0.5, count: 10 },
      { name: 'Feature 2', value: 0.7, count: 20 },
      { name: 'Feature 3', value: 0.3, count: 15 },
    ],
    geojson: {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: {
            type: 'Point',
            coordinates: [-122.5, 37.7],
          },
          properties: { name: 'Test Point', value: 0.5 },
        },
      ],
    },
  },

  rbac: {
    role: {
      name: 'Analyst',
      permissions: ['read', 'write'],
      resourceTypes: ['dataset', 'analysis'],
    },
    user: {
      email: 'analyst@example.com',
      roles: [],
      organizationId: 'org-1',
    },
    policy: {
      resourceType: 'dataset',
      permissions: ['read', 'write'],
      userId: 'user-1',
      organizationId: 'org-1',
    },
  },
}

// Make available globally
if (typeof window !== 'undefined') {
  window.TestData = TestData
}
