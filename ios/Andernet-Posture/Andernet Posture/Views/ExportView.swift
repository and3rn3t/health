//
//  ExportView.swift
//  Andernet Posture
//
//  Phase 8: Export & Sharing — UI for choosing export format and sharing.
//

import SwiftUI

// MARK: - Export Format

/// Available export formats.
enum ExportFormat: String, Identifiable, CaseIterable {
    case pdf = "PDF Report"
    case csvSummary = "CSV Summary"
    case csvFrames = "CSV Frames"
    case csvSteps = "CSV Steps"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .pdf:        return "doc.richtext"
        case .csvSummary: return "tablecells"
        case .csvFrames:  return "chart.bar.doc.horizontal"
        case .csvSteps:   return "figure.walk"
        }
    }

    var subtitle: String {
        switch self {
        case .pdf:        return "Clinical-style report with severity indicators"
        case .csvSummary: return "All summary metrics in a single CSV"
        case .csvFrames:  return "Frame-by-frame body tracking data"
        case .csvSteps:   return "Individual step events with gait phases"
        }
    }
}

// MARK: - ExportView (Single Session)

/// Sheet presenting export options for a single `GaitSession`.
struct ExportView: View {
    let session: GaitSession
    @Environment(\.dismiss) private var dismiss
    @State private var generating = false
    @State private var generatedURL: URL?
    @State private var selectedFormat: ExportFormat?
    @State private var showShareSheet = false

    var body: some View {
        NavigationStack {
            List {
                sessionSummarySection
                exportOptionsSection
            }
            .navigationTitle("Export Session")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .overlay {
                if generating {
                    generatingOverlay
                }
            }
            .sheet(isPresented: $showShareSheet) {
                if let url = generatedURL {
                    ActivityView(url: url)
                        .presentationDetents([.medium, .large])
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    // MARK: - Sections

    private var sessionSummarySection: some View {
        Section("Session Preview") {
            LabeledContent("Date") {
                Text(session.date, style: .date)
            }
            LabeledContent("Duration") {
                Text(session.formattedDuration)
            }
            if let score = session.postureScore {
                LabeledContent("Posture Score") {
                    Text(String(format: "%.0f", score))
                }
            }
            if let speed = session.averageWalkingSpeedMPS {
                LabeledContent("Walking Speed") {
                    Text(String(format: "%.2f m/s", speed))
                }
            }
        }
    }

    private var exportOptionsSection: some View {
        Section("Export Format") {
            ForEach(ExportFormat.allCases) { format in
                Button {
                    generate(format)
                } label: {
                    exportRow(format)
                }
                .disabled(generating)
            }
        }
    }

    private func exportRow(_ format: ExportFormat) -> some View {
        HStack(spacing: 14) {
            Image(systemName: format.icon)
                .font(.title2)
                .foregroundStyle(.tint)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(format.rawValue)
                    .font(.body)
                    .foregroundStyle(.primary)
                Text(format.subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "square.and.arrow.up")
                .foregroundStyle(.secondary)
        }
        .contentShape(Rectangle())
    }

    private var generatingOverlay: some View {
        ZStack {
            Color.black.opacity(0.25).ignoresSafeArea()
            VStack(spacing: AppSpacing.md) {
                ProgressView()
                    .controlSize(.large)
                Text("Generating\u{2026}")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
            .padding(AppSpacing.xxxl)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        }
    }

    // MARK: - Generation

    @MainActor
    private func generate(_ format: ExportFormat) {
        generating = true
        selectedFormat = format
        let dateSuffix = fileDateSuffix(session.date)

        Task.detached {
            let (data, filename) = await buildExport(
                format: format,
                session: session,
                dateSuffix: dateSuffix
            )
            let url = ExportService.shareURL(for: data, filename: filename)
            await MainActor.run {
                generatedURL = url
                generating = false
                showShareSheet = true
            }
        }
    }

    @MainActor
    private func buildExport(
        format: ExportFormat,
        session: GaitSession,
        dateSuffix: String
    ) -> (Data, String) {
        switch format {
        case .pdf:
            let data = ExportService.generatePDFReport(for: session)
            return (data, "PostureReport_\(dateSuffix).pdf")
        case .csvSummary:
            let data = ExportService.generateCSV(for: session)
            return (data, "SessionData_\(dateSuffix).csv")
        case .csvFrames:
            let data = ExportService.generateFramesCSV(for: session)
            return (data, "FrameData_\(dateSuffix).csv")
        case .csvSteps:
            let data = ExportService.generateStepsCSV(for: session)
            return (data, "StepData_\(dateSuffix).csv")
        }
    }
}

// MARK: - Multi-Session Export

/// Sheet presenting export options for multiple sessions.
struct MultiSessionExportView: View {
    let sessions: [GaitSession]
    @Environment(\.dismiss) private var dismiss
    @State private var generating = false
    @State private var generatedURL: URL?
    @State private var showShareSheet = false

    var body: some View {
        NavigationStack {
            List {
                Section("Sessions") {
                    LabeledContent("Count") {
                        Text("\(sessions.count) sessions")
                    }
                    if let first = sessions.last?.date, let last = sessions.first?.date {
                        LabeledContent("Range") {
                            Text("\(first, style: .date) – \(last, style: .date)")
                        }
                    }
                }

                Section("Export Format") {
                    Button { generate(multiCSV: true) } label: {
                        exportRow(
                            icon: "tablecells",
                            title: "Multi-Session CSV",
                            subtitle: "One row per session, all metrics"
                        )
                    }
                    .disabled(generating)
                }
            }
            .navigationTitle("Export Sessions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Done") { dismiss() }
                }
            }
            .overlay {
                if generating {
                    generatingOverlay
                }
            }
            .sheet(isPresented: $showShareSheet) {
                if let url = generatedURL {
                    ActivityView(url: url)
                        .presentationDetents([.medium, .large])
                }
            }
        }
        .presentationDetents([.medium, .large])
    }

    private func exportRow(icon: String, title: String, subtitle: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundStyle(.tint)
                .frame(width: 32)
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .foregroundStyle(.primary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
            Spacer()
            Image(systemName: "square.and.arrow.up")
                .foregroundStyle(.secondary)
        }
        .contentShape(Rectangle())
    }

    private var generatingOverlay: some View {
        ZStack {
            Color.black.opacity(0.25).ignoresSafeArea()
            VStack(spacing: AppSpacing.md) {
                ProgressView()
                    .controlSize(.large)
                Text("Generating\u{2026}")
                    .font(.callout)
                    .foregroundStyle(.secondary)
            }
            .padding(AppSpacing.xxxl)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: AppRadius.medium))
        }
    }

    private func generate(multiCSV: Bool) {
        generating = true
        Task {
            let data = ExportService.generateMultiSessionCSV(sessions: sessions)
            let filename = "AllSessions_\(fileDateSuffix(Date())).csv"
            let url = ExportService.shareURL(for: data, filename: filename)
            generatedURL = url
            generating = false
            showShareSheet = true
        }
    }
}

// MARK: - UIActivityViewController wrapper

/// Wraps `UIActivityViewController` for use with SwiftUI `.sheet`.
private struct ActivityView: UIViewControllerRepresentable {
    let url: URL

    func makeUIViewController(context: Context) -> UIActivityViewController {
        UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }

    func updateUIViewController(_ vc: UIActivityViewController, context: Context) {}
}

// MARK: - Helpers

private func fileDateSuffix(_ date: Date) -> String {
    let f = DateFormatter()
    f.dateFormat = "yyyy-MM-dd"
    return f.string(from: date)
}
