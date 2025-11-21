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
import { Progress } from '@/components/ui/progress';
import { useDeviceManagement, type DeviceScanResult } from '@/hooks/useDeviceManagement';
import {
  AlertCircle,
  Bluetooth,
  CheckCircle2,
  Loader2,
  Radio,
  Smartphone,
  Watch,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface DeviceSetupWizardProps {
  onComplete?: () => void;
  onCancel?: () => void;
  skipOnComplete?: boolean;
}

export function DeviceSetupWizard({
  onComplete,
  onCancel,
  skipOnComplete = false,
}: DeviceSetupWizardProps) {
  const {
    scanForDevices,
    connectDevice,
    isScanning,
    scanResults,
    hasConnectedDevices,
  } = useDeviceManagement();

  const [step, setStep] = useState<'intro' | 'scanning' | 'selecting' | 'connecting' | 'complete'>('intro');
  const [selectedDevice, setSelectedDevice] = useState<DeviceScanResult | null>(null);
  const [connectionProgress, setConnectionProgress] = useState(0);

  // Auto-start scanning when entering scanning step
  useEffect(() => {
    if (step === 'scanning' && !isScanning && scanResults.length === 0) {
      scanForDevices().catch((error) => {
        console.error('Scan error:', error);
        // Stay on scanning step to show error state
      });
    }
  }, [step, isScanning, scanResults.length, scanForDevices]);

  // Move to selecting step when scan completes
  useEffect(() => {
    if (step === 'scanning' && !isScanning && scanResults.length > 0) {
      setStep('selecting');
    } else if (step === 'scanning' && !isScanning && scanResults.length === 0) {
      // If scan completed with no results, show message
      // User can try again or skip
    }
  }, [step, isScanning, scanResults.length]);

  const handleStartScan = async () => {
    setStep('scanning');
    await scanForDevices();
  };

  const handleSelectDevice = (device: DeviceScanResult) => {
    setSelectedDevice(device);
    setStep('connecting');
  };

  const handleConnect = async () => {
    if (!selectedDevice) return;

    setConnectionProgress(0);
    const progressInterval = setInterval(() => {
      setConnectionProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    try {
      await connectDevice(selectedDevice);
      setConnectionProgress(100);
      setTimeout(() => {
        setStep('complete');
        if (onComplete && skipOnComplete) {
          onComplete();
        }
      }, 500);
    } catch (error) {
      console.error('Connection error:', error);
      setStep('selecting');
      setSelectedDevice(null);
    } finally {
      clearInterval(progressInterval);
    }
  };

  const handleSkip = () => {
    if (onCancel) {
      onCancel();
    } else if (onComplete) {
      onComplete();
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'apple_watch':
      case 'watch':
        return Watch;
      case 'iphone':
      case 'phone':
        return Smartphone;
      default:
        return Bluetooth;
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Connect Your Devices</CardTitle>
            <CardDescription className="mt-2">
              Connect your health monitoring devices to enable real-time tracking
            </CardDescription>
          </div>
          {onCancel && (
            <Button variant="ghost" size="icon" onClick={handleSkip}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step Progress Indicator */}
        <div className="flex items-center justify-between mb-6">
          {['intro', 'scanning', 'selecting', 'connecting', 'complete'].map(
            (s, index) => (
              <div key={s} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    step === s
                      ? 'border-vitalsense-primary bg-vitalsense-primary text-white'
                      : ['intro', 'scanning', 'selecting', 'connecting', 'complete'].indexOf(step) >
                        index
                      ? 'border-green-500 bg-green-500 text-white'
                      : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {['intro', 'scanning', 'selecting', 'connecting', 'complete'].indexOf(step) >
                  index ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < 4 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 ${
                      ['intro', 'scanning', 'selecting', 'connecting', 'complete'].indexOf(step) >
                      index
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>
            )
          )}
        </div>

        {/* Intro Step */}
        {step === 'intro' && (
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Make sure your device is nearby and Bluetooth is enabled. For iOS
                devices, ensure HealthKit permissions are granted.
              </AlertDescription>
            </Alert>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">Supported Devices</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Watch className="h-4 w-4 text-muted-foreground" />
                    <span>Apple Watch</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="h-4 w-4 text-muted-foreground" />
                    <span>iPhone / iPad</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                    <span>Bluetooth Health Devices</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg">What You Can Track</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>• Heart rate & activity</div>
                  <div>• Steps & walking patterns</div>
                  <div>• Fall risk indicators</div>
                  <div>• Real-time health metrics</div>
                </CardContent>
              </Card>
            </div>

            <div className="flex gap-3">
              <Button onClick={handleStartScan} className="flex-1">
                <Bluetooth className="mr-2 h-4 w-4" />
                Start Scanning
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div className="space-y-4 text-center py-8">
            <div className="relative">
              <Bluetooth className="h-16 w-16 mx-auto text-vitalsense-primary animate-pulse" />
              <Radio className="h-8 w-8 mx-auto mt-4 text-muted-foreground animate-pulse" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Scanning for devices...</h3>
              <p className="text-sm text-muted-foreground">
                {isScanning
                  ? 'Searching for iOS devices and Bluetooth health devices...'
                  : 'Make sure your iOS app is running and connected to the same account'}
              </p>
            </div>
            {isScanning && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Searching for available devices</span>
              </div>
            )}
            {!isScanning && scanResults.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No devices found. Make sure:
                  <ul className="list-disc list-inside mt-2 text-left">
                    <li>Your iOS VitalSense app is running</li>
                    <li>The app is connected to the same account</li>
                    <li>Bluetooth is enabled (for physical devices)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}

        {/* Selecting Step */}
        {step === 'selecting' && (
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Found {scanResults.length} device{scanResults.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Select a device to connect
              </p>
            </div>

            <div className="space-y-3 max-h-96 overflow-y-auto">
              {scanResults.map((device) => {
                const IconComponent = getDeviceIcon(device.type);
                return (
                  <Card
                    key={device.id}
                    className="cursor-pointer hover:border-vitalsense-primary transition-colors"
                    onClick={() => handleSelectDevice(device)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="bg-vitalsense-primary/10 rounded-lg p-3 text-vitalsense-primary">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm text-muted-foreground capitalize">
                          {device.type.replace('-', ' ')}
                          {device.model && ` • ${device.model}`}
                        </div>
                        {device.signalStrength && (
                          <div className="text-xs text-muted-foreground mt-1">
                            Signal: {device.signalStrength}%
                          </div>
                        )}
                      </div>
                      {device.isPaired && (
                        <Badge variant="secondary" className="text-xs">
                          Paired
                        </Badge>
                      )}
                      <Button size="sm" variant="outline">
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={handleStartScan}
                className="flex-1"
                disabled={isScanning}
              >
                {isScanning ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Scan Again'
                )}
              </Button>
              <Button variant="outline" onClick={handleSkip} disabled={isScanning}>
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Connecting Step */}
        {step === 'connecting' && selectedDevice && (
          <div className="space-y-4 text-center py-8">
            <div className="bg-vitalsense-primary/10 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
              {(() => {
                const IconComponent = getDeviceIcon(selectedDevice.type);
                return <IconComponent className="h-12 w-12 text-vitalsense-primary" />;
              })()}
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">
                Connecting to {selectedDevice.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                This may take a few seconds...
              </p>
            </div>
            <Progress value={connectionProgress} className="max-w-md mx-auto" />
            <div className="text-sm text-muted-foreground">
              {connectionProgress < 30 && 'Initializing connection...'}
              {connectionProgress >= 30 && connectionProgress < 60 && 'Pairing device...'}
              {connectionProgress >= 60 && connectionProgress < 90 && 'Syncing data...'}
              {connectionProgress >= 90 && 'Almost done...'}
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="space-y-4 text-center py-8">
            <div className="bg-green-100 rounded-full p-6 w-24 h-24 mx-auto flex items-center justify-center">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">Device Connected!</h3>
              <p className="text-sm text-muted-foreground">
                {selectedDevice?.name} is now connected and ready to use
              </p>
            </div>

            {hasConnectedDevices && (
              <Alert className="text-left">
                <CheckCircle2 className="h-4 w-4" />
                <AlertDescription>
                  You can connect more devices anytime from the Devices page.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex gap-3 justify-center">
              {!skipOnComplete && (
                <Button onClick={() => setStep('intro')} variant="outline">
                  Connect Another Device
                </Button>
              )}
              {onComplete && (
                <Button onClick={onComplete}>
                  {hasConnectedDevices ? 'Done' : 'Continue'}
                </Button>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
