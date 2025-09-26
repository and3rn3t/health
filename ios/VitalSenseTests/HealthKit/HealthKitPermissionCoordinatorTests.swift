import XCTest
@testable import VitalSense
import HealthKit

final class HealthKitPermissionCoordinatorTests: XCTestCase {
    func testMissingTypesSummaryDoesNotCrash() async {
        let mock = MockHealthStore()
        let coordinator = HealthKitPermissionCoordinator(healthStore: mock, initialStage: .initial)
        let summary = coordinator.missingTypesSummary()
        XCTAssertNotNil(summary)
    }

    func testAdvanceNotificationPosted() async throws {
        let mock = MockHealthStore()
        let coordinator = HealthKitPermissionCoordinator(healthStore: mock, initialStage: .initial)
        let expectation = expectation(description: "Notification posted")
        var token: NSObjectProtocol?
        token = NotificationCenter.default.addObserver(forName: .permissionsStageAdvanced, object: nil, queue: .main) { _ in
            expectation.fulfill()
        }
        defer { if let token { NotificationCenter.default.removeObserver(token) } }
        await coordinator.advance()
        await fulfillment(of: [expectation], timeout: 0.5)
    }

    func testAdvanceProgressesThroughStagesWithMock() async {
        let mock = MockHealthStore()
        let coordinator = HealthKitPermissionCoordinator(healthStore: mock, initialStage: .initial)
        XCTAssertEqual(coordinator.stage, .initial)
        await coordinator.advance() // -> movementCore
        XCTAssertEqual(coordinator.stage, .movementCore)
        await coordinator.advance() // -> fallRisk
        XCTAssertEqual(coordinator.stage, .fallRisk)
        await coordinator.advance() // -> cardioRecovery
        XCTAssertEqual(coordinator.stage, .cardioRecovery)
        await coordinator.advance() // -> finished
        XCTAssertEqual(coordinator.stage, .finished)
        XCTAssertTrue(coordinator.completed)
    }

    func testAdvanceHandlesErrorAndDoesNotChangeStage() async {
        let mock = MockHealthStore()
        let coordinator = HealthKitPermissionCoordinator(healthStore: mock, initialStage: .initial)
        mock.nextError = MockHealthStore.MockError(message: "boom")
        let originalStage = coordinator.stage
        await coordinator.advance()
        XCTAssertEqual(coordinator.stage, originalStage)
        XCTAssertNotNil(coordinator.lastError)
    }

    func testPartialAuthorizationReflectedInMissingSummary() async {
        // Customize mock to authorize only the first requested type group subset.
        class PartialMock: MockHealthStore {
            override func requestAuthorization(toShare typesToShare: Set<HKSampleType>, read typesToRead: Set<HKObjectType>) async throws {
                // Authorize only first item deterministically
                if let first = typesToRead.sorted(by: { $0.identifier < $1.identifier }).first {
                    authorized.insert(first)
                }
                requested.append(typesToRead)
            }
        }
        let mock = PartialMock()
        let coordinator = HealthKitPermissionCoordinator(healthStore: mock, progressStore: InMemoryPermissionProgressStore(), initialStage: .initial)
        await coordinator.advance()
        let missing = coordinator.missingTypesSummary()
        // We expect at least one missing because we only granted one.
        XCTAssertFalse(missing.isEmpty)
    }

    func testResumeFromPersistedProgress() {
        let progressStore = InMemoryPermissionProgressStore()
        // Simulate having completed up to fallRisk.
        progressStore.saveCompletedStages([.initial, .movementCore, .fallRisk])
        let mock = MockHealthStore()
        let coordinator = HealthKitPermissionCoordinator(healthStore: mock, progressStore: progressStore)
        // Expect stage restored to last completed (fallRisk)
        XCTAssertEqual(coordinator.stage, .fallRisk)
        XCTAssertFalse(coordinator.completed)
    }

    func testBackoffComputationDeterministic() {
        let d1 = WebSocketManager.computeBackoffDelayForTest(attempt: 1, jitter: 0)
        let d2 = WebSocketManager.computeBackoffDelayForTest(attempt: 2, jitter: 0)
        let d3 = WebSocketManager.computeBackoffDelayForTest(attempt: 3, jitter: 0)
        XCTAssertTrue(d1 > 0)
        XCTAssertTrue(d2 > d1)
        XCTAssertTrue(d3 > d2)
    }

    func testRationaleStageSkipsAuthorization() async {
        let mock = MockHealthStore()
        let coordinator = HealthKitPermissionCoordinator(healthStore: mock, initialStage: .rationale)
        XCTAssertEqual(coordinator.stage, .rationale)
        // Advance should not trigger HK authorization (mock.requested stays empty)
        await coordinator.advance()
        XCTAssertTrue(mock.requested.isEmpty, "Rationale stage should not request HealthKit types")
        // Now at initial stage
        XCTAssertEqual(coordinator.stage, .initial)
    }
}
