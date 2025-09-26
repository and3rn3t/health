import Foundation

// MARK: - Health Data Model
struct HealthData: Codable {
    let type: String
    let value: Double
    let unit: String
    let timestamp: Date
    let deviceId: String
    let userId: String
}