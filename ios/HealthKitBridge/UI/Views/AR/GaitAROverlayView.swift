import SwiftUI

#if canImport(ARKit) && canImport(RealityKit)
import ARKit
import RealityKit

@MainActor
struct GaitAROverlayView: UIViewRepresentable {
    var protocolName: String? = nil
    var goalDistanceMeters: Float? = nil
    var onStabilityUpdate: ((Float) -> Void)? = nil
    func makeCoordinator() -> Coordinator { Coordinator() }

    func makeUIView(context: Context) -> ARView {
        let view = ARView(frame: .zero)

        // Configure LiDAR session if available
        let config = ARWorldTrackingConfiguration()
        config.sceneReconstruction = .mesh
        config.planeDetection = [.horizontal]
        config.environmentTexturing = .automatic
        view.session.run(config)

    // Coordinator: session delegate + anchors
    view.session.delegate = context.coordinator
    context.coordinator.attach(to: view)
    context.coordinator.goalDistanceMeters = goalDistanceMeters
    context.coordinator.onStabilityUpdate = onStabilityUpdate

        // AR Coaching overlay for better plane finding UX
        let coaching = ARCoachingOverlayView()
        coaching.goal = .horizontalPlane
        coaching.activatesAutomatically = true
        coaching.session = view.session
        coaching.translatesAutoresizingMaskIntoConstraints = false
        view.addSubview(coaching)
        NSLayoutConstraint.activate([
            coaching.topAnchor.constraint(equalTo: view.topAnchor),
            coaching.bottomAnchor.constraint(equalTo: view.bottomAnchor),
            coaching.leadingAnchor.constraint(equalTo: view.leadingAnchor),
            coaching.trailingAnchor.constraint(equalTo: view.trailingAnchor)
        ])

        return view
    }

    func updateUIView(_ uiView: ARView, context: Context) {}

    // MARK: - Coordinator
    final class Coordinator: NSObject, ARSessionDelegate {
        private weak var arView: ARView?
        private var stepsAnchor = AnchorEntity(world: [0, 0, 0])
        private var planeEntities: [UUID: ModelEntity] = [:]
        private var stepTimer: Timer?
        private var isLeft: Bool = true
        private var floorY: Float?
    private var lastStepWorldPos: SIMD3<Float>?
    private var lastHeading: SIMD3<Float>? // forward vector
        // Simple pools to reduce allocations
        private var stepPool: [ModelEntity] = []
        private var connectorPool: [ModelEntity] = []
    private var toePool: [ModelEntity] = []
    private var deviations: [Float] = []
    var goalDistanceMeters: Float?
    private var distanceMarkers: [ModelEntity] = []
    var onStabilityUpdate: ((Float) -> Void)?

        func attach(to view: ARView) {
            arView = view
            view.scene.addAnchor(stepsAnchor)
            startFootstepTimer()
            addDistanceMarkersIfNeeded()
        }

        func session(_ session: ARSession, didAdd anchors: [ARAnchor]) {
            for anchor in anchors {
                guard let plane = anchor as? ARPlaneAnchor, plane.alignment == .horizontal else { continue }
                addOrUpdatePlaneEntity(for: plane)
            }
        }

        func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
            for anchor in anchors {
                guard let plane = anchor as? ARPlaneAnchor, plane.alignment == .horizontal else { continue }
                addOrUpdatePlaneEntity(for: plane)
            }
        }

        private func addOrUpdatePlaneEntity(for plane: ARPlaneAnchor) {
            guard let view = arView else { return }
            let extent = plane.extent
            let center = plane.center

            let size = MeshResource.generatePlane(width: .init(extent.x), height: .init(extent.z))
            let material = SimpleMaterial(color: .init(white: 1, alpha: 0.08), isMetallic: false)

            let entity: ModelEntity
            if let existing = planeEntities[plane.identifier] {
                existing.model?.mesh = size
                existing.model?.materials = [material]
                entity = existing
            } else {
                entity = ModelEntity(mesh: size, materials: [material])
                entity.generateCollisionShapes(recursive: false)
                stepsAnchor.addChild(entity)
                planeEntities[plane.identifier] = entity
            }

            // Position the plane entity using anchor transform
            let transform = plane.transform
            entity.position = SIMD3<Float>(center.x, transform.columns.3.y, center.z)
            entity.orientation = simd_quatf(transform)

            // Track floor height for footstep placement
            floorY = transform.columns.3.y

            // Light outline to make plane visible
            entity.components.set(OpacityComponent(opacity: 0.85))
        }

        private func startFootstepTimer() {
            stepTimer?.invalidate()
            stepTimer = Timer.scheduledTimer(withTimeInterval: 0.6, repeats: true) { [weak self] _ in
                self?.spawnFootstep()
            }
            if let stepTimer { RunLoop.main.add(stepTimer, forMode: .common) }
        }

        private func spawnFootstep() {
            guard let view = arView else { return }
            guard let cameraTransform = view.session.currentFrame?.camera.transform else { return }

            // Compute a point in front of the camera on the horizontal plane
            let camPos = cameraTransform.translation
            let forward = -SIMD3<Float>(cameraTransform.columns.2.x, cameraTransform.columns.2.y, cameraTransform.columns.2.z)
            let newForward = simd_normalize(forward)
            let baseDist: Float = 0.5
            let lateral: Float = isLeft ? -0.12 : 0.12
            let up = SIMD3<Float>(0, 1, 0)
            let right = simd_normalize(simd_cross(forward, up))

            var target = camPos + forward * baseDist + right * lateral
            if let floorY { target.y = floorY }

            // Get a footprint entity (pooled) and configure
            let color: UIColor = isLeft ? .systemTeal : .systemBlue
            let stepEntity = popStepEntity(color: color)
            stepEntity.position = target
            stepEntity.orientation = simd_quatf(from: [0, 0, 1], to: simd_normalize(forward))

            stepsAnchor.addChild(stepEntity)
            animateAppear(stepEntity)
            scheduleFadeAndRecycle(stepEntity, pool: &stepPool, after: 6.0)

            // Toe clearance marker (animated upward pulse)
            addToeMarker(at: target, baseColor: color)

            // Draw a connector strip from last step
            if let prev = lastStepWorldPos {
                let lateralDeviation = computeLateralDeviation(from: prev, to: target, heading: newForward)
                deviations.append(lateralDeviation)
                if deviations.count > 20 { deviations.removeFirst() }
                // Notify stability (0..1 where 1 is stable)
                if let onStabilityUpdate {
                    let stability = computeStabilityIndex()
                    onStabilityUpdate(stability)
                }
                let connector = addConnector(from: prev, to: target, deviation: lateralDeviation)
                scheduleFadeAndRecycle(connector, pool: &connectorPool, after: 6.0)
                // Sway band under the connector
                addSwayBand(centerA: prev, centerB: target)
            }
            isLeft.toggle()

            // Turn indicator: compare heading change
            if let lh = lastHeading {
                let dot = simd_dot(lh, newForward)
                if dot < 0.94 { // ~20 degrees
                    addTurnArc(at: target, normal: newForward)
                }
            }
            lastHeading = newForward
            lastStepWorldPos = target
        }

        private func animateAppear(_ entity: ModelEntity) {
            entity.setScale([0.2, 0.2, 0.2], relativeTo: nil)
            let target: SIMD3<Float> = [1, 1, 1]
            entity.move(to: .init(scale: target, rotation: entity.orientation, translation: entity.position),
                        relativeTo: nil,
                        duration: 0.25,
                        timingFunction: .easeOut)
        }

        @discardableResult
        private func addConnector(from a: SIMD3<Float>, to b: SIMD3<Float>, deviation: Float = 0) -> ModelEntity {
            // Thin box between points a and b
            let delta = b - a
            let length = simd_length(delta)
            guard length > 0.001 else { return }
            let center = (a + b) / 2
            let dir = simd_normalize(delta)

            let connector = popConnectorEntity(length: length)
            // Color shifts toward red as deviation increases (> 0.2m)
            let clamped = min(max(deviation / 0.2, 0), 1)
            let base = UIColor(white: 1, alpha: 0.15)
            let alert = UIColor(red: 1.0, green: 0.3, blue: 0.2, alpha: 0.35)
            let mixed = blend(base: base, overlay: alert, t: CGFloat(clamped))
            connector.model?.materials = [SimpleMaterial(color: mixed, isMetallic: false)]
            connector.position = center
            connector.orientation = simd_quatf(from: [0, 0, 1], to: dir)
            stepsAnchor.addChild(connector)
            return connector
        }

        private func scheduleFadeAndRecycle(_ entity: ModelEntity, pool: inout [ModelEntity], after seconds: TimeInterval) {
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { [weak entity] in
                guard let e = entity else { return }
                e.components.set(OpacityComponent(opacity: 1.0))
                e.fade(to: 0.0, duration: 0.5)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.55) {
                    e.removeFromParent()
                    pool.append(e)
                }
            }
        }

        private func scheduleFadeAndRemove(_ entity: ModelEntity, after seconds: TimeInterval) {
            DispatchQueue.main.asyncAfter(deadline: .now() + seconds) { [weak entity] in
                guard let e = entity else { return }
                e.components.set(OpacityComponent(opacity: 1.0))
                e.fade(to: 0.0, duration: 0.4)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                    e.removeFromParent()
                }
            }
        }

        private func addTurnArc(at position: SIMD3<Float>, normal: SIMD3<Float>) {
            // Short curved indicator aligned with forward direction
            let radius: Float = 0.15
            let thickness: Float = 0.006
            let segments = 10
            var lastPoint = position
            for i in 1...segments {
                let angle = Float(i) / Float(segments) * .pi / 6 // 30 degrees arc
                // Build a local frame from normal forward vector
                let up = SIMD3<Float>(0, 1, 0)
                let right = simd_normalize(simd_cross(normal, up))
                let forward = simd_normalize(normal)
                let dir = simd_normalize(cos(angle) * forward + sin(angle) * right)
                let point = position + dir * radius
                let connector = addConnector(from: lastPoint, to: point)
                connector.model?.materials = [SimpleMaterial(color: .init(red: 0.2, green: 0.8, blue: 1.0, alpha: 0.25), isMetallic: false)]
                scheduleFadeAndRemove(connector, after: 3.0)
                lastPoint = point
            }
        }

        // MARK: - Helpers (pooling, deviation, toe marker)
        private func popStepEntity(color: UIColor) -> ModelEntity {
            if let e = stepPool.popLast() {
                // Update material/color and scale
                var material = SimpleMaterial(color: color, isMetallic: false)
                material.tintColor = color.withAlphaComponent(0.85)
                e.model = ModelComponent(mesh: MeshResource.generateBox(size: [0.06, 0.002, 0.12]), materials: [material])
                return e
            }
            let mesh = MeshResource.generateBox(size: [0.06, 0.002, 0.12])
            var material = SimpleMaterial(color: color, isMetallic: false)
            material.tintColor = color.withAlphaComponent(0.85)
            return ModelEntity(mesh: mesh, materials: [material])
        }

        private func popConnectorEntity(length: Float) -> ModelEntity {
            if let e = connectorPool.popLast() {
                e.model = ModelComponent(mesh: MeshResource.generateBox(size: [0.01, 0.001, length]), materials: e.model?.materials ?? [])
                return e
            }
            let mesh = MeshResource.generateBox(size: [0.01, 0.001, length])
            return ModelEntity(mesh: mesh, materials: [SimpleMaterial(color: .init(white: 1, alpha: 0.15), isMetallic: false)])
        }

        private func popToeEntity() -> ModelEntity {
            if let e = toePool.popLast() {
                e.model = ModelComponent(mesh: MeshResource.generateSphere(radius: 0.01))
                return e
            }
            let mesh = MeshResource.generateSphere(radius: 0.01)
            return ModelEntity(mesh: mesh, materials: [SimpleMaterial(color: .init(red: 0.8, green: 1.0, blue: 0.7, alpha: 0.9), isMetallic: false)])
        }

        private func addToeMarker(at base: SIMD3<Float>, baseColor: UIColor) {
            // Height approximates toe clearance (placeholder: based on step alternation)
            let height: Float = isLeft ? 0.035 : 0.05
            let marker = popToeEntity()
            marker.position = [base.x, base.y + height, base.z]
            stepsAnchor.addChild(marker)
            // Gentle rise/fall pulse
            let up = marker.position + [0, 0.01, 0]
            marker.move(to: .init(translation: up), relativeTo: nil, duration: 0.15, timingFunction: .easeOut)
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.2) {
                marker.move(to: .init(translation: base), relativeTo: nil, duration: 0.2, timingFunction: .easeIn)
            }
            scheduleFadeAndRecycle(marker, pool: &toePool, after: 1.2)
        }

        private func computeLateralDeviation(from a: SIMD3<Float>, to b: SIMD3<Float>, heading: SIMD3<Float>) -> Float {
            // Project vector onto right vector to estimate lateral component
            let up = SIMD3<Float>(0, 1, 0)
            let fwd = simd_normalize(heading)
            let right = simd_normalize(simd_cross(fwd, up))
            let delta = b - a
            let lateral = abs(simd_dot(delta, right))
            return lateral
        }

        private func blend(base: UIColor, overlay: UIColor, t: CGFloat) -> UIColor {
            var rb: CGFloat = 0, gb: CGFloat = 0, bb: CGFloat = 0, ab: CGFloat = 0
            var ro: CGFloat = 0, go: CGFloat = 0, bo: CGFloat = 0, ao: CGFloat = 0
            base.getRed(&rb, green: &gb, blue: &bb, alpha: &ab)
            overlay.getRed(&ro, green: &go, blue: &bo, alpha: &ao)
            let r = rb + (ro - rb) * t
            let g = gb + (go - gb) * t
            let b = bb + (bo - bb) * t
            let a = ab + (ao - ab) * t
            return UIColor(red: r, green: g, blue: b, alpha: a)
        }

        private func addSwayBand(centerA: SIMD3<Float>, centerB: SIMD3<Float>) {
            // Create a wider, faint box under connector to visualize sway region
            let delta = centerB - centerA
            let length = simd_length(delta)
            guard length > 0.001 else { return }
            let center = (centerA + centerB) / 2
            let dir = simd_normalize(delta)
            let stability = computeStabilityIndex() // 0..1
            let width: Float = 0.12 + (1 - stability) * 0.28 // 0.12..0.40 m
            let alpha: CGFloat = 0.04 + CGFloat((1 - stability) * 0.06) // 0.04..0.10
            let mesh = MeshResource.generateBox(size: [width, 0.0005, length])
            let band = ModelEntity(mesh: mesh, materials: [SimpleMaterial(color: UIColor(white: 1, alpha: alpha), isMetallic: false)])
            band.position = center
            band.orientation = simd_quatf(from: [0, 0, 1], to: dir)
            stepsAnchor.addChild(band)
            scheduleFadeAndRecycle(band, pool: &connectorPool, after: 2.5)
        }

        private func addDistanceMarkersIfNeeded() {
            guard let view = arView, let floorY, let goal = goalDistanceMeters, goal > 0 else { return }
            // Place small markers every 1m up to goal distance along camera forward
            guard let cameraTransform = view.session.currentFrame?.camera.transform else { return }
            let camPos = cameraTransform.translation
            let forward = -SIMD3<Float>(cameraTransform.columns.2.x, cameraTransform.columns.2.y, cameraTransform.columns.2.z)
            for i in 1...Int(goal) {
                let dist = Float(i)
                var pos = camPos + simd_normalize(forward) * dist
                pos.y = floorY
                let isFinish = i == Int(goal)
                let isMajor = i % 5 == 0 || isFinish
                let size: SIMD3<Float> = isFinish ? [0.08, 0.02, 0.08] : (isMajor ? [0.05, 0.01, 0.05] : [0.03, 0.003, 0.03])
                let color: UIColor = isFinish ? UIColor(red: 1.0, green: 0.85, blue: 0.2, alpha: 0.9) : UIColor(white: 1, alpha: isMajor ? 0.45 : 0.3)
                let marker = ModelEntity(mesh: .generateBox(size: size), materials: [SimpleMaterial(color: color, isMetallic: false)])
                marker.position = pos
                stepsAnchor.addChild(marker)
                distanceMarkers.append(marker)
            }
        }

        // Stability index: 1.0 (stable) down to 0.0 (unstable) based on recent lateral deviation variance
        private func computeStabilityIndex() -> Float {
            guard deviations.count >= 3 else { return 1.0 }
            let mean = deviations.reduce(0, +) / Float(deviations.count)
            let variance = deviations.reduce(0) { $0 + powf($1 - mean, 2) } / Float(deviations.count)
            let std = sqrtf(variance)
            // Normalize: assume 0.0..0.15m typical; beyond 0.15 treated as unstable
            let normalized = min(max(std / 0.15, 0), 1)
            return 1 - normalized
        }
    }
}
#else
struct GaitAROverlayView: View {
    var protocolName: String?
    var goalDistanceMeters: Float?
    var onStabilityUpdate: ((Float) -> Void)?
    @State private var steps: [CGPoint] = []
    @State private var timer: Timer?
    @State private var isLeft: Bool = true

    var body: some View {
        ZStack {
            RoundedRectangle(cornerRadius: 12)
                .fill(.thinMaterial)
            GeometryReader { geo in
                ZStack {
                    // Path line connecting steps (with broader band underlay)
                    Path { path in
                        guard steps.count > 1 else { return }
                        path.move(to: steps[0])
                        for point in steps.dropFirst() { path.addLine(to: point) }
                    }
                    .stroke(.teal.opacity(0.12), style: StrokeStyle(lineWidth: 10, lineCap: .round, lineJoin: .round))

                    // Fine line on top
                    Path { path in
                        guard steps.count > 1 else { return }
                        path.move(to: steps[0])
                        for point in steps.dropFirst() { path.addLine(to: point) }
                    }
                    .stroke(LinearGradient(colors: [.teal.opacity(0.5), .blue.opacity(0.5)], startPoint: .top, endPoint: .bottom), lineWidth: 2)

                    // Simulated forward path of footsteps
                    ForEach(steps.indices, id: \.self) { idx in
                        let stepPoint = steps[idx]
                        Circle()
                            .fill(idx % 2 == 0 ? Color.teal.opacity(0.8) : Color.blue.opacity(0.8))
                            .frame(width: 10, height: 16)
                            .position(stepPoint)
                            .opacity(Double(idx + 5) / Double(steps.count + 5))
                    }
                    // Distance markers for preview (if provided)
                    if let goal = goalDistanceMeters, goal > 0 {
                        ForEach(1...Int(goal), id: \.self) { meter in
                            let y = geo.size.height - 20 - CGFloat(meter) * 10
                            let isFinish = meter == Int(goal)
                            let isMajor = meter % 5 == 0 || isFinish
                            RoundedRectangle(cornerRadius: isFinish ? 6 : 2)
                                .fill(isFinish ? Color.yellow.opacity(0.9) : Color.white.opacity(isMajor ? 0.45 : 0.25))
                                .frame(width: isFinish ? 18 : (isMajor ? 10 : 6), height: isFinish ? 6 : (isMajor ? 3 : 2))
                                .position(CGPoint(x: geo.size.width / 2, y: max(16, y)))
                            // Labels
                            if isMajor && !isFinish {
                                Text("\(meter)m")
                                    .font(.system(size: 8, weight: .medium))
                                    .foregroundStyle(.secondary)
                                    .position(CGPoint(x: geo.size.width / 2 + 20, y: max(16, y)))
                            } else if isFinish {
                                Text("Finish")
                                    .font(.system(size: 10, weight: .semibold))
                                    .foregroundStyle(.yellow)
                                    .position(CGPoint(x: geo.size.width / 2 + 24, y: max(16, y)))
                            }
                        }
                    }
                }
                .onAppear {
                    startSim(geo.size)
                }
                .onDisappear { stopSim() }
            }
            VStack(spacing: 6) {
                Image(systemName: "arkit")
                    .font(.headline)
                    .foregroundStyle(.secondary)
                Text("AR preview (simulated footsteps)")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            .padding(8)
            .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .topLeading)
        }
        .frame(height: 140)
    }

    private func startSim(_ size: CGSize) {
        stopSim()
        let midX = size.width / 2
        var y: CGFloat = size.height - 20
        steps = []
        timer = Timer.scheduledTimer(withTimeInterval: 0.5, repeats: true) { scheduledTimer in
            if y < 20 { scheduledTimer.invalidate(); return }
            let xOffset: CGFloat = isLeft ? -14 : 14
            let point = CGPoint(x: midX + xOffset, y: y)
            steps.append(point)
            if steps.count > 40 { steps.removeFirst() }
            y -= 10
            isLeft.toggle()
            // Compute simple lateral deviation std over last N points
            let last = steps.suffix(12)
            if last.count > 3 {
                let xs = last.map { $0.x }
                let mean = xs.reduce(0, +) / CGFloat(xs.count)
                let variance = xs.reduce(0) { $0 + pow($1 - mean, 2) } / CGFloat(xs.count)
                let std = sqrt(variance)
                // Normalize vs 14px step width -> 0..1
                let normalized = min(max(Double(std / 14.0), 0.0), 1.0)
                let stability = Float(1.0 - normalized)
                onStabilityUpdate?(stability)
            }
        }
        RunLoop.main.add(timer!, forMode: .common)
    }

    private func stopSim() {
        timer?.invalidate(); timer = nil
    }
}
#endif
