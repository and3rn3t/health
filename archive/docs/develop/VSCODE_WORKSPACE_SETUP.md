# VitalSense VS Code Workspace Setup

This document explains the enhanced VS Code workspace configuration for VitalSense development, which combines web development tools with Swift/iOS development capabilities.

## Quick Setup

### Option 1: Automated Setup (Recommended)

1. **Run the setup task** in VS Code:
   - Press `Ctrl+Shift+P`
   - Type "Tasks: Run Task"
   - Select "🔧 Setup VS Code Workspace"

2. **Or run the setup script directly**:

   ```powershell
   ./scripts/setup-vscode-workspace.ps1 -All
   ```

3. **Restart VS Code** and open the workspace:
   - File → Open Workspace from File → `health.code-workspace`

### Option 2: Manual Setup

1. **Install recommended extensions** (see list below)
2. **Configure terminal profiles** (already configured in `.vscode/settings.json`)
3. **Set default terminal** to "VitalSense Enhanced"

## Enhanced Features

### 🚀 Enhanced PowerShell Profile

The new `enhanced-vitalsense-profile.ps1` combines the best of both worlds:

- **Web Development Commands**:
  - `dev` - Start development server
  - `probe` - Health check endpoints
  - `wrdev` - Wrangler dev server
  - `ctx` - Get development context

- **Swift Development Commands**:
  - `sa` - Swift All (lint + format + build)
  - `sl` - Swift Lint
  - `sf` - Swift Format
  - `sb` - Swift Build
  - `sd` - Swift Doctor
  - `ss` - Swift Setup

- **Navigation Helpers**:
  - `root` - Go to workspace root
  - `ios` - Go to iOS directory
  - `reload` - Reload profile

- **Enhanced Prompt**: Context-aware prompt showing current location (iOS, Docs, Scripts, Web, Root) with git branch info

### 🖥️ Terminal Profiles

Three optimized terminal profiles are available:

1. **VitalSense Enhanced** (Default)
   - Full web + Swift development environment
   - All commands available from any directory
   - Context-aware prompt
   - Automatic profile loading

2. **Swift Development**
   - Focused on Swift/iOS development
   - Same enhanced profile with Swift mode enabled
   - iOS-specific optimizations

3. **Legacy VitalSense**
   - Previous configuration for compatibility
   - Uses the original terminal-init.ps1

### 📦 Recommended Extensions

The workspace automatically recommends these extensions:

- **Core Development**:
  - PowerShell - Language support and debugging
  - GitHub Copilot + Chat - AI assistance
  - TypeScript Next - Latest TypeScript features

- **Cloudflare & Web**:
  - Cloudflare Workers - Worker development
  - Prettier - Code formatting
  - Tailwind CSS - CSS IntelliSense

- **iOS Development**:
  - Swift - Swift language support
  - XML - Plist editing
  - Better TOML - Configuration files

- **Quality & Productivity**:
  - YAML - Configuration files
  - Auto Rename Tag - HTML/XML editing
  - Code Spell Checker - Spelling

### ⚙️ Workspace Configuration

The `health.code-workspace` includes:

- **Multi-folder setup**: Root, iOS, Documentation, Scripts
- **Optimized search exclusions**: Ignores build artifacts, caches
- **File associations**: Proper syntax highlighting for all file types
- **Copilot integration**: Enabled for all relevant languages
- **Debug configurations**: Ready-to-use launch configs for web and worker debugging

### 🎯 VS Code Settings Highlights

Key optimizations in `.vscode/settings.json`:

- **Terminal Integration**: Shell integration with command decorations
- **PowerShell Optimization**: OTBS formatting, script analysis
- **Performance**: Optimized search, file exclusions
- **Developer Experience**: Enhanced IntelliSense, auto-formatting

## Usage Examples

### Starting Development

```powershell
# Terminal opens with VitalSense Enhanced profile automatically
dev          # Start development server
probe        # Check endpoint health
ctx          # Get environment context
```

### Swift Development

```powershell
ios          # Navigate to iOS directory
sa           # Run Swift All (lint + format + build)
Get-SwiftProjectStatus    # Check project status
Get-iOS26Features         # Check iOS 26 features
```

### Navigation

```powershell
root         # Go to workspace root
ios          # Go to iOS directory
reload       # Reload profile with latest changes
```

## Troubleshooting

### Profile Not Loading

If the profile doesn't load automatically:

1. Check terminal profile setting: `Ctrl+Shift+P` → "Terminal: Select Default Profile"
2. Select "VitalSense Enhanced"
3. Open new terminal

### Extension Issues

Run the setup script with force flag:

```powershell
./scripts/setup-vscode-workspace.ps1 -InstallExtensions -Force
```

### Swift Commands Not Working

1. Ensure Docker Desktop is running
2. Check iOS directory exists: `Test-Path ios`
3. Verify Swift toolkit: `Test-Path ios/scripts/swift-windows-toolkit.ps1`

### Performance Issues

1. Check file exclusions in workspace settings
2. Disable unnecessary extensions
3. Clear VS Code cache: `Ctrl+Shift+P` → "Developer: Reload Window"

## Advanced Configuration

### Custom Terminal Profile

To create your own profile based on the enhanced one:

1. Copy `scripts/enhanced-vitalsense-profile.ps1`
2. Modify as needed
3. Add new profile to `.vscode/settings.json` in `terminal.integrated.profiles.windows`

### Task Customization

VS Code tasks automatically load the enhanced profile. To customize:

1. Edit `.vscode/tasks.json`
2. Modify the shell options in the tasks configuration
3. Tasks will inherit the profile functions

## Integration with Existing Workflows

This setup is designed to be compatible with:

- ✅ Existing PowerShell scripts
- ✅ Docker workflows
- ✅ GitHub Copilot workflows
- ✅ Swift development on Windows
- ✅ Cloudflare Workers deployment
- ✅ Node.js development scripts

The enhanced profile automatically detects context and loads appropriate tools without breaking existing functionality.

## Next Steps

After setup, you can:

1. **Start Development**: Run `dev` to begin development
2. **Explore Tasks**: `Ctrl+Shift+P` → "Tasks: Run Task" to see all available tasks
3. **Use Swift Tools**: Navigate to `ios` directory and use Swift commands
4. **Customize Further**: Modify profiles and settings as needed

For more information, see:

- [PowerShell VS Code Integration Guide](POWERSHELL_VSCODE_INTEGRATION.md)
- [iOS Development on Windows Guide](../ios/IOS_DEVELOPMENT_WINDOWS.md)
- [Development Setup Guide](DEVELOPMENT.md)
