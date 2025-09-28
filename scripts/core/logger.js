#!/usr/bin/env node

/**
 * Shared logging utilities for Node.js scripts
 * Provides consistent logging across the VitalSense project
 */

// ANSI color codes for cross-platform compatibility
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

function getTimestamp() {
  return new Date().toISOString().slice(11, 19); // HH:MM:SS format
}

function formatMessage(level, message) {
  const timestamp = getTimestamp();
  return `[${timestamp}] ${level} ${message}`;
}

export function writeTaskStart(taskName) {
  const message = formatMessage(colors.blue + '🚀 START' + colors.reset, `${taskName}`);
  console.log(message);
}

export function writeTaskComplete(taskName, duration = null) {
  const durationStr = duration ? ` (${duration}ms)` : '';
  const message = formatMessage(colors.green + '✅ COMPLETE' + colors.reset, `${taskName}${durationStr}`);
  console.log(message);
}

export function writeTaskError(taskName, error = null) {
  const errorStr = error ? ` - ${error}` : '';
  const message = formatMessage(colors.red + '❌ ERROR' + colors.reset, `${taskName}${errorStr}`);
  console.error(message);
}

export function writeInfo(message) {
  const formatted = formatMessage(colors.cyan + 'ℹ️  INFO' + colors.reset, message);
  console.log(formatted);
}

export function writeSuccess(message) {
  const formatted = formatMessage(colors.green + '✅ SUCCESS' + colors.reset, message);
  console.log(formatted);
}

export function writeWarning(message) {
  const formatted = formatMessage(colors.yellow + '⚠️  WARNING' + colors.reset, message);
  console.log(formatted);
}

export function writeError(message) {
  const formatted = formatMessage(colors.red + '❌ ERROR' + colors.reset, message);
  console.error(formatted);
}

export function exitWithError(message, code = 1) {
  writeError(message);
  process.exit(code);
}

export function exitWithSuccess(message) {
  writeSuccess(message);
  process.exit(0);
}

// HTTP request utility
export async function makeHttpRequest(url, options = {}) {
  const {
    method = 'GET',
    timeout = 5000,
    headers = {},
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      method,
      headers,
      signal: controller.signal,
      ...options
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => response.text());
      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        data: data,
        headers: Object.fromEntries(response.headers.entries()),
      };
    } else {
      return {
        success: false,
        status: response.status,
        statusText: response.statusText,
        error: `HTTP ${response.status} ${response.statusText}`,
        headers: Object.fromEntries(response.headers.entries()),
      };
    }
  } catch (error) {
    clearTimeout(timeoutId);
    return {
      success: false,
      error: error.message,
      status: null,
      statusText: null,
    };
  }
}

// Environment info utility
export function getEnvironmentInfo() {
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cwd: process.cwd(),
    timestamp: new Date().toISOString(),
  };
}

// Fallback logger when chalk is not available
export const logger = {
  start: writeTaskStart,
  complete: writeTaskComplete,
  error: writeTaskError,
  info: writeInfo,
  success: writeSuccess,
  warning: writeWarning,
  request: makeHttpRequest,
};

export default logger;
