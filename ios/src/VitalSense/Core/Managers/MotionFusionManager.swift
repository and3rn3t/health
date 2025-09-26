import Foundation
#if canImport(CoreMotion)
import CoreMotion
#endif

/// Collects IMU (accelerometer & gyro) and barometer (relative altitude) samples during a gait session
/// and produces aggregate stability / elevation change features for fall risk enrichment.
final class MotionFusionManager {
    static let shared = MotionFusionManager()

#if canImport(CoreMotion)
    private let motion = CMMotionManager()
    private let altimeter = CMAltimeter()
#endif

    // Aggregates
    private var accelSamples: [(x: Double,y: Double,z: Double)] = []
    private var gyroSamples: [(x: Double,y: Double,z: Double)] = []
    private var altitudeStart: Double?
    private var altitudeLast: Double?
    private var altitudeMin: Double = .greatestFiniteMagnitude
    private var altitudeMax: Double = -.greatestFiniteMagnitude

    private(set) var isRunning = false

    private init() {}

    func start() {
        guard !isRunning else { return }
        isRunning = true
        reset()
#if canImport(CoreMotion)
        // 50Hz target sampling if available
        motion.accelerometerUpdateInterval = 1.0 / 50.0
        motion.gyroUpdateInterval = 1.0 / 50.0
        if motion.isAccelerometerAvailable {
            motion.startAccelerometerUpdates(to: .main) { [weak self] data, _ in
                guard let d = data?.acceleration else { return }
                self?.accelSamples.append((d.x,d.y,d.z))
            }
        }
        if motion.isGyroAvailable {
            motion.startGyroUpdates(to: .main) { [weak self] data, _ in
                guard let r = data?.rotationRate else { return }
                self?.gyroSamples.append((r.x,r.y,r.z))
            }
        }
        if CMAltimeter.isRelativeAltitudeAvailable() {
            altimeter.startRelativeAltitudeUpdates(to: .main) { [weak self] data, _ in
                guard let rel = data?.relativeAltitude.doubleValue else { return }
                if self?.altitudeStart == nil { self?.altitudeStart = rel }
                self?.altitudeLast = rel
                self?.altitudeMin = min(self?.altitudeMin ?? rel, rel)
                self?.altitudeMax = max(self?.altitudeMax ?? rel, rel)
            }
        }
#endif
    }

    func stop() {
        guard isRunning else { return }
        isRunning = false
#if canImport(CoreMotion)
        motion.stopAccelerometerUpdates()
        motion.stopGyroUpdates()
        altimeter.stopRelativeAltitudeUpdates()
#endif
    }

    private func reset() {
        accelSamples.removeAll(keepingCapacity: true)
        gyroSamples.removeAll(keepingCapacity: true)
        altitudeStart = nil; altitudeLast = nil
        altitudeMin = .greatestFiniteMagnitude
        altitudeMax = -.greatestFiniteMagnitude
    }

    // MARK: - Feature Extraction

    /// Variance magnitude of accelerometer vector.
    var accelVariance: Double? { varianceMagnitude(of: accelSamples) }
    /// Mean absolute rotation rate (deg/s approx) proxy.
    var meanRotation: Double? {
        guard !gyroSamples.isEmpty else { return nil }
        let mean = gyroSamples.reduce(0.0) { $0 + (abs($1.x)+abs($1.y)+abs($1.z))/3.0 } / Double(gyroSamples.count)
        return mean
    }
    /// Net micro elevation change (meters) from min to max.
    var microElevationChange: Double? {
        guard altitudeMin != .greatestFiniteMagnitude, altitudeMax != -.greatestFiniteMagnitude else { return nil }
        return altitudeMax - altitudeMin
    }

    private func varianceMagnitude(of samples: [(x: Double,y: Double,z: Double)]) -> Double? {
        guard samples.count > 1 else { return nil }
        // Compute magnitude per sample, then variance of magnitudes.
        var mags: [Double] = []; mags.reserveCapacity(samples.count)
        for s in samples { mags.append(sqrt(s.x*s.x + s.y*s.y + s.z*s.z)) }
        let mean = mags.reduce(0,+)/Double(mags.count)
        let varSum = mags.reduce(0) { $0 + pow($1 - mean, 2) }
        return varSum / Double(mags.count - 1)
    }

    // Snapshot for meta building.
    func snapshot() -> (accelVar: Double?, meanRot: Double?, elev: Double?) {
        (accelVariance, meanRotation, microElevationChange)
    }

#if DEBUG
    // Test seams
    func _testInjectAccel(x: Double,y: Double,z: Double) { accelSamples.append((x,y,z)) }
    func _testInjectGyro(x: Double,y: Double,z: Double) { gyroSamples.append((x,y,z)) }
    func _testInjectAltitude(_ rel: Double) {
        if altitudeStart == nil { altitudeStart = rel }
        altitudeLast = rel
        altitudeMin = min(altitudeMin, rel)
        altitudeMax = max(altitudeMax, rel)
    }
    func _testClear() { reset() }
#endif
}
