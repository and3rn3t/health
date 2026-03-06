# Migration from GitHub Spark to Cloudflare KV

## Overview

We're migrating away from GitHub Spark's `useKV` hook to our own Cloudflare Workers KV backend for better control, security, and compliance with healthcare data requirements.

## Benefits of Migration

- ✅ **Healthcare Compliance**: Better control over health data storage
- ✅ **No Vendor Lock-in**: Use our own Cloudflare infrastructure
- ✅ **Performance**: Faster local storage in development
- ✅ **Error Reduction**: Eliminates promise rejection errors from Spark
- ✅ **Cost Control**: No external service dependencies

## How to Migrate

### 1. Replace Import Statement

```typescript
// OLD (GitHub Spark)
import { useKV } from '@github/spark/hooks';

// NEW (Our Cloudflare KV)
import { useKV } from '@/hooks/useCloudflareKV';
```

### 2. Usage Remains the Same

```typescript
// No changes needed to the hook usage
const [healthData, setHealthData] = useKV('health-data', null);
const [preferences, setPreferences] = useKV('user-preferences', {});
```

## Migration Strategy

### Phase 1: Core App (DONE)

- [x] `src/App.tsx` - Main app storage

### Phase 2: Components (Next)

Replace imports in these files:

- `src/components/recommendations/PersonalizedEngagementOptimizer.tsx`
- `src/components/notifications/SmartNotificationEngine.tsx`
- `src/components/health/FamilyDashboard.tsx`
- `src/components/health/HealthcarePortal.tsx`
- `src/components/health/HealthInsightsDashboard.tsx`
- `src/hooks/useUsageTracking.ts`

### Phase 3: Remove Spark Dependency

After all components are migrated:

1. Remove `@github/spark` from package.json
2. Remove `import '@github/spark/spark';` from main.tsx
3. Update documentation

## Alternative: Simple localStorage Hook

For components that don't need server persistence, use:

```typescript
import { useLocalStorage } from '@/hooks/useCloudflareKV';

// Simpler, localStorage-only storage
const [settings, setSettings] = useLocalStorage('app-settings', {});
```

## API Endpoints Added

Our worker now provides these KV endpoints:

- `GET /api/kv/:key` - Get stored value
- `PUT /api/kv/:key` - Store value (body: `{ value: any }`)
- `DELETE /api/kv/:key` - Delete value

## Development vs Production

- **Development**: Uses localStorage for fast, local storage
- **Production**: Uses Cloudflare KV via our API endpoints

## Testing

1. Replace imports one component at a time
2. Test that data persists correctly
3. Verify no console errors
4. Check that stored data survives page refresh

## Migration Commands

To help with migration, you can search and replace:

```bash
# Find all Spark useKV imports
grep -r "from '@github/spark/hooks'" src/

# Replace with our hook (manual verification recommended)
find src/ -name "*.tsx" -o -name "*.ts" | xargs sed -i "s|from '@github/spark/hooks'|from '@/hooks/useCloudflareKV'|g"
```

## Rollback Plan

If issues arise, temporarily revert by:

1. Changing import back to `@github/spark/hooks`
2. The hook interface is identical, so no other changes needed
