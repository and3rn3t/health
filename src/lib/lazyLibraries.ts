/**
 * Lazy-loaded heavy libraries to reduce initial bundle size
 * These are dynamically imported only when needed
 */

// Framer Motion is ~100KB+ - only load for advanced animations
export const lazyLoadFramerMotion = async (): Promise<typeof import('framer-motion')> => {
  return import('framer-motion');
};
