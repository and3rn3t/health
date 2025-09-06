import { describe, expect, it } from 'vitest';

// Import navigation utilities and types
import { DASHBOARD_PAGES } from '../../lib/dashboardPages';

describe('VitalSense Navigation System', () => {
  describe('Dashboard Pages Configuration', () => {
    it('should define all required VitalSense dashboard pages', () => {
      expect(DASHBOARD_PAGES).toBeDefined();
      expect(Array.isArray(DASHBOARD_PAGES)).toBe(true);
      expect(DASHBOARD_PAGES.length).toBeGreaterThan(0);
    });

    it('should have health analytics as primary page', () => {
      const healthPage = DASHBOARD_PAGES.find(
        (page) =>
          page.category === 'Analytics' && page.label === 'Health Overview'
      );
      expect(healthPage).toBeDefined();
      expect(healthPage?.path).toBe('/health');
    });

    it('should include fall risk monitoring', () => {
      const fallRiskPage = DASHBOARD_PAGES.find((page) =>
        page.label.toLowerCase().includes('fall risk')
      );
      expect(fallRiskPage).toBeDefined();
    });

    it('should maintain consistent page structure', () => {
      DASHBOARD_PAGES.forEach((page) => {
        expect(page.label).toBeTruthy();
        expect(page.path).toBeTruthy();
        expect(page.category).toBeTruthy();
        expect(page.icon).toBeTruthy();

        // Path should start with /
        expect(page.path).toMatch(/^\/[\w-]+$/);
      });
    });
  });

  describe('Navigation Categories', () => {
    it('should organize pages by logical categories', () => {
      const categories = new Set(DASHBOARD_PAGES.map((page) => page.category));

      // Should have at least these core categories
      expect(categories.has('Analytics')).toBe(true);
      expect(categories.has('Monitoring')).toBe(true);

      // Each category should have pages
      categories.forEach((category) => {
        const pagesInCategory = DASHBOARD_PAGES.filter(
          (page) => page.category === category
        );
        expect(pagesInCategory.length).toBeGreaterThan(0);
      });
    });

    it('should use VitalSense-appropriate page labels', () => {
      const pageLabels = DASHBOARD_PAGES.map((page) =>
        page.label.toLowerCase()
      );

      // Should not contain generic terms
      pageLabels.forEach((label) => {
        expect(label).not.toContain('generic');
        expect(label).not.toContain('default');
        expect(label).not.toContain('sample');
      });

      // Should contain health-related terms
      const hasHealthTerms = pageLabels.some(
        (label) =>
          label.includes('health') ||
          label.includes('vital') ||
          label.includes('monitor') ||
          label.includes('analytics')
      );
      expect(hasHealthTerms).toBe(true);
    });
  });

  describe('Navigation Icons', () => {
    it('should use appropriate icons for health context', () => {
      DASHBOARD_PAGES.forEach((page) => {
        expect(page.icon).toBeTruthy();
        expect(typeof page.icon).toBe('string');

        // Icons should be meaningful for health app
        const healthAppropriateIcons = [
          'heart',
          'activity',
          'shield',
          'users',
          'trending-up',
          'bell',
          'settings',
          'user',
          'home',
          'bar-chart',
          'pie-chart',
          'line-chart',
          'alertTriangle',
          'smartphone',
        ];

        expect(healthAppropriateIcons.includes(page.icon)).toBe(true);
      });
    });
  });

  describe('Page Paths', () => {
    it('should have unique paths for all pages', () => {
      const paths = DASHBOARD_PAGES.map((page) => page.path);
      const uniquePaths = new Set(paths);

      expect(uniquePaths.size).toBe(paths.length);
    });

    it('should use SEO-friendly URL structure', () => {
      DASHBOARD_PAGES.forEach((page) => {
        // Should be lowercase with hyphens
        expect(page.path).toMatch(/^\/[a-z0-9-]+$/);

        // Should not have spaces or special characters
        expect(page.path).not.toMatch(/[\s_@#$%^&*()+=]/);
      });
    });
  });

  describe('VitalSense Branding in Navigation', () => {
    it('should maintain VitalSense context in page definitions', () => {
      // The navigation system should be designed for VitalSense
      const vitalSenseTerms = [
        'health',
        'vital',
        'monitor',
        'sense',
        'wellness',
        'care',
      ];

      const hasVitalSenseContext = DASHBOARD_PAGES.some((page) =>
        vitalSenseTerms.some(
          (term) =>
            page.label.toLowerCase().includes(term) ||
            page.path.toLowerCase().includes(term)
        )
      );

      expect(hasVitalSenseContext).toBe(true);
    });

    it('should not reference generic app terms', () => {
      DASHBOARD_PAGES.forEach((page) => {
        const lowercaseLabel = page.label.toLowerCase();

        // Should not contain generic app references
        expect(lowercaseLabel).not.toContain('app');
        expect(lowercaseLabel).not.toContain('application');
        expect(lowercaseLabel).not.toContain('software');
        expect(lowercaseLabel).not.toContain('platform');
      });
    });
  });
});
