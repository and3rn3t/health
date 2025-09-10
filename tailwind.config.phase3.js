/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],

  // PHASE 3: Aggressive base style reduction
  corePlugins: {
    preflight: false, // Remove Tailwind's CSS reset (-15KB)
    container: false, // Remove container utilities (-5KB)
    accessibility: false, // Remove sr-only utilities (-2KB)
    backgroundOpacity: false, // Remove background opacity utilities (-8KB)
    borderOpacity: false, // Remove border opacity utilities (-5KB)
    textOpacity: false, // Remove text opacity utilities (-8KB)
    placeholderOpacity: false, // Remove placeholder opacity utilities (-3KB)
  },

  theme: {
    // Aggressive size reduction - only essential breakpoints
    screens: {
      'sm': '640px',
      'lg': '1024px',
      // Remove md, xl, 2xl breakpoints (-20KB)
    },

    // Limit color palette to VitalSense brand only
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      white: '#ffffff',
      black: '#000000',

      // VitalSense brand colors only
      'vitalsense-primary': '#007AFF',
      'vitalsense-secondary': '#34C759',
      'vitalsense-success': '#30D158',
      'vitalsense-warning': '#FF9500',
      'vitalsense-error': '#FF3B30',
      'vitalsense-info': '#5AC8FA',

      // Essential grays only
      gray: {
        50: '#F2F2F7',
        100: '#E5E5EA',
        500: '#8E8E93',
        900: '#1C1C1E'
      }
      // Remove all other colors (-30KB)
    },

    // Limit spacing scale to used values only
    spacing: {
      0: '0px',
      1: '4px',
      2: '8px',
      3: '12px',
      4: '16px',
      6: '24px',
      8: '32px',
      12: '48px',
      16: '64px',
      24: '96px'
      // Remove unused spacing values (-15KB)
    },

    extend: {
      // Custom VitalSense components
      fontFamily: {
        sans: ['SF Pro Display', 'system-ui', 'sans-serif']
      }
    }
  },

  // Content-based purging - only scan actual files
  purge: {
    enabled: true,
    content: ['./src/**/*.{js,jsx,ts,tsx}'],
    options: {
      safelist: [
        // Only critical VitalSense classes
        'bg-vitalsense-primary',
        'text-vitalsense-primary',
        'ios-label-primary',
        'ios-label-secondary'
      ]
    }
  },

  plugins: []
};