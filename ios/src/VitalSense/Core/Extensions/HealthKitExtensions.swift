import Foundation
import HealthKit

// MARK: - Permission Notifications
extension Notification.Name {
    static let permissionsStageAdvanced = Notification.Name("vitalsense.permissions.stage.advanced")
}

// MARK: - Health Data Extensions
// Note: HealthKitManager extensions are temporarily disabled to fix build issues
// These extensions should be moved to the same file as the HealthKitManager class
// or properly imported if the class is in a different module
