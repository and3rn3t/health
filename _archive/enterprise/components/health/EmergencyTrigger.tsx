import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Heart,
  MapPin,
  Phone,
  Shield,
  Siren,
} from 'lucide-react';
import { useState } from 'react';

export function EmergencyTrigger() {
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [emergencyCountdown, setEmergencyCountdown] = useState<number | null>(
    null
  );

  // Extracted card status class to avoid nested ternary
  let cardStatusClass = '';
  if (isEmergencyMode) {
    cardStatusClass = 'border-red-500 bg-red-50';
  } else if (emergencyCountdown) {
    cardStatusClass = 'border-yellow-500 bg-yellow-50';
  }

  const startEmergency = () => {
    setEmergencyCountdown(10);

    const countdown = setInterval(() => {
      setEmergencyCountdown((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(countdown);
          setIsEmergencyMode(true);
          setEmergencyCountdown(null);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const cancelEmergency = () => {
    setEmergencyCountdown(null);
    setIsEmergencyMode(false);
  };

  const mockEmergencyData = {
    location: '123 Main St, City, State',
    medicalInfo: 'Type 1 Diabetes, Blood Pressure Medication',
    emergencyContacts: [
      { name: 'John Doe', relation: 'Son', phone: '(555) 123-4567' },
      { name: 'Jane Smith', relation: 'Daughter', phone: '(555) 987-6543' },
    ],
    lastVitals: {
      heartRate: 95,
      bloodPressure: '140/90',
      timestamp: 'Just now',
    },
  };

  // Extracted card title to avoid nested ternary in JSX
  let cardTitle = '';
  if (isEmergencyMode) {
    cardTitle = 'EMERGENCY ACTIVE';
  } else if (emergencyCountdown) {
    cardTitle = 'Emergency Starting...';
  } else {
    cardTitle = 'Emergency Status';
  }

  return (
    <div className="space-y-6">
      {/*
        Extract the card status class to avoid nested ternary in JSX
      */}
      <Card className={cardStatusClass}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/*
                Extracted icon background class to avoid nested ternary
              */}
              {(() => {
                let iconBgClass = '';
                if (isEmergencyMode) {
                  iconBgClass = 'bg-red-100 text-red-600';
                } else if (emergencyCountdown) {
                  iconBgClass = 'bg-yellow-100 text-yellow-600';
                } else {
                  iconBgClass =
                    'bg-vitalsense-primary/10 text-vitalsense-primary';
                }

                let statusIcon = null;
                if (isEmergencyMode) {
                  statusIcon = <Siren className="h-6 w-6" />;
                } else if (emergencyCountdown) {
                  statusIcon = <AlertTriangle className="h-6 w-6" />;
                } else {
                  statusIcon = <Shield className="h-6 w-6" />;
                }

                return (
                  <div className={`rounded-lg p-2 ${iconBgClass}`}>
                    {statusIcon}
                  </div>
                );
              })()}
              <div>
                <CardTitle className="text-xl">{cardTitle}</CardTitle>
                <CardDescription>
                  {isEmergencyMode
                    ? 'Emergency services have been contacted'
                    : emergencyCountdown
                      ? `Canceling in ${emergencyCountdown} seconds`
                      : 'System ready for emergency activation'}
                </CardDescription>
              </div>
            </div>
            <Badge
              className={
                isEmergencyMode
                  ? 'bg-red-100 text-red-800'
                  : emergencyCountdown
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
              }
            >
              {isEmergencyMode
                ? 'ACTIVE'
                : emergencyCountdown
                  ? 'PENDING'
                  : 'READY'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {!isEmergencyMode && !emergencyCountdown && (
            <Button
              onClick={startEmergency}
              size="lg"
              className="w-full bg-red-600 text-white hover:bg-red-700"
            >
              <AlertTriangle className="mr-2 h-5 w-5" />
              EMERGENCY - CALL FOR HELP
            </Button>
          )}

          {emergencyCountdown && (
            <div className="space-y-4">
              <div className="text-center">
                <div className="mb-2 text-4xl font-bold text-yellow-600">
                  {emergencyCountdown}
                </div>
                <p className="text-muted-foreground text-sm">
                  Emergency services will be contacted automatically
                </p>
              </div>
              <Button
                onClick={cancelEmergency}
                variant="outline"
                className="w-full"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Cancel Emergency
              </Button>
            </div>
          )}

          {isEmergencyMode && (
            <div className="space-y-4">
              <div className="rounded-lg bg-red-100 p-4">
                <p className="mb-2 font-medium text-red-800">
                  Emergency services contacted at{' '}
                  {new Date().toLocaleTimeString()}
                </p>
                <p className="text-sm text-red-700">
                  Help is on the way. Stay calm and follow any instructions from
                  emergency responders.
                </p>
              </div>
              <Button
                onClick={cancelEmergency}
                variant="outline"
                className="w-full"
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark as Resolved
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Access Information */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-vitalsense-primary" />
              Current Location
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-medium">{mockEmergencyData.location}</p>
            <p className="text-muted-foreground mt-1 text-sm">
              GPS coordinates will be shared with emergency services
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Heart className="h-5 w-5 text-vitalsense-primary" />
              Current Vitals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  Heart Rate:
                </span>
                <span className="font-medium">
                  {mockEmergencyData.lastVitals.heartRate} BPM
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  Blood Pressure:
                </span>
                <span className="font-medium">
                  {mockEmergencyData.lastVitals.bloodPressure} mmHg
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground text-sm">
                  Last Updated:
                </span>
                <span className="font-medium">
                  {mockEmergencyData.lastVitals.timestamp}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Emergency Contacts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-vitalsense-primary" />
            Emergency Contacts
          </CardTitle>
          <CardDescription>
            These contacts will be notified automatically during an emergency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {mockEmergencyData.emergencyContacts.map((contact, index) => (
              <div
                key={index}
                className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
              >
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-muted-foreground text-sm">
                    {contact.relation}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{contact.phone}</span>
                  <Button size="sm" variant="outline">
                    <Phone className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Medical Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-vitalsense-primary" />
            Medical Information
          </CardTitle>
          <CardDescription>
            Critical medical information shared with emergency responders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-3">
            <p className="text-sm font-medium">
              {mockEmergencyData.medicalInfo}
            </p>
          </div>
          <div className="mt-4 flex gap-2">
            <Button size="sm" variant="outline" className="flex-1">
              Update Medical Info
            </Button>
            <Button size="sm" variant="outline" className="flex-1">
              Add Allergies
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-vitalsense-primary" />
            Emergency Settings
          </CardTitle>
          <CardDescription>
            Configure how the emergency system responds
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <Button variant="outline">Auto-Call Delay: 10s</Button>
            <Button variant="outline">GPS Sharing: Enabled</Button>
            <Button variant="outline">Medical Data: Enabled</Button>
            <Button variant="outline">Test Emergency System</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default EmergencyTrigger;
