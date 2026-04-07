#!/bin/bash
# Branding Guard — checks for incorrect branding in modified files
# Used as a Copilot PostToolUse hook to catch "Health App" instead of "VitalSense"
# Exit 0 = pass, Exit 1 = warn (non-blocking)

set -euo pipefail

INPUT=$(cat)

FILE_PATH=$(echo "$INPUT" | grep -o '"filePath":"[^"]*"' | head -1 | sed 's/"filePath":"//;s/"$//' 2>/dev/null || echo "")

# Skip files where "Health App" is acceptable (configs, changelogs, internal docs)
case "$FILE_PATH" in
  *.lock|*.json|*.yaml|*.yml|*.toml|CHANGELOG*|*.svg|*.png|*.ico)
    exit 0
    ;;
  *wrangler.toml|*package.json|*docker-compose*|*Dockerfile*)
    exit 0
    ;;
esac

if [ -z "$FILE_PATH" ] || [ ! -f "$FILE_PATH" ]; then
  exit 0
fi

# Check for "Health App" in user-facing strings (not in comments or variable names)
VIOLATIONS=$(grep -n "Health App" "$FILE_PATH" 2>/dev/null | grep -v "^[[:space:]]*//\|^[[:space:]]*\*\|^[[:space:]]*#\|health-app\|health_app\|healthApp" || true)

if [ -n "$VIOLATIONS" ]; then
  echo "Branding Guard: Found 'Health App' instead of 'VitalSense' in $FILE_PATH:"
  echo "$VIOLATIONS"
  echo ""
  echo "User-facing text should use 'VitalSense' — see branding guidelines."
  # Non-blocking warning (exit 0) — the agent can decide to fix
  exit 0
fi

exit 0
