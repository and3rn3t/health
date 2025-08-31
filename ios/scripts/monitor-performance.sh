#!/bin/bash

# Performance monitoring and optimization script
# Tracks build times, memory usage, and app performance

set -e

# Configuration
LOG_FILE="performance-monitor.log"
BUILD_TIMES_FILE="build-times.csv"
MEMORY_LOG="memory-usage.log"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}📊 HealthKit Bridge Performance Monitor${NC}"
echo "========================================"

# Create logs directory
mkdir -p logs

# Function to log with timestamp
log_with_timestamp() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "logs/$LOG_FILE"
}

# Monitor build performance
monitor_build_performance() {
    echo -e "${GREEN}⏱️  Monitoring build performance...${NC}"
    
    local start_time=$(date +%s)
    local build_output=$(mktemp)
    
    # Run build with timing
    time xcodebuild build \
        -project HealthKitBridge.xcodeproj \
        -scheme HealthKitBridge \
        -destination "platform=iOS Simulator,name=iPhone 15 Pro" \
        -quiet > "$build_output" 2>&1
    
    local end_time=$(date +%s)
    local build_duration=$((end_time - start_time))
    
    # Log build time
    echo "$(date '+%Y-%m-%d %H:%M:%S'),$build_duration,success" >> "logs/$BUILD_TIMES_FILE"
    log_with_timestamp "Build completed in ${build_duration}s"
    
    # Check for warnings/errors
    local warnings=$(grep -c "warning:" "$build_output" || echo "0")
    local errors=$(grep -c "error:" "$build_output" || echo "0")
    
    log_with_timestamp "Build stats: ${warnings} warnings, ${errors} errors"
    
    rm "$build_output"
}

# Monitor memory usage
monitor_memory_usage() {
    echo -e "${GREEN}💾 Monitoring memory usage...${NC}"
    
    # Xcode memory usage
    local xcode_memory=$(ps aux | grep -E "Xcode" | grep -v grep | awk '{sum+=$4} END {print sum}' || echo "0")
    
    # Simulator memory usage
    local simulator_memory=$(ps aux | grep -E "Simulator|simulatord" | grep -v grep | awk '{sum+=$4} END {print sum}' || echo "0")
    
    # System memory
    local system_memory=$(vm_stat | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    
    log_with_timestamp "Memory - Xcode: ${xcode_memory}%, Simulator: ${simulator_memory}%, Free Pages: ${system_memory}"
}

# Monitor disk usage
monitor_disk_usage() {
    echo -e "${GREEN}💿 Monitoring disk usage...${NC}"
    
    # Build artifacts size
    local build_size=$(du -sh build/ 2>/dev/null | awk '{print $1}' || echo "0B")
    
    # Derived data size
    local derived_data_size=$(du -sh ~/Library/Developer/Xcode/DerivedData/HealthKitBridge-* 2>/dev/null | awk '{print $1}' || echo "0B")
    
    log_with_timestamp "Disk usage - Build: ${build_size}, DerivedData: ${derived_data_size}"
}

# Clean up old data
cleanup_old_data() {
    echo -e "${YELLOW}🧹 Cleaning up old performance data...${NC}"
    
    # Keep only last 100 entries in build times
    if [ -f "logs/$BUILD_TIMES_FILE" ]; then
        tail -100 "logs/$BUILD_TIMES_FILE" > "logs/${BUILD_TIMES_FILE}.tmp"
        mv "logs/${BUILD_TIMES_FILE}.tmp" "logs/$BUILD_TIMES_FILE"
    fi
    
    # Keep only last 1000 lines in log file
    if [ -f "logs/$LOG_FILE" ]; then
        tail -1000 "logs/$LOG_FILE" > "logs/${LOG_FILE}.tmp"
        mv "logs/${LOG_FILE}.tmp" "logs/$LOG_FILE"
    fi
}

# Generate performance report
generate_report() {
    echo -e "${BLUE}📈 Generating performance report...${NC}"
    
    local report_file="logs/performance-report-$(date +%Y%m%d-%H%M%S).txt"
    
    cat > "$report_file" << EOF
HealthKit Bridge Performance Report
Generated: $(date)

BUILD PERFORMANCE:
EOF
    
    if [ -f "logs/$BUILD_TIMES_FILE" ]; then
        echo "Recent build times:" >> "$report_file"
        tail -10 "logs/$BUILD_TIMES_FILE" | while IFS=',' read -r timestamp duration status; do
            echo "  $timestamp: ${duration}s ($status)" >> "$report_file"
        done
        
        # Calculate average build time
        local avg_time=$(awk -F',' '{sum+=$2; count++} END {print int(sum/count)}' "logs/$BUILD_TIMES_FILE")
        echo "Average build time: ${avg_time}s" >> "$report_file"
    fi
    
    echo -e "\nSYSTEM STATUS:" >> "$report_file"
    echo "Xcode version: $(xcodebuild -version | head -1)" >> "$report_file"
    echo "macOS version: $(sw_vers -productVersion)" >> "$report_file"
    echo "Available memory: $(vm_stat | grep 'Pages free' | awk '{print $3}' | sed 's/\.//')" >> "$report_file"
    
    echo "Report saved to: $report_file"
}

# Main execution
case "${1:-monitor}" in
    "build")
        monitor_build_performance
        ;;
    "memory")
        monitor_memory_usage
        ;;
    "disk")
        monitor_disk_usage
        ;;
    "report")
        generate_report
        ;;
    "cleanup")
        cleanup_old_data
        ;;
    "monitor"|*)
        log_with_timestamp "Starting performance monitoring session"
        monitor_build_performance
        monitor_memory_usage
        monitor_disk_usage
        cleanup_old_data
        echo -e "${GREEN}✅ Performance monitoring complete${NC}"
        echo "View logs in: logs/"
        ;;
esac