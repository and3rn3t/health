import SwiftUI

/// Helpers for constructing accessibility labels & values consistently.
public enum AccessibilityHelpers {
    public static func metricLabel(name: String, value: String, qualifier: String? = nil) -> Text {
        let combined: String
        if let qualifier, !qualifier.isEmpty {
            combined = "\(name): \(value), \(qualifier)"
        } else {
            combined = "\(name): \(value)"
        }
        return Text(combined)
    }

    public static func fallRiskSummary(levelName: String, subtitle: String) -> Text {
        Text("\(loc("fall_risk_title")): \(levelName). \(subtitle)")
    }
}
