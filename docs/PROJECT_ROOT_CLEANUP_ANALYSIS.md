# Project Root Cleanup Analysis

## Files That Can Be Safely Removed

Based on the documentation consolidation and project evolution, here are files in the project root that are no longer needed:

### 🗑️ **Development/Debug Files (Safe to Remove)**

1. **`auth0-debug.html`** (254 lines)
   - Development testing file for Auth0 integration
   - Superseded by proper Auth0 documentation in `docs/auth0-custom-login/`

2. **`auth0-test-dashboard.html`** (273 lines)
   - Test dashboard for Auth0 functionality
   - Should be moved to `docs/auth0-custom-login/` if needed, or removed

3. **`test-auth0-quick.html`** (153 lines)
   - Quick test file for Auth0
   - Development artifact, can be removed

4. **`ci-lint-output.txt`** (7 lines)
   - Old CI lint output capture
   - Temporary file that should be removed

5. **`debug-device-auth.ps1`** (45 lines)
   - Debug script for device authentication
   - Should be moved to `scripts/` or removed if obsolete

6. **`test-health-data.json`** (6 lines)
   - Sample test data
   - Can be moved to `scripts/test-data/` or removed

### 🔧 **Configuration Duplicates (Review & Consolidate)**

7. **Multiple Wrangler Config Files**:
   - `wrangler.fixed.toml`
   - `wrangler.minimal.toml`
   - `wrangler.production.final.toml`
   - `wrangler.production.simple.toml`
   - `wrangler.simple.toml`

   **Action**: Keep only `wrangler.toml` and `wrangler.production.toml`, remove the rest

8. **`vite.config.simple.ts`**
   - Simplified Vite config that's likely obsolete
   - Keep main `vite.config.ts` and `vite.worker.config.ts`

### 📄 **Summary Files (Review)**

9. **`auth0-config-summary.txt`** (23 lines)
   - Contains Auth0 configuration details
   - **Decision needed**: Move to `docs/auth0-custom-login/` or keep if referenced

### 📱 **App Store Metadata (Keep but Review)**

10. **`app-store-metadata.json`** (12 bytes - nearly empty)
    - Very small file, likely placeholder
    - **Action**: Either populate properly or remove

11. **`vitalsense-sync-metadata.json`** (16 lines)
    - VitalSense app metadata
    - **Keep**: Needed for iOS app store deployment

---

## ✅ **Recommended Cleanup Actions**

### Immediate Removal (Safe)

```powershell
# Remove development/debug files
Remove-Item auth0-debug.html, auth0-test-dashboard.html, test-auth0-quick.html, ci-lint-output.txt, test-health-data.json

# Remove duplicate wrangler configs
Remove-Item wrangler.fixed.toml, wrangler.minimal.toml, wrangler.production.final.toml, wrangler.production.simple.toml, wrangler.simple.toml

# Remove simplified vite config
Remove-Item vite.config.simple.ts
```

### Move to Proper Locations

```powershell
# Move debug script to scripts folder
Move-Item debug-device-auth.ps1 scripts/

# Move auth0 config summary to docs
Move-Item auth0-config-summary.txt docs/auth0-custom-login/
```

### Review & Decide

- **`app-store-metadata.json`**: Populate with real data or remove
- Verify no external references exist to files being removed

---

## 📊 **Cleanup Impact**

**Files to Remove**: 9 files  
**Space Saved**: ~800+ lines of code/config  
**Risk Level**: Low (development artifacts)  
**Benefits**:

- Cleaner project root
- Reduced confusion
- Better organization
- Faster file navigation

---

## 🔍 **Files to Keep (Important)**

These files should **NOT** be removed from project root:

✅ **Core Configuration**

- `package.json`, `tsconfig.json`, `vite.config.ts`, `wrangler.toml`
- `.env.example`, `.gitignore`, `.prettierrc`, `eslint.config.js`

✅ **Entry Points**

- `index.html`, `README.md`

✅ **Project Files**

- `components.json`, `tailwind.config.js`, `theme.json`
- `LICENSE`, `health.code-workspace`

✅ **Active Configs**

- `runtime.config.json`, `spark.meta.json`
- `vitalsense-sync-metadata.json` (iOS deployment)

✅ **Key Folders**

- `src/`, `docs/`, `scripts/`, `ios/`, `.vscode/`, `.github/`
