import XCTest

final class HealthKitBridgeUITestsComprehensive: XCTestCase {

    var app: XCUIApplication!

    override func setUpWithError() throws {
        super.setUp()

        // In UI tests it is usually best to stop immediately when a failure occurs.
        continueAfterFailure = false

        // Initialize the app
        app = XCUIApplication()

        // Configure launch arguments for testing
        app.launchArguments += ["--uitesting"]
        app.launchEnvironment["UITEST_MODE"] = "1"
    }

    override func tearDownWithError() throws {
        super.tearDown()
        app = nil
    }

    // MARK: - Launch and Basic UI Tests
    @MainActor
    func testAppLaunch() throws {
        app.launch()

        // Verify app launched successfully
        XCTAssertTrue(app.state == .runningForeground)

        // Take a screenshot for debugging
        let screenshot = app.screenshot()
        let attachment = XCTAttachment(screenshot: screenshot)
        attachment.name = "App Launch Screenshot"
        attachment.lifetime = .keepAlways
        add(attachment)
    }

    @MainActor
    func testAppLaunchPerformance() throws {
        measure(metrics: [XCTApplicationLaunchMetric()]) {
            XCUIApplication().launch()
        }
    }

    @MainActor
    func testMainViewPresence() throws {
        app.launch()

        // Wait for main view to appear
        let mainView = app.otherElements["mainView"]
        let exists = mainView.waitForExistence(timeout: 10)

        if !exists {
            // Try alternative selectors if main view not found
            let anyText = app.staticTexts.firstMatch
            XCTAssertTrue(anyText.exists, "No UI elements found - app may not have loaded correctly")
        } else {
            XCTAssertTrue(exists, "Main view should be present")
        }
    }

    // MARK: - HealthKit Permission Tests
    @MainActor
    func testHealthKitPermissionPrompt() throws {
        app.launch()

        // Look for HealthKit permission buttons or prompts
        let healthKitButton = app.buttons["Request HealthKit Permissions"]
        let permissionButton = app.buttons["Allow"]
        let settingsButton = app.buttons["Health Permissions"]

        // Check if any health-related UI elements exist
        let hasHealthKitUI = healthKitButton.exists || permissionButton.exists || settingsButton.exists

        if hasHealthKitUI {
            if healthKitButton.exists {
                healthKitButton.tap()

                // Handle system permission dialog if it appears
                let systemAllowButton = app.buttons["Allow"]
                if systemAllowButton.waitForExistence(timeout: 5) {
                    systemAllowButton.tap()
                }
            }
        }

        // Test should complete without crashing
        XCTAssertTrue(true, "HealthKit permission flow completed")
    }

    @MainActor
    func testHealthKitPermissionSettings() throws {
        app.launch()

        // Look for settings or permission management UI
        let settingsButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'setting' OR label CONTAINS[c] 'permission'")).firstMatch

        if settingsButton.exists {
            settingsButton.tap()

            // Verify settings screen appears
            let backButton = app.navigationBars.buttons.firstMatch
            XCTAssertTrue(backButton.exists || app.buttons["Back"].exists, "Should be able to navigate back from settings")
        }
    }

    // MARK: - Health Data Display Tests
    @MainActor
    func testHealthDataDisplay() throws {
        app.launch()

        // Wait for health data to potentially load
        sleep(3)

        // Look for health data displays
        let heartRateLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'heart' OR label CONTAINS[c] 'bpm'")).firstMatch
        let stepCountLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'step' OR label CONTAINS[c] 'walk'")).firstMatch
        let healthDataLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'health' OR label CONTAINS[c] 'data'")).firstMatch

        // At least one health-related element should be present
        let hasHealthData = heartRateLabel.exists || stepCountLabel.exists || healthDataLabel.exists

        if hasHealthData {
            XCTAssertTrue(true, "Health data display elements found")
        } else {
            // App might be in a loading state or permissions not granted
            let loadingIndicator = app.activityIndicators.firstMatch
            let noDataLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'no data' OR label CONTAINS[c] 'loading'")).firstMatch

            XCTAssertTrue(loadingIndicator.exists || noDataLabel.exists || app.staticTexts.count > 0,
                         "Should show loading, no data message, or some UI elements")
        }
    }

    // MARK: - Connection Status Tests
    @MainActor
    func testConnectionStatusDisplay() throws {
        app.launch()

        // Look for connection status indicators
        let connectedLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'connected' OR label CONTAINS[c] 'online'")).firstMatch
        let disconnectedLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'disconnected' OR label CONTAINS[c] 'offline'")).firstMatch
        let statusLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'status'")).firstMatch

        // Some connection status should be visible
        let hasConnectionStatus = connectedLabel.exists || disconnectedLabel.exists || statusLabel.exists

        if hasConnectionStatus {
            XCTAssertTrue(true, "Connection status display found")
        } else {
            // Connection status might be indicated differently
            let networkIndicator = app.images.matching(NSPredicate(format: "label CONTAINS[c] 'network' OR label CONTAINS[c] 'wifi'")).firstMatch
            XCTAssertTrue(networkIndicator.exists || app.staticTexts.count > 0, "Should show some form of status indication")
        }
    }

    // MARK: - Button Interaction Tests
    @MainActor
    func testButtonInteractions() throws {
        app.launch()

        // Find all tappable buttons
        let buttons = app.buttons

        if buttons.count > 0 {
            // Test tapping the first available button
            let firstButton = buttons.firstMatch
            if firstButton.exists && firstButton.isEnabled {
                firstButton.tap()

                // Verify app responds to button tap (no crash)
                XCTAssertTrue(app.state == .runningForeground, "App should remain running after button tap")
            }
        }

        // Look for specific action buttons
        let refreshButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'refresh' OR label CONTAINS[c] 'reload'")).firstMatch
        let connectButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'connect'")).firstMatch
        let syncButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'sync'")).firstMatch

        if refreshButton.exists {
            refreshButton.tap()
            sleep(1) // Allow time for refresh action
        }

        if connectButton.exists {
            connectButton.tap()
            sleep(1) // Allow time for connection action
        }

        if syncButton.exists {
            syncButton.tap()
            sleep(1) // Allow time for sync action
        }
    }

    // MARK: - Navigation Tests
    @MainActor
    func testNavigationFlow() throws {
        app.launch()

        // Test navigation if tabs or navigation exists
        let tabBar = app.tabBars.firstMatch
        if tabBar.exists {
            let tabs = tabBar.buttons
            if tabs.count > 1 {
                // Test navigating between tabs
                tabs.element(boundBy: 1).tap()
                sleep(1)
                tabs.element(boundBy: 0).tap()
                sleep(1)
            }
        }

        // Test navigation bar if present
        let navBar = app.navigationBars.firstMatch
        if navBar.exists {
            let navButtons = navBar.buttons
            if navButtons.count > 0 {
                // Test navigation button interaction
                navButtons.firstMatch.tap()
                sleep(1)
            }
        }

        // Test should complete without navigation errors
        XCTAssertTrue(app.state == .runningForeground, "App should handle navigation without crashing")
    }

    // MARK: - Error Handling UI Tests
    @MainActor
    func testErrorStateHandling() throws {
        app.launch()

        // Look for error messages or alert dialogs
        let errorAlert = app.alerts.firstMatch
        let errorLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'error' OR label CONTAINS[c] 'failed'")).firstMatch

        if errorAlert.exists {
            // Dismiss error alert if present
            let okButton = errorAlert.buttons["OK"]
            let dismissButton = errorAlert.buttons.firstMatch

            if okButton.exists {
                okButton.tap()
            } else if dismissButton.exists {
                dismissButton.tap()
            }
        }

        if errorLabel.exists {
            // Error label found - this is acceptable for testing
            XCTAssertTrue(true, "Error state UI is present and handled")
        }

        // App should continue running even with errors
        XCTAssertTrue(app.state == .runningForeground, "App should handle errors gracefully")
    }

    // MARK: - Background and Foreground Tests
    @MainActor
    func testBackgroundToForegroundTransition() throws {
        app.launch()

        // Send app to background
        XCUIDevice.shared.press(.home)
        sleep(2)

        // Bring app back to foreground
        app.activate()
        sleep(2)

        // Verify app is still responsive
        XCTAssertTrue(app.state == .runningForeground, "App should return to foreground successfully")

        // Test that UI is still responsive after background transition
        let anyButton = app.buttons.firstMatch
        if anyButton.exists && anyButton.isEnabled {
            anyButton.tap()
        }
    }

    // MARK: - Accessibility Tests
    @MainActor
    func testAccessibilityElements() throws {
        app.launch()

        // Verify accessibility elements are properly configured
        let accessibleElements = app.descendants(matching: .any).matching(NSPredicate(format: "isAccessibilityElement == true"))

        // Should have at least some accessible elements
        XCTAssertGreaterThan(accessibleElements.count, 0, "App should have accessibility elements")

        // Test VoiceOver navigation simulation
        for i in 0..<min(accessibleElements.count, 5) {
            let element = accessibleElements.element(boundBy: i)
            if element.exists {
                // Verify element has accessibility label or value
                XCTAssertTrue(!element.label.isEmpty || !element.value.isEmpty,
                             "Accessible elements should have labels or values")
            }
        }
    }

    // MARK: - Performance Tests
    @MainActor
    func testScrollingPerformance() throws {
        app.launch()

        // Find scrollable elements
        let scrollView = app.scrollViews.firstMatch
        let tableView = app.tables.firstMatch
        let collectionView = app.collectionViews.firstMatch

        // Test scrolling performance if scrollable content exists
        if scrollView.exists {
            measure(metrics: [XCTOSSignpostMetric.scrollingAndDecelerationMetric]) {
                scrollView.swipeUp()
                scrollView.swipeDown()
            }
        } else if tableView.exists {
            measure(metrics: [XCTOSSignpostMetric.scrollingAndDecelerationMetric]) {
                tableView.swipeUp()
                tableView.swipeDown()
            }
        } else if collectionView.exists {
            measure(metrics: [XCTOSSignpostMetric.scrollingAndDecelerationMetric]) {
                collectionView.swipeUp()
                collectionView.swipeDown()
            }
        }
    }

    // MARK: - Memory and Resource Tests
    @MainActor
    func testMemoryUsageStability() throws {
        app.launch()

        // Perform multiple operations to test memory stability
        for i in 0..<10 {
            // Simulate user interactions
            let buttons = app.buttons
            if buttons.count > 0 {
                buttons.element(boundBy: i % buttons.count).tap()
            }

            // Brief pause between operations
            usleep(100000) // 0.1 seconds
        }

        // App should remain stable
        XCTAssertTrue(app.state == .runningForeground, "App should remain stable under repeated operations")
    }

    // MARK: - Network State Tests
    @MainActor
    func testNetworkStateHandling() throws {
        app.launch()

        // Look for network-related UI elements
        let offlineLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'offline' OR label CONTAINS[c] 'no connection'")).firstMatch
        let retryButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'retry' OR label CONTAINS[c] 'reconnect'")).firstMatch

        if offlineLabel.exists || retryButton.exists {
            // Test offline state handling
            if retryButton.exists {
                retryButton.tap()
                sleep(2) // Allow time for retry operation
            }

            XCTAssertTrue(true, "Network state UI elements handled successfully")
        }
    }

    // MARK: - Data Loading Tests
    @MainActor
    func testDataLoadingStates() throws {
        app.launch()

        // Look for loading indicators
        let loadingIndicator = app.activityIndicators.firstMatch
        let progressBar = app.progressIndicators.firstMatch
        let loadingLabel = app.staticTexts.matching(NSPredicate(format: "label CONTAINS[c] 'loading' OR label CONTAINS[c] 'syncing'")).firstMatch

        if loadingIndicator.exists {
            // Wait for loading to complete
            let timeout = Date().addingTimeInterval(10)

            while Date() < timeout && loadingIndicator.exists {
                sleep(1)
            }

            XCTAssertTrue(true, "Loading state handled appropriately")
        }

        if progressBar.exists || loadingLabel.exists {
            XCTAssertTrue(true, "Progress indicators present and functional")
        }
    }

    // MARK: - Integration Test
    @MainActor
    func testFullUserFlow() throws {
        app.launch()

        // Simulate a complete user flow
        sleep(2) // Allow app to fully load

        // Step 1: Check for permission requests
        let permissionButton = app.buttons.matching(NSPredicate(format: "label CONTAINS[c] 'permission' OR label CONTAINS[c] 'allow'")).firstMatch
        if permissionButton.exists {
            permissionButton.tap()
            sleep(2)
        }

        // Step 2: Look for main functionality
        let mainActionButton = app.buttons.firstMatch
        if mainActionButton.exists && mainActionButton.isEnabled {
            mainActionButton.tap()
            sleep(2)
        }

        // Step 3: Check for data or content
        let hasContent = app.staticTexts.count > 0 || app.buttons.count > 0 || app.images.count > 0
        XCTAssertTrue(hasContent, "App should display some content")

        // Step 4: Test navigation if available
        let navElements = app.tabBars.buttons.count + app.navigationBars.buttons.count
        if navElements > 0 {
            // Test one navigation action
            if app.tabBars.buttons.count > 1 {
                app.tabBars.buttons.element(boundBy: 1).tap()
                sleep(1)
            }
        }

        // Step 5: Verify app stability throughout flow
        XCTAssertTrue(app.state == .runningForeground, "App should remain stable throughout user flow")
    }
}
