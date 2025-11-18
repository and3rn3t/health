import SwiftUI
import RealityKit
import ARKit
import simd

/// Point cloud visualization view for LiDAR scan data
@available(iOS 16.0, *)
struct LiDARPointCloudView: View {
    let points: [simd_float3]
    let colors: [Color]?

    @State private var pointSize: Float = 0.01
    @State private var showColors = true
    @State private var density: Float = 1.0 // 0.0 to 1.0 for subsampling

    private var displayPoints: [simd_float3] {
        if density >= 1.0 {
            return points
        }
        let step = Int(1.0 / density)
        return points.enumerated().compactMap { $0.offset % step == 0 ? $0.element : nil }
    }

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // 3D point cloud
                PointCloudView3D(
                    points: displayPoints,
                    colors: colors,
                    pointSize: pointSize,
                    showColors: showColors
                )
                .frame(width: geometry.size.width, height: geometry.size.height)

                // Controls overlay
                VStack {
                    Spacer()
                    pointCloudControls
                        .padding()
                        .background(.ultraThinMaterial)
                        .cornerRadius(16)
                        .padding()
                }
            }
        }
    }

    private var pointCloudControls: some View {
        VStack(spacing: 12) {
            HStack {
                Text("Point Size")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Slider(value: Binding(
                    get: { Double(pointSize) },
                    set: { pointSize = Float($0) }
                ), in: 0.001...0.05) {
                    EmptyView()
                }

                Text(String(format: "%.3f", pointSize))
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .frame(width: 50)
            }

            HStack {
                Text("Density")
                    .font(.caption)
                    .foregroundColor(.secondary)

                Slider(value: Binding(
                    get: { Double(density) },
                    set: { density = Float($0) }
                ), in: 0.1...1.0) {
                    EmptyView()
                }

                Text(String(format: "%.0f%%", density * 100))
                    .font(.caption2)
                    .foregroundColor(.secondary)
                    .frame(width: 50)
            }

            Toggle("Color by Depth", isOn: $showColors)
                .font(.caption)
        }
    }
}

/// 3D point cloud rendering using RealityKit
@available(iOS 16.0, *)
struct PointCloudView3D: UIViewRepresentable {
    let points: [simd_float3]
    let colors: [Color]?
    let pointSize: Float
    let showColors: Bool

    func makeUIView(context: Context) -> ARView {
        let arView = ARView(frame: .zero)
        arView.backgroundColor = .black

        setupLighting(arView: arView)
        renderPoints(arView: arView)

        return arView
    }

    func updateUIView(_ uiView: ARView, context: Context) {
        // Clear existing points
        uiView.scene.anchors.removeAll()

        // Re-render with new settings
        setupLighting(arView: uiView)
        renderPoints(arView: uiView)
    }

    private func setupLighting(arView: ARView) {
        // Add directional light
        let lightAnchor = AnchorEntity()
        let light = DirectionalLight()
        light.light.intensity = 3000
        light.light.color = .white
        lightAnchor.addChild(light)
        arView.scene.addAnchor(lightAnchor)

        // Add ambient light
        let ambientLight = AmbientLight()
        ambientLight.light.intensity = 800
        let ambientAnchor = AnchorEntity()
        ambientAnchor.addChild(ambientLight)
        arView.scene.addAnchor(ambientAnchor)
    }

    private func renderPoints(arView: ARView) {
        guard !points.isEmpty else { return }

        // Create point entities
        let pointAnchor = AnchorEntity()

        // Batch points into groups for better performance
        let batchSize = 1000
        var pointIndex = 0

        while pointIndex < points.count {
            let batchPoints = Array(points[pointIndex..<min(pointIndex + batchSize, points.count)])
            let batchEntity = createPointCloudEntity(points: batchPoints, startIndex: pointIndex)
            pointAnchor.addChild(batchEntity)
            pointIndex += batchSize
        }

        arView.scene.addAnchor(pointAnchor)
    }

    private func createPointCloudEntity(points: [simd_float3], startIndex: Int) -> ModelEntity {
        // Create spheres for each point
        var entities: [ModelEntity] = []

        for (index, point) in points.enumerated() {
            // Determine color
            let color: UIColor
            if showColors, let colors = colors, startIndex + index < colors.count {
                let swiftColor = colors[startIndex + index]
                color = UIColor(swiftColor)
            } else if showColors {
                // Color by depth (Z coordinate)
                let depth = point.z
                let normalizedDepth = (depth + 5.0) / 10.0 // Normalize to 0-1
                color = colorFromDepth(normalizedDepth)
            } else {
                color = .systemBlue
            }

            // Create sphere material
            var material = SimpleMaterial()
            material.color = .init(tint: color, texture: nil)
            material.metallic = 0.0
            material.roughness = 0.5

            // Create sphere mesh
            let sphere = MeshResource.generateSphere(radius: pointSize)
            let sphereEntity = ModelEntity(mesh: sphere, materials: [material])
            sphereEntity.position = simd_float3(point.x, point.y, point.z)

            entities.append(sphereEntity)
        }

        // Group entities for better performance
        let groupEntity = ModelEntity()
        for entity in entities {
            groupEntity.addChild(entity)
        }

        return groupEntity
    }

    private func colorFromDepth(_ depth: Double) -> UIColor {
        // Color gradient from blue (close) to red (far)
        let clampedDepth = max(0.0, min(1.0, depth))

        if clampedDepth < 0.5 {
            // Blue to green
            let ratio = clampedDepth * 2.0
            return UIColor(
                red: 0.0,
                green: CGFloat(ratio),
                blue: CGFloat(1.0 - ratio),
                alpha: 1.0
            )
        } else {
            // Green to red
            let ratio = (clampedDepth - 0.5) * 2.0
            return UIColor(
                red: CGFloat(ratio),
                green: CGFloat(1.0 - ratio),
                blue: 0.0,
                alpha: 1.0
            )
        }
    }
}

// MARK: - Preview

@available(iOS 16.0, *)
struct LiDARPointCloudView_Previews: PreviewProvider {
    static var previews: some View {
        let samplePoints: [simd_float3] = (0..<1000).map { _ in
            simd_float3(
                Float.random(in: -2...2),
                Float.random(in: -2...2),
                Float.random(in: -5...0)
            )
        }

        LiDARPointCloudView(points: samplePoints, colors: nil)
            .previewDisplayName("LiDAR Point Cloud View")
    }
}
