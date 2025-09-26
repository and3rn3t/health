import SwiftUI

// Lightweight staged permission rationale flow (placeholder until full implementation).
struct PermissionFlowView: View {
    enum Stage: Int, CaseIterable { case initial, movement, fall, cardio, finished
        var key: String {
            switch self {
            case .initial: return "initial"
            case .movement: return "movement"
            case .fall: return "fall"
            case .cardio: return "cardio"
            case .finished: return "finished"
            }
        }
        var titleKey: String { "perm_stage_\(key)_title" }
        var descKey: String { "perm_stage_\(key)_desc" }
        func next() -> Stage? { Self.allCases.dropFirst(rawValue).first }
    }

    @State private var stage: Stage = .initial
    @State private var completed: Bool = false

    var body: some View {
        VStack(spacing: 24) {
            Text(loc(stage.titleKey, fallback: stage.key.capitalized))
                .font(.largeTitle.bold())
                .multilineTextAlignment(.center)
            Text(loc(stage.descKey, fallback: "Description"))
                .multilineTextAlignment(.leading)
                .font(.body)
                .foregroundStyle(.secondary)
            Spacer()
            if !completed {
                Button(action: advance) {
                    Text(stage == .finished ? loc("perm_finish_button", fallback: "Finish") : loc("perm_continue_button", fallback: "Continue"))
                        .padding(.horizontal, 32).padding(.vertical, 12)
                        .background(Capsule().fill(Color.accentColor))
                        .foregroundStyle(.white)
                }
            } else {
                Image(systemName: "checkmark.seal.fill").font(.largeTitle).foregroundStyle(.green)
                Text(loc("perm_diag_all_granted", fallback: "All requested types granted"))
                    .font(.headline)
            }
        }
        .padding()
        .navigationTitle(loc("perm_rationale_nav_title", fallback: "Health Data Access"))
        .onAppear { recordStage() }
        .animation(.easeInOut, value: stage)
    }

    private func advance() {
        if let next = stage.next() {
            stage = next
            recordStage()
            if next == .finished { Task { await requestAuthorization() } }
        } else {
            completed = true
            Telemetry.shared.record(.permissionFunnel(stage: "completed"))
        }
    }

    private func recordStage() {
        Telemetry.shared.record(.permissionFunnel(stage: stage.key))
    }

    private func requestAuthorization() async {
        // Wire into HealthKitManager request, recording funnel result
        Telemetry.shared.record(.permissionFunnel(stage: "request_start"))
        await HealthKitManager.shared.requestAuthorization()
        let success = HealthKitManager.shared.isAuthorized
        Telemetry.shared.record(.permissionFunnel(stage: success ? "authorized" : "denied"))
    }
}

#if DEBUG
struct PermissionFlowView_Previews: PreviewProvider { static var previews: some View { NavigationStack { PermissionFlowView() } } }
#endif
