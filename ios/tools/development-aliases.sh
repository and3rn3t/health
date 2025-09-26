#!/bin/bash
# VitalSense Development Aliases
# Source this file in your shell profile for quick access to common commands

# Quick navigation
alias vs-root='cd /Users/ma55700/Documents/GitHub/VitalSense'
alias vs-docs='cd /Users/ma55700/Documents/GitHub/VitalSense/Documentation'
alias vs-scripts='cd /Users/ma55700/Documents/GitHub/VitalSense/Scripts/Build'

# Build shortcuts
alias vs-build='./Scripts/Build/build-and-run.sh'
alias vs-fast='./Scripts/Build/fast-build.sh'
alias vs-clean='./Scripts/Build/optimize-xcode.sh'
alias vs-preflight='./Scripts/Build/preflight-xcode-finalization.sh'
alias vs-sign='./Scripts/Build/signing-audit.sh'

# Development shortcuts
alias vs-open='open VitalSense.xcworkspace'
alias vs-test='xcodebuild test -workspace VitalSense.xcworkspace -scheme VitalSense'
alias vs-lint='./Scripts/Build/swiftlint-precheck.ps1'

# Recovery tools
alias vs-health='./Scripts/Recovery/check_project_health.sh'
alias vs-recover='./Scripts/Recovery/ultimate_recovery.sh'

# Documentation
alias vs-doc-index='open Documentation/INDEX.md'
alias vs-copilot='open Documentation/COPILOT_INSTRUCTIONS.md'

echo "VitalSense development aliases loaded!"
echo "Use vs-<command> for quick access to common tasks"