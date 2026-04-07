//
//  HealthKitServiceTests.swift
//  Andernet PostureTests
//
//  Tests for HealthKit service protocol, error types,
//  demographics model, and mock behavior.
//

import Testing
import Foundation
import HealthKit
@testable import Andernet_Posture

// MARK: - HealthKitError Tests

struct HealthKitErrorTests {

    @Test func timeoutErrorDescription() {
        let error = HealthKitError.timeout
        #expect(error.errorDescription == "HealthKit operation timed out")
    }

    @Test func notAvailableErrorDescription() {
        let error = HealthKitError.notAvailable
        #expect(error.errorDescription == "HealthKit is not available on this device")
    }

    @Test func unauthorizedErrorDescription() {
        let error = HealthKitError.unauthorized
        #expect(error.errorDescription == "HealthKit access not authorized")
    }

    @Test func errorsConformToLocalizedError() {
        let errors: [HealthKitError] = [.timeout, .notAvailable, .unauthorized]
        for error in errors {
            #expect(error.errorDescription != nil, "\(error) should have a description")
            #expect(!error.errorDescription!.isEmpty, "\(error) description should not be empty")
        }
    }
}

// MARK: - UserDemographics Tests

struct UserDemographicsTests {

    @Test func maleReturnsTrue() {
        let demo = UserDemographics(age: 30, biologicalSex: .male, heightM: 1.80, bodyMassKg: 80)
        #expect(demo.isMale == true)
    }

    @Test func femaleReturnsFalse() {
        let demo = UserDemographics(age: 25, biologicalSex: .female, heightM: 1.65, bodyMassKg: 55)
        #expect(demo.isMale == false)
    }

    @Test func notSetReturnsNil() {
        let demo = UserDemographics(age: 40, biologicalSex: .notSet, heightM: 1.70, bodyMassKg: 70)
        #expect(demo.isMale == nil)
    }

    @Test func otherReturnsNil() {
        let demo = UserDemographics(age: 50, biologicalSex: .other, heightM: nil, bodyMassKg: nil)
        #expect(demo.isMale == nil)
    }

    @Test func nilSexReturnsNil() {
        let demo = UserDemographics(age: nil, biologicalSex: nil, heightM: nil, bodyMassKg: nil)
        #expect(demo.isMale == nil)
        #expect(demo.age == nil)
        #expect(demo.heightM == nil)
        #expect(demo.bodyMassKg == nil)
    }

    @Test func allFieldsPopulated() {
        let demo = UserDemographics(age: 35, biologicalSex: .male, heightM: 1.75, bodyMassKg: 70)
        #expect(demo.age == 35)
        #expect(demo.biologicalSex == .male)
        #expect(demo.heightM == 1.75)
        #expect(demo.bodyMassKg == 70)
    }
}

// MARK: - MockHealthKitService Tests

struct MockHealthKitServiceTests {

    @Test func mockDefaultIsAvailable() {
        let mock = MockHealthKitService()
        #expect(mock.isAvailable == true)
    }

    @Test func mockCanBeSetUnavailable() {
        let mock = MockHealthKitService()
        mock.isAvailable = false
        #expect(mock.isAvailable == false)
    }

    @Test func requestAuthorizationIncrementsCounter() async throws {
        let mock = MockHealthKitService()
        try await mock.requestAuthorization()
        try await mock.requestAuthorization()
        #expect(mock.requestAuthCallCount == 2)
    }

    @Test func saveSessionIncrementsCounter() async throws {
        let mock = MockHealthKitService()
        let now = Date()
        try await mock.saveSession(
            steps: 100,
            walkingSpeed: 1.2,
            strideLength: 0.75,
            asymmetry: 0.05,
            doubleSupportPercent: 28,
            distance: 100,
            start: now.addingTimeInterval(-300),
            end: now
        )
        #expect(mock.saveSessionCallCount == 1)
    }

    @Test func fetchStepsReturnsDefault() async throws {
        let mock = MockHealthKitService()
        let steps = try await mock.fetchSteps(from: .distantPast, to: .now)
        #expect(steps == 5000)
    }

    @Test func fetchDemographicsReturnsFixture() async throws {
        let mock = MockHealthKitService()
        let demo = try await mock.fetchDemographics()
        #expect(demo.age == 35)
        #expect(demo.heightM == 1.75)
        #expect(demo.bodyMassKg == 70)
    }

    @Test func fetchAverageDailyStepsReturnsDefault() async throws {
        let mock = MockHealthKitService()
        let avg = try await mock.fetchAverageDailySteps(days: 7)
        #expect(avg == 8000)
    }

    @Test func fetchWalkingSpeedReturnsEmpty() async throws {
        let mock = MockHealthKitService()
        let samples = try await mock.fetchWalkingSpeed(from: .distantPast, to: .now)
        #expect(samples.isEmpty)
    }

    @Test func fetchRecentWalkingAsymmetryReturnsEmpty() async throws {
        let mock = MockHealthKitService()
        let samples = try await mock.fetchRecentWalkingAsymmetry(days: 30)
        #expect(samples.isEmpty)
    }

    @Test func fetchRecentDoubleSupportTimeReturnsEmpty() async throws {
        let mock = MockHealthKitService()
        let samples = try await mock.fetchRecentDoubleSupportTime(days: 30)
        #expect(samples.isEmpty)
    }
}

// MARK: - AppConfig HealthKit Tests

struct AppConfigHealthKitTests {

    @Test func saveTimeoutIsPositive() {
        #expect(AppConfig.HealthKit.saveTimeout > 0)
    }

    @Test func fetchTimeoutIsPositive() {
        #expect(AppConfig.HealthKit.fetchTimeout > 0)
    }

    @Test func demographicCacheTTLIsOneHour() {
        #expect(AppConfig.HealthKit.demographicCacheTTL == 3600)
    }

    @Test func saveMaxRetriesIsReasonable() {
        #expect(AppConfig.HealthKit.saveMaxRetries >= 1)
        #expect(AppConfig.HealthKit.saveMaxRetries <= 10)
    }

    @Test func retryDelayBoundsAreValid() {
        #expect(AppConfig.HealthKit.saveRetryBaseDelay > 0)
        #expect(AppConfig.HealthKit.saveRetryMaxDelay > AppConfig.HealthKit.saveRetryBaseDelay)
    }

    @Test func saveTimeoutExceedsFetchTimeout() {
        // Save operations typically need more time than fetches
        #expect(AppConfig.HealthKit.saveTimeout >= AppConfig.HealthKit.fetchTimeout)
    }
}
