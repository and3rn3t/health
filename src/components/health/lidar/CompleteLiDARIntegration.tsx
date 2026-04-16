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
} from '@/lib/icons';
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
            duration: 35 + Math.random() * 30, // NOSONAR: Demo simulation data
            pointCount: Math.floor(12000 + Math.random() * 8000), // NOSONAR
            accuracy: 0.92 + Math.random() * 0.08, // NOSONAR
            roomId: ['living-room', 'bedroom', 'kitchen'][
              Math.floor(Math.random() * 3) // NOSONAR
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
        {/* Quick Stats Bar */}
        <div className="flex items-center justify-between rounded-xl bg-muted/50 p-3">
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-semibold">{scanHistory.length}</span>
              <span className="ml-1 text-muted-foreground">Scans</span>
            </div>
          </div>
          <button
            type="button"
            onClick={handleExportData}
            disabled={!settings.enableExport}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            Export
          </button>
        </div>

        {/* Segmented Control */}
        <div role="tablist" className="flex rounded-xl bg-muted p-1">
          {[
            { key: 'realtime' as const, label: 'Real-time', icon: <Activity className="h-3.5 w-3.5" /> },
            { key: 'analytics' as const, label: 'Analytics', icon: <Brain className="h-3.5 w-3.5" /> },
            { key: 'reports' as const, label: 'Reports', icon: <Database className="h-3.5 w-3.5" /> },
            { key: 'settings' as const, label: 'Settings', icon: <Settings className="h-3.5 w-3.5" /> },
          ].map((tab) => (
            <button
              key={tab.key}
              role="tab"
              type="button"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all ${
                activeTab === tab.key
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="rounded-xl border bg-card shadow-sm">

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
                <div className="rounded-lg border border-blue-200 bg-blue-50 p-6 dark:border-blue-900 dark:bg-blue-950">
                  <div className="mb-4 flex items-center">
                    <Database className="mr-3 h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">
                      Clinical Reports System
                    </h3>
                    <span className="ml-3 rounded-full bg-blue-200 px-2 py-1 text-xs text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                      FUTURE ENHANCEMENT
                    </span>
                  </div>
                  <p className="mb-4 text-blue-800 dark:text-blue-200">
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

                <div className="rounded-lg border bg-card p-6">
                  <h4 className="mb-4 font-semibold text-foreground">
                    Sample Reports (Demo)
                  </h4>
                  <div className="space-y-3">
                    {clinicalReports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between rounded-lg bg-muted/50 p-4"
                      >
                        <div>
                          <div className="font-medium text-foreground">
                            {report.reportType
                              .replace('_', ' ')
                              .replace(/\b\w/g, (l) => l.toUpperCase())}{' '}
                            Report
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {report.summary}
                          </div>
                          <div className="mt-1 text-xs text-muted-foreground">
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
                <div>
                  <h3 className="mb-4 flex items-center text-lg font-semibold text-foreground">
                    <Zap className="mr-2 h-5 w-5 text-yellow-500" />
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
                          className="mb-2 block text-sm font-medium text-foreground"
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
                          className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
                          className="mb-2 block text-sm font-medium text-foreground"
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
                          className="w-full rounded-md border border-border bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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
        <div className="rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
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
            <div className="text-sm text-muted-foreground">
              All systems operational
            </div>
          </div>
        </div>
      </div>
    </CleanLiDARPerformanceProvider>
  );
};

// Helper Components
const FeatureCard: React.FC<{
  title: string;
  description: string;
  status: string;
}> = ({ title, description, status }) => (
  <div className="rounded-lg border bg-card p-4">
    <h4 className="mb-2 font-medium text-foreground">{title}</h4>
    <p className="mb-3 text-sm text-muted-foreground">{description}</p>
    <span className="inline-block rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
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
  <div className="flex items-center justify-between rounded-lg bg-muted/50 p-4">
    <div className="flex-1">
      <div className="font-medium text-foreground">{label}</div>
      <div className="text-sm text-muted-foreground">{description}</div>
    </div>
    <button
      type="button"
      onClick={() => !disabled && onChange(!checked)}
      disabled={disabled}
      className={`w-11 relative inline-flex h-6 items-center rounded-full transition-colors ${
        checked && !disabled ? 'bg-primary' : 'bg-muted-foreground/30'
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
      className={`mr-2 h-2 w-2 rounded-full ${active ? 'bg-green-500' : 'bg-muted-foreground/30'}`}
    />
    <span className="text-sm text-muted-foreground">{label}</span>
  </div>
);

export default CompleteLiDARIntegration;
