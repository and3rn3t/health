//
//  SessionRecorder.swift
//  Andernet Posture
//
//  Created by Matt on 2/8/26.
//

import Foundation
import os
import simd

/// Recording state machine states.
enum RecordingState: Sendable, Equatable {
    case idle
    case calibrating
    case recording
    case paused
    case finished
}

/// Protocol for session recording — collects time-series frames + step events.
protocol SessionRecorder {
    var state: RecordingState { get }
    var elapsedTime: TimeInterval { get }
    var frameCount: Int { get }
    var stepCount: Int { get }

    func startCalibration()
    func startRecording()
    func pause()
    func resume()
    func stop()
    func reset()

    /// Record a body frame with joint positions + computed metrics.
    func recordFrame(_ frame: BodyFrame)

    /// Record a detected step event.
    func recordStep(_ step: StepEvent)

    /// Record a CoreMotion frame.
    func recordMotionFrame(_ frame: MotionFrame)

    /// Retrieve collected frames.
    func collectedFrames() -> [BodyFrame]

    /// Retrieve collected step events.
    func collectedSteps() -> [StepEvent]

    /// Retrieve collected motion frames.
    func collectedMotionFrames() -> [MotionFrame]
}

// MARK: - Default Implementation

/// @unchecked Sendable: All mutable state is serialized through `recordingQueue`.
final class DefaultSessionRecorder: SessionRecorder, @unchecked Sendable {

    /// Backing storage for state — always access via `state` computed property.
    /// nonisolated(unsafe): protected by recordingQueue; manual synchronization.
    nonisolated(unsafe) private var stateBacking: RecordingState = .idle

    /// Lightweight lock for cached counters — avoids DispatchQueue.sync overhead on hot-path reads.
    private let counterLock = OSAllocatedUnfairLock(initialState: (state: RecordingState.idle, frames: 0, steps: 0))

    var state: RecordingState {
        counterLock.withLock { $0.state }
    }

    /// Serial queue for thread-safe access to recorded data arrays and state.
    private let recordingQueue = DispatchQueue(label: "com.andernet.posture.recording", qos: .userInitiated)

    /// Maximum frame capacity before decimation kicks in (~10 minutes at 60 fps).
    private let maxFrameCapacity = 36_000

    /// nonisolated(unsafe): protected by recordingQueue; manual synchronization.
    nonisolated(unsafe) private var startDate: Date?
    nonisolated(unsafe) private var pauseDate: Date?
    nonisolated(unsafe) private var accumulatedPause: TimeInterval = 0

    nonisolated(unsafe) private var frames: [BodyFrame] = []
    nonisolated(unsafe) private var steps: [StepEvent] = []
    nonisolated(unsafe) private var motionFrames: [MotionFrame] = []

    var elapsedTime: TimeInterval {
        let currentState = state
        guard let start = startDate else { return 0 }
        switch currentState {
        case .recording:
            return Date().timeIntervalSince(start) - accumulatedPause
        case .paused:
            let pauseStart = pauseDate ?? Date()
            return pauseStart.timeIntervalSince(start) - accumulatedPause
        case .finished:
            return (pauseDate ?? Date()).timeIntervalSince(start) - accumulatedPause
        default:
            return 0
        }
    }

    var frameCount: Int { counterLock.withLock { $0.frames } }
    var stepCount: Int { counterLock.withLock { $0.steps } }

    // MARK: State transitions

    func startCalibration() {
        recordingQueue.sync {
            guard stateBacking == .idle else { return }
            stateBacking = .calibrating
            counterLock.withLock { $0.state = .calibrating }
        }
        AppLogger.recorder.info("Calibration started")
    }

    func startRecording() {
        recordingQueue.sync {
            guard stateBacking == .calibrating || stateBacking == .idle else { return }
            stateBacking = .recording
            counterLock.withLock { $0.state = .recording }
            startDate = Date()
            accumulatedPause = 0
            // Pre-allocate arrays to reduce heap churn during recording.
            frames.reserveCapacity(3600)         // ~1 min at 60 fps
            steps.reserveCapacity(200)
            motionFrames.reserveCapacity(3600)   // ~1 min at 60 fps
        }
    }

    func pause() {
        recordingQueue.sync {
            guard stateBacking == .recording else { return }
            stateBacking = .paused
            counterLock.withLock { $0.state = .paused }
            pauseDate = Date()
        }
    }

    func resume() {
        recordingQueue.sync {
            guard stateBacking == .paused, let pd = pauseDate else { return }
            accumulatedPause += Date().timeIntervalSince(pd)
            pauseDate = nil
            stateBacking = .recording
            counterLock.withLock { $0.state = .recording }
        }
    }

    func stop() {
        recordingQueue.sync {
            guard stateBacking == .recording || stateBacking == .paused else { return }
            if stateBacking == .recording {
                pauseDate = Date()
            }
            stateBacking = .finished
            counterLock.withLock { $0.state = .finished }
            AppLogger.recorder.info("Recording stopped — \(self.frames.count) frames, \(self.steps.count) steps")
        }
    }

    func reset() {
        recordingQueue.sync {
            stateBacking = .idle
            startDate = nil
            pauseDate = nil
            accumulatedPause = 0
            frames.removeAll()
            steps.removeAll()
            motionFrames.removeAll()
            counterLock.withLock { $0 = (.idle, 0, 0) }
        }
        AppLogger.recorder.debug("Recorder reset")
    }

    // MARK: Data collection

    func recordFrame(_ frame: BodyFrame) {
        recordingQueue.async { [self] in
            guard stateBacking == .recording else { return }
            // Decimation strategy: when the buffer hits maxFrameCapacity, keep
            // every other frame from the first half (effectively halving temporal
            // resolution for older data) then continue appending new frames.
            // This gives a ring-buffer-like behaviour that bounds memory usage
            // while preserving the most recent data at full resolution.
            if frames.count >= maxFrameCapacity {
                let half = frames.count / 2
                var decimated: [BodyFrame] = []
                decimated.reserveCapacity(half / 2 + (frames.count - half))
                for i in stride(from: 0, to: half, by: 2) {
                    decimated.append(frames[i])
                }
                decimated.append(contentsOf: frames[half...])
                frames = decimated
            }
            frames.append(frame)
            counterLock.withLock { $0.frames = frames.count }
        }
    }

    func recordStep(_ step: StepEvent) {
        recordingQueue.async { [self] in
            guard stateBacking == .recording else { return }
            steps.append(step)
            counterLock.withLock { $0.steps = steps.count }
        }
    }

    func recordMotionFrame(_ frame: MotionFrame) {
        recordingQueue.async { [self] in
            guard stateBacking == .recording else { return }
            motionFrames.append(frame)
        }
    }

    func collectedFrames() -> [BodyFrame] { recordingQueue.sync { frames } }
    func collectedSteps() -> [StepEvent] { recordingQueue.sync { steps } }
    func collectedMotionFrames() -> [MotionFrame] { recordingQueue.sync { motionFrames } }
}
