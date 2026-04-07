import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLiveRegion } from '../useLiveRegion';

describe('useLiveRegion', () => {
  beforeEach(() => {
    // Clean up any live region nodes from prior tests
    document.getElementById('vs-live-region')?.remove();
    document.getElementById('custom-region')?.remove();
  });

  it('should create a hidden live region element on mount', () => {
    renderHook(() => useLiveRegion());
    const node = document.getElementById('vs-live-region');
    expect(node).not.toBeNull();
    expect(node?.getAttribute('role')).toBe('status');
    expect(node?.getAttribute('aria-live')).toBe('polite');
    expect(node?.getAttribute('aria-atomic')).toBe('true');
  });

  it('should reuse an existing node with the same id', () => {
    const existing = document.createElement('div');
    existing.id = 'vs-live-region';
    document.body.appendChild(existing);

    renderHook(() => useLiveRegion());
    const nodes = document.querySelectorAll('#vs-live-region');
    expect(nodes.length).toBe(1);
  });

  it('should announce messages as textContent', async () => {
    const { result } = renderHook(() => useLiveRegion());
    const raf = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((cb) => {
        cb(0);
        return 0;
      });

    act(() => {
      result.current('Fall risk updated');
    });

    const node = document.getElementById('vs-live-region');
    expect(node?.textContent).toBe('Fall risk updated');
    raf.mockRestore();
  });

  it('should support custom region id', () => {
    renderHook(() => useLiveRegion('custom-region'));
    const node = document.getElementById('custom-region');
    expect(node).not.toBeNull();
    expect(document.getElementById('vs-live-region')).toBeNull();
  });
});
