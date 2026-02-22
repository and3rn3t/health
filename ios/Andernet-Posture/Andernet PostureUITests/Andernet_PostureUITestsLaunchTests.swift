//
//  Andernet_PostureUITestsLaunchTests.swift
//  Andernet PostureUITests
//
//  Created by Matt on 2/8/26.
//

import XCTest

/// Launch tests that run for each target application UI configuration
final class Andernet_PostureUITestsLaunchTests: XCTestCase {

    override class var runsForEachTargetApplicationUIConfiguration: Bool {
        true
    }

    override func setUpWithError() throws {
        continueAfterFailure = false
    }

    @MainActor
    func testLaunch() throws {
        let app = XCUIApplication()
        app.launch()

        // Wait for app to settle after launch
        let tabBar = app.tabBars.firstMatch
        _ = tabBar.waitForExistence(timeout: 10)
        
        // Capture launch screen state
        let attachment = XCTAttachment(screenshot: app.screenshot())
        attachment.name = "Launch Screen"
        attachment.lifetime = .keepAlways
        add(attachment)
    }
    
    @MainActor
    func testLaunchInDifferentOrientations() throws {
        let app = XCUIApplication()
        
        // Test portrait
        XCUIDevice.shared.orientation = .portrait
        app.launch()
        
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10), 
                     "App should launch in portrait orientation")
        
        let portraitScreenshot = XCTAttachment(screenshot: app.screenshot())
        portraitScreenshot.name = "Launch - Portrait"
        portraitScreenshot.lifetime = .keepAlways
        add(portraitScreenshot)
        
        app.terminate()
        
        // Test landscape (if supported)
        XCUIDevice.shared.orientation = .landscapeLeft
        app.launch()
        
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10), 
                     "App should launch in landscape orientation")
        
        let landscapeScreenshot = XCTAttachment(screenshot: app.screenshot())
        landscapeScreenshot.name = "Launch - Landscape"
        landscapeScreenshot.lifetime = .keepAlways
        add(landscapeScreenshot)
    }
    
    @MainActor
    func testLaunchWithNoInternet() throws {
        let app = XCUIApplication()
        
        // Note: To properly test offline mode, you would need to disable
        // network in the device/simulator settings or use a network link conditioner
        app.launchEnvironment["NETWORK_OFFLINE"] = "1"
        app.launch()
        
        let tabBar = app.tabBars.firstMatch
        XCTAssertTrue(tabBar.waitForExistence(timeout: 10), 
                     "App should launch even without internet")
        
        let screenshot = XCTAttachment(screenshot: app.screenshot())
        screenshot.name = "Launch - Offline Mode"
        screenshot.lifetime = .keepAlways
        add(screenshot)
    }
}
