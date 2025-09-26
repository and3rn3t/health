#!/bin/bash

# VitalSense Project Stability Toolkit
# This script provides automated project recovery and corruption prevention

set -e

PROJECT_DIR="/Users/ma55700/Documents/GitHub/Health-2"
PROJECT_FILE="$PROJECT_DIR/VitalSense.xcodeproj/project.pbxproj"
BACKUP_DIR="$PROJECT_DIR/.project_backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🔧 VitalSense Project Stability Toolkit"
echo "========================================"

# Function to create clean backup
create_clean_backup() {
    echo "📁 Creating clean backup..."
    mkdir -p "$BACKUP_DIR"
    if [ -f "$PROJECT_FILE" ]; then
        cp "$PROJECT_FILE" "$BACKUP_DIR/project.pbxproj.clean_$TIMESTAMP"
        echo "✅ Clean backup created: project.pbxproj.clean_$TIMESTAMP"
    fi
}

# Function to validate project file integrity
validate_project_file() {
    echo "🔍 Validating project file integrity..."
    
    if [ ! -f "$PROJECT_FILE" ]; then
        echo "❌ Project file not found!"
        return 1
    fi
    
    # Check for corruption indicators
    if grep -q "Backup restored content" "$PROJECT_FILE"; then
        echo "❌ Project file contains backup restoration artifacts"
        return 1
    fi
    
    if grep -q "AAAA0000" "$PROJECT_FILE"; then
        echo "❌ Project file contains placeholder/corrupted UUIDs"
        return 1
    fi
    
    # Check file structure
    if ! grep -q "archiveVersion = 1" "$PROJECT_FILE"; then
        echo "❌ Project file missing required archive version"
        return 1
    fi
    
    echo "✅ Project file validation passed"
    return 0
}

# Function to clean derived data and build artifacts
clean_build_artifacts() {
    echo "🧹 Cleaning build artifacts..."
    
    # Clean Xcode derived data
    rm -rf ~/Library/Developer/Xcode/DerivedData/VitalSense-*
    
    # Clean project build directory
    if [ -d "$PROJECT_DIR/build" ]; then
        rm -rf "$PROJECT_DIR/build"
    fi
    
    # Clean corrupted log files
    rm -f "$PROJECT_DIR/VitalSense/build.log"
    rm -f "$PROJECT_DIR/VitalSense/build_after_fix.log"
    
    echo "✅ Build artifacts cleaned"
}

# Function to restore from best available backup
restore_from_backup() {
    echo "🔄 Attempting to restore from backup..."
    
    # Try the most recent backup files in order of preference
    BACKUP_FILES=(
        "$PROJECT_DIR/VitalSense.xcodeproj/project.pbxproj.backup_20250923194421"
        "$PROJECT_DIR/VitalSense.xcodeproj/project.pbxproj.backup_20250923184149"
        "$PROJECT_DIR/VitalSense.xcodeproj/project.pbxproj.bak.20250923-211055"
    )
    
    for backup in "${BACKUP_FILES[@]}"; do
        if [ -f "$backup" ]; then
            echo "🔍 Testing backup: $(basename "$backup")"
            
            # Create temporary copy to test
            cp "$backup" "/tmp/test_project.pbxproj"
            
            # Basic validation
            if grep -q "archiveVersion = 1" "/tmp/test_project.pbxproj" && \
               ! grep -q "Backup restored content" "/tmp/test_project.pbxproj" && \
               ! grep -q "AAAA0000" "/tmp/test_project.pbxproj"; then
                
                echo "✅ Valid backup found: $(basename "$backup")"
                cp "$backup" "$PROJECT_FILE"
                rm "/tmp/test_project.pbxproj"
                return 0
            fi
            
            rm "/tmp/test_project.pbxproj"
        fi
    done
    
    echo "❌ No valid backup found"
    return 1
}

# Function to setup git hooks for corruption prevention
setup_git_hooks() {
    echo "🪝 Setting up Git hooks for corruption prevention..."
    
    HOOKS_DIR="$PROJECT_DIR/.git/hooks"
    
    # Pre-commit hook to validate project file
    cat > "$HOOKS_DIR/pre-commit" << 'EOF'
#!/bin/bash
PROJECT_FILE="VitalSense.xcodeproj/project.pbxproj"

if [ -f "$PROJECT_FILE" ]; then
    if grep -q "Backup restored content\|AAAA0000" "$PROJECT_FILE"; then
        echo "❌ Corrupted project file detected in commit!"
        echo "Run ./project_stability_toolkit.sh to fix before committing"
        exit 1
    fi
fi
EOF
    
    chmod +x "$HOOKS_DIR/pre-commit"
    echo "✅ Git pre-commit hook installed"
}

# Function to create project health monitor
create_health_monitor() {
    echo "🏥 Creating project health monitor..."
    
    cat > "$PROJECT_DIR/check_project_health.sh" << 'EOF'
#!/bin/bash
PROJECT_FILE="VitalSense.xcodeproj/project.pbxproj"

echo "🔍 Project Health Check"
echo "======================"

if [ ! -f "$PROJECT_FILE" ]; then
    echo "❌ Project file missing!"
    exit 1
fi

ISSUES=0

if grep -q "Backup restored content" "$PROJECT_FILE"; then
    echo "❌ Project contains backup artifacts"
    ((ISSUES++))
fi

if grep -q "AAAA0000" "$PROJECT_FILE"; then
    echo "❌ Project contains corrupted UUIDs"
    ((ISSUES++))
fi

# Check for duplicate entries
DUPLICATES=$(grep -o 'fileRef = [A-Z0-9]*' "$PROJECT_FILE" | sort | uniq -d | wc -l)
if [ $DUPLICATES -gt 0 ]; then
    echo "❌ Found $DUPLICATES duplicate file references"
    ((ISSUES++))
fi

if [ $ISSUES -eq 0 ]; then
    echo "✅ Project file is healthy"
else
    echo "⚠️  Found $ISSUES issues - run project_stability_toolkit.sh"
fi
EOF
    
    chmod +x "$PROJECT_DIR/check_project_health.sh"
    echo "✅ Health monitor created"
}

# Main execution
main() {
    case "${1:-fix}" in
        "check")
            validate_project_file
            ;;
        "clean")
            clean_build_artifacts
            ;;
        "backup")
            create_clean_backup
            ;;
        "restore")
            restore_from_backup
            ;;
        "setup")
            setup_git_hooks
            create_health_monitor
            ;;
        "fix"|*)
            echo "🚀 Running full project stabilization..."
            create_clean_backup
            
            if ! validate_project_file; then
                echo "⚠️  Project file corrupted, attempting restore..."
                if restore_from_backup; then
                    echo "✅ Project restored from backup"
                else
                    echo "❌ Could not restore from backup - manual intervention required"
                    exit 1
                fi
            fi
            
            clean_build_artifacts
            setup_git_hooks
            create_health_monitor
            
            echo "🎉 Project stabilization complete!"
            echo ""
            echo "Next steps:"
            echo "1. Run: ./check_project_health.sh (to verify health)"
            echo "2. Open project in Xcode and test build"
            echo "3. Commit changes when stable"
            ;;
    esac
}

main "$@"