/**
 * Lazy-loaded heavy libraries to reduce initial bundle size
 * These are dynamically imported only when needed to reduce initial bundle size
 */

// Three.js is ~200KB+ - only load for 3D visualizations
// Note: Dynamic imports return Promise<any> since types may not be available at compile time
export const lazyLoadThree = async (): Promise<typeof import('three')> => {
  return import('three');
};

// TensorFlow.js is ~500KB+ - only load for ML features
export const lazyLoadTensorFlow = async (): Promise<typeof import('@tensorflow/tfjs')> => {
  return import('@tensorflow/tfjs');
};

// D3 is ~150KB+ - only load for advanced visualizations
export const lazyLoadD3 = async (): Promise<typeof import('d3')> => {
  return import('d3');
};

// Framer Motion is ~100KB+ - only load for advanced animations
export const lazyLoadFramerMotion = async (): Promise<typeof import('framer-motion')> => {
  return import('framer-motion');
};
