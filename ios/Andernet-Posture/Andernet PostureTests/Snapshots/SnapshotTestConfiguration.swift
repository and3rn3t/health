//
//  SnapshotTestConfiguration.swift
//  Andernet PostureTests
//
//  Configuration and helpers for snapshot/visual regression testing.
//
//  SETUP REQUIRED:
//  1. In Xcode, go to File → Add Package Dependencies
//  2. Enter: https://github.com/pointfreeco/swift-snapshot-testing
//  3. Set version to "Up to Next Major" from 1.17.0
//  4. Add the "SnapshotTesting" library to the "Andernet PostureTests" target ONLY
//  5. Uncomment the tests in SnapshotTests.swift
//

import Foundation

/// Configuration for snapshot tests to ensure consistent rendering.
enum SnapshotTestConfig {
    /// Fixed trait collection for deterministic rendering.
    /// Use iPhone 16 Pro dimensions (393 × 852 points).
    static let defaultWidth: CGFloat = 393
    static let defaultHeight: CGFloat = 852

    /// Directory where reference snapshots are stored.
    /// Defaults to `__Snapshots__` alongside the test file.
    static let snapshotDirectory = "__Snapshots__"

    /// Whether to record new reference snapshots instead of comparing.
    /// Set via `SNAPSHOT_RECORD_MODE=1` environment variable.
    static var isRecording: Bool {
        ProcessInfo.processInfo.environment["SNAPSHOT_RECORD_MODE"] == "1"
    }
}
