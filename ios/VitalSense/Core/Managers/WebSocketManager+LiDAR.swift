//
//  WebSocketManager+LiDAR.swift
//  VitalSense
//
//  WebSocket integration for LiDAR scan data streaming
//

import Foundation
import simd

// MARK: - LiDAR WebSocket Extension

extension WebSocketManager {

    // MARK: - LiDAR Scan Data Streaming

    /// Send real-time LiDAR scan progress during scanning
    @discardableResult
    func sendLiDARScanProgress(
        scanType: String,
        progress: Double,
        pointCount: Int,
        quality: Double,
        metrics: [String: Any]? = nil
    ) async -> Bool {
        let envelope: [String: Any] = [
            "type": "lidar_scan_progress",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios_lidar",
            "data": [
                "scan_type": scanType,
                "progress": progress,
                "point_count": pointCount,
                "quality": quality,
                "metrics": metrics ?? [:]
            ]
        ]

        do {
            try await sendJSON(envelope)
            return true
        } catch {
            Log.error("Failed to send LiDAR scan progress: \(error.localizedDescription)", category: "websocket")
            return false
        }
    }

    /// Send completed LiDAR scan results
    @discardableResult
    func sendLiDARScanResult(_ result: LiDARScanResult) async -> Bool {
        // Extract metrics from scan result
        var scanData: [String: Any] = [
            "scan_id": result.id.uuidString,
            "scan_type": result.type.rawValue,
            "date": ISO8601DateFormatter().string(from: result.date),
            "duration": result.duration,
            "frame_count": result.frameCount,
            "average_quality": result.averageQuality,
            "score": result.score,
            "insights": result.insights.map { insight in
                [
                    "type": insight.type.rawValue,
                    "title": insight.title,
                    "description": insight.description,
                    "recommendation": insight.recommendation
                ]
            }
        ]

        // Add type-specific metrics
        switch result.type {
        case .gaitAnalysis:
            // Add gait-specific metrics if available
            scanData["gait_metrics"] = [
                "steps_detected": result.rawData.accelerometerData.count > 0 ? "detected" : "none",
                "motion_samples": result.rawData.accelerometerData.count
            ]
        case .fallRiskAssessment:
            scanData["fall_risk_metrics"] = [
                "score": result.score,
                "risk_level": result.score < 60 ? "high" : result.score < 80 ? "moderate" : "low"
            ]
        case .balanceTest:
            scanData["balance_metrics"] = [
                "balance_score": result.score,
                "stability_level": result.score < 60 ? "poor" : result.score < 80 ? "fair" : "good"
            ]
        case .environmentalScan:
            scanData["environmental_metrics"] = [
                "hazards_detected": result.insights.filter { $0.type == .warning || $0.type == .alert }.count,
                "scan_area_coverage": result.averageQuality * 100
            ]
        }

        let envelope: [String: Any] = [
            "type": "lidar_scan_result",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios_lidar",
            "data": scanData
        ]

        do {
            try await sendJSON(envelope)
            Log.info("LiDAR scan result sent successfully", category: "websocket")
            return true
        } catch {
            Log.error("Failed to send LiDAR scan result: \(error.localizedDescription)", category: "websocket")
            return false
        }
    }

    /// Send real-time gait metrics during LiDAR scan
    @discardableResult
    func sendLiDARGaitMetrics(
        cadence: Double?,
        strideLength: Double?,
        walkingSpeed: Double?,
        stepSymmetry: Double?,
        scanType: String
    ) async -> Bool {
        var metrics: [String: Any] = [
            "scan_type": scanType,
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        if let cadence = cadence {
            metrics["cadence"] = cadence
        }
        if let strideLength = strideLength {
            metrics["stride_length"] = strideLength
        }
        if let walkingSpeed = walkingSpeed {
            metrics["walking_speed"] = walkingSpeed
        }
        if let stepSymmetry = stepSymmetry {
            metrics["step_symmetry"] = stepSymmetry
        }

        let envelope: [String: Any] = [
            "type": "lidar_gait_metrics",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios_lidar",
            "data": metrics
        ]

        do {
            try await sendJSON(envelope)
            return true
        } catch {
            Log.error("Failed to send LiDAR gait metrics: \(error.localizedDescription)", category: "websocket")
            return false
        }
    }

    /// Send environmental scan data (obstacles, hazards)
    @discardableResult
    func sendLiDAREnvironmentalData(
        obstacles: [simd_float3],
        floorStability: Double?,
        hazards: Int
    ) async -> Bool {
        let envelope: [String: Any] = [
            "type": "lidar_environmental_data",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios_lidar",
            "data": [
                "obstacle_count": obstacles.count,
                "obstacles": obstacles.map { ["x": Double($0.x), "y": Double($0.y), "z": Double($0.z)] },
                "floor_stability": floorStability ?? 0.0,
                "hazard_count": hazards
            ]
        ]

        do {
            try await sendJSON(envelope)
            return true
        } catch {
            Log.error("Failed to send LiDAR environmental data: \(error.localizedDescription)", category: "websocket")
            return false
        }
    }

    /// Send balance analysis data
    @discardableResult
    func sendLiDARBalanceData(
        centerOfMass: simd_float3?,
        posturalSway: Double?,
        stabilityScore: Double?
    ) async -> Bool {
        var balanceData: [String: Any] = [
            "timestamp": ISO8601DateFormatter().string(from: Date())
        ]

        if let com = centerOfMass {
            balanceData["center_of_mass"] = ["x": Double(com.x), "y": Double(com.y), "z": Double(com.z)]
        }
        if let sway = posturalSway {
            balanceData["postural_sway"] = sway
        }
        if let stability = stabilityScore {
            balanceData["stability_score"] = stability
        }

        let envelope: [String: Any] = [
            "type": "lidar_balance_data",
            "timestamp": ISO8601DateFormatter().string(from: Date()),
            "source": "ios_lidar",
            "data": balanceData
        ]

        do {
            try await sendJSON(envelope)
            return true
        } catch {
            Log.error("Failed to send LiDAR balance data: \(error.localizedDescription)", category: "websocket")
            return false
        }
    }
}

// MARK: - Supporting Extensions

extension LiDARInsight.InsightType {
    var rawValue: String {
        switch self {
        case .info: return "info"
        case .warning: return "warning"
        case .alert: return "alert"
        case .success: return "success"
        }
    }
}
