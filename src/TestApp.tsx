const TestApp = () => {
  console.log('🎯 TestApp: Component rendering...');

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <div className="rounded-lg bg-white p-8 shadow-lg">
        <h1 className="mb-4 text-3xl font-bold text-blue-600">
          🎉 VitalSense Test App Working!
        </h1>
        <p className="text-gray-600">
          If you can see this, React is working correctly.
        </p>
        <div className="mt-4 rounded bg-green-100 p-4">
          <p className="text-green-800">✅ React is rendering</p>
          <p className="text-green-800">✅ CSS is loading</p>
          <p className="text-green-800">✅ ESBuild is working</p>
        </div>
      </div>
    </div>
  );
};

export default TestApp;
