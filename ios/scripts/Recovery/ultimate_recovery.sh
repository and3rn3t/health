#!/bin/bash

# Ultimate Project Recovery Script
# This creates a completely fresh project structure

set -e

PROJECT_DIR="/Users/ma55700/Documents/GitHub/Health-2"
BACKUP_DIR="$PROJECT_DIR/.ultimate_backup"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo "🚑 Ultimate VitalSense Project Recovery"
echo "======================================"

# Create comprehensive backup
echo "📦 Creating comprehensive backup..."
mkdir -p "$BACKUP_DIR/$TIMESTAMP"
cp -r "$PROJECT_DIR/VitalSense.xcodeproj" "$BACKUP_DIR/$TIMESTAMP/" 2>/dev/null || true
cp -r "$PROJECT_DIR/VitalSense.xcworkspace" "$BACKUP_DIR/$TIMESTAMP/" 2>/dev/null || true
cp -r "$PROJECT_DIR/VitalSense" "$BACKUP_DIR/$TIMESTAMP/" 2>/dev/null || true
echo "✅ Backup created in $BACKUP_DIR/$TIMESTAMP"

# Try to recover using Xcode's project repair
echo "🔧 Attempting Xcode project repair..."
if command -v xcrun >/dev/null 2>&1; then
    # Use xed to open and potentially repair the project
    echo "Opening project in Xcode for automatic repair..."
    open "$PROJECT_DIR/VitalSense.xcodeproj" 2>/dev/null || echo "Could not open project in Xcode"
    sleep 3
fi

# Alternative: Create new workspace with existing project
echo "🛠️  Creating fresh workspace..."
cat > "$PROJECT_DIR/VitalSense.xcworkspace/contents.xcworkspacedata" << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<Workspace
   version = "1.0">
   <FileRef
      location = "group:VitalSense.xcodeproj">
   </FileRef>
</Workspace>
EOF

echo "✅ Fresh workspace created"

# Try to list schemes from the project directly
echo "🔍 Checking project schemes..."
if xcodebuild -project VitalSense.xcodeproj -list 2>/dev/null; then
    echo "✅ Project schemes found"
else
    echo "⚠️  Could not list project schemes"
fi

echo ""
echo "🎯 Recovery Options:"
echo "1. Try opening VitalSense.xcodeproj directly in Xcode"
echo "2. Use the workspace: VitalSense.xcworkspace" 
echo "3. If both fail, we'll need to recreate the project from source files"
echo ""
echo "Your source files are safe in the VitalSense/ directory"