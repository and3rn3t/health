/**
 * Clean LiDAR Performance Optimizer
 * Simplified, lint-compliant performance optimization system
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
} from 'react';

// Clean performance types
interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataProcessingTime: number;
  cacheHitRate: number;
}

interface PerformanceConfig {
  cacheEnabled: boolean;
  batchSize: number;
  debounceDelay: number;
  memoryThreshold: number;
}

interface PerformanceState {
  metrics: PerformanceMetrics;
  config: PerformanceConfig;
  cacheStats: {
    hits: number;
    misses: number;
    totalRequests: number;
  };
}

// Simple cache implementation without generics to avoid JSX parsing issues
class SimpleCache {
  private readonly cache = new Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  >();
  private readonly defaultTTL = 300000; // 5 minutes

  set(key: string, data: unknown, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  get(key: string): unknown | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): number {
    const now = Date.now();
    let deletedCount = 0;

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
        deletedCount++;
      }
    });

    return deletedCount;
  }

  get size(): number {
    return this.cache.size;
  }
}

// Performance reducer
type PerformanceAction =
  | { type: 'UPDATE_METRICS'; payload: Partial<PerformanceMetrics> }
  | { type: 'UPDATE_CONFIG'; payload: Partial<PerformanceConfig> }
  | { type: 'INCREMENT_CACHE_HIT' }
  | { type: 'INCREMENT_CACHE_MISS' };

const performanceReducer = (
  state: PerformanceState,
  action: PerformanceAction
): PerformanceState => {
  switch (action.type) {
    case 'UPDATE_METRICS': {
      return {
        ...state,
        metrics: { ...state.metrics, ...action.payload },
      };
    }

    case 'UPDATE_CONFIG': {
      return {
        ...state,
        config: { ...state.config, ...action.payload },
      };
    }

    case 'INCREMENT_CACHE_HIT': {
      const newStats = {
        ...state.cacheStats,
        hits: state.cacheStats.hits + 1,
        totalRequests: state.cacheStats.totalRequests + 1,
      };
      return {
        ...state,
        cacheStats: newStats,
        metrics: {
          ...state.metrics,
          cacheHitRate: (newStats.hits / newStats.totalRequests) * 100,
        },
      };
    }

    case 'INCREMENT_CACHE_MISS': {
      const newStats = {
        ...state.cacheStats,
        misses: state.cacheStats.misses + 1,
        totalRequests: state.cacheStats.totalRequests + 1,
      };
      return {
        ...state,
        cacheStats: newStats,
        metrics: {
          ...state.metrics,
          cacheHitRate: (newStats.hits / newStats.totalRequests) * 100,
        },
      };
    }

    default:
      return state;
  }
};

// Performance context
interface PerformanceContextType {
  state: PerformanceState;
  dispatch: React.Dispatch<PerformanceAction>;
  dataCache: SimpleCache;
  measureRender: (name: string, fn: () => void) => void;
  recordMemoryUsage: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | null>(null);

// Performance provider component
export const CleanLiDARPerformanceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const initialState: PerformanceState = {
    metrics: {
      renderTime: 0,
      memoryUsage: 0,
      dataProcessingTime: 0,
      cacheHitRate: 0,
    },
    config: {
      cacheEnabled: true,
      batchSize: 50,
      debounceDelay: 100,
      memoryThreshold: 100 * 1024 * 1024, // 100MB
    },
    cacheStats: {
      hits: 0,
      misses: 0,
      totalRequests: 0,
    },
  };

  const [state, dispatch] = useReducer(performanceReducer, initialState);

  // Cache instance
  const dataCache = useMemo(() => new SimpleCache(), []);

  // Performance measurement
  const measureRender = useCallback((name: string, fn: () => void) => {
    const startTime = performance.now();
    fn();
    const renderTime = performance.now() - startTime;

    dispatch({
      type: 'UPDATE_METRICS',
      payload: { renderTime },
    });

    if (renderTime > 16) {
      console.warn(
        `Slow render detected in ${name}: ${renderTime.toFixed(2)}ms`
      );
    }
  }, []);

  // Memory usage recording
  const recordMemoryUsage = useCallback(() => {
    try {
      const performanceMemory = (
        performance as { memory?: { usedJSHeapSize: number } }
      ).memory;
      if (performanceMemory) {
        const memoryUsage = performanceMemory.usedJSHeapSize;
        dispatch({
          type: 'UPDATE_METRICS',
          payload: { memoryUsage },
        });
      }
    } catch (error) {
      console.debug('Memory API not available:', error);
    }
  }, []);

  // Periodic cleanup
  useEffect(() => {
    const interval = setInterval(() => {
      const deletedCount = dataCache.cleanup();
      if (deletedCount > 0) {
        console.debug(`Cleaned up ${deletedCount} expired cache entries`);
      }
      recordMemoryUsage();
    }, 60000); // Every minute

    return () => clearInterval(interval);
  }, [dataCache, recordMemoryUsage]);

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      dataCache,
      measureRender,
      recordMemoryUsage,
    }),
    [state, dispatch, dataCache, measureRender, recordMemoryUsage]
  );

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Custom hook for using performance context
export const useCleanLiDARPerformance = (): PerformanceContextType => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error(
      'useCleanLiDARPerformance must be used within a CleanLiDARPerformanceProvider'
    );
  }
  return context;
};

// Performance metrics hook
export const usePerformanceMetrics = () => {
  const { state, measureRender, recordMemoryUsage } =
    useCleanLiDARPerformance();

  return {
    metrics: state.metrics,
    config: state.config,
    cacheStats: state.cacheStats,
    measureRender,
    recordMemoryUsage,
  };
};

// Simple processing hook
export const useDebouncedProcessing = (
  processor: (data: unknown[]) => void,
  delay = 100
) => {
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  const processData = useCallback(
    (data: unknown[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        const startTime = performance.now();
        processor(data);
        const processingTime = performance.now() - startTime;
        console.debug(
          `Batch processed: ${data.length} items in ${processingTime.toFixed(2)}ms`
        );
      }, delay);
    },
    [processor, delay]
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return processData;
};

export default CleanLiDARPerformanceProvider;
