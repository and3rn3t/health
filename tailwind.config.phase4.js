/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],
  
  // PHASE 4: Ultra-aggressive purging - only used classes
  safelist: [
    // VitalSense brand classes (always keep)
    ...[
        "border-vitalsense-primary",
        "bg-vitalsense-primary",
        "text-vitalsense-primary-contrast",
        "text-vitalsense-text-primary",
        "text-vitalsense-text-muted",
        "vitalsense-ghost-button",
        "text-vitalsense-primary",
        "hover:bg-vitalsense-primary/90",
        "bg-vitalsense-primary/10",
        "bg-vitalsense-error",
        "focus:ring-vitalsense-primary/20",
        "focus:border-vitalsense-primary",
        "bg-vitalsense-success",
        "bg-vitalsense-warning",
        "bg-vitalsense-info/10",
        "border-vitalsense-info/20",
        "border-vitalsense-teal",
        "text-vitalsense-teal",
        "border-vitalsense-purple",
        "text-vitalsense-purple",
        "bg-vitalsense-primary/5",
        "border-l-vitalsense-primary",
        "hover:bg-vitalsense-primary-light",
        "bg-vitalsense-background-muted",
        "group-hover:text-vitalsense-primary",
        "group-hover:bg-vitalsense-primary",
        "group-hover:text-vitalsense-primary-contrast",
        "hover:text-vitalsense-primary",
        "text-vitalsense-error",
        "text-vitalsense-success",
        "hover:bg-vitalsense-primary",
        "bg-vitalsense-bg-light",
        "border-vitalsense-border",
        "bg-vitalsense-card-light",
        "bg-vitalsense-secondary",
        "bg-vitalsense-accent",
        "hover:bg-vitalsense-primary-hover",
        "hover:bg-vitalsense-surface-hover",
        "border-vitalsense-success",
        "bg-vitalsense-success-light",
        "text-vitalsense-success-dark",
        "bg-vitalsense-primary-light"
    ],
    
    // iOS design system classes (always keep)  
    ...[
        "ios-label-primary",
        "ios-label-secondary",
        "ios-26-surface",
        "ios-26-surface-elevated",
        "hover:ios-label-primary",
        "placeholder-ios-label-secondary",
        "ios-26-spinner",
        "ios-26-icon-adaptive",
        "bg-ios-system-red",
        "ios-26-badge",
        "ios-26-icon-critical",
        "bg-ios-system-background",
        "ios-26-surface-secondary",
        "ios-26-icon-container",
        "ios-26-surface-primary",
        "border-ios-separator",
        "ios-26-button-secondary",
        "ios-26-navigation",
        "ios-26-button-back",
        "ios-26-button-action"
    ], // Top 20 iOS classes
    
    // Critical utility classes (actually used)
    ...[
        "grid",
        "grid-cols-1",
        "h-2",
        "w-full",
        "flex",
        "items-center",
        "w-2",
        "justify-between",
        "h-3",
        "w-3",
        "h-8",
        "w-8",
        "min-h-screen",
        "h-screen",
        "flex-col",
        "h-10",
        "w-10",
        "justify-center",
        "h-6",
        "w-6",
        "h-5",
        "w-5",
        "flex-1",
        "h-12",
        "w-12",
        "h-full",
        "flex-shrink-0",
        "h-4",
        "w-4",
        "max-w-2xl"
    ], // Top 30 layout classes
    ...[
        "text-3xl",
        "text-gray-900",
        "bg-white",
        "text-green-600",
        "text-sm",
        "text-gray-500",
        "bg-gray-200",
        "bg-green-600",
        "text-red-500",
        "text-blue-600",
        "text-xl",
        "border-green-200",
        "bg-green-50",
        "bg-green-500",
        "text-green-800",
        "text-green-700",
        "border-blue-200",
        "bg-blue-50",
        "bg-blue-500",
        "text-blue-800"
    ], // Top 20 color classes
    ...[
        "mb-6",
        "mb-8",
        "p-6",
        "mb-2",
        "mt-2",
        "mb-4",
        "p-4",
        "mt-1",
        "py-2",
        "mt-4",
        "p-3",
        "mb-1",
        "mr-3",
        "px-3",
        "py-1",
        "p-0",
        "my-4",
        "mx-auto",
        "my-3",
        "p-8",
        "mt-8",
        "mb-3",
        "ml-3",
        "px-4",
        "py-3"
    ], // Top 25 spacing classes
    ...[
        "font-bold",
        "font-semibold",
        "font-medium",
        "tracking-wider",
        "leading-tight",
        "font-mono",
        "leading-none",
        "whitespace-pre-wrap",
        "tracking-wide",
        "leading-relaxed",
        "tracking-tight",
        "font-normal",
        "font-semibent",
        "whitespace-nowrap"
    ], // Top 15 typography classes
  ],
  
  // Ultra-minimal core plugins (Phase 4 reduction)
  corePlugins: {
    preflight: false, // No CSS reset
    container: false,
    accessibility: false,
    backgroundOpacity: false,
    borderOpacity: false,
    textOpacity: false,
    placeholderOpacity: false,
    divideOpacity: false,
    ringOpacity: false,
    // Disable unused utilities to force safelist-only generation
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
  },
  
  theme: {
    // Only essential breakpoints
    screens: {
      'sm': '640px',
      'lg': '1024px'
    },
    
    // Minimal color palette - only VitalSense + essentials
    colors: {
      transparent: 'transparent',
      current: 'currentColor', 
      white: '#ffffff',
      black: '#000000',
      
      // VitalSense brand (essential)
      'vitalsense-primary': '#007AFF',
      'vitalsense-secondary': '#34C759',
      'vitalsense-success': '#30D158', 
      'vitalsense-warning': '#FF9500',
      'vitalsense-error': '#FF3B30',
      'vitalsense-info': '#5AC8FA',
      
      // Minimal grays (only used shades)
      gray: {
        100: '#F3F4F6',
        300: '#D1D5DB', 
        500: '#6B7280',
        700: '#374151',
        900: '#111827'
      }
    },
    
    // Minimal spacing (only used values)
    spacing: {
      0: '0px',
      1: '0.25rem',
      2: '0.5rem',
      3: '0.75rem', 
      4: '1rem',
      6: '1.5rem',
      8: '2rem',
      12: '3rem',
      16: '4rem',
      20: '5rem'
    },
    
    extend: {
      fontFamily: {
        sans: ['SF Pro Display', '-apple-system', 'system-ui', 'sans-serif']
      }
    }
  },
  
  plugins: []
};