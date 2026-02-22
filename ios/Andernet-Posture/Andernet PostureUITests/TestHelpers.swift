//
//  TestHelpers.swift
//  Andernet PostureUITests
//
//  Common test utilities and extensions
//

import XCTest

// MARK: - XCUIElement Extensions

extension XCUIElement {
    
    /// Wait for element to be hittable (visible and can be tapped)
    func waitForHittable(timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "isHittable == true")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: self)
        let result = XCTWaiter().wait(for: [expectation], timeout: timeout)
        return result == .completed
    }
    
    /// Tap element with retry logic
    func tapWithRetry(retries: Int = 3) {
        var attempts = 0
        while attempts < retries {
            if self.exists && self.isHittable {
                self.tap()
                return
            }
            attempts += 1
            sleep(1)
        }
        XCTFail("Failed to tap element after \(retries) attempts")
    }
    
    /// Force tap even if not hittable (uses coordinate)
    func forceTap() {
        self.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.5)).tap()
    }
    
    /// Clear text field and type new text
    func clearAndType(_ text: String) {
        guard self.elementType == .textField || self.elementType == .secureTextField else {
            XCTFail("Element is not a text input")
            return
        }
        
        self.tap()
        
        // Select all
        self.tap(withNumberOfTaps: 3, numberOfTouches: 1)
        
        // Type new text
        self.typeText(text)
    }
    
    /// Swipe element until another element becomes visible
    func swipeUntilVisible(_ element: XCUIElement, direction: SwipeDirection = .up, maxAttempts: Int = 10) {
        var attempts = 0
        while !element.isHittable && attempts < maxAttempts {
            switch direction {
            case .up:
                self.swipeUp()
            case .down:
                self.swipeDown()
            case .left:
                self.swipeLeft()
            case .right:
                self.swipeRight()
            }
            attempts += 1
            sleep(1)
        }
    }
    
    enum SwipeDirection {
        case up, down, left, right
    }
}

// MARK: - XCUIApplication Extensions

extension XCUIApplication {
    
    /// Reset to home screen without terminating
    func returnToHomeScreen() {
        XCUIDevice.shared.press(.home)
    }
    
    /// Launch with specific environment
    func launchWithEnvironment(_ environment: [String: String]) {
        self.launchEnvironment = environment
        self.launch()
    }
    
    /// Take a fresh launch (terminate first)
    func cleanLaunch() {
        self.terminate()
        sleep(1) // Wait for full termination
        self.launch()
    }
}

// MARK: - Test Data Helpers

struct TestDataHelper {
    
    /// Generate random session name for testing
    static func randomSessionName() -> String {
        return "Test Session \(UUID().uuidString.prefix(8))"
    }
    
    /// Generate test date
    static func testDate(daysAgo: Int = 0) -> Date {
        return Calendar.current.date(byAdding: .day, value: -daysAgo, to: Date()) ?? Date()
    }
    
    /// Format date for UI comparison
    static func formatDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

// MARK: - Screenshot Helpers

struct ScreenshotHelper {
    
    /// Take full screen screenshot
    static func captureScreen(_ app: XCUIApplication, named name: String, lifetime: XCTAttachment.Lifetime = .deleteOnSuccess) -> XCTAttachment {
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = lifetime
        return attachment
    }
    
    /// Take screenshot of specific element
    static func captureElement(_ element: XCUIElement, named name: String, lifetime: XCTAttachment.Lifetime = .deleteOnSuccess) -> XCTAttachment {
        let screenshot = element.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = lifetime
        return attachment
    }
}

// MARK: - Accessibility Test Helpers

struct AccessibilityTestHelper {
    
    /// Check if element has proper accessibility label
    static func hasAccessibilityLabel(_ element: XCUIElement) -> Bool {
        return !element.label.isEmpty || !(element.value as? String ?? "").isEmpty
    }
    
    /// Verify minimum touch target size (44x44 per HIG)
    static func meetsMinimumTouchTarget(_ element: XCUIElement, minimum: CGFloat = 44.0) -> Bool {
        let frame = element.frame
        return frame.width >= minimum && frame.height >= minimum
    }
    
    /// Get all focusable elements for VoiceOver
    static func getAllFocusableElements(in app: XCUIApplication) -> [XCUIElement] {
        return app.descendants(matching: .any)
            .allElementsBoundByIndex
            .filter { $0.isAccessibilityElement && $0.exists }
    }
}

// MARK: - Wait Helpers

struct WaitHelper {
    
    /// Wait for condition to be true
    static func waitFor(_ condition: @escaping () -> Bool, timeout: TimeInterval = 5, description: String = "Condition") -> Bool {
        let startTime = Date()
        while !condition() {
            if Date().timeIntervalSince(startTime) > timeout {
                XCTFail("\(description) did not become true within \(timeout) seconds")
                return false
            }
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.1))
        }
        return true
    }
    
    /// Wait for element count to match expected
    static func waitForElementCount(_ query: XCUIElementQuery, expectedCount: Int, timeout: TimeInterval = 5) -> Bool {
        let startTime = Date()
        while query.count != expectedCount {
            if Date().timeIntervalSince(startTime) > timeout {
                XCTFail("Element count is \(query.count), expected \(expectedCount)")
                return false
            }
            RunLoop.current.run(until: Date(timeIntervalSinceNow: 0.1))
        }
        return true
    }
}

// MARK: - Assertion Helpers

func XCTAssertElementExists(_ element: XCUIElement, _ message: String = "", file: StaticString = #file, line: UInt = #line) {
    XCTAssertTrue(element.exists, "Element should exist: \(message)", file: file, line: line)
}

func XCTAssertElementDoesNotExist(_ element: XCUIElement, _ message: String = "", file: StaticString = #file, line: UInt = #line) {
    XCTAssertFalse(element.exists, "Element should not exist: \(message)", file: file, line: line)
}

func XCTAssertElementHittable(_ element: XCUIElement, _ message: String = "", file: StaticString = #file, line: UInt = #line) {
    XCTAssertTrue(element.isHittable, "Element should be hittable: \(message)", file: file, line: line)
}

func XCTAssertLabel(_ element: XCUIElement, equals expected: String, file: StaticString = #file, line: UInt = #line) {
    XCTAssertEqual(element.label, expected, "Element label should match", file: file, line: line)
}

func XCTAssertLabelContains(_ element: XCUIElement, _ substring: String, file: StaticString = #file, line: UInt = #line) {
    XCTAssertTrue(element.label.contains(substring), "Element label should contain '\(substring)'", file: file, line: line)
}
