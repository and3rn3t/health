/**
 * Fall Risk Report Exporter Component
 * Allows users to export comprehensive fall risk reports in various formats
 */

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, FileText, FileJson, FileSpreadsheet } from 'lucide-react';
import React from 'react';
import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';
import type { FallRiskHistoryDataPoint } from './FallRiskHistoryChart';

interface FallRiskReportExporterProps {
  currentPrediction: AdvancedFallRiskPrediction;
  historyData?: FallRiskHistoryDataPoint[];
  onExport?: (format: 'pdf' | 'json' | 'csv', data: ExportData) => void;
}

interface ExportData {
  prediction: AdvancedFallRiskPrediction;
  history?: FallRiskHistoryDataPoint[];
  exportDate: Date;
  exportVersion: string;
}

export default function FallRiskReportExporter({
  currentPrediction,
  historyData,
  onExport,
}: FallRiskReportExporterProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);

  const exportData: ExportData = {
    prediction: currentPrediction,
    history: historyData,
    exportDate: new Date(),
    exportVersion: '1.0',
  };

  const exportToJSON = () => {
    setIsExporting(true);
    try {
      const json = JSON.stringify(exportData, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fall-risk-report-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onExport?.('json', exportData);
    } catch (error) {
      console.error('Failed to export JSON:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToCSV = () => {
    setIsExporting(true);
    try {
      // Create CSV content
      let csv = 'Date,Risk Score,Risk Level,Gait Risk,Balance Risk,Environmental Risk,Physiological Risk,Behavioral Risk\n';

      if (historyData && historyData.length > 0) {
        historyData.forEach((point) => {
          csv += `${point.date.toISOString()},${point.riskScore},${point.riskLevel},${point.gaitRisk},${point.balanceRisk},${point.environmentalRisk},${point.physiologicalRisk},${point.behavioralRisk}\n`;
        });
      } else {
        // Export current prediction as single row
        csv += `${currentPrediction.lastUpdated.toISOString()},${currentPrediction.riskScore},${currentPrediction.riskLevel},${currentPrediction.gaitRisk.overallScore},${currentPrediction.balanceRisk.overallScore},${currentPrediction.environmentalRisk.overallScore},${currentPrediction.physiologicalRisk.overallScore},${currentPrediction.behavioralRisk.overallScore}\n`;
      }

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fall-risk-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      onExport?.('csv', exportData);
    } catch (error) {
      console.error('Failed to export CSV:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const exportToPDF = () => {
    setIsExporting(true);
    try {
      // Generate PDF content as HTML
      const htmlContent = generatePDFHTML(exportData);
      const printWindow = window.open('', '_blank');
      if (!printWindow) {
        alert('Please allow pop-ups to generate PDF');
        setIsExporting(false);
        return;
      }

      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        setIsExporting(false);
      };
      onExport?.('pdf', exportData);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      setIsExporting(false);
    }
  };

  const generatePDFHTML = (data: ExportData): string => {
    const prediction = data.prediction;
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Fall Risk Assessment Report</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 40px;
      color: #333;
    }
    h1 {
      color: #1e40af;
      border-bottom: 3px solid #1e40af;
      padding-bottom: 10px;
    }
    h2 {
      color: #3b82f6;
      margin-top: 30px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 5px;
    }
    .summary {
      background: #f3f4f6;
      padding: 20px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .risk-level {
      font-size: 24px;
      font-weight: bold;
      color: ${getRiskLevelColor(prediction.riskLevel)};
    }
    .section {
      margin: 20px 0;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      padding: 8px 0;
      border-bottom: 1px solid #e5e7eb;
    }
    .footer {
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 12px;
      color: #6b7280;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th, td {
      padding: 10px;
      text-align: left;
      border-bottom: 1px solid #e5e7eb;
    }
    th {
      background: #f3f4f6;
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>Fall Risk Assessment Report</h1>
  <div class="footer">
    Generated: ${data.exportDate.toLocaleString()}<br>
    Report Version: ${data.exportVersion}
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <div class="risk-level">Risk Level: ${prediction.riskLevel.toUpperCase()}</div>
    <div class="metric">
      <span>Overall Risk Score:</span>
      <span><strong>${prediction.riskScore.toFixed(1)}/100</strong></span>
    </div>
    <div class="metric">
      <span>Prediction Confidence:</span>
      <span>${Math.round(prediction.confidence * 100)}%</span>
    </div>
    <div class="metric">
      <span>Assessment Date:</span>
      <span>${prediction.lastUpdated.toLocaleString()}</span>
    </div>
    <div class="metric">
      <span>Next Assessment:</span>
      <span>${prediction.nextAssessment.toLocaleString()}</span>
    </div>
  </div>

  <div class="section">
    <h2>Temporal Risk Predictions</h2>
    <table>
      <tr>
        <th>Time Horizon</th>
        <th>Risk Score</th>
      </tr>
      <tr>
        <td>Short-term (1-4 hours)</td>
        <td>${prediction.shortTermRisk.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Medium-term (24-72 hours)</td>
        <td>${prediction.mediumTermRisk.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Long-term (7-30 days)</td>
        <td>${prediction.longTermRisk.toFixed(1)}%</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Multi-Dimensional Risk Analysis</h2>
    <table>
      <tr>
        <th>Category</th>
        <th>Risk Score</th>
      </tr>
      <tr>
        <td>Gait Risk</td>
        <td>${prediction.gaitRisk.overallScore.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Balance Risk</td>
        <td>${prediction.balanceRisk.overallScore.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Environmental Risk</td>
        <td>${prediction.environmentalRisk.overallScore.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Physiological Risk</td>
        <td>${prediction.physiologicalRisk.overallScore.toFixed(1)}%</td>
      </tr>
      <tr>
        <td>Behavioral Risk</td>
        <td>${prediction.behavioralRisk.overallScore.toFixed(1)}%</td>
      </tr>
    </table>
  </div>

  <div class="section">
    <h2>Primary Risk Factors</h2>
    ${prediction.primaryRiskFactors
      .map(
        (factor) => `
      <div style="margin: 15px 0; padding: 15px; border: 1px solid #e5e7eb; border-radius: 4px;">
        <strong>${factor.description}</strong> (${factor.severity})
        <div style="margin-top: 5px; color: #6b7280; font-size: 14px;">
          ${factor.explanation}
        </div>
        <div style="margin-top: 5px; font-size: 12px;">
          Weight: ${Math.round(factor.weight * 100)}% |
          Modifiable: ${factor.modifiable ? 'Yes' : 'No'}
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  ${prediction.protectiveFactors.length > 0 ? `
  <div class="section">
    <h2>Protective Factors</h2>
    ${prediction.protectiveFactors
      .map(
        (factor) => `
      <div style="margin: 15px 0; padding: 15px; border: 1px solid #d1fae5; border-radius: 4px; background: #f0fdf4;">
        <strong>${factor.description}</strong>
        <div style="margin-top: 5px; color: #065f46; font-size: 14px;">
          ${factor.recommendations?.join(', ') || 'No recommendations available'}
        </div>
      </div>
    `
      )
      .join('')}
  </div>
  ` : ''}

  <div class="section">
    <h2>Recommended Interventions</h2>
    ${prediction.interventions
      .slice(0, 10)
      .map(
        (intervention) => `
      <div style="margin: 15px 0; padding: 15px; border: 1px solid #dbeafe; border-radius: 4px; background: #eff6ff;">
        <strong>${intervention.title}</strong>
        <div style="margin-top: 5px; color: #1e40af; font-size: 14px;">
          ${intervention.description}
        </div>
        <div style="margin-top: 5px; font-size: 12px;">
          Priority: ${intervention.priority} |
          Evidence Level: ${intervention.evidence || 'not specified'}
        </div>
      </div>
    `
      )
      .join('')}
  </div>

  ${data.history && data.history.length > 0 ? `
  <div class="section">
    <h2>Historical Trends</h2>
    <p>Historical data points: ${data.history.length}</p>
    <p>Date range: ${data.history[data.history.length - 1].date.toLocaleDateString()} to ${data.history[0].date.toLocaleDateString()}</p>
  </div>
  ` : ''}

  <div class="footer">
    <p><strong>Disclaimer:</strong> This report is for informational purposes only and should not replace professional medical advice. Please consult with your healthcare provider regarding fall risk management.</p>
    <p>Generated by VitalSense Fall Risk Assessment System</p>
  </div>
</body>
</html>
    `;
  };

  const getRiskLevelColor = (level: string): string => {
    switch (level) {
      case 'critical':
      case 'severe':
        return '#dc2626';
      case 'high':
        return '#ea580c';
      case 'moderate':
        return '#ca8a04';
      case 'low':
        return '#2563eb';
      case 'minimal':
        return '#16a34a';
      default:
        return '#6b7280';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full">
          <Download className="mr-2 h-4 w-4" />
          Export Report
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Export Fall Risk Report</DialogTitle>
          <DialogDescription>
            Choose a format to export your fall risk assessment report
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Button
            onClick={exportToPDF}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
          >
            <FileText className="mr-2 h-4 w-4" />
            Export as PDF
            <span className="ml-auto text-xs text-gray-500">(Print to PDF)</span>
          </Button>
          <Button
            onClick={exportToJSON}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
          >
            <FileJson className="mr-2 h-4 w-4" />
            Export as JSON
            <span className="ml-auto text-xs text-gray-500">(Machine readable)</span>
          </Button>
          <Button
            onClick={exportToCSV}
            disabled={isExporting}
            variant="outline"
            className="w-full justify-start"
          >
            <FileSpreadsheet className="mr-2 h-4 w-4" />
            Export as CSV
            <span className="ml-auto text-xs text-gray-500">(Spreadsheet)</span>
          </Button>
        </div>
        {isExporting && (
          <div className="text-center text-sm text-gray-500">
            Generating export...
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
