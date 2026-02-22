//
//  CaptureAROverlayBar.swift
//  Andernet Posture
//
//  Floating overlay mode selector for the capture screen.
//  Horizontal scrolling pill bar that lets the user switch
//  AR overlay modes without leaving the capture session.
//

import SwiftUI

struct CaptureAROverlayBar: View {
    @AppStorage("arOverlayMode") private var overlayModeRaw = AROverlayMode.skeleton.rawValue
    @State private var showLabel = false
    @State private var labelTask: Task<Void, Never>?

    private var selectedMode: AROverlayMode {
        AROverlayMode(rawValue: overlayModeRaw) ?? .skeleton
    }

    var body: some View {
        VStack(spacing: 6) {
            // Transient mode name label
            if showLabel {
                Text(selectedMode.displayName)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.white)
                    .padding(.horizontal, 10)
                    .padding(.vertical, 4)
                    .background(.ultraThinMaterial, in: Capsule())
                    .transition(.opacity.combined(with: .scale(scale: 0.8)))
            }

            // Pill selector
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 8) {
                    ForEach(AROverlayMode.allCases) { mode in
                        Button {
                            selectMode(mode)
                        } label: {
                            Image(systemName: mode.iconName)
                                .font(.system(size: 14, weight: .medium))
                                .foregroundStyle(mode == selectedMode ? .white : .white.opacity(0.6))
                                .frame(width: 34, height: 34)
                                .background(
                                    mode == selectedMode
                                        ? AnyShapeStyle(.tint)
                                        : AnyShapeStyle(.clear)
                                )
                                .clipShape(Circle())
                        }
                        .buttonStyle(.plain)
                        .accessibilityLabel(mode.displayName)
                        .accessibilityAddTraits(mode == selectedMode ? .isSelected : [])
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
            }
            .background(.ultraThinMaterial.opacity(0.7), in: Capsule())
            .frame(maxWidth: 280)
        }
    }

    // MARK: - Actions

    private func selectMode(_ mode: AROverlayMode) {
        guard mode != selectedMode else { return }
        withAnimation(.easeInOut(duration: 0.2)) {
            overlayModeRaw = mode.rawValue
            showLabel = true
        }

        // Cancel previous hide-label task and schedule a new one
        labelTask?.cancel()
        labelTask = Task {
            try? await Task.sleep(for: .seconds(1.5))
            guard !Task.isCancelled else { return }
            withAnimation(.easeOut(duration: 0.3)) {
                showLabel = false
            }
        }
    }
}

// MARK: - Preview

#Preview("Capture AR Overlay Bar") {
    ZStack {
        Color.black.ignoresSafeArea()

        VStack {
            Spacer()
            CaptureAROverlayBar()
                .padding(.bottom, 80)
        }
    }
}
