import XCTest
@testable import VitalSense
import Combine

final class LiveIngestionClientTests: XCTestCase {
    private var cancellables: Set<AnyCancellable> = []

    override func setUp() {
        super.setUp()
        #if DEBUG
        LiveIngestionClient.shared._testClearAllRetries()
        #endif
    }

    func testRetryPersistenceAndRestore() throws {
        #if DEBUG
        let client = LiveIngestionClient.shared
        client._testClearAllRetries()
        let expPersist = expectation(description: "persist events")
        var persistedEvents = 0
        let sub = client.telemetryPublisher.sink { ev in
            if case .retryQueuePersisted(let count) = ev { persistedEvents = count; expPersist.fulfill() }
        }
        sub.store(in: &cancellables)
        client._testInjectRetry(json: ["snapshots": [], "capturedAt": "2025-01-01T00:00:00Z", "reason": "test"], attempt: 1)
        wait(for: [expPersist], timeout: 2)
        XCTAssertEqual(persistedEvents, 1)
        // Force restore
        client._testForceRestore()
        let pending = client._testPendingRetries()
        XCTAssertEqual(pending.count, 1)
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }

    func testRetryDedupLogic() throws {
        #if DEBUG
        let client = LiveIngestionClient.shared
        client._testClearAllRetries()
        let firstPayload = ["snapshots": [["speed": 1.0, "stepFrequency": 80, "capturedAt": "2025-01-01T00:00:00Z"]], "capturedAt": "2025-01-01T00:00:00Z", "reason": "size"] as [String: Any]
        let secondPayloadSame = firstPayload // identical for dedupe
        client._testInjectRetry(json: firstPayload, attempt: 1)
        client._testInjectRetry(json: secondPayloadSame, attempt: 2)
        let pending = client._testPendingRetries()
        XCTAssertEqual(pending.count, 1, "Should dedupe identical payloads")
        XCTAssertEqual(pending.first?.attempt, 2, "Attempt should update to latest")
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }

    func testTelemetryEmitsOnBufferFlushCycle() throws {
        // This test is more of a smoke test for telemetry path; we inject directly since gait provider is external
        #if DEBUG
        let client = LiveIngestionClient.shared
        let exp = expectation(description: "saw telemetry")
        var sawAny = false
        client.telemetryPublisher.sink { _ in
            sawAny = true
            exp.fulfill()
        }.store(in: &cancellables)
        // Inject a retry -> triggers telemetry
        client._testInjectRetry(json: ["snapshots": [], "capturedAt": "2025-01-01T00:00:00Z", "reason": "test2"], attempt: 1)
        wait(for: [exp], timeout: 2)
        XCTAssertTrue(sawAny)
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }

    func testSimulationProbabilityAndEnergyGatingConfig() throws {
        #if DEBUG
        let client = LiveIngestionClient.shared
        let expSim = expectation(description: "sim telemetry")
        var sawSim = false
        client.telemetryPublisher.sink { ev in
            if case .simulationEnabled(let p) = ev, p == 0.5 { sawSim = true; expSim.fulfill() }
        }.store(in: &cancellables)
        client._setSimulationProbability(0.5)
        wait(for: [expSim], timeout: 2)
        XCTAssertTrue(sawSim)
        client._setEnergyGatingEnabled(true)
        let cfg = client._currentConfig()
        XCTAssertTrue(cfg.energyGating)
        XCTAssertEqual(cfg.simulationProbability, 0.5, accuracy: 0.0001)
        #else
        throw XCTSkip("DEBUG-only test")
        #endif
    }
}
