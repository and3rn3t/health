import Foundation
import UIKit

// MARK: - Battery Optimization Manager
// Manages power consumption and adjusts monitoring frequency based on battery level

class BatteryOptimizationManager: ObservableObject {
    static let shared = BatteryOptimizationManager()
    
    @Published var batteryLevel: Float = 1.0
    @Published var batteryState: UIDevice.BatteryState = .unknown
    @Published var isLowPowerModeEnabled: Bool = false
    @Published var optimizedSyncInterval: TimeInterval = 5.0
    
    private let normalSyncInterval: TimeInterval = 5.0
    private let batterySavingSyncInterval: TimeInterval = 15.0
    private let lowPowerSyncInterval: TimeInterval = 30.0
    
    private init() {
        UIDevice.current.isBatteryMonitoringEnabled = true
        updateBatteryInfo()
        setupBatteryNotifications()
    }
    
    private func setupBatteryNotifications() {
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(batteryLevelChanged),
            name: UIDevice.batteryLevelDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(batteryStateChanged),
            name: UIDevice.batteryStateDidChangeNotification,
            object: nil
        )
        
        NotificationCenter.default.addObserver(
            self,
            selector: #selector(powerModeChanged),
            name: .NSProcessInfoPowerStateDidChange,
            object: nil
        )
    }
    
    @objc private func batteryLevelChanged() {
        updateBatteryInfo()
    }
    
    @objc private func batteryStateChanged() {
        updateBatteryInfo()
    }
    
    @objc private func powerModeChanged() {
        updateBatteryInfo()
    }
    
    private func updateBatteryInfo() {
        DispatchQueue.main.async {
            self.batteryLevel = UIDevice.current.batteryLevel
            self.batteryState = UIDevice.current.batteryState
            self.isLowPowerModeEnabled = ProcessInfo.processInfo.isLowPowerModeEnabled
            self.calculateOptimalSyncInterval()
        }
    }
    
    private func calculateOptimalSyncInterval() {
        if isLowPowerModeEnabled {
            optimizedSyncInterval = lowPowerSyncInterval
        } else if batteryLevel < 0.2 { // Below 20%
            optimizedSyncInterval = batterySavingSyncInterval
        } else if batteryLevel < 0.1 { // Below 10%
            optimizedSyncInterval = lowPowerSyncInterval
        } else {
            optimizedSyncInterval = normalSyncInterval
        }
        
        print("🔋 Battery: \(Int(batteryLevel * 100))%, LPM: \(isLowPowerModeEnabled), Sync: \(optimizedSyncInterval)s")
    }
    
    func shouldReduceMonitoring() -> Bool {
        return isLowPowerModeEnabled || batteryLevel < 0.15
    }
    
    func getOptimalUpdateFrequency() -> TimeInterval {
        return optimizedSyncInterval
    }
    
    func getBatteryStatusSummary() -> String {
        let percentage = Int(batteryLevel * 100)
        let state = batteryState == .charging ? " (Charging)" : 
                   batteryState == .full ? " (Full)" : ""
        let lpMode = isLowPowerModeEnabled ? " - Low Power Mode" : ""
        
        return "\(percentage)%\(state)\(lpMode)"
    }
}