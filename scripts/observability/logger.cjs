/**
 * Structured logging utility for the geospatial health platform
 * CommonJS version for use in Node.js scripts
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
};

const DEFAULT_LEVEL = process.env.LOG_LEVEL || 'INFO';
const CURRENT_LEVEL = LOG_LEVELS[DEFAULT_LEVEL] ?? LOG_LEVELS.INFO;

function formatTimestamp() {
  return new Date().toISOString();
}

function formatLog(level, message, context = {}) {
  const log = {
    timestamp: formatTimestamp(),
    level,
    message,
    ...context,
  };

  if (process.env.NODE_ENV) {
    log.env = process.env.NODE_ENV;
  }

  log.service = 'catalog-api';

  return JSON.stringify(log);
}

function shouldLog(level) {
  return LOG_LEVELS[level] >= CURRENT_LEVEL;
}

const logger = {
  debug(message, context = {}) {
    if (shouldLog('DEBUG')) {
      console.log(formatLog('DEBUG', message, context));
    }
  },

  info(message, context = {}) {
    if (shouldLog('INFO')) {
      console.log(formatLog('INFO', message, context));
    }
  },

  warn(message, context = {}) {
    if (shouldLog('WARN')) {
      console.warn(formatLog('WARN', message, context));
    }
  },

  error(message, error = null, context = {}) {
    if (shouldLog('ERROR')) {
      const errorContext = {
        ...context,
      };

      if (error) {
        errorContext.error = {
          message: error.message,
          stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
          name: error.name,
        };
      }

      console.error(formatLog('ERROR', message, errorContext));
    }
  },

  request(req, res, duration, context = {}) {
    const logContext = {
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('user-agent'),
      ...context,
    };

    if (res.statusCode >= 500) {
      this.error('Request failed', null, logContext);
    } else if (res.statusCode >= 400) {
      this.warn('Request error', logContext);
    } else {
      this.info('Request completed', logContext);
    }
  },
};

module.exports = logger;
