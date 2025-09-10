// Ultra-minimal test without any imports
const root = document.getElementById('root');
if (root) {
  root.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1>VitalSense - Direct DOM Test</h1>
      <p>JavaScript is executing!</p>
      <div style="margin-top: 20px; padding: 10px; border: 1px solid #ccc; border-radius: 5px;">
        <h2>iOS 26 Advanced Navigation</h2>
        <p>Priority 3: Premium navigation patterns</p>
        <div style="margin-top: 10px;">
          <h3>✅ Features Implemented:</h3>
          <ul>
            <li>Enhanced Breadcrumb Navigation</li>
            <li>Floating Tab Bar (Mobile-First)</li>
            <li>Collapsible Sidebar Navigation</li>
            <li>Advanced Search Integration</li>
          </ul>
        </div>
      </div>
      <div style="margin-top: 20px; padding: 10px; background-color: #f0f8ff; border: 1px solid #0066cc; border-radius: 5px;">
        <strong>Status:</strong> Direct DOM manipulation is working! The Priority 3 iOS 26 Advanced Navigation System is implemented.
      </div>
    </div>
  `;
} else {
  console.error('Root element not found!');
}
