import { describe, test, expect } from 'vitest'
import { exportToCSV, exportToGeoPackage, exportToPDF, createExport } from '../exports'

describe('Export Functionality', () => {
  describe('CSV Export', () => {
    test('exports simple array to CSV', () => {
      const data = [
        { name: 'Feature 1', value: 0.5, count: 10 },
        { name: 'Feature 2', value: 0.7, count: 20 },
      ]

      const csv = exportToCSV(data)
      expect(csv).toContain('name,value,count')
      expect(csv).toContain('Feature 1')
      expect(csv).toContain('0.5')
      expect(csv).toContain('10')
    })

    test('handles empty array', () => {
      const csv = exportToCSV([])
      expect(csv).toBe('')
    })

    test('includes metadata when requested', () => {
      const data = [{ name: 'Test', value: 1 }]
      const csv = exportToCSV(data, { format: 'csv', includeMetadata: true, version: '1.0.0' })

      expect(csv).toContain('# Export generated:')
      expect(csv).toContain('# Version: 1.0.0')
    })

    test('includes watermark when requested', () => {
      const data = [{ name: 'Test', value: 1 }]
      const csv = exportToCSV(data, { format: 'csv', includeWatermark: true })

      expect(csv).toContain('Geospatial Health Platform')
    })

    test('escapes special characters in CSV', () => {
      const data = [
        { name: 'Test, with comma', value: 'Quote "test"' },
      ]

      const csv = exportToCSV(data)
      expect(csv).toContain('"Test, with comma"')
      expect(csv).toContain('"Quote ""test"""')
    })
  })

  describe('GeoPackage Export', () => {
    test('exports GeoJSON to GeoPackage format', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates: [-122.5, 37.7],
            },
            properties: { name: 'Test Point' },
          },
        ],
      }

      const gpkg = exportToGeoPackage(geojson, { format: 'geopackage', version: '1.0.0' })
      const parsed = JSON.parse(gpkg)

      expect(parsed.type).toBe('FeatureCollection')
      expect(parsed.features).toHaveLength(1)
      expect(parsed.metadata).toBeDefined()
      expect(parsed.metadata.version).toBe('1.0.0')
      expect(parsed.metadata.exportedAt).toBeDefined()
    })

    test('includes watermark when requested', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [],
      }

      const gpkg = exportToGeoPackage(geojson, {
        format: 'geopackage',
        includeWatermark: true,
      })
      const parsed = JSON.parse(gpkg)

      expect(parsed.metadata.watermark).toBeDefined()
      expect(parsed.metadata.watermark).toContain('Geospatial Health Platform')
    })
  })

  describe('PDF Export', () => {
    test('generates PDF HTML content', () => {
      const content = {
        title: 'Test Report',
        sections: [
          { heading: 'Section 1', content: 'Test content' },
          { heading: 'Section 2', content: { data: 'test' } },
        ],
      }

      const pdf = exportToPDF(content, { format: 'pdf' })
      expect(pdf).toContain('Test Report')
      expect(pdf).toContain('Section 1')
      expect(pdf).toContain('Test content')
    })

    test('includes metadata when requested', () => {
      const content = {
        title: 'Test',
        sections: [],
        metadata: { version: '1.0.0' },
      }

      const pdf = exportToPDF(content, {
        format: 'pdf',
        includeMetadata: true,
      })
      expect(pdf).toContain('metadata')
    })

    test('includes watermark when requested', () => {
      const content = {
        title: 'Test',
        sections: [],
      }

      const pdf = exportToPDF(content, { format: 'pdf', includeWatermark: true })
      expect(pdf).toContain('watermark')
      expect(pdf).toContain('Geospatial Health Platform')
    })
  })

  describe('Create Export', () => {
    test('creates CSV export record', () => {
      const data = [{ name: 'Test', value: 1 }]
      const result = createExport(data, 'csv', { version: '1.0.0' })

      expect(result.id).toBeDefined()
      expect(result.format).toBe('csv')
      expect(result.size).toBeGreaterThan(0)
      expect(result.metadata.version).toBe('1.0.0')
    })

    test('creates GeoPackage export record', () => {
      const geojson = {
        type: 'FeatureCollection',
        features: [],
      }
      const result = createExport(geojson, 'geopackage')

      expect(result.id).toBeDefined()
      expect(result.format).toBe('geopackage')
      expect(result.size).toBeGreaterThan(0)
    })

    test('throws error for unsupported format', () => {
      expect(() => {
        createExport({}, 'unsupported' as any)
      }).toThrow('Unsupported format')
    })
  })
})
