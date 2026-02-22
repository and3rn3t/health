#!/bin/bash
# ─────────────────────────────────────────────────────────────
# xcode-setup.sh — One-time setup for VS Code + Xcode workflow
# Run: chmod +x .vscode/scripts/xcode-setup.sh && ./.vscode/scripts/xcode-setup.sh
# ─────────────────────────────────────────────────────────────
set -euo pipefail

echo "🔧 Setting up Xcode tooling for VS Code..."
echo ""

# ── 1. Homebrew prerequisites ─────────────────────────────
check_install() {
    if command -v "$1" &>/dev/null; then
        echo "  ✅ $1 already installed ($(command -v "$1"))"
    else
        echo "  📦 Installing $1..."
        brew install "$2"
    fi
}

echo "── CLI Tools ──────────────────────────────────────────"
check_install swiftlint swiftlint
check_install xcbeautify xcbeautify
check_install xcode-build-server xcode-build-server
check_install swiftformat swiftformat
echo ""

# ── 2. Configure xcode-build-server for SourceKit-LSP ─────
echo "── SourceKit-LSP Integration ────────────────────────"
PROJ_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
cd "$PROJ_DIR"

if command -v xcode-build-server &>/dev/null; then
    echo "  Generating buildServer.json for SourceKit-LSP..."
    xcode-build-server config \
        -scheme "Andernet Posture" \
        -project "$PROJ_DIR/Andernet Posture.xcodeproj"
    echo "  ✅ buildServer.json created"
else
    echo "  ⚠️  xcode-build-server not found, skipping"
fi
echo ""

# ── 3. Create .build directory ─────────────────────────────
echo "── Build Directory ────────────────────────────────────"
mkdir -p "$PROJ_DIR/.build"
echo "  ✅ .build/ directory ready"
echo ""

# ── 4. Verify Xcode CLI tools ─────────────────────────────
echo "── Xcode Environment ────────────────────────────────"
echo "  Xcode path:    $(xcode-select -p)"
echo "  Swift version: $(swift --version 2>/dev/null | head -1)"
echo "  Xcode version: $(xcodebuild -version 2>/dev/null | head -1)"
echo ""

# ── 5. Recommend VS Code extensions ───────────────────────
echo "── VS Code Extensions ───────────────────────────────"
echo "  Run this in VS Code terminal to install recommended extensions:"
echo ""
echo "  code --install-extension sweetpad.sweetpad"
echo "  code --install-extension pvasek.sourcekit-lsp--dev-unofficial"
echo "  code --install-extension mariomatheu.syntax-project-pbxproj"
echo ""

echo "✅ Setup complete! Restart VS Code for full effect."
echo ""
echo "📋 Quick reference:"
echo "  Cmd+B           → Build project"
echo "  Cmd+Shift+B     → Clean build"
echo "  Cmd+U           → Run unit tests"
echo "  Cmd+Shift+L     → Lint current file"
echo "  Cmd+Shift+P → 'Run Task' for all Xcode tasks"
