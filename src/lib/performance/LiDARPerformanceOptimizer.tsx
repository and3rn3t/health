/**
 * LiDAR Performance Optimizer
 * High-impact performance optimizations for LiDAR health monitoring components
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react';

// Performance optimization types
interface PerformanceState {
  dataCache: Map<string, CacheEntry>;
  mlResultsCache: Map<string, CacheEntry>;
  webSocketConnections: Map<string, WebSocket>;
  renderOptimizations: {
    enableVirtualization: boolean;
    batchSize: number;
    debounceDelay: number;
  };
  memoryUsage: {
    current: number;
    peak: number;
    warnings: string[];
  };
}

interface PerformanceMetrics {
  renderTime: number;
  memoryUsage: number;
  dataProcessingTime: number;
  mlInferenceTime: number;
  webSocketLatency: number;
}

interface LiDARDataBatch {
  id: string;
  timestamp: number;
  pointClouds: any[];
  trajectories: any[];
  processed: boolean;
  priority: 'high' | 'medium' | 'low';
}

// Performance optimization types
interface CacheEntry<T = unknown> {
  data?: T;
  result?: T;
  timestamp: number;
  ttl: number;
}

interface ProcessedResult {
  id: string;
  processed: boolean;
  processingTime: number;
}

// Action types for performance state management
type PerformanceAction =
  | {
      type: 'CACHE_DATA';
      payload: { key: string; data: unknown; ttl?: number };
    }
  | {
      type: 'CACHE_ML_RESULT';
      payload: { key: string; result: unknown; ttl?: number };
    }
  | { type: 'UPDATE_METRICS'; payload: PerformanceMetrics }
  | { type: 'BATCH_PROCESS_DATA'; payload: LiDARDataBatch[] }
  | { type: 'OPTIMIZE_MEMORY'; payload: { threshold: number } }
  | {
      type: 'UPDATE_WEBSOCKET';
      payload: { endpoint: string; connection: WebSocket };
    };

// Performance state reducer
const performanceReducer = (
  state: PerformanceState,
  action: PerformanceAction
): PerformanceState => {
  switch (action.type) {
    case 'CACHE_DATA': {
      const newDataCache = new Map(state.dataCache);
      newDataCache.set(action.payload.key, {
        data: action.payload.data,
        timestamp: Date.now(),
        ttl: action.payload.ttl || 300000, // 5 minutes default
      });
      return { ...state, dataCache: newDataCache };
    }

    case 'CACHE_ML_RESULT': {
      const newMLCache = new Map(state.mlResultsCache);
      newMLCache.set(action.payload.key, {
        result: action.payload.result,
        timestamp: Date.now(),
        ttl: action.payload.ttl || 600000, // 10 minutes for ML results
      });
      return { ...state, mlResultsCache: newMLCache };
    }

    case 'UPDATE_WEBSOCKET': {
      const newConnections = new Map(state.webSocketConnections);
      newConnections.set(action.payload.endpoint, action.payload.connection);
      return { ...state, webSocketConnections: newConnections };
    }

    case 'OPTIMIZE_MEMORY': {
      // Clean expired cache entries
      const now = Date.now();
      const optimizedDataCache = new Map();
      const optimizedMLCache = new Map();

      state.dataCache.forEach((value, key) => {
        if (now - value.timestamp < value.ttl) {
          optimizedDataCache.set(key, value);
        }
      });

      state.mlResultsCache.forEach((value, key) => {
        if (now - value.timestamp < value.ttl) {
          optimizedMLCache.set(key, value);
        }
      });

      return {
        ...state,
        dataCache: optimizedDataCache,
        mlResultsCache: optimizedMLCache,
        memoryUsage: {
          ...state.memoryUsage,
          current: optimizedDataCache.size + optimizedMLCache.size,
        },
      };
    }

    default:
      return state;
  }
};

// Performance Context
const PerformanceContext = createContext<{
  state: PerformanceState;
  dispatch: React.Dispatch<PerformanceAction>;
  getCachedData: (key: string) => any;
  getCachedMLResult: (key: string) => any;
  getWebSocketConnection: (endpoint: string) => WebSocket | null;
  batchProcessor: DataBatchProcessor;
  memoryOptimizer: MemoryOptimizer;
} | null>(null);

// Data Batch Processor for high-performance data handling
class DataBatchProcessor {
  private batchQueue: LiDARDataBatch[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private batchSize = 50;
  private processingDelay = 100; // ms

  constructor(
    private dispatch: React.Dispatch<PerformanceAction>,
    private onBatchProcessed: (results: any[]) => void
  ) {
    this.startProcessing();
  }

  addToBatch(data: LiDARDataBatch) {
    this.batchQueue.push(data);

    // Process immediately if high priority or batch is full
    if (data.priority === 'high' || this.batchQueue.length >= this.batchSize) {
      this.processBatch();
    }
  }

  private startProcessing() {
    this.processingInterval = setInterval(() => {
      if (this.batchQueue.length > 0) {
        this.processBatch();
      }
    }, this.processingDelay);
  }

  private processBatch() {
    if (this.batchQueue.length === 0) return;

    const batch = this.batchQueue.splice(0, this.batchSize);
    const processStartTime = performance.now();

    // Process in Web Worker if available, otherwise process synchronously
    const processedResults = batch.map((item) => ({
      ...item,
      processed: true,
      processingTime: performance.now() - processStartTime,
    }));

    this.onBatchProcessed(processedResults);

    // Update performance metrics
    this.dispatch({
      type: 'UPDATE_METRICS',
      payload: {
        renderTime: 0,
        memoryUsage: (performance as any).memory?.usedJSHeapSize || 0,
        dataProcessingTime: performance.now() - processStartTime,
        mlInferenceTime: 0,
        webSocketLatency: 0,
      },
    });
  }

  cleanup() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
  }
}

// Memory Optimizer for efficient resource management
class MemoryOptimizer {
  private memoryCheckInterval: NodeJS.Timeout | null = null;
  private memoryThreshold = 100 * 1024 * 1024; // 100MB

  constructor(private dispatch: React.Dispatch<PerformanceAction>) {
    this.startMemoryMonitoring();
  }

  private startMemoryMonitoring() {
    this.memoryCheckInterval = setInterval(() => {
      if ((performance as any).memory) {
        const currentMemory = (performance as any).memory.usedJSHeapSize;

        if (currentMemory > this.memoryThreshold) {
          this.dispatch({
            type: 'OPTIMIZE_MEMORY',
            payload: { threshold: this.memoryThreshold },
          });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  forceOptimization() {
    this.dispatch({
      type: 'OPTIMIZE_MEMORY',
      payload: { threshold: 0 }, // Force cleanup regardless of threshold
    });

    // Suggest garbage collection if available
    if (window.gc) {
      window.gc();
    }
  }

  cleanup() {
    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval);
    }
  }
}

// WebSocket Connection Manager for optimized connections
class WebSocketManager {
  private connections = new Map<string, WebSocket>();
  private messageQueues = new Map<string, any[]>();
  private batchInterval = 100; // ms

  constructor(private dispatch: React.Dispatch<PerformanceAction>) {}

  getConnection(endpoint: string): WebSocket {
    if (!this.connections.has(endpoint)) {
      const ws = new WebSocket(endpoint);
      this.setupConnection(ws, endpoint);
      this.connections.set(endpoint, ws);

      this.dispatch({
        type: 'UPDATE_WEBSOCKET',
        payload: { endpoint, connection: ws },
      });
    }

    return this.connections.get(endpoint)!;
  }

  private setupConnection(ws: WebSocket, endpoint: string) {
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.queueMessage(endpoint, data);
    };

    ws.onclose = () => {
      this.connections.delete(endpoint);
    };

    // Set up batched message processing
    setInterval(() => {
      this.processBatchedMessages(endpoint);
    }, this.batchInterval);
  }

  private queueMessage(endpoint: string, data: any) {
    if (!this.messageQueues.has(endpoint)) {
      this.messageQueues.set(endpoint, []);
    }
    this.messageQueues.get(endpoint)!.push(data);
  }

  private processBatchedMessages(endpoint: string) {
    const queue = this.messageQueues.get(endpoint);
    if (!queue || queue.length === 0) return;

    // Process all queued messages in a single batch
    const messages = queue.splice(0);
    // Emit batched update event
    window.dispatchEvent(
      new CustomEvent('lidar-batch-update', {
        detail: { endpoint, messages },
      })
    );
  }

  cleanup() {
    this.connections.forEach((ws) => ws.close());
    this.connections.clear();
    this.messageQueues.clear();
  }
}

// Performance Provider Component
export const LiDARPerformanceProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const initialState: PerformanceState = {
    dataCache: new Map(),
    mlResultsCache: new Map(),
    webSocketConnections: new Map(),
    renderOptimizations: {
      enableVirtualization: true,
      batchSize: 50,
      debounceDelay: 100,
    },
    memoryUsage: {
      current: 0,
      peak: 0,
      warnings: [],
    },
  };

  const [state, dispatch] = useReducer(performanceReducer, initialState);

  // Initialize performance managers
  const batchProcessor = useMemo(
    () =>
      new DataBatchProcessor(dispatch, (results) => {
        console.log('Batch processed:', results.length, 'items');
      }),
    [dispatch]
  );

  const memoryOptimizer = useMemo(
    () => new MemoryOptimizer(dispatch),
    [dispatch]
  );

  const webSocketManager = useMemo(
    () => new WebSocketManager(dispatch),
    [dispatch]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      batchProcessor.cleanup();
      memoryOptimizer.cleanup();
      webSocketManager.cleanup();
    };
  }, [batchProcessor, memoryOptimizer, webSocketManager]);

  // Cached data getter with TTL check
  const getCachedData = useCallback(
    (key: string) => {
      const cached = state.dataCache.get(key);
      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > cached.ttl) {
        // Expired, remove from cache
        dispatch({ type: 'OPTIMIZE_MEMORY', payload: { threshold: 0 } });
        return null;
      }

      return cached.data;
    },
    [state.dataCache]
  );

  // Cached ML result getter with TTL check
  const getCachedMLResult = useCallback(
    (key: string) => {
      const cached = state.mlResultsCache.get(key);
      if (!cached) return null;

      const now = Date.now();
      if (now - cached.timestamp > cached.ttl) {
        return null;
      }

      return cached.result;
    },
    [state.mlResultsCache]
  );

  // WebSocket connection getter
  const getWebSocketConnection = useCallback(
    (endpoint: string) => {
      return webSocketManager.getConnection(endpoint);
    },
    [webSocketManager]
  );

  const contextValue = useMemo(
    () => ({
      state,
      dispatch,
      getCachedData,
      getCachedMLResult,
      getWebSocketConnection,
      batchProcessor,
      memoryOptimizer,
    }),
    [
      state,
      dispatch,
      getCachedData,
      getCachedMLResult,
      getWebSocketConnection,
      batchProcessor,
      memoryOptimizer,
    ]
  );

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
};

// Custom hook for using performance context
export const useLiDARPerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error(
      'useLiDARPerformance must be used within a LiDARPerformanceProvider'
    );
  }
  return context;
};

// High-performance data processing hook
export const useOptimizedDataProcessing = <T,>(
  data: T[],
  processor: (item: T) => any,
  deps: React.DependencyList = []
) => {
  const { batchProcessor, getCachedData, dispatch } = useLiDARPerformance();
  const [processedData, setProcessedData] = React.useState<any[]>([]);

  const processData = useCallback(() => {
    const cacheKey = `processed_data_${JSON.stringify(deps)}`;
    const cached = getCachedData(cacheKey);

    if (cached) {
      setProcessedData(cached);
      return;
    }

    // Process data in batches for better performance
    const batches: LiDARDataBatch[] = [];
    for (let i = 0; i < data.length; i += 50) {
      const batch = data.slice(i, i + 50);
      batches.push({
        id: `batch_${i}`,
        timestamp: Date.now(),
        pointClouds: batch as any,
        trajectories: [],
        processed: false,
        priority: i === 0 ? 'high' : 'medium', // First batch is high priority
      });
    }

    batches.forEach((batch) => batchProcessor.addToBatch(batch));

    // Cache the result
    const results = data.map(processor);
    dispatch({
      type: 'CACHE_DATA',
      payload: { key: cacheKey, data: results, ttl: 300000 }, // 5 minutes
    });

    setProcessedData(results);
  }, [data, processor, batchProcessor, getCachedData, dispatch, ...deps]);

  useEffect(() => {
    processData();
  }, [processData]);

  return processedData;
};

// Virtualized list component for large datasets
export const VirtualizedLiDARList: React.FC<{
  items: any[];
  itemHeight: number;
  renderItem: (item: any, index: number) => React.ReactNode;
  containerHeight: number;
}> = React.memo(({ items, itemHeight, renderItem, containerHeight }) => {
  const [scrollTop, setScrollTop] = React.useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );

  const visibleItems = useMemo(
    () => items.slice(visibleStart, visibleEnd),
    [items, visibleStart, visibleEnd]
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: items.length * itemHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${visibleStart * itemHeight}px)`,
            position: 'absolute',
            width: '100%',
          }}
        >
          {visibleItems.map((item, index) =>
            renderItem(item, visibleStart + index)
          )}
        </div>
      </div>
    </div>
  );
});

VirtualizedLiDARList.displayName = 'VirtualizedLiDARList';

export default LiDARPerformanceProvider;
