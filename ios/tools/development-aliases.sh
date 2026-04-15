#!/bin/bash
# VitalSense Development Aliases
# Usage: source /path/to/health/ios/tools/development-aliases.sh
# All paths resolved relative to this script — no hardcoded user paths.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VS_IOS_ROOT="$(dirname "$SCRIPT_DIR")"
VS_ROOT="$(dirname "$VS_IOS_ROOT")"

# Quick navigation
alias vs-root="cd \"$VS_ROOT\""
alias vs-ios="cd \"$VS_IOS_ROOT\""
alias vs-docs="cd \"$VS_ROOT/docs\""
alias vs-scripts="cd \"$VS_ROOT/scripts\""

# Web build/dev shortcuts
alias vs-dev="cd \"$VS_ROOT\" && pnpm dev"
alias vs-worker="cd \"$VS_ROOT\" && pnpm cf:dev"
alias vs-validate="cd \"$VS_ROOT\" && pnpm validate"
alias vs-build="cd \"$VS_ROOT\" && pnpm build"

# iOS build shortcuts
alias vs-xcode="open \"$VS_IOS_ROOT/Andernet-Posture/Andernet Posture.xcodeproj\""
alias vs-ios-build="cd \"$VS_IOS_ROOT\" && make build"
alias vs-ios-test="cd \"$VS_IOS_ROOT\" && make test"
alias vs-ios-lint="cd \"$VS_IOS_ROOT\" && make lint"
alias vs-ios-clean="cd \"$VS_IOS_ROOT\" && make clean"

# Doctor / health check
alias vs-doctor="cd \"$VS_ROOT\" && pnpm doctor"

echo "✅ VitalSense dev aliases loaded (root: $VS_ROOT)"