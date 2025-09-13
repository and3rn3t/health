// Minimal test to isolate JavaScript execution issue
console.log('🔍 JavaScript is executing!');

// Test 1: Basic DOM access
const rootElement = document.getElementById('root');
console.log('🔍 Root element found:', !!rootElement);

if (rootElement) {
  // Test 2: Basic DOM manipulation without React
  rootElement.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif; border: 2px solid green;">
      <h1>🚀 JavaScript Execution Test</h1>
      <p>✅ JavaScript is running successfully!</p>
      <div style="margin-top: 20px; padding: 15px; background: #f0f8ff; border-radius: 8px;">
        <h2>Priority 3: iOS 26 Advanced Navigation</h2>
        <p>✅ Ready for implementation</p>
        <ul style="margin-top: 10px;">
          <li>Enhanced Breadcrumb Navigation</li>
          <li>Floating Tab Bar (Mobile-First)</li>
          <li>Collapsible Sidebar Navigation</li>
          <li>Advanced Search Integration</li>
        </ul>
      </div>
    </div>
  `;
  console.log('✅ DOM manipulation successful');
}

// Test 3: Try to import and use React
try {
  import('react')
    .then((React) => {
      console.log('✅ React import successful', React);
      import('react-dom/client')
        .then((ReactDOM) => {
          console.log('✅ ReactDOM import successful', ReactDOM);

          if (rootElement) {
            const root = ReactDOM.createRoot(rootElement);
            root.render(
              React.createElement(
                'div',
                {
                  style: {
                    padding: '20px',
                    fontFamily: 'Arial',
                    border: '2px solid blue',
                  },
                },
                [
                  React.createElement(
                    'h1',
                    { key: 'title' },
                    '🚀 React Test Successful!'
                  ),
                  React.createElement(
                    'p',
                    { key: 'desc' },
                    '✅ React is mounting correctly!'
                  ),
                  React.createElement(
                    'div',
                    {
                      key: 'nav',
                      style: {
                        marginTop: '20px',
                        padding: '15px',
                        background: '#e8f5e8',
                        borderRadius: '8px',
                      },
                    },
                    [
                      React.createElement(
                        'h2',
                        { key: 'nav-title' },
                        'Priority 3: iOS 26 Advanced Navigation'
                      ),
                      React.createElement(
                        'p',
                        { key: 'nav-desc' },
                        '✅ All components implemented and ready!'
                      ),
                      React.createElement(
                        'ul',
                        { key: 'nav-list', style: { marginTop: '10px' } },
                        [
                          React.createElement(
                            'li',
                            { key: 'breadcrumb' },
                            'Enhanced Breadcrumb Navigation'
                          ),
                          React.createElement(
                            'li',
                            { key: 'tabbar' },
                            'Floating Tab Bar (Mobile-First)'
                          ),
                          React.createElement(
                            'li',
                            { key: 'sidebar' },
                            'Collapsible Sidebar Navigation'
                          ),
                          React.createElement(
                            'li',
                            { key: 'search' },
                            'Advanced Search Integration'
                          ),
                        ]
                      ),
                    ]
                  ),
                ]
              )
            );
            console.log('✅ React render successful');
          }
        })
        .catch((err) => {
          console.error('❌ ReactDOM import failed:', err);
        });
    })
    .catch((err) => {
      console.error('❌ React import failed:', err);
    });
} catch (err) {
  console.error('❌ React test failed:', err);
}
