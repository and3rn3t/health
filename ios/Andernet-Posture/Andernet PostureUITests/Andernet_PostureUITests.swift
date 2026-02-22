//
//  Andernet_PostureUITests.swift
//  Andernet PostureUITests
//
//  Created by Matt on 2/8/26.
//

import XCTest

/// Basic smoke tests for the Andernet Posture app
/// For more detailed tests, see NavigationTests, SessionFlowTests, AccessibilityTests, and PerformanceTests
final class Andernet_PostureUITests: BaseUITest {
    
    // MARK: - Smoke Tests
    
    @MainActor
    func testAppLaunches() throws {
        // Verify app launches successfully
        XCTAssertTrue(app.exists, "App should launch")
        
        // Verify main UI elements appear
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 5), "Tab bar should appear after launch")
        
        takeScreenshot(named: "App Launch")
    }
    
    @MainActor
    func testMainTabsExist() throws {
        // Verify all main tabs are present
        let tabBar = TabBar(app: app)
        
        XCTAssertTrue(tabBar.dashboardTab.exists, "Dashboard tab should exist")
        XCTAssertTrue(tabBar.sessionsTab.exists, "Sessions tab should exist")
        XCTAssertTrue(tabBar.captureTab.exists, "Capture tab should exist")
        XCTAssertTrue(tabBar.testsTab.exists, "Tests tab should exist")
        XCTAssertTrue(tabBar.settingsTab.exists, "Settings tab should exist")
    }
    
    @MainActor
    func testBasicNavigation() throws {
        let tabBar = TabBar(app: app)
        
        // Test basic tab navigation
        tabBar.navigateToDashboard()
        XCTAssertTrue(DashboardPage(app: app).exists())
        
        tabBar.navigateToSessions()
        XCTAssertTrue(SessionsListPage(app: app).exists())
        
        tabBar.navigateToSettings()
        XCTAssertTrue(SettingsPage(app: app).exists())
    }
    
    @MainActor
    func testAppDoesNotCrash() throws {
        // Basic stability test - navigate through all tabs
        let tabBar = TabBar(app: app)
        
        tabBar.navigateToDashboard()
        tabBar.navigateToSessions()
        tabBar.navigateToCapture()
        CapturePage(app: app).handleCameraPermissions()
        tabBar.navigateToTests()
        tabBar.navigateToSettings()
        tabBar.navigateToDashboard()
        
        // Verify app is still running
        XCTAssertTrue(app.exists, "App should still be running after navigation")
        XCTAssertTrue(tabBar.tabBar.exists, "Tab bar should still be visible")
    }
    
    @MainActor
    func testLaunchPerformance() throws {
        // This measures how long it takes to launch your application.
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }
}
