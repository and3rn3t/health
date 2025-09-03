//
//  AppShortcuts.swift
//  VitalSense Monitor
//

import AppIntents
import SwiftUI

// MARK: - App Shortcuts for VitalSense Monitor

@available(iOS 16.0, *)
struct CheckGaitStatusIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Gait Status"
    static var description = IntentDescription("Check your current gait monitoring status and latest metrics")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        // Get current gait status from manager
        let gaitManager = FallRiskGaitManager.shared
        let isMonitoring = gaitManager.isMonitoring
        let currentMetrics = gaitManager.currentGaitMetrics
        
        let statusMessage: String
        if isMonitoring {
            if let metrics = currentMetrics {
                statusMessage = "Monitoring active. Walking speed: \(String(format: "%.2f", metrics.averageWalkingSpeed)) m/s, Fall risk: \(metrics.riskLevel?.displayName ?? "Unknown")"
            } else {
                statusMessage = "Monitoring is active, collecting data..."
            }
        } else {
            statusMessage = "Gait monitoring is currently inactive"
        }
        
        return .result(dialog: IntentDialog(statusMessage))
    }
}

@available(iOS 16.0, *)
struct StartGaitMonitoringIntent: AppIntent {
    static var title: LocalizedStringResource = "Start Gait Monitoring"
    static var description = IntentDescription("Begin continuous gait analysis and fall risk monitoring")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let gaitManager = FallRiskGaitManager.shared
        
        do {
            await gaitManager.startGaitMonitoring()
            return .result(dialog: IntentDialog("Gait monitoring started successfully"))
        } catch {
            return .result(dialog: IntentDialog("Failed to start gait monitoring: \(error.localizedDescription)"))
        }
    }
}

@available(iOS 16.0, *)
struct StopGaitMonitoringIntent: AppIntent {
    static var title: LocalizedStringResource = "Stop Gait Monitoring"
    static var description = IntentDescription("Stop continuous gait analysis monitoring")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let gaitManager = FallRiskGaitManager.shared
        
        await gaitManager.stopGaitMonitoring()
        return .result(dialog: IntentDialog("Gait monitoring stopped"))
    }
}

@available(iOS 16.0, *)
struct AssessFallRiskIntent: AppIntent {
    static var title: LocalizedStringResource = "Assess Fall Risk"
    static var description = IntentDescription("Perform an immediate fall risk assessment based on current gait data")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let gaitManager = FallRiskGaitManager.shared
        
        do {
            let riskScore = await gaitManager.assessFallRisk()
            let riskLevel = riskScore.riskLevel.displayName
            let confidence = String(format: "%.1f", riskScore.confidence * 100)
            
            return .result(dialog: IntentDialog("Fall risk assessment complete. Risk level: \(riskLevel) (confidence: \(confidence)%)"))
        } catch {
            return .result(dialog: IntentDialog("Fall risk assessment failed: \(error.localizedDescription)"))
        }
    }
}

@available(iOS 16.0, *)
struct CheckConnectionStatusIntent: AppIntent {
    static var title: LocalizedStringResource = "Check Connection Status"
    static var description = IntentDescription("Check your VitalSense Monitor connection status")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let webSocketManager = WebSocketManager.shared
        let watchBridge = iPhoneWatchBridge.shared
        
        var statusComponents: [String] = []
        
        // WebSocket status
        if webSocketManager.isConnected {
            statusComponents.append("Server: Connected")
        } else {
            statusComponents.append("Server: Disconnected")
        }
        
        // Apple Watch status
        if watchBridge.isWatchConnected {
            statusComponents.append("Apple Watch: Connected")
        } else {
            statusComponents.append("Apple Watch: Not Connected")
        }
        
        let statusMessage = statusComponents.joined(separator: ", ")
        return .result(dialog: IntentDialog("Connection status - \(statusMessage)"))
    }
}

@available(iOS 16.0, *)
struct GetLatestMetricsIntent: AppIntent {
    static var title: LocalizedStringResource = "Get Latest Metrics"
    static var description = IntentDescription("Retrieve your most recent gait analysis metrics")
    
    func perform() async throws -> some IntentResult & ProvidesDialog {
        let gaitManager = FallRiskGaitManager.shared
        
        guard let metrics = gaitManager.currentGaitMetrics else {
            return .result(dialog: IntentDialog("No recent gait metrics available. Start monitoring to collect data."))
        }
        
        let walkingSpeed = String(format: "%.2f", metrics.averageWalkingSpeed)
        let asymmetry = String(format: "%.1f", metrics.walkingAsymmetry)
        let support = String(format: "%.1f", metrics.doubleSupportTime)
        let status = metrics.mobilityStatus.rawValue.capitalized
        
        let metricsMessage = "Latest metrics: Walking speed \(walkingSpeed) m/s, Asymmetry \(asymmetry)%, Double support \(support)%, Status: \(status)"
        
        return .result(dialog: IntentDialog(metricsMessage))
    }
}

// MARK: - App Shortcuts Provider
@available(iOS 16.0, *)
struct VitalSenseMonitorShortcuts: AppShortcutsProvider {
    static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: CheckGaitStatusIntent(),
            phrases: [
                "Check my gait status with \(.applicationName)",
                "What's my gait status in \(.applicationName)",
                "Show gait monitoring status"
            ],
            shortTitle: "Check Gait Status",
            systemImageName: "figure.walk.circle"
        )
        
        AppShortcut(
            intent: StartGaitMonitoringIntent(),
            phrases: [
                "Start gait monitoring with \(.applicationName)",
                "Begin gait analysis",
                "Start monitoring my walking"
            ],
            shortTitle: "Start Monitoring",
            systemImageName: "play.circle"
        )
        
        AppShortcut(
            intent: StopGaitMonitoringIntent(),
            phrases: [
                "Stop gait monitoring with \(.applicationName)",
                "Stop monitoring my walking",
                "Turn off gait analysis"
            ],
            shortTitle: "Stop Monitoring",
            systemImageName: "stop.circle"
        )
        
        AppShortcut(
            intent: AssessFallRiskIntent(),
            phrases: [
                "Assess my fall risk with \(.applicationName)",
                "Check my fall risk",
                "Analyze my fall risk"
            ],
            shortTitle: "Assess Fall Risk",
            systemImageName: "heart.text.square"
        )
        
        AppShortcut(
            intent: CheckConnectionStatusIntent(),
            phrases: [
                "Check connection status in \(.applicationName)",
                "Are my devices connected",
                "Show connection status"
            ],
            shortTitle: "Check Connections",
            systemImageName: "network"
        )
        
        AppShortcut(
            intent: GetLatestMetricsIntent(),
            phrases: [
                "Get my latest metrics from \(.applicationName)",
                "Show my recent gait data",
                "What are my current metrics"
            ],
            shortTitle: "Latest Metrics",
            systemImageName: "chart.line.uptrend.xyaxis"
        )
    }
}

// MARK: - Siri Integration
@available(iOS 16.0, *)
extension CheckGaitStatusIntent {
    static var openAppWhenRun: Bool = false
}

@available(iOS 16.0, *)
extension StartGaitMonitoringIntent {
    static var openAppWhenRun: Bool = false
}

@available(iOS 16.0, *)
extension StopGaitMonitoringIntent {
    static var openAppWhenRun: Bool = false
}

@available(iOS 16.0, *)
extension AssessFallRiskIntent {
    static var openAppWhenRun: Bool = true // Open app for visual feedback
}

@available(iOS 16.0, *)
extension CheckConnectionStatusIntent {
    static var openAppWhenRun: Bool = false
}

@available(iOS 16.0, *)
extension GetLatestMetricsIntent {
    static var openAppWhenRun: Bool = true // Open app to show detailed metrics
}

#Preview {
    Text("VitalSense Monitor App Shortcuts")
        .font(.title)
        .padding()
}
