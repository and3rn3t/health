import Foundation

// Shared user profile used by gait, fall-risk, and settings features where possible.

public struct UserProfile: Codable, Identifiable {
    public let id: UUID
    public var age: Int?
    public var height: Double?
    public var weight: Double?
    public var medicalConditions: [String]

    public init(
        id: UUID = UUID(),
        age: Int? = nil,
        height: Double? = nil,
        weight: Double? = nil,
        medicalConditions: [String] = []
    ) {
        self.id = id
        self.age = age
        self.height = height
        self.weight = weight
        self.medicalConditions = medicalConditions
    }
}

// NOTE: Feature modules should reference this UserProfile type. Any local
// `struct UserProfile` definitions in feature files (e.g. RealTimeGaitMonitor
// or EnhancedInterventionEngine) should be removed or renamed to avoid
// ambiguous type lookup errors.
