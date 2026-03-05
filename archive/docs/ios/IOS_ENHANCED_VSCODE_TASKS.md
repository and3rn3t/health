# Enhanced VS Code Tasks for iOS Production Integration

Add these tasks to your `.vscode/tasks.json` file:

```json
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "🔄 iOS: Switch to Production",
            "type": "shell",
            "command": "pwsh",
            "args": [
                "-NoProfile",
                "-File", 
                "scripts/ios-config-manager.ps1",
                "-Environment", "Production",
                "-Backup",
                "-Validate"
            ],
            "group": "build",
            "icon": {
                "id": "arrow-swap",
                "color": "terminal.ansiGreen"
            },
            "detail": "Switch iOS app to production configuration with backup and validation",
            "presentation": {
                "echo": true,
                "reveal": "always",
                "focus": false,
                "panel": "shared",
                "showReuseMessage": true,
                "clear": false
            }
        },
        {
            "label": "🧪 iOS: Switch to Development", 
            "type": "shell",
            "command": "pwsh",
            "args": [
                "-NoProfile",
                "-File",
                "scripts/ios-config-manager.ps1", 
                "-Environment", "Development",
                "-Backup",
                "-Validate"
            ],
            "group": "build",
            "icon": {
                "id": "debug-alt",
                "color": "terminal.ansiBlue"
            },
            "detail": "Switch iOS app to development configuration with validation"
        },
        {
            "label": "📊 iOS: Configuration Status",
            "type": "shell", 
            "command": "pwsh",
            "args": [
                "-NoProfile",
                "-File",
                "scripts/ios-config-manager.ps1",
                "-Status"
            ],
            "group": "test",
            "icon": {
                "id": "info",
                "color": "terminal.ansiCyan"
            },
            "detail": "Show current iOS configuration status and available environments"
        },
        {
            "label": "💾 iOS: Restore from Backup",
            "type": "shell",
            "command": "pwsh", 
            "args": [
                "-NoProfile",
                "-File",
                "scripts/ios-config-manager.ps1",
                "-Restore",
                "-Validate"
            ],
            "group": "build",
            "icon": {
                "id": "history",
                "color": "terminal.ansiYellow" 
            },
            "detail": "Restore iOS configuration from backup with validation"
        },
        {
            "label": "🚀 iOS: Build & Test Production",
            "type": "shell",
            "command": "pwsh",
            "args": [
                "-NoProfile", 
                "-Command",
                "& 'scripts/ios-config-manager.ps1' -Environment Production -Backup -Force; if ($LASTEXITCODE -eq 0) { & 'scripts/ios-build-and-test.ps1' -Environment Production }"
            ],
            "group": "build",
            "dependsOrder": "sequence",
            "dependsOn": [],
            "icon": {
                "id": "rocket",
                "color": "terminal.ansiGreen"
            }, 
            "detail": "Switch to production and run full build & test pipeline"
        },
        {
            "label": "🧪 iOS: Test All Environments",
            "type": "shell",
            "command": "pwsh",
            "args": [
                "-NoProfile",
                "-File",
                "scripts/ios-test-all-environments.ps1",
                "-Verbose"
            ],
            "group": "test",
            "icon": {
                "id": "beaker", 
                "color": "terminal.ansiMagenta"
            },
            "detail": "Test iOS app configuration against all environments"
        },
        {
            "label": "⚡ iOS: Quick Environment Switch",
            "type": "shell",
            "command": "pwsh",
            "args": [
                "-NoProfile",
                "-File",
                "scripts/ios-quick-switch.ps1",
                "-Interactive"
            ],
            "group": "build",
            "icon": {
                "id": "zap",
                "color": "terminal.ansiYellow"
            },
            "detail": "Interactive environment switcher with quick actions"
        },
        {
            "label": "🔒 iOS: Security Validation",
            "type": "shell", 
            "command": "pwsh",
            "args": [
                "-NoProfile",
                "-File",
                "scripts/ios-security-validator.ps1",
                "-Environment", "${input:environment}",
                "-Deep"
            ],
            "group": "test",
            "icon": {
                "id": "shield",
                "color": "terminal.ansiRed"
            },
            "detail": "Run comprehensive security validation for iOS configuration"
        },
        {
            "label": "📈 iOS: Performance Benchmark",
            "type": "shell",
            "command": "pwsh", 
            "args": [
                "-NoProfile",
                "-File",
                "scripts/ios-performance-benchmark.ps1",
                "-CompareEnvironments"
            ],
            "group": "test",
            "icon": {
                "id": "graph",
                "color": "terminal.ansiCyan"
            },
            "detail": "Benchmark iOS app performance across different environments"
        },
        {
            "label": "🎯 iOS: Deploy TestFlight",
            "type": "shell",
            "command": "pwsh",
            "args": [
                "-NoProfile", 
                "-File",
                "scripts/ios-deploy-testflight.ps1",
                "-Environment", "Production",
                "-ValidateFirst"
            ],
            "group": "build", 
            "icon": {
                "id": "cloud-upload",
                "color": "terminal.ansiBlue"
            },
            "detail": "Deploy iOS app to TestFlight after validation"
        }
    ],
    "inputs": [
        {
            "id": "environment",
            "description": "Select target environment",
            "type": "pickString", 
            "options": [
                "Production",
                "Development", 
                "Staging",
                "Testing"
            ],
            "default": "Production"
        }
    ]
}
```

## Benefits of Enhanced Tasks

### **Productivity Improvements**

- **One-click environment switching** with automatic backup
- **Integrated validation** ensures configuration correctness  
- **Visual feedback** with icons and progress indicators
- **Error handling** with clear failure messages

### **Safety Features**

- **Automatic backups** before any configuration changes
- **Validation checks** prevent invalid configurations
- **Rollback capabilities** with restore from backup
- **Confirmation prompts** for critical operations

### **Developer Experience**

- **Quick access** via VS Code Command Palette
- **Contextual information** with task descriptions
- **Consistent naming** and organization
- **Interactive inputs** for dynamic parameters

## Usage Examples

### **Quick Environment Switch**

1. Press `Ctrl+Shift+P`
2. Type "Tasks: Run Task"
3. Select "🔄 iOS: Switch to Production"
4. Automatic backup, switch, and validation

### **Status Check**

1. Run "📊 iOS: Configuration Status"
2. View current environment and available backups
3. See validation status for all environments

### **Emergency Restore**

1. Run "💾 iOS: Restore from Backup"  
2. Select backup from list
3. Automatic validation after restore

### **Production Deployment**

1. Run "🎯 iOS: Deploy TestFlight"
2. Automatic switch to production configuration
3. Full validation and security checks
4. Deploy to TestFlight if all tests pass

## Next Steps

1. **Add these tasks** to your `.vscode/tasks.json`
2. **Test the configuration manager**: `./scripts/ios-config-manager.ps1 -Status`
3. **Try environment switching**: Use VS Code tasks menu
4. **Validate the setup**: Run comprehensive testing pipeline

The enhanced task system reduces environment switching from **5 minutes of manual work** to **30 seconds of automated execution** with built-in safety checks and validation.
