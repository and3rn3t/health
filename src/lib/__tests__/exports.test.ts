import { describe, test, expect } from 'vitest';
import {
  exportToCSV,
  exportToGeoPackage,
  exportToPDF,
  createExport,
  type ExportOptions,
} from '../exports';

describe('exports', () => {
  describe('exportToCSV', () => {
    test('should export simple data to CSV', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', age: 25 },
      ];
      const csv = exportToCSV(data);
      expect(csv).toContain('name,age');
      expect(csv).toContain('John,30');
      expect(csv).toContain('Jane,25');
    });

    test('should handle empty array', () => {
      expect(exportToCSV([])).toBe('');
    });

    test('should escape commas in values', () => {
      const data = [{ name: 'John, Jr.', age: 30 }];
      const csv = exportToCSV(data);
      expect(csv).toContain('"John, Jr."');
    });

    test('should escape quotes in values', () => {
      const data = [{ name: 'John "Johnny" Doe', age: 30 }];
      const csv = exportToCSV(data);
      expect(csv).toContain('"John ""Johnny"" Doe"');
    });

    test('should handle newlines in values', () => {
      const data = [{ name: 'John\nDoe', age: 30 }];
      const csv = exportToCSV(data);
      expect(csv).toContain('"John\nDoe"');
    });

    test('should include metadata when requested', () => {
      const data = [{ name: 'John', age: 30 }];
      const csv = exportToCSV(data, {
        format: 'csv',
        includeMetadata: true,
        version: '1.0.0',
      });
      expect(csv).toContain('# Export generated:');
      expect(csv).toContain('# Version: 1.0.0');
    });

    test('should include watermark when requested', () => {
      const data = [{ name: 'John', age: 30 }];
      const csv = exportToCSV(data, {
        format: 'csv',
        includeWatermark: true,
      });
      expect(csv).toContain('Geospatial Health Platform');
    });

    test('should handle null and undefined values', () => {
      const data = [{ name: 'John', age: null, city: undefined }];
      const csv = exportToCSV(data);
      expect(csv).toContain('name,age,city');
      expect(csv).toContain('John,,');
    });

    test('should handle object values', () => {
      const data = [{ name: 'John', metadata: { id: 1 } }];
      const csv = exportToCSV(data);
      // CSV escapes quotes, so we check for the escaped version
      expect(csv).toContain('"{""id"":1}"');
    });

    test('should handle missing keys across rows', () => {
      const data = [
        { name: 'John', age: 30 },
        { name: 'Jane', city: 'NYC' },
      ];
      const csv = exportToCSV(data);
      expect(csv).toContain('name,age,city');
      expect(csv).toContain('John,30,');
      expect(csv).toContain('Jane,,NYC');
    });
  });

  describe('exportToGeoPackage', () => {
    test('should export GeoJSON with metadata', () => {
      const geojson = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            geometry: { type: 'Point', coordinates: [0, 0] },
            properties: { name: 'Test' },
          },
        ],
      };
      const result = exportToGeoPackage(geojson);
      const parsed = JSON.parse(result);
      expect(parsed.type).toBe('FeatureCollection');
      expect(parsed.metadata).toBeDefined();
      expect(parsed.metadata.exportedAt).toBeDefined();
    });

    test('should include version in metadata', () => {
      const geojson = {
        type: 'FeatureCollection' as const,
        features: [],
      };
      const result = exportToGeoPackage(geojson, {
        format: 'geopackage',
        version: '2.0.0',
      });
      const parsed = JSON.parse(result);
      expect(parsed.metadata.version).toBe('2.0.0');
    });

    test('should include watermark when requested', () => {
      const geojson = {
        type: 'FeatureCollection' as const,
        features: [],
      };
      const result = exportToGeoPackage(geojson, {
        format: 'geopackage',
        includeWatermark: true,
      });
      const parsed = JSON.parse(result);
      expect(parsed.metadata.watermark).toBeDefined();
      expect(parsed.metadata.watermark).toContain('Geospatial Health Platform');
    });
  });

  describe('exportToPDF', () => {
    test('should generate HTML representation', () => {
      const content = {
        title: 'Test Report',
        sections: [
          { heading: 'Section 1', content: 'Content 1' },
        ],
      };
      const html = exportToPDF(content);
      expect(html).toContain('Test Report');
      expect(html).toContain('Section 1');
      expect(html).toContain('Content 1');
    });

    test('should include metadata when requested', () => {
      const content = {
        title: 'Test',
        sections: [],
        metadata: { author: 'John' },
      };
      const html = exportToPDF(content, {
        format: 'pdf',
        includeMetadata: true,
      });
      expect(html).toContain('metadata');
      expect(html).toContain('author');
    });

    test('should handle array content', () => {
      const content = {
        title: 'Test',
        sections: [
          { heading: 'Data', content: [{ id: 1 }, { id: 2 }] },
        ],
      };
      const html = exportToPDF(content);
      expect(html).toContain('Data');
      expect(html).toContain('id');
    });

    test('should include watermark when requested', () => {
      const content = {
        title: 'Test',
        sections: [],
      };
      const html = exportToPDF(content, {
        format: 'pdf',
        includeWatermark: true,
      });
      expect(html).toContain('watermark');
      expect(html).toContain('Geospatial Health Platform');
    });
  });

  describe('createExport', () => {
    test('should create CSV export', () => {
      const data = [{ name: 'John', age: 30 }];
      const result = createExport(data, 'csv');
      expect(result.format).toBe('csv');
      expect(result.id).toContain('export-');
      expect(result.size).toBeGreaterThan(0);
      expect(result.metadata.version).toBe('1.0.0');
    });

    test('should create GeoPackage export', () => {
      const geojson = {
        type: 'FeatureCollection' as const,
        features: [],
      };
      const result = createExport(geojson, 'geopackage');
      expect(result.format).toBe('geopackage');
      expect(result.size).toBeGreaterThan(0);
    });

    test('should create PDF export', () => {
      const content = {
        title: 'Test',
        sections: [],
      };
      const result = createExport(content, 'pdf');
      expect(result.format).toBe('pdf');
      expect(result.size).toBeGreaterThan(0);
    });

    test('should throw error for unsupported format', () => {
      expect(() => createExport({}, 'invalid' as any)).toThrow(
        'Unsupported format: invalid'
      );
    });

    test('should include custom version', () => {
      const data = [{ name: 'John' }];
      const result = createExport(data, 'csv', { format: 'csv', version: '2.0.0' });
      expect(result.metadata.version).toBe('2.0.0');
    });

    test('should include watermark when requested', () => {
      const data = [{ name: 'John' }];
      const result = createExport(data, 'csv', {
        format: 'csv',
        includeWatermark: true,
      });
      expect(result.metadata.watermark).toBeDefined();
    });

    test('should generate unique IDs', () => {
      const data = [{ name: 'John' }];
      const result1 = createExport(data, 'csv');
      const result2 = createExport(data, 'csv');
      expect(result1.id).not.toBe(result2.id);
    });
  });
});
