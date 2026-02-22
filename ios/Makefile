# Makefile for Andernet Posture iOS project
# Usage: make <target>
# Requires: Xcode 26.2+, SwiftLint, fastlane (bundle exec)

SCHEME      = Andernet Posture
PROJECT     = Andernet Posture.xcodeproj
DESTINATION = platform=iOS Simulator,name=iPhone 16 Pro,OS=latest
WORK_DIR    = $(PWD)/Andernet-Posture

.PHONY: help setup lint format test build clean archive

help:
	@echo "Available targets:"
	@echo "  setup    - Install Ruby + SPM dependencies"
	@echo "  lint     - Run SwiftLint"
	@echo "  format   - Run swift-format"
	@echo "  test     - Build and run unit tests"
	@echo "  build    - Build debug (unsigned)"
	@echo "  archive  - Build release archive (unsigned)"
	@echo "  clean    - Remove derived data and build artifacts"

setup:
	bundle install --jobs 4 --retry 3
	cd "$(WORK_DIR)" && xcodebuild -resolvePackageDependencies \
		-project "$(PROJECT)" -scheme "$(SCHEME)"

lint:
	cd "$(WORK_DIR)" && swiftlint lint --strict

format:
	find "$(WORK_DIR)/Andernet Posture" -name '*.swift' \
		-exec swift-format --in-place {} \;

test:
	cd "$(WORK_DIR)" && xcodebuild test \
		-project "$(PROJECT)" \
		-scheme "$(SCHEME)" \
		-destination "$(DESTINATION)" \
		-skipPackagePluginValidation \
		-only-testing "Andernet PostureTests" \
		CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO

build:
	cd "$(WORK_DIR)" && xcodebuild build \
		-project "$(PROJECT)" \
		-scheme "$(SCHEME)" \
		-destination "$(DESTINATION)" \
		-configuration Debug \
		-skipPackagePluginValidation \
		CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO

archive:
	cd "$(WORK_DIR)" && xcodebuild archive \
		-project "$(PROJECT)" \
		-scheme "$(SCHEME)" \
		-configuration Release \
		-archivePath build/AndernetPosture.xcarchive \
		-destination "generic/platform=iOS" \
		-skipPackagePluginValidation \
		CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO

clean:
	cd "$(WORK_DIR)" && rm -rf build/ DerivedData/
	rm -rf ~/Library/Developer/Xcode/DerivedData/Andernet* 2>/dev/null || true
