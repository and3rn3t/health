import { useCallback, useState } from 'react';

/**
 * Custom hook to replace @github/spark/hooks useKV
 * Uses localStorage for now to avoid infinite loop issues
 */
export function useKV<T>(
  key: string,
  defaultValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // Simple localStorage-based implementation to avoid async complexity
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(`kv:${key}`);
      const result = stored ? JSON.parse(stored) : defaultValue;
      return result;
    } catch (error) {
      console.error('❌ useKV error for key', key, ':', error);
      return defaultValue;
    }
  });

  // Update value function that supports both direct values and updater functions
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const actualValue =
          typeof newValue === 'function'
            ? (newValue as (prev: T) => T)(prev)
            : newValue;
        try {
          localStorage.setItem(`kv:${key}`, JSON.stringify(actualValue));
        } catch (error) {
          console.error(
            `❌ Failed to save to localStorage for key "${key}":`,
            error
          );
        }
        return actualValue;
      });
    },
    [key],   // only key — value is read via functional update
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
