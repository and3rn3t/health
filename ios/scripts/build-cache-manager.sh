#!/bin/bash

# Intelligent Build Cache Manager
# Optimizes build times through smart caching strategies

set -e

# Configuration
CACHE_DIR="$HOME/.healthkit-bridge-cache"
DERIVED_DATA_CACHE="$CACHE_DIR/derived-data"
BUILD_CACHE="$CACHE_DIR/builds"
DEPENDENCY_CACHE="$CACHE_DIR/dependencies"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}🚀 Build Cache Manager${NC}"
echo "====================="

# Create cache directories
setup_cache() {
    echo -e "${GREEN}📁 Setting up cache directories...${NC}"
    mkdir -p "$CACHE_DIR" "$DERIVED_DATA_CACHE" "$BUILD_CACHE" "$DEPENDENCY_CACHE"
}

# Cache current build state
cache_build() {
    echo -e "${GREEN}💾 Caching current build...${NC}"
    
    local cache_key=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
    local cache_path="$BUILD_CACHE/$cache_key"
    
    if [ ! -d "$cache_path" ]; then
        mkdir -p "$cache_path"
        
        # Cache build products
        if [ -d "build" ]; then
            echo "Caching build products..."
            cp -R build/ "$cache_path/build/"
        fi
        
        # Cache derived data
        local derived_data=$(find ~/Library/Developer/Xcode/DerivedData -name "HealthKitBridge-*" -type d | head -1)
        if [ -n "$derived_data" ] && [ -d "$derived_data" ]; then
            echo "Caching derived data..."
            cp -R "$derived_data" "$cache_path/derived-data/"
        fi
        
        echo "Build cached with key: $cache_key"
    else
        echo "Build already cached for commit: $cache_key"
    fi
}

# Restore cached build
restore_cache() {
    echo -e "${GREEN}🔄 Restoring cached build...${NC}"
    
    local cache_key=$(git rev-parse HEAD 2>/dev/null || echo "no-git")
    local cache_path="$BUILD_CACHE/$cache_key"
    
    if [ -d "$cache_path" ]; then
        echo "Restoring build from cache: $cache_key"
        
        # Restore build products
        if [ -d "$cache_path/build" ]; then
            rm -rf build/
            cp -R "$cache_path/build/" build/
            echo "Build products restored"
        fi
        
        # Restore derived data
        if [ -d "$cache_path/derived-data" ]; then
            local derived_data_dir="~/Library/Developer/Xcode/DerivedData/HealthKitBridge-$(basename "$cache_path/derived-data")"
            mkdir -p "$(dirname "$derived_data_dir")"
            cp -R "$cache_path/derived-data/" "$derived_data_dir"
            echo "Derived data restored"
        fi
        
        return 0
    else
        echo "No cache found for commit: $cache_key"
        return 1
    fi
}

# Clean old caches
clean_cache() {
    echo -e "${YELLOW}🧹 Cleaning old caches...${NC}"
    
    # Keep only last 10 build caches
    if [ -d "$BUILD_CACHE" ]; then
        find "$BUILD_CACHE" -maxdepth 1 -type d | tail -n +11 | xargs rm -rf
        echo "Cleaned old build caches"
    fi
    
    # Clean caches older than 7 days
    find "$CACHE_DIR" -type f -mtime +7 -delete 2>/dev/null || true
    echo "Cleaned caches older than 7 days"
}

# Show cache status
cache_status() {
    echo -e "${BLUE}📊 Cache Status${NC}"
    echo "==============="
    
    if [ -d "$CACHE_DIR" ]; then
        local cache_size=$(du -sh "$CACHE_DIR" | awk '{print $1}')
        echo "Total cache size: $cache_size"
        
        local build_count=$(find "$BUILD_CACHE" -maxdepth 1 -type d 2>/dev/null | wc -l)
        echo "Cached builds: $((build_count - 1))"
        
        echo -e "\nRecent caches:"
        find "$BUILD_CACHE" -maxdepth 1 -type d -exec basename {} \; | head -5 | while read -r cache; do
            if [ "$cache" != "$(basename "$BUILD_CACHE")" ]; then
                echo "  - $cache"
            fi
        done
    else
        echo "No cache directory found"
    fi
}

# Smart build with caching
smart_build() {
    echo -e "${GREEN}🚀 Smart build with caching...${NC}"
    
    # Try to restore from cache first
    if restore_cache; then
        echo "✅ Build restored from cache - skipping compilation"
        return 0
    fi
    
    # If no cache, build normally
    echo "No cache available - building from scratch..."
    
    # Build with optimizations
    xcodebuild build \
        -project HealthKitBridge.xcodeproj \
        -scheme HealthKitBridge \
        -configuration Debug \
        -destination "platform=iOS Simulator,name=iPhone 15 Pro" \
        -xcconfig BuildOptimizations.xcconfig \
        -jobs $(sysctl -n hw.ncpu) \
        CODE_SIGNING_REQUIRED=NO \
        CODE_SIGNING_ALLOWED=NO \
        COMPILER_INDEX_STORE_ENABLE=NO
    
    # Cache the successful build
    cache_build
    
    echo "✅ Build completed and cached"
}

# Main execution
setup_cache

case "${1:-status}" in
    "build")
        smart_build
        ;;
    "cache")
        cache_build
        ;;
    "restore")
        restore_cache
        ;;
    "clean")
        clean_cache
        ;;
    "status"|*)
        cache_status
        ;;
esac