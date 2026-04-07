//
//  PerformanceTests.swift
//  Andernet PostureUITests
//
//  Performance and load time tests
//

import XCTest

final class PerformanceTests: BaseUITest {
    
    var tabBar: TabBar!
    
    override func setUpWithError() throws {
        try super.setUpWithError()
        tabBar = TabBar(app: app)
    }
    
    // MARK: - Launch Performance
    
    func testAppLaunchPerformance() throws {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            // Terminate and relaunch
            app.terminate()
            app.launch()
        }
    }
    
    func testFirstFrameRenderTime() throws {
        measure(metrics: [XCTApplicationLaunchMetric(), XCTClockMetric()]) {
            app.terminate()
            app.launch()
            
            // Wait for first meaningful frame
            _ = tabBar.tabBar.waitForExistence(timeout: 10)
        }
    }
    
    // MARK: - Navigation Performance
    
    func testTabSwitchingPerformance() throws {
        let options = XCTMeasureOptions()
        options.iterationCount = 5
        
        measure(metrics: [XCTClockMetric(), XCTCPUMetric()], options: options) {
            // Switch through all tabs
            tabBar.navigateToDashboard()
            tabBar.navigateToSessions()
            tabBar.navigateToCapture()
            tabBar.navigateToTests()
            tabBar.navigateToSettings()
            tabBar.navigateToDashboard()
        }
    }
    
    func testDashboardLoadTime() throws {
        measure(metrics: [XCTClockMetric()]) {
            tabBar.navigateToSessions()
            tabBar.navigateToDashboard()
            
            let dashboardPage = DashboardPage(app: app)
            _ = dashboardPage.scrollView.waitForExistence(timeout: 5)
        }
    }
    
    func testSessionsListLoadTime() throws {
        measure(metrics: [XCTClockMetric()]) {
            tabBar.navigateToDashboard()
            tabBar.navigateToSessions()
            
            let sessionsPage = SessionsListPage(app: app)
            _ = sessionsPage.sessionsList.waitForExistence(timeout: 5)
        }
    }
    
    // MARK: - Scrolling Performance
    
    func testDashboardScrollPerformance() throws {
        tabBar.navigateToDashboard()
        
        let dashboardPage = DashboardPage(app: app)
        guard dashboardPage.scrollView.exists else {
            throw XCTSkip("Dashboard scroll view not available")
        }
        
        let options = XCTMeasureOptions()
        options.iterationCount = 3
        
        measure(metrics: [XCTClockMetric(), XCTCPUMetric()], options: options) {
            // Scroll up and down
            for _ in 0..<5 {
                dashboardPage.scrollView.swipeUp()
            }
            for _ in 0..<5 {
                dashboardPage.scrollView.swipeDown()
            }
        }
    }
    
    func testSessionsListScrollPerformance() throws {
        tabBar.navigateToSessions()
        
        let sessionsPage = SessionsListPage(app: app)
        guard sessionsPage.sessionsList.exists else {
            throw XCTSkip("Sessions list not available for scroll test")
        }
        
        // Only test if there are enough sessions to scroll
        guard sessionsPage.sessionCount >= 5 else {
            throw XCTSkip("Not enough sessions to test scrolling performance")
        }
        
        let options = XCTMeasureOptions()
        options.iterationCount = 3
        
        measure(metrics: [XCTClockMetric()], options: options) {
            for _ in 0..<3 {
                sessionsPage.sessionsList.swipeUp()
            }
            for _ in 0..<3 {
                sessionsPage.sessionsList.swipeDown()
            }
        }
    }
    
    // MARK: - Memory Performance
    
    func testMemoryUsageDuringNavigation() throws {
        measure(metrics: [XCTMemoryMetric()]) {
            // Navigate through all views multiple times
            for _ in 0..<3 {
                tabBar.navigateToDashboard()
                tabBar.navigateToSessions()
                tabBar.navigateToCapture()
                CapturePage(app: app).handleCameraPermissions()
                tabBar.navigateToTests()
                tabBar.navigateToSettings()
            }
        }
    }
    
    // MARK: - Animation Performance
    
    func testViewTransitionSmoothness() throws {
        // Test that view transitions complete in reasonable time
        measure(metrics: [XCTClockMetric()]) {
            tabBar.navigateToDashboard()
            _ = DashboardPage(app: app).scrollView.waitForExistence(timeout: 2)
            
            tabBar.navigateToSessions()
            _ = SessionsListPage(app: app).sessionsList.waitForExistence(timeout: 2)
            
            tabBar.navigateToCapture()
            _ = CapturePage(app: app).startButton.waitForExistence(timeout: 2)
        }
    }
    
    // MARK: - Stress Tests
    
    func testRapidInteractionStability() throws {
        // Test app stability under rapid interaction
        let options = XCTMeasureOptions()
        options.iterationCount = 2
        
        measure(metrics: [XCTClockMetric(), XCTCPUMetric()], options: options) {
            for _ in 0..<10 {
                tabBar.dashboardTab.tap()
                tabBar.sessionsTab.tap()
                tabBar.settingsTab.tap()
            }
        }
        
        // Verify app is still responsive
        XCTAssertTrue(tabBar.tabBar.exists, "App should remain stable after rapid interactions")
    }
    
    // MARK: - Cold vs Warm Start
    
    func testColdStartPerformance() throws {
        // Measure launch from terminated state (cold start)
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            app.terminate()
            app.launch()
            _ = tabBar.tabBar.waitForExistence(timeout: 10)
        }
    }
    
    func testWarmStartPerformance() throws {
        // Measure launch from background state (warm start)
        app.launch()
        
        measure(metrics: [XCTClockMetric()]) {
            // Background the app
            XCUIDevice.shared.press(.home)
            
            // Bring back to foreground
            app.activate()
            _ = tabBar.tabBar.waitForExistence(timeout: 5)
        }
    }
}
