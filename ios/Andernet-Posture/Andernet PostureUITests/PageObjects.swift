//
//  PageObjects.swift
//  Andernet PostureUITests
//
//  Page Object pattern for UI tests
//

import XCTest

// MARK: - Tab Bar Helper

struct TabBar {
    let app: XCUIApplication
    
    var tabBar: XCUIElement {
        app.tabBars.firstMatch
    }
    
    var dashboardTab: XCUIElement {
        app.tabBars.buttons["Dashboard"]
    }
    
    var sessionsTab: XCUIElement {
        app.tabBars.buttons["Sessions"]
    }
    
    var captureTab: XCUIElement {
        app.tabBars.buttons["Capture"]
    }
    
    var testsTab: XCUIElement {
        app.tabBars.buttons["Tests"]
    }
    
    var settingsTab: XCUIElement {
        app.tabBars.buttons["Settings"]
    }
    
    func navigateToDashboard() {
        dashboardTab.tap()
    }
    
    func navigateToSessions() {
        sessionsTab.tap()
    }
    
    func navigateToCapture() {
        captureTab.tap()
    }
    
    func navigateToTests() {
        testsTab.tap()
    }
    
    func navigateToSettings() {
        settingsTab.tap()
    }
    
    func isTabSelected(_ tabName: String) -> Bool {
        let tab = app.tabBars.buttons[tabName]
        return tab.isSelected
    }
}

// MARK: - Dashboard Page

struct DashboardPage {
    let app: XCUIApplication
    
    var navigationBar: XCUIElement {
        app.navigationBars["Dashboard"]
    }
    
    var scrollView: XCUIElement {
        app.scrollViews.firstMatch
    }
    
    // Look for common dashboard elements
    // Adjust identifiers as needed based on actual implementation
    func exists() -> Bool {
        return app.staticTexts["Dashboard"].exists ||
               app.navigationBars["Dashboard"].exists ||
               scrollView.exists
    }
}

// MARK: - Sessions List Page

struct SessionsListPage {
    let app: XCUIApplication
    
    var navigationBar: XCUIElement {
        app.navigationBars.firstMatch
    }
    
    var sessionsList: XCUIElement {
        app.collectionViews.firstMatch
    }
    
    var emptyStateText: XCUIElement {
        app.staticTexts["No sessions yet"]
    }
    
    func sessionCell(at index: Int) -> XCUIElement {
        sessionsList.cells.element(boundBy: index)
    }
    
    func tapSession(at index: Int) {
        sessionCell(at: index).tap()
    }
    
    func exists() -> Bool {
        return sessionsList.exists || emptyStateText.exists
    }
    
    var sessionCount: Int {
        return sessionsList.cells.count
    }
}

// MARK: - Capture Page

struct CapturePage {
    let app: XCUIApplication
    
    var startButton: XCUIElement {
        app.buttons["Start Capture"]
    }
    
    var stopButton: XCUIElement {
        app.buttons["Stop"]
    }
    
    var recordingIndicator: XCUIElement {
        app.staticTexts["Recording"]
    }
    
    var cameraPermissionAlert: XCUIElement {
        app.alerts.firstMatch
    }
    
    func exists() -> Bool {
        return startButton.exists || stopButton.exists
    }
    
    func handleCameraPermissions() {
        // If permission alert appears, allow it
        if cameraPermissionAlert.waitForExistence(timeout: 2) {
            let allowButton = cameraPermissionAlert.buttons["Allow"]
            if allowButton.exists {
                allowButton.tap()
            }
        }
    }
}

// MARK: - Clinical Tests Page

struct ClinicalTestsPage {
    let app: XCUIApplication
    
    var navigationBar: XCUIElement {
        app.navigationBars.firstMatch
    }
    
    var testsList: XCUIElement {
        app.scrollViews.firstMatch
    }
    
    func exists() -> Bool {
        return testsList.exists || 
               app.staticTexts["Tests"].exists
    }
}

// MARK: - Settings Page

struct SettingsPage {
    let app: XCUIApplication
    
    var navigationBar: XCUIElement {
        app.navigationBars["Settings"]
    }
    
    var settingsList: XCUIElement {
        app.scrollViews.firstMatch
    }
    
    // Common settings sections
    var accountSection: XCUIElement {
        app.staticTexts["Account"]
    }
    
    var privacySection: XCUIElement {
        app.staticTexts["Privacy"]
    }
    
    var notificationsSection: XCUIElement {
        app.staticTexts["Notifications"]
    }
    
    var aboutSection: XCUIElement {
        app.staticTexts["About"]
    }
    
    func exists() -> Bool {
        return settingsList.exists || navigationBar.exists
    }
}

// MARK: - Session Detail Page

struct SessionDetailPage {
    let app: XCUIApplication
    
    var navigationBar: XCUIElement {
        app.navigationBars.firstMatch
    }
    
    var backButton: XCUIElement {
        navigationBar.buttons.firstMatch
    }
    
    var scrollView: XCUIElement {
        app.scrollViews.firstMatch
    }
    
    var shareButton: XCUIElement {
        app.buttons["Share"]
    }
    
    var exportButton: XCUIElement {
        app.buttons["Export"]
    }
    
    func exists() -> Bool {
        return scrollView.exists || navigationBar.exists
    }
    
    func goBack() {
        backButton.tap()
    }
}

// MARK: - Alert Helper

struct AlertHelper {
    let app: XCUIApplication
    
    var alert: XCUIElement {
        app.alerts.firstMatch
    }
    
    func exists() -> Bool {
        return alert.exists
    }
    
    func tapButton(titled title: String) {
        alert.buttons[title].tap()
    }
    
    func dismiss() {
        // Tap OK, Cancel, or Dismiss button
        if alert.buttons["OK"].exists {
            alert.buttons["OK"].tap()
        } else if alert.buttons["Cancel"].exists {
            alert.buttons["Cancel"].tap()
        } else if alert.buttons["Dismiss"].exists {
            alert.buttons["Dismiss"].tap()
        }
    }
}
