/**
 * Mock GitHub Spark KV Storage for Development
 * Provides localStorage fallback when Spark KV endpoints aren't available
 */

interface SparkKVResponse<T> {
  value: T;
  success: boolean;
}

class MockSparkKV {
  private isSparkAvailable = false;

  constructor() {
    // Check if we're in a Spark environment
    this.checkSparkAvailability();
  }

  private async checkSparkAvailability(): Promise<void> {
    try {
      const response = await fetch('/_spark/loaded', { method: 'POST' });
      this.isSparkAvailable = response.ok;
    } catch {
      this.isSparkAvailable = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (this.isSparkAvailable) {
      try {
        const response = await fetch(`/_spark/kv/${key}`);
        if (response.ok) {
          const data: SparkKVResponse<T> = await response.json();
          return data.value;
        }
      } catch (error) {
        console.warn(
          `Spark KV GET failed for ${key}, falling back to localStorage:`,
          error
        );
      }
    }

    // Fallback to localStorage
    try {
      const stored = localStorage.getItem(`spark-kv-${key}`);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

  async set<T>(key: string, value: T): Promise<boolean> {
    if (this.isSparkAvailable) {
      try {
        const response = await fetch(`/_spark/kv/${key}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ value }),
        });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.warn(
          `Spark KV SET failed for ${key}, falling back to localStorage:`,
          error
        );
      }
    }

    // Fallback to localStorage
    try {
      localStorage.setItem(`spark-kv-${key}`, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<boolean> {
    if (this.isSparkAvailable) {
      try {
        const response = await fetch(`/_spark/kv/${key}`, { method: 'DELETE' });
        if (response.ok) {
          return true;
        }
      } catch (error) {
        console.warn(
          `Spark KV DELETE failed for ${key}, falling back to localStorage:`,
          error
        );
      }
    }

    // Fallback to localStorage
    try {
      localStorage.removeItem(`spark-kv-${key}`);
      return true;
    } catch {
      return false;
    }
  }
}

export const mockSparkKV = new MockSparkKV();

// Hook to replace @github/spark/hooks useKV
export function useKV<T>(
  key: string,
  defaultValue?: T
): [T | undefined, (value: T) => Promise<void>] {
  const [state, setState] = React.useState<T | undefined>(defaultValue);
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load initial value
  React.useEffect(() => {
    if (!isLoaded) {
      mockSparkKV.get<T>(key).then((value) => {
        setState(value !== null ? value : defaultValue);
        setIsLoaded(true);
      });
    }
  }, [key, defaultValue, isLoaded]);

  const setValue = React.useCallback(
    async (value: T) => {
      setState(value);
      await mockSparkKV.set(key, value);
    },
    [key]
  );

  return [state, setValue];
}

// Import React for the hook
import React from 'react';
