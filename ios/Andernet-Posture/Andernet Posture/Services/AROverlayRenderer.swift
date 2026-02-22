//
//  AROverlayRenderer.swift
//  Andernet Posture
//
//  Rendering engine that applies overlay styles to skeleton entities.
//  Designed for future integration into BodyARView.Coordinator.
//

import RealityKit
import simd
import UIKit

/// Bundles skeleton entity references for overlay rendering.
struct SkeletonEntities: Sendable {
    let joints: [JointName: ModelEntity]
    let bones: [(entity: ModelEntity, from: JointName, to: JointName)]
    let anchor: Entity?
}

/// Bundles live metric values needed by overlay modes.
struct OverlayMetrics: Sendable {
    let severities: [String: ClinicalSeverity]
    let postureScore: Double
    let trunkLeanDeg: Double
    let craniovertebralAngleDeg: Double
    let hipFlexionLeftDeg: Double
    let hipFlexionRightDeg: Double
    let kneeFlexionLeftDeg: Double
    let kneeFlexionRightDeg: Double
    let rebaScore: Int
}

/// Applies visual overlay modes to skeleton joint and bone entities.
@MainActor
@Observable
final class AROverlayRenderer {

    // MARK: - State

    /// Angle text entities keyed by label identifier (e.g. "cva", "trunkLean").
    var angleTextEntities: [String: ModelEntity] = [:]

    /// Plumb line entity for posture guidelines.
    private var plumbLineEntity: ModelEntity?

    /// ROM arc entities keyed by joint name.
    private var romArcEntities: [String: ModelEntity] = [:]

    /// Tracks the last applied mode to detect mode changes.
    private var lastMode: AROverlayMode?

    // MARK: - Primary update

    /// Apply the overlay style for the current mode to all skeleton entities.
    func updateOverlay(
        config: AROverlayConfig,
        joints: [JointName: SIMD3<Float>],
        entities: SkeletonEntities,
        metrics: OverlayMetrics
    ) {
        let mode = config.mode

        // On mode change, clean up previous overlays
        if mode != lastMode {
            cleanUpOverlays(bodyAnchorEntity: entities.anchor)
            lastMode = mode
        }

        switch mode {
        case .skeleton:
            applySkeletonMode(entities: entities)
        case .severity:
            applySeverityMode(entities: entities, severities: metrics.severities)
        case .heatmap:
            applyHeatmapMode(entities: entities, postureScore: metrics.postureScore)
        case .angles:
            applyAnglesMode(joints: joints, entities: entities, metrics: metrics)
        case .rom:
            applyROMMode(joints: joints, entities: entities, metrics: metrics)
        case .minimal:
            applyMinimalMode(config: config, entities: entities)
        }

        // Posture guidelines plumb line (optional overlay on any mode)
        if config.showPostureGuidelines {
            updatePlumbLine(joints: joints, bodyAnchorEntity: entities.anchor)
        } else {
            plumbLineEntity?.isEnabled = false
        }
    }

    // MARK: - Cleanup

    private func cleanUpOverlays(bodyAnchorEntity: Entity?) {
        for (_, entity) in angleTextEntities {
            entity.removeFromParent()
        }
        angleTextEntities.removeAll()

        for (_, entity) in romArcEntities {
            entity.removeFromParent()
        }
        romArcEntities.removeAll()

        plumbLineEntity?.removeFromParent()
        plumbLineEntity = nil
    }
}

// MARK: - Skeleton Mode (Default)

extension AROverlayRenderer {

    private func applySkeletonMode(entities: SkeletonEntities) {
        let material = SimpleMaterial(
            color: .systemCyan.withAlphaComponent(0.8),
            isMetallic: false
        )
        let boneMaterial = SimpleMaterial(
            color: .systemTeal.withAlphaComponent(0.6),
            isMetallic: false
        )

        for (_, entity) in entities.joints {
            entity.model?.materials = [material]
        }
        for (entity, _, _) in entities.bones {
            entity.model?.materials = [boneMaterial]
            entity.isEnabled = true
        }
    }
}

// MARK: - Severity Mode

extension AROverlayRenderer {

    private func applySeverityMode(
        entities: SkeletonEntities,
        severities: [String: ClinicalSeverity]
    ) {
        for (joint, entity) in entities.joints {
            let severity = regionalSeverity(for: joint, severities: severities)
            let color = AROverlayConfig.color(for: severity)
            let mat = SimpleMaterial(color: color.withAlphaComponent(0.85), isMetallic: false)
            entity.model?.materials = [mat]
        }

        // Bones inherit the worse severity of their endpoints
        for (entity, from, to) in entities.bones {
            let fromSev = regionalSeverity(for: from, severities: severities)
            let toSev = regionalSeverity(for: to, severities: severities)
            let worse = max(fromSev.ordinal, toSev.ordinal)
            let sev = ClinicalSeverity.from(ordinal: worse)
            let color = AROverlayConfig.color(for: sev)
            let mat = SimpleMaterial(color: color.withAlphaComponent(0.6), isMetallic: false)
            entity.model?.materials = [mat]
            entity.isEnabled = true
        }
    }

    /// Map each joint to the appropriate clinical severity region.
    private func regionalSeverity(
        for joint: JointName,
        severities: [String: ClinicalSeverity]
    ) -> ClinicalSeverity {
        switch joint {
        case .head, .neck1, .neck2, .neck3, .neck4:
            return severities["cva"] ?? .normal
        case .leftShoulder, .rightShoulder, .leftArm, .rightArm,
             .leftForearm, .rightForearm, .leftHand, .rightHand:
            return severities["shoulder"] ?? .normal
        case .spine1, .spine2, .spine3, .spine4, .spine5, .spine6, .spine7:
            return severities["trunkForward"] ?? .normal
        case .hips, .root:
            return severities["pelvic"] ?? .normal
        case .leftUpLeg, .rightUpLeg, .leftLeg, .rightLeg,
             .leftFoot, .rightFoot, .leftToeEnd, .rightToeEnd:
            return severities["gaitSpeed"] ?? severities["symmetry"] ?? .normal
        }
    }
}

// MARK: - Heatmap Mode

extension AROverlayRenderer {

    private func applyHeatmapMode(
        entities: SkeletonEntities,
        postureScore: Double
    ) {
        let color = AROverlayConfig.heatmapColor(for: postureScore)
        let material = SimpleMaterial(color: color.withAlphaComponent(0.8), isMetallic: false)
        let boneMat = SimpleMaterial(color: color.withAlphaComponent(0.6), isMetallic: false)

        for (_, entity) in entities.joints {
            entity.model?.materials = [material]
        }
        for (entity, _, _) in entities.bones {
            entity.model?.materials = [boneMat]
            entity.isEnabled = true
        }
    }
}

// MARK: - Angles Mode

extension AROverlayRenderer {

    private func applyAnglesMode(
        joints: [JointName: SIMD3<Float>],
        entities: SkeletonEntities,
        metrics: OverlayMetrics
    ) {
        // Base skeleton coloring
        applySkeletonMode(entities: entities)

        guard let anchor = entities.anchor else { return }

        let labels: [AngleLabel] = [
            AngleLabel(key: "cva", joint: .head, value: metrics.craniovertebralAngleDeg),
            AngleLabel(key: "trunkLean", joint: .spine4, value: metrics.trunkLeanDeg),
            AngleLabel(key: "hipL", joint: .leftUpLeg, value: metrics.hipFlexionLeftDeg),
            AngleLabel(key: "hipR", joint: .rightUpLeg, value: metrics.hipFlexionRightDeg),
            AngleLabel(key: "kneeL", joint: .leftLeg, value: metrics.kneeFlexionLeftDeg),
            AngleLabel(key: "kneeR", joint: .rightLeg, value: metrics.kneeFlexionRightDeg)
        ]

        for item in labels {
            updateAngleLabel(
                key: item.key,
                text: String(format: "%.0f°", item.value),
                nearJoint: item.joint,
                joints: joints,
                anchor: anchor
            )
        }
    }

    private func updateAngleLabel(
        key: String,
        text: String,
        nearJoint: JointName,
        joints: [JointName: SIMD3<Float>],
        anchor: Entity
    ) {
        guard let jointPos = joints[nearJoint] else { return }

        let offset = SIMD3<Float>(0.06, 0.03, 0)

        if let existing = angleTextEntities[key] {
            // Update text content by replacing the mesh
            existing.model?.mesh = MeshResource.generateText(
                text,
                extrusionDepth: 0.001,
                font: .systemFont(ofSize: 0.025, weight: .bold),
                containerFrame: .zero,
                alignment: .left,
                lineBreakMode: .byClipping
            )
            existing.position = jointPos + offset
        } else {
            let mesh = MeshResource.generateText(
                text,
                extrusionDepth: 0.001,
                font: .systemFont(ofSize: 0.025, weight: .bold),
                containerFrame: .zero,
                alignment: .left,
                lineBreakMode: .byClipping
            )
            let material = SimpleMaterial(color: .white, isMetallic: false)
            let entity = ModelEntity(mesh: mesh, materials: [material])
            entity.position = jointPos + offset
            entity.scale = SIMD3<Float>(repeating: 1.0)
            anchor.addChild(entity)
            angleTextEntities[key] = entity
        }
    }
}

// MARK: - ROM Mode

extension AROverlayRenderer {

    private func applyROMMode(
        joints: [JointName: SIMD3<Float>],
        entities: SkeletonEntities,
        metrics: OverlayMetrics
    ) {
        // Base skeleton coloring
        applySkeletonMode(entities: entities)

        guard let anchor = entities.anchor else { return }

        // Hip ROM normal range ~0–120°, Knee ROM normal range ~0–135°
        let romItems: [ROMItem] = [
            ROMItem(key: "romHipL", joint: .leftUpLeg, angle: metrics.hipFlexionLeftDeg, normalMax: 120),
            ROMItem(key: "romHipR", joint: .rightUpLeg, angle: metrics.hipFlexionRightDeg, normalMax: 120),
            ROMItem(key: "romKneeL", joint: .leftLeg, angle: metrics.kneeFlexionLeftDeg, normalMax: 135),
            ROMItem(key: "romKneeR", joint: .rightLeg, angle: metrics.kneeFlexionRightDeg, normalMax: 135)
        ]

        for item in romItems {
            updateROMArc(
                key: item.key,
                joint: item.joint,
                angleDeg: item.angle,
                normalMax: item.normalMax,
                joints: joints,
                anchor: anchor
            )
        }
    }

    private func updateROMArc(
        key: String,
        joint: JointName,
        angleDeg: Double,
        normalMax: Double,
        joints: [JointName: SIMD3<Float>],
        anchor: Entity
    ) {
        guard let jointPos = joints[joint] else { return }

        let inRange = angleDeg <= normalMax
        let color: UIColor = inRange ? .systemGreen : .systemOrange
        let arcRadius: Float = 0.05
        let fraction = Float(min(angleDeg / normalMax, 1.5))
        let arcLength = max(arcRadius * fraction, 0.01)

        if let existing = romArcEntities[key] {
            existing.model?.mesh = MeshResource.generateBox(
                size: [arcLength, 0.005, 0.005]
            )
            existing.model?.materials = [SimpleMaterial(color: color.withAlphaComponent(0.8), isMetallic: false)]
            existing.position = jointPos + SIMD3<Float>(arcLength / 2, 0, 0.02)
        } else {
            let mesh = MeshResource.generateBox(size: [arcLength, 0.005, 0.005])
            let material = SimpleMaterial(color: color.withAlphaComponent(0.8), isMetallic: false)
            let entity = ModelEntity(mesh: mesh, materials: [material])
            entity.position = jointPos + SIMD3<Float>(arcLength / 2, 0, 0.02)
            anchor.addChild(entity)
            romArcEntities[key] = entity
        }
    }
}

// MARK: - Minimal Mode

extension AROverlayRenderer {

    private func applyMinimalMode(
        config: AROverlayConfig,
        entities: SkeletonEntities
    ) {
        let highlighted = config.jointHighlightJoints
        let material = SimpleMaterial(color: .systemCyan.withAlphaComponent(0.9), isMetallic: false)

        for (joint, entity) in entities.joints {
            if highlighted.contains(joint) {
                entity.isEnabled = true
                entity.model?.materials = [material]
            } else {
                entity.isEnabled = false
            }
        }

        // Hide all bones in minimal mode
        for (entity, _, _) in entities.bones {
            entity.isEnabled = false
        }
    }
}

// MARK: - Posture Guidelines (Plumb Line)

extension AROverlayRenderer {

    private func updatePlumbLine(
        joints: [JointName: SIMD3<Float>],
        bodyAnchorEntity: Entity?
    ) {
        guard let anchor = bodyAnchorEntity,
              let headPos = joints[.head],
              let footPos = joints[.leftFoot] ?? joints[.rightFoot] else {
            plumbLineEntity?.isEnabled = false
            return
        }

        // Ideal plumb line: straight down from the head's X/Z position
        let idealBottom = SIMD3<Float>(headPos.x, footPos.y, headPos.z)
        let lineLength = simd_length(headPos - idealBottom)

        guard lineLength > 0.05 else {
            plumbLineEntity?.isEnabled = false
            return
        }

        let midPoint = (headPos + idealBottom) / 2

        if let existing = plumbLineEntity {
            existing.position = midPoint
            existing.scale = SIMD3<Float>(0.003, lineLength, 0.003)
            existing.isEnabled = true
        } else {
            let mesh = MeshResource.generateBox(size: [1, 1, 1])
            let material = SimpleMaterial(
                color: .systemGreen.withAlphaComponent(0.5),
                isMetallic: false
            )
            let entity = ModelEntity(mesh: mesh, materials: [material])
            entity.position = midPoint
            entity.scale = SIMD3<Float>(0.003, lineLength, 0.003)
            anchor.addChild(entity)
            plumbLineEntity = entity
        }
    }
}

// MARK: - Value types for overlay data

/// A single angle label to render in AR.
private struct AngleLabel {
    let key: String
    let joint: JointName
    let value: Double
}

/// A single ROM indicator to render in AR.
private struct ROMItem {
    let key: String
    let joint: JointName
    let angle: Double
    let normalMax: Double
}
