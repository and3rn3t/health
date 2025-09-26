import Foundation

/// Fuses LiDAR-derived cadence with Apple Watch cadence (if available and recent).
final class CadenceFusionManager: ObservableObject {
    static let shared = CadenceFusionManager()

    @Published private(set) var lastWatchCadence: Double? = nil
    @Published private(set) var lastFusedCadence: Double? = nil
    @Published private(set) var lastFusionApplied: Bool = false

    private var lastWatchUpdate: Date? = nil
    private var lastFused: Double? = nil
    private var testForceFusion: Bool? = nil

    // Config
    private let watchFreshnessWindow: TimeInterval = 5.0
    private let emaAlpha: Double = 0.35

    private init() {}

    func updateWatchCadence(_ cadence: Double) {
        guard cadence >= 0 else { return }
        lastWatchCadence = cadence
        lastWatchUpdate = Date()
    }

    /// Returns fused cadence (if fusion applied) or LiDAR cadence.
    func fuse(lidarCadence: Double?) -> Double? {
        let fusionEnabled = testForceFusion ?? AppConfig.shared.useWatchCadenceFusion
        guard fusionEnabled else {
            lastFusionApplied = false
            return lidarCadence
        }
        let now = Date()
        let watchValid = (lastWatchUpdate != nil) && (now.timeIntervalSince(lastWatchUpdate!) <= watchFreshnessWindow) && (lastWatchCadence ?? 0) > 0
        guard let lidar = lidarCadence else {
            // No LiDAR cadence, fall back to watch only if valid
            if watchValid { lastFusionApplied = true; lastFusedCadence = lastWatchCadence; return lastWatchCadence }
            lastFusionApplied = false
            return nil
        }
        if !watchValid {
            lastFusionApplied = false
            lastFusedCadence = lidar
            return lidar
        }
        // Weighted blend (favor watch slightly) then EMA smooth
        let blended = 0.6 * (lastWatchCadence ?? lidar) + 0.4 * lidar
        let fused = (lastFused ?? blended) * (1 - emaAlpha) + blended * emaAlpha
        lastFused = fused
        lastFusedCadence = fused
        lastFusionApplied = true
        return fused
    }

    var isWatchCadenceFresh: Bool {
        guard let ts = lastWatchUpdate else { return false }
        return Date().timeIntervalSince(ts) <= watchFreshnessWindow && (lastWatchCadence ?? 0) > 0
    }

#if DEBUG
    func _testEnableFusion(_ enabled: Bool) { testForceFusion = enabled }
    func _testBackdateWatch(seconds: Double) { if let ts = lastWatchUpdate { lastWatchUpdate = ts.addingTimeInterval(-abs(seconds)) } }
#endif
}
