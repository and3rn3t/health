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
