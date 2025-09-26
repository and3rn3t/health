import SwiftUI

/// Debug overlay showing runtime diagnostic info. Compiled out in Release builds.
struct DiagnosticsOverlayModifier: ViewModifier {
    #if DEBUG
    @EnvironmentObject private var permission: HealthKitPermissionCoordinator
    @EnvironmentObject private var health: HealthKitManager
    @EnvironmentObject private var ws: WebSocketManager
    @State private var visible: Bool = false
    #endif

    func body(content: Content) -> some View {
        #if DEBUG
        content
            .overlay(alignment: .topTrailing) {
                if visible { panel }
            }
            .onAppear { installGesture() }
        #else
        content
        #endif
    }

    #if DEBUG
    private var panel: some View {
        VStack(alignment: .trailing, spacing: 4) {
            Text("Stage: \(permission.stage.rawValue)").font(.caption2)
            Text("HK Auth: \(health.authorizationStatus == .sharingAuthorized ? "yes" : "no")").font(.caption2)
            Text("Queries: \(health.activeQueries.count)").font(.caption2)
            Text("WS: \(ws.connectionStatus)").font(.caption2)
        }
        .padding(8)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 8, style: .continuous))
        .padding(8)
        .transition(.move(edge: .top).combined(with: .opacity))
    }

    private func installGesture() {
        Log.debug("Installing diagnostics overlay gesture", category: .diagnostics)
        let tapGesture = UITapGestureRecognizer(target: GestureProxy.shared, action: #selector(GestureProxy.shared.handleTap(_:)))
        tapGesture.numberOfTapsRequired = 3
        UIApplication.shared.connectedScenes.compactMap { ($0 as? UIWindowScene)?.windows.first }.first?.addGestureRecognizer(tapGesture)
        GestureProxy.shared.onTripleTap = { visible.toggle() }
    }

    private final class GestureProxy: NSObject {
        static let shared = GestureProxy()
        var onTripleTap: (() -> Void)?
        @objc func handleTap(_ sender: UITapGestureRecognizer) {
            Log.debug("Diagnostics overlay triple tap detected", category: .diagnostics)
            onTripleTap?()
        }
    }
    #endif
}
