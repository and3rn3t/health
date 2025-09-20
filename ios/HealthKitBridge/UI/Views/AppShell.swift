import SwiftUI

struct AppShell: View {
    var body: some View {
        TabView {
            // Home / Showcase
            GaitShowcaseHomeView()
                .tabItem {
                    Label(loc("home_tab_title", fallback: "Home"), systemImage: "house.fill")
                }

            // Settings
            SettingsView()
                .tabItem {
                    Label(loc("settings_tab_title", fallback: "Settings"), systemImage: "gearshape")
                }
        }
    }
}

private struct SettingsView: View {
    // Persisted user preferences
    @State private var enableHaptics: Bool = UserDefaults.standard.object(forKey: "enableHaptics") == nil ? true : UserDefaults.standard.bool(forKey: "enableHaptics")
    @State private var enableSimulationByDefault: Bool = UserDefaults.standard.bool(forKey: "enableSimulationByDefault")
    @State private var enablePseudoLocale: Bool = UserDefaults.standard.bool(forKey: "enablePseudoLocale")

    var body: some View {
        NavigationStack {
            Form {
                Section(header: L("settings_section_general")) {
                    Toggle(loc("settings_toggle_enable_haptics"), isOn: $enableHaptics)
                        .onChange(of: enableHaptics) { newValue in
                            Haptics.shared.setEnabled(newValue)
                            Telemetry.shared.record(.hapticsToggle(enabled: newValue))
                        }
                    Toggle(loc("settings_toggle_default_simulation"), isOn: $enableSimulationByDefault)
                        .onChange(of: enableSimulationByDefault) { newValue in
                            UserDefaults.standard.set(newValue, forKey: "enableSimulationByDefault")
                        }
                    Toggle("Pseudo-Locale (debug)", isOn: $enablePseudoLocale)
                        .onChange(of: enablePseudoLocale) { newValue in
                            setPseudoLocaleEnabled(newValue)
                            Telemetry.shared.record(.pseudoLocaleToggle(enabled: newValue))
                        }
                    #if DEBUG
                    NavigationLink("Telemetry Diagnostics") { TelemetryDiagnosticsView() }
                    NavigationLink("Permission Flow (debug)") { PermissionFlowView() }
                    #endif
                }

                Section(footer: Text(String(format: loc("settings_footer_copyright", fallback: "VitalSense © %d"), Calendar.current.component(.year, from: Date())))) {
                    HStack {
                        L("settings_version_label")
                        Spacer()
                        Text(Bundle.main.object(forInfoDictionaryKey: "CFBundleShortVersionString") as? String ?? "-")
                            .foregroundStyle(.secondary)
                            .accessibilityLabel(Text(loc("settings_version_a11y", fallback: "App Version")))
                    }
                }
            }
            .navigationTitle(L("settings_nav_title"))
            .toolbar { #if DEBUG
                ToolbarItem(placement: .navigationBarTrailing) {
                    if enablePseudoLocale { Text("Pseudo").font(.caption2).foregroundStyle(.secondary) }
                }
            #endif }
        }
    }
}

#Preview { AppShell() }

// MARK: - Fallback-capable localization overload (non-breaking for missing keys during iteration)
private extension String {
    /// Returns localized string for key if present, else provided fallback (dev convenience – not for production shipping builds ideally).
    static func localized(_ key: String, fallback: String) -> String {
        let value = NSLocalizedString(key, comment: "")
        return value == key ? fallback : value
    }
}

private func loc(_ key: String, fallback: String) -> String { String.localized(key, fallback: fallback) }
