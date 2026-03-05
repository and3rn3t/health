# iOS Build Workflow - Quick Reference

## 🚀 Quick Start

### Automatic Builds
- **Triggers**: Push to `main`/`develop` or PR to `main` (when iOS files change)
- **Default**: Development build with tests
- **No Action Required**: Runs automatically

### Manual Builds
1. Go to **Actions** tab in GitHub
2. Select **"VitalSense iOS Build"** workflow
3. Click **"Run workflow"**
4. Choose options and click **"Run workflow"**

## 📋 Build Types

| Type | What It Builds | Use Case |
|------|----------------|----------|
| `development` | Optimized iOS app | Daily development |
| `release` | Signed archive for App Store | Production release |
| `performance` | Health monitoring optimized + performance tests | Performance testing |
| `health_monitoring` | Health monitoring optimized | Gait analysis builds |
| `watch_app` | Apple Watch app only | Watch development |
| `widgets` | Widget extension only | Widget development |
| `all_targets` | iOS + Watch + Widgets | Full app build |

## ⚙️ Workflow Inputs

### `build_type` (Required)
- **Default**: `development`
- **Options**: See Build Types table above

### `run_tests` (Optional)
- **Default**: `true`
- **Purpose**: Run unit/performance tests
- **Note**: Tests can fail without blocking build

### `upload_testflight` (Optional)
- **Default**: `false`
- **Purpose**: Upload to TestFlight after build
- **Requirements**: 
  - Must be on `main` branch
  - Requires TestFlight credentials (see Secrets below)
- **Security**: Only runs when explicitly enabled

### `skip_codesigning` (Optional)
- **Default**: `true`
- **Purpose**: Skip code signing for unsigned builds
- **Note**: Set to `false` for release builds requiring signing

## 🔐 Required Secrets

### For Unsigned Builds (Default)
```yaml
# Optional - has default value
APP_IDENTIFIER: dev.andernet.VitalSense
```

### For Signed Builds
```yaml
TEAM_ID: YOUR_APPLE_TEAM_ID
FASTLANE_USER: your-apple-id@email.com
FASTLANE_PASSWORD: app-specific-password
```

### For TestFlight Upload
```yaml
# Option 1: API Key (Recommended)
APP_STORE_CONNECT_API_KEY_PATH: base64-encoded-json-key

# Option 2: Username/Password
FASTLANE_USER: your-apple-id@email.com
FASTLANE_PASSWORD: app-specific-password
```

## 📊 Build Outputs

### Artifacts
- **Build Artifacts**: `vitalsense-build-{type}-{sha}` (30 days retention)
- **Test Results**: `test-results-{sha}` (7 days retention)
- **Build Metrics**: `build_metrics.json` (included in build artifacts)

### Metrics JSON
```json
{
  "build_type": "development",
  "build_success": true,
  "build_duration_seconds": 450,
  "test_success": true,
  "xcode_version": "16.4",
  "timestamp": "2025-01-XX...",
  "commit_sha": "...",
  "branch": "main"
}
```

## 🎯 Common Workflows

### Daily Development
```yaml
build_type: development
run_tests: true
upload_testflight: false
skip_codesigning: true
```

### Pre-Release Testing
```yaml
build_type: performance
run_tests: true
upload_testflight: false
skip_codesigning: true
```

### Production Release
```yaml
build_type: release
run_tests: true
upload_testflight: true  # Only on main branch
skip_codesigning: false  # Requires signing secrets
```

### Quick Build (No Tests)
```yaml
build_type: development
run_tests: false
upload_testflight: false
skip_codesigning: true
```

## ⚡ Performance Tips

### Faster Builds
- **Use Caching**: First build is slower, subsequent builds are 30-40% faster
- **Skip Tests**: Set `run_tests: false` for faster builds
- **Choose Right Type**: Use `development` instead of `all_targets` when possible

### Cost Optimization
- **Cache Hits**: Reduces runner time significantly
- **Selective Testing**: Only run tests when needed
- **Timeout Protection**: 60-minute max prevents runaway builds

## 🐛 Troubleshooting

### Build Fails
1. Check build logs in Actions tab
2. Look for specific error messages
3. Fallback build runs automatically if main build fails
4. Verify workspace and project files exist

### TestFlight Upload Fails
1. Verify secrets are configured
2. Check you're on `main` branch
3. Verify `upload_testflight: true` is set
4. Check App Store Connect API key or credentials

### Cache Issues
1. Cache is automatically managed
2. If issues persist, cache will rebuild on next run
3. Check cache keys match file hashes

### Slow Builds
1. First build is always slower (no cache)
2. Subsequent builds use cache (30-40% faster)
3. `all_targets` builds take longer (builds everything)
4. Check build logs for slow steps

## 📞 Support

- **Workflow Issues**: Check `.github/workflows/ios-build.yml`
- **Build Issues**: Check `ios/fastlane/Fastfile`
- **Documentation**: See `docs/ios/` directory
- **Full Guide**: See `WORKFLOW_OPTIMIZATION_SUMMARY.md`

## ✅ Quick Checklist

Before running a build:
- [ ] Secrets configured (if needed for signing/TestFlight)
- [ ] Correct build type selected
- [ ] Tests enabled/disabled as needed
- [ ] TestFlight upload only if on main branch

After build:
- [ ] Check build status in Actions tab
- [ ] Download artifacts if needed
- [ ] Review build metrics JSON
- [ ] Check test results (if tests ran)
- [ ] Verify TestFlight upload (if enabled)
