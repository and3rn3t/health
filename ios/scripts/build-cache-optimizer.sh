#!/bin/bash

# VitalSense Build Cache Optimizer
# Cleans and optimizes Xcode build caches for better performance

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🧹 VitalSense Build Cache Optimizer${NC}"
echo "===================================="

# Function to get directory size
get_size() {
    if [ -d "$1" ]; then
        du -sh "$1" 2>/dev/null | cut -f1
    else
        echo "0B"
    fi
}

# Function to clean Xcode derived data
clean_derived_data() {
    echo -e "${YELLOW}Cleaning Xcode Derived Data...${NC}"

    local derived_data_path="$HOME/Library/Developer/Xcode/DerivedData"
    local before_size=$(get_size "$derived_data_path")

    if [ -d "$derived_data_path" ]; then
        echo "  Before: $before_size"
        rm -rf "$derived_data_path"/*
        echo -e "  ${GREEN}✅ Derived Data cleaned${NC}"
    else
        echo "  No Derived Data found"
    fi
}

# Function to clean Swift Package Manager caches
clean_spm_cache() {
    echo -e "${YELLOW}Cleaning Swift Package Manager caches...${NC}"

    # System-wide SPM cache
    local spm_cache="$HOME/Library/Caches/org.swift.swiftpm"
    local before_size=$(get_size "$spm_cache")

    if [ -d "$spm_cache" ]; then
        echo "  Before: $before_size"
        rm -rf "$spm_cache"
        echo -e "  ${GREEN}✅ SPM cache cleaned${NC}"
    fi

    # Project-local build directory
    if [ -d "$PROJECT_ROOT/.build" ]; then
        local local_size=$(get_size "$PROJECT_ROOT/.build")
        echo "  Local .build: $local_size"
        rm -rf "$PROJECT_ROOT/.build"
        echo -e "  ${GREEN}✅ Local build cache cleaned${NC}"
    fi
}

# Function to clean Xcode archives (keep recent ones)
clean_archives() {
    local keep_count="${1:-5}"
    echo -e "${YELLOW}Cleaning Xcode Archives (keeping ${keep_count} most recent)...${NC}"

    local archives_path="$HOME/Library/Developer/Xcode/Archives"

    if [ -d "$archives_path" ]; then
        local before_count=$(find "$archives_path" -name "*.xcarchive" -type d | wc -l | tr -d ' ')
        local before_size=$(get_size "$archives_path")

        echo "  Before: $before_count archives, $before_size"

        # Keep only the most recent archives
        find "$archives_path" -name "*.xcarchive" -type d -exec ls -t1d {} + | \
        tail -n +$((keep_count + 1)) | \
        xargs -r rm -rf

        local after_count=$(find "$archives_path" -name "*.xcarchive" -type d | wc -l | tr -d ' ')
        local after_size=$(get_size "$archives_path")

        echo "  After: $after_count archives, $after_size"
        echo -e "  ${GREEN}✅ Old archives cleaned${NC}"
    else
        echo "  No archives found"
    fi
}

# Function to clean simulator data
clean_simulators() {
    echo -e "${YELLOW}Cleaning iOS Simulator data...${NC}"

    # Reset all unavailable simulators
    xcrun simctl delete unavailable 2>/dev/null || true

    # Clean simulator logs
    local sim_logs="$HOME/Library/Logs/CoreSimulator"
    if [ -d "$sim_logs" ]; then
        local before_size=$(get_size "$sim_logs")
        echo "  Simulator logs before: $before_size"
        rm -rf "$sim_logs"/*
        echo -e "  ${GREEN}✅ Simulator logs cleaned${NC}"
    fi

    echo -e "  ${GREEN}✅ Simulator cleanup completed${NC}"
}

# Function to optimize Swift compilation cache
optimize_swift_cache() {
    echo -e "${YELLOW}Optimizing Swift compilation cache...${NC}"

    # Clear Swift module cache
    local swift_cache="$HOME/Library/Caches/com.apple.dt.Xcode/ModuleCache.noindex"
    if [ -d "$swift_cache" ]; then
        local before_size=$(get_size "$swift_cache")
        echo "  Module cache before: $before_size"
        rm -rf "$swift_cache"
        echo -e "  ${GREEN}✅ Swift module cache cleared${NC}"
    fi

    # Clear SourceKit cache
    local sourcekit_cache="$HOME/Library/Caches/com.apple.dt.Xcode/SourceKit"
    if [ -d "$sourcekit_cache" ]; then
        local before_size=$(get_size "$sourcekit_cache")
        echo "  SourceKit cache before: $before_size"
        rm -rf "$sourcekit_cache"
        echo -e "  ${GREEN}✅ SourceKit cache cleared${NC}"
    fi
}

# Function to resolve package dependencies
resolve_packages() {
    echo -e "${YELLOW}Resolving Swift Package dependencies...${NC}"

    cd "$PROJECT_ROOT"

    if [ -f "VitalSense.xcworkspace/contents.xcworkspacedata" ]; then
        echo "  Resolving packages for VitalSense.xcworkspace..."
        xcodebuild -resolvePackageDependencies -workspace VitalSense.xcworkspace -scheme VitalSense
        echo -e "  ${GREEN}✅ Package dependencies resolved${NC}"
    elif [ -f "VitalSense.xcodeproj/project.pbxproj" ]; then
        echo "  Resolving packages for VitalSense.xcodeproj..."
        xcodebuild -resolvePackageDependencies -project VitalSense.xcodeproj -scheme VitalSense
        echo -e "  ${GREEN}✅ Package dependencies resolved${NC}"
    else
        echo -e "  ${RED}⚠️ No workspace or project found${NC}"
    fi
}

# Function to show cache status
show_cache_status() {
    echo -e "${BLUE}📊 Current Cache Status${NC}"
    echo "======================="

    echo "Derived Data: $(get_size "$HOME/Library/Developer/Xcode/DerivedData")"
    echo "SPM Cache: $(get_size "$HOME/Library/Caches/org.swift.swiftpm")"
    echo "Module Cache: $(get_size "$HOME/Library/Caches/com.apple.dt.Xcode/ModuleCache.noindex")"
    echo "Archives: $(find "$HOME/Library/Developer/Xcode/Archives" -name "*.xcarchive" -type d 2>/dev/null | wc -l | tr -d ' ') archives"
    echo "Simulator Logs: $(get_size "$HOME/Library/Logs/CoreSimulator")"

    if [ -d "$PROJECT_ROOT/.build" ]; then
        echo "Local Build: $(get_size "$PROJECT_ROOT/.build")"
    fi
}

# Function to run full optimization
full_optimization() {
    echo -e "${BLUE}🚀 Running full cache optimization...${NC}"
    echo

    show_cache_status
    echo

    clean_derived_data
    clean_spm_cache
    clean_archives 5
    clean_simulators
    optimize_swift_cache

    echo
    echo -e "${YELLOW}Resolving dependencies...${NC}"
    resolve_packages

    echo
    echo -e "${GREEN}🎉 Full optimization completed!${NC}"
    echo
    show_cache_status
}

# Function to quick clean (minimal disruption)
quick_clean() {
    echo -e "${BLUE}⚡ Quick cache cleanup...${NC}"

    # Only clean problematic caches, keep derived data
    optimize_swift_cache

    # Clean only old simulator logs
    local sim_logs="$HOME/Library/Logs/CoreSimulator"
    if [ -d "$sim_logs" ]; then
        find "$sim_logs" -name "*.log" -mtime +7 -delete 2>/dev/null || true
    fi

    echo -e "${GREEN}✅ Quick cleanup completed${NC}"
}

# Main execution
case "${1:-help}" in
    "full")
        full_optimization
        ;;
    "quick")
        quick_clean
        ;;
    "derived")
        clean_derived_data
        ;;
    "spm")
        clean_spm_cache
        ;;
    "archives")
        keep_count="${2:-5}"
        clean_archives "$keep_count"
        ;;
    "simulators")
        clean_simulators
        ;;
    "swift")
        optimize_swift_cache
        ;;
    "resolve")
        resolve_packages
        ;;
    "status")
        show_cache_status
        ;;
    "help"|*)
        echo "VitalSense Build Cache Optimizer"
        echo
        echo "Usage: $0 [command] [options]"
        echo
        echo "Commands:"
        echo "  full                    - Complete cache optimization (recommended)"
        echo "  quick                   - Quick cleanup (minimal disruption)"
        echo "  derived                 - Clean Xcode Derived Data only"
        echo "  spm                     - Clean Swift Package Manager caches"
        echo "  archives [count]        - Clean old Xcode archives (keep [count], default 5)"
        echo "  simulators              - Clean iOS Simulator data"
        echo "  swift                   - Clean Swift compiler caches"
        echo "  resolve                 - Resolve Swift Package dependencies"
        echo "  status                  - Show current cache status"
        echo "  help                    - Show this help"
        echo
        echo "Examples:"
        echo "  $0 full                 # Complete optimization"
        echo "  $0 quick                # Quick cleanup"
        echo "  $0 archives 3           # Keep only 3 most recent archives"
        echo "  $0 status               # Check cache sizes"
        echo
        echo "Recommended usage:"
        echo "  - Run '$0 full' weekly for complete optimization"
        echo "  - Run '$0 quick' daily during active development"
        echo "  - Run '$0 status' to monitor cache growth"
        ;;
esac
