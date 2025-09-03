#!/usr/bin/env node

console.log('Test script running');
console.log('Args:', process.argv);
console.log('Module URL:', import.meta.url);
console.log('Process argv[1]:', process.argv[1]);

// Test the condition
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Would run main()');
} else {
  console.log('Would NOT run main()');
}

console.log('Done');
