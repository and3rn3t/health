import Foundation
import SwiftData
import os

@Model
final class GaitSession {
    // CloudKit requires property-level defaults for all non-optional stored properties.
    var date: Date = Date.now
    var duration: TimeInterval = 0
    var averageCadenceSPM: Double?
    var averageStrideLengthM: Double?
    var averageTrunkLeanDeg: Double?

    // Extended posture metrics
    var postureScore: Double?
    var peakTrunkLeanDeg: Double?
    var averageLateralLeanDeg: Double?
    var totalSteps: Int?

    // Clinical posture metrics
    var averageCVADeg: Double?
    var averageSVACm: Double?
    var averageThoracicKyphosisDeg: Double?
    var averageLumbarLordosisDeg: Double?
    var averageShoulderAsymmetryCm: Double?
    var averagePelvicObliquityDeg: Double?
    var averageCoronalDeviationCm: Double?
    var kendallPosturalType: String?
    var nyprScore: Int?

    // Clinical gait metrics
    var averageWalkingSpeedMPS: Double?
    var averageStepWidthCm: Double?
    var gaitAsymmetryPercent: Double?          // Robinson SI
    var averageStanceTimePercent: Double?
    var averageSwingTimePercent: Double?
    var averageDoubleSupportPercent: Double?
    var strideTimeVariabilityCV: Double?

    // Joint ROM averages
    var averageHipROMDeg: Double?
    var averageKneeROMDeg: Double?
    var trunkRotationRangeDeg: Double?
    var armSwingAsymmetryPercent: Double?

    // Balance / Sway
    var averageSwayVelocityMMS: Double?
    var swayAreaCm2: Double?

    // Fall risk
    var fallRiskScore: Double?
    var fallRiskLevel: String?                 // FallRiskLevel raw value

    // Clinical pattern detection
    var upperCrossedScore: Double?
    var lowerCrossedScore: Double?
    var gaitPatternClassification: String?     // GaitPatternType raw value

    // Fatigue
    var fatigueIndex: Double?
    var postureVariabilitySD: Double?
    var postureFatigueTrend: Double?           // regression slope

    // Ergonomic
    var rebaScore: Int?

    // Smoothness
    var sparcScore: Double?
    var harmonicRatio: Double?

    // Frailty
    var frailtyScore: Int?                     // Fried: 0=robust, 1-2=pre-frail, 3+=frail

    // Cardiovascular / Clinical tests
    var sixMinuteWalkDistanceM: Double?
    var tugTimeSec: Double?
    var rombergRatio: Double?
    var walkRatio: Double?
    var estimatedMET: Double?

    // Distance tracking (sensor-derived)
    var totalDistanceM: Double?
    var pedometerDistanceM: Double?
    var pedometerStepCount: Int?
    var floorsAscended: Int?
    var floorsDescended: Int?

    // IMU-derived metrics
    var imuCadenceSPM: Double?
    var imuStepCount: Int?
    var imuSwayRmsML: Double?
    var imuSwayRmsAP: Double?
    var imuSwayJerkRMS: Double?
    var dominantSwayFrequencyHz: Double?

    // Trunk motion (gyroscope-derived)
    var trunkPeakRotationVelocityDPS: Double?
    var trunkAvgRotationRangeDeg: Double?
    var turnCount: Int?
    var trunkRotationAsymmetryPercent: Double?
    var trunkLateralFlexionAvgDeg: Double?
    var movementRegularityIndex: Double?

    // 6MWT-specific data (JSON-encoded)
    @Attribute(.externalStorage) var sixMWTResultData: Data?

    // Pain risk alerts (JSON-encoded)
    @Attribute(.externalStorage) var painRiskAlertsData: Data?

    // Full time-series data (JSON-encoded for SwiftData efficiency)
    @Attribute(.externalStorage) var framesData: Data?
    @Attribute(.externalStorage) var stepEventsData: Data?
    @Attribute(.externalStorage) var motionFramesData: Data?

    init(date: Date = .now,
         duration: TimeInterval = 0,
         averageCadenceSPM: Double? = nil,
         averageStrideLengthM: Double? = nil,
         averageTrunkLeanDeg: Double? = nil,
         postureScore: Double? = nil,
         peakTrunkLeanDeg: Double? = nil,
         averageLateralLeanDeg: Double? = nil,
         totalSteps: Int? = nil,
         framesData: Data? = nil,
         stepEventsData: Data? = nil,
         motionFramesData: Data? = nil) {
        self.date = date
        self.duration = duration
        self.averageCadenceSPM = averageCadenceSPM
        self.averageStrideLengthM = averageStrideLengthM
        self.averageTrunkLeanDeg = averageTrunkLeanDeg
        self.postureScore = postureScore
        self.peakTrunkLeanDeg = peakTrunkLeanDeg
        self.averageLateralLeanDeg = averageLateralLeanDeg
        self.totalSteps = totalSteps
        self.framesData = framesData
        self.stepEventsData = stepEventsData
        self.motionFramesData = motionFramesData
    }

    // MARK: - Transient Caches

    /// Cached decoded frames — not persisted by SwiftData.
    @Transient private var _cachedFrames: [BodyFrame]?
    @Transient private var _cachedSteps: [StepEvent]?
    @Transient private var _cachedMotion: [MotionFrame]?

    // MARK: - Computed Properties

    /// Lazily decode body frames from stored JSON (cached after first access).
    var decodedFrames: [BodyFrame] {
        if let cached = _cachedFrames { return cached }
        guard let data = framesData else { return [] }
        do {
            let decoded = try JSONDecoder().decode([BodyFrame].self, from: data)
            _cachedFrames = decoded
            return decoded
        } catch {
            AppLogger.persistence.error("Failed to decode BodyFrames (\(data.count) bytes): \(error.localizedDescription)")
            return []
        }
    }

    /// Lazily decode step events from stored JSON (cached after first access).
    var decodedStepEvents: [StepEvent] {
        if let cached = _cachedSteps { return cached }
        guard let data = stepEventsData else { return [] }
        do {
            let decoded = try JSONDecoder().decode([StepEvent].self, from: data)
            _cachedSteps = decoded
            return decoded
        } catch {
            AppLogger.persistence.error("Failed to decode StepEvents (\(data.count) bytes): \(error.localizedDescription)")
            return []
        }
    }

    /// Lazily decode motion frames from stored JSON (cached after first access).
    var decodedMotionFrames: [MotionFrame] {
        if let cached = _cachedMotion { return cached }
        guard let data = motionFramesData else { return [] }
        do {
            let decoded = try JSONDecoder().decode([MotionFrame].self, from: data)
            _cachedMotion = decoded
            return decoded
        } catch {
            AppLogger.persistence.error("Failed to decode MotionFrames (\(data.count) bytes): \(error.localizedDescription)")
            return []
        }
    }

    /// Encode any Encodable array to JSON data, logging failures.
    static func encode<T: Encodable>(_ items: [T]) -> Data? {
        do {
            return try JSONEncoder().encode(items)
        } catch {
            AppLogger.persistence.error("Failed to encode \(items.count) \(T.self) items: \(error.localizedDescription)")
            return nil
        }
    }

    /// Human-readable duration string.
    var formattedDuration: String {
        let minutes = Int(duration) / 60
        let seconds = Int(duration) % 60
        return String(format: "%d:%02d", minutes, seconds)
    }

    /// Posture score label.
    var postureLabel: String {
        guard let score = postureScore else { return String(localized: "N/A") }
        switch score {
        case 80...100: return String(localized: "Excellent")
        case 60..<80:  return String(localized: "Good")
        case 40..<60:  return String(localized: "Fair")
        default:       return String(localized: "Needs Improvement")
        }
    }
}
