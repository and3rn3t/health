// Polyfill import.meta.env for environments where Vite replacement doesn't run
// Ensures code that checks import.meta.env.DEV doesn't crash in browsers/workers

// Note: import.meta is extensible at runtime. We only define env if missing.
type ImportMetaWithEnv = { env?: Record<string, unknown> };

try {
  const meta = import.meta as unknown as ImportMetaWithEnv;
  if (meta && typeof meta === 'object') {
    if (!('env' in meta) || meta.env == null) {
      meta.env = {};
    }
    if (meta.env && typeof meta.env === 'object') {
      const env = meta.env as Record<string, unknown>;
      // Heuristic: treat local hosts/ports as development
      let shouldDev = false;
      if (typeof window !== 'undefined' && window.location) {
        const host = window.location.hostname;
        const port = window.location.port;
        if (host === 'localhost' || host === '127.0.0.1') shouldDev = true;
        if (port === '5173' || port === '8789' || port === '8788')
          shouldDev = true;
      }

      if (typeof env.DEV !== 'boolean') env.DEV = shouldDev;
      if (typeof env.PROD !== 'boolean') env.PROD = !shouldDev;
      if (typeof env.MODE !== 'string')
        env.MODE = shouldDev ? 'development' : 'production';
    }
  }
} catch {
  // Silently ignore if environment forbids touching import.meta
}
