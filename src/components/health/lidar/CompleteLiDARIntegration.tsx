/**
 * Complete LiDAR Next Steps Integration
 * Demonstrates all enhanced features: Real Data + Advanced Analytics + Future Ready
 */

import {
  Activity,
  Brain,
  Database,
  Download,
  Settings,
  Zap,
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { AdvancedLiDARAnalytics } from './AdvancedLiDARAnalytics';
import type { LiDARScanData } from './CleanLiDARComponents';
import { CleanLiDARPerformanceProvider } from './index';
import { RealDataLiDARIntegration } from './RealDataLiDARIntegration';

// Integration settings interface
interface IntegrationSettings {
  enableRealData: boolean;
  enableAdvancedAnalytics: boolean;
  enableClinicalReports: boolean;
  enableExport: boolean;
  updateInterval: number;
  maxHistoryItems: number;
}

// Clinical report interface (preview for future enhancement)
interface ClinicalReportPreview {
  id: string;
  patientId: string;
  generatedAt: Date;
  reportType: 'fall_risk' | 'gait_analysis' | 'posture_assessment';
  status: 'generating' | 'ready' | 'exported';
  summary: string;
}

export const CompleteLiDARIntegration: React.FC<{
  className?: string;
}> = ({ className = '' }) => {
  // State management
  const [settings, setSettings] = useState<IntegrationSettings>({
    enableRealData: true,
    enableAdvancedAnalytics: true,
    enableClinicalReports: false, // Future feature
    enableExport: true,
    updateInterval: 3000,
    maxHistoryItems: 50,
  });

  const [scanHistory, setScanHistory] = useState<LiDARScanData[]>([]);
  const [activeTab, setActiveTab] = useState<
    'realtime' | 'analytics' | 'reports' | 'settings'
  >('realtime');
  const [clinicalReports] = useState<ClinicalReportPreview[]>([
    {
      id: 'report-001',
      patientId: 'patient-demo-001',
      generatedAt: new Date(),
      reportType: 'fall_risk',
      status: 'ready',
      summary:
        'Comprehensive fall risk assessment showing low risk level with recommendations for continued monitoring.',
    },
  ]);

  // Mock data generation for demonstration
  useEffect(() => {
    if (settings.enableRealData) {
      const interval = setInterval(() => {
        const newScan: LiDARScanData = {
          id: `scan-${Date.now()}`,
          timestamp: Date.now(),
          points: [], // Mock empty points array
          metadata: {
            duration: 35 + Math.random() * 30,
            pointCount: Math.floor(12000 + Math.random() * 8000),
            accuracy: 0.92 + Math.random() * 0.08,
            roomId: ['living-room', 'bedroom', 'kitchen'][
              Math.floor(Math.random() * 3)
            ],
          },
        };

        setScanHistory((prev) => [
          newScan,
          ...prev.slice(0, settings.maxHistoryItems - 1),
        ]);
      }, settings.updateInterval);

      return () => clearInterval(interval);
    }
  }, [
    settings.enableRealData,
    settings.updateInterval,
    settings.maxHistoryItems,
  ]);

  // Export functionality
  const handleExportData = async () => {
    if (!settings.enableExport) return;

    const exportData = {
      timestamp: new Date().toISOString(),
      settings,
      scanHistory: scanHistory.slice(0, 10), // Last 10 scans
      analytics: {
        totalScans: scanHistory.length,
        averageAccuracy:
          scanHistory.reduce((sum, scan) => sum + scan.metadata.accuracy, 0) /
          scanHistory.length,
        averagePointCount:
          scanHistory.reduce((sum, scan) => sum + scan.metadata.pointCount, 0) /
          scanHistory.length,
      },
    };

    // Create downloadable file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `lidar-health-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <CleanLiDARPerformanceProvider>
      <div className={`space-y-6 ${className}`}>
        {/* Integration Header */}
        <div className="from-blue-600 to-purple-600 rounded-lg bg-gradient-to-r p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="mb-2 text-2xl font-bold">
                VitalSense LiDAR Integration
              </h1>
              <p className="text-blue-100">
                Complete health monitoring with real-time data, advanced
                analytics, and clinical reporting
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-center">
                <div className="text-2xl font-bold">{scanHistory.length}</div>
                <div className="text-blue-100 text-sm">Scans Collected</div>
              </div>
              <button
                type="button"
                onClick={handleExportData}
                disabled={!settings.enableExport}
                className="flex items-center rounded-lg bg-white/20 px-4 py-2 transition-colors hover:bg-white/30 disabled:opacity-50"
              >
                <Download className="mr-2 h-4 w-4" />
                Export Data
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="flex border-b">
            <TabButton
              active={activeTab === 'realtime'}
              onClick={() => setActiveTab('realtime')}
              icon={<Activity className="h-4 w-4" />}
              label="Real-time Data"
            />
            <TabButton
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
              icon={<Brain className="h-4 w-4" />}
              label="Advanced Analytics"
            />
            <TabButton
              active={activeTab === 'reports'}
              onClick={() => setActiveTab('reports')}
              icon={<Database className="h-4 w-4" />}
              label="Clinical Reports"
              badge="Preview"
            />
            <TabButton
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
              icon={<Settings className="h-4 w-4" />}
              label="Settings"
            />
          </div>

          <div className="p-6">
            {/* Real-time Data Tab */}
            {activeTab === 'realtime' && (
              <RealDataLiDARIntegration
                enableRealData={settings.enableRealData}
                fallbackToMock={true}
              />
            )}

            {/* Advanced Analytics Tab */}
            {activeTab === 'analytics' && settings.enableAdvancedAnalytics && (
              <AdvancedLiDARAnalytics scanData={scanHistory} />
            )}

            {/* Clinical Reports Tab (Preview) */}
            {activeTab === 'reports' && (
              <div className="space-y-6">
                <div className="bg-blue-50 border-blue-200 rounded-lg border p-6">
                  <div className="mb-4 flex items-center">
                    <Database className="text-blue-600 mr-3 h-6 w-6" />
                    <h3 className="text-blue-900 text-lg font-semibold">
                      Clinical Reports System
                    </h3>
                    <span className="ml-3 bg-blue-200 text-blue-800 text-xs rounded-full px-2 py-1">
                      FUTURE ENHANCEMENT
                    </span>
                  </div>
                  <p className="text-blue-800 mb-4">
                    Professional medical reports with HIPAA compliance, HL7 FHIR
                    standards, and provider integration.
                  </p>

                  <div className="md:grid-cols-3 grid grid-cols-1 gap-4">
                    <FeatureCard
                      title="Fall Risk Assessment"
                      description="Comprehensive analysis with clinical recommendations"
                      status="In Development"
                    />
                    <FeatureCard
                      title="Gait Analysis Report"
                      description="Detailed movement pattern analysis for providers"
                      status="Planned"
                    />
                    <FeatureCard
                      title="EHR Integration"
                      description="Direct integration with electronic health records"
                      status="Future"
                    />
                  </div>
                </div>

                {/* Preview of generated reports */}
                <div className="rounded-lg border bg-white p-6">
                  <h4 className="mb-4 font-semibold text-gray-900">
                    Sample Reports (Demo)
                  </h4>
                  <div className="space-y-3">
                    {clinicalReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-gray-50 flex items-center justify-between rounded-lg p-4"
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {report.reportType
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                            Report
                          </div>
                          <div className="text-gray-600 text-sm">
                            {report.summary}
                          </div>
                          <div className="text-xs mt-1 text-gray-500">
                            Generated: {report.generatedAt.toLocaleDateString()}
                          </div>
                        </div>
                        <ReportStatusBadge status={report.status} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
              <div className="space-y-6">
                <div className="bg-white">
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-gray-900">
                    <Zap className="w-5 h-5 text-yellow-500 mr-2" />
                    Integration Settings
                  </h3>

                  <div className="space-y-4">
                    <SettingToggle
                      label="Real-time Data Collection"
                      description="Enable live sensor data streaming and processing"
                      checked={settings.enableRealData}
                      onChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          enableRealData: checked,
                        }))
                      }
                    />

                    <SettingToggle
                      label="Advanced Analytics"
                      description="AI-powered pattern recognition and health insights"
                      checked={settings.enableAdvancedAnalytics}
                      onChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          enableAdvancedAnalytics: checked,
                        }))
                      }
                    />

                    <SettingToggle
                      label="Clinical Reports"
                      description="Professional medical documentation (Future Feature)"
                      checked={settings.enableClinicalReports}
                      onChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          enableClinicalReports: checked,
                        }))
                      }
                      disabled={true}
                    />

                    <SettingToggle
                      label="Data Export"
                      description="Enable JSON export of health data and analytics"
                      checked={settings.enableExport}
                      onChange={(checked) =>
                        setSettings((prev) => ({
                          ...prev,
                          enableExport: checked,
                        }))
                      }
                    />

                    <div className="md:grid-cols-2 grid grid-cols-1 gap-4 border-t pt-4">
                      <div>
                        <label
                          htmlFor="update-interval-select"
                          className="text-gray-700 mb-2 block text-sm font-medium"
                        >
                          Update Interval (ms)
                        </label>
                        <select
                          id="update-interval-select"
                          value={settings.updateInterval}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              updateInterval: parseInt(e.target.value),
                            }))
                          }
                          className="px-3 border-gray-300 focus:ring-blue-500 w-full rounded-md border py-2 focus:outline-none focus:ring-2"
                          aria-label="Update interval setting"
                        >
                          <option value={1000}>1 second</option>
                          <option value={3000}>3 seconds</option>
                          <option value={5000}>5 seconds</option>
                          <option value={10000}>10 seconds</option>
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="max-history-select"
                          className="text-gray-700 mb-2 block text-sm font-medium"
                        >
                          Max History Items
                        </label>
                        <select
                          id="max-history-select"
                          value={settings.maxHistoryItems}
                          onChange={(e) =>
                            setSettings((prev) => ({
                              ...prev,
                              maxHistoryItems: parseInt(e.target.value),
                            }))
                          }
                          className="px-3 border-gray-300 focus:ring-blue-500 w-full rounded-md border py-2 focus:outline-none focus:ring-2"
                          aria-label="Maximum history items setting"
                        >
                          <option value={25}>25 items</option>
                          <option value={50}>50 items</option>
                          <option value={100}>100 items</option>
                          <option value={200}>200 items</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Integration Status Footer */}
        <div className="rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <StatusIndicator
                label="Real Data"
                active={settings.enableRealData}
              />
              <StatusIndicator
                label="Analytics"
                active={settings.enableAdvancedAnalytics}
              />
              <StatusIndicator label="Export" active={settings.enableExport} />
            </div>
            <div className="text-gray-600 text-sm">
              Integration Status: All systems operational
            </div>
          </div>
        </div>
      </div>
    </CleanLiDARPerformanceProvider>
  );
};

// Helper Components
const TabButton: React.FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  badge?: string;
}> = ({ active, onClick, icon, label, badge }) => (
  <button
    type="button"
    onClick={onClick}
    className={`py-3 flex items-center border-b-2 px-6 text-sm font-medium transition-colors ${
      active
        ? 'border-blue-500 text-blue-600 bg-blue-50'
        : 'text-gray-600 hover:bg-gray-50 border-transparent hover:text-gray-900'
    }`}
  >
    {icon}
    <span className="ml-2">{label}</span>
    {badge && (
      <span className="bg-orange-100 text-orange-800 text-xs ml-2 rounded-full px-2 py-1">
        {badge}
      </span>
    )}
  </button>
);

const FeatureCard: React.FC<{
  title: string;
  description: string;
  status: string;
}> = ({ title, description, status }) => (
  <div className="rounded-lg border bg-white p-4">
    <h4 className="mb-2 font-medium text-gray-900">{title}</h4>
    <p className="text-gray-600 mb-3 text-sm">{description}</p>
    <span className="text-gray-700 text-xs inline-block rounded bg-gray-100 px-2 py-1">
      {status}
    </span>
  </div>
);

const ReportStatusBadge: React.FC<{
  status: ClinicalReportPreview['status'];
}> = ({ status }) => {
  const styles = {
    generating: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    exported: 'bg-blue-100 text-blue-800',
  };

  return (
    <span
      className={`text-xs rounded-full px-2 py-1 font-medium ${styles[status]}`}
    >
      {status.toUpperCase()}
    </span>
  );
};

const SettingToggle: React.FC<{
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}> = ({ label, description, checked, onChange, disabled = false }) => (
  <div className="bg-gray-50 flex items-center justify-between rounded-lg p-4">
    <div className="flex-1">
      <div className="font-medium text-gray-900">{label}</div>
      <div className="text-gray-600 text-sm">{description}</div>
    </div>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-11 relative inline-flex h-6 items-center rounded-full transition-colors ${
        checked && !disabled ? 'bg-blue-600' : 'bg-gray-300'
      } ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}
      aria-label={`Toggle ${label}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  </div>
);

const StatusIndicator: React.FC<{
  label: string;
  active: boolean;
}> = ({ label, active }) => (
  <div className="flex items-center">
    <div
      className={`mr-2 h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-gray-300'}`}
    />
    <span className="text-gray-600 text-sm">{label}</span>
  </div>
);

export default CompleteLiDARIntegration;
