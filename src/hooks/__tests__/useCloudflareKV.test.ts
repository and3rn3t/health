import { describe, expect, it, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useKV, useLocalStorage } from '../useCloudflareKV';

describe('useKV', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default value when no stored data', () => {
    const { result } = renderHook(() => useKV('test-key', 'default'));
    expect(result.current[0]).toBe('default');
  });

  it('should read stored value from localStorage', () => {
    localStorage.setItem('kv:my-key', JSON.stringify('stored-value'));
    const { result } = renderHook(() => useKV('my-key', 'default'));
    expect(result.current[0]).toBe('stored-value');
  });

  it('should persist value to localStorage on update', () => {
    const { result } = renderHook(() => useKV('persist-key', 'initial'));
    act(() => {
      result.current[1]('updated');
    });
    expect(result.current[0]).toBe('updated');
    expect(JSON.parse(localStorage.getItem('kv:persist-key') || '')).toBe(
      'updated',
    );
  });

  it('should support updater function', () => {
    const { result } = renderHook(() => useKV('count', 0));
    act(() => {
      result.current[1]((prev: number) => prev + 1);
    });
    expect(result.current[0]).toBe(1);
  });

  it('should handle objects', () => {
    const obj = { a: 1, b: 'two' };
    const { result } = renderHook(() =>
      useKV('obj-key', { a: 0, b: '' }),
    );
    act(() => {
      result.current[1](obj);
    });
    expect(result.current[0]).toEqual(obj);
  });

  it('should return default on corrupted JSON in localStorage', () => {
    localStorage.setItem('kv:bad', '{invalid');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const { result } = renderHook(() => useKV('bad', 'fallback'));
    expect(result.current[0]).toBe('fallback');
    spy.mockRestore();
  });
});

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should return default value when key is absent', () => {
    const { result } = renderHook(() =>
      useLocalStorage('ls-test', 'default'),
    );
    expect(result.current[0]).toBe('default');
  });

  it('should persist and read values', () => {
    const { result } = renderHook(() => useLocalStorage('ls-rw', 42));
    act(() => {
      result.current[1](99);
    });
    expect(result.current[0]).toBe(99);
    expect(JSON.parse(localStorage.getItem('ls-rw') || '')).toBe(99);
  });
});
