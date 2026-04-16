import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  AppleSidebarProvider,
  useAppleSidebar,
} from '../AppleSidebar';

function Consumer() {
  const ctx = useAppleSidebar();
  return <div data-testid="state">{ctx.state}</div>;
}

describe('AppleSidebar', () => {
  it('provides default expanded state', () => {
    render(
      <AppleSidebarProvider>
        <Consumer />
      </AppleSidebarProvider>
    );
    expect(screen.getByTestId('state')).toHaveTextContent('expanded');
  });

  it('provides collapsed state when defaultOpen is false', () => {
    render(
      <AppleSidebarProvider defaultOpen={false}>
        <Consumer />
      </AppleSidebarProvider>
    );
    expect(screen.getByTestId('state')).toHaveTextContent('collapsed');
  });

  it('throws when useAppleSidebar is used without provider', () => {
    expect(() => render(<Consumer />)).toThrow(
      'useAppleSidebar must be used within AppleSidebarProvider'
    );
  });
});
