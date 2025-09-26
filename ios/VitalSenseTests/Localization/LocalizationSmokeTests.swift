import XCTest
@testable import VitalSense

final class LocalizationCoreSmokeTests: XCTestCase {
    func testCoreLocalizationKeysExist() {
        let bundle = Bundle.main
        let keys = [
            "settings_section_general",
            "settings_toggle_enable_haptics",
            "settings_toggle_default_simulation",
            "settings_version_label",
            "settings_nav_title",
            "home_tab_title",
            "settings_tab_title",
            "settings_footer_copyright"
        ]
        for key in keys {
            let localized = bundle.localizedString(forKey: key, value: nil, table: nil)
            XCTAssertNotEqual(localized, key, "Missing localization for key: \(key)")
        }
    }
}

final class LocalizationWalkingSessionSmokeTests: XCTestCase {
    func testWalkingSessionKeysExist() {
        let keys = [
            "walk_status_recording",
            "walk_status_ready",
            "walk_metric_duration",
            "walk_metric_distance",
            "walk_metric_speed",
            "walk_metric_steps",
            "walk_tab_overview",
            "walk_tab_live",
            "walk_tab_route",
            "walk_tab_analysis",
            "widget_display_name",
            "widget_display_description",
            "gait_recommendations_title",
            "gait_progress_title",
            "gait_progress_optimal_format",
            "fall_level_title_low",
            "fall_reco_exercise",
            "steps_count_one","steps_count_other","hours_count_one","hours_count_other"
        ]
        for key in keys {
            let localized = NSLocalizedString(key, comment: "")
            XCTAssertFalse(localized == key, "Missing localization for \(key)")
        }
    }
}
