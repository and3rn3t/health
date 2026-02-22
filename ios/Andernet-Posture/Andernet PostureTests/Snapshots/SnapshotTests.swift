//
//  SnapshotTests.swift
//  Andernet PostureTests
//
//  Visual regression tests for critical SwiftUI views.
//
//  SETUP: These tests require the swift-snapshot-testing package.
//  See SnapshotTestConfiguration.swift for setup instructions.
//
//  Once the package is added, uncomment the test code below.
//  Run with `SNAPSHOT_RECORD_MODE=1` environment variable to generate
//  initial reference images, then remove it for comparison mode.
//

import Testing
import SwiftUI
@testable import Andernet_Posture

// Uncomment after adding swift-snapshot-testing package dependency:
//
// import SnapshotTesting
//
// @Suite("Snapshot Tests")
// struct SnapshotTests {
//
//     // MARK: - Dashboard
//
//     @Test @MainActor func dashboardEmptyState() {
//         let view = DashboardView()
//             .frame(width: SnapshotTestConfig.defaultWidth, height: SnapshotTestConfig.defaultHeight)
//         assertSnapshot(
//             of: UIHostingController(rootView: view),
//             as: .image(on: .iPhone16Pro),
//             record: SnapshotTestConfig.isRecording
//         )
//     }
//
//     @Test @MainActor func dashboardDarkMode() {
//         let view = DashboardView()
//             .frame(width: SnapshotTestConfig.defaultWidth, height: SnapshotTestConfig.defaultHeight)
//             .preferredColorScheme(.dark)
//         assertSnapshot(
//             of: UIHostingController(rootView: view),
//             as: .image(on: .iPhone16Pro),
//             named: "dark",
//             record: SnapshotTestConfig.isRecording
//         )
//     }
//
//     // MARK: - Settings
//
//     @Test @MainActor func settingsView() {
//         let view = SettingsView()
//             .frame(width: SnapshotTestConfig.defaultWidth, height: SnapshotTestConfig.defaultHeight)
//         assertSnapshot(
//             of: UIHostingController(rootView: view),
//             as: .image(on: .iPhone16Pro),
//             record: SnapshotTestConfig.isRecording
//         )
//     }
//
//     // MARK: - Session List
//
//     @Test @MainActor func sessionListEmptyState() {
//         let view = SessionListView()
//             .frame(width: SnapshotTestConfig.defaultWidth, height: SnapshotTestConfig.defaultHeight)
//         assertSnapshot(
//             of: UIHostingController(rootView: view),
//             as: .image(on: .iPhone16Pro),
//             record: SnapshotTestConfig.isRecording
//         )
//     }
//
//     // MARK: - Accessibility (Large Text)
//
//     @Test @MainActor func dashboardAccessibilityXXXL() {
//         let view = DashboardView()
//             .frame(width: SnapshotTestConfig.defaultWidth, height: SnapshotTestConfig.defaultHeight)
//             .dynamicTypeSize(.accessibility3)
//         assertSnapshot(
//             of: UIHostingController(rootView: view),
//             as: .image(on: .iPhone16Pro),
//             named: "a11y-xxxl",
//             record: SnapshotTestConfig.isRecording
//         )
//     }
// }

