/**
 * VitalSense AR Health Overlay Manager
 * ARKit integration for immersive health visualization
 * Follows SwiftLint compliance rules for the VitalSense project
 */

import ARKit
import RealityKit
import SwiftUI
import Combine

@available(iOS 13.0, *)
class VitalSenseARManager: NSObject, ObservableObject {
    @Published var isARActive = false
    @Published var arError: String?
    @Published var healthVisualizationAnchors: [ARAnchor] = []

    private var arView: ARView?
    private var arSession: ARSession?
    private var healthDataSubscription: AnyCancellable?

    // Health data integration
    private let healthDataStream = PassthroughSubject<LiDARHealthData, Never>()

    // MARK: - Initialization

    override init() {
        super.init()
        setupHealthDataSubscription()
    }

    // MARK: - AR Session Management

    func initializeAR() throws {
        guard ARWorldTrackingConfiguration.isSupported else {
            throw ARError(.unsupportedConfiguration)
        }

        // Create AR view
        arView = ARView(frame: .zero)
        arSession = arView?.session
        arView?.session.delegate = self

        // Configure AR session
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic

        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            configuration.sceneReconstruction = .mesh
        }

        arView?.session.run(configuration)
        isARActive = true

        print("✅ VitalSense AR Session initialized successfully")
    }

    // MARK: - Health Visualization

    func overlayHealthInsights(_ data: LiDARHealthData) {
        guard let arView = arView else { return }

        // Create health visualization anchor
        let healthAnchor = createHealthVisualizationAnchor(data)
        arView.scene.addAnchor(healthAnchor)

        // Add to tracking
        healthVisualizationAnchors.append(healthAnchor)

        // Update real-time overlays
        updateGaitStabilityOverlay(data.gaitStability)
        updatePostureGuidance(data.postureScore)
        updateFallRiskVisualization(data.fallRisk)
    }

    private func createHealthVisualizationAnchor(_ data: LiDARHealthData) -> AnchorEntity {
        let anchor = AnchorEntity(world: [0, 0, -1])

        // Create health metrics display
        let healthDisplay = createHealthMetricsDisplay(data)
        anchor.addChild(healthDisplay)

        // Add gait guidance arrows
        let gaitGuidance = createGaitGuidanceVisuals(data.gaitStability)
        anchor.addChild(gaitGuidance)

        // Add posture correction indicators
        let postureIndicators = createPostureIndicators(data.postureScore)
        anchor.addChild(postureIndicators)

        return anchor
    }

    private func createHealthMetricsDisplay(_ data: LiDARHealthData) -> ModelEntity {
        // Create 3D text display for health metrics
        let healthText = """
            Gait Stability: \(String(format: "%.1f", data.gaitStability))%
            Posture Score: \(String(format: "%.1f", data.postureScore))%
            Fall Risk: \(getFallRiskLevel(data.fallRisk))
            """

        let textMesh = MeshResource.generateText(
            healthText,
            extrusionDepth: 0.02,
            font: .systemFont(ofSize: 0.1),
            containerFrame: .zero,
            alignment: .center,
            lineBreakMode: .byWordWrapping
        )

        let material = SimpleMaterial(color: .systemBlue, isMetallic: false)
        let textEntity = ModelEntity(mesh: textMesh, materials: [material])
        textEntity.position = [0, 0.5, 0]

        return textEntity
    }

    private func createGaitGuidanceVisuals(_ gaitStability: Float) -> ModelEntity {
        let containerEntity = ModelEntity()

        // Create guidance arrows based on gait stability
        if gaitStability < 70 {
            let arrowMesh = MeshResource.generateBox(
                width: 0.1,
                height: 0.02,
                depth: 0.3
            )
            let arrowMaterial = SimpleMaterial(
                color: getHealthColor(gaitStability),
                isMetallic: false
            )

            let leftArrow = ModelEntity(mesh: arrowMesh, materials: [arrowMaterial])
            leftArrow.position = [-0.2, 0, 0]
            leftArrow.orientation = simd_quatf(angle: .pi/4, axis: [0, 1, 0])

            let rightArrow = ModelEntity(mesh: arrowMesh, materials: [arrowMaterial])
            rightArrow.position = [0.2, 0, 0]
            rightArrow.orientation = simd_quatf(angle: -.pi/4, axis: [0, 1, 0])

            containerEntity.addChild(leftArrow)
            containerEntity.addChild(rightArrow)
        }

        return containerEntity
    }

    private func createPostureIndicators(_ postureScore: Float) -> ModelEntity {
        let containerEntity = ModelEntity()

        if postureScore < 80 {
            // Create spine alignment guide
            let spineMesh = MeshResource.generateCylinder(height: 0.6, radius: 0.01)
            let spineMaterial = SimpleMaterial(
                color: .systemYellow,
                isMetallic: false
            )

            let spineGuide = ModelEntity(mesh: spineMesh, materials: [spineMaterial])
            spineGuide.position = [0, 0.3, -0.5]

            // Add pulsing animation
            let pulseAnimation = AnimationResource.makeColorAnimation(
                from: .systemYellow,
                to: .systemOrange,
                duration: 1.5,
                autoreverses: true,
                repeatMode: .indefinite
            )

            spineGuide.playAnimation(pulseAnimation)
            containerEntity.addChild(spineGuide)
        }

        return containerEntity
    }

    // MARK: - Real-time Updates

    private func updateGaitStabilityOverlay(_ stability: Float) {
        // Real-time gait stability updates
        // Update existing anchors with new stability data
        print("Updating gait stability: \(stability)%")
    }

    private func updatePostureGuidance(_ postureScore: Float) {
        // Real-time posture guidance updates
        // Adjust guidance visuals based on current posture
        print("Updating posture guidance: \(postureScore)%")
    }

    private func updateFallRiskVisualization(_ fallRisk: Float) {
        guard let arView = arView else { return }

        // Create or update fall risk zones
        if fallRisk > 60 {
            let hazardZone = createFallRiskZone(severity: getFallRiskSeverity(fallRisk))
            arView.scene.addAnchor(hazardZone)
        }
    }

    private func createFallRiskZone(severity: FallRiskSeverity) -> AnchorEntity {
        let anchor = AnchorEntity(world: [0, 0, -2])

        // Create warning zone visualization
        let zoneMesh = MeshResource.generatePlane(width: 2, depth: 2)
        let zoneMaterial = SimpleMaterial(
            color: severity.color.withAlphaComponent(0.3),
            isMetallic: false
        )

        let zoneEntity = ModelEntity(mesh: zoneMesh, materials: [zoneMaterial])
        zoneEntity.position = [0, 0, 0]

        anchor.addChild(zoneEntity)
        return anchor
    }

    // MARK: - Health Data Processing

    private func setupHealthDataSubscription() {
        healthDataSubscription = healthDataStream
            .throttle(for: .milliseconds(500), scheduler: RunLoop.main, latest: true)
            .sink { [weak self] healthData in
                self?.overlayHealthInsights(healthData)
            }
    }

    func processNewHealthData(_ data: LiDARHealthData) {
        healthDataStream.send(data)
    }

    // MARK: - Utility Methods

    private func getHealthColor(_ value: Float) -> UIColor {
        switch value {
        case 85...:
            return .systemGreen
        case 70..<85:
            return .systemBlue
        case 55..<70:
            return .systemYellow
        case 40..<55:
            return .systemOrange
        default:
            return .systemRed
        }
    }

    private func getFallRiskLevel(_ risk: Float) -> String {
        switch risk {
        case 0..<30:
            return "Low"
        case 30..<60:
            return "Medium"
        default:
            return "High"
        }
    }

    private func getFallRiskSeverity(_ risk: Float) -> FallRiskSeverity {
        switch risk {
        case 0..<30:
            return .low
        case 30..<60:
            return .medium
        default:
            return .high
        }
    }

    // MARK: - Session Control

    func stopAR() {
        arView?.session.pause()
        arView = nil
        arSession = nil
        isARActive = false
        healthVisualizationAnchors.removeAll()
    }

    deinit {
        healthDataSubscription?.cancel()
        stopAR()
    }
}

// MARK: - ARSessionDelegate

@available(iOS 13.0, *)
extension VitalSenseARManager: ARSessionDelegate {
    func session(_ session: ARSession, didFailWithError error: Error) {
        arError = error.localizedDescription
        isARActive = false
    }

    func sessionWasInterrupted(_ session: ARSession) {
        isARActive = false
    }

    func sessionInterruptionEnded(_ session: ARSession) {
        // Restart AR when interruption ends
        do {
            try initializeAR()
        } catch {
            arError = error.localizedDescription
        }
    }
}

// MARK: - Supporting Types

struct LiDARHealthData {
    let gaitStability: Float
    let postureScore: Float
    let fallRisk: Float
    let movementConfidence: Float
    let timestamp: Date
}

enum FallRiskSeverity {
    case low, medium, high

    var color: UIColor {
        switch self {
        case .low:
            return .systemGreen
        case .medium:
            return .systemYellow
        case .high:
            return .systemRed
        }
    }
}

// MARK: - SwiftUI Integration

@available(iOS 13.0, *)
struct VitalSenseARView: UIViewRepresentable {
    @ObservedObject var arManager: VitalSenseARManager

    func makeUIView(context: Context) -> ARView {
        let arView = ARView()
        arManager.arView = arView
        return arView
    }

    func updateUIView(_ uiView: ARView, context: Context) {
        // Update AR view if needed
    }
}

// MARK: - SwiftUI AR Control View

@available(iOS 13.0, *)
struct VitalSenseARControlView: View {
    @StateObject private var arManager = VitalSenseARManager()
    @State private var showingError = false

    var body: some View {
        VStack(spacing: 20) {
            // AR View
            VitalSenseARView(arManager: arManager)
                .frame(height: 300)
                .cornerRadius(12)
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                )

            // Control Panel
            VStack(spacing: 16) {
                HStack {
                    VStack(alignment: .leading) {
                        Text("VitalSense AR Health Overlay")
                            .font(.headline)
                            .foregroundColor(.primary)

                        Text("Immersive health visualization")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                    }

                    Spacer()

                    Button(action: toggleAR) {
                        Text(arManager.isARActive ? "Stop AR" : "Start AR")
                            .foregroundColor(.white)
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                arManager.isARActive ? Color.red : Color.blue
                            )
                            .cornerRadius(8)
                    }
                }

                // Status indicators
                if arManager.isARActive {
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Active AR Features")
                            .font(.subheadline)
                            .fontWeight(.medium)

                        LazyVGrid(columns: [
                            GridItem(.flexible()),
                            GridItem(.flexible())
                        ], spacing: 8) {
                            FeatureIndicator(
                                title: "Health Metrics",
                                isActive: true
                            )
                            FeatureIndicator(
                                title: "Movement Guide",
                                isActive: true
                            )
                            FeatureIndicator(
                                title: "Fall Detection",
                                isActive: true
                            )
                            FeatureIndicator(
                                title: "Real-time",
                                isActive: true
                            )
                        }
                    }
                    .padding()
                    .background(Color.green.opacity(0.1))
                    .cornerRadius(8)
                }
            }
            .padding()
            .background(Color(.systemGray6))
            .cornerRadius(12)
        }
        .alert("AR Error", isPresented: $showingError) {
            Button("OK") { }
        } message: {
            Text(arManager.arError ?? "Unknown error occurred")
        }
        .onReceive(arManager.$arError) { error in
            showingError = error != nil
        }
        .padding()
    }

    private func toggleAR() {
        if arManager.isARActive {
            arManager.stopAR()
        } else {
            do {
                try arManager.initializeAR()
            } catch {
                arManager.arError = error.localizedDescription
            }
        }
    }
}

// MARK: - Feature Indicator Component

struct FeatureIndicator: View {
    let title: String
    let isActive: Bool

    var body: some View {
        HStack {
            Circle()
                .fill(isActive ? Color.green : Color.gray)
                .frame(width: 8, height: 8)

            Text(title)
                .font(.caption)
                .foregroundColor(isActive ? .primary : .secondary)

            Spacer()
        }
    }
}

// MARK: - Preview

#if DEBUG
@available(iOS 13.0, *)
struct VitalSenseARControlView_Previews: PreviewProvider {
    static var previews: some View {
        VitalSenseARControlView()
    }
}
#endif
