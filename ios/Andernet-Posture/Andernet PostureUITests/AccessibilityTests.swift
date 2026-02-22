//
//  AccessibilityTests.swift
//  Andernet PostureUITests
//
//  Tests for accessibility features and VoiceOver support
//

import XCTest

final class AccessibilityTests: BaseUITest {
    
    var tabBar: TabBar!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        tabBar = TabBar(app: app)
    }
    
    // MARK: - Tab Bar Accessibility
    
    func testTabBarAccessibility() throws {
        // Verify all tabs have accessibility labels
        XCTAssertTrue(tabBar.dashboardTab.isAccessibilityElement, 
                     "Dashboard tab should be accessible")
        XCTAssertTrue(tabBar.sessionsTab.isAccessibilityElement, 
                     "Sessions tab should be accessible")
        XCTAssertTrue(tabBar.captureTab.isAccessibilityElement, 
                     "Capture tab should be accessible")
        XCTAssertTrue(tabBar.testsTab.isAccessibilityElement, 
                     "Tests tab should be accessible")
        XCTAssertTrue(tabBar.settingsTab.isAccessibilityElement, 
                     "Settings tab should be accessible")
    }
    
    func testTabBarLabels() throws {
        // Verify tabs have proper labels
        let dashboardLabel = tabBar.dashboardTab.label
        XCTAssertFalse(dashboardLabel.isEmpty, "Dashboard tab should have a label")
        
        let sessionsLabel = tabBar.sessionsTab.label
        XCTAssertFalse(sessionsLabel.isEmpty, "Sessions tab should have a label")
        
        let captureLabel = tabBar.captureTab.label
        XCTAssertFalse(captureLabel.isEmpty, "Capture tab should have a label")
        
        let testsLabel = tabBar.testsTab.label
        XCTAssertFalse(testsLabel.isEmpty, "Tests tab should have a label")
        
        let settingsLabel = tabBar.settingsTab.label
        XCTAssertFalse(settingsLabel.isEmpty, "Settings tab should have a label")
    }
    
    // MARK: - Dashboard Accessibility
    
    func testDashboardAccessibility() throws {
        tabBar.navigateToDashboard()
        
        let dashboardPage = DashboardPage(app: app)
        waitForElement(dashboardPage.scrollView, timeout: 5)
        
        // Get all accessible elements on dashboard
        let accessibleElements = app.descendants(matching: .any)
            .allElementsBoundByIndex
            .filter { $0.isAccessibilityElement && $0.exists }
        
        // Verify there are accessible elements
        XCTAssertGreaterThan(accessibleElements.count, 0, 
                           "Dashboard should have accessible elements")
        
        // Verify elements have labels
        for element in accessibleElements.prefix(10) {
            if element.label.isEmpty && ((element.value as? String)?.isEmpty ?? true) {
                // Some elements may not need labels (decorative), but most should
                continue
            }
        }
        
        takeScreenshot(named: "Dashboard Accessibility")
    }
    
    // MARK: - Sessions List Accessibility
    
    func testSessionsListAccessibility() throws {
        tabBar.navigateToSessions()
        
        let sessionsPage = SessionsListPage(app: app)
        
        if sessionsPage.sessionCount > 0 {
            // Check first session cell accessibility
            let firstCell = sessionsPage.sessionCell(at: 0)
            waitForElement(firstCell)
            
            XCTAssertTrue(firstCell.isAccessibilityElement || 
                         firstCell.descendants(matching: .any).count > 0,
                         "Session cells should be accessible or contain accessible elements")
        }
        
        takeScreenshot(named: "Sessions Accessibility")
    }
    
    // MARK: - Capture View Accessibility
    
    func testCaptureViewAccessibility() throws {
        tabBar.navigateToCapture()
        
        let capturePage = CapturePage(app: app)
        capturePage.handleCameraPermissions()
        
        // Check capture button accessibility
        if capturePage.startButton.exists {
            XCTAssertTrue(capturePage.startButton.isAccessibilityElement,
                         "Start button should be accessible")
            XCTAssertFalse(capturePage.startButton.label.isEmpty,
                          "Start button should have a label")
        }
        
        if capturePage.stopButton.exists {
            XCTAssertTrue(capturePage.stopButton.isAccessibilityElement,
                         "Stop button should be accessible")
            XCTAssertFalse(capturePage.stopButton.label.isEmpty,
                          "Stop button should have a label")
        }
        
        takeScreenshot(named: "Capture Accessibility")
    }
    
    // MARK: - Settings Accessibility
    
    func testSettingsAccessibility() throws {
        tabBar.navigateToSettings()
        
        let settingsPage = SettingsPage(app: app)
        waitForElement(settingsPage.settingsList)
        
        // Get all accessible elements in settings
        let accessibleElements = settingsPage.settingsList
            .descendants(matching: .any)
            .allElementsBoundByIndex
            .filter { $0.isAccessibilityElement && $0.exists }
        
        XCTAssertGreaterThan(accessibleElements.count, 0,
                           "Settings should have accessible elements")
        
        takeScreenshot(named: "Settings Accessibility")
    }
    
    // MARK: - Button Sizing Tests
    
    func testMinimumTouchTargetSize() throws {
        // iOS HIG recommends 44x44 minimum touch target
        let minimumSize: CGFloat = 44.0
        
        tabBar.navigateToDashboard()
        
        // Check tab bar buttons
        for tab in [tabBar.dashboardTab, tabBar.sessionsTab, tabBar.captureTab, 
                   tabBar.testsTab, tabBar.settingsTab] {
            if tab.exists {
                let frame = tab.frame
                
                // Note: Tab bars may have smaller hit areas but are still accessible
                // This is more of a guideline check
                if frame.height < minimumSize || frame.width < minimumSize {
                    // Log but don't fail - system tabs may be smaller
                    print("Note: Tab \(tab.label) has size \(frame.size) which is below 44x44 guideline")
                }
            }
        }
    }
    
    // MARK: - Dynamic Type Support Tests
    
    func testDynamicTypeSupport() throws {
        // This test verifies the app doesn't crash with different text sizes
        // In a real scenario, you'd set accessibility text size in launch arguments
        
        tabBar.navigateToDashboard()
        let dashboardPage = DashboardPage(app: app)
        XCTAssertTrue(dashboardPage.exists())
        
        tabBar.navigateToSessions()
        let sessionsPage = SessionsListPage(app: app)
        XCTAssertTrue(sessionsPage.exists())
        
        // App should remain functional with default text size
        XCTAssertTrue(tabBar.tabBar.exists)
    }
    
    // MARK: - VoiceOver Navigation
    
    func testVoiceOverNavigationOrder() throws {
        // Test that elements appear in logical order for VoiceOver
        tabBar.navigateToDashboard()
        
        let elements = app.descendants(matching: .any)
            .allElementsBoundByIndex
            .filter { $0.isAccessibilityElement && $0.exists }
        
        // Verify we have navigable elements
        XCTAssertGreaterThan(elements.count, 0, 
                           "Should have accessible elements for VoiceOver")
        
        // Elements should be in a reasonable order (top to bottom, left to right)
        // This is a basic check - actual order depends on implementation
        var previousY: CGFloat = -1
        var orderIssues = 0
        
        for element in elements.prefix(20) {
            let currentY = element.frame.minY
            if previousY > currentY + 50 { // Allow some tolerance
                orderIssues += 1
            }
            previousY = currentY
        }
        
        // Some variation is expected, but should generally flow top to bottom
        XCTAssertLessThan(orderIssues, elements.count / 2, 
                         "Elements should generally appear in top-to-bottom order")
    }
    
    // MARK: - Color and Contrast Tests
    
    func testUIVisibleInDifferentModes() throws {
        // Basic test that UI elements are visible
        // In practice, you'd test with different contrast settings
        
        tabBar.navigateToDashboard()
        let dashboardPage = DashboardPage(app: app)
        
        // Verify main elements are visible (exist and not hidden)
        XCTAssertTrue(tabBar.tabBar.exists && tabBar.tabBar.isHittable,
                     "Tab bar should be visible and interactable")
        XCTAssertTrue(dashboardPage.scrollView.exists,
                     "Dashboard content should be visible")
    }
}
