import SwiftUI
import Charts
import simd

/// Heat map visualization for hazard detection and environmental analysis
@available(iOS 16.0, *)
struct LiDARHeatMapView: View {
    let hazards: [HazardData]
    let floorMap: FloorMap?

    @State private var selectedLayer: HeatMapLayer = .hazards
    @State private var opacity: Double = 0.7

    enum HeatMapLayer {
        case hazards
        case floorStability
        case obstacleDensity
        case all
    }

    var body: some View {
        GeometryReader { geometry in
            VStack(spacing: 0) {
                // Heat map visualization
                ZStack {
                    if let floorMap = floorMap {
                        FloorHeatMap(floorMap: floorMap, hazards: hazards, layer: selectedLayer, opacity: opacity)
                    } else {
                        HazardHeatMap(hazards: hazards, opacity: opacity)
                    }
                }
                .frame(height: geometry.size.height * 0.7)

                // Controls and legend
                VStack(spacing: 12) {
                    layerSelector
                    opacityControl
                    legend
                }
                .padding()
                .background(.ultraThinMaterial)
                .frame(height: geometry.size.height * 0.3)
            }
        }
    }

    private var layerSelector: some View {
        Picker("Layer", selection: $selectedLayer) {
            Text("Hazards").tag(HeatMapLayer.hazards)
            Text("Floor Stability").tag(HeatMapLayer.floorStability)
            Text("Obstacle Density").tag(HeatMapLayer.obstacleDensity)
            Text("All").tag(HeatMapLayer.all)
        }
        .pickerStyle(.segmented)
    }

    private var opacityControl: some View {
        HStack {
            Text("Opacity")
                .font(.caption)
                .foregroundColor(.secondary)

            Slider(value: $opacity, in: 0.3...1.0) {
                EmptyView()
            }

            Text(String(format: "%.0f%%", opacity * 100))
                .font(.caption2)
                .foregroundColor(.secondary)
                .frame(width: 50)
        }
    }

    private var legend: some View {
        HStack(spacing: 20) {
            LegendItem(color: .red, label: "High Risk")
            LegendItem(color: .orange, label: "Medium")
            LegendItem(color: .yellow, label: "Low")
            LegendItem(color: .green, label: "Safe")
        }
        .font(.caption2)
    }
}

struct HazardData: Identifiable {
    let id = UUID()
    let position: simd_float3
    let type: HazardType
    let riskLevel: RiskLevel
    let radius: Float // Affected area radius in meters

    enum HazardType {
        case obstacle
        case stair
        case unevenFloor
        case furniture

        var icon: String {
            switch self {
            case .obstacle: return "exclamationmark.triangle.fill"
            case .stair: return "stairs"
            case .unevenFloor: return "waveform.path"
            case .furniture: return "sofa.fill"
            }
        }
    }

    enum RiskLevel {
        case low, medium, high

        var color: Color {
            switch self {
            case .low: return .yellow
            case .medium: return .orange
            case .high: return .red
            }
        }
    }
}

struct FloorMap {
    let gridSize: Int // Number of cells per side
    let cellSize: Float // Size of each cell in meters
    let stability: [[Double]] // Stability score for each cell (0.0 to 1.0)
    let positions: [[simd_float3]] // World positions for each cell
}

/// Heat map for floor stability and hazards
@available(iOS 16.0, *)
struct FloorHeatMap: View {
    let floorMap: FloorMap
    let hazards: [HazardData]
    let layer: LiDARHeatMapView.HeatMapLayer
    let opacity: Double

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Floor grid
                ForEach(0..<floorMap.gridSize, id: \.self) { row in
                    ForEach(0..<floorMap.gridSize, id: \.self) { col in
                        if row < floorMap.stability.count && col < floorMap.stability[row].count {
                            let stability = floorMap.stability[row][col]
                            let cellColor = colorForStability(stability)

                            Rectangle()
                                .fill(cellColor.opacity(opacity))
                                .frame(
                                    width: CGFloat(floorMap.cellSize * Float(geometry.size.width) / Float(floorMap.gridSize)),
                                    height: CGFloat(floorMap.cellSize * Float(geometry.size.height) / Float(floorMap.gridSize))
                                )
                                .position(
                                    x: CGFloat(col) * geometry.size.width / CGFloat(floorMap.gridSize) + geometry.size.width / CGFloat(floorMap.gridSize * 2),
                                    y: CGFloat(row) * geometry.size.height / CGFloat(floorMap.gridSize) + geometry.size.height / CGFloat(floorMap.gridSize * 2)
                                )
                        }
                    }
                }

                // Hazard markers
                if layer == .hazards || layer == .all {
                    ForEach(hazards) { hazard in
                        Circle()
                            .fill(hazard.riskLevel.color.opacity(opacity))
                            .frame(width: CGFloat(hazard.radius * 2 * 50), height: CGFloat(hazard.radius * 2 * 50))
                            .overlay(
                                Image(systemName: hazard.type.icon)
                                    .foregroundColor(.white)
                                    .font(.caption)
                            )
                            .position(hazardPosition(for: hazard, in: geometry))
                    }
                }
            }
        }
    }

    private func colorForStability(_ stability: Double) -> Color {
        if stability >= 0.8 {
            return .green
        } else if stability >= 0.6 {
            return .yellow
        } else if stability >= 0.4 {
            return .orange
        } else {
            return .red
        }
    }

    private func hazardPosition(for hazard: HazardData, in geometry: GeometryProxy) -> CGPoint {
        // Convert 3D world position to 2D screen position
        // Simplified: project XZ plane to XY screen coordinates
        let x = CGFloat(hazard.position.x) * geometry.size.width / 4.0 + geometry.size.width / 2.0
        let y = CGFloat(hazard.position.z) * geometry.size.height / 4.0 + geometry.size.height / 2.0
        return CGPoint(x: x, y: y)
    }
}

/// Heat map for hazard density
@available(iOS 16.0, *)
struct HazardHeatMap: View {
    let hazards: [HazardData]
    let opacity: Double

    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Background
                Color.gray.opacity(0.1)

                // Hazard density visualization
                ForEach(hazards) { hazard in
                    RadialGradient(
                        colors: [
                            hazard.riskLevel.color.opacity(opacity),
                            hazard.riskLevel.color.opacity(opacity * 0.3),
                            Color.clear
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: CGFloat(hazard.radius * 100)
                    )
                    .frame(
                        width: CGFloat(hazard.radius * 200),
                        height: CGFloat(hazard.radius * 200)
                    )
                    .position(hazardPosition(for: hazard, in: geometry))
                    .overlay(
                        Image(systemName: hazard.type.icon)
                            .foregroundColor(.white)
                            .font(.caption)
                            .position(hazardPosition(for: hazard, in: geometry))
                    )
                }
            }
        }
    }

    private func hazardPosition(for hazard: HazardData, in geometry: GeometryProxy) -> CGPoint {
        // Convert 3D world position to 2D screen position
        let x = CGFloat(hazard.position.x) * geometry.size.width / 4.0 + geometry.size.width / 2.0
        let y = CGFloat(hazard.position.z) * geometry.size.height / 4.0 + geometry.size.height / 2.0
        return CGPoint(x: x, y: y)
    }
}

struct LegendItem: View {
    let color: Color
    let label: String

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 12, height: 12)
            Text(label)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Preview

@available(iOS 16.0, *)
struct LiDARHeatMapView_Previews: PreviewProvider {
    static var previews: some View {
        let sampleHazards = [
            HazardData(position: simd_float3(1, 0, -2), type: .obstacle, riskLevel: .high, radius: 0.5),
            HazardData(position: simd_float3(-1, 0, -1), type: .stair, riskLevel: .medium, radius: 0.8),
            HazardData(position: simd_float3(0.5, 0, -0.5), type: .unevenFloor, riskLevel: .low, radius: 0.3)
        ]

        LiDARHeatMapView(hazards: sampleHazards, floorMap: nil)
            .previewDisplayName("LiDAR Heat Map View")
    }
}
