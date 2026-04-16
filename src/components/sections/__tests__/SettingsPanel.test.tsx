import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/settings/UserSettingsPanel', () => ({
  __esModule: true,
  default: () => <div data-testid="user-settings-panel" />,
}));

const { default: SettingsPanel } = await import('../SettingsPanel');

describe('SettingsPanel', () => {
  it('renders App Preferences section', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('App Preferences')).toBeInTheDocument();
  });

  it('renders Danger Zone section', () => {
    render(<SettingsPanel />);
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();
  });

  it('renders the UserSettingsPanel', () => {
    render(<SettingsPanel />);
    expect(screen.getByTestId('user-settings-panel')).toBeInTheDocument();
  });
});
