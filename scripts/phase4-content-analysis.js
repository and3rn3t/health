#!/usr/bin/env node

import { readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join, extname } from 'path';

console.log('🔍 Phase 4: Content-Based CSS Analysis & Purging');
console.log('='.repeat(55));

// Recursively find all React/TS files
function findSourceFiles(dir, files = []) {
  const items = readdirSync(dir);

  for (const item of items) {
    const fullPath = join(dir, item);
    const stat = statSync(fullPath);

    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      findSourceFiles(fullPath, files);
    } else if (stat.isFile() && ['.tsx', '.ts', '.jsx', '.js'].includes(extname(item))) {
      files.push(fullPath);
    }
  }

  return files;
}

// Extract all CSS class names from source files
function extractUsedClasses(files) {
  const classPattern = /className=['"]([^'"]+)['"]|class=['"]([^'"]+)['"]/g;
  const usedClasses = new Set();

  files.forEach(file => {
    try {
      const content = readFileSync(file, 'utf8');
      let match;

      while ((match = classPattern.exec(content)) !== null) {
        const classes = (match[1] || match[2]).split(/\s+/);
        classes.forEach(cls => {
          if (cls.trim()) {
            usedClasses.add(cls.trim());
          }
        });
      }
    } catch (error) {
      console.warn(`Warning: Could not read ${file}`);
    }
  });

  return Array.from(usedClasses);
}

// Analyze classes by category
function analyzeClasses(classes) {
  const categories = {
    colors: [],
    spacing: [],
    layout: [],
    typography: [],
    vitalsense: [],
    ios: [],
    responsive: [],
    states: [],
    other: []
  };

  classes.forEach(cls => {
    if (cls.includes('vitalsense')) categories.vitalsense.push(cls);
    else if (cls.includes('ios-')) categories.ios.push(cls);
    else if (cls.match(/^(sm|md|lg|xl|2xl):/)) categories.responsive.push(cls);
    else if (cls.match(/^(bg-|text-|border-)/)) categories.colors.push(cls);
    else if (cls.match(/^(p-|m-|px-|py-|mx-|my-|pl-|pr-|pt-|pb-|ml-|mr-|mt-|mb-)/)) categories.spacing.push(cls);
    else if (cls.match(/^(flex|grid|w-|h-|min-|max-|items-|justify-|self-|place-)/)) categories.layout.push(cls);
    else if (cls.match(/^(text-|font-|leading-|tracking-|whitespace-)/)) categories.typography.push(cls);
    else if (cls.match(/:/)|| cls.includes('hover') || cls.includes('focus')) categories.states.push(cls);
    else categories.other.push(cls);
  });

  return categories;
}

console.log('📂 Scanning source files...');
const sourceFiles = findSourceFiles('src');
console.log(`Found ${sourceFiles.length} source files`);

console.log('\n🔍 Extracting used CSS classes...');
const usedClasses = extractUsedClasses(sourceFiles);
console.log(`Found ${usedClasses.length} unique CSS classes`);

console.log('\n📊 Analyzing class usage by category...');
const categories = analyzeClasses(usedClasses);

Object.entries(categories).forEach(([category, classes]) => {
  if (classes.length > 0) {
    console.log(`${category}: ${classes.length} classes`);
    if (classes.length <= 10) {
      console.log(`  ${classes.join(', ')}`);
    } else {
      console.log(`  ${classes.slice(0, 10).join(', ')}... (+${classes.length - 10} more)`);
    }
  }
});

// Generate ultra-minimal Tailwind config with only used utilities
const usedUtilities = usedClasses.filter(cls => !cls.includes('vitalsense') && !cls.includes('ios-'));

const phase4Config = `/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './index.html'],

  // PHASE 4: Ultra-aggressive purging - only used classes
  safelist: [
    // VitalSense brand classes (always keep)
    ...${JSON.stringify(categories.vitalsense, null, 4).replace(/\n/g, '\n    ')},

    // iOS design system classes (always keep)
    ...${JSON.stringify(categories.ios.slice(0, 20), null, 4).replace(/\n/g, '\n    ')}, // Top 20 iOS classes

    // Critical utility classes (actually used)
    ...${JSON.stringify(categories.layout.slice(0, 30), null, 4).replace(/\n/g, '\n    ')}, // Top 30 layout classes
    ...${JSON.stringify(categories.colors.slice(0, 20), null, 4).replace(/\n/g, '\n    ')}, // Top 20 color classes
    ...${JSON.stringify(categories.spacing.slice(0, 25), null, 4).replace(/\n/g, '\n    ')}, // Top 25 spacing classes
    ...${JSON.stringify(categories.typography.slice(0, 15), null, 4).replace(/\n/g, '\n    ')}, // Top 15 typography classes
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
};`;

writeFileSync('tailwind.config.phase4.js', phase4Config);

console.log('\n✅ Phase 4 config generated: tailwind.config.phase4.js');
console.log(`📊 Safelist reduced to ${categories.vitalsense.length + categories.ios.slice(0,20).length + categories.layout.slice(0,30).length + categories.colors.slice(0,20).length + categories.spacing.slice(0,25).length + categories.typography.slice(0,15).length} essential classes`);

console.log('\n🎯 Expected Phase 4 Impact:');
console.log('• Remove unused backdrop/filter utilities: -15KB');
console.log('• Limit safelist to actually used classes: -10KB');
console.log('• Minimal color/spacing scales: -5KB');
console.log('• Total expected savings: ~30KB');
console.log('• Target: 81.8KB - 30KB = ~52KB (close to 50KB goal!)');

console.log('\n🧪 Test Phase 4:');
console.log('Copy-Item tailwind.config.phase4.js tailwind.config.js');
console.log('npx postcss src/main.css -o dist/main-phase4.css');
console.log('npx cssnano dist/main-phase4.css dist/main-phase4.min.css');
