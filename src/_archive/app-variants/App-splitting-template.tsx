// 🚀 App.tsx Code Splitting Template
// Split 87KB monolithic component into lazy-loaded chunks

import React, { Suspense, lazy } from 'react';
import { ErrorBoundary } from '@/components/error/ErrorBoundary';
import { VitalSenseLoadingSpinner } from '@/components/ui/vitalsense-components';

// ✅ Lazy load major sections (~20KB each instead of 87KB total)
const HealthDashboard = lazy(() => import('@/components/sections/HealthDashboard'));
const GameCenter = lazy(() => import('@/components/sections/GameCenter'));
const SettingsPanel = lazy(() => import('@/components/sections/SettingsPanel'));
const MLAnalytics = lazy(() => import('@/components/sections/MLAnalytics'));

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');

  return (
    <div className="vitalsense-app">
      <ErrorBoundary>
        <Suspense fallback={<VitalSenseLoadingSpinner />}>
          {activeSection === 'dashboard' && <HealthDashboard />}
          {activeSection === 'games' && <GameCenter />}
          {activeSection === 'settings' && <SettingsPanel />}
          {activeSection === 'analytics' && <MLAnalytics />}
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}

// 📊 Expected Bundle Impact:
// • Initial bundle: App.tsx core + first route (~20KB)
// • Additional routes: Load on-demand (~20KB each)
// • Total savings: 87KB → 20KB initial = 67KB saved per route
