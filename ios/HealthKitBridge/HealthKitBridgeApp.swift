import SwiftUI
import HealthKit

@main
struct HealthKitBridgeApp: App {
    @StateObject private var healthKitManager = HealthKitManager.shared
    @StateObject private var webSocketManager = WebSocketManager.shared
    @StateObject private var permissionCoordinator = HealthKitPermissionCoordinator.shared

    var body: some Scene {
        WindowGroup {
            RootLaunchRouter()
                .environmentObject(healthKitManager)
                .environmentObject(webSocketManager)
                .environmentObject(permissionCoordinator)
                .task { await initialStartup() }
        }
    }

    private func initialStartup() async {
        let tokenProvider: DeviceAuthTokenProvider = DevStaticTokenProvider()
        do {
            let token = try await tokenProvider.fetchToken()
            await webSocketManager.connect(with: token)
        } catch {
            Log.error("Failed to get device token: \(error.localizedDescription)", category: "auth")
        }
    }
}

// MARK: - Root Launch Router
private struct RootLaunchRouter: View {
    @EnvironmentObject private var permission: HealthKitPermissionCoordinator
    @EnvironmentObject private var health: HealthKitManager
    @EnvironmentObject private var ws: WebSocketManager
    @State private var showingDiagnostics = false

    var body: some View {
        Group {
            switch permission.stage {
            case .initial, .movementCore, .fallRisk, .cardioRecovery:
                PermissionStageView()
            case .finished:
                ContentView()
                    .toolbar { diagnosticsButton }
                    .modifier(DiagnosticsOverlayModifier())
            }
        }
        .sheet(isPresented: $showingDiagnostics) { PermissionDiagnosticsView() }
    }

    private var diagnosticsButton: some ToolbarContent {
        ToolbarItem(placement: .topBarTrailing) {
            Button { showingDiagnostics = true } label: {
                Image(systemName: "stethoscope")
            }
            .accessibilityLabel("Permission Diagnostics")
        }
    }
}

// MARK: - Permission Stage View
private struct PermissionStageView: View {
    @EnvironmentObject private var permission: HealthKitPermissionCoordinator
    @State private var isRequesting = false

    var body: some View {
        VStack(spacing: 24) {
            Text(stageTitle)
                .font(.title2.weight(.semibold))
                .multilineTextAlignment(.center)
            Text(stageDescription)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
                .padding(.horizontal)
            if let err = permission.lastError { Text(err).foregroundStyle(.red).font(.caption) }
            Button(action: { Task { await request() } }) {
                if isRequesting { ProgressView() } else { Text(buttonLabel).bold() }
            }
            .buttonStyle(.borderedProminent)
            .disabled(isRequesting)
        }
        .padding()
    }

    private func request() async {
        guard !isRequesting else { return }
        isRequesting = true
        await permission.advance()
        isRequesting = false
    }

    private var stageTitle: String {
        switch permission.stage {
        case .initial: return "Welcome to VitalSense"
        case .movementCore: return "Enable Core Movement"
        case .fallRisk: return "Advanced Fall Risk Metrics"
        case .cardioRecovery: return "Cardio & Recovery"
        case .finished: return "All Set" // not shown
        }
    }
    private var stageDescription: String {
        switch permission.stage {
        case .initial: return "We start with steps to personalize your daily activity baseline."
        case .movementCore: return "Distance, energy and heart rate help us contextualize gait quality and exertion."
        case .fallRisk: return "Granular gait metrics sharpen fall risk detection and early intervention."
        case .cardioRecovery: return "Recovery metrics refine long‑term mobility resilience insights."
        case .finished: return ""
        }
    }
    private var buttonLabel: String { permission.stage == .cardioRecovery ? "Finish" : "Continue" }
}

// MARK: - Diagnostics View
private struct PermissionDiagnosticsView: View {
    @EnvironmentObject private var permission: HealthKitPermissionCoordinator
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            List {
                Section("Missing Types") {
                    ForEach(permission.missingTypesSummary(), id: \.self) { id in
                        Text(id)
                            .font(.caption.monospaced())
                    }
                    if permission.missingTypesSummary().isEmpty { Text("All requested types granted") }
                }
            }
            .navigationTitle("Permissions")
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button("Done") { dismiss() } } }
        }
    }
}
