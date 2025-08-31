#!/bin/bash

# Xcode optimization script for better performance
# Run this once to optimize your Xcode environment

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Xcode Performance Optimization${NC}"
echo "=================================="

# Increase build system performance
echo -e "${GREEN}Optimizing build system...${NC}"

# Set better defaults for build system
defaults write com.apple.dt.Xcode BuildSystemScheduleInherentlyParallelCommandsExclusively -bool YES
defaults write com.apple.dt.Xcode EnableBuildDebugging -bool NO
defaults write com.apple.dt.Xcode ShowBuildOperationDuration -bool YES

# Enable faster Swift compilation
echo -e "${GREEN}Optimizing Swift compilation...${NC}"
defaults write com.apple.dt.Xcode DebuggerSpeedUp -bool YES
defaults write com.apple.dt.Xcode IDEBuildOperationMaxNumberOfConcurrentCompileTasks -int $(sysctl -n hw.ncpu)

# Improve indexing performance
echo -e "${GREEN}Optimizing indexing...${NC}"
defaults write com.apple.dt.Xcode IDEIndexDisable -bool NO
defaults write com.apple.dt.Xcode IDEIndexStoreInMemoryDatabasePolicy -string "Default"

# Enable useful debugging features
echo -e "${GREEN}Enabling helpful debug features...${NC}"
defaults write com.apple.dt.Xcode DVTTextShowFoldingOnFocusChange -bool YES
defaults write com.apple.dt.Xcode DVTTextShowLineNumbers -bool YES
defaults write com.apple.dt.Xcode DVTSourceTextShowWhitespaceCharacters -bool YES

# Memory and performance settings
echo -e "${GREEN}Optimizing memory usage...${NC}"
defaults write com.apple.dt.Xcode DVTPlugInManagerNonApplePlugIns -array
defaults write com.apple.dt.Xcode IDEWorkspaceCleanBuildFolder -bool YES

echo -e "${GREEN}✅ Xcode optimization completed!${NC}"
echo -e "${YELLOW}⚠️  Please restart Xcode for changes to take effect${NC}"