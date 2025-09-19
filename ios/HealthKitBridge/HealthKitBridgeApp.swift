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
            case .rationale, .initial, .movementCore, .fallRisk, .cardioRecovery:
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
    @State private var showRationale = false

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
        .onAppear { if permission.stage == .rationale { showRationale = true } }
        .sheet(isPresented: $showRationale) {
            PermissionRationaleView(
                types: rationaleTypes,
                onContinue: {
                    Haptics.shared.trigger(.selection)
                    showRationale = false
                    Task { await permission.advance() }
                },
                onDismiss: {
                    showRationale = false
                }
            )
        }
    }

    private func request() async {
        guard !isRequesting else { return }
        isRequesting = true
        await permission.advance()
        Haptics.shared.trigger(.selection)
        isRequesting = false
    }

    private var stageTitle: String {
        switch permission.stage {
        case .rationale: return loc("perm_rationale_title")
        case .initial: return loc("perm_stage_initial_title")
        case .movementCore: return loc("perm_stage_movement_title")
        case .fallRisk: return loc("perm_stage_fall_title")
        case .cardioRecovery: return loc("perm_stage_cardio_title")
        case .finished: return loc("perm_stage_finished_title")
        }
    }
    private var stageDescription: String {
        switch permission.stage {
        case .rationale: return loc("perm_rationale_intro")
        case .initial: return loc("perm_stage_initial_desc")
        case .movementCore: return loc("perm_stage_movement_desc")
        case .fallRisk: return loc("perm_stage_fall_desc")
        case .cardioRecovery: return loc("perm_stage_cardio_desc")
        case .finished: return ""
        }
    }
    private var buttonLabel: String { permission.stage == .cardioRecovery ? loc("perm_finish_button") : loc("perm_continue_button") }

    private var rationaleTypes: [PermissionRationaleView.RequiredType] {
        [
            .init(title: loc("perm_type_steps_title"), description: loc("perm_type_steps_desc"), systemImage: "figure.walk"),
            .init(title: loc("perm_type_heart_title"), description: loc("perm_type_heart_desc"), systemImage: "heart.fill"),
            .init(title: loc("perm_type_mobility_title"), description: loc("perm_type_mobility_desc"), systemImage: "figure.run")
        ]
    }
}

// MARK: - Diagnostics View
private struct PermissionDiagnosticsView: View {
    @EnvironmentObject private var permission: HealthKitPermissionCoordinator
    @Environment(\.dismiss) private var dismiss
    var body: some View {
        NavigationStack {
            List {
                Section(loc("perm_diag_missing_section")) {
                    ForEach(permission.missingTypesSummary(), id: \.self) { id in
                        Text(id)
                            .font(.caption.monospaced())
                    }
                    if permission.missingTypesSummary().isEmpty { Text(loc("perm_diag_all_granted")) }
                }
            }
            .navigationTitle(loc("perm_diag_nav_title"))
            .toolbar { ToolbarItem(placement: .topBarTrailing) { Button(loc("done_button")) { dismiss() } } }
        }
    }
}
