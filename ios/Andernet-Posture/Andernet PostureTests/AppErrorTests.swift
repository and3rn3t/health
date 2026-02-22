//
//  AppErrorTests.swift
//  Andernet PostureTests
//
//  Tests for AppError unified error domain.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - AppErrorTests

@Suite("AppError")
struct AppErrorTests {

    // MARK: - Error Descriptions

    @Test func allCasesHaveNonEmptyDescription() {
        let errors: [AppError] = [
            .sessionSaveFailed(underlying: "db write"),
            .sessionLoadFailed(underlying: "db read"),
            .dataMigrationFailed(underlying: "v1→v2"),
            .dataCorrupted(detail: "bad json"),
            .cloudSyncFailed(underlying: "timeout"),
            .iCloudAccountUnavailable,
            .iCloudQuotaExceeded,
            .arSessionFailed(underlying: "no camera"),
            .bodyTrackingUnavailable,
            .motionSensorUnavailable,
            .cameraPermissionDenied,
            .pedometerUnavailable,
            .healthKitAuthorizationDenied,
            .healthKitWriteFailed(underlying: "hk error"),
            .mlModelLoadFailed(model: "posture", underlying: "missing"),
            .mlPredictionFailed(model: "gait", underlying: "shape"),
            .exportFailed(format: "PDF", underlying: "disk full"),
            .unknown(underlying: "whoops"),
        ]

        for error in errors {
            let desc = error.errorDescription
            #expect(desc != nil, "Missing errorDescription for \(error)")
            #expect(!desc!.isEmpty, "Empty errorDescription for \(error)")
        }
    }

    // MARK: - Identifiable

    @Test func idUsesLocalizedDescription() {
        let error = AppError.sessionSaveFailed(underlying: "test")
        #expect(!error.id.isEmpty)
        #expect(error.id == error.localizedDescription)
    }

    // MARK: - Recovery Suggestions

    @Test func retryableErrorsHaveRecoverySuggestion() {
        let retryable: [AppError] = [
            .sessionSaveFailed(underlying: "test"),
            .cloudSyncFailed(underlying: "test"),
            .arSessionFailed(underlying: "test"),
            .healthKitWriteFailed(underlying: "test"),
            .exportFailed(format: "CSV", underlying: "test"),
        ]

        for error in retryable {
            #expect(error.isRetryable, "\(error) should be retryable")
            #expect(error.recoverySuggestion != nil, "\(error) should have recovery suggestion")
        }
    }

    @Test func nonRetryableErrorsAreNotRetryable() {
        let nonRetryable: [AppError] = [
            .bodyTrackingUnavailable,
            .cameraPermissionDenied,
            .iCloudAccountUnavailable,
            .healthKitAuthorizationDenied,
            .unknown(underlying: "test"),
        ]

        for error in nonRetryable {
            #expect(!error.isRetryable, "\(error) should not be retryable")
        }
    }

    // MARK: - Technical Detail

    @Test func technicalDetailReturnsUnderlyingMessage() {
        let error = AppError.sessionSaveFailed(underlying: "SQLITE_BUSY")
        #expect(error.technicalDetail == "SQLITE_BUSY")
    }

    @Test func mlErrorTechnicalDetailReturnsUnderlyingNotModelName() {
        let error = AppError.mlModelLoadFailed(model: "PostureModel", underlying: "file not found")
        #expect(error.technicalDetail == "file not found")
    }

    @Test func exportErrorDescriptionIncludesFormat() {
        let error = AppError.exportFailed(format: "PDF", underlying: "no space")
        let desc = error.errorDescription ?? ""
        #expect(desc.contains("PDF"))
    }

    @Test func mlErrorDescriptionIncludesModelName() {
        let error = AppError.mlModelLoadFailed(model: "PostureModel", underlying: "missing")
        let desc = error.errorDescription ?? ""
        #expect(desc.contains("PostureModel"))
    }
}
