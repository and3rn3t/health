//
//  SessionFlowTests.swift
//  Andernet PostureUITests
//
//  Tests for session capture and management flows
//

import XCTest

final class SessionFlowTests: BaseUITest {
    
    var tabBar: TabBar!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        tabBar = TabBar(app: app)
    }
    
    // MARK: - Session List Tests
    
    func testSessionsListAppears() throws {
        tabBar.navigateToSessions()
        
        let sessionsPage = SessionsListPage(app: app)
        XCTAssertTrue(sessionsPage.exists(), "Sessions list should appear")
        
        takeScreenshot(named: "Sessions List")
    }
    
    func testEmptySessionsState() throws {
        tabBar.navigateToSessions()
        
        let sessionsPage = SessionsListPage(app: app)
        
        // If there are no sessions, empty state should show
        if sessionsPage.sessionCount == 0 {
            XCTAssertTrue(sessionsPage.emptyStateText.exists || 
                         sessionsPage.sessionsList.exists,
                         "Either empty state or sessions list should exist")
            takeScreenshot(named: "Empty Sessions State")
        }
    }
    
    func testSessionDetailNavigation() throws {
        tabBar.navigateToSessions()
        
        let sessionsPage = SessionsListPage(app: app)
        
        // Only test if there are sessions
        guard sessionsPage.sessionCount > 0 else {
            throw XCTSkip("No sessions available to test detail navigation")
        }
        
        // Tap first session
        sessionsPage.tapSession(at: 0)
        
        // Verify detail page appears
        let detailPage = SessionDetailPage(app: app)
        waitForElement(detailPage.navigationBar)
        XCTAssertTrue(detailPage.exists(), "Session detail page should appear")
        
        takeScreenshot(named: "Session Detail")
        
        // Navigate back
        detailPage.goBack()
        
        // Verify we're back at sessions list
        waitForElement(sessionsPage.sessionsList)
        XCTAssertTrue(sessionsPage.exists(), "Should return to sessions list")
    }
    
    // MARK: - Capture Flow Tests
    
    func testCaptureViewAppears() throws {
        tabBar.navigateToCapture()
        
        let capturePage = CapturePage(app: app)
        capturePage.handleCameraPermissions()
        
        XCTAssertTrue(capturePage.exists(), "Capture view should appear")
        takeScreenshot(named: "Capture View Ready")
    }
    
    func testCaptureButtonsExist() throws {
        tabBar.navigateToCapture()
        
        let capturePage = CapturePage(app: app)
        capturePage.handleCameraPermissions()
        
        // Wait for capture interface to load
        _ = app.buttons.firstMatch.waitForExistence(timeout: 3)
        
        // Check for start button (or stop if already recording)
        let hasStartOrStop = capturePage.startButton.exists || capturePage.stopButton.exists
        XCTAssertTrue(hasStartOrStop, "Start or Stop button should exist")
        
        takeScreenshot(named: "Capture Controls")
    }
    
    // Note: Full capture recording test would require AR permissions
    // and proper device setup. This is a basic flow test.
    func testCapturePermissionsFlow() throws {
        tabBar.navigateToCapture()
        
        let capturePage = CapturePage(app: app)
        
        // If permission alert appears
        if capturePage.cameraPermissionAlert.waitForExistence(timeout: 2) {
            takeScreenshot(named: "Camera Permission Alert")
            
            // Handle the permission
            capturePage.handleCameraPermissions()
            
            // Verify we can continue
            XCTAssertTrue(capturePage.exists(), "Capture view should be accessible after permissions")
        }
    }
    
    // MARK: - Dashboard Tests
    
    func testDashboardDisplays() throws {
        tabBar.navigateToDashboard()
        
        let dashboardPage = DashboardPage(app: app)
        XCTAssertTrue(dashboardPage.exists(), "Dashboard should display")
        
        takeScreenshot(named: "Dashboard Overview")
    }
    
    func testDashboardScrollable() throws {
        tabBar.navigateToDashboard()
        
        let dashboardPage = DashboardPage(app: app)
        
        // Verify scroll view exists and is scrollable
        if dashboardPage.scrollView.exists {
            // Try scrolling
            dashboardPage.scrollView.swipeUp()
            dashboardPage.scrollView.swipeDown()
            
            XCTAssertTrue(dashboardPage.exists(), "Dashboard should remain functional after scrolling")
        }
    }
    
    // MARK: - Clinical Tests
    
    func testClinicalTestsViewAppears() throws {
        tabBar.navigateToTests()
        
        let testsPage = ClinicalTestsPage(app: app)
        XCTAssertTrue(testsPage.exists(), "Clinical tests view should appear")
        
        takeScreenshot(named: "Clinical Tests")
    }
    
    // MARK: - Integration Tests
    
    func testCompleteUserJourney() throws {
        // Simulate a complete user journey
        
        // 1. Start at Dashboard
        tabBar.navigateToDashboard()
        XCTAssertTrue(DashboardPage(app: app).exists())
        takeScreenshot(named: "Journey - Dashboard")
        
        // 2. Check Sessions
        tabBar.navigateToSessions()
        XCTAssertTrue(SessionsListPage(app: app).exists())
        takeScreenshot(named: "Journey - Sessions")
        
        // 3. Navigate to Capture
        tabBar.navigateToCapture()
        CapturePage(app: app).handleCameraPermissions()
        XCTAssertTrue(CapturePage(app: app).exists())
        takeScreenshot(named: "Journey - Capture")
        
        // 4. Check Clinical Tests
        tabBar.navigateToTests()
        XCTAssertTrue(ClinicalTestsPage(app: app).exists())
        takeScreenshot(named: "Journey - Tests")
        
        // 5. Return to Dashboard
        tabBar.navigateToDashboard()
        XCTAssertTrue(DashboardPage(app: app).exists())
        takeScreenshot(named: "Journey - Complete")
    }
}
