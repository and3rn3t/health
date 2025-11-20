/**
 * Lazy-loaded heavy libraries to reduce initial bundle size
 */

import { lazy } from 'react';

// Three.js is ~200KB+ - only load for 3D visualizations
export const lazyLoadThree = () => import('three');

// TensorFlow.js is ~500KB+ - only load for ML features
export const lazyLoadTensorFlow = () => import('@tensorflow/tfjs');

// D3 is ~150KB+ - only load for advanced visualizations
export const lazyLoadD3 = () => import('d3');

// Framer Motion is ~100KB+ - only load for advanced animations
export const lazyLoadFramerMotion = () => import('framer-motion');
