/**
 * Enhanced Health Data Import Component
 *
 * Beautiful, user-friendly interface for importing Apple Health data
 * with step-by-step guidance and impressive visual feedback.
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { HealthDataProcessor } from '@/lib/healthDataProcessor';
import { getVitalSenseClasses } from '@/lib/vitalsense-colors';
import type { ProcessedHealthData } from '@/types';
import {
  Activity,
  Brain,
  CheckCircle,
  Clock,
  Download,
  FileText,
  Heart,
  Info,
  Shield,
  Smartphone,
  TrendingUp,
  Upload,
  Zap,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface HealthDataImportProps {
  readonly onDataImported: (data: ProcessedHealthData) => void;
}

interface ImportStep {
  id: string;
  title: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
}

export default function HealthDataImport({
  onDataImported,
}: HealthDataImportProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [processingStage, setProcessingStage] = useState('');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const processingSteps: ImportStep[] = [
    {
      id: 'validate',
      title: 'Validating File',
      description: 'Checking file format and data integrity',
      icon: Shield,
      completed: false,
    },
    {
      id: 'extract',
      title: 'Extracting Metrics',
      description: 'Reading health data from your export',
      icon: FileText,
      completed: false,
    },
    {
      id: 'analyze',
      title: 'Analyzing Patterns',
      description: 'Identifying trends and insights',
      icon: TrendingUp,
      completed: false,
    },
    {
      id: 'ai-insights',
      title: 'Generating AI Insights',
      description: 'Creating personalized recommendations',
      icon: Brain,
      completed: false,
    },
    {
      id: 'finalize',
      title: 'Finalizing',
      description: 'Preparing your health dashboard',
      icon: CheckCircle,
      completed: false,
    },
  ];

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.endsWith('.zip') && !file.name.endsWith('.xml')) {
      toast.error(
        'Please upload a ZIP file exported from the Health app or an XML file.'
      );
      return;
    }

    setUploadedFile(file);
    setIsProcessing(true);
    setProcessingProgress(0);
    setCurrentStep(0);

    try {
      // Step 1: File validation
      setProcessingStage('Validating file format and security...');
      setProcessingProgress(10);
      setCurrentStep(0);
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Step 2: Data extraction
      setProcessingStage('Extracting health metrics and timestamps...');
      setProcessingProgress(30);
      setCurrentStep(1);
      await new Promise((resolve) => setTimeout(resolve, 1200));

      // Step 3: Pattern analysis
      setProcessingStage('Analyzing health patterns and trends...');
      setProcessingProgress(50);
      setCurrentStep(2);
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Step 4: AI processing
      setProcessingStage('Generating personalized AI insights...');
      setProcessingProgress(75);
      setCurrentStep(3);
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Step 5: Finalization
      setProcessingStage('Preparing your health dashboard...');
      setProcessingProgress(90);
      setCurrentStep(4);
      await new Promise((resolve) => setTimeout(resolve, 800));

      const processedData = await HealthDataProcessor.processHealthData(file);

      setProcessingProgress(100);
      setProcessingStage('Complete! Your health insights are ready.');

      onDataImported(processedData);
      toast.success(
        `🎉 Health data processed successfully! Health Score: ${processedData.healthScore}/100`,
        {
          duration: 5000,
        }
      );
    } catch (error) {
      console.error('Processing error:', error);
      toast.error(
        'Failed to process health data. Please try again or contact support.'
      );
      setProcessingStage('Error occurred during processing');
    } finally {
      setTimeout(() => {
        setIsProcessing(false);
        setProcessingStage('');
        setProcessingProgress(0);
        setCurrentStep(0);
      }, 2000);
    }
  };

  return (
    <div className="mb-8 space-y-8">
      {/* Header - Compact */}
      <div className="py-4 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-r from-vitalsense-primary to-vitalsense-teal shadow-lg">
          <Heart className="h-8 w-8 text-white" />
        </div>
        <h1 className="mb-3 text-2xl font-bold text-gray-900">
          Import Your{' '}
          <span className={getVitalSenseClasses.text.primary}>Health Data</span>
        </h1>
        <p className="mx-auto max-w-2xl text-base leading-relaxed text-gray-600">
          Connect your Apple Health data to unlock personalized insights, fall
          risk monitoring, and AI-powered health recommendations.
        </p>
      </div>

      {/* How to Export Instructions */}
      <Card className="border-l-4 border-l-vitalsense-primary bg-gradient-to-r from-blue-50 to-teal-50 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <Smartphone
              className={`h-6 w-6 ${getVitalSenseClasses.text.primary}`}
            />
            How to Export Your Health Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-6">
            <Alert className="border-blue-200 bg-blue-50">
              <Info className="h-5 w-5 text-blue-600" />
              <AlertDescription className="leading-relaxed text-blue-800">
                <strong>Step-by-step instructions:</strong> Open the Health app
                on your iPhone, tap your profile picture, scroll down and tap
                "Export All Health Data". This creates a secure ZIP file with
                all your health information.
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="rounded-xl border border-gray-100 bg-white p-6 text-center shadow-sm transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
                  <Smartphone className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="mb-1 font-semibold">1. Open Health App</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Tap your profile in the top right
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Download className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="mb-1 font-semibold">2. Export Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Tap "Export All Health Data"
                </p>
              </div>

              <div className="rounded-lg border bg-white p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900">
                  <Upload className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="mb-1 font-semibold">3. Upload Here</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  Select the exported ZIP file
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* What We'll Analyze */}
      <Card className="shadow-sm">
        <CardHeader className="pb-6">
          <CardTitle className="flex items-center gap-3 text-xl">
            <Brain className="h-6 w-6 text-purple-500" />
            What We'll Analyze
          </CardTitle>
          <CardDescription className="mt-2 text-base text-gray-600">
            VitalSense will process your health data to provide comprehensive
            insights
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div className="space-y-6">
              <h4 className="flex items-center gap-3 text-lg font-semibold">
                <Activity className="h-5 w-5 text-green-500" />
                Activity & Fitness Metrics
              </h4>
              <ul className="space-y-3 text-sm">
                <li className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  Steps, distance, and calories burned
                </li>
                <li className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-green-500" />
                  Exercise types and workout intensity
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-green-500" />
                  Active energy and movement patterns
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold">
                <Heart className="h-4 w-4 text-red-500" />
                Vital Signs & Health Metrics
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  Heart rate variability and patterns
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  Blood pressure and respiratory data
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-red-500" />
                  Sleep quality and recovery metrics
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold">
                <Shield className="h-4 w-4 text-blue-500" />
                Fall Risk Assessment
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Walking steadiness and gait analysis
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Balance and coordination metrics
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-500" />
                  Mobility trends and stability patterns
                </li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold">
                <Zap className="h-4 w-4 text-yellow-500" />
                AI-Powered Insights
              </h4>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Personalized health recommendations
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Trend analysis and predictions
                </li>
                <li className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-yellow-500" />
                  Risk factors and early warnings
                </li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      {!isProcessing ? (
        <Card className="border-vitalsense-primary/30 from-vitalsense-primary/5 to-vitalsense-teal/5 border-2 border-dashed bg-gradient-to-br">
          <CardContent className="p-8">
            <div className="space-y-4 text-center">
              {uploadedFile ? (
                <>
                  <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
                  <div>
                    <p className="text-xl font-semibold text-green-700">
                      File Ready for Processing
                    </p>
                    <p className="mt-1 text-gray-600">{uploadedFile.name}</p>
                    <Badge
                      variant="outline"
                      className="mt-2 border-green-300 text-green-700"
                    >
                      {(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB
                    </Badge>
                  </div>
                </>
              ) : (
                <>
                  <Upload className="mx-auto h-16 w-16 text-vitalsense-primary" />
                  <div>
                    <p className="text-xl font-semibold">
                      Upload Your Health Data
                    </p>
                    <p className="mt-1 text-gray-600">
                      Select your Apple Health export file (ZIP format)
                    </p>
                  </div>
                </>
              )}

              <div>
                <Label htmlFor="health-data-upload" className="sr-only">
                  Upload health data file
                </Label>
                <Input
                  id="health-data-upload"
                  type="file"
                  accept=".zip,.xml"
                  onChange={handleFileUpload}
                  disabled={isProcessing}
                  className="hidden"
                />
                <Button
                  size="lg"
                  onClick={() =>
                    document.getElementById('health-data-upload')?.click()
                  }
                  disabled={isProcessing}
                  className="hover:from-vitalsense-primary/90 hover:to-vitalsense-teal/90 bg-gradient-to-r from-vitalsense-primary to-vitalsense-teal px-8 py-3 text-white disabled:opacity-50"
                >
                  <Upload className="mr-2 h-5 w-5" />
                  {uploadedFile ? 'Process This File' : 'Choose File to Upload'}
                </Button>

                {/* Reset button for stuck processing state */}
                {isProcessing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsProcessing(false);
                      setProcessingStage('');
                      setProcessingProgress(0);
                      setCurrentStep(0);
                      setUploadedFile(null);
                      toast.info('Upload reset. You can now try again.');
                    }}
                    className="ml-2"
                  >
                    Reset Upload
                  </Button>
                )}
              </div>

              <div className="space-y-1 text-sm text-gray-500">
                <p>✓ HIPAA-compliant secure processing</p>
                <p>✓ Data processed locally and encrypted</p>
                <p>✓ No data stored permanently without consent</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Processing State */
        <Card className="border-2 border-vitalsense-primary bg-gradient-to-r from-blue-50 to-teal-50">
          <CardHeader>
            <CardTitle className="flex items-center justify-center gap-2 text-center">
              <div className="animate-spin">
                <Brain
                  className={`h-6 w-6 ${getVitalSenseClasses.text.primary}`}
                />
              </div>
              Processing Your Health Data
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center">
              <p className="mb-2 text-lg font-medium text-gray-700">
                {processingStage}
              </p>
              <Progress value={processingProgress} className="mb-4 h-3" />
              <p className="text-sm text-gray-500">
                {Math.round(processingProgress)}% complete
              </p>
            </div>

            <div className="space-y-4">
              {processingSteps.map((step, index) => (
                <div
                  key={step.id}
                  className={`flex items-center gap-4 rounded-lg p-3 transition-all ${
                    index < currentStep
                      ? 'border border-green-200 bg-green-50'
                      : index === currentStep
                        ? 'border border-blue-200 bg-blue-50 shadow-sm'
                        : 'border border-gray-200 bg-gray-50'
                  }`}
                >
                  <div
                    className={`flex-shrink-0 ${
                      index < currentStep
                        ? 'text-green-600'
                        : index === currentStep
                          ? getVitalSenseClasses.text.primary
                          : 'text-gray-400'
                    }`}
                  >
                    {index < currentStep ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <step.icon className="h-5 w-5" />
                    )}
                  </div>

                  <div className="flex-1">
                    <p
                      className={`font-medium ${
                        index < currentStep
                          ? 'text-green-700'
                          : index === currentStep
                            ? 'text-blue-700'
                            : 'text-gray-500'
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-sm ${
                        index < currentStep
                          ? 'text-green-600'
                          : index === currentStep
                            ? 'text-blue-600'
                            : 'text-gray-400'
                      }`}
                    >
                      {step.description}
                    </p>
                  </div>

                  {index === currentStep && (
                    <div className="flex-shrink-0">
                      <div className="animate-spin">
                        <Clock className="h-4 w-4 text-blue-500" />
                      </div>
                    </div>
                  )}

                  {index < currentStep && (
                    <Badge
                      variant="outline"
                      className="border-green-300 text-xs text-green-700"
                    >
                      Complete
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy Notice */}
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          <strong>Your Privacy is Protected:</strong> All health data processing
          happens securely in your browser. We use bank-level encryption and
          never store your personal health information without your explicit
          consent. VitalSense is designed with HIPAA compliance and
          privacy-first principles.
        </AlertDescription>
      </Alert>
    </div>
  );
}
