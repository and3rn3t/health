# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added – Initial Release

- HealthKit data bridge functionality
- Real-time WebSocket data streaming
- Connection quality monitoring
- Mock mode fallback for testing
- Comprehensive SwiftUI interface
- Automated build and deployment scripts
- Code quality enforcement with SwiftLint
- Staged HealthKit permission coordinator with diagnostics overlay (debug)
- Central logging facade (`Log`) with redaction helper
- CI workflow `ios-ci.yml` including strict lint + archive
- Coverage gate placeholder (40% minimum, adjustable)

### Changed

- Enhanced error handling throughout the application
- Improved configuration management
- Optimized HealthKit permission flow
- Introduced token provider abstraction for WebSocket auth bootstrap
- Replaced ad-hoc prints with structured logging in critical paths

### Fixed

- Configuration key mismatch between AppConfig and Config.plist
- Force unwrapping safety issues
- Code style violations identified by SwiftLint

## [1.0.0] - 2025-08-31

### Added

- Initial release of HealthKit Bridge
- Basic health data monitoring (heart rate, steps, distance, energy)
- WebSocket communication protocol
- iOS app with SwiftUI interface
