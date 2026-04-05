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
import {
  useDeviceManagement,
  type DeviceScanResult,
  type DeviceType,
} from '@/hooks/useDeviceManagement';
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
    connectBluetoothDevice,
    addManualDevice,
    isScanning,
    scanResults,
    hasConnectedDevices,
  } = useDeviceManagement();

  // Check if we should show connection options directly
  const [step, setStep] = useState<
    'intro' | 'scanning' | 'selecting' | 'connecting' | 'manual' | 'complete'
  >(() => {
    if (typeof window !== 'undefined') {
      const showOptions = sessionStorage.getItem('show-connection-options');
      if (showOptions === 'bluetooth') {
        sessionStorage.removeItem('show-connection-options');
        return 'scanning';
      }
      if (showOptions === 'ios') {
        sessionStorage.removeItem('show-connection-options');
        return 'scanning';
      }
      if (showOptions === 'true') {
        sessionStorage.removeItem('show-connection-options');
        // Show intro with all options
      }
    }
    return 'intro';
  });
  const [selectedDevice, setSelectedDevice] = useState<DeviceScanResult | null>(
    null
  );
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [manualDeviceName, setManualDeviceName] = useState('');
  const [manualDeviceType, setManualDeviceType] =
    useState<DeviceType>('health_app');

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

  const _handleConnect = async () => {
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
      // Check if this is a Bluetooth device that needs direct connection
      const isBluetoothDevice =
        selectedDevice.type !== 'iphone' &&
        selectedDevice.type !== 'apple_watch' &&
        selectedDevice.type !== 'ipad';

      if (isBluetoothDevice && connectBluetoothDevice) {
        await connectBluetoothDevice(selectedDevice.id);
      } else {
        await connectDevice(selectedDevice);
      }

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

  const handleAddManual = () => {
    if (!manualDeviceName.trim()) {
      return;
    }

    addManualDevice({
      name: manualDeviceName,
      type: manualDeviceType,
      connectionMethod: 'manual',
    });

    setStep('complete');
    if (onComplete && skipOnComplete) {
      onComplete();
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
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Connect Your Devices</CardTitle>
            <CardDescription className="mt-2">
              Connect your health monitoring devices to enable real-time
              tracking
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
        <div className="mb-6 flex items-center justify-between">
          {['intro', 'scanning', 'selecting', 'connecting', 'complete'].map(
            (s, index) => (
              <div key={s} className="flex flex-1 items-center">
                <div
                  className={`flex h-8 w-8 items-center justify-center rounded-full border-2 ${
                    step === s
                      ? 'border-vitalsense-primary bg-vitalsense-primary text-white'
                      : [
                            'intro',
                            'scanning',
                            'selecting',
                            'connecting',
                            'complete',
                          ].indexOf(step) > index
                        ? 'border-green-500 bg-green-500 text-white'
                        : 'border-gray-300 bg-white text-gray-400'
                  }`}
                >
                  {[
                    'intro',
                    'scanning',
                    'selecting',
                    'connecting',
                    'complete',
                  ].indexOf(step) > index ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < 4 && (
                  <div
                    className={`mx-2 h-0.5 flex-1 ${
                      [
                        'intro',
                        'scanning',
                        'selecting',
                        'connecting',
                        'complete',
                      ].indexOf(step) > index
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
                Make sure your device is nearby and Bluetooth is enabled. For
                iOS devices, ensure HealthKit permissions are granted.
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
              <Button variant="outline" onClick={() => setStep('manual')}>
                Add Manually
              </Button>
              <Button variant="outline" onClick={handleSkip}>
                Skip for now
              </Button>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div className="space-y-4 py-8 text-center">
            <div className="relative">
              <Bluetooth className="mx-auto h-16 w-16 animate-pulse text-vitalsense-primary" />
              <Radio className="mx-auto mt-4 h-8 w-8 animate-pulse text-muted-foreground" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Scanning for devices...
              </h3>
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
                  <ul className="mt-2 list-inside list-disc text-left">
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
              <h3 className="mb-2 text-lg font-semibold">
                Found {scanResults.length} device
                {scanResults.length !== 1 ? 's' : ''}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Select a device to connect
              </p>
            </div>

            <div className="max-h-96 space-y-3 overflow-y-auto">
              {scanResults.map((device) => {
                const IconComponent = getDeviceIcon(device.type);
                return (
                  <Card
                    key={device.id}
                    className="cursor-pointer transition-colors hover:border-vitalsense-primary"
                    onClick={() => handleSelectDevice(device)}
                  >
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="rounded-lg bg-vitalsense-primary/10 p-3 text-vitalsense-primary">
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{device.name}</div>
                        <div className="text-sm capitalize text-muted-foreground">
                          {device.type.replace('-', ' ')}
                          {device.model && ` • ${device.model}`}
                        </div>
                        {device.signalStrength && (
                          <div className="mt-1 text-xs text-muted-foreground">
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
              <Button
                variant="outline"
                onClick={handleSkip}
                disabled={isScanning}
              >
                Skip
              </Button>
            </div>
          </div>
        )}

        {/* Connecting Step */}
        {step === 'connecting' && selectedDevice && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-vitalsense-primary/10 p-6">
              {(() => {
                const IconComponent = getDeviceIcon(selectedDevice.type);
                return (
                  <IconComponent className="h-12 w-12 text-vitalsense-primary" />
                );
              })()}
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Connecting to {selectedDevice.name}
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                This may take a few seconds...
              </p>
            </div>
            <Progress value={connectionProgress} className="mx-auto max-w-md" />
            <div className="text-sm text-muted-foreground">
              {connectionProgress < 30 && 'Initializing connection...'}
              {connectionProgress >= 30 &&
                connectionProgress < 60 &&
                'Pairing device...'}
              {connectionProgress >= 60 &&
                connectionProgress < 90 &&
                'Syncing data...'}
              {connectionProgress >= 90 && 'Almost done...'}
            </div>
          </div>
        )}

        {/* Manual Device Entry Step */}
        {step === 'manual' && (
          <div className="space-y-4">
            <div>
              <h3 className="mb-2 text-lg font-semibold">
                Add Device Manually
              </h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Add a device that doesn't require the iOS app or Bluetooth
                scanning
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Device Name
                </label>
                <input
                  type="text"
                  value={manualDeviceName}
                  onChange={(e) => setManualDeviceName(e.target.value)}
                  placeholder="e.g., My Fitness Tracker"
                  className="w-full rounded-md border px-3 py-2"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">
                  Device Type
                </label>
                <select
                  value={manualDeviceType}
                  onChange={(e) =>
                    setManualDeviceType(e.target.value as DeviceType)
                  }
                  className="w-full rounded-md border px-3 py-2"
                  aria-label="Device Type"
                >
                  <option value="health_app">Health App</option>
                  <option value="iphone">iPhone</option>
                  <option value="apple_watch">Apple Watch</option>
                  <option value="ipad">iPad</option>
                  <option value="scale">Scale</option>
                  <option value="blood-pressure">Blood Pressure Monitor</option>
                  <option value="glucose">Glucose Monitor</option>
                  <option value="smart_home">Smart Home Device</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={handleAddManual}
                className="flex-1"
                disabled={!manualDeviceName.trim()}
              >
                Add Device
              </Button>
              <Button variant="outline" onClick={() => setStep('intro')}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Complete Step */}
        {step === 'complete' && (
          <div className="space-y-4 py-8 text-center">
            <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-green-100 p-6">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
            <div>
              <h3 className="mb-2 text-lg font-semibold">Device Connected!</h3>
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

            <div className="flex justify-center gap-3">
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
