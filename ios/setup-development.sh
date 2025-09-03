#!/bin/bash
# setup-development.sh - Complete development environment setup for VitalSense Monitor

set -e

echo "🏥 Setting up VitalSense Monitor Development Environment"
echo "===================================================="

# Check if running on macOS (required for iOS development)
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script must be run on macOS for iOS development"
    exit 1
fi

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check for Xcode
if ! command_exists xcodebuild; then
    echo "❌ Xcode is required but not installed. Please install Xcode from the App Store."
    exit 1
fi

echo "✅ Xcode found"

# Check for Homebrew
if ! command_exists brew; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
fi

echo "✅ Homebrew ready"

# Install required development tools
echo "🔧 Installing development tools..."
brew install swiftlint
brew install node
brew install pre-commit
brew install fswatch

# Install Node.js dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup environment files
echo "⚙️  Setting up environment configuration..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "📝 Created .env file from template. Please customize it with your settings."
fi

# Setup git hooks
echo "🪝 Setting up git hooks..."
pre-commit install

# Setup Xcode project
echo "🔨 Setting up Xcode project..."
if [ -f "scripts/setup-xcode.sh" ]; then
    chmod +x scripts/setup-xcode.sh
    ./scripts/setup-xcode.sh
fi

# Create necessary directories
echo "📁 Creating development directories..."
mkdir -p logs
mkdir -p test_data
mkdir -p .certificates

# Check iOS Simulator
echo "📱 Checking iOS Simulator availability..."
xcrun simctl list devices available | grep "iPhone 15 Pro" || {
    echo "⚠️  iPhone 15 Pro simulator not found. Installing..."
    xcrun simctl create "iPhone 15 Pro" "com.apple.CoreSimulator.SimDeviceType.iPhone-15-Pro" "com.apple.CoreSimulator.SimRuntime.iOS-17-0"
}

# Setup VS Code extensions (if VS Code is installed)
if command_exists code; then
    echo "🔌 Installing recommended VS Code extensions..."
    code --install-extension ms-vscode.vscode-typescript-next
    code --install-extension ms-vscode.swift
    code --install-extension bradlc.vscode-tailwindcss
    code --install-extension ms-vscode.vscode-json
fi

# Run initial build test
echo "🔬 Running initial build test..."
if make build >/dev/null 2>&1; then
    echo "✅ Initial build successful"
else
    echo "⚠️  Initial build failed. Please check configuration."
fi

echo ""
echo "🎉 Development environment setup complete!"
echo ""
echo "Next steps:"
echo "1. Customize your .env file with your API keys and settings"
echo "2. Run 'make help' to see available development commands"
echo "3. Run 'make dev-server' to start the WebSocket test server"
echo "4. Open the project in Xcode or VS Code to start developing"
echo ""
echo "Useful commands:"
echo "  make build          - Build the iOS project"
echo "  make test           - Run tests"
echo "  make dev-server     - Start development server"
echo "  make setup          - Re-run this setup"
echo ""
