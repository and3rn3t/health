# Icon Import Optimization Guide

## Current Status
- **lucide-react** is used in 142 files
- Full library import: `import { Icon } from 'lucide-react'` (~100KB+)
- Individual imports: `import Icon from 'lucide-react/dist/esm/icons/icon'` (~2-5KB per icon)

## Optimization Strategy

### Phase 1: High-Impact Files
Focus on files that import many icons:
- `App.tsx` - imports 15+ icons
- `MLAnalytics.tsx` - imports 10+ icons
- Large component files with multiple icons

### Phase 2: Create Icon Barrel Export
Create `src/lib/icons.ts` that re-exports commonly used icons:

```typescript
// src/lib/icons.ts
export { Activity } from 'lucide-react/dist/esm/icons/activity';
export { AlertTriangle } from 'lucide-react/dist/esm/icons/alert-triangle';
// ... etc
```

### Phase 3: Automated Migration
Use a script to convert:
```typescript
// Before
import { Activity, AlertTriangle } from 'lucide-react';

// After
import { Activity, AlertTriangle } from '@/lib/icons';
```

## Expected Savings
- **Current**: ~100KB for full lucide-react library
- **Optimized**: ~20-30KB for individual icon imports (only used icons)
- **Savings**: ~70-80KB

## Implementation Priority
1. ✅ Create lazy chart components (done)
2. ⏳ Optimize icon imports in high-impact files
3. ⏳ Create icon barrel export
4. ⏳ Migrate remaining files
