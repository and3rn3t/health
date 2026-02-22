//
//  MotionFrameTests.swift
//  Andernet PostureTests
//
//  Tests for MotionFrame data model.
//

import Testing
import Foundation
@testable import Andernet_Posture

// MARK: - MotionFrameTests

@Suite("MotionFrame")
struct MotionFrameTests {

    // MARK: - Codable Round-Trip

    @Test func encodesAndDecodesCorrectly() throws {
        // MotionFrame requires CMDeviceMotion to init from the primary initializer,
        // which is hardware-only. Instead, test Codable round-trip via JSON.
        let json = """
        {
            "timestamp": 1.5,
            "roll": 0.1,
            "pitch": 0.2,
            "yaw": 0.3,
            "userAccelerationX": 0.01,
            "userAccelerationY": -0.98,
            "userAccelerationZ": 0.05,
            "gravityX": 0.0,
            "gravityY": -1.0,
            "gravityZ": 0.0,
            "rotationRateX": 0.001,
            "rotationRateY": 0.002,
            "rotationRateZ": 0.003
        }
        """
        let data = Data(json.utf8)
        let decoded = try JSONDecoder().decode(MotionFrame.self, from: data)

        #expect(decoded.timestamp == 1.5)
        #expect(decoded.roll == 0.1)
        #expect(decoded.pitch == 0.2)
        #expect(decoded.yaw == 0.3)
        #expect(abs(decoded.userAccelerationX - 0.01) < 0.001)
        #expect(abs(decoded.userAccelerationY - (-0.98)) < 0.001)
        #expect(abs(decoded.userAccelerationZ - 0.05) < 0.001)
        #expect(decoded.gravityX == 0.0)
        #expect(decoded.gravityY == -1.0)
        #expect(decoded.gravityZ == 0.0)
        #expect(abs(decoded.rotationRateX - 0.001) < 0.0001)
        #expect(abs(decoded.rotationRateY - 0.002) < 0.0001)
        #expect(abs(decoded.rotationRateZ - 0.003) < 0.0001)

        // Re-encode and decode to verify full round-trip
        let reEncoded = try JSONEncoder().encode(decoded)
        let reDecoded = try JSONDecoder().decode(MotionFrame.self, from: reEncoded)
        #expect(reDecoded.timestamp == decoded.timestamp)
        #expect(reDecoded.roll == decoded.roll)
        #expect(reDecoded.pitch == decoded.pitch)
        #expect(reDecoded.yaw == decoded.yaw)
    }

    @Test func allFieldsPresent() throws {
        let json = """
        {
            "timestamp": 0,
            "roll": 0, "pitch": 0, "yaw": 0,
            "userAccelerationX": 0, "userAccelerationY": 0, "userAccelerationZ": 0,
            "gravityX": 0, "gravityY": -1, "gravityZ": 0,
            "rotationRateX": 0, "rotationRateY": 0, "rotationRateZ": 0
        }
        """
        let frame = try JSONDecoder().decode(MotionFrame.self, from: Data(json.utf8))
        #expect(frame.timestamp == 0)
        #expect(frame.gravityY == -1.0)
    }

    @Test func decodingFailsWithMissingFields() {
        let incomplete = """
        { "timestamp": 1.0, "roll": 0.1 }
        """
        #expect(throws: DecodingError.self) {
            _ = try JSONDecoder().decode(MotionFrame.self, from: Data(incomplete.utf8))
        }
    }

    @Test func conformsToSendable() {
        // Compile-time check — MotionFrame is Sendable
        let frame = try? JSONDecoder().decode(
            MotionFrame.self,
            from: Data("""
            {"timestamp":0,"roll":0,"pitch":0,"yaw":0,
             "userAccelerationX":0,"userAccelerationY":0,"userAccelerationZ":0,
             "gravityX":0,"gravityY":0,"gravityZ":0,
             "rotationRateX":0,"rotationRateY":0,"rotationRateZ":0}
            """.utf8)
        )
        let _: (any Sendable)? = frame
        #expect(frame != nil)
    }
}
