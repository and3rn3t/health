//
//  MLModelServiceTests.swift
//  Andernet PostureTests
//
//  Tests for MLModelService feature array construction, model status
//  reporting, and identifier metadata.
//

import Testing
import CoreML
@testable import Andernet_Posture

// MARK: - MLModelIdentifier Tests

struct MLModelIdentifierTests {

    @Test func allCasesPresent() {
        #expect(MLModelIdentifier.allCases.count == 6)
    }

    @Test func featureCountsArePositive() {
        for id in MLModelIdentifier.allCases {
            #expect(id.featureCount > 0, "\(id.rawValue) should have positive feature count")
        }
    }

    @Test func displayNamesNotEmpty() {
        for id in MLModelIdentifier.allCases {
            #expect(!id.displayName.isEmpty, "\(id.rawValue) needs a display name")
        }
    }

    @Test func summariesNotEmpty() {
        for id in MLModelIdentifier.allCases {
            #expect(!id.summary.isEmpty, "\(id.rawValue) needs a summary")
        }
    }

    @Test func rawValuesAreDistinct() {
        let raws = Set(MLModelIdentifier.allCases.map(\.rawValue))
        #expect(raws.count == MLModelIdentifier.allCases.count, "Raw values must be unique")
    }

    @Test func expectedFeatureCounts() {
        #expect(MLModelIdentifier.gaitPatternClassifier.featureCount == 14)
        #expect(MLModelIdentifier.postureScorer.featureCount == 9)
        #expect(MLModelIdentifier.fallRiskPredictor.featureCount == 8)
        #expect(MLModelIdentifier.crossedSyndromeDetector.featureCount == 7)
        #expect(MLModelIdentifier.crossedSyndromeDetectorLower.featureCount == 7)
        #expect(MLModelIdentifier.fatiguePredictor.featureCount == 8)
    }
}

// MARK: - makeFeatureArray Tests

struct MakeFeatureArrayTests {

    @MainActor
    @Test func createsArrayWithCorrectShape() {
        let values: [Double?] = [1.0, 2.0, 3.0]
        let array = MLModelService.makeFeatureArray(values)

        #expect(array != nil)
        #expect(array!.count == 3)
    }

    @MainActor
    @Test func populatesValuesCorrectly() {
        let values: [Double?] = [10.0, 20.0, 30.0]
        let array = MLModelService.makeFeatureArray(values)!

        #expect(array[0].doubleValue == 10.0)
        #expect(array[1].doubleValue == 20.0)
        #expect(array[2].doubleValue == 30.0)
    }

    @MainActor
    @Test func nilValuesReplacedWithSentinel() {
        let values: [Double?] = [1.0, nil, 3.0]
        let array = MLModelService.makeFeatureArray(values, sentinelValue: -1.0)!

        #expect(array[0].doubleValue == 1.0)
        #expect(array[1].doubleValue == -1.0)
        #expect(array[2].doubleValue == 3.0)
    }

    @MainActor
    @Test func customSentinelValue() {
        let values: [Double?] = [nil, nil]
        let array = MLModelService.makeFeatureArray(values, sentinelValue: -999.0)!

        #expect(array[0].doubleValue == -999.0)
        #expect(array[1].doubleValue == -999.0)
    }

    @MainActor
    @Test func emptyArraySucceeds() {
        let values: [Double?] = []
        let array = MLModelService.makeFeatureArray(values)

        #expect(array != nil)
        #expect(array!.count == 0)
    }

    @MainActor
    @Test func singleElementArray() {
        let values: [Double?] = [42.0]
        let array = MLModelService.makeFeatureArray(values)!

        #expect(array.count == 1)
        #expect(array[0].doubleValue == 42.0)
    }

    @MainActor
    @Test func largeArray() {
        let values: [Double?] = (0..<100).map { Double($0) }
        let array = MLModelService.makeFeatureArray(values)!

        #expect(array.count == 100)
        #expect(array[99].doubleValue == 99.0)
    }
}

// MARK: - MLModelService Instance Tests

struct MLModelServiceInstanceTests {

    @MainActor
    @Test func modelsNotAvailableInTestBundle() {
        let svc = MLModelService()

        // In unit tests, no .mlmodelc files exist
        for id in MLModelIdentifier.allCases {
            #expect(!svc.isModelAvailable(id),
                    "\(id.rawValue) should not be in test bundle")
        }
    }

    @MainActor
    @Test func loadModelReturnsNilWhenNotBundled() {
        let svc = MLModelService()

        for id in MLModelIdentifier.allCases {
            #expect(svc.loadModel(id) == nil,
                    "\(id.rawValue) model should not load in test bundle")
        }
    }

    @MainActor
    @Test func modelStatusesReportsAllModels() {
        let svc = MLModelService()
        let statuses = svc.modelStatuses

        #expect(statuses.count == MLModelIdentifier.allCases.count)
        for status in statuses {
            #expect(!status.isAvailable, "No models bundled in tests")
            #expect(!status.version.isEmpty, "Version should not be empty")
        }
    }

    @MainActor
    @Test func availableModelCountIsZeroInTests() {
        let svc = MLModelService()
        #expect(svc.availableModelCount == 0)
    }

    @MainActor
    @Test func useMLModelsToggle() {
        let svc = MLModelService()
        svc.useMLModels = true
        #expect(svc.useMLModels == true)
        svc.useMLModels = false
        #expect(svc.useMLModels == false)
    }
}
