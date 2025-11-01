#!/bin/bash

# VitalSense Build Performance Monitor
# Tracks build times and provides optimization recommendations

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
METRICS_FILE="$PROJECT_ROOT/build_metrics.json"
LOG_FILE="$PROJECT_ROOT/build_performance.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 VitalSense Build Performance Monitor${NC}"
echo "================================================="

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to measure build time
measure_build() {
    local scheme="$1"
    local configuration="$2"
    local clean_build="$3"

    log "Starting ${configuration} build for ${scheme}"

    local start_time=$(date +%s.%N)

    # Build command with timing
    local build_cmd="xcodebuild -workspace VitalSense.xcworkspace -scheme $scheme -configuration $configuration"

    if [ "$clean_build" = "true" ]; then
        build_cmd="$build_cmd clean build"
    else
        build_cmd="$build_cmd build"
    fi

    # Add performance flags
    build_cmd="$build_cmd -showBuildTimingSummary -parallelizeTargets -maximum-concurrent-test-simulator-destinations 4"

    echo -e "${YELLOW}Executing: $build_cmd${NC}"

    if eval "$build_cmd" > "build_${scheme}_${configuration}.log" 2>&1; then
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc)

        echo -e "${GREEN}✅ Build successful in ${duration}s${NC}"
        log "Build completed successfully in ${duration}s"

        # Save metrics
        save_metrics "$scheme" "$configuration" "$duration" "success" "$clean_build"

        return 0
    else
        local end_time=$(date +%s.%N)
        local duration=$(echo "$end_time - $start_time" | bc)

        echo -e "${RED}❌ Build failed after ${duration}s${NC}"
        log "Build failed after ${duration}s"

        # Save metrics even for failed builds
        save_metrics "$scheme" "$configuration" "$duration" "failed" "$clean_build"

        return 1
    fi
}

# Function to save metrics to JSON
save_metrics() {
    local scheme="$1"
    local configuration="$2"
    local duration="$3"
    local status="$4"
    local clean_build="$5"

    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    # Create metrics entry
    local metrics_entry=$(cat <<EOF
{
  "timestamp": "$timestamp",
  "scheme": "$scheme",
  "configuration": "$configuration",
  "duration": $duration,
  "status": "$status",
  "clean_build": $clean_build,
  "xcode_version": "$(xcodebuild -version | head -1)",
  "swift_version": "$(swift --version | head -1)"
}
EOF
)

    # Initialize metrics file if it doesn't exist
    if [ ! -f "$METRICS_FILE" ]; then
        echo "[]" > "$METRICS_FILE"
    fi

    # Add new entry to metrics file
    local tmp_file=$(mktemp)
    jq ". += [$metrics_entry]" "$METRICS_FILE" > "$tmp_file" && mv "$tmp_file" "$METRICS_FILE"
}

# Function to analyze build performance
analyze_performance() {
    if [ ! -f "$METRICS_FILE" ]; then
        echo -e "${YELLOW}⚠️ No metrics file found. Run some builds first.${NC}"
        return
    fi

    echo -e "${BLUE}📊 Build Performance Analysis${NC}"
    echo "=============================="

    # Average build times by configuration
    echo -e "${YELLOW}Average Build Times:${NC}"
    jq -r '.[] | select(.status == "success") | "\(.configuration): \(.duration)s"' "$METRICS_FILE" | \
    awk '{config=$1; gsub(/:/, "", config); sum[config]+=$2; count[config]++} END {for (c in sum) printf "  %s: %.2fs (avg of %d builds)\n", c, sum[c]/count[c], count[c]}'

    # Recent build trends (last 10 builds)
    echo -e "${YELLOW}Recent Build Trends (Last 10):${NC}"
    jq -r '.[-10:] | .[] | "\(.timestamp) | \(.configuration) | \(.duration)s | \(.status)"' "$METRICS_FILE" | \
    while IFS='|' read -r timestamp config duration status; do
        if [ "$status" = " success" ]; then
            echo -e "  ${GREEN}✅${NC} $timestamp |$config |$duration |$status"
        else
            echo -e "  ${RED}❌${NC} $timestamp |$config |$duration |$status"
        fi
    done

    # Performance recommendations
    echo -e "${YELLOW}🚀 Performance Recommendations:${NC}"

    local avg_debug=$(jq -r '[.[] | select(.configuration == "Debug" and .status == "success") | .duration] | add / length' "$METRICS_FILE" 2>/dev/null || echo "0")
    local avg_release=$(jq -r '[.[] | select(.configuration == "Release" and .status == "success") | .duration] | add / length' "$METRICS_FILE" 2>/dev/null || echo "0")

    if (( $(echo "$avg_debug > 180" | bc -l) )); then
        echo "  🔧 Debug builds are slow (${avg_debug}s avg). Consider:"
        echo "     - Enabling incremental builds"
        echo "     - Using build caching"
        echo "     - Checking for excessive dependencies"
    fi

    if (( $(echo "$avg_release > 300" | bc -l) )); then
        echo "  🔧 Release builds are slow (${avg_release}s avg). Consider:"
        echo "     - Enabling parallel builds"
        echo "     - Using thin LTO instead of full LTO"
        echo "     - Optimizing Swift compilation mode"
    fi

    echo "  💡 General optimizations:"
    echo "     - Use 'fastlane build_optimized' for performance builds"
    echo "     - Run 'fastlane optimize_cache' regularly"
    echo "     - Monitor derived data size: $(du -sh ~/Library/Developer/Xcode/DerivedData 2>/dev/null | cut -f1 || echo 'unknown')"
}

# Function to check system performance
check_system() {
    echo -e "${BLUE}🖥️ System Performance Check${NC}"
    echo "============================="

    echo "CPU cores: $(sysctl -n hw.ncpu)"
    echo "Memory: $(echo "$(sysctl -n hw.memsize) / 1024 / 1024 / 1024" | bc)GB"
    echo "Disk space: $(df -h . | tail -1 | awk '{print $4}') available"

    # Check for Xcode performance issues
    if [ -d "/Applications/Xcode.app" ]; then
        local xcode_version=$(xcodebuild -version | head -1)
        echo "Xcode: $xcode_version"

        # Check derived data size
        local derived_data_size=$(du -sh ~/Library/Developer/Xcode/DerivedData 2>/dev/null | cut -f1 || echo "unknown")
        echo "Derived Data size: $derived_data_size"

        if [ "$derived_data_size" != "unknown" ]; then
            local size_gb=$(echo "$derived_data_size" | sed 's/G.*//' | sed 's/M.*/0.1/')
            if (( $(echo "$size_gb > 10" | bc -l) 2>/dev/null )); then
                echo -e "${YELLOW}⚠️ Large derived data detected. Consider cleaning.${NC}"
            fi
        fi
    fi
}

# Main execution
case "${1:-help}" in
    "build")
        scheme="${2:-VitalSense}"
        configuration="${3:-Debug}"
        clean="${4:-false}"
        measure_build "$scheme" "$configuration" "$clean"
        ;;
    "analyze")
        analyze_performance
        ;;
    "system")
        check_system
        ;;
    "full")
        echo -e "${BLUE}🚀 Running full performance analysis...${NC}"
        check_system
        echo
        measure_build "VitalSense" "Debug" "false"
        echo
        measure_build "VitalSense" "Release" "true"
        echo
        analyze_performance
        ;;
    "help"|*)
        echo "VitalSense Build Performance Monitor"
        echo
        echo "Usage: $0 [command] [options]"
        echo
        echo "Commands:"
        echo "  build [scheme] [config] [clean]  - Measure build time"
        echo "    scheme: VitalSense (default), VitalSenseWatch"
        echo "    config: Debug (default), Release"
        echo "    clean:  true, false (default)"
        echo
        echo "  analyze                          - Analyze stored metrics"
        echo "  system                          - Check system performance"
        echo "  full                            - Run complete analysis"
        echo "  help                            - Show this help"
        echo
        echo "Examples:"
        echo "  $0 build VitalSense Release true"
        echo "  $0 analyze"
        echo "  $0 full"
        ;;
esac
