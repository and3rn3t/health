//
//  CloudSyncServiceTests.swift
//  Andernet PostureTests
//
//  Tests for CloudSyncService protocol behavior via MockCloudSyncService.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - CloudSyncServiceTests

@Suite("CloudSyncService")
struct CloudSyncServiceTests {

    @Test @MainActor func initialStatusIsIdle() {
        let service = MockCloudSyncService()
        #expect(service.status.label == "Waiting")
        #expect(service.lastSyncDate == nil)
    }

    @Test @MainActor func resetSyncStateIncrementsCounter() {
        let service = MockCloudSyncService()
        service.resetSyncState()
        service.resetSyncState()
        #expect(service.resetCallCount == 2)
    }

    @Test @MainActor func checkAccountStatusReturnsStubbed() async {
        let service = MockCloudSyncService()
        service.stubbedAccountAvailable = true

        let available = await service.checkAccountStatus()
        #expect(available == true)
        #expect(service.checkAccountCallCount == 1)
    }

    @Test @MainActor func checkAccountUnavailable() async {
        let service = MockCloudSyncService()
        service.stubbedAccountAvailable = false

        let available = await service.checkAccountStatus()
        #expect(available == false)
    }

    @Test @MainActor func syncStatusLabelsAreCorrect() {
        #expect(SyncStatus.idle.label == "Waiting")
        #expect(SyncStatus.syncing.label == "Syncing…")
        #expect(SyncStatus.disabled.label == "Off")
    }

    @Test @MainActor func syncStatusSucceededIncludesDate() {
        let date = Date.now
        let status = SyncStatus.succeeded(date)
        #expect(status.label == "Up to date")
    }

    @Test @MainActor func syncStatusFailedIncludesMessage() {
        let status = SyncStatus.failed("Network timeout")
        #expect(status.label == "Network timeout")
    }

    @Test @MainActor func syncStatusSystemImages() {
        #expect(SyncStatus.idle.systemImage == "clock")
        #expect(SyncStatus.syncing.systemImage == "arrow.triangle.2.circlepath")
        #expect(SyncStatus.disabled.systemImage == "icloud.slash")
    }
}
