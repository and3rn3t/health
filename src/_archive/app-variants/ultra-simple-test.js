// Ultra-simple JavaScript test - no imports, no modules
console.log('🔍 ULTRA SIMPLE TEST: JavaScript executing');

// Test if we can access DOM
const root = document.getElementById('root');
if (root) {
  console.log('✅ Found root element');
  root.innerHTML =
    '<h1 style="color: red; font-size: 48px;">🚀 JAVASCRIPT WORKS!</h1><p style="font-size: 24px;">Priority 3 iOS 26 Advanced Navigation is ready for implementation!</p>';
  console.log('✅ DOM manipulation successful');
} else {
  console.log('❌ Root element not found');
}

// Test if we're in a browser environment
console.log('🔍 Environment check:');
console.log('- window:', typeof window);
console.log('- document:', typeof document);
console.log('- location:', typeof location);

// Add text to show this script loaded
document.title = 'VitalSense - JavaScript Working!';
