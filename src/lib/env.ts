/**
 * Environment detection utilities for ESBuild compatibility
 * Since ESBuild doesn't provide import.meta.env like Vite does,
 * we need to provide safe fallbacks for development mode detection.
 */

// Safe environment variable getter
export const getEnvVar = (key: string, fallback: string = ''): string => {
  try {
    // Check if process.env exists (Node.js environment)
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] || fallback;
    }
    // For ESBuild in browser, return fallback (development assumed)
    return fallback;
  } catch {
    return fallback;
  }
};

// Environment detection helpers
export const isDev = (): boolean => {
  try {
    // Check if we're in development mode
    // In ESBuild, we assume development unless explicitly set otherwise
    return getEnvVar('NODE_ENV', 'development') === 'development';
  } catch {
    return true; // Default to development for safety
  }
};

export const isProd = (): boolean => {
  return !isDev();
};

export const getEnvironment = (): 'development' | 'production' | 'test' => {
  const env = getEnvVar('NODE_ENV', 'development');
  switch (env) {
    case 'production':
      return 'production';
    case 'test':
      return 'test';
    default:
      return 'development';
  }
};
