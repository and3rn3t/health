//
//  VitalSenseWidgetsControl.swift
//  VitalSenseWidgets
//
//  iOS 26 Enhanced Health Monitoring Control Widget
//

import AppIntents
import SwiftUI
import WidgetKit

struct VitalSenseWidgetsControl: ControlWidget {
    static let kind: String = "com.vitalsense.HealthMonitoringControl"

    var body: some ControlWidgetConfiguration {
        AppIntentControlConfiguration(
            kind: Self.kind,
            provider: Provider()
        ) { value in
            if #available(iOS 26.0, *) {
                // iOS 26 Enhanced Control Widget with Variable Draw
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
                            .foregroundStyle(
                                isMonitoring ?
                                iOS26Integration.gradientStyle(for: .cardiovascular) :
                                .secondary
                            )
                            .symbolEffect(
                                .variableColor.iterative.dimInactiveLayers.nonReversing,
                                options: .speed(isMonitoring ? 1.0 : 0.0),
                                value: isMonitoring
                            )
                            .symbolEffect(
                                .pulse.byLayer,
                                options: .repeat(.continuous).speed(0.8),
                                value: isMonitoring
                            )
                    }
                }
                .controlWidgetActionHint("Toggle continuous health monitoring")
            } else {
                // Fallback for older iOS versions
                ControlWidgetToggle(
                    "Health Monitoring",
                    isOn: value.isMonitoring,
                    action: ToggleHealthMonitoringIntent()
                ) { isMonitoring in
                    Label(isMonitoring ? "On" : "Off", systemImage: "heart.fill")
                        .foregroundColor(isMonitoring ? .red : .secondary)
                }
            }
        }
        .displayName("VitalSense Health")
        .description("Control continuous health monitoring and real-time alerts.")
    }
}

extension VitalSenseWidgetsControl {
    struct Value {
        var isMonitoring: Bool
        var alertsEnabled: Bool
        var lastHeartRate: Double
    }

    struct Provider: AppIntentControlValueProvider {
        func previewValue(configuration: HealthMonitoringConfiguration) -> Value {
            VitalSenseWidgetsControl.Value(
                isMonitoring: false,
                alertsEnabled: configuration.enableAlerts,
                lastHeartRate: 72.0
            )
        }

        func currentValue(configuration: HealthMonitoringConfiguration) async throws -> Value {
            // Check current monitoring state from HealthKitManager
            let isMonitoring = HealthKitManager.shared.isActivelyMonitoring
            let lastHeartRate = await HealthKitManager.shared.getCurrentHeartRate()

            return VitalSenseWidgetsControl.Value(
                isMonitoring: isMonitoring,
                alertsEnabled: configuration.enableAlerts,
                lastHeartRate: lastHeartRate
            )
        }
    }
}

struct HealthMonitoringConfiguration: ControlConfigurationIntent {
    static let title: LocalizedStringResource = "Health Monitoring Configuration"

    @Parameter(title: "Enable Alerts", default: true)
    var enableAlerts: Bool

    @Parameter(title: "Emergency Contact", default: "Primary")
    var emergencyContact: String
}

struct ToggleHealthMonitoringIntent: SetValueIntent {
    static let title: LocalizedStringResource = "Toggle Health Monitoring"

    @Parameter(title: "Enable Monitoring")
    var value: Bool

    init() {}

    func perform() async throws -> some IntentResult {
        // Toggle health monitoring state
        if value {
            await HealthKitManager.shared.startContinuousMonitoring()
        } else {
            await HealthKitManager.shared.stopContinuousMonitoring()
        }

        return .result()
    }
}
