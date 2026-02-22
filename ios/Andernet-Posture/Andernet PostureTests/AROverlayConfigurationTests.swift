//
//  AROverlayConfigurationTests.swift
//  Andernet PostureTests
//
//  Tests for AROverlayMode enum and AROverlayConfig behavior.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - AROverlayModeTests

@Suite("AROverlayMode")
struct AROverlayModeTests {

    @Test func allCasesExist() {
        let allModes = AROverlayMode.allCases
        #expect(allModes.count == 6)
        #expect(allModes.contains(.skeleton))
        #expect(allModes.contains(.severity))
        #expect(allModes.contains(.heatmap))
        #expect(allModes.contains(.angles))
        #expect(allModes.contains(.rom))
        #expect(allModes.contains(.minimal))
    }

    @Test func displayNamesAreNonEmpty() {
        for mode in AROverlayMode.allCases {
            #expect(!mode.displayName.isEmpty, "Display name empty for \(mode)")
        }
    }

    @Test func iconNamesAreNonEmpty() {
        for mode in AROverlayMode.allCases {
            #expect(!mode.iconName.isEmpty, "Icon name empty for \(mode)")
        }
    }

    @Test func descriptionTextsAreNonEmpty() {
        for mode in AROverlayMode.allCases {
            #expect(!mode.descriptionText.isEmpty, "Description empty for \(mode)")
        }
    }

    @Test func identifiableUsesRawValue() {
        for mode in AROverlayMode.allCases {
            #expect(mode.id == mode.rawValue)
        }
    }

    @Test func rawValueRoundTrip() {
        for mode in AROverlayMode.allCases {
            let restored = AROverlayMode(rawValue: mode.rawValue)
            #expect(restored == mode)
        }
    }
}

// MARK: - AROverlayConfigTests

@Suite("AROverlayConfig")
struct AROverlayConfigTests {

    @Test @MainActor func minimalModeHidesOnlyKeyJoints() {
        let config = AROverlayConfig()
        // Temporarily override mode via UserDefaults for consistent testing
        UserDefaults.standard.set(AROverlayMode.minimal.rawValue, forKey: "arOverlayMode")

        let joints = config.jointHighlightJoints
        #expect(joints.contains(.head))
        #expect(joints.contains(.root))
        #expect(joints.count <= 10)
        #expect(!config.showBones)

        // Cleanup
        UserDefaults.standard.removeObject(forKey: "arOverlayMode")
    }

    @Test @MainActor func skeletonModeShowsBones() {
        let config = AROverlayConfig()
        UserDefaults.standard.set(AROverlayMode.skeleton.rawValue, forKey: "arOverlayMode")

        #expect(config.showBones == true)

        UserDefaults.standard.removeObject(forKey: "arOverlayMode")
    }

    @Test @MainActor func anglesModeHighlightsKeyJoints() {
        let config = AROverlayConfig()
        UserDefaults.standard.set(AROverlayMode.angles.rawValue, forKey: "arOverlayMode")

        let joints = config.jointHighlightJoints
        #expect(joints.contains(.head))
        #expect(joints.contains(.spine4))

        UserDefaults.standard.removeObject(forKey: "arOverlayMode")
    }
}
