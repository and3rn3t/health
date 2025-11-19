# Emergency Contacts Feature - Developer Guide

## Architecture Overview

The Emergency Contacts feature consists of:

```
src/
├── lib/
│   ├── emergencyContacts.ts              # Types and utilities
│   └── emergencyNotificationService.ts   # Notification service
├── hooks/
│   ├── useEmergencyContacts.ts           # Contact management hook
│   └── useFallRiskSystem.ts              # Integration with fall risk
└── components/health/
    ├── EnhancedEmergencyContacts.tsx      # Main management component
    ├── EmergencyContactForm.tsx           # Add/edit form
    ├── EmergencyNotificationHistory.tsx   # History display
    └── EmergencyContactSettings.tsx      # Settings component
```

## Core Types

### EmergencyContact

```typescript
interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  relationship: string;
  priority: 'primary' | 'secondary' | 'tertiary';
  preferredMethods: ContactMethod[];
  isActive: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
  lastNotified?: Date;
  notificationCount: number;
}
```

### EmergencyEvent

```typescript
interface EmergencyEvent {
  id: string;
  type: 'fall_detected' | 'fall_risk_high' | 'manual_trigger' | 'medical_emergency';
  severity: 'low' | 'moderate' | 'high' | 'critical';
  timestamp: Date;
  location?: { latitude: number; longitude: number; address?: string };
  contactsNotified: string[];
  notifications: EmergencyNotification[];
  cancelled: boolean;
  cancelledAt?: Date;
  resolved: boolean;
  resolvedAt?: Date;
}
```

## Hooks

### useEmergencyContacts

**Purpose**: Manages emergency contacts with localStorage persistence

**API**:
```typescript
const {
  contacts,              // All contacts
  settings,              // Notification settings
  events,               // Emergency event history
  isLoading,            // Loading state
  
  // Contact management
  addContact,
  updateContact,
  deleteContact,
  setContactPriority,
  toggleContactActive,
  getSortedActiveContacts,
  getPrimaryContact,
  getContactById,
  
  // Settings
  updateSettings,
  
  // Events
  addEvent,
  updateEvent,
  cancelEvent,
  resolveEvent,
} = useEmergencyContacts();
```

**Storage Keys**:
- `vitalsense-emergency-contacts`: Contact list
- `vitalsense-emergency-settings`: Settings
- `vitalsense-emergency-events`: Event history (max 50 events)

## Services

### EmergencyNotificationService

**Purpose**: Handles sending notifications to emergency contacts

**Usage**:
```typescript
const service = new EmergencyNotificationService(settings);
const notifications = await service.sendEmergencyNotifications(event, contacts);
```

**Methods**:
- `sendEmergencyNotifications()`: Send to all active contacts
- `updateSettings()`: Update notification settings

**Notification Methods**:
- SMS (simulated - integrate with Twilio/AWS SNS)
- Phone Call (simulated - integrate with Twilio)
- Email (simulated - integrate with SendGrid/AWS SES)
- Browser Notification (uses Web Notifications API)

## Integration Points

### Fall Risk System Integration

The emergency contacts feature integrates with the fall risk system:

```typescript
// In useFallRiskSystem.ts
const { handleEmergencyAlert } = useEmergencyAlerts();

// When fall is detected
await handleEmergencyAlert(fallDetectionEvent);
// Automatically creates event and sends notifications
```

### Event Creation

```typescript
import { createFallDetectionEvent, createHighRiskEvent } from '@/lib/emergencyNotificationService';

// From fall detection
const event = createFallDetectionEvent('critical', location);

// From high risk
const event = createHighRiskEvent(riskScore, location);
```

## Components

### EnhancedEmergencyContacts

Main component for managing contacts. Features:
- Tabbed interface (Contacts, History, Settings)
- Add/Edit/Delete contacts
- Priority management
- Active/Inactive toggle
- Test notifications

### EmergencyContactForm

Reusable form for adding/editing contacts:
- Validation (phone, email)
- Priority selection
- Notification method selection
- Active status toggle

### EmergencyNotificationHistory

Displays emergency event history:
- Event timeline
- Notification status
- Location information
- Cancellation/resolution tracking

### EmergencyContactSettings

Settings management:
- Auto-notify toggle
- Event type preferences
- Countdown configuration
- Location/health data sharing
- Retry settings

## Data Flow

1. **Contact Management**:
   - User adds/edits contact → `useEmergencyContacts` → localStorage

2. **Event Detection**:
   - Fall detected → `useFallRiskSystem` → `EmergencyNotificationService`

3. **Notification Sending**:
   - Service filters active contacts → Sorts by priority → Sends notifications

4. **Event Tracking**:
   - Event created → Notifications sent → Event saved to history

## Testing

### Unit Tests

- `useEmergencyContacts.test.ts`: Hook functionality
- Component tests (to be added)

### Test Patterns

```typescript
// Mock localStorage
const localStorageMock = { /* ... */ };

// Test hook
const { result } = renderHook(() => useEmergencyContacts());

// Test actions
act(() => {
  result.current.addContact(contactData);
});
```

## Production Considerations

### Notification Services Integration

Replace simulated methods with actual services:

**SMS**:
```typescript
// Twilio example
await twilioClient.messages.create({
  to: contact.phone,
  from: TWILIO_NUMBER,
  body: message,
});
```

**Email**:
```typescript
// SendGrid example
await sgMail.send({
  to: contact.email,
  from: 'alerts@vitalsense.app',
  subject: 'Emergency Alert',
  text: message,
});
```

**Phone Call**:
```typescript
// Twilio Voice example
await twilioClient.calls.create({
  to: contact.phone,
  from: TWILIO_NUMBER,
  url: 'https://api.vitalsense.app/emergency-voice',
});
```

### Location Services

Integrate with geolocation API:

```typescript
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition((position) => {
    const location = {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
    // Use in event
  });
}
```

### Error Handling

- Retry failed notifications
- Log errors for debugging
- Fallback to alternative methods
- User notification of failures

## Security Considerations

1. **Data Storage**: All data stored locally (localStorage)
2. **API Keys**: Store notification service keys securely (environment variables)
3. **Phone Validation**: Validate phone numbers before sending
4. **Rate Limiting**: Implement rate limiting for notifications
5. **Privacy**: Only share location/health data if user explicitly enables

## Future Enhancements

1. **Cloud Sync**: Sync contacts across devices
2. **Two-Way Communication**: Allow contacts to respond
3. **Smart Routing**: Route to available contacts first
4. **Integration**: Connect with medical alert services
5. **Analytics**: Track notification effectiveness

---

*Last Updated: January 2024*
