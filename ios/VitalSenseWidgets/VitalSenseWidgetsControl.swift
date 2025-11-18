//
//  VitalSenseWidgetsControl.swift
//  VitalSenseWidgets
//
//  iOS 26 Enhanced Health Monitoring Control Widget
//

import AppIntents
import SwiftUI
import WidgetKit

@available(iOS 18.0, *)
struct VitalSenseWidgetsControl: ControlWidget {
    static let kind: String = "com.vitalsense.HealthMonitoringControl"

    var body: some ControlWidgetConfiguration {
        AppIntentControlConfiguration(
            kind: Self.kind,
            provider: Provider()
        ) { value in
            ControlWidgetToggle(
                "Health Monitoring",
                isOn: value.isMonitoring,
                action: ToggleHealthMonitoringIntent()
            ) { isMonitoring in
                Label {
                    Text(isMonitoring ? "Monitoring" : "Paused")
                        .font(.caption)
                        .fontWeight(.medium)
                } icon: {
                    Image(systemName: "heart.fill")
                        .foregroundStyle(isMonitoring ? .red : .secondary)
                }
            }
        }
        .displayName("VitalSense Health")
        .description("Control continuous health monitoring and real-time alerts.")
    }
}

@available(iOS 18.0, *)
extension VitalSenseWidgetsControl {
    struct Value {
        var isMonitoring: Bool
        var alertsEnabled: Bool
        var lastHeartRate: Double
    }

    @available(iOS 18.0, *)
    struct Provider: AppIntentControlValueProvider {
        func previewValue(configuration: HealthMonitoringConfiguration) -> Value {
            VitalSenseWidgetsControl.Value(
                isMonitoring: false,
                alertsEnabled: configuration.enableAlerts,
                lastHeartRate: 72.0
            )
        }

        func currentValue(configuration: HealthMonitoringConfiguration) async throws -> Value {
            // Check current monitoring state from WidgetHealthManager
            // Note: Widget extensions have limited access to main app state
            let isMonitoring = await WidgetHealthManager.shared.isActivelyMonitoring
            let lastHeartRate = await WidgetHealthManager.shared.getCurrentHeartRate()

            return VitalSenseWidgetsControl.Value(
                isMonitoring: isMonitoring,
                alertsEnabled: configuration.enableAlerts,
                lastHeartRate: lastHeartRate
            )
        }
    }
}

@available(iOS 17.0, *)
struct HealthMonitoringConfiguration: ControlConfigurationIntent {
    static let title: LocalizedStringResource = "Health Monitoring Configuration"

    @Parameter(title: "Enable Alerts", default: true)
    var enableAlerts: Bool

    @Parameter(title: "Emergency Contact", default: "Primary")
    var emergencyContact: String
    
    func perform() async throws -> some IntentResult {
        // Configuration intents don't perform actions, just return result
        return .result()
    }
}

@available(iOS 17.0, *)
struct ToggleHealthMonitoringIntent: SetValueIntent {
    static let title: LocalizedStringResource = "Toggle Health Monitoring"

    @Parameter(title: "Enable Monitoring")
    var value: Bool

    init() {}

    func perform() async throws -> some IntentResult {
        // Toggle health monitoring state
        // Note: Widget extensions have limited access to main app state
        // This would need to communicate with the main app via App Groups or similar
        if value {
            await WidgetHealthManager.shared.startMonitoring()
        } else {
            await WidgetHealthManager.shared.stopMonitoring()
        }

        return .result()
    }
}
