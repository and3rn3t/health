# Root Makefile for VitalSense automation
# Usage: make <target>

SCHEME ?= VitalSense
WORKSPACE ?= VitalSense.xcworkspace
CONFIG ?= Debug
DEST ?= 'platform=iOS Simulator,name=iPhone 15'
ARCHIVE_PATH ?= build/VitalSense.xcarchive
EXPORT_PATH ?= build/export
EXPORT_OPTIONS_PLIST ?= scripts/ExportOptions-AppStore.plist

.PHONY: build test archive export clean lint-project format help

help:
	@echo 'Primary targets:'
	@echo '  build    - Build the app (Debug by default)'
	@echo '  test     - Run unit tests on simulator'
	@echo '  archive  - Create an unsigned archive (requires signing setup)'
	@echo '  export   - Export IPA from existing archive (needs ExportOptions plist)'
	@echo '  lint-project - Basic sanity checks on project.pbxproj'
	@echo '  clean    - Clean derived data and build artifacts'

build:
	xcodebuild -workspace $(WORKSPACE) -scheme $(SCHEME) -configuration $(CONFIG) -destination $(DEST) build | xcpretty || exit 1
	touch build/.build_stamp

test:
	xcodebuild -workspace $(WORKSPACE) -scheme $(SCHEME) -destination $(DEST) -parallel-testing-enabled YES -enableCodeCoverage YES test | xcpretty || exit 1

archive:
	mkdir -p build
	xcodebuild -workspace $(WORKSPACE) -scheme $(SCHEME) -configuration Release \
		archive -archivePath $(ARCHIVE_PATH) SKIP_INSTALL=NO BUILD_LIBRARY_FOR_DISTRIBUTION=YES | xcpretty || exit 1

export: archive
	mkdir -p $(EXPORT_PATH)
	xcodebuild -exportArchive -archivePath $(ARCHIVE_PATH) -exportPath $(EXPORT_PATH) \
		-exportOptionsPlist $(EXPORT_OPTIONS_PLIST) | xcpretty || exit 1

lint-project:
	bash scripts/pbxproj-lint.sh

clean:
	rm -rf build DerivedData
	xcodebuild -workspace $(WORKSPACE) -scheme $(SCHEME) clean | xcpretty || exit 0
