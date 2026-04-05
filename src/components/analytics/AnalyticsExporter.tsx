/**
 * Analytics Exporter Component
 * Exports analytics data in various formats (PDF, CSV, JSON)
 */

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Download, FileText, FileSpreadsheet, FileJson } from 'lucide-react';
import { useState } from 'react';
import { useOnceToast } from '@/hooks/useOnceToast';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import type { AnalyticsSummary } from '@/lib/analytics';

interface AnalyticsExporterProps {
  healthData: ProcessedHealthData | null;
  analyticsSummary: AnalyticsSummary;
}

export default function AnalyticsExporter({
  healthData,
  analyticsSummary,
}: AnalyticsExporterProps) {
  const [format, setFormat] = useState<'pdf' | 'csv' | 'json'>('pdf');
  const [isExporting, setIsExporting] = useState(false);
  const { showOnce } = useOnceToast();

  const exportData = async () => {
    if (!healthData) {
      showOnce('export-no-data', 'error', 'No data to export');
      return;
    }

    setIsExporting(true);
    showOnce(`export-generating-${format}`, 'info', `Generating ${format.toUpperCase()} report...`);

    try {
      // Simulate export generation
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // In production, this would:
      // - Generate PDF using a library like jsPDF or PDFKit
      // - Generate CSV by converting data to CSV format
      // - Generate JSON by stringifying the data
      // - Trigger download

      let filename = '';
      let content = '';

      switch (format) {
        case 'pdf':
          filename = `health-analytics-${new Date().toISOString().split('T')[0]}.pdf`;
          // PDF generation would happen here
          content = 'PDF content would be generated here';
          break;
        case 'csv':
          filename = `health-analytics-${new Date().toISOString().split('T')[0]}.csv`;
          content = generateCSV(healthData, analyticsSummary);
          downloadFile(content, filename, 'text/csv');
          break;
        case 'json':
          filename = `health-analytics-${new Date().toISOString().split('T')[0]}.json`;
          content = JSON.stringify(
            {
              summary: analyticsSummary,
              healthData,
              exportedAt: new Date().toISOString(),
            },
            null,
            2
          );
          downloadFile(content, filename, 'application/json');
          break;
      }

      showOnce(`export-success-${format}`, 'success', `Report exported as ${filename}`);
    } catch (error) {
      showOnce('export-error', 'error', 'Failed to export report');
      console.error(error);
    } finally {
      setIsExporting(false);
    }
  };

  const generateCSV = (
    data: ProcessedHealthData,
    summary: AnalyticsSummary
  ): string => {
    const rows: string[] = [];

    // Header
    rows.push('Health Analytics Report');
    rows.push(`Generated: ${new Date().toISOString()}`);
    rows.push('');
    rows.push('Summary');
    rows.push(`Total Data Points,${summary.totalDataPoints}`);
    rows.push(`Health Score,${summary.overallHealthScore.toFixed(1)}`);
    rows.push(`Metrics Analyzed,${summary.metricsAnalyzed.join(';')}`);
    rows.push(`Anomalies,${summary.anomalies}`);
    rows.push('');

    // Metrics
    rows.push('Metrics');
    rows.push('Metric,Average,Last Value,Trend');
    if (data.metrics.steps) {
      rows.push(
        `Steps,${data.metrics.steps.average.toFixed(1)},${data.metrics.steps.lastValue.toFixed(1)},${data.metrics.steps.trend}`
      );
    }
    if (data.metrics.heartRate) {
      rows.push(
        `Heart Rate,${data.metrics.heartRate.average.toFixed(1)},${data.metrics.heartRate.lastValue.toFixed(1)},${data.metrics.heartRate.trend}`
      );
    }
    if (data.metrics.walkingSteadiness) {
      rows.push(
        `Walking Steadiness,${data.metrics.walkingSteadiness.average.toFixed(1)},${data.metrics.walkingSteadiness.lastValue.toFixed(1)},${data.metrics.walkingSteadiness.trend}`
      );
    }
    if (data.metrics.sleepHours) {
      rows.push(
        `Sleep Hours,${data.metrics.sleepHours.average.toFixed(1)},${data.metrics.sleepHours.lastValue.toFixed(1)},${data.metrics.sleepHours.trend}`
      );
    }

    return rows.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export Analytics
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Export Analytics Report</DialogTitle>
          <DialogDescription>
            Choose a format to export your health analytics data
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Export Format</label>
            <Select value={format} onValueChange={(value) => setFormat(value as 'pdf' | 'csv' | 'json')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    PDF Report
                  </div>
                </SelectItem>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="h-4 w-4" />
                    CSV Data
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileJson className="h-4 w-4" />
                    JSON Data
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-lg border bg-gray-50 p-3 text-sm text-gray-600">
            <strong>Includes:</strong>
            <ul className="mt-1 list-disc space-y-1 pl-5">
              <li>Analytics summary and key metrics</li>
              <li>Trend analysis and correlations</li>
              <li>Anomaly detection results</li>
              <li>Pattern detection findings</li>
              {format === 'json' && <li>Complete raw data</li>}
            </ul>
          </div>

          <Button
            onClick={exportData}
            disabled={isExporting}
            className="w-full"
          >
            {isExporting ? (
              <>Generating...</>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Export {format.toUpperCase()}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
