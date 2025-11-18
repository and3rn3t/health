import SwiftUI
import RealityKit
import ARKit

/// 3D mesh visualization view for LiDAR scan data
@available(iOS 16.0, *)
struct LiDARMeshView: View {
    let meshAnchors: [ARMeshAnchor]
    @State private var showWireframe = false
    @State private var showClassification = true
    @State private var selectedMesh: ARMeshAnchor?

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 3D mesh scene
                MeshView3D(
                    meshAnchors: meshAnchors,
                    showWireframe: showWireframe,
                    showClassification: showClassification
                )
                .frame(width: geometry.size.width, height: geometry.size.height)

                // Controls overlay
                VStack {
                    Spacer()
                    meshControls
                        .padding()
                        .background(.ultraThinMaterial)
                        .cornerRadius(16)
                        .padding()
                }
            }
        }
    }

    private var meshControls: some View {
        HStack(spacing: 20) {
            Button(action: {
                showWireframe.toggle()
            }) {
                VStack {
                    Image(systemName: showWireframe ? "network" : "network.fill")
                        .font(.title3)
                    Text("Wireframe")
                        .font(.caption2)
                }
                .foregroundColor(showWireframe ? .blue : .secondary)
            }

            Button(action: {
                showClassification.toggle()
            }) {
                VStack {
                    Image(systemName: showClassification ? "paintpalette.fill" : "paintpalette")
                        .font(.title3)
                    Text("Colors")
                        .font(.caption2)
                }
                .foregroundColor(showClassification ? .blue : .secondary)
            }

            Spacer()

            Text("\(meshAnchors.count) meshes")
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

/// 3D mesh rendering using RealityKit
@available(iOS 16.0, *)
struct MeshView3D: UIViewRepresentable {
    let meshAnchors: [ARMeshAnchor]
    let showWireframe: Bool
    let showClassification: Bool

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)
        arView.backgroundColor = .black

        // Configure for mesh visualization
        setupLighting(arView: arView)
        renderMeshes(arView: arView)

        return arView
    }

    func updateUIView(_ uiView: ARView, context: Context) {
        // Clear existing meshes
        uiView.scene.anchors.removeAll()

        // Re-render with new settings
        renderMeshes(arView: uiView)
    }

    private func setupLighting(arView: ARView) {
        // Add directional light
        let lightAnchor = AnchorEntity()
        let light = DirectionalLight()
        light.light.intensity = 2000
        light.light.color = .white
        light.shadow = DirectionalLightComponent.Shadow()
        lightAnchor.addChild(light)
        arView.scene.addAnchor(lightAnchor)

        // Add ambient light
        let ambientLight = AmbientLight()
        ambientLight.light.intensity = 500
        let ambientAnchor = AnchorEntity()
        ambientAnchor.addChild(ambientLight)
        arView.scene.addAnchor(ambientAnchor)
    }

    private func renderMeshes(arView: ARView) {
        for meshAnchor in meshAnchors {
            let meshEntity = createMeshEntity(from: meshAnchor)
            let anchorEntity = AnchorEntity(anchor: meshAnchor)
            anchorEntity.addChild(meshEntity)
            arView.scene.addAnchor(anchorEntity)
        }
    }

    private func createMeshEntity(from meshAnchor: ARMeshAnchor) -> ModelEntity {
        let geometry = meshAnchor.geometry
        let vertices = geometry.vertices
        let faces = geometry.faces
        let normals = geometry.normals

        // Create mesh descriptor
        var meshDescriptor = MeshDescriptor()

        // Convert vertices
        var positions: [SIMD3<Float>] = []
        for i in 0..<vertices.count {
            let vertex = vertices[i]
            positions.append(SIMD3<Float>(vertex.x, vertex.y, vertex.z))
        }
        meshDescriptor.positions = MeshBuffer(positions)

        // Convert faces (indices)
        var indices: [UInt32] = []
        for i in 0..<faces.count {
            let face = faces[i]
            let indexBuffer = geometry.faces.indexBuffer(as: UInt32.self)
            for j in 0..<3 {
                let index = indexBuffer[Int(face.indices[j])]
                indices.append(index)
            }
        }
        meshDescriptor.primitives = .triangles(indices)

        // Add normals if available
        if normals.count > 0 {
            var normalValues: [SIMD3<Float>] = []
            for i in 0..<normals.count {
                let normal = normals[i]
                normalValues.append(SIMD3<Float>(normal.x, normal.y, normal.z))
            }
            meshDescriptor.normals = MeshBuffer(normalValues)
        }

        // Create material
        var material = SimpleMaterial()

        if showClassification {
            // Color by classification if available
            if let classification = meshAnchor.geometry.classification {
                material.color = classificationColor(for: classification)
            } else {
                material.color = .init(tint: .systemBlue, texture: nil)
            }
        } else {
            material.color = .init(tint: .systemBlue, texture: nil)
        }

        if showWireframe {
            material.metallic = 0.3
            material.roughness = 0.7
        } else {
            material.metallic = 0.1
            material.roughness = 0.5
        }

        // Create mesh resource
        guard let meshResource = try? MeshResource.generate(from: [meshDescriptor]) else {
            // Fallback: create a simple cube
            return ModelEntity(mesh: .generateBox(size: 0.1), materials: [material])
        }

        return ModelEntity(mesh: meshResource, materials: [material])
    }

    private func classificationColor(for classification: ARMeshClassification) -> UIColor {
        switch classification {
        case .none:
            return .systemGray
        case .wall:
            return .systemBlue
        case .floor:
            return .systemBrown
        case .ceiling:
            return .systemYellow
        case .table:
            return .systemOrange
        case .seat:
            return .systemPurple
        case .window:
            return .systemCyan
        case .door:
            return .systemGreen
        @unknown default:
            return .systemGray
        }
    }
}

// MARK: - Preview

@available(iOS 16.0, *)
struct LiDARMeshView_Previews: PreviewProvider {
    static var previews: some View {
        // Preview with sample data would require actual ARMeshAnchor instances
        Text("Mesh View Preview")
            .previewDisplayName("LiDAR Mesh View")
    }
}
