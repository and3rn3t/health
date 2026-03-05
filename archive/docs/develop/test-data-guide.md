# Test Data Guide

## Overview

The catalog browser includes comprehensive test data and sample value loaders to make local testing quick and easy.

## Test Data File

**Location:** `public/test-data.js`

Contains realistic sample data for all features:
- NDVI, NDWI, NDMI sample arrays
- Zonal statistics data
- Terrain/elevation grids
- Cloud/shadow masking RGB values
- Vector spatial operations (bbox, points, features)
- LiDAR point clouds
- CHM/DTM/DSM grids
- Feature extraction CHM data
- Risk scoring factors
- Explainability data
- Change detection arrays
- Object detection image arrays
- Projects, AOIs, schedules
- Export data samples
- RBAC roles, users, policies

## Using Sample Data

### In the UI

Each section has a **"📋 Load Sample Data"** button that automatically populates input fields with test values:

1. Navigate to any feature section
2. Click the "📋 Load Sample Data" button
3. Fields are automatically filled with realistic test data
4. Click the "Run" button to test the feature

### Programmatically

Access test data from the browser console:

```javascript
// Access all test data
window.TestData

// Access specific data
TestData.ndvi.nir
TestData.lidar.points
TestData.riskScoring.factors
TestData.project
```

### Example Usage

```javascript
// Load NDVI sample data
document.getElementById('nir').value = TestData.ndvi.nir.join(' ');
document.getElementById('red').value = TestData.ndvi.red.join(' ');

// Load LiDAR points
document.getElementById('lidarPoints').value = JSON.stringify(TestData.lidar.points, null, 2);

// Load risk scoring factors
document.getElementById('riskFactors').value = JSON.stringify(TestData.riskScoring.factors, null, 2);
```

## Available Sample Data

### Phase 2: Core Analysis
- **NDVI**: `TestData.ndvi` - NIR and Red arrays
- **Zonal Stats**: `TestData.zonal` - Values and zones
- **Terrain**: `TestData.terrain` - Elevation arrays
- **Cloud/Shadow Masking**: `TestData.masking` - RGB arrays and masks
- **NDWI**: `TestData.ndwi` - Green and NIR arrays
- **NDMI**: `TestData.ndmi` - NIR and SWIR arrays

### Phase 2: Vector Spatial
- **Spatial Join**: `TestData.vector.spatialJoin` - Query bbox and target features
- **Buffer**: `TestData.vector.buffer` - Center point and radius
- **Proximity**: `TestData.vector.proximity` - Query point and target features

### Phase 3: LiDAR
- **Points**: `TestData.lidar.points` - Full point cloud
- **Ground Points**: `TestData.lidar.groundPoints` - Ground-classified points
- **All Points**: `TestData.lidar.allPoints` - All points for DSM
- **CHM**: `TestData.chm` - DSM and DTM grids
- **Feature Extraction**: `TestData.featureExtraction.chm` - CHM grid with buildings/trees

### Phase 4: AI & Explainability
- **Risk Scoring**: `TestData.riskScoring.factors` - Multiple weighted factors
- **Explainability**: `TestData.explainability` - Uncertainty and feature importance data
- **Change Detection**: `TestData.changeDetection` - Before/after arrays
- **Object Detection**: `TestData.objectDetection.image` - Image value array

### Phase 5: Workflows
- **Project**: `TestData.project` - Sample project definition
- **AOI**: `TestData.aoi` - Sample Area of Interest geometry
- **Schedule**: `TestData.schedule` - Sample schedule configuration
- **Export**: `TestData.export` - CSV and GeoJSON samples
- **RBAC**: `TestData.rbac` - Roles, users, policies

## Customizing Test Data

Edit `public/test-data.js` to:
- Add more sample datasets
- Modify existing values
- Create variants for different test scenarios
- Add domain-specific test cases

## Tips

1. **Quick Testing**: Use "Load Sample Data" buttons for rapid feature testing
2. **Variations**: Modify loaded data to test edge cases
3. **Console Access**: Use `window.TestData` for programmatic testing
4. **Combining Data**: Load sample data, then modify specific fields as needed

## Example Workflow

1. Open catalog browser: `http://127.0.0.1:5055/catalog.html`
2. Navigate to "LiDAR Processing" section
3. Click "📋 Load Sample Data" for Ground Classification
4. Click "Classify Points" to run analysis
5. Review results in preview panel
6. Modify parameters and re-run to test variations
