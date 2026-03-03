# Family Dashboard Feature - Developer Guide

## Architecture Overview

The Family Dashboard feature consists of:

```
src/
├── lib/
│   └── familyDashboard.ts              # Types and utilities
├── components/
│   └── family/
│       ├── EnhancedFamilyDashboard.tsx # Main dashboard
│       ├── FamilyMemberManager.tsx     # Member management
│       ├── HealthDataSharing.tsx       # Data sharing controls
│       ├── ProgressSharing.tsx         # Progress sharing
│       ├── FamilyActivityTimeline.tsx  # Activity timeline
│       └── __tests__/
│           ├── FamilyMemberManager.test.tsx
│           ├── EnhancedFamilyDashboard.test.tsx
│           ├── HealthDataSharing.test.tsx
│           ├── ProgressSharing.test.tsx
│           └── FamilyDashboard.integration.test.tsx
```

## Core Types

### FamilyMember

```typescript
interface FamilyMember {
  id: string;
  name: string;
  relationship: string;
  email?: string;
  phone?: string;
  avatar?: string;
  lastSeen: Date;
  isActive: boolean;
  permissions: FamilyPermission[];
  notificationPreferences: NotificationPreferences;
  role: 'primary' | 'secondary' | 'viewer';
  createdAt: Date;
  updatedAt: Date;
}
```

### FamilyPermission

```typescript
type FamilyPermission =
  | 'view-health'
  | 'view-location'
  | 'receive-alerts'
  | 'view-emergency'
  | 'view-analytics'
  | 'manage-settings';
```

### ProgressShare

```typescript
interface ProgressShare {
  id: string;
  type: 'milestone' | 'improvement' | 'concern' | 'achievement' | 'update';
  title: string;
  description: string;
  value?: number;
  previousValue?: number;
  unit?: string;
  date: Date;
  sharedWith: string[];
  reactions: Reaction[];
  comments?: Comment[];
  isPublic: boolean;
}
```

### HealthDataShare

```typescript
interface HealthDataShare {
  id: string;
  memberId: string;
  sharedMetrics: string[];
  lastShared: Date;
  frequency: 'realtime' | 'daily' | 'weekly' | 'on-demand';
  includeLocation: boolean;
  includeEmergencyData: boolean;
}
```

## Components

### EnhancedFamilyDashboard

**Purpose**: Main family dashboard component

**Props**:
```typescript
interface EnhancedFamilyDashboardProps {
  healthData: ProcessedHealthData | null;
}
```

**Features**:
- Tabbed interface (Members, Sharing, Progress, Activity, Emergency)
- Summary statistics
- Member management integration
- Health data sharing integration
- Progress sharing integration
- Activity timeline integration

**Storage Keys**:
- `family-members`: Family member list
- `progress-shares`: Shared progress items
- `family-activities`: Activity timeline
- `health-data-shares`: Health data sharing settings

### FamilyMemberManager

**Purpose**: Add, edit, and manage family members

**Props**:
```typescript
interface FamilyMemberManagerProps {
  members: FamilyMember[];
  onAdd: (member: Omit<FamilyMember, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate: (id: string, updates: Partial<FamilyMember>) => void;
  onDelete: (id: string) => void;
}
```

**Features**:
- Add new members with validation
- Edit existing members
- Delete members
- Permission management
- Notification preferences
- Role assignment

### HealthDataSharing

**Purpose**: Configure health data sharing per member

**Props**:
```typescript
interface HealthDataSharingProps {
  members: FamilyMember[];
  shares: HealthDataShare[];
  onUpdateShare: (memberId: string, share: Partial<HealthDataShare>) => void;
}
```

**Features**:
- Per-member metric selection
- Update frequency configuration
- Location sharing toggle
- Emergency data sharing toggle
- Permission-based access control

### ProgressSharing

**Purpose**: Share health milestones and achievements

**Props**:
```typescript
interface ProgressSharingProps {
  shares: ProgressShare[];
  members: FamilyMember[];
  onAdd: (share: Omit<ProgressShare, 'id'>) => void;
  onAddReaction: (shareId: string, memberId: string, reaction: string) => void;
  onAddComment?: (shareId: string, memberId: string, content: string) => void;
}
```

**Features**:
- Create progress shares
- Multiple share types
- Reaction system
- Comment system (optional)
- Privacy controls

### FamilyActivityTimeline

**Purpose**: Display family-related activities

**Props**:
```typescript
interface FamilyActivityTimelineProps {
  activities: FamilyActivity[];
  members: FamilyMember[];
  onMarkRead?: (id: string) => void;
}
```

**Features**:
- Chronological timeline
- Read/unread status
- Activity filtering
- Severity indicators
- Member attribution

## Utilities

### familyDashboard.ts

**Key Functions**:

#### `getFamilyMember(members, id)`
Get member by ID

#### `getActiveMembers(members)`
Filter active members

#### `getMembersWithPermission(members, permission)`
Get members with specific permission

#### `hasPermission(member, permission)`
Check if member has permission

#### `formatRelativeTime(date)`
Format date as relative time

#### `validateFamilyMember(member)`
Validate member data

#### `getDefaultPermissionsForRole(role)`
Get default permissions for role

## Data Flow

1. **Member Management**:
   - User adds/edits member → `FamilyMemberManager` → `useKV` → localStorage

2. **Health Data Sharing**:
   - User configures sharing → `HealthDataSharing` → `useKV` → localStorage

3. **Progress Sharing**:
   - User shares progress → `ProgressSharing` → `useKV` → localStorage
   - Activity created → `FamilyActivityTimeline` updated

4. **Activity Tracking**:
   - Actions create activities → Stored in `family-activities` → Displayed in timeline

## Integration Points

### Health Data

- Uses `ProcessedHealthData` for health metrics
- Shares selected metrics with family members
- Displays health status in emergency tab

### Emergency Contacts

- Can integrate with emergency contacts feature
- Shares emergency data with authorized members
- Coordinates emergency notifications

### Analytics

- Can share analytics with family members
- Permission-based analytics access
- Progress sharing includes analytics insights

## Testing

### Unit Tests

- **FamilyMemberManager.test.tsx**: Member CRUD operations
- **HealthDataSharing.test.tsx**: Sharing configuration
- **ProgressSharing.test.tsx**: Progress sharing functionality
- **EnhancedFamilyDashboard.test.tsx**: Dashboard rendering

### Integration Tests

- **FamilyDashboard.integration.test.tsx**: Component interactions
- Member addition → Statistics update
- Progress sharing → Activity creation
- Sharing configuration → Member access

## Extending the Feature

### Adding New Permissions

1. Update `FamilyPermission` type
2. Add to `availablePermissions` in `FamilyMemberManager`
3. Update permission checks in components
4. Add to default permissions for roles

### Adding New Share Types

1. Update `ProgressShare['type']`
2. Add icon/color logic in `ProgressSharing`
3. Update share form options
4. Add activity type if needed

### Adding New Activities

1. Update `FamilyActivity['type']`
2. Add icon/color logic in `FamilyActivityTimeline`
3. Create activity in relevant components
4. Update activity display

## Production Considerations

### Data Synchronization

For production, consider:
- Cloud sync across devices
- Real-time updates via WebSocket
- Conflict resolution for concurrent edits
- Offline support

### Notification System

Integrate with:
- Push notifications for alerts
- Email notifications for reports
- SMS for emergency alerts
- In-app notifications

### Privacy & Compliance

- HIPAA compliance for health data
- GDPR compliance for EU users
- Consent management
- Data retention policies
- Audit logging

## Future Enhancements

1. **Multi-User Support**: Multiple users managing same family
2. **Caregiver Portal**: Dedicated caregiver interface
3. **Group Challenges**: Family health challenges
4. **Messaging**: In-app messaging between members
5. **Calendar Integration**: Shared health event calendar
6. **Reports**: Automated health reports for family

---

*Last Updated: January 2024*
