---
name: sync-health-config
description: "Synchronize health analysis configuration between web and iOS platforms. Use when updating gait thresholds, fall risk parameters, or health scoring configs. Ensures web and iOS stay in sync."
---

# Sync Health Configuration

## When to Use
- Update gait analysis thresholds or momentum calculations
- Change fall risk scoring parameters
- Sync configuration between web app and iOS app
- After modifying `gaitConfig.ts` or `fallRiskConfig.ts`

## Procedure

### 1. Review Current Config
Check the source-of-truth configs:
- Gait: `src/lib/gaitConfig.ts`, `src/lib/gaitMomentum.ts`, `src/lib/gaitTrends.ts`
- Fall risk: `src/lib/fallRiskConfig.ts`

### 2. Make Changes
Edit the TypeScript config files. All threshold values should have clear comments explaining clinical significance.

### 3. Run Sync Scripts
Sync gait configuration:
```bash
pnpm run gait:sync
```

Sync fall risk configuration:
```bash
pnpm run fallrisk:sync
```

Or sync both:
```bash
pnpm run analytics:sync
```

### 4. Verify iOS Side
Check that synced values propagated to iOS:
- `ios/HealthKitBridge/` — WebSocket message schemas
- `ios/Sources/VitalSenseCore/` — core config values

### 5. Test
- Run web tests: `pnpm test`
- Run iOS tests via Xcode or `make test` in `ios/Andernet-Posture/`
- Verify thresholds produce expected scoring in both platforms

## Key Files
| File | Purpose |
|------|---------|
| `src/lib/gaitConfig.ts` | Gait thresholds and parameters |
| `src/lib/fallRiskConfig.ts` | Fall detection thresholds |
| `scripts/analysis/gait/sync-gait-config.js` | Gait sync script |
| `scripts/analysis/fall/sync-fall-risk-config.js` | Fall risk sync script |
