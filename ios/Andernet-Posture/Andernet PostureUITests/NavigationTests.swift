//
//  NavigationTests.swift
//  Andernet PostureUITests
//
//  Tests for app navigation and tab switching
//

import XCTest

final class NavigationTests: BaseUITest {
    
    var tabBar: TabBar!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        tabBar = TabBar(app: app)
    }
    
    // MARK: - Tab Bar Tests
    
    func testTabBarExists() throws {
        XCTAssertTrue(tabBar.tabBar.exists, "Tab bar should exist")
        takeScreenshot(named: "Tab Bar")
    }
    
    func testAllTabsExist() throws {
        XCTAssertTrue(tabBar.dashboardTab.exists, "Dashboard tab should exist")
        XCTAssertTrue(tabBar.sessionsTab.exists, "Sessions tab should exist")
        XCTAssertTrue(tabBar.captureTab.exists, "Capture tab should exist")
        XCTAssertTrue(tabBar.testsTab.exists, "Tests tab should exist")
        XCTAssertTrue(tabBar.settingsTab.exists, "Settings tab should exist")
    }
    
    func testNavigateToDashboard() throws {
        tabBar.navigateToDashboard()
        
        let dashboardPage = DashboardPage(app: app)
        XCTAssertTrue(dashboardPage.exists(), "Dashboard page should be visible")
        XCTAssertTrue(tabBar.isTabSelected("Dashboard"), "Dashboard tab should be selected")
        
        takeScreenshot(named: "Dashboard View")
    }
    
    func testNavigateToSessions() throws {
        tabBar.navigateToSessions()
        
        let sessionsPage = SessionsListPage(app: app)
        XCTAssertTrue(sessionsPage.exists(), "Sessions page should be visible")
        XCTAssertTrue(tabBar.isTabSelected("Sessions"), "Sessions tab should be selected")
        
        takeScreenshot(named: "Sessions View")
    }
    
    func testNavigateToCapture() throws {
        tabBar.navigateToCapture()
        
        let capturePage = CapturePage(app: app)
        
        // Handle camera permissions if they appear
        capturePage.handleCameraPermissions()
        
        XCTAssertTrue(capturePage.exists(), "Capture page should be visible")
        XCTAssertTrue(tabBar.isTabSelected("Capture"), "Capture tab should be selected")
        
        takeScreenshot(named: "Capture View")
    }
    
    func testNavigateToTests() throws {
        tabBar.navigateToTests()
        
        let testsPage = ClinicalTestsPage(app: app)
        XCTAssertTrue(testsPage.exists(), "Clinical Tests page should be visible")
        XCTAssertTrue(tabBar.isTabSelected("Tests"), "Tests tab should be selected")
        
        takeScreenshot(named: "Clinical Tests View")
    }
    
    func testNavigateToSettings() throws {
        tabBar.navigateToSettings()
        
        let settingsPage = SettingsPage(app: app)
        XCTAssertTrue(settingsPage.exists(), "Settings page should be visible")
        XCTAssertTrue(tabBar.isTabSelected("Settings"), "Settings tab should be selected")
        
        takeScreenshot(named: "Settings View")
    }
    
    func testNavigationBetweenAllTabs() throws {
        // Test complete navigation flow through all tabs
        
        // Dashboard
        tabBar.navigateToDashboard()
        XCTAssertTrue(DashboardPage(app: app).exists())
        
        // Sessions
        tabBar.navigateToSessions()
        XCTAssertTrue(SessionsListPage(app: app).exists())
        
        // Capture
        tabBar.navigateToCapture()
        CapturePage(app: app).handleCameraPermissions()
        XCTAssertTrue(CapturePage(app: app).exists())
        
        // Tests
        tabBar.navigateToTests()
        XCTAssertTrue(ClinicalTestsPage(app: app).exists())
        
        // Settings
        tabBar.navigateToSettings()
        XCTAssertTrue(SettingsPage(app: app).exists())
        
        // Back to Dashboard
        tabBar.navigateToDashboard()
        XCTAssertTrue(DashboardPage(app: app).exists())
        
        takeScreenshot(named: "Complete Navigation Flow")
    }
    
    func testTabSwitchingPreservesState() throws {
        // Navigate to Sessions
        tabBar.navigateToSessions()
        let sessionsPage = SessionsListPage(app: app)
        let initialSessionCount = sessionsPage.sessionCount
        
        // Navigate away and back
        tabBar.navigateToDashboard()
        tabBar.navigateToSessions()
        
        // Verify state is preserved
        let finalSessionCount = sessionsPage.sessionCount
        XCTAssertEqual(initialSessionCount, finalSessionCount, "Session count should be preserved")
    }
    
    func testRapidTabSwitching() throws {
        // Test that rapid tab switching doesn't cause crashes
        for _ in 0..<3 {
            tabBar.navigateToDashboard()
            tabBar.navigateToSessions()
            tabBar.navigateToCapture()
            tabBar.navigateToTests()
            tabBar.navigateToSettings()
        }
        
        // Verify app is still responsive
        XCTAssertTrue(tabBar.tabBar.exists)
    }
}
