import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { Calendar, Download, FileText, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ExportDataProps {
  readonly healthData?: ProcessedHealthData;
}

export function ExportData({ healthData }: ExportDataProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'json' | 'csv' | 'pdf') => {
    setIsExporting(true);

    // Simulate export process
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // In a real app, this would generate and download the file
    console.log(`Exporting data in ${format} format...`);

    setIsExporting(false);
  };

  const exportOptions = [
    {
      id: 'json',
      title: 'JSON Export',
      description: 'Raw data in JSON format for developers',
      icon: FileText,
      extension: '.json',
      size: healthData ? '~2.3 MB' : '~0 KB',
    },
    {
      id: 'csv',
      title: 'CSV Export',
      description: 'Spreadsheet-compatible format',
      icon: FileText,
      extension: '.csv',
      size: healthData ? '~1.8 MB' : '~0 KB',
    },
    {
      id: 'pdf',
      title: 'PDF Report',
      description: 'Formatted health summary report',
      icon: FileText,
      extension: '.pdf',
      size: healthData ? '~5.1 MB' : '~0 KB',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Health Data</h1>
        <p className="text-muted-foreground mt-2">
          Download your health data in various formats for backup or sharing
          with healthcare providers.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {exportOptions.map((option) => {
          const IconComponent = option.icon;
          return (
            <Card key={option.id} className="relative">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-vitalsense-primary/10 rounded-lg p-2 text-vitalsense-primary">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{option.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {option.extension}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="mt-2">
                  {option.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      Estimated size:
                    </span>
                    <span className="font-medium">{option.size}</span>
                  </div>

                  <Button
                    onClick={() =>
                      handleExport(option.id as 'json' | 'csv' | 'pdf')
                    }
                    disabled={!healthData || isExporting}
                    className="w-full"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    {isExporting ? 'Exporting...' : 'Export'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Share2 className="h-5 w-5 text-vitalsense-primary" />
            <CardTitle>Sharing Options</CardTitle>
          </div>
          <CardDescription>
            Additional ways to share your health data securely
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline" disabled={!healthData}>
              <Calendar className="mr-2 h-4 w-4" />
              Generate Report Link
            </Button>
            <Button variant="outline" disabled={!healthData}>
              <FileText className="mr-2 h-4 w-4" />
              Email to Doctor
            </Button>
          </div>

          {!healthData && (
            <div className="text-muted-foreground bg-muted/50 rounded-lg p-4 text-center">
              <p>Import health data first to enable export options</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default ExportData;
