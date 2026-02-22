//
//  AROverlaySettingsSection.swift
//  Andernet Posture
//
//  Settings section for configuring AR overlay modes.
//  Designed to be embedded in SettingsView.
//

import SwiftUI

struct AROverlaySettingsSection: View {
    @AppStorage("arOverlayMode") private var overlayModeRaw = AROverlayMode.skeleton.rawValue
    @AppStorage("showAngleLabels") private var showAngleLabels = false
    @AppStorage("showPostureGuidelines") private var showPostureGuidelines = false

    private var selectedMode: AROverlayMode {
        AROverlayMode(rawValue: overlayModeRaw) ?? .skeleton
    }

    var body: some View {
        Section {
            Picker(selection: $overlayModeRaw) {
                ForEach(AROverlayMode.allCases) { mode in
                    Label(mode.displayName, systemImage: mode.iconName)
                        .tag(mode.rawValue)
                }
            } label: {
                Label("Overlay Mode", systemImage: "cube.transparent")
            }
            .pickerStyle(.menu)

            // Description of active mode
            Text(selectedMode.descriptionText)
                .font(.caption)
                .foregroundStyle(.secondary)
                .listRowSeparator(.hidden, edges: .bottom)

            Toggle(
                "Angle Labels",
                systemImage: "textformat.123",
                isOn: $showAngleLabels
            )

            Toggle(
                "Posture Guideline",
                systemImage: "arrow.down.to.line",
                isOn: $showPostureGuidelines
            )
        } header: {
            Text("AR Overlay")
        } footer: {
            Text("Overlay mode changes how the skeleton is visualised during capture. Angle labels and the guideline can be shown with any mode.")
        }
    }
}

// MARK: - Preview

#Preview("AR Overlay Settings") {
    NavigationStack {
        Form {
            AROverlaySettingsSection()
        }
        .navigationTitle("Settings")
    }
}
