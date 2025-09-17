// Environment utilities for browser/runtime-safe checks

// Safely read a Vite env var without assuming import.meta.env exists
export const safeGetViteEnv = (key: string): string | undefined => {
  try {
    const meta: unknown = import.meta;
    if (meta && typeof meta === 'object' && 'env' in meta) {
      const env = (meta as { env?: Record<string, unknown> }).env;
      const val = env?.[key];
      return typeof val === 'string' && val.length > 0 ? val : undefined;
    }
  } catch {
    // ignore
  }
  return undefined;
};

export const isDev = (): boolean => {
  // 1) Try Vite flag when present
  try {
    const meta: unknown = import.meta;
    if (meta && typeof meta === 'object' && 'env' in meta) {
      const env = (meta as { env?: Record<string, unknown> }).env as
        | Record<string, unknown>
        | undefined;
      const dev = env?.DEV;
      if (typeof dev === 'boolean') return dev;
    }
  } catch {
    // ignore
  }

  // 2) Browser heuristics (localhost/127.0.0.1 and known dev ports)
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    const port = window.location.port;
    if (host === 'localhost' || host === '127.0.0.1') return true;
    if (port === '5173' || port === '8789' || port === '8788') return true;
  }

  // 3) Default to production
  return false;
};
