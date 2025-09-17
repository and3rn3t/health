import SwiftUI

struct AppShell: View {
    var body: some View {
        TabView {
            // Home / Showcase
            GaitShowcaseHomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            // Settings (lightweight placeholder)
            SettingsView()
                .tabItem {
                    Label("Settings", systemImage: "gearshape")
                }
        }
    }
}

private struct SettingsView: View {
    @State private var enableHaptics: Bool = true
    @State private var enableSimulationByDefault: Bool = false

    var body: some View {
        NavigationStack {
            Form {
                Section(header: Text("General")) {
                    Toggle("Enable Haptics", isOn: $enableHaptics)
                    Toggle("Default to Simulation", isOn: $enableSimulationByDefault)
                }

                Section(footer: Text("VitalSense © \(Calendar.current.component(.year, from: Date()))")) {
                    HStack {
                        Text("Version")
                        Spacer()
                        Text(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "-")
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .navigationTitle("Settings")
        }
    }
}

#Preview {
    AppShell()
}
