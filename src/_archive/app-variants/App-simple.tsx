import {
  Activity,
  AlertTriangle,
  BarChart3,
  FileText,
  Footprints,
  Heart,
  List,
  Navigation,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useState } from 'react';

// Simple working App component with sidebar - cache bust
function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  console.log(
    '🔧 App render - sidebarCollapsed:',
    sidebarCollapsed,
    'activeSection:',
    activeSection
  );

  // Function to render content based on active section
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              🔥 VitalSense Dashboard - TEST CHANGE 🔥
            </h1>

            {/* Quick Stats */}
            <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-2 font-semibold text-gray-900">
                  Health Score
                </h3>
                <div className="text-3xl font-bold text-green-600">85</div>
                <p className="text-sm text-gray-500">Good health status</p>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-green-600"
                    style={{ width: '85%' }}
                  ></div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-2 font-semibold text-gray-900">Heart Rate</h3>
                <div className="text-3xl font-bold text-red-500">
                  72 <span className="text-sm">BPM</span>
                </div>
                <p className="text-sm text-gray-500">Resting rate</p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-2 font-semibold text-gray-900">
                  Fall Risk Level
                </h3>
                <div className="text-3xl font-bold text-green-600">LOW</div>
                <p className="text-sm text-gray-500">Good stability</p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-2 font-semibold text-gray-900">
                  Mobility Score
                </h3>
                <div className="text-3xl font-bold text-blue-600">92/100</div>
                <p className="text-sm text-gray-500">Excellent mobility</p>
              </div>
            </div>

            {/* Mobility Alerts */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900">
                Mobility & Safety Alerts
              </h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                    <h3 className="font-semibold text-green-800">
                      Balance Status Normal
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-green-700">
                    No fall risk concerns detected
                  </p>
                </div>
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                    <h3 className="font-semibold text-blue-800">
                      Gait Analysis Complete
                    </h3>
                  </div>
                  <p className="mt-1 text-sm text-blue-700">
                    Step symmetry at 96% - excellent balance
                  </p>
                </div>
              </div>
            </div>

            {/* Weekly Summary */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  This Week's Progress
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Walking Speed</span>
                    <span className="font-semibold">3.8 mph avg</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Days</span>
                    <span className="font-semibold">6/7 days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Posture Score</span>
                    <span className="font-semibold">78/100</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fall Risk</span>
                    <span className="font-semibold text-green-600">Low</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Recent Activities
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 py-2">
                    <div>
                      <span className="text-sm font-medium">Morning Walk</span>
                      <p className="text-xs text-gray-500">
                        3.8 mph - 30 minutes
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 py-2">
                    <div>
                      <span className="text-sm font-medium">
                        Balance Assessment
                      </span>
                      <p className="text-xs text-gray-500">
                        Excellent - No risks
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">4 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="text-sm font-medium">Gait Analysis</span>
                      <p className="text-xs text-gray-500">
                        96% symmetry - Great mobility
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">8 hours ago</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'heartRate':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Heart Rate Monitor
            </h1>

            {/* Current Status */}
            <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Current Heart Rate
                </h3>
                <div className="text-5xl font-bold text-red-500">
                  72 <span className="text-lg text-gray-500">BPM</span>
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Normal resting heart rate
                </p>
                <div className="mt-4 flex items-center gap-2">
                  <div className="h-3 w-3 animate-pulse rounded-full bg-green-500"></div>
                  <span className="text-sm text-green-600">
                    Live monitoring
                  </span>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Today's Range
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span>Minimum:</span>
                    <span className="font-semibold text-blue-600">68 BPM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Maximum:</span>
                    <span className="font-semibold text-orange-600">
                      125 BPM
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Average:</span>
                    <span className="font-semibold">74 BPM</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Exercise Peak:</span>
                    <span className="font-semibold text-red-500">125 BPM</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Heart Rate Zones
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Resting (60-70)</span>
                    <span className="text-sm font-semibold text-green-600">
                      4.2 hrs
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Fat Burn (70-85)</span>
                    <span className="text-sm font-semibold text-blue-600">
                      2.1 hrs
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cardio (85-120)</span>
                    <span className="text-sm font-semibold text-orange-600">
                      45 min
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Peak (120+)</span>
                    <span className="text-sm font-semibold text-red-500">
                      12 min
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Readings and Alerts */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Recent Readings
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-100 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div>
                        <span className="text-sm font-medium">72 BPM</span>
                        <p className="text-xs text-gray-500">Resting</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">Now</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-orange-500"></div>
                      <div>
                        <span className="text-sm font-medium">125 BPM</span>
                        <p className="text-xs text-gray-500">Exercise</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">2 hrs ago</span>
                  </div>
                  <div className="flex items-center justify-between border-b border-gray-100 py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <div>
                        <span className="text-sm font-medium">85 BPM</span>
                        <p className="text-xs text-gray-500">Walking</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">3 hrs ago</span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <div>
                        <span className="text-sm font-medium">68 BPM</span>
                        <p className="text-xs text-gray-500">Resting</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">8 hrs ago</span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Health Insights
                </h3>
                <div className="space-y-4">
                  <div className="rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-semibold text-green-800">
                        Excellent Recovery
                      </span>
                    </div>
                    <p className="text-xs text-green-700">
                      Your heart rate returned to normal quickly after exercise
                    </p>
                  </div>
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                      <span className="text-sm font-semibold text-blue-800">
                        Resting Rate Trend
                      </span>
                    </div>
                    <p className="text-xs text-blue-700">
                      Your resting heart rate has improved by 3 BPM this month
                    </p>
                  </div>
                  <div className="rounded-lg border border-teal-200 bg-teal-50 p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-teal-500"></div>
                      <span className="text-sm font-semibold text-teal-800">
                        Weekly Goal
                      </span>
                    </div>
                    <p className="text-xs text-teal-700">
                      You've spent 3.2 hours in active heart rate zones this
                      week
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'fallRisk':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Fall Risk Monitor
            </h1>
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Current Risk Level
                </h3>
                <div className="text-4xl font-bold text-green-600">LOW</div>
                <p className="mt-2 text-sm text-gray-500">
                  Based on recent activity patterns
                </p>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Risk Factors
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Balance:</span>
                    <span className="font-semibold text-green-600">Good</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mobility:</span>
                    <span className="font-semibold text-green-600">Normal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Recent Falls:</span>
                    <span className="font-semibold text-green-600">None</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'posture':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Posture Analysis
            </h1>
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-lg border bg-gradient-to-br from-blue-50 to-blue-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Users className="mr-3 h-8 w-8 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">
                    Spinal Alignment
                  </h3>
                </div>
                <div className="text-3xl font-bold text-blue-600">Good</div>
                <p className="mt-2 text-sm text-gray-600">
                  Cervical and lumbar curvature within normal range
                </p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-green-50 to-green-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Activity className="mr-3 h-8 w-8 text-green-600" />
                  <h3 className="font-semibold text-gray-900">
                    Daily Posture Score
                  </h3>
                </div>
                <div className="text-3xl font-bold text-green-600">78/100</div>
                <p className="mt-2 text-sm text-gray-600">
                  7% improvement from last week
                </p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-amber-50 to-amber-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <AlertTriangle className="mr-3 h-8 w-8 text-amber-600" />
                  <h3 className="font-semibold text-gray-900">
                    Poor Posture Time
                  </h3>
                </div>
                <div className="text-3xl font-bold text-amber-600">3.2h</div>
                <p className="mt-2 text-sm text-gray-600">
                  Daily average with slouching detected
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Sitting Analysis
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Forward Head Posture:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Minimal
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Shoulder Alignment:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Good
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pelvic Tilt:</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                      Slight Anterior
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lower Back Support:</span>
                    <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-medium text-red-800">
                      Needs Attention
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Standing Patterns
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Standing Time (Today):</span>
                    <span className="font-semibold">4.5 hours</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Weight Distribution:</span>
                    <span className="font-semibold text-green-600">
                      Balanced
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Hip Alignment:</span>
                    <span className="font-semibold text-green-600">Level</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Knee Lockout:</span>
                    <span className="font-semibold text-amber-600">
                      Occasional
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'walking':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Walking Patterns
            </h1>
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-lg border bg-gradient-to-br from-emerald-50 to-emerald-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Navigation className="mr-3 h-8 w-8 text-emerald-600" />
                  <h3 className="font-semibold text-gray-900">Walking Speed</h3>
                </div>
                <div className="text-3xl font-bold text-emerald-600">
                  3.8 mph
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  Average speed - within healthy range
                </p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-violet-50 to-violet-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Activity className="mr-3 h-8 w-8 text-violet-600" />
                  <h3 className="font-semibold text-gray-900">Stride Length</h3>
                </div>
                <div className="text-3xl font-bold text-violet-600">28.5"</div>
                <p className="mt-2 text-sm text-gray-600">
                  Optimal stride for height and age
                </p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-teal-50 to-teal-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Heart className="mr-3 h-8 w-8 text-teal-600" />
                  <h3 className="font-semibold text-gray-900">Cadence</h3>
                </div>
                <div className="text-3xl font-bold text-teal-600">172 spm</div>
                <p className="mt-2 text-sm text-gray-600">
                  Steps per minute - excellent rhythm
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Balance Assessment
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Dynamic Balance:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Excellent
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Lateral Stability:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Good
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Turn Smoothness:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Fluid
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Gait Variability:</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                      Low-Moderate
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Walking Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Daily Walking Distance:</span>
                    <span className="font-semibold">6.2 miles</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Step Regularity:</span>
                    <span className="font-semibold text-green-600">94%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Ground Contact Time:</span>
                    <span className="font-semibold">0.62s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Double Support Phase:</span>
                    <span className="font-semibold text-green-600">18.5%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'gait':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Gait Analysis
            </h1>
            <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="rounded-lg border bg-gradient-to-br from-indigo-50 to-indigo-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Footprints className="mr-3 h-8 w-8 text-indigo-600" />
                  <h3 className="font-semibold text-gray-900">Gait Score</h3>
                </div>
                <div className="text-3xl font-bold text-indigo-600">85/100</div>
                <p className="mt-2 text-sm text-gray-600">
                  Overall gait quality - very good
                </p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-rose-50 to-rose-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Activity className="mr-3 h-8 w-8 text-rose-600" />
                  <h3 className="font-semibold text-gray-900">Step Symmetry</h3>
                </div>
                <div className="text-3xl font-bold text-rose-600">96%</div>
                <p className="mt-2 text-sm text-gray-600">
                  Left-right step timing balance
                </p>
              </div>
              <div className="rounded-lg border bg-gradient-to-br from-orange-50 to-orange-100 p-6 shadow">
                <div className="mb-4 flex items-center">
                  <Navigation className="mr-3 h-8 w-8 text-orange-600" />
                  <h3 className="font-semibold text-gray-900">
                    Mobility Score
                  </h3>
                </div>
                <div className="text-3xl font-bold text-orange-600">92/100</div>
                <p className="mt-2 text-sm text-gray-600">
                  Independent mobility assessment
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Gait Cycle Analysis
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span>Heel Strike:</span>
                    <span className="font-semibold text-green-600">Normal</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Mid Stance:</span>
                    <span className="font-semibold text-green-600">Stable</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Push Off:</span>
                    <span className="font-semibold text-green-600">Strong</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Swing Phase:</span>
                    <span className="font-semibold text-amber-600">
                      Slight Drag
                    </span>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border bg-white p-6 shadow">
                <h3 className="mb-4 font-semibold text-gray-900">
                  Advanced Metrics
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Step Length Variability:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Low (Good)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Foot Clearance:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Adequate
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Pelvic Rotation:</span>
                    <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">
                      Normal
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Arm Swing:</span>
                    <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-800">
                      Reduced Left
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case 'analytics':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Health Analytics
            </h1>
            <div className="rounded-lg border bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">
                Weekly Health Trends
              </h3>
              <p className="text-gray-600">
                Comprehensive health data analysis and trends would be displayed
                here.
              </p>
            </div>
          </div>
        );
      case 'reports':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              Health Reports
            </h1>
            <div className="rounded-lg border bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">
                Recent Reports
              </h3>
              <p className="text-gray-600">
                Medical reports and health summaries would be available here.
              </p>
            </div>
          </div>
        );
      case 'settings':
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">Settings</h1>
            <div className="rounded-lg border bg-white p-6 shadow">
              <h3 className="mb-4 font-semibold text-gray-900">
                Application Settings
              </h3>
              <p className="text-gray-600">
                Configure your VitalSense preferences and account settings.
              </p>
            </div>
          </div>
        );
      default:
        return (
          <div>
            <h1 className="mb-6 text-3xl font-bold text-gray-900">
              VitalSense Dashboard
            </h1>
            <p>Welcome to VitalSense Health Monitor</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Working sidebar with enhanced styling */}
      <div
        className="fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-teal-200 bg-gradient-to-b from-white to-gray-50 shadow-xl transition-all duration-300"
        style={{ width: sidebarCollapsed ? '64px' : '256px' }}
      >
        <div className="border-b border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            {!sidebarCollapsed && (
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 shadow-lg">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">
                    VitalSense
                  </h2>
                  <p className="text-xs font-medium text-teal-600">
                    Health Monitor
                  </p>
                </div>
              </div>
            )}
            <button
              onClick={() => {
                console.log(
                  '🔄 Sidebar toggle clicked! Current:',
                  sidebarCollapsed,
                  '-> New:',
                  !sidebarCollapsed
                );
                setSidebarCollapsed(!sidebarCollapsed);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-600 to-teal-700 p-0 text-white shadow-lg transition-all duration-200 hover:from-teal-700 hover:to-teal-800 hover:shadow-xl active:scale-95"
            >
              {sidebarCollapsed ? (
                <List className="h-5 w-5" />
              ) : (
                <X className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Navigation with enhanced styling */}
        <nav className="flex-1 space-y-1 p-4">
          {!sidebarCollapsed ? (
            <div className="space-y-1">
              <div
                onClick={() => setActiveSection('dashboard')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 font-semibold transition-all duration-200 ${
                  activeSection === 'dashboard'
                    ? 'border border-teal-200 bg-gradient-to-r from-teal-100 to-cyan-100 text-teal-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-teal-100 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-sm'
                }`}
              >
                <Activity className="h-5 w-5" />
                Dashboard
              </div>
              <div
                onClick={() => setActiveSection('heartRate')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'heartRate'
                    ? 'border border-teal-200 bg-gradient-to-r from-teal-100 to-cyan-100 font-semibold text-teal-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-teal-100 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-sm'
                }`}
              >
                <Heart className="h-5 w-5" />
                Heart Rate
              </div>

              {/* Mobility & Safety Section */}
              <div className="my-4 border-t border-gray-200"></div>

              <div
                onClick={() => setActiveSection('fallRisk')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'fallRisk'
                    ? 'border border-orange-200 bg-gradient-to-r from-orange-100 to-red-100 font-semibold text-orange-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-orange-100 hover:bg-gradient-to-r hover:from-orange-50 hover:to-red-50 hover:text-orange-700 hover:shadow-sm'
                }`}
              >
                <AlertTriangle className="h-5 w-5" />
                Fall Risk Monitor
              </div>
              <div
                onClick={() => setActiveSection('posture')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'posture'
                    ? 'border border-purple-200 bg-gradient-to-r from-purple-100 to-indigo-100 font-semibold text-purple-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-purple-100 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700 hover:shadow-sm'
                }`}
              >
                <Users className="h-5 w-5" />
                Posture Analysis
              </div>
              <div
                onClick={() => setActiveSection('walking')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'walking'
                    ? 'border border-blue-200 bg-gradient-to-r from-blue-100 to-cyan-100 font-semibold text-blue-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-blue-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 hover:shadow-sm'
                }`}
              >
                <Navigation className="h-5 w-5" />
                Walking Patterns
              </div>
              <div
                onClick={() => setActiveSection('gait')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'gait'
                    ? 'border border-green-200 bg-gradient-to-r from-green-100 to-emerald-100 font-semibold text-green-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-green-100 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-sm'
                }`}
              >
                <Footprints className="h-5 w-5" />
                Gait Analysis
              </div>

              {/* Analytics & Management */}
              <div className="my-4 border-t border-gray-200"></div>

              <div
                onClick={() => setActiveSection('analytics')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'analytics'
                    ? 'border border-teal-200 bg-gradient-to-r from-teal-100 to-cyan-100 font-semibold text-teal-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-teal-100 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-sm'
                }`}
              >
                <BarChart3 className="h-5 w-5" />
                Analytics
              </div>
              <div
                onClick={() => setActiveSection('reports')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'reports'
                    ? 'border border-teal-200 bg-gradient-to-r from-teal-100 to-cyan-100 font-semibold text-teal-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-teal-100 hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-sm'
                }`}
              >
                <FileText className="h-5 w-5" />
                Health Reports
              </div>

              {/* Settings */}
              <div className="my-4 border-t border-gray-200"></div>

              <div
                onClick={() => setActiveSection('settings')}
                className={`flex cursor-pointer items-center gap-3 rounded-lg p-3 transition-all duration-200 ${
                  activeSection === 'settings'
                    ? 'border border-gray-300 bg-gradient-to-r from-gray-100 to-slate-100 font-semibold text-gray-800 shadow-sm'
                    : 'text-gray-600 hover:border hover:border-gray-200 hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-700 hover:shadow-sm'
                }`}
              >
                <Settings className="h-5 w-5" />
                Settings
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-teal-200 bg-gradient-to-br from-teal-100 to-cyan-100 text-teal-800 shadow-sm">
                <Activity className="h-6 w-6" />
              </div>
              <div
                onClick={() => setActiveSection('heartRate')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-teal-100 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-sm"
              >
                <Heart className="h-6 w-6" />
              </div>

              {/* Mobility & Safety Section */}
              <div className="mx-auto my-3 w-8 border-t border-gray-200"></div>

              <div
                onClick={() => setActiveSection('fallRisk')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-orange-100 hover:bg-gradient-to-br hover:from-orange-50 hover:to-red-50 hover:text-orange-700 hover:shadow-sm"
              >
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div
                onClick={() => setActiveSection('posture')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-purple-100 hover:bg-gradient-to-br hover:from-purple-50 hover:to-indigo-50 hover:text-purple-700 hover:shadow-sm"
              >
                <Users className="h-6 w-6" />
              </div>
              <div
                onClick={() => setActiveSection('walking')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-blue-100 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 hover:shadow-sm"
              >
                <Navigation className="h-6 w-6" />
              </div>
              <div
                onClick={() => setActiveSection('gait')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-green-100 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:text-green-700 hover:shadow-sm"
              >
                <Footprints className="h-6 w-6" />
              </div>

              {/* Analytics & Management */}
              <div className="mx-auto my-3 w-8 border-t border-gray-200"></div>

              <div
                onClick={() => setActiveSection('analytics')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-teal-100 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-sm"
              >
                <BarChart3 className="h-6 w-6" />
              </div>
              <div
                onClick={() => setActiveSection('reports')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-teal-100 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700 hover:shadow-sm"
              >
                <FileText className="h-6 w-6" />
              </div>

              {/* Settings */}
              <div className="mx-auto my-3 w-8 border-t border-gray-200"></div>

              <div
                onClick={() => setActiveSection('settings')}
                className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-xl text-gray-600 transition-all duration-200 hover:border hover:border-gray-200 hover:bg-gradient-to-br hover:from-gray-50 hover:to-slate-50 hover:text-gray-700 hover:shadow-sm"
              >
                <Settings className="h-6 w-6" />
              </div>
            </div>
          )}
        </nav>
      </div>

      {/* Main content */}
      <div
        className="transition-all duration-300"
        style={{ marginLeft: sidebarCollapsed ? '64px' : '256px' }}
      >
        <div className="p-8">
          {renderContent()}

          <div className="mt-8 rounded border border-teal-200 bg-teal-50 p-4">
            <h4 className="mb-2 font-semibold text-teal-800">
              🎉 Interactive Navigation Working!
            </h4>
            <p className="text-teal-700">
              Click any navigation item in the sidebar to see different content.
              The sidebar toggles between expanded (256px) and collapsed (64px)
              modes. Current section: <strong>{activeSection}</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
