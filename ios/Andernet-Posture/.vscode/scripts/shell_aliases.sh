#!/bin/bash
# ─────────────────────────────────────────────────────────────
# Andernet Posture — shell aliases & functions
# Source this from your .zshrc:  source /path/to/project/.vscode/scripts/shell_aliases.sh
# ─────────────────────────────────────────────────────────────

# Detect project root (directory containing this script, two levels up)
_AP_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")/../.." && pwd)"

# ── Quick navigation ─────────────────────────────────────────
alias ap='cd "$_AP_ROOT"'
alias apsrc='cd "$_AP_ROOT/Andernet Posture"'
alias aptests='cd "$_AP_ROOT/Andernet PostureTests"'

# ── Build shortcuts ──────────────────────────────────────────
alias apbuild='cd "$_AP_ROOT" && set -o pipefail && xcodebuild -scheme "Andernet Posture" -project "Andernet Posture.xcodeproj" -destination "platform=iOS Simulator,name=iPhone 17 Pro" -derivedDataPath .build/DerivedData build 2>&1 | xcbeautify --quieter'
alias apclean='cd "$_AP_ROOT" && set -o pipefail && xcodebuild -scheme "Andernet Posture" -project "Andernet Posture.xcodeproj" -destination "platform=iOS Simulator,name=iPhone 17 Pro" -derivedDataPath .build/DerivedData clean build 2>&1 | xcbeautify --quieter'

# ── Test shortcuts ───────────────────────────────────────────
alias aptest='cd "$_AP_ROOT" && set -o pipefail && xcodebuild -scheme "Andernet Posture" -project "Andernet Posture.xcodeproj" -destination "platform=iOS Simulator,name=iPhone 17 Pro" -derivedDataPath .build/DerivedData -only-testing:"Andernet PostureTests" test 2>&1 | xcbeautify'

# Run a single test: aptest1 AnalyzerTests/testSomething
aptest1() {
    cd "$_AP_ROOT" && set -o pipefail && \
    xcodebuild -scheme "Andernet Posture" \
        -project "Andernet Posture.xcodeproj" \
        -destination "platform=iOS Simulator,name=iPhone 17 Pro" \
        -derivedDataPath .build/DerivedData \
        -only-testing:"Andernet PostureTests/$1" \
        test 2>&1 | xcbeautify
}

# ── Lint & format ────────────────────────────────────────────
alias aplint='cd "$_AP_ROOT" && swiftlint lint --config .swiftlint.yml --path "Andernet Posture"'
alias apfix='cd "$_AP_ROOT" && swiftlint lint --fix --config .swiftlint.yml --path "Andernet Posture"'
alias apformat='cd "$_AP_ROOT" && swiftformat "Andernet Posture" --swiftversion 6.2'

# ── Simulator ────────────────────────────────────────────────
alias simboot='xcrun simctl boot "iPhone 17 Pro" 2>/dev/null; open -a Simulator'
alias simkill='xcrun simctl shutdown all'

# Install + launch the built app
aprun() {
    cd "$_AP_ROOT"
    local APP
    APP=$(find .build/DerivedData/Build/Products/Debug-iphonesimulator -name '*.app' -maxdepth 1 2>/dev/null | head -1)
    if [ -z "$APP" ]; then echo "No .app found — run apbuild first"; return 1; fi
    local BID
    BID=$(plutil -extract CFBundleIdentifier raw "$APP/Info.plist")
    xcrun simctl install booted "$APP" && xcrun simctl launch booted "$BID"
    echo "Launched $BID"
}

# Live console log stream
aplogs() {
    cd "$_AP_ROOT"
    local APP
    APP=$(find .build/DerivedData/Build/Products/Debug-iphonesimulator -name '*.app' -maxdepth 1 2>/dev/null | head -1)
    local BID
    BID=$(plutil -extract CFBundleIdentifier raw "$APP/Info.plist" 2>/dev/null)
    xcrun simctl spawn booted log stream --predicate "subsystem == '$BID'" --level debug --style compact
}

# ── Utilities ────────────────────────────────────────────────
alias apxcode='open -a Xcode "$_AP_ROOT/Andernet Posture.xcodeproj"'
alias apnuke='rm -rf "$_AP_ROOT/.build/DerivedData" && echo "DerivedData nuked"'

# Regenerate SourceKit-LSP config
aplsp() {
    cd "$_AP_ROOT" && \
    xcode-build-server config -scheme "Andernet Posture" -project "$_AP_ROOT/Andernet Posture.xcodeproj"
    echo "buildServer.json regenerated"
}

echo "🔧 Andernet Posture shell aliases loaded (ap, apbuild, aptest, aplint, ...)"
