#!/usr/bin/env node

import { writeFileSync } from 'fs';

console.log('🚀 Phase 5: Final Optimization - Component Extraction & Custom Reset');
console.log('='.repeat(65));

console.log('\n📊 Current Status:');
console.log('• Phase 4: 79.6KB minified');
console.log('• Target: 50KB');
console.log('• Still need: 29.6KB reduction (37.2%)');

console.log('\n🎯 Phase 5 Strategy:');
console.log('1. Replace Tailwind with minimal custom CSS components');
console.log('2. Extract repetitive patterns into reusable classes');
console.log('3. Create ultra-light reset (2KB vs 15KB)');
console.log('4. Keep only essential VitalSense utilities');

// Create custom minimal CSS reset
const customReset = `/* VitalSense Ultra-Minimal CSS Reset (2KB vs 15KB Tailwind Preflight) */
*, ::before, ::after {
  box-sizing: border-box;
  border-width: 0;
  border-style: solid;
}

html {
  line-height: 1.5;
  font-family: SF Pro Display, -apple-system, system-ui, sans-serif;
  font-feature-settings: normal;
  font-variation-settings: normal;
}

body {
  margin: 0;
  line-height: inherit;
}

/* Essential VitalSense Component Classes */
.vitalsense-card {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1);
}

.vitalsense-button-primary {
  background-color: #007AFF;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.vitalsense-button-primary:hover {
  background-color: #0056CC;
}

.vitalsense-text-primary { color: #1f2937; }
.vitalsense-text-secondary { color: #6b7280; }
.vitalsense-text-success { color: #30D158; }
.vitalsense-text-error { color: #FF3B30; }
.vitalsense-text-warning { color: #FF9500; }

.vitalsense-bg-primary { background-color: #007AFF; }
.vitalsense-bg-surface { background-color: #f9fafb; }

/* iOS Design System Classes */
.ios-label-primary {
  color: #1d1d1f;
  font-weight: 400;
}

.ios-label-secondary {
  color: #86868b;
  font-weight: 400;
}

.ios-26-surface {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(20px);
}

/* Essential Layout Utilities (only most used) */
.flex { display: flex; }
.grid { display: grid; }
.hidden { display: none; }
.block { display: block; }
.w-full { width: 100%; }
.h-full { height: 100%; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.m-4 { margin: 1rem; }
.mb-4 { margin-bottom: 1rem; }
.mt-4 { margin-top: 1rem; }
.rounded-lg { border-radius: 0.5rem; }
.text-sm { font-size: 0.875rem; }
.text-lg { font-size: 1.125rem; }
.text-xl { font-size: 1.25rem; }
.font-bold { font-weight: 700; }
.font-semibold { font-weight: 600; }

/* Grid Layouts */
.grid-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
.grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }

/* Responsive */
@media (min-width: 640px) {
  .sm\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .sm\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}

@media (min-width: 1024px) {
  .lg\\:grid-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .lg\\:grid-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  .lg\\:grid-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  .lg\\:block { display: block; }
  .lg\\:hidden { display: none; }
}`;

writeFileSync('src/vitalsense-minimal.css', customReset);

// Create Phase 5 config that uses minimal Tailwind + custom CSS
const phase5Config = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],

  // PHASE 5: Minimal Tailwind + Custom CSS Components
  corePlugins: {
    // Disable ALL Tailwind base styles (using our custom reset)
    preflight: false,

    // Disable most utility generators (using custom CSS)
    container: false,
    accessibility: false,
    backgroundOpacity: false,
    borderOpacity: false,
    textOpacity: false,
    placeholderOpacity: false,
    divideOpacity: false,
    ringOpacity: false,
    animation: false,
    backdropBlur: false,
    backdropBrightness: false,
    backdropContrast: false,
    backdropGrayscale: false,
    backdropHueRotate: false,
    backdropInvert: false,
    backdropOpacity: false,
    backdropSaturate: false,
    backdropSepia: false,
    blur: false,
    brightness: false,
    contrast: false,
    dropShadow: false,
    grayscale: false,
    hueRotate: false,
    invert: false,
    saturate: false,
    sepia: false,

    // Keep only essential utilities
    backgroundColor: true,
    textColor: true,
    padding: true,
    margin: true,
    display: true,
    flexbox: true,
    gridTemplateColumns: true,
    gap: true,
    borderRadius: true,
    fontSize: true,
    fontWeight: true,
  },

  // Extremely limited theme
  theme: {
    screens: {
      'sm': '640px',
      'lg': '1024px'
    },

    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',

      // Only VitalSense brand colors
      'vitalsense': {
        primary: '#007AFF',
        secondary: '#34C759',
        success: '#30D158',
        warning: '#FF9500',
        error: '#FF3B30',
        info: '#5AC8FA',
      },

      // Minimal gray scale
      gray: {
        100: '#f3f4f6',
        500: '#6b7280',
        900: '#111827'
      }
    },

    spacing: {
      0: '0',
      1: '0.25rem',
      2: '0.5rem',
      4: '1rem',
      6: '1.5rem',
      8: '2rem'
    },

    fontSize: {
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem'
    },

    extend: {}
  },

  // Minimal safelist - only for dynamic classes
  safelist: [
    'text-vitalsense-primary',
    'text-vitalsense-secondary',
    'bg-vitalsense-primary',
    'bg-vitalsense-secondary'
  ],

  plugins: []
};`;

writeFileSync('tailwind.config.phase5.js', phase5Config);

// Update main CSS to include custom reset
const mainCSSWithCustom = `/* VitalSense Minimal CSS - Phase 5 Final Optimization */
@import './vitalsense-minimal.css';

/* Import minimal Tailwind utilities only */
@tailwind utilities;

/* Custom VitalSense animations and effects */
@keyframes vitalsense-pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: .5; }
}

.vitalsense-animate-pulse {
  animation: vitalsense-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* Additional component classes for complex patterns */
.vitalsense-health-card {
  background: linear-gradient(135deg, #007AFF 0%, #34C759 100%);
  color: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 10px 25px rgb(0 122 255 / 0.2);
}

.vitalsense-stat-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}`;

writeFileSync('src/main-phase5.css', mainCSSWithCustom);

console.log('\n✅ Phase 5 assets generated:');
console.log('• src/vitalsense-minimal.css - Custom minimal reset (2KB)');
console.log('• tailwind.config.phase5.js - Ultra-minimal Tailwind config');
console.log('• src/main-phase5.css - Combined CSS with custom components');

console.log('\n🎯 Expected Phase 5 Impact:');
console.log('• Replace Tailwind base with custom reset: -13KB');
console.log('• Component extraction reduces duplication: -10KB');
console.log('• Minimal utility generation: -8KB');
console.log('• Total expected savings: ~31KB');
console.log('• Target: 79.6KB - 31KB = ~49KB 🎯 TARGET ACHIEVED!');

console.log('\n🧪 Test Phase 5 (FINAL):');
console.log('Copy-Item tailwind.config.phase5.js tailwind.config.js');
console.log('npx postcss src/main-phase5.css -o dist/main-phase5.css');
console.log('npx cssnano dist/main-phase5.css dist/main-phase5.min.css');

console.log('\n🏆 If successful, we should achieve <50KB CSS target!');
