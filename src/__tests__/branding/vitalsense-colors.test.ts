import { describe, expect, it } from 'vitest';

// Import VitalSense color system
import {
  VitalSenseColors,
  getVitalSenseClasses,
} from '../../lib/vitalsense-colors';

describe('VitalSense Branding System', () => {
  describe('Brand Colors', () => {
    it('should define correct VitalSense primary colors', () => {
      expect(VitalSenseColors.primary.main).toBe('#2563eb');
      expect(VitalSenseColors.primary.light).toBe('#3b82f6');
      expect(VitalSenseColors.primary.dark).toBe('#1d4ed8');
      expect(VitalSenseColors.primary.contrast).toBe('#ffffff');
    });

    it('should define correct VitalSense teal accent colors', () => {
      expect(VitalSenseColors.teal.main).toBe('#0891b2');
      expect(VitalSenseColors.teal.light).toBe('#06b6d4');
      expect(VitalSenseColors.teal.dark).toBe('#0e7490');
      expect(VitalSenseColors.teal.contrast).toBe('#ffffff');
    });

    it('should provide VitalSense status colors', () => {
      expect(VitalSenseColors.success.main).toBe('#059669');
      expect(VitalSenseColors.warning.main).toBe('#d97706');
      expect(VitalSenseColors.error.main).toBe('#dc2626');
    });

    it('should have proper CSS class names', () => {
      expect(VitalSenseColors.primary.css).toBe('vitalsense-primary');
      expect(VitalSenseColors.teal.css).toBe('vitalsense-teal');
      expect(VitalSenseColors.success.css).toBe('vitalsense-success');
      expect(VitalSenseColors.warning.css).toBe('vitalsense-warning');
      expect(VitalSenseColors.error.css).toBe('vitalsense-error');
    });
  });

  describe('VitalSense CSS Classes', () => {
    it('should provide correct background classes', () => {
      expect(getVitalSenseClasses.bg.primary).toBe('bg-vitalsense-primary');
      expect(getVitalSenseClasses.bg.teal).toBe('bg-vitalsense-teal');
      expect(getVitalSenseClasses.bg.success).toBe('bg-vitalsense-success');
      expect(getVitalSenseClasses.bg.warning).toBe('bg-vitalsense-warning');
      expect(getVitalSenseClasses.bg.error).toBe('bg-vitalsense-error');
    });

    it('should provide correct text classes', () => {
      expect(getVitalSenseClasses.text.primary).toBe('text-vitalsense-primary');
      expect(getVitalSenseClasses.text.teal).toBe('text-vitalsense-teal');
      expect(getVitalSenseClasses.text.success).toBe('text-vitalsense-success');
      expect(getVitalSenseClasses.text.warning).toBe('text-vitalsense-warning');
      expect(getVitalSenseClasses.text.error).toBe('text-vitalsense-error');
    });

    it('should provide correct border classes', () => {
      expect(getVitalSenseClasses.border.primary).toBe(
        'border-vitalsense-primary'
      );
      expect(getVitalSenseClasses.border.teal).toBe('border-vitalsense-teal');
      expect(getVitalSenseClasses.border.success).toBe(
        'border-vitalsense-success'
      );
      expect(getVitalSenseClasses.border.warning).toBe(
        'border-vitalsense-warning'
      );
      expect(getVitalSenseClasses.border.error).toBe('border-vitalsense-error');
    });
  });

  describe('Health Score Colors', () => {
    it('should provide health score semantic mappings', () => {
      // The color system should provide health score mappings
      expect(VitalSenseColors.primary.main).toBeTruthy();
      expect(VitalSenseColors.success.main).toBeTruthy();
      expect(VitalSenseColors.warning.main).toBeTruthy();
      expect(VitalSenseColors.error.main).toBeTruthy();
    });

    it('should maintain accessibility standards', () => {
      // All contrast values should be defined for accessibility
      expect(VitalSenseColors.primary.contrast).toBeTruthy();
      expect(VitalSenseColors.teal.contrast).toBeTruthy();
      expect(VitalSenseColors.success.contrast).toBeTruthy();
      expect(VitalSenseColors.warning.contrast).toBeTruthy();
      expect(VitalSenseColors.error.contrast).toBeTruthy();
    });
  });

  describe('Brand Consistency', () => {
    it('should maintain consistent naming conventions', () => {
      // Test specific color objects that we know have the required structure
      const colorObjects = [
        'primary',
        'teal',
        'success',
        'warning',
        'error',
      ] as const;

      colorObjects.forEach((colorKey) => {
        const color = VitalSenseColors[colorKey];
        expect(color.main).toBeTruthy();
        expect(color.css).toBeTruthy();
        expect(color.contrast).toBeTruthy();
      });
    });

    it('should provide complete class sets', () => {
      // Each category should have all VitalSense colors
      const expectedColors = ['primary', 'teal', 'success', 'warning', 'error'];

      expectedColors.forEach((color) => {
        expect(
          getVitalSenseClasses.bg[color as keyof typeof getVitalSenseClasses.bg]
        ).toBeTruthy();
        expect(
          getVitalSenseClasses.text[
            color as keyof typeof getVitalSenseClasses.text
          ]
        ).toBeTruthy();
        expect(
          getVitalSenseClasses.border[
            color as keyof typeof getVitalSenseClasses.border
          ]
        ).toBeTruthy();
      });
    });
  });
});
