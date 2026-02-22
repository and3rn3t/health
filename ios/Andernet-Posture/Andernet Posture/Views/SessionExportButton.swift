//
//  SessionExportButton.swift
//  Andernet Posture
//
//  Phase 8: Reusable export button & toolbar modifier.
//

import SwiftUI

// MARK: - SessionExportButton

/// A standalone share button that presents `ExportView` for a single session.
struct SessionExportButton: View {
    let session: GaitSession
    @State private var showExport = false

    var body: some View {
        Button {
            showExport = true
        } label: {
            Image(systemName: "square.and.arrow.up")
        }
        .sheet(isPresented: $showExport) {
            ExportView(session: session)
        }
    }
}

// MARK: - MultiSessionExportButton

/// A standalone share button that presents `MultiSessionExportView`.
struct MultiSessionExportButton: View {
    let sessions: [GaitSession]
    @State private var showExport = false

    var body: some View {
        Button {
            showExport = true
        } label: {
            Image(systemName: "square.and.arrow.up")
        }
        .disabled(sessions.isEmpty)
        .sheet(isPresented: $showExport) {
            MultiSessionExportView(sessions: sessions)
        }
    }
}

// MARK: - SessionExportToolbar ViewModifier

/// A `ViewModifier` that adds an export toolbar button for a single session.
///
/// Usage:
/// ```swift
/// SomeView()
///     .modifier(SessionExportToolbar(session: mySession))
/// ```
struct SessionExportToolbar: ViewModifier {
    let session: GaitSession
    @State private var showExport = false

    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showExport = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .sheet(isPresented: $showExport) {
                        ExportView(session: session)
                    }
                }
            }
    }
}

// MARK: - MultiSessionExportToolbar ViewModifier

/// A `ViewModifier` that adds an export toolbar button for multiple sessions.
struct MultiSessionExportToolbar: ViewModifier {
    let sessions: [GaitSession]
    @State private var showExport = false

    func body(content: Content) -> some View {
        content
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button {
                        showExport = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                    .disabled(sessions.isEmpty)
                    .sheet(isPresented: $showExport) {
                        MultiSessionExportView(sessions: sessions)
                    }
                }
            }
    }
}

// MARK: - View Extension

extension View {
    /// Adds a toolbar export button for a single session.
    func sessionExportToolbar(session: GaitSession) -> some View {
        modifier(SessionExportToolbar(session: session))
    }

    /// Adds a toolbar export button for multiple sessions.
    func multiSessionExportToolbar(sessions: [GaitSession]) -> some View {
        modifier(MultiSessionExportToolbar(sessions: sessions))
    }
}
