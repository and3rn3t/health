/**
 * Emergency Notification History Component
 * Displays history of emergency events and notifications
 */

import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  MapPin,
  Phone,
  X,
} from 'lucide-react';
import type { EmergencyEvent, EmergencyContact } from '@/lib/emergencyContacts';

interface EmergencyNotificationHistoryProps {
  events: EmergencyEvent[];
  contacts: EmergencyContact[];
}

export default function EmergencyNotificationHistory({
  events,
  contacts,
}: EmergencyNotificationHistoryProps) {
  const getContactName = (contactId: string) => {
    return contacts.find((c) => c.id === contactId)?.name || 'Unknown Contact';
  };

  const getEventTypeLabel = (type: EmergencyEvent['type']) => {
    switch (type) {
      case 'fall_detected':
        return 'Fall Detected';
      case 'fall_risk_high':
        return 'High Fall Risk';
      case 'manual_trigger':
        return 'Manual Trigger';
      case 'medical_emergency':
        return 'Medical Emergency';
      default:
        return type;
    }
  };

  const getSeverityColor = (severity: EmergencyEvent['severity']) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'moderate':
        return 'bg-yellow-500';
      case 'low':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getNotificationStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'read':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <X className="h-4 w-4 text-red-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return null;
    }
  };

  if (events.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <AlertTriangle className="text-gray-400 mx-auto mb-4 h-16 w-16" />
          <h3 className="text-lg font-semibold mb-2">No Emergency Events</h3>
          <p className="text-gray-600">
            Emergency events and notifications will appear here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {events.map((event) => (
        <Card key={event.id} className={event.cancelled ? 'opacity-60' : ''}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  {event.cancelled ? (
                    <X className="h-5 w-5 text-gray-500" />
                  ) : event.resolved ? (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-red-600" />
                  )}
                  {getEventTypeLabel(event.type)}
                </CardTitle>
                <CardDescription>
                  {event.timestamp.toLocaleString()}
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getSeverityColor(event.severity)}>
                  {event.severity.toUpperCase()}
                </Badge>
                {event.cancelled && <Badge variant="outline">Cancelled</Badge>}
                {event.resolved && <Badge variant="outline">Resolved</Badge>}
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {event.location && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {event.location.address ||
                    `${event.location.latitude.toFixed(4)}, ${event.location.longitude.toFixed(4)}`}
                </span>
              </div>
            )}

            {event.cancelled && event.cancelledAt && (
              <div className="bg-yellow-50 rounded-lg p-3 text-sm text-yellow-800">
                <strong>Cancelled:</strong> {event.cancelledAt.toLocaleString()}
              </div>
            )}

            {event.resolved && event.resolvedAt && (
              <div className="bg-green-50 rounded-lg p-3 text-sm text-green-800">
                <strong>Resolved:</strong> {event.resolvedAt.toLocaleString()}
              </div>
            )}

            {event.notifications.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Notifications Sent:</h4>
                <div className="space-y-2">
                  {event.notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          {getNotificationStatusIcon(notification.status)}
                          <span className="font-medium">
                            {notification.contactName}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {notification.method.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {notification.timestamp.toLocaleString()}
                        </div>
                        {notification.error && (
                          <div className="text-xs text-red-600 mt-1">
                            Error: {notification.error}
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={
                          notification.status === 'sent' ||
                          notification.status === 'delivered' ||
                          notification.status === 'read'
                            ? 'default'
                            : notification.status === 'failed'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {notification.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {event.contactsNotified.length === 0 && !event.cancelled && (
              <div className="text-sm text-gray-500">
                No contacts were notified (event was cancelled before notification)
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
