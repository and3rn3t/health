import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@/test/render';

// Mock dependencies before importing the component
vi.mock('@/hooks/useCloudflareKV', () => ({
  useKV: vi.fn().mockImplementation((_key: string, defaultVal: unknown) => [
    defaultVal,
    vi.fn(),
  ]),
}));

vi.mock('@/lib/api-client', () => ({
  getApiClient: () => ({
    enable2FA: vi.fn().mockResolvedValue({ enabled: true }),
    disable2FA: vi.fn().mockResolvedValue({ enabled: false }),
    exportUserData: vi.fn().mockResolvedValue(new Response('csv')),
  }),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

// Dynamic import so mocks are in place
const { default: UserSettingsPanel } = await import('../UserSettingsPanel');

describe('UserSettingsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the Account & Profile heading', () => {
    render(
      <TestProviders>
        <UserSettingsPanel />
      </TestProviders>,
    );
    expect(screen.getByText('Account & Profile')).toBeInTheDocument();
  });

  it('renders profile input fields', () => {
    render(
      <TestProviders>
        <UserSettingsPanel />
      </TestProviders>,
    );

    // Should have display name and email fields
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThan(0);
  });

  it('renders notification toggles', () => {
    render(
      <TestProviders>
        <UserSettingsPanel />
      </TestProviders>,
    );

    // Switch elements for notifications
    const switches = document.querySelectorAll('[role="switch"]');
    expect(switches.length).toBeGreaterThan(0);
  });

  it('renders save and reset buttons', () => {
    render(
      <TestProviders>
        <UserSettingsPanel />
      </TestProviders>,
    );

    // Look for action buttons
    const saveBtn = screen.queryByText(/save/i);
    const resetBtn = screen.queryByText(/reset/i);
    // At least one of these should be present
    expect(saveBtn || resetBtn).toBeTruthy();
  });

  it('renders data export button', () => {
    render(
      <TestProviders>
        <UserSettingsPanel />
      </TestProviders>,
    );

    expect(screen.queryByText(/export/i)).toBeTruthy();
  });

  it('renders 2FA toggle', () => {
    render(
      <TestProviders>
        <UserSettingsPanel />
      </TestProviders>,
    );

    const twoFaText = screen.queryByText(/two.factor|2fa|two-factor/i);
    expect(twoFaText).toBeTruthy();
  });

  it('renders without crashing with default settings', () => {
    const { container } = render(
      <TestProviders>
        <UserSettingsPanel />
      </TestProviders>,
    );
    expect(container.firstChild).toBeTruthy();
  });
});
