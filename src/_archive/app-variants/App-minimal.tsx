function App() {
  const activeTab = 'test';

  return (
    <div>
      {activeTab === 'test' && (
        <div>
          <h1>Test</h1>
          <p>Simple test</p>
        </div>
      )}
    </div>
  );
}

export default App;
