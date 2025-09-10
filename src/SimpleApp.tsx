import { Button } from '@/components/ui/button';
import { Activity, Heart, Search, Settings } from 'lucide-react';
import { useState } from 'react';

function SimpleApp() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto p-4">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">VitalSense</h1>
          <p className="text-gray-600">
            Apple Health Insights & Fall Risk Monitor
          </p>
        </header>

        <nav className="mb-8">
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'dashboard' ? 'default' : 'outline'}
              onClick={() => setActiveTab('dashboard')}
            >
              <Heart className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
            <Button
              variant={activeTab === 'ios26-navigation' ? 'default' : 'outline'}
              onClick={() => setActiveTab('ios26-navigation')}
            >
              <Settings className="mr-2 h-4 w-4" />
              iOS 26 Advanced Navigation
            </Button>
          </div>
        </nav>

        <main>
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">Health Dashboard</h2>
              <p>Welcome to VitalSense - your health insights dashboard.</p>
            </div>
          )}

          {activeTab === 'ios26-navigation' && (
            <div className="space-y-6 p-6">
              <div className="text-center">
                <h2 className="mb-2 text-3xl font-bold text-gray-900">
                  iOS 26 Advanced Navigation
                </h2>
                <p className="text-lg text-gray-600">
                  Priority 3: Premium navigation patterns with iOS 26 design
                  guidelines
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Enhanced Breadcrumb Navigation
                </h3>
                <div className="flex items-center space-x-2 rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm">
                  <span className="text-gray-600">Home</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">Health</span>
                  <span className="text-gray-400">/</span>
                  <span className="text-gray-600">Metrics</span>
                  <span className="text-gray-400">/</span>
                  <span className="font-medium text-gray-900">Heart Rate</span>
                </div>
                <p className="text-sm text-gray-600">
                  Enhanced with gesture support and overflow handling
                </p>
              </div>

              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Floating Tab Bar (Mobile-First)
                </h3>
                <div className="relative h-40 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                  <div className="absolute bottom-4 left-1/2 w-80 max-w-full -translate-x-1/2 transform">
                    <nav className="rounded-2xl border border-gray-300 bg-white p-2 shadow-lg">
                      <div className="flex items-center justify-between space-x-1">
                        <button className="relative flex flex-1 flex-col items-center gap-1 rounded-xl bg-blue-100 px-3 py-2 text-xs font-medium text-blue-700">
                          <Heart className="h-5 w-5" />
                          <span className="truncate leading-none">
                            Overview
                          </span>
                          <div className="absolute bottom-0 left-1/2 h-1 w-6 -translate-x-1/2 transform rounded-full bg-blue-600" />
                        </button>
                        <button className="relative flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900">
                          <Activity className="h-5 w-5" />
                          <span className="truncate leading-none">Health</span>
                          <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            3
                          </div>
                        </button>
                        <button className="relative flex flex-1 flex-col items-center gap-1 rounded-xl px-3 py-2 text-xs font-medium text-gray-600 hover:text-gray-900">
                          <Search className="h-5 w-5" />
                          <span className="truncate leading-none">Search</span>
                        </button>
                      </div>
                    </nav>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  Auto-hide on scroll with premium materials and
                  micro-interactions
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 bg-green-50 p-6">
                <h4 className="mb-4 text-lg font-medium text-gray-900">
                  Priority 3 Implementation Status
                </h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">
                      ✅ Completed Features:
                    </h5>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                        Floating Tab Bar structure
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                        Enhanced Breadcrumb navigation
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-green-500"></div>
                        iOS 26 color system integration
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h5 className="font-medium text-gray-900">
                      🚧 In Progress:
                    </h5>
                    <ul className="space-y-1 text-sm text-gray-600">
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500"></div>
                        Full sidebar implementation
                      </li>
                      <li className="flex items-center">
                        <div className="mr-2 h-2 w-2 rounded-full bg-yellow-500"></div>
                        Advanced search with scopes
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default SimpleApp;
