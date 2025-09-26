import XCTest
import SwiftUI
@testable import VitalSense

final class RootHostViewTests: XCTestCase {
    override func tearDown() {
        #if DEBUG
        AppShellAvailability._resetOverride()
        #endif
        super.tearDown()
    }

    func testFallbackTitleWhenAppShellMissing() {
        #if DEBUG
        AppShellAvailability.overrideIsPresent = false
        let view = RootHostView()
        // Render to verify it composes without crashing
        XCTAssertNotNil(render(view: view))
        // Very lightweight textual dump check
        let dump = String(describing: view.body)
        XCTAssertTrue(dump.contains("VitalSense"), "Expected fallback title in view body: \(dump)")
        #else
        throw XCTSkip("DEBUG-only test seam")
        #endif
    }

    func testAppShellBranchWhenPresent() {
        #if DEBUG
        AppShellAvailability.overrideIsPresent = true
        let view = RootHostView()
        XCTAssertNotNil(render(view: view))
        let dump = String(describing: view.body)
        // We cannot rely on concrete AppShell string, just ensure fallback title absent
        XCTAssertFalse(dump.contains("VitalSense"), "Fallback title should not appear when AppShell is present: \(dump)")
        #else
        throw XCTSkip("DEBUG-only test seam")
        #endif
    }
}

// MARK: - Minimal render helper (avoids bringing in ViewInspector dependency)
private func render<V: View>(view: V) -> UIViewController {
    let host = UIHostingController(rootView: view)
    _ = host.view // force load
    return host
}
