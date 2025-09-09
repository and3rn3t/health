import { createRoot } from 'react-dom/client';

import { Button } from '@/components/ui/button';

const SimpleApp = () => {
  return (
    <div className="min-h-screen bg-vitalsense-bg-light p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-6 text-4xl font-bold text-vitalsense-primary">
          🎯 VitalSense CSS Test - 50KB Working!
        </h1>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="border-vitalsense-border rounded-lg border bg-vitalsense-card-light p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold text-vitalsense-text-primary">
              CSS System Status
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-vitalsense-success"></div>
                <span className="text-vitalsense-text-primary">
                  Layout Utilities: Working
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-vitalsense-success"></div>
                <span className="text-vitalsense-text-primary">
                  Color System: Working
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-vitalsense-success"></div>
                <span className="text-vitalsense-text-primary">
                  Typography: Working
                </span>
              </div>
            </div>
          </div>

          <div className="border-vitalsense-border rounded-lg border bg-vitalsense-card-light p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold text-vitalsense-primary">
              VitalSense Colors
            </h2>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="h-6 w-6 rounded bg-vitalsense-primary"></div>
                <span className="text-vitalsense-text-muted">Primary</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-vitalsense-secondary h-6 w-6 rounded"></div>
                <span className="text-vitalsense-text-muted">Secondary</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-vitalsense-accent h-6 w-6 rounded"></div>
                <span className="text-vitalsense-text-muted">Accent</span>
              </div>
            </div>
          </div>

          <div className="border-vitalsense-border rounded-lg border bg-vitalsense-card-light p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold text-vitalsense-primary">
              Interactive Elements
            </h2>
            <div className="space-y-3">
              <Button variant="default" className="w-full">
                Primary Button
              </Button>
              <Button variant="secondary" className="w-full">
                Secondary Button
              </Button>
            </div>
          </div>
        </div>

        <div className="mt-8 rounded-lg border border-vitalsense-success bg-vitalsense-success-light p-6">
          <h2 className="mb-4 text-2xl font-bold text-vitalsense-success-dark">
            ✅ Success! Your 50KB CSS System is Working
          </h2>
          <p className="leading-relaxed text-vitalsense-text-primary">
            If you can see this page with beautiful colors, layout, and styling,
            it means our 50KB CSS reconstruction was successful! The React app
            is now rendering properly and all the utilities we manually created
            are working.
          </p>
        </div>
      </div>
    </div>
  );
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error(
    'Root element not found. Make sure you have a <div id="root"></div> in your HTML.'
  );
}

createRoot(rootElement).render(<SimpleApp />);
