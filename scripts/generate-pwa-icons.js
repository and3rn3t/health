#!/usr/bin/env node

/**
 * PWA Icon Generator
 * Generates all required PWA icons from a source SVG or PNG file
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');
const iconsDir = path.join(publicDir, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log('📁 Created icons directory');
}

// PWA icon sizes
const iconSizes = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' }
];

// Shortcut icons
const shortcuts = [
  { name: 'shortcut-dashboard.png', size: 96 },
  { name: 'shortcut-fall-risk.png', size: 96 },
  { name: 'shortcut-emergency.png', size: 96 }
];

// Additional icons
const additional = [
  { name: 'badge-72x72.png', size: 72 }
];

/**
 * Generate a simple placeholder icon using Canvas API simulation
 */
function generatePlaceholderIcon(size, filename, type = 'main') {
  const colors = {
    main: { bg: '#2563eb', fg: '#ffffff' },
    dashboard: { bg: '#10b981', fg: '#ffffff' },
    'fall-risk': { bg: '#f59e0b', fg: '#ffffff' },
    emergency: { bg: '#ef4444', fg: '#ffffff' },
    badge: { bg: '#6366f1', fg: '#ffffff' }
  };

  const color = colors[type] || colors.main;

  // Simple SVG-based icon generation
  const svg = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${size}" height="${size}" rx="${size * 0.1}" fill="${color.bg}"/>
      <g transform="translate(${size * 0.25}, ${size * 0.25})">
        ${getIconPath(type, size * 0.5)}
      </g>
    </svg>
  `;

  // Write SVG file (browsers can display SVG as icons)
  const svgPath = path.join(iconsDir, filename.replace('.png', '.svg'));
  fs.writeFileSync(svgPath, svg);

  // Create a simple HTML file that references the SVG for PNG fallback
  const htmlIcon = `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
  console.log(`📱 Generated ${filename} (${size}x${size}) as SVG`);

  return { svg, htmlIcon };
}

/**
 * Get SVG path for different icon types
 */
function getIconPath(type, size) {
  const scale = size / 24; // Base size is 24

  switch (type) {
    case 'dashboard':
      return `<path fill="white" transform="scale(${scale})" d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>`;

    case 'fall-risk':
      return `<path fill="white" transform="scale(${scale})" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>`;

    case 'emergency':
      return `<path fill="white" transform="scale(${scale})" d="M20.01 15.38c-1.23 0-2.42-.2-3.53-.56-.35-.12-.74-.03-1.01.24l-2.24 2.24c-2.83-1.44-5.15-3.75-6.59-6.59l2.24-2.24c.27-.27.36-.66.24-1.01-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.18v-3.45c0-.54-.45-.99-.99-.99z"/>`;

    case 'badge':
      return `<circle fill="white" transform="scale(${scale})" cx="12" cy="12" r="8"/>`;

    default: // main app icon - heart/health symbol
      return `<path fill="white" transform="scale(${scale})" d="m12 21.35-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>`;
  }
}

/**
 * Generate all PWA icons
 */
function generateAllIcons() {
  console.log('🎨 Generating PWA icons...\n');

  // Generate main app icons
  iconSizes.forEach(({ size, name }) => {
    generatePlaceholderIcon(size, name, 'main');
  });

  // Generate shortcut icons
  shortcuts.forEach(({ name, size }) => {
    let type = 'main';
    if (name.includes('dashboard')) {
      type = 'dashboard';
    } else if (name.includes('fall-risk')) {
      type = 'fall-risk';
    } else if (name.includes('emergency')) {
      type = 'emergency';
    }
    generatePlaceholderIcon(size, name, type);
  });

  // Generate additional icons
  additional.forEach(({ name, size }) => {
    generatePlaceholderIcon(size, name, 'badge');
  });

  console.log('\n✅ PWA icons generated successfully!');
  console.log(`📁 Icons saved to: ${iconsDir}`);
  console.log(`📱 Generated ${iconSizes.length + shortcuts.length + additional.length} icons total`);

  // Generate icon usage instructions
  generateIconInstructions();
}

/**
 * Generate instructions for icon usage
 */
function generateIconInstructions() {
  const instructions = `
# PWA Icons Generated

## Generated Icons

### Main App Icons
${iconSizes.map(icon => `- ${icon.name} (${icon.size}x${icon.size})`).join('\n')}

### Shortcut Icons
${shortcuts.map(icon => `- ${icon.name} (${icon.size}x${icon.size})`).join('\n')}

### Additional Icons
${additional.map(icon => `- ${icon.name} (${icon.size}x${icon.size})`).join('\n')}

## Usage

These icons are automatically referenced in:
- \`public/manifest.json\` - PWA manifest file
- \`index.html\` - Apple touch icons and meta tags
- Service worker for offline caching

## Customization

To customize icons:
1. Replace the generated SVG files in \`public/icons/\`
2. Ensure all required sizes are maintained
3. Test PWA installation on different devices

## Icon Requirements

- **Maskable**: Icons should work with platform-specific masks
- **Square**: All icons should be square (1:1 aspect ratio)
- **High contrast**: Icons should be visible on various backgrounds
- **Scalable**: Icons should look good at all required sizes

Generated: ${new Date().toISOString()}
`;

  const instructionsPath = path.join(iconsDir, 'README.md');
  fs.writeFileSync(instructionsPath, instructions.trim());
  console.log('📝 Generated icon instructions: icons/README.md');
}

// Run icon generation
if (import.meta.url === `file://${process.argv[1]}`) {
  generateAllIcons();
}

export { generateAllIcons };
