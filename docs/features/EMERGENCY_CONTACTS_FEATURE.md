# Emergency Contacts Feature - User Guide

## Overview

The Emergency Contacts feature allows you to manage contacts who will be automatically notified in case of a fall or emergency. This feature integrates seamlessly with the Fall Risk Analysis system to provide comprehensive safety monitoring.

## Key Features

### 1. **Contact Management**

Add, edit, and manage emergency contacts with detailed information:

- **Contact Information**: Name, phone number, email
- **Relationship**: Spouse, child, parent, friend, caregiver, etc.
- **Priority Levels**: Primary, Secondary, Tertiary
  - Primary contacts are notified first
  - Secondary contacts are notified if primary doesn't respond
  - Tertiary contacts are backup contacts
- **Notification Methods**: Choose how each contact prefers to be notified
  - SMS
  - Phone Call
  - Email
  - Browser Notification
  - All Methods

### 2. **Notification Settings**

Configure when and how emergency notifications are sent:

- **Auto-Notify**: Enable/disable automatic notifications
- **Fall Detection**: Notify when a fall is detected
- **High Fall Risk**: Notify when fall risk becomes high
- **Manual Trigger**: Notify when emergency button is pressed
- **Cancellation Window**: Set time (0-120 seconds) to cancel false alarms
- **Location Sharing**: Include your location in notifications
- **Health Data**: Include health metrics in notifications
- **Retry Settings**: Configure retry attempts and delays

### 3. **Notification History**

Track all emergency events and notifications:

- **Event Timeline**: View all emergency events chronologically
- **Notification Status**: See which contacts were notified and delivery status
- **Event Details**: View event type, severity, location, and timestamps
- **Cancellation Tracking**: See which events were cancelled
- **Resolution Status**: Track which events were resolved

### 4. **Priority-Based Notification**

Contacts are notified in priority order:

1. **Primary Contacts**: Notified immediately
2. **Secondary Contacts**: Notified if primary doesn't respond
3. **Tertiary Contacts**: Backup contacts

## How to Use

### Adding a Contact

1. Click "Add Contact" button
2. Fill in required information:
   - Full Name (required)
   - Phone Number (required)
   - Email (optional)
   - Relationship (required)
3. Set priority level (Primary, Secondary, or Tertiary)
4. Choose preferred notification methods
5. Add optional notes
6. Click "Add Contact"

### Editing a Contact

1. Find the contact in the list
2. Click "Edit" button
3. Update any information
4. Click "Update Contact"

### Setting Priority

1. Find the contact
2. Use the priority dropdown or click "Set Primary"
3. Priority is automatically updated

### Testing Notifications

1. Ensure you have at least one active contact
2. Click "Send Test Notification"
3. Verify contacts receive the test alert

## Integration with Fall Risk System

The Emergency Contacts feature automatically integrates with:

- **Fall Detection**: Contacts are notified when a fall is detected
- **High Risk Alerts**: Optionally notify when fall risk becomes high
- **Manual Emergency**: Works with manual emergency button triggers

## Notification Flow

1. **Event Detected**: Fall or emergency is detected
2. **Countdown Starts**: You have X seconds to cancel (configurable)
3. **Notifications Sent**: Active contacts are notified in priority order
4. **Status Tracking**: All notifications are tracked and logged
5. **Event History**: Event is saved to notification history

## Best Practices

1. **Add Multiple Contacts**: Have at least 2-3 emergency contacts
2. **Set Priorities**: Designate primary, secondary, and tertiary contacts
3. **Keep Information Updated**: Regularly update phone numbers and emails
4. **Test Regularly**: Use test notifications to verify contacts receive alerts
5. **Review Settings**: Configure notification preferences to match your needs
6. **Check History**: Regularly review notification history to ensure system is working

## Privacy & Security

- All contact information is stored locally in your browser
- No contact data is shared without your explicit action
- Location is only shared when you enable location sharing
- Health data is only included if you enable that option

## Troubleshooting

### Contacts Not Receiving Notifications

- Verify contact is marked as "Active"
- Check notification method preferences
- Ensure browser notifications are enabled
- Check notification history for delivery status

### Test Notification Not Working

- Ensure at least one contact is active
- Check browser notification permissions
- Verify contact information is correct

### Location Not Included

- Enable "Include Location" in settings
- Grant location permissions to browser
- Location may not be available in all scenarios

## Getting Help

For additional support:
- Review notification history to see what was sent
- Check contact status (active/inactive)
- Verify notification settings
- Contact support if issues persist

---

*Last Updated: January 2024*
