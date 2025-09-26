import XCTest
import Combine
@testable import VitalSense

final class LiDARSimulationTests: XCTestCase {
    func testSimulatedSessionEmitsPayloads() async throws {
        let manager = LiDARSessionManager.shared
        // Ensure clean state
        await MainActor.run {
            if manager.isRunning { manager.stopSession() }
        }

        let expect = expectation(description: "Receive at least one payload")
        var cancellable: AnyCancellable?

        await MainActor.run {
            cancellable = manager.$lastPayload.sink { payload in
                if payload != nil { expect.fulfill() }
            }
            manager.startGaitSession(duration: 3, simulate: true, protocolTag: "free_walk")
        }

        wait(for: [expect], timeout: 5)

        await MainActor.run {
            manager.stopSession()
            cancellable?.cancel()
        }
    }
}
