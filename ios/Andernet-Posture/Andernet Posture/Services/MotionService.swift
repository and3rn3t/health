//
//  MotionService.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import CoreMotion
import os.log

/// Protocol for CoreMotion device motion data.
protocol MotionService: AnyObject {
    var isAvailable: Bool { get }
    var onMotionUpdate: ((MotionFrame) -> Void)? { get set }
    func start()
    func stop()
}

// MARK: - CoreMotion Implementation

final class CoreMotionService: MotionService {

    private let motionManager = CMMotionManager()
    private let updateInterval: TimeInterval = 1.0 / 60.0  // 60 Hz

    var isAvailable: Bool {
        motionManager.isDeviceMotionAvailable
    }

    var onMotionUpdate: ((MotionFrame) -> Void)?

    func start() {
        guard motionManager.isDeviceMotionAvailable else {
            AppLogger.motion.warning("Device motion not available")
            return
        }
        AppLogger.motion.info("CoreMotion started at \(self.updateInterval)s interval")

        motionManager.deviceMotionUpdateInterval = updateInterval
        motionManager.startDeviceMotionUpdates(
            using: .xArbitraryZVertical,
            to: .main
        ) { [weak self] motion, _ in
            guard let motion else { return }
            let frame = MotionFrame(from: motion)
            self?.onMotionUpdate?(frame)
        }
    }

    func stop() {
        motionManager.stopDeviceMotionUpdates()
        AppLogger.motion.info("CoreMotion stopped")
    }
}
