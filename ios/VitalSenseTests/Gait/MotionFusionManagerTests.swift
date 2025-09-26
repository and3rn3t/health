import XCTest
@testable import VitalSense

final class MotionFusionManagerTests: XCTestCase {

    override func tearDown() {
        #if DEBUG
        MotionFusionManager.shared._testClear()
        if LiDARSessionManager.shared.isRunning { LiDARSessionManager.shared.stopSession() }
        #endif
        super.tearDown()
    }

    func testAccelVarianceRequiresAtLeastTwoSamples() {
        #if DEBUG
        let mgr = MotionFusionManager.shared
        mgr._testClear()
        mgr._testInjectAccel(x: 0.01, y: 0.02, z: 0.98)
        XCTAssertNil(mgr.accelVariance, "Variance needs >=2 samples")
        mgr._testInjectAccel(x: 0.02, y: 0.01, z: 1.05)
        let var2 = mgr.accelVariance
        XCTAssertNotNil(var2)
        XCTAssertGreaterThan(var2 ?? 0, 0)
        #else
        throw XCTSkip("DEBUG-only seams")
        #endif
    }

    func testMeanRotationComputed() {
        #if DEBUG
        let mgr = MotionFusionManager.shared
        mgr._testClear()
        mgr._testInjectGyro(x: 0.2, y: -0.1, z: 0.05)
        mgr._testInjectGyro(x: 0.4, y: 0.1, z: -0.05)
        let mean = mgr.meanRotation
        XCTAssertNotNil(mean)
        XCTAssertGreaterThan(mean ?? 0, 0)
        #else
        throw XCTSkip("DEBUG-only seams")
        #endif
    }

    func testMicroElevationChange() {
        #if DEBUG
        let mgr = MotionFusionManager.shared
        mgr._testClear()
        mgr._testInjectAltitude(0.00)
        mgr._testInjectAltitude(0.05)
        mgr._testInjectAltitude(-0.01)
        mgr._testInjectAltitude(0.08)
        let elev = mgr.microElevationChange
        XCTAssertNotNil(elev)
        XCTAssertEqual(elev ?? 0, 0.09, accuracy: 0.0001) // max 0.08 - min -0.01 = 0.09
        #else
        throw XCTSkip("DEBUG-only seams")
        #endif
    }

    func testMotionFusionMetaEmission() {
        #if DEBUG
        let lidar = LiDARSessionManager.shared
        // Start simulated session to ensure motion manager start invoked
        lidar.startGaitSession(duration: 2, simulate: true, protocolTag: "fusion_meta")
        // Inject motion samples
        let motion = MotionFusionManager.shared
        motion._testInjectAccel(x: 0.0, y: 0.0, z: 1.0)
        motion._testInjectAccel(x: 0.1, y: 0.1, z: 0.9)
        motion._testInjectGyro(x: 0.2, y: 0.1, z: 0.05)
        motion._testInjectGyro(x: 0.3, y: 0.2, z: 0.06)
        motion._testInjectAltitude(0.0)
        motion._testInjectAltitude(0.04)
        let meta = lidar._testQualityMeta() ?? [:]
        XCTAssertNotNil(meta["accel_var"], "Expected accel_var in meta")
        XCTAssertNotNil(meta["mean_rot_rate"], "Expected mean_rot_rate in meta")
        XCTAssertNotNil(meta["micro_elev_m"], "Expected micro_elev_m in meta")
        lidar.stopSession()
        #else
        throw XCTSkip("DEBUG-only seams")
        #endif
    }
}
