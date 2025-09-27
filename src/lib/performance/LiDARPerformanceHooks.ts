/**
 * LiDAR Performance Optimization Hooks
 * Essential performance optimizations for LiDAR health monitoring components
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Types for performance optimization
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface BatchProcessingOptions {
  batchSize: number;
  processingDelay: number;
  priorityThreshold: number;
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataProcessingTime: number;
  cacheHitRate: number;
}

// High-performance data caching hook with TTL
export const usePerformanceCache = <T>(ttl = 300000) => {
  const cacheRef = useRef<Map<string, CacheEntry<T>>>(new Map());

  const set = useCallback(
    (key: string, data: T, customTTL?: number) => {
      cacheRef.current.set(key, {
        data,
        timestamp: Date.now(),
        ttl: customTTL || ttl,
      });
    },
    [ttl]
  );

  const get = useCallback((key: string): T | null => {
    const entry = cacheRef.current.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      cacheRef.current.delete(key);
      return null;
    }

    return entry.data;
  }, []);

  const clear = useCallback(() => {
    cacheRef.current.clear();
  }, []);

  const cleanup = useCallback(() => {
    const now = Date.now();
    const toDelete: string[] = [];

    cacheRef.current.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        toDelete.push(key);
      }
    });

    toDelete.forEach((key) => cacheRef.current.delete(key));
    return toDelete.length;
  }, []);

  // Auto-cleanup expired entries
  useEffect(() => {
    const interval = setInterval(cleanup, 60000); // Cleanup every minute
    return () => clearInterval(interval);
  }, [cleanup]);

  return { get, set, clear, cleanup };
};

// Batch processing hook for high-throughput data
export const useBatchProcessor = <T, R>(
  processor: (batch: T[]) => R[],
  options: Partial<BatchProcessingOptions> = {}
) => {
  const {
    batchSize = 50,
    processingDelay = 100,
    priorityThreshold = 10,
  } = options;

  const batchQueue = useRef<T[]>([]);
  const resultCallback = useRef<((results: R[]) => void) | null>(null);
  const processingTimeout = useRef<NodeJS.Timeout | null>(null);

  const processBatch = useCallback(() => {
    if (batchQueue.current.length === 0) return;

    const batch = batchQueue.current.splice(0, batchSize);
    const startTime = performance.now();

    try {
      const results = processor(batch);
      const processingTime = performance.now() - startTime;

      if (resultCallback.current) {
        resultCallback.current(results);
      }

      // Log performance metrics
      console.debug(
        `Batch processed: ${batch.length} items in ${processingTime.toFixed(2)}ms`
      );
    } catch (error) {
      console.error('Batch processing error:', error);
    }
  }, [processor, batchSize]);

  const addToBatch = useCallback(
    (items: T | T[], onComplete?: (results: R[]) => void) => {
      const itemsArray = Array.isArray(items) ? items : [items];
      batchQueue.current.push(...itemsArray);

      if (onComplete) {
        resultCallback.current = onComplete;
      }

      // Process immediately if we have enough items or high priority
      if (batchQueue.current.length >= priorityThreshold) {
        if (processingTimeout.current) {
          clearTimeout(processingTimeout.current);
        }
        processBatch();
      } else {
        // Schedule processing
        if (processingTimeout.current) {
          clearTimeout(processingTimeout.current);
        }
        processingTimeout.current = setTimeout(processBatch, processingDelay);
      }
    },
    [processBatch, priorityThreshold, processingDelay]
  );

  const flush = useCallback(() => {
    if (processingTimeout.current) {
      clearTimeout(processingTimeout.current);
    }
    processBatch();
  }, [processBatch]);

  useEffect(() => {
    return () => {
      if (processingTimeout.current) {
        clearTimeout(processingTimeout.current);
      }
    };
  }, []);

  return { addToBatch, flush, queueLength: batchQueue.current.length };
};

// Memory-efficient virtualization hook
export const useVirtualization = (
  totalItems: number,
  itemHeight: number,
  containerHeight: number
) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleRange = useMemo(() => {
    const start = Math.floor(scrollTop / itemHeight);
    const visibleCount = Math.ceil(containerHeight / itemHeight);
    const end = Math.min(start + visibleCount + 1, totalItems);

    return { start, end, visibleCount };
  }, [scrollTop, itemHeight, containerHeight, totalItems]);

  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  }, []);

  const getItemStyle = useCallback(
    (index: number) => ({
      position: 'absolute' as const,
      top: index * itemHeight,
      width: '100%',
      height: itemHeight,
    }),
    [itemHeight]
  );

  const containerStyle = useMemo(
    () => ({
      height: containerHeight,
      overflow: 'auto' as const,
      position: 'relative' as const,
    }),
    [containerHeight]
  );

  const contentStyle = useMemo(
    () => ({
      height: totalItems * itemHeight,
      position: 'relative' as const,
    }),
    [totalItems, itemHeight]
  );

  return {
    visibleRange,
    handleScroll,
    getItemStyle,
    containerStyle,
    contentStyle,
  };
};

// Performance monitoring hook
export const usePerformanceMonitor = () => {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    renderTime: 0,
    memoryUsage: 0,
    dataProcessingTime: 0,
    cacheHitRate: 0,
  });

  const measureRender = useCallback(
    (componentName: string, renderFn: () => void) => {
      const startTime = performance.now();
      renderFn();
      const renderTime = performance.now() - startTime;

      setMetrics((prev) => ({ ...prev, renderTime }));

      if (renderTime > 16) {
        // More than one frame at 60fps
        console.warn(
          `Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`
        );
      }
    },
    []
  );

  const recordMemoryUsage = useCallback(() => {
    const performanceMemory = (performance as any).memory;
    if (performanceMemory) {
      const memoryUsage = performanceMemory.usedJSHeapSize;
      setMetrics((prev) => ({ ...prev, memoryUsage }));
    }
  }, []);

  const recordProcessingTime = useCallback((time: number) => {
    setMetrics((prev) => ({ ...prev, dataProcessingTime: time }));
  }, []);

  const recordCacheHitRate = useCallback((hits: number, total: number) => {
    const cacheHitRate = total > 0 ? (hits / total) * 100 : 0;
    setMetrics((prev) => ({ ...prev, cacheHitRate }));
  }, []);

  return {
    metrics,
    measureRender,
    recordMemoryUsage,
    recordProcessingTime,
    recordCacheHitRate,
  };
};

// Debounced update hook for high-frequency data
export const useDebouncedUpdate = <T>(
  value: T,
  delay: number,
  onUpdate: (value: T) => void
) => {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onUpdate(value);
    }, delay);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, delay, onUpdate]);
};

// Optimized data fetching with caching
export const useOptimizedDataFetch = <T>(
  fetchKey: string,
  fetchFn: () => Promise<T>,
  cacheTTL = 300000 // 5 minutes
) => {
  const cache = usePerformanceCache<T>(cacheTTL);
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    const cached = cache.get(fetchKey);
    if (cached) {
      setData(cached);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const result = await fetchFn();
      cache.set(fetchKey, result);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  }, [fetchKey, fetchFn, cache]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refetch = useCallback(() => {
    cache.clear();
    fetchData();
  }, [cache, fetchData]);

  return { data, loading, error, refetch };
};

// High-performance WebSocket hook
export const useOptimizedWebSocket = (
  url: string,
  options: {
    onMessage?: (data: unknown) => void;
    onError?: (error: Event) => void;
    reconnectDelay?: number;
    maxReconnectAttempts?: number;
  } = {}
) => {
  const {
    onMessage,
    onError,
    reconnectDelay = 1000,
    maxReconnectAttempts = 5,
  } = options;

  const [connectionState, setConnectionState] = useState<
    'connecting' | 'connected' | 'disconnected'
  >('disconnected');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const messageQueue = useRef<string[]>([]);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setConnectionState('connecting');
    const ws = new WebSocket(url);

    ws.onopen = () => {
      setConnectionState('connected');
      reconnectAttempts.current = 0;

      // Send queued messages
      while (messageQueue.current.length > 0) {
        const message = messageQueue.current.shift();
        if (message) {
          ws.send(message);
        }
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        onMessage?.(data);
      } catch (error) {
        console.error('WebSocket message parsing error:', error);
      }
    };

    ws.onclose = () => {
      setConnectionState('disconnected');

      if (reconnectAttempts.current < maxReconnectAttempts) {
        reconnectAttempts.current++;
        setTimeout(connect, reconnectDelay);
      }
    };

    ws.onerror = (error) => {
      onError?.(error);
    };

    wsRef.current = ws;
  }, [url, onMessage, onError, reconnectDelay, maxReconnectAttempts]);

  const send = useCallback((data: unknown) => {
    const message = JSON.stringify(data);

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    } else {
      messageQueue.current.push(message);
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setConnectionState('disconnected');
  }, []);

  useEffect(() => {
    connect();
    return disconnect;
  }, [connect, disconnect]);

  return { connectionState, send, disconnect, reconnect: connect };
};

// Export performance utilities
export const PerformanceUtils = {
  measureFunction: <T extends unknown[], R>(
    fn: (...args: T) => R,
    name?: string
  ) => {
    return (...args: T): R => {
      const start = performance.now();
      const result = fn(...args);
      const end = performance.now();

      if (name) {
        console.debug(`${name} execution time: ${(end - start).toFixed(2)}ms`);
      }

      return result;
    };
  },

  getMemoryInfo: () => {
    const performanceMemory = (performance as any).memory;
    if (performanceMemory) {
      return {
        usedJSHeapSize: performanceMemory.usedJSHeapSize,
        totalJSHeapSize: performanceMemory.totalJSHeapSize,
        jsHeapSizeLimit: performanceMemory.jsHeapSizeLimit,
      };
    }
    return null;
  },

  throttle: <T extends unknown[]>(fn: (...args: T) => void, delay: number) => {
    let lastCall = 0;
    return (...args: T) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  },
};

export default {
  usePerformanceCache,
  useBatchProcessor,
  useVirtualization,
  usePerformanceMonitor,
  useDebouncedUpdate,
  useOptimizedDataFetch,
  useOptimizedWebSocket,
  PerformanceUtils,
};
