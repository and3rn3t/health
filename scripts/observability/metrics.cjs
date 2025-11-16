/**
 * Metrics collection for the geospatial health platform
 * CommonJS version for use in Node.js scripts
 */

class MetricsCollector {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        byMethod: {},
        byPath: {},
        byStatus: {},
      },
      responseTimes: {
        p50: [],
        p95: [],
        p99: [],
        all: [],
      },
      errors: {
        total: 0,
        byType: {},
        byPath: {},
      },
      analysis: {
        ndvi: { count: 0, totalTime: 0, errors: 0 },
        zonal: { count: 0, totalTime: 0, errors: 0 },
        terrain: { count: 0, totalTime: 0, errors: 0 },
        lidar: { count: 0, totalTime: 0, errors: 0 },
        risk: { count: 0, totalTime: 0, errors: 0 },
        change: { count: 0, totalTime: 0, errors: 0 },
      },
      cache: {
        hits: 0,
        misses: 0,
        evictions: 0,
      },
      uptime: {
        startTime: Date.now(),
      },
    };

    this.maxResponseTimeSamples = 1000;
  }

  recordRequest(method, path, statusCode, duration) {
    this.metrics.requests.total++;
    this.metrics.requests.byMethod[method] = (this.metrics.requests.byMethod[method] || 0) + 1;
    this.metrics.requests.byPath[path] = (this.metrics.requests.byPath[path] || 0) + 1;
    this.metrics.requests.byStatus[statusCode] = (this.metrics.requests.byStatus[statusCode] || 0) + 1;

    if (this.metrics.responseTimes.all.length >= this.maxResponseTimeSamples) {
      this.metrics.responseTimes.all.shift();
    }
    this.metrics.responseTimes.all.push(duration);

    if (this.metrics.responseTimes.all.length > 0) {
      const sorted = [...this.metrics.responseTimes.all].sort((a, b) => a - b);
      this.metrics.responseTimes.p50 = sorted[Math.floor(sorted.length * 0.5)] || 0;
      this.metrics.responseTimes.p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
      this.metrics.responseTimes.p99 = sorted[Math.floor(sorted.length * 0.99)] || 0;
    }

    if (statusCode >= 400) {
      this.metrics.errors.total++;
      this.metrics.errors.byPath[path] = (this.metrics.errors.byPath[path] || 0) + 1;
    }
  }

  recordError(errorType, path) {
    this.metrics.errors.total++;
    this.metrics.errors.byType[errorType] = (this.metrics.errors.byType[errorType] || 0) + 1;
    if (path) {
      this.metrics.errors.byPath[path] = (this.metrics.errors.byPath[path] || 0) + 1;
    }
  }

  recordAnalysis(type, duration, success = true) {
    if (!this.metrics.analysis[type]) {
      this.metrics.analysis[type] = { count: 0, totalTime: 0, errors: 0 };
    }

    const metric = this.metrics.analysis[type];
    metric.count++;
    metric.totalTime += duration;

    if (!success) {
      metric.errors++;
    }
  }

  recordCacheHit() {
    this.metrics.cache.hits++;
  }

  recordCacheMiss() {
    this.metrics.cache.misses++;
  }

  recordCacheEviction() {
    this.metrics.cache.evictions++;
  }

  getMetrics() {
    const uptime = Date.now() - this.metrics.uptime.startTime;
    const cacheHitRate =
      this.metrics.cache.hits + this.metrics.cache.misses > 0
        ? this.metrics.cache.hits / (this.metrics.cache.hits + this.metrics.cache.misses)
        : 0;

    const analysisAverages = {};
    for (const [type, data] of Object.entries(this.metrics.analysis)) {
      analysisAverages[type] = {
        count: data.count,
        avgTime: data.count > 0 ? Math.round(data.totalTime / data.count) : 0,
        errorRate: data.count > 0 ? data.errors / data.count : 0,
      };
    }

    return {
      ...this.metrics,
      uptime: {
        ...this.metrics.uptime,
        milliseconds: uptime,
        seconds: Math.floor(uptime / 1000),
        minutes: Math.floor(uptime / 60000),
        hours: Math.floor(uptime / 3600000),
      },
      cache: {
        ...this.metrics.cache,
        hitRate: Math.round(cacheHitRate * 10000) / 100,
      },
      analysis: analysisAverages,
      responseTime: {
        p50: this.metrics.responseTimes.p50,
        p95: this.metrics.responseTimes.p95,
        p99: this.metrics.responseTimes.p99,
        avg: this.metrics.responseTimes.all.length > 0
          ? Math.round(this.metrics.responseTimes.all.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.all.length)
          : 0,
      },
    };
  }

  reset() {
    this.metrics.requests.total = 0;
    this.metrics.requests.byMethod = {};
    this.metrics.requests.byPath = {};
    this.metrics.requests.byStatus = {};
    this.metrics.responseTimes.all = [];
    this.metrics.errors.total = 0;
    this.metrics.errors.byType = {};
    this.metrics.errors.byPath = {};
    this.metrics.uptime.startTime = Date.now();
  }
}

const metrics = new MetricsCollector();

module.exports = metrics;

