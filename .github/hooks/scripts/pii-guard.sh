#!/bin/bash
# PII Guard — scans file content for potential PII patterns before writes
# Used as a Copilot PreToolUse hook to prevent accidental PII leakage
# Exit 0 = allow, Exit 1 = block

set -euo pipefail

# Read the tool input from stdin (JSON with file path and content)
INPUT=$(cat)

# Extract the file content if present
CONTENT=$(echo "$INPUT" | grep -o '"content":"[^"]*"' | head -1 | sed 's/"content":"//;s/"$//' 2>/dev/null || echo "")
FILE_PATH=$(echo "$INPUT" | grep -o '"filePath":"[^"]*"' | head -1 | sed 's/"filePath":"//;s/"$//' 2>/dev/null || echo "")

# Skip non-source files (configs, lockfiles, etc.)
case "$FILE_PATH" in
  *.lock|*.json|*.yaml|*.yml|*.toml|*.md|*.txt|*.css|*.svg|*.png|*.ico)
    exit 0
    ;;
esac

if [ -z "$CONTENT" ]; then
  exit 0
fi

VIOLATIONS=""

# Check for SSN patterns (XXX-XX-XXXX)
if echo "$CONTENT" | grep -qE '[0-9]{3}-[0-9]{2}-[0-9]{4}'; then
  VIOLATIONS="${VIOLATIONS}\n- Possible SSN pattern detected"
fi

# Check for email addresses in console.log/console.error/logger statements
if echo "$CONTENT" | grep -qiE 'console\.(log|error|warn|info|debug).*[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}'; then
  VIOLATIONS="${VIOLATIONS}\n- Email address in log statement"
fi

# Check for health record IDs being logged
if echo "$CONTENT" | grep -qiE 'console\.(log|error|warn|info|debug).*(patient.?id|health.?record|medical.?record|mrn|ssn)'; then
  VIOLATIONS="${VIOLATIONS}\n- Health record identifier in log statement"
fi

# Check for raw health data logging patterns
if echo "$CONTENT" | grep -qiE 'console\.(log|error|warn|info|debug).*(heart.?rate|blood.?pressure|glucose|bmi|weight|height|step.?count|health.?data)'; then
  VIOLATIONS="${VIOLATIONS}\n- Raw health metrics in log statement"
fi

if [ -n "$VIOLATIONS" ]; then
  echo "PII Guard: Potential PII/health data detected in file write:"
  echo -e "$VIOLATIONS"
  echo ""
  echo "Health data and PII must never appear in logs or source code."
  echo "Use sanitized identifiers and aggregate metrics instead."
  exit 1
fi

exit 0
