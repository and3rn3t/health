#!/usr/bin/env node

console.log('📊 CSS Bundle Size Impact Measurement Tool');
console.log('Starting script...');

import { execSync } from 'child_process';

console.log('Building original CSS...');
try {
  execSync('npx postcss src/main.css -o dist/main-original.css', { stdio: 'inherit' });
  console.log('Original CSS built successfully');
} catch (error) {
  console.error('Failed to build original CSS:', error.message);
}
