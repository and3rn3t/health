---
description: 'Detect configuration drift between web (TypeScript) and iOS (Swift) health analysis configs. Use before releases or after updating gait/fall-risk thresholds to verify web ↔ iOS parity.'
---

Check for configuration drift between web and iOS health analysis configs.

## Config Locations

**Gait Analysis:**
- Web source: `src/lib/gaitConfig.ts`
- iOS target: Generated Swift code via `scripts/analysis/gait/sync-gait-config.js`
- Sync command: `pnpm run gait:sync`

**Fall Risk:**
- Web source: `src/lib/fallRiskConfig.ts`
- iOS target: Generated Swift code via `scripts/analysis/fall/sync-fall-risk-config.js`
- Sync command: `pnpm run fallrisk:sync`

## Procedure

1. **Read web configs**: Extract threshold values, scoring weights, version numbers, and algorithm parameters from `gaitConfig.ts` and `fallRiskConfig.ts`
2. **Read iOS configs**: Find the corresponding Swift files in `ios/` that contain the same parameters
3. **Compare values**: Check each threshold, weight, and version for exact match
4. **Check sync script output**: Run `pnpm run gait:sync -- --dry-run` and `pnpm run fallrisk:sync -- --dry-run` (if dry-run supported) to see what would change
5. **Report drift**: List any mismatched values with web vs iOS values side-by-side

## Output Format

| Parameter | Web Value | iOS Value | Status |
|-----------|-----------|-----------|--------|
| gaitAnalyticsVersion | X | Y | DRIFT / OK |
| fallDetectionThreshold | X | Y | DRIFT / OK |
| ... | ... | ... | ... |

If drift is detected, provide the sync commands to resolve it:
```bash
pnpm run gait:sync && pnpm run fallrisk:sync
```

Then verify by re-reading both configs.
