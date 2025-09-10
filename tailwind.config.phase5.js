/** @type {import('tailwindcss').Config} */
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
};