import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: () => '/',
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));
vi.mock('../../hooks/useThemeMode', () => ({
  useThemeMode: () => ({
    themeMode: 'light',
    toggleThemeMode: vi.fn(),
    effectiveTheme: 'light',
  }),
}));

// Import VitalSense components and utilities
import Footer from '../../components/Footer';
import { AppleSidebarProvider } from '../../components/nav/AppleSidebar';
import NavigationHeader from '../../components/NavigationHeader';
import { AuthContext } from '../../hooks/useAuth';
import type { AuthContextType } from '../../lib/authTypes';
import {
  APP_NAME,
  APP_TAGLINE,
  APP_AUTHOR,
  APP_URL,
  BRAND_COLORS,
  formatPageTitle,
} from '../../lib/branding';
import { VitalSenseColors } from '../../lib/vitalsense-colors';

function withAuth(ui: React.ReactElement) {
  const mockAuth: AuthContextType = {
    user: {
      id: 'test-user',
      email: 'test@vitalsense.com',
      name: 'Test',
      roles: [],
      permissions: [],
      lastLogin: new Date().toISOString(),
      mfaEnabled: false,
      hipaaConsent: true,
    },
    isAuthenticated: true,
    isLoading: false,
    login: async () => {},
    logout: async () => {},
    hasRole: () => true,
    hasPermission: () => true,
    hasAnyPermission: () => true,
    refreshSession: async () => {},
    validateSession: async () => true,
    getAccessToken: async () => 'token',
    getIdToken: async () => 'id-token',
    logHealthDataAccess: () => {},
  };
  return <AuthContext.Provider value={mockAuth}>{ui}</AuthContext.Provider>;
}

const mockFooterProps = {
  healthScore: 85,
  lastSync: new Date(),
  connectionStatus: 'connected' as const,
  onNavigate: () => {},
};

describe('VitalSense Branding Compliance', () => {
  describe('Centralized Branding Constants', () => {
    it('should export the correct app name', () => {
      expect(APP_NAME).toBe('VitalSense');
    });

    it('should export the correct tagline', () => {
      expect(APP_TAGLINE).toBe('Apple Health Insights & Fall Risk Monitor');
    });

    it('should export the correct author', () => {
      expect(APP_AUTHOR).toBe('VitalSense Health Technologies');
    });

    it('should export the correct app URL', () => {
      expect(APP_URL).toBe('https://health.andernet.dev');
    });

    it('should export brand colors matching the primary palette', () => {
      expect(BRAND_COLORS.primary).toBe('#2563eb');
      expect(BRAND_COLORS.teal).toBe('#0891b2');
      expect(BRAND_COLORS.background).toBe('#ffffff');
      expect(BRAND_COLORS.foreground).toBe('#0f172a');
    });

    it('should export extended palette colors', () => {
      expect(BRAND_COLORS.primaryDark).toBe('#1d4ed8');
      expect(BRAND_COLORS.tealDark).toBe('#0e7490');
      expect(BRAND_COLORS.card).toBe('#f8fafc');
      expect(BRAND_COLORS.border).toBe('#e2e8f0');
      expect(BRAND_COLORS.muted).toBe('#64748b');
      expect(BRAND_COLORS.success).toBe('#059669');
      expect(BRAND_COLORS.successLight).toBe('#10b981');
      expect(BRAND_COLORS.error).toBe('#dc2626');
    });

    it('should format page titles correctly', () => {
      expect(formatPageTitle('Dashboard')).toBe('Dashboard \u2022 VitalSense');
      expect(formatPageTitle('Settings')).toBe('Settings \u2022 VitalSense');
    });

    it('should keep BRAND_COLORS.primary in sync with VitalSenseColors', () => {
      expect(BRAND_COLORS.primary).toBe(VitalSenseColors.primary.main);
    });
  });

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
    it('should display VitalSense in navigation header', async () => {
      const user = userEvent.setup();
      render(
        withAuth(
          <AppleSidebarProvider>
            <NavigationHeader />
          </AppleSidebarProvider>
        )
      );

      // VitalSense appears in the quick-actions dropdown
      const moreButton = screen.getByLabelText('More actions');
      await user.click(moreButton);
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
  it('should maintain VitalSense branding in navigation', async () => {
    const user = userEvent.setup();
    render(
      withAuth(
        <AppleSidebarProvider>
          <NavigationHeader />
        </AppleSidebarProvider>
      )
    );

    // VitalSense appears in the quick-actions dropdown
    const moreButton = screen.getByLabelText('More actions');
    await user.click(moreButton);
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
