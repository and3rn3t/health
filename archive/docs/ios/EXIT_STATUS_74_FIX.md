# 🔧 iOS Build Exit Status 74 Troubleshooting Guide

## 🎯 Current Issue

```
gym failed with exit status 74
Called from Fastfile at line 164 (gym command)
```

**Exit Status 74** typically indicates an Xcode build configuration or environment issue.

## 🔍 Root Cause Analysis

### Common Causes of Exit Status 74

1. **Code Signing Issues** - Missing certificates, profiles, or signing configuration
2. **Missing Dependencies** - Swift packages or frameworks not resolved
3. **Scheme/Target Issues** - Invalid scheme or target configuration  
4. **Xcode Environment** - Path issues, missing SDKs, or version mismatch
5. **Build Settings Conflicts** - Incompatible xcargs or configuration

## 🛠️ Fixes Applied

### 1. **Standardized Build Configuration**

Updated performance lanes to use the same proven pattern as the working `build` lane:

```ruby
# Before (FAILING)
gym(
  workspace: 'VitalSense.xcworkspace',
  scheme: 'VitalSense', 
  # ... individual settings
)

# After (WORKING PATTERN)  
gym(shared_build_settings.merge(
  archive_path: 'build/VitalSense-Optimized.xcarchive',
  skip_codesigning: true,
  clean: true,
  output_directory: 'build',
  output_name: 'VitalSense-Optimized',
  xcargs: 'CODE_SIGNING_ALLOWED=NO COMPILER_INDEX_STORE_ENABLE=NO SWIFT_WHOLE_MODULE_OPTIMIZATION=YES GCC_OPTIMIZATION_LEVEL=fast'
))
```

### 2. **Added CODE_SIGNING_ALLOWED=NO**

Critical for CI environments where code signing isn't configured:

- Prevents signing-related build failures
- Allows unsigned builds for testing/CI
- Matches pattern used in working `build` lane

### 3. **Enhanced Diagnostic Tools**

Added troubleshooting lanes:

```ruby
# Environment diagnostics
bundle exec fastlane ios diagnose

# Minimal test build
bundle exec fastlane ios test_build
```

### 4. **Updated GitHub Actions Workflow**

Added diagnostic steps before main build:

1. Environment diagnostics check
2. Minimal test build validation  
3. Then proceed with requested build type

## 🧪 Troubleshooting Steps

### Step 1: Run Diagnostics

```bash
cd ios
bundle exec fastlane ios diagnose
```

**Checks:**

- VitalSense.xcworkspace exists
- VitalSense.xcodeproj exists  
- Available schemes
- Xcode version and environment

### Step 2: Test Minimal Build

```bash
cd ios
bundle exec fastlane ios test_build
```

**Validates:**

- Basic gym configuration works
- Workspace/scheme accessibility
- Output directory creation
- Code signing bypass

### Step 3: Identify Specific Issue

If diagnostics pass but build fails, check:

**A. Scheme Issues:**

```bash
xcodebuild -workspace VitalSense.xcworkspace -list
```

**B. Dependencies:**

```bash
xcodebuild -resolvePackageDependencies -workspace VitalSense.xcworkspace -scheme VitalSense
```

**C. Build Settings:**

```bash
xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -showBuildSettings
```

## 🎯 Expected Resolution

### Immediate Fixes

- ✅ **CODE_SIGNING_ALLOWED=NO** prevents signing issues
- ✅ **shared_build_settings pattern** ensures consistency  
- ✅ **Diagnostic tools** help identify specific problems
- ✅ **Step-by-step validation** isolates issues

### Long-term Improvements

- 🔄 **Automated dependency resolution** before builds
- 🔄 **Enhanced error reporting** with specific failure reasons
- 🔄 **Build environment validation** in CI setup

## 📋 Validation Checklist

Before considering the issue resolved:

- [ ] `bundle exec fastlane ios diagnose` passes
- [ ] `bundle exec fastlane ios test_build` succeeds  
- [ ] `bundle exec fastlane ios build_optimized` completes
- [ ] `bundle exec fastlane ios build_health_monitoring` works
- [ ] GitHub Actions CI pipeline succeeds end-to-end

## 🚀 Next Steps

1. **Test locally** (if Ruby/Fastlane available):

   ```bash
   cd ios
   bundle exec fastlane ios test_build
   ```

2. **Commit and test CI**: Push changes to trigger GitHub Actions with enhanced diagnostics

3. **Monitor build logs**: Check specific Xcode error messages if issues persist

4. **Iterate**: Use diagnostic output to address any remaining configuration issues

## 📊 Success Metrics

**Before Fix:**

- ❌ Exit status 74 at gym command
- ❌ Build failure after 41 seconds
- ❌ No diagnostic information

**After Fix (Expected):**

- ✅ Successful build completion  
- ✅ Diagnostic information available
- ✅ Consistent build patterns across all lanes
- ✅ CI pipeline fully functional
