import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from '@/ErrorFallback';

// Override isDev by mocking hostname
const originalWindow = { ...window };

describe('ErrorFallback', () => {
  it('renders error message and retry button in production mode', () => {
    // Temporarily set hostname to non-localhost
    Object.defineProperty(window, 'location', {
      value: { ...originalWindow.location, hostname: 'health.andernet.dev' },
      writable: true,
    });

    const error = new Error('Something went wrong');
    const reset = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={reset} />);

    expect(screen.getByText(/runtime error/i)).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();

    // Restore
    Object.defineProperty(window, 'location', {
      value: originalWindow.location,
      writable: true,
    });
  });

  it('calls resetErrorBoundary when Try Again is clicked', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalWindow.location, hostname: 'health.andernet.dev' },
      writable: true,
    });

    const error = new Error('Test error');
    const reset = vi.fn();

    render(<ErrorFallback error={error} resetErrorBoundary={reset} />);
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(reset).toHaveBeenCalledOnce();

    Object.defineProperty(window, 'location', {
      value: originalWindow.location,
      writable: true,
    });
  });

  it('rethrows the error in development mode (localhost)', () => {
    Object.defineProperty(window, 'location', {
      value: { ...originalWindow.location, hostname: 'localhost' },
      writable: true,
    });

    const error = new Error('Dev error');
    const reset = vi.fn();

    expect(() => {
      render(<ErrorFallback error={error} resetErrorBoundary={reset} />);
    }).toThrow('Dev error');

    Object.defineProperty(window, 'location', {
      value: originalWindow.location,
      writable: true,
    });
  });
});
