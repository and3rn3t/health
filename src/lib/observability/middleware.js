/**
 * Express middleware for observability
 * Provides request logging, metrics collection, and error handling
 */

import { logger } from './logger.js';
import { metrics } from './metrics.js';

/**
 * Request logging and metrics middleware
 */
export function observabilityMiddleware(req, res, next) {
  const startTime = Date.now();
  const originalSend = res.send;

  // Override res.send to capture response
  res.send = function (body) {
    const duration = Date.now() - startTime;
    const path = req.route?.path || req.path;

    // Record metrics
    metrics.recordRequest(req.method, path, res.statusCode, duration);

    // Log request
    logger.request(req, res, duration, {
      contentLength: res.get('content-length'),
    });

    // Call original send
    return originalSend.call(this, body);
  };

  next();
}

/**
 * Error handling middleware
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err, req, res, _next) {
  const path = req.route?.path || req.path;
  const errorType = err.name || 'Error';
  const statusCode = err.statusCode || err.status || 500;

  // Record error metrics
  metrics.recordError(errorType, path);

  // Log error
  logger.error('Request error', err, {
    method: req.method,
    path,
    statusCode,
    body: req.body,
    query: req.query,
  });

  // Send error response
  res.status(statusCode).json({
    error: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
}

/**
 * 404 handler
 */
export function notFoundHandler(req, res) {
  const path = req.path;
  metrics.recordError('NotFound', path);

  logger.warn('Route not found', {
    method: req.method,
    path,
    ip: req.ip,
  });

  res.status(404).json({
    error: 'Not found',
    path: req.path,
  });
}

/**
 * Health check middleware - adds detailed health info
 */
export function healthCheckMiddleware(req, res, next) {
  if (req.path === '/health' || req.path === '/metrics') {
    // These endpoints don't need full observability
    return next();
  }
  return observabilityMiddleware(req, res, next);
}
