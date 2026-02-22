#!/bin/bash

# SwiftLint Run Script Phase
# Add this to Build Phases → "+" → New Run Script Phase
# Place it after "Compile Sources" phase

# Script name: "SwiftLint"

# Only run SwiftLint if it's installed
if which swiftlint >/dev/null; then
  swiftlint
else
  echo "warning: SwiftLint not installed, download from https://github.com/realm/SwiftLint"
fi
