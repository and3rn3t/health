#!/bin/bash

# HealthKit Bridge - Complete Development Environment Setup
# This script sets up and optimizes your entire development workflow

set -e

# Colors for beautiful output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Header
echo -e "${BLUE}╔══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                  HealthKit Bridge Setup                     ║${NC}"
echo -e "${BLUE}║              Development Environment Optimizer              ║${NC}"
echo -e "${BLUE}╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""

print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${CYAN}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_section() {
    echo ""
    echo -e "${PURPLE}🔧 $1${NC}"
    echo -e "${PURPLE}$(printf '%.0s─' {1..50})${NC}"
}

# Check prerequisites
print_section "CHECKING PREREQUISITES"

# Check Xcode
if ! command -v xcodebuild &> /dev/null; then
    print_error "Xcode not found! Please install Xcode from the App Store."
    exit 1
fi
print_status "Xcode found"

# Check Homebrew
if ! command -v brew &> /dev/null; then
    print_warning "Homebrew not found. Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
else
    print_status "Homebrew found"
fi

# 1. Install Development Tools
print_section "INSTALLING DEVELOPMENT TOOLS"

tools=("swiftlint" "gh" "jq" "tree" "eza" "node")
for tool in "${tools[@]}"; do
    if ! command -v $tool &> /dev/null; then
        print_info "Installing $tool..."
        brew install $tool
        print_status "$tool installed"
    else
        print_status "$tool already installed"
    fi
done

# 2. Optimize Xcode Settings
print_section "OPTIMIZING XCODE SETTINGS"
./scripts/optimize-xcode.sh
print_status "Xcode optimized"

# 3. Setup Git Configuration
print_section "CONFIGURING GIT"
./scripts/setup-dev-env.sh
print_status "Git configured"

# 4. Install SwiftLint
print_section "CONFIGURING SWIFTLINT"
if command -v swiftlint &> /dev/null; then
    swiftlint --version
    print_status "SwiftLint configured with project rules"
else
    print_warning "SwiftLint installation failed. Install manually: brew install swiftlint"
fi

# 5. Setup VS Code Extensions (if VS Code is installed)
print_section "CONFIGURING VS CODE"
if command -v code &> /dev/null; then
    print_info "Installing VS Code extensions..."
    code --install-extension github.copilot
    code --install-extension github.copilot-chat
    code --install-extension ms-vscode.swift
    code --install-extension ms-vscode.vscode-ios
    print_status "VS Code extensions installed"
else
    print_warning "VS Code not found. Extensions configuration saved for manual installation."
fi

# 6. Setup Terminal Enhancements
print_section "ENHANCING TERMINAL"
if [ -f ~/.zshrc ]; then
    if ! grep -q "HealthKit Bridge aliases" ~/.zshrc; then
        echo "" >> ~/.zshrc
        echo "# HealthKit Bridge aliases and functions" >> ~/.zshrc
        echo "source $(pwd)/.zshrc_additions" >> ~/.zshrc
        print_status "Terminal enhancements added to .zshrc"
    else
        print_status "Terminal enhancements already configured"
    fi
else
    print_warning "~/.zshrc not found. Creating with enhancements..."
    cp .zshrc_additions ~/.zshrc
fi

# 7. Test Build
print_section "TESTING BUILD SYSTEM"
print_info "Running test build..."
if make build > /dev/null 2>&1; then
    print_status "Build system working correctly"
else
    print_warning "Build test failed. Check project configuration."
fi

# 8. Setup Complete
print_section "SETUP COMPLETE"
echo ""
echo -e "${GREEN}🎉 HealthKit Bridge development environment is now optimized!${NC}"
echo ""
echo -e "${CYAN}Quick Start Commands:${NC}"
echo -e "  ${YELLOW}make help${NC}          - See all available commands"
echo -e "  ${YELLOW}make run${NC}           - Build and run on simulator"
echo -e "  ${YELLOW}make test${NC}          - Run all tests"
echo -e "  ${YELLOW}make lint${NC}          - Check code quality"
echo -e "  ${YELLOW}hkb${NC}                - Quick navigate to project"
echo -e "  ${YELLOW}hkb-build${NC}          - Quick build and run"
echo ""
echo -e "${CYAN}VS Code Integration:${NC}"
echo -e "  ${YELLOW}code .${NC}             - Open project in VS Code"
echo -e "  ${YELLOW}Cmd+Shift+P${NC}        - Open command palette"
echo -e "  ${YELLOW}> Tasks: Run Task${NC}   - Access build tasks"
echo ""
echo -e "${CYAN}GitHub Copilot Tips:${NC}"
echo -e "  • Use ${YELLOW}Cmd+I${NC} to open Copilot Chat"
echo -e "  • Type ${YELLOW}/explain${NC} to understand code"
echo -e "  • Type ${YELLOW}/fix${NC} to get help with errors"
echo -e "  • Use ${YELLOW}Tab${NC} to accept suggestions"
echo ""
echo -e "${PURPLE}Next Steps:${NC}"
echo -e "  1. Restart your terminal to load new aliases"
echo -e "  2. Restart Xcode to apply optimizations"
echo -e "  3. Try: ${YELLOW}make run${NC} to test everything"
echo ""
echo -e "${GREEN}Happy coding! 🚀${NC}"
