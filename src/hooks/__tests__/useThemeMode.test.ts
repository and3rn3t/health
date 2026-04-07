import { describe, expect, it, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useThemeMode } from '../useThemeMode';

describe('useThemeMode', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute('data-appearance');
  });

  it('should default to system mode', () => {
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.themeMode).toBe('system');
  });

  it('should resolve effective theme based on system preference', () => {
    // Default matchMedia returns matches: false (light mode)
    const { result } = renderHook(() => useThemeMode());
    expect(result.current.effectiveTheme).toBe('light');
  });

  it('should apply data-appearance attribute to document root', () => {
    renderHook(() => useThemeMode());
    expect(document.documentElement.getAttribute('data-appearance')).toBe(
      'light',
    );
  });

  it('should cycle through modes on toggle', () => {
    const { result } = renderHook(() => useThemeMode());

    // system -> light
    act(() => {
      result.current.toggleThemeMode();
    });
    // Starting from 'system', next is 'light' (idx 2 -> 0)
    // Order: ['light', 'dark', 'system'], system is idx 2, next is idx 0 = 'light'
    expect(result.current.themeMode).toBe('light');

    // light -> dark
    act(() => {
      result.current.toggleThemeMode();
    });
    expect(result.current.themeMode).toBe('dark');

    // dark -> system
    act(() => {
      result.current.toggleThemeMode();
    });
    expect(result.current.themeMode).toBe('system');
  });

  it('should set explicit mode via setThemeMode', () => {
    const { result } = renderHook(() => useThemeMode());
    act(() => {
      result.current.setThemeMode('dark');
    });
    expect(result.current.themeMode).toBe('dark');
    expect(result.current.effectiveTheme).toBe('dark');
    expect(document.documentElement.getAttribute('data-appearance')).toBe(
      'dark',
    );
  });
});
