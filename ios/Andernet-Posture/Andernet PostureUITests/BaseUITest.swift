//
//  BaseUITest.swift
//  Andernet PostureUITests
//
//  Created by UI Test Setup on 2/10/26.
//

import XCTest

/// Base class for all UI tests with common setup and utilities
class BaseUITest: XCTestCase {
    
    var app: XCUIApplication!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        
        // Stop immediately when a failure occurs
        continueAfterFailure = false
        
        // Initialize app
        app = XCUIApplication()
        
        // Set launch arguments for testing
        app.launchArguments = ["UI_TESTING"]
        
        // Set launch environment for testing
        app.launchEnvironment = [
            "IS_UI_TESTING": "1",
            "DISABLE_ANIMATIONS": "1" // Speed up tests
        ]
        
        // Launch the application
        app.launch()
        
        // Wait for splash screen to complete (if present)
        waitForSplashToComplete()
    }
    
    override func tearDownWithError() throws {
        app = nil
        try super.tearDownWithError()
    }
    
    // MARK: - Helper Methods
    
    /// Wait for splash screen to complete
    func waitForSplashToComplete(timeout: TimeInterval = 5) {
        // Wait for the main tab view to appear
        let tabBar = app.tabBars.firstMatch
        let exists = tabBar.waitForExistence(timeout: timeout)
        XCTAssertTrue(exists, "Main tab bar should appear after splash screen")
    }
    
    /// Take a screenshot and attach it to the test
    func takeScreenshot(named name: String, lifetime: XCTAttachment.Lifetime = .deleteOnSuccess) {
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = name
        attachment.lifetime = lifetime
        add(attachment)
    }
    
    /// Wait for element to exist
    @discardableResult
    func waitForElement(_ element: XCUIElement, timeout: TimeInterval = 5, file: StaticString = #file, line: UInt = #line) -> Bool {
        let exists = element.waitForExistence(timeout: timeout)
        if !exists {
            XCTFail("Element \(element) did not appear within \(timeout) seconds", file: file, line: line)
        }
        return exists
    }
    
    /// Wait for element to disappear
    @discardableResult
    func waitForElementToDisappear(_ element: XCUIElement, timeout: TimeInterval = 5) -> Bool {
        let predicate = NSPredicate(format: "exists == false")
        let expectation = XCTNSPredicateExpectation(predicate: predicate, object: element)
        let result = XCTWaiter().wait(for: [expectation], timeout: timeout)
        return result == .completed
    }
    
    /// Tap element with wait
    func tapElement(_ element: XCUIElement, timeout: TimeInterval = 5) {
        waitForElement(element, timeout: timeout)
        element.tap()
    }
    
    /// Swipe to dismiss keyboard
    func dismissKeyboard() {
        app.keyboards.buttons["Return"].tap()
    }
    
    /// Force tap at coordinate (useful for dismissing views)
    func tapCoordinate(x: Double, y: Double) {
        let normalized = app.coordinate(withNormalizedOffset: CGVector(dx: x, dy: y))
        normalized.tap()
    }
}
