#!/usr/bin/env python3
"""Generate .vscode/tasks.json for Andernet Posture Xcode project."""
import json
import os

PROJ = "Andernet Posture"
XCPROJ = f"{PROJ}.xcodeproj"
PM = {
    "owner": "xcodebuild",
    "fileLocation": ["relative", "${workspaceFolder}"],
    "pattern": {
        "regexp": r"^(.+?):(\d+):(\d+):\s+(warning|error|note):\s+(.+)$",
        "file": 1, "line": 2, "column": 3, "severity": 4, "message": 5
    }
}
PM_TEST = dict(PM, owner="xcodebuild-test")
PM_LINT = {
    "owner": "swiftlint",
    "fileLocation": ["relative", "${workspaceFolder}"],
    "pattern": {
        "regexp": r"^(.+?):(\d+):(\d+):\s+(warning|error):\s+(.+)$",
        "file": 1, "line": 2, "column": 3, "severity": 4, "message": 5
    }
}
PRES = {"reveal": "always", "panel": "shared", "showReuseMessage": False}
PRES_BUILD = dict(PRES, echo=True, focus=False, clear=True)

def xb(*extra_args, beautify="--quieter"):
    base = (
        f"set -o pipefail && xcodebuild -scheme '{PROJ}' -project '{XCPROJ}'"
    )
    args = " ".join(extra_args)
    if beautify:
        return f"{base} {args} 2>&1 | xcbeautify {beautify}"
    return f"{base} {args}"

data = {
    "version": "2.0.0",
    "inputs": [
        {"id": "simulator", "type": "pickString", "description": "Select simulator",
         "options": ["iPhone 17 Pro", "iPhone 17 Pro Max", "iPhone Air", "iPhone 17", "iPhone 16e"],
         "default": "iPhone 17 Pro"},
        {"id": "configuration", "type": "pickString", "description": "Build configuration",
         "options": ["Debug", "Release"], "default": "Debug"},
        {"id": "testFilter", "type": "promptString",
         "description": "Test filter (e.g. AnalyzerTests/testSomething or leave empty for all)",
         "default": ""},
    ],
    "tasks": [
        # ── Build ──
        {"label": "Xcode: Build", "type": "shell",
         "command": xb("-configuration '${input:configuration}'",
                       "-destination 'platform=iOS Simulator,name=${input:simulator}'",
                       "-derivedDataPath '.build/DerivedData'", "build"),
         "group": {"kind": "build", "isDefault": True},
         "problemMatcher": PM, "presentation": PRES_BUILD},

        {"label": "Xcode: Build (Clean)", "type": "shell",
         "command": xb("-configuration '${input:configuration}'",
                       "-destination 'platform=iOS Simulator,name=${input:simulator}'",
                       "-derivedDataPath '.build/DerivedData'", "clean build"),
         "group": "build", "problemMatcher": PM, "presentation": PRES_BUILD},

        {"label": "Xcode: Build (Raw Output)", "type": "shell",
         "detail": "Full xcodebuild output without xcbeautify",
         "command": xb("-configuration '${input:configuration}'",
                       "-destination 'platform=iOS Simulator,name=${input:simulator}'",
                       "-derivedDataPath '.build/DerivedData'", "build", beautify=None),
         "group": "build", "problemMatcher": PM,
         "presentation": {"reveal": "always", "panel": "dedicated", "clear": True, "showReuseMessage": False}},

        # ── Test ──
        {"label": "Xcode: Run Unit Tests", "type": "shell",
         "command": xb("-destination 'platform=iOS Simulator,name=${input:simulator}'",
                       "-derivedDataPath '.build/DerivedData'",
                       f"-only-testing:'{PROJ}Tests'", "test", beautify=""),
         "group": {"kind": "test", "isDefault": True},
         "problemMatcher": PM_TEST, "presentation": dict(PRES, clear=True)},

        {"label": "Xcode: Run UI Tests", "type": "shell",
         "command": xb("-destination 'platform=iOS Simulator,name=${input:simulator}'",
                       "-derivedDataPath '.build/DerivedData'",
                       f"-only-testing:'{PROJ}UITests'", "test", beautify=""),
         "group": "test", "problemMatcher": PM_TEST, "presentation": dict(PRES, clear=True)},

        {"label": "Xcode: Run Single Test", "type": "shell",
         "detail": "Run a specific test class or method — prompted for filter",
         "command": (
             "FILTER='${input:testFilter}'; "
             "if [ -z \"$FILTER\" ]; then "
             + xb("-destination 'platform=iOS Simulator,name=${input:simulator}'",
                  "-derivedDataPath '.build/DerivedData'",
                  f"-only-testing:'{PROJ}Tests'", "test", beautify="")
             + "; else "
             + xb("-destination 'platform=iOS Simulator,name=${input:simulator}'",
                  "-derivedDataPath '.build/DerivedData'",
                  f"-only-testing:\"{PROJ}Tests/$FILTER\"", "test", beautify="")
             + "; fi"
         ),
         "group": "test", "problemMatcher": PM_TEST, "presentation": dict(PRES, clear=True)},

        {"label": "Xcode: Test Without Building", "type": "shell",
         "detail": "Re-run tests using existing build products (faster iteration)",
         "command": xb("-destination 'platform=iOS Simulator,name=${input:simulator}'",
                       "-derivedDataPath '.build/DerivedData'",
                       f"-only-testing:'{PROJ}Tests'", "test-without-building", beautify=""),
         "group": "test", "problemMatcher": PM_TEST, "presentation": dict(PRES, clear=True)},

        # ── Simulator ──
        {"label": "Simulator: Boot", "type": "shell",
         "command": "xcrun simctl boot '${input:simulator}' 2>/dev/null; open -a Simulator",
         "problemMatcher": [],
         "presentation": {"reveal": "silent", "panel": "shared", "showReuseMessage": False}},

        {"label": "Simulator: Install & Launch App", "type": "shell",
         "command": (
             "APP=$(find .build/DerivedData/Build/Products/Debug-iphonesimulator "
             "-name '*.app' -maxdepth 1 2>/dev/null | head -1) && "
             "[ -n \"$APP\" ] && "
             "xcrun simctl install booted \"$APP\" && "
             "BUNDLE_ID=$(plutil -extract CFBundleIdentifier raw \"$APP/Info.plist\") && "
             "xcrun simctl launch booted \"$BUNDLE_ID\" && "
             "echo \"Launched $BUNDLE_ID\" || "
             "echo 'No .app found - build first with Cmd+B'"
         ),
         "dependsOn": ["Simulator: Boot"],
         "problemMatcher": [], "presentation": PRES},

        {"label": "Simulator: Uninstall App", "type": "shell",
         "command": (
             "APP=$(find .build/DerivedData/Build/Products/Debug-iphonesimulator "
             "-name '*.app' -maxdepth 1 2>/dev/null | head -1) && "
             "[ -n \"$APP\" ] && "
             "BUNDLE_ID=$(plutil -extract CFBundleIdentifier raw \"$APP/Info.plist\") && "
             "xcrun simctl uninstall booted \"$BUNDLE_ID\" && "
             "echo \"Uninstalled $BUNDLE_ID\" || echo 'No .app found'"
         ),
         "problemMatcher": [], "presentation": PRES},

        {"label": "Simulator: Erase All Content", "type": "shell",
         "detail": "Factory-reset the booted simulator",
         "command": "xcrun simctl erase booted && echo 'Simulator erased'",
         "problemMatcher": []},

        {"label": "Simulator: Shutdown All", "type": "shell",
         "command": "xcrun simctl shutdown all && echo 'All simulators shut down'",
         "problemMatcher": [],
         "presentation": {"reveal": "silent", "panel": "shared", "showReuseMessage": False}},

        {"label": "Simulator: Stream Logs", "type": "shell",
         "detail": "Live-stream device console for the app (Ctrl+C to stop)",
         "command": (
             "APP=$(find .build/DerivedData/Build/Products/Debug-iphonesimulator "
             "-name '*.app' -maxdepth 1 2>/dev/null | head -1) && "
             "BUNDLE_ID=$(plutil -extract CFBundleIdentifier raw \"$APP/Info.plist\" 2>/dev/null) && "
             "xcrun simctl spawn booted log stream "
             "--predicate \"subsystem == '$BUNDLE_ID'\" --level debug --style compact "
             "|| echo 'Build first or boot a simulator'"
         ),
         "isBackground": True, "problemMatcher": [],
         "presentation": {"reveal": "always", "panel": "dedicated", "showReuseMessage": False}},

        {"label": "Simulator: Take Screenshot", "type": "shell",
         "command": (
             "mkdir -p .build/screenshots && "
             "FILE=\".build/screenshots/sim_$(date +%Y%m%d_%H%M%S).png\" && "
             "xcrun simctl io booted screenshot \"$FILE\" && "
             "echo \"Saved: $FILE\" && open \"$FILE\""
         ),
         "problemMatcher": [], "presentation": PRES},

        # ── Lint & Format ──
        {"label": "SwiftLint: Lint Project", "type": "shell",
         "command": f"swiftlint lint --config .swiftlint.yml --path '{PROJ}' --reporter emoji",
         "problemMatcher": PM_LINT, "presentation": PRES},

        {"label": "SwiftLint: Fix (Autocorrect)", "type": "shell",
         "command": f"swiftlint lint --fix --config .swiftlint.yml --path '{PROJ}' && echo 'Autocorrect complete'",
         "problemMatcher": []},

        {"label": "SwiftLint: Current File", "type": "shell",
         "command": "swiftlint lint --config .swiftlint.yml --path '${file}'",
         "problemMatcher": PM_LINT},

        {"label": "SwiftFormat: Format Project", "type": "shell",
         "command": f"swiftformat '{PROJ}' --swiftversion 6.2 && echo 'Formatted'",
         "problemMatcher": [], "presentation": PRES},

        {"label": "SwiftFormat: Current File", "type": "shell",
         "command": "swiftformat '${file}' --swiftversion 6.2 && echo 'Formatted ${fileBasename}'",
         "problemMatcher": []},

        {"label": "SwiftFormat: Dry Run (Diff)", "type": "shell",
         "detail": "Preview changes without modifying files",
         "command": f"swiftformat '{PROJ}' --swiftversion 6.2 --dryrun --lint 2>&1 || true",
         "problemMatcher": [], "presentation": PRES},

        # ── Compound Workflows ──
        {"label": "Workflow: Lint > Build",
         "dependsOn": ["SwiftLint: Lint Project", "Xcode: Build"],
         "dependsOrder": "sequence", "problemMatcher": [], "group": "build"},

        {"label": "Workflow: Format > Lint > Build",
         "dependsOn": ["SwiftFormat: Format Project", "SwiftLint: Lint Project", "Xcode: Build"],
         "dependsOrder": "sequence", "problemMatcher": [], "group": "build"},

        {"label": "Workflow: Build > Test",
         "dependsOn": ["Xcode: Build", "Xcode: Run Unit Tests"],
         "dependsOrder": "sequence", "problemMatcher": [], "group": "test"},

        {"label": "Workflow: Build > Install > Launch",
         "detail": "Full edit-run cycle: build, install on sim, launch",
         "dependsOn": ["Xcode: Build", "Simulator: Install & Launch App"],
         "dependsOrder": "sequence", "problemMatcher": []},

        # ── Utilities ──
        {"label": "Xcode: Open in Xcode", "type": "shell",
         "command": f"open -a Xcode '{XCPROJ}'",
         "problemMatcher": [],
         "presentation": {"reveal": "silent", "showReuseMessage": False}},

        {"label": "Xcode: Show Build Settings", "type": "shell",
         "command": (
             f"xcodebuild -scheme '{PROJ}' -project '{XCPROJ}' -showBuildSettings 2>/dev/null | "
             "grep -E '(PRODUCT_|BUNDLE_|INFOPLIST_|SWIFT_|DEPLOYMENT_TARGET|MARKETING_VERSION|CURRENT_PROJECT_VERSION)' | sort"
         ),
         "problemMatcher": [], "presentation": PRES},

        {"label": "Xcode: Archive (Release)", "type": "shell",
         "command": xb("-configuration Release",
                       "-destination 'generic/platform=iOS'",
                       "-archivePath '.build/Andernet_Posture.xcarchive'",
                       "archive", beautify=""),
         "group": "build", "problemMatcher": PM,
         "presentation": {"reveal": "always", "panel": "dedicated", "clear": True, "showReuseMessage": False}},

        {"label": "Xcode: Resolve Packages", "type": "shell",
         "detail": "Re-resolve Swift Package Manager dependencies",
         "command": f"xcodebuild -resolvePackageDependencies -scheme '{PROJ}' -project '{XCPROJ}' 2>&1 | tail -20 && echo 'Packages resolved'",
         "problemMatcher": [], "presentation": PRES},

        {"label": "SourceKit-LSP: Regenerate", "type": "shell",
         "command": f"xcode-build-server config -scheme '{PROJ}' -project \"$(pwd)/{XCPROJ}\" && echo 'buildServer.json updated - reload VS Code window'",
         "problemMatcher": [], "presentation": PRES},

        {"label": "Xcode: Nuke DerivedData", "type": "shell",
         "detail": "Delete local .build/DerivedData",
         "command": "rm -rf .build/DerivedData && echo 'Nuked .build/DerivedData'",
         "problemMatcher": [], "presentation": PRES},

        {"label": "Swift: Check Version & Paths", "type": "shell",
         "detail": "Show Swift toolchain info for debugging environment issues",
         "command": (
             "echo '-- Swift --' && swift --version && "
             "echo '' && echo '-- Xcode --' && xcodebuild -version && "
             "echo '' && echo '-- Developer Dir --' && xcode-select -p && "
             "echo '' && echo '-- SDK --' && xcrun --show-sdk-path --sdk iphonesimulator && "
             "echo '' && echo '-- Tools --' && "
             "printf 'swiftlint:          %s\\n' \"$(which swiftlint 2>/dev/null || echo not_found)\" && "
             "printf 'swiftformat:        %s\\n' \"$(which swiftformat 2>/dev/null || echo not_found)\" && "
             "printf 'xcbeautify:         %s\\n' \"$(which xcbeautify 2>/dev/null || echo not_found)\" && "
             "printf 'xcode-build-server: %s\\n' \"$(which xcode-build-server 2>/dev/null || echo not_found)\""
         ),
         "problemMatcher": [], "presentation": PRES},
    ]
}

out = os.path.join(os.path.dirname(__file__) if '__file__' in dir() else '.', '/Users/andernet/Documents/GitHub/Andernet-Posture/.vscode/tasks.json')
with open('/Users/andernet/Documents/GitHub/Andernet-Posture/.vscode/tasks.json', 'w') as f:
    json.dump(data, f, indent=2)
    f.write('\n')
print(f"Written {len(data['tasks'])} tasks to tasks.json")
