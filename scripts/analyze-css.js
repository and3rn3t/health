import { readFileSync } from 'fs';

const css = readFileSync('dist/main-original.css', 'utf8');
const lines = css.split('\n');

console.log('📊 CSS Analysis:');
console.log('Total lines:', lines.length);
console.log('Total size:', (css.length / 1024).toFixed(1) + 'KB');

// Count different patterns
const patterns = {
  'data-\\[': 0,
  '\\.rounded-': 0,
  '\\.bg-': 0,
  '\\.text-': 0,
  'ios-': 0,
  'vitalsense-': 0
};

lines.forEach(line => {
  for (const pattern of Object.keys(patterns)) {
    if (line.includes(pattern.replace('\\\\', ''))) {
      patterns[pattern]++;
    }
  }
});

console.log('\nPattern counts:');
for (const [pattern, count] of Object.entries(patterns)) {
  console.log('  ' + pattern + ': ' + count + ' lines');
}

// Find the biggest contributors
const sizeByPattern = {};
lines.forEach(line => {
  if (line.includes('data-[')) {
    sizeByPattern['data-attributes'] = (sizeByPattern['data-attributes'] || 0) + line.length;
  }
  if (line.includes('.rounded-')) {
    sizeByPattern['rounded'] = (sizeByPattern['rounded'] || 0) + line.length;
  }
  if (line.includes('vitalsense')) {
    sizeByPattern['vitalsense'] = (sizeByPattern['vitalsense'] || 0) + line.length;
  }
});

console.log('\nSize by pattern:');
for (const [pattern, size] of Object.entries(sizeByPattern)) {
  console.log('  ' + pattern + ': ' + (size / 1024).toFixed(1) + 'KB');
}

console.log('\nSample long lines:');
lines.filter(l => l.length > 100).slice(0, 3).forEach(line => {
  console.log('  ' + line.substring(0, 80) + '...');
});
