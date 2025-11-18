import Foundation
import SwiftUI

// User preferences for the VitalSense widget configuration.

final class WidgetPreferences: ObservableObject {
    static let shared = WidgetPreferences()

    @Published var selectedMetrics: [String] = []
    @Published var accentColor: Color = .blue

    private init() { }
}

// Minimal manager used by WidgetConfigurationView to surface health summary data to widgets.

@MainActor
final class WidgetHealthManager: ObservableObject {
    static let shared = WidgetHealthManager()

    @Published var lastUpdated: Date?

    private init() { }

    func refreshData() async {
        // In a future iteration, bridge to HealthKitManager or cached aggregates.
        lastUpdated = Date()
    }
}
