import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { ProcessedHealthData } from '@/schemas/health';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  Cloud,
  Database,
  Download,
  FileText,
  Key,
  RefreshCw,
  Settings,
  Shield,
  Upload,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type ExportFormat = 'csv' | 'json' | 'xml' | 'fhir';
type DataSyncStatus = 'pending' | 'processing' | 'completed' | 'error';

interface ImportJob {
  id: string;
  filename: string;
  status: DataSyncStatus;
  progress: number;
  recordsProcessed: number;
  totalRecords: number;
  startTime: string;
  endTime?: string;
  errorMessage?: string;
}

interface ExportJob {
  id: string;
  format: ExportFormat;
  status: DataSyncStatus;
  progress: number;
  fileSize?: string;
  downloadUrl?: string;
  startTime: string;
  endTime?: string;
}

interface APIConnection {
  id: string;
  name: string;
  type: 'apple_health' | 'google_fit' | 'fitbit' | 'garmin' | 'custom';
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  dataTypes: string[];
  recordsSynced: number;
  config: Record<string, unknown>;
}

interface DataSyncProps {
  readonly userId: string;
  readonly onDataImported?: (data: ProcessedHealthData[]) => void;
  readonly onExportComplete?: (exportJob: ExportJob) => void;
}

export default function DataSync({
  userId: _userId,
  onDataImported,
  onExportComplete,
}: DataSyncProps) {
  const [activeTab, setActiveTab] = useState('import');
  const [importJobs, setImportJobs] = useState<ImportJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [apiConnections, setApiConnections] = useState<APIConnection[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [exportFormat, setExportFormat] = useState<
    'csv' | 'json' | 'xml' | 'fhir'
  >('csv');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [selectedDataTypes, setSelectedDataTypes] = useState<string[]>(['all']);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize API connections
  useEffect(() => {
    const mockConnections: APIConnection[] = [
      {
        id: 'apple_health',
        name: 'Apple Health',
        type: 'apple_health',
        status: 'connected',
        lastSync: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        dataTypes: ['steps', 'heart_rate', 'walking_steadiness', 'sleep'],
        recordsSynced: 15420,
        config: { autoSync: true, syncInterval: 300 },
      },
      {
        id: 'fitbit',
        name: 'Fitbit',
        type: 'fitbit',
        status: 'disconnected',
        lastSync: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        dataTypes: ['steps', 'heart_rate', 'sleep', 'activity'],
        recordsSynced: 8932,
        config: { autoSync: false },
      },
      {
        id: 'google_fit',
        name: 'Google Fit',
        type: 'google_fit',
        status: 'error',
        lastSync: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
        dataTypes: ['steps', 'activity', 'nutrition'],
        recordsSynced: 3421,
        config: { autoSync: true, syncInterval: 600 },
      },
    ];
    setApiConnections(mockConnections);
  }, []);

  const handleFileUpload = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);

      for (const file of Array.from(files)) {
        const jobId = crypto.randomUUID();
        const newJob: ImportJob = {
          id: jobId,
          filename: file.name,
          status: 'pending',
          progress: 0,
          recordsProcessed: 0,
          totalRecords: 0,
          startTime: new Date().toISOString(),
        };

        setImportJobs((prev) => [...prev, newJob]);

        // Simulate file processing
        try {
          // Update job to processing
          setImportJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: 'processing' as const,
                    totalRecords: Math.floor(Math.random() * 10000) + 1000,
                  }
                : job
            )
          );

          // Simulate processing progress
          for (let progress = 0; progress <= 100; progress += 10) {
            await new Promise((resolve) => setTimeout(resolve, 300));

            setImportJobs((prev) =>
              prev.map((job) =>
                job.id === jobId
                  ? {
                      ...job,
                      progress,
                      recordsProcessed: Math.floor(
                        (progress / 100) * job.totalRecords
                      ),
                    }
                  : job
              )
            );
          }

          // Complete the job
          setImportJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: 'completed' as const,
                    progress: 100,
                    recordsProcessed: job.totalRecords,
                    endTime: new Date().toISOString(),
                  }
                : job
            )
          );

          // Simulate data extraction and callback
          if (onDataImported) {
            // Mock processed data
            const mockData: ProcessedHealthData[] = [];
            onDataImported(mockData);
          }
        } catch (_error) {
          console.error('Failed to process file:', _error);
          setImportJobs((prev) =>
            prev.map((job) =>
              job.id === jobId
                ? {
                    ...job,
                    status: 'error' as const,
                    errorMessage: 'Failed to process file',
                    endTime: new Date().toISOString(),
                  }
                : job
            )
          );
        }
      }

      setIsUploading(false);
    },
    [onDataImported]
  );

  const startExport = useCallback(async () => {
    const jobId = crypto.randomUUID();
    const newJob: ExportJob = {
      id: jobId,
      format: exportFormat,
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
    };

    setExportJobs((prev) => [...prev, newJob]);

    try {
      // Update to processing
      setExportJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: 'processing' as const } : job
        )
      );

      // Simulate export progress
      for (let progress = 0; progress <= 100; progress += 20) {
        await new Promise((resolve) => setTimeout(resolve, 500));

        setExportJobs((prev) =>
          prev.map((job) => (job.id === jobId ? { ...job, progress } : job))
        );
      }

      // Complete export
      const fileSize = Math.floor(Math.random() * 10) + 1;
      setExportJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'completed' as const,
                progress: 100,
                fileSize: `${fileSize}.${Math.floor(Math.random() * 999)}MB`,
                downloadUrl: `#download-${jobId}`,
                endTime: new Date().toISOString(),
              }
            : job
        )
      );

      const completedJob = exportJobs.find((job) => job.id === jobId);
      if (completedJob && onExportComplete) {
        onExportComplete(completedJob);
      }
    } catch (_error) {
      console.error('Failed to export data:', _error);
      setExportJobs((prev) =>
        prev.map((job) =>
          job.id === jobId
            ? {
                ...job,
                status: 'error' as const,
                endTime: new Date().toISOString(),
              }
            : job
        )
      );
    }
  }, [exportFormat, exportJobs, onExportComplete]);

  const syncAPI = useCallback(async (connectionId: string) => {
    setApiConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId
          ? { ...conn, status: 'connected' as const }
          : conn
      )
    );

    // Simulate sync process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setApiConnections((prev) =>
      prev.map((conn) =>
        conn.id === connectionId
          ? {
              ...conn,
              lastSync: new Date().toISOString(),
              recordsSynced:
                conn.recordsSynced + Math.floor(Math.random() * 100) + 10,
            }
          : conn
      )
    );
  }, []);

  const getJobBadgeVariant = (status: DataSyncStatus) => {
    if (status === 'completed') return 'default';
    if (status === 'error') return 'destructive';
    return 'secondary';
  };

  const renderImportJobs = () => (
    <div className="space-y-4">
      {importJobs.map((job) => (
        <Card key={job.id}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span className="font-medium">{job.filename}</span>
              </div>
              <Badge variant={getJobBadgeVariant(job.status)}>
                {job.status === 'completed' && (
                  <CheckCircle className="mr-1 h-3 w-3" />
                )}
                {job.status === 'error' && <XCircle className="mr-1 h-3 w-3" />}
                {job.status === 'processing' && (
                  <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
                )}
                {job.status}
              </Badge>
            </div>

            {job.status === 'processing' && (
              <div className="space-y-2">
                <Progress value={job.progress} className="h-2" />
                <div className="text-muted-foreground flex justify-between text-sm">
                  <span>
                    {job.recordsProcessed.toLocaleString()} /{' '}
                    {job.totalRecords.toLocaleString()} records
                  </span>
                  <span>{job.progress}%</span>
                </div>
              </div>
            )}

            {job.status === 'completed' && (
              <div className="text-muted-foreground text-sm">
                Processed {job.recordsProcessed.toLocaleString()} records in{' '}
                {Math.round(
                  (new Date(job.endTime!).getTime() -
                    new Date(job.startTime).getTime()) /
                    1000
                )}
                s
              </div>
            )}

            {job.status === 'error' && (
              <Alert className="mt-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{job.errorMessage}</AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const renderExportJobs = () => (
    <div className="space-y-4">
      {exportJobs.map((job) => (
        <Card key={job.id}>
          <CardContent className="p-4">
            <div className="mb-2 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Download className="h-4 w-4" />
                <span className="font-medium">
                  Export to {job.format.toUpperCase()}
                </span>
              </div>
              <Badge variant={getJobBadgeVariant(job.status)}>
                {job.status}
              </Badge>
            </div>

            {job.status === 'processing' && (
              <div className="space-y-2">
                <Progress value={job.progress} className="h-2" />
                <div className="text-muted-foreground text-sm">
                  Exporting data... {job.progress}%
                </div>
              </div>
            )}

            {job.status === 'completed' && (
              <div className="flex items-center justify-between">
                <div className="text-muted-foreground text-sm">
                  File size: {job.fileSize}
                </div>
                <Button
                  size="sm"
                  onClick={() => window.open(job.downloadUrl, '_blank')}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const getConnectionBadgeVariant = (status: string) => {
    if (status === 'connected') return 'default';
    if (status === 'error') return 'destructive';
    return 'secondary';
  };

  const renderAPIConnections = () => (
    <div className="space-y-4">
      {apiConnections.map((connection) => (
        <Card key={connection.id}>
          <CardContent className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {connection.type === 'apple_health' && (
                    <Database className="h-5 w-5" />
                  )}
                  {connection.type === 'fitbit' && (
                    <Cloud className="h-5 w-5" />
                  )}
                  {connection.type === 'google_fit' && (
                    <RefreshCw className="h-5 w-5" />
                  )}
                  <span className="font-medium">{connection.name}</span>
                </div>
                <Badge variant={getConnectionBadgeVariant(connection.status)}>
                  {connection.status}
                </Badge>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => syncAPI(connection.id)}
                  disabled={connection.status === 'disconnected'}
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Sync Now
                </Button>
                <Button size="sm" variant="outline">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-4">
              <div>
                <span className="text-muted-foreground">Last Sync</span>
                <div>{new Date(connection.lastSync).toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Records Synced</span>
                <div>{connection.recordsSynced.toLocaleString()}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Data Types</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {connection.dataTypes.slice(0, 3).map((type) => (
                    <Badge key={type} variant="outline" className="text-xs">
                      {type.replace('_', ' ')}
                    </Badge>
                  ))}
                  {connection.dataTypes.length > 3 && (
                    <Badge variant="outline" className="text-xs">
                      +{connection.dataTypes.length - 3}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <span className="text-muted-foreground">Auto Sync</span>
                <div className="mt-1">
                  <Switch
                    checked={connection.config.autoSync as boolean}
                    disabled={connection.status !== 'connected'}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Management</h2>
          <p className="text-muted-foreground">
            Import, export, and sync health data
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            HIPAA Compliant
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1">
            <Key className="h-3 w-3" />
            End-to-End Encrypted
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="import">Import Data</TabsTrigger>
          <TabsTrigger value="export">Export Data</TabsTrigger>
          <TabsTrigger value="apis">API Connections</TabsTrigger>
          <TabsTrigger value="sync">Sync Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="import" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Health Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="border-muted-foreground/25 rounded-lg border-2 border-dashed p-8 text-center">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".xml,.json,.csv,.zip"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  aria-label="Select health data files to upload"
                />
                <Upload className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-medium">
                  Drop files here or click to browse
                </h3>
                <p className="text-muted-foreground mb-4">
                  Supports Apple Health XML, JSON, CSV, and ZIP files
                </p>
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  {isUploading ? (
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Select Files
                </Button>
              </div>

              <div className="grid grid-cols-1 gap-4 text-sm md:grid-cols-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Automatic data validation</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-blue-500" />
                  <span>Encrypted during processing</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-purple-500" />
                  <span>Real-time progress tracking</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {importJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Import History</CardTitle>
              </CardHeader>
              <CardContent>{renderImportJobs()}</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="export" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Export Health Data
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="export-format">Export Format</Label>
                  <Select
                    value={exportFormat}
                    onValueChange={(value: 'csv' | 'json' | 'xml' | 'fhir') =>
                      setExportFormat(value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="csv">CSV (Comma Separated)</SelectItem>
                      <SelectItem value="json">
                        JSON (JavaScript Object)
                      </SelectItem>
                      <SelectItem value="xml">
                        XML (Extensible Markup)
                      </SelectItem>
                      <SelectItem value="fhir">
                        FHIR (Healthcare Standard)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="data-types">Data Types</Label>
                  <Select
                    value={selectedDataTypes[0]}
                    onValueChange={(value) => setSelectedDataTypes([value])}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Data Types</SelectItem>
                      <SelectItem value="steps">Steps Only</SelectItem>
                      <SelectItem value="heart_rate">
                        Heart Rate Only
                      </SelectItem>
                      <SelectItem value="sleep">Sleep Data Only</SelectItem>
                      <SelectItem value="activity">
                        Activity Data Only
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="date-from">From Date</Label>
                  <Input
                    id="date-from"
                    type="date"
                    value={dateRange.from}
                    onChange={(e) =>
                      setDateRange((prev) => ({
                        ...prev,
                        from: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-to">To Date</Label>
                  <Input
                    id="date-to"
                    type="date"
                    value={dateRange.to}
                    onChange={(e) =>
                      setDateRange((prev) => ({ ...prev, to: e.target.value }))
                    }
                  />
                </div>
              </div>

              <Button onClick={startExport} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Start Export
              </Button>
            </CardContent>
          </Card>

          {exportJobs.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Export History</CardTitle>
              </CardHeader>
              <CardContent>{renderExportJobs()}</CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="h-5 w-5" />
                API Connections
              </CardTitle>
            </CardHeader>
            <CardContent>{renderAPIConnections()}</CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <RefreshCw className="h-5 w-5" />
                Sync Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Auto Sync</h3>
                  <p className="text-muted-foreground text-sm">
                    Automatically sync data from connected sources
                  </p>
                </div>
                <Switch
                  checked={syncEnabled}
                  onCheckedChange={setSyncEnabled}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-medium">Sync Schedule</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Sync Frequency</Label>
                    <Select defaultValue="hourly">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="realtime">Real-time</SelectItem>
                        <SelectItem value="hourly">Every Hour</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sync Time</Label>
                    <Input type="time" defaultValue="02:00" />
                  </div>
                </div>
              </div>

              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  All data is encrypted during sync and stored securely. You can
                  revoke API access at any time.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
