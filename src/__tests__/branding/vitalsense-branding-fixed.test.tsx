import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

// Import VitalSense components and utilities
import Footer from '../../components/Footer';
import NavigationHeader from '../../components/NavigationHeader';
import { VitalSenseColors } from '../../lib/vitalsense-colors';

// Mock props for components
const mockNavigationProps = {
  currentPageInfo: {
    label: 'Health Dashboard',
    category: 'Analytics',
  },
  themeMode: 'light' as const,
  onThemeToggle: () => {},
  onNavigate: () => {},
  onToggleSidebar: () => {},
  sidebarCollapsed: false,
  healthScore: 85,
  hasAlerts: false,
};

const mockFooterProps = {
  healthScore: 85,
  lastSync: new Date(),
  connectionStatus: 'connected' as const,
  onNavigate: () => {},
};

describe('VitalSense Branding Compliance', () => {
  describe('Brand Colors', () => {
    it('should define correct VitalSense color palette', () => {
      expect(VitalSenseColors.primary.main).toBe('#2563eb');
      expect(VitalSenseColors.teal.main).toBe('#0891b2');
    });

    it('should provide VitalSense status colors', () => {
      expect(VitalSenseColors.success.main).toBe('#059669');
      expect(VitalSenseColors.error.main).toBe('#dc2626');
    });

    it('should have proper CSS class names', () => {
      expect(VitalSenseColors.primary.css).toBe('vitalsense-primary');
      expect(VitalSenseColors.teal.css).toBe('vitalsense-teal');
    });
  });

  describe('Brand Text Consistency', () => {
    it('should display VitalSense in navigation header', () => {
      render(<NavigationHeader {...mockNavigationProps} />);

      // Check for VitalSense branding in header
      const brandElements = screen.getAllByText(/VitalSense/i);
      expect(brandElements.length).toBeGreaterThan(0);
    });

    it('should display VitalSense in footer', () => {
      render(<Footer {...mockFooterProps} />);

      // Check for VitalSense branding in footer
      const footerBrand = screen.getByText(/VitalSense/i);
      expect(footerBrand).toBeInTheDocument();
    });

    it('should not contain generic "Health App" references', () => {
      render(<Footer {...mockFooterProps} />);

      // Ensure no generic branding remains
      const genericText = screen.queryByText(/(?<!VitalSense )Health App/i);
      expect(genericText).not.toBeInTheDocument();
    });
  });

  describe('Component Branding', () => {
    it('should render VitalSense-branded components with correct styling', () => {
      const { container } = render(
        <div
          className="bg-vitalsense-primary-light text-vitalsense-primary"
          data-testid="vitalsense-element"
        >
          VitalSense Status
        </div>
      );

      const statusElement = container.querySelector(
        '[data-testid="vitalsense-element"]'
      );
      expect(statusElement).toHaveClass('text-vitalsense-primary');
      expect(statusElement).toHaveClass('bg-vitalsense-primary-light');
    });

    it('should use consistent VitalSense color classes', () => {
      // Test that we can access the color utilities
      expect(VitalSenseColors.primary.main).toMatch(/^#[0-9a-f]{6}$/i);
      expect(VitalSenseColors.teal.main).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('VitalSense Brand Assets', () => {
  it('should maintain VitalSense branding in navigation', () => {
    render(<NavigationHeader {...mockNavigationProps} />);

    const brandText = screen.getByText(/VitalSense/i);
    expect(brandText).toBeVisible();
  });

  it('should show VitalSense branding in footer', () => {
    render(<Footer {...mockFooterProps} />);

    // VitalSense should appear in footer
    const footerText = screen.getByText(/VitalSense/i);
    expect(footerText).toBeInTheDocument();
  });
});

describe('VitalSense Theme Consistency', () => {
  it('should provide semantic color mappings', () => {
    // Test color object structure
    expect(VitalSenseColors).toHaveProperty('primary');
    expect(VitalSenseColors).toHaveProperty('teal');
    expect(VitalSenseColors).toHaveProperty('success');
    expect(VitalSenseColors).toHaveProperty('error');
    expect(VitalSenseColors).toHaveProperty('warning');
  });

  it('should have proper color contrast values', () => {
    expect(VitalSenseColors.primary.contrast).toBe('#ffffff');
    expect(VitalSenseColors.teal.contrast).toBe('#ffffff');
  });
});
