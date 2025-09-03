import { useCallback, useState } from 'react';

/**
 * Custom hook to replace @github/spark/hooks useKV
 * Uses localStorage for now to avoid infinite loop issues
 */
export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  // Simple localStorage-based implementation to avoid async complexity
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`kv:${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  // Update value function
  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      try {
        localStorage.setItem(`kv:${key}`, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Failed to save to localStorage for key "${key}":`, error);
      }
    },
    [key]
  );

  return [value, updateValue];
}

/**
 * Hook for localStorage-only storage (simpler, faster for dev)
 */
export function useLocalStorage<T>(
  key: string,
  defaultValue: T
): [T, (value: T) => void] {
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch {
      return defaultValue;
    }
  });

  const updateValue = useCallback(
    (newValue: T) => {
      setValue(newValue);
      try {
        localStorage.setItem(key, JSON.stringify(newValue));
      } catch (error) {
        console.warn(`Failed to save to localStorage for key "${key}":`, error);
      }
    },
    [key]
  );

  return [value, updateValue];
}
