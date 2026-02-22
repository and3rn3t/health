//
//  ExportServiceProtocol.swift
//  Andernet Posture
//
//  Protocol abstraction for ExportService to enable testability.
//  Since ExportService is a static enum, this protocol wraps its
//  interface for dependency injection in ViewModels.
//

import Foundation

/// Abstraction over session export functionality.
/// Enables mocking PDF/CSV generation in tests.
protocol ExportServiceProtocol: Sendable {
    /// Generate a single-session summary CSV.
    func generateCSV(for session: GaitSession) -> Data

    /// Generate a CSV of all body frames for a session.
    func generateFramesCSV(for session: GaitSession) -> Data

    /// Generate a CSV of all step events for a session.
    func generateStepsCSV(for session: GaitSession) -> Data

    /// Generate a PDF clinical report for a session.
    func generatePDFReport(for session: GaitSession) -> Data

    /// Generate a multi-session comparison CSV.
    func generateMultiSessionCSV(sessions: [GaitSession]) -> Data

    /// Write data to a temp file and return a shareable URL.
    func shareURL(for data: Data, filename: String) -> URL
}

// MARK: - Default Implementation (delegates to existing static enum)

/// Bridges the existing static `ExportService` enum to the protocol.
struct DefaultExportServiceAdapter: ExportServiceProtocol {
    func generateCSV(for session: GaitSession) -> Data {
        ExportService.generateCSV(for: session)
    }

    func generateFramesCSV(for session: GaitSession) -> Data {
        ExportService.generateFramesCSV(for: session)
    }

    func generateStepsCSV(for session: GaitSession) -> Data {
        ExportService.generateStepsCSV(for: session)
    }

    func generatePDFReport(for session: GaitSession) -> Data {
        ExportService.generatePDFReport(for: session)
    }

    func generateMultiSessionCSV(sessions: [GaitSession]) -> Data {
        ExportService.generateMultiSessionCSV(sessions: sessions)
    }

    func shareURL(for data: Data, filename: String) -> URL {
        ExportService.shareURL(for: data, filename: filename)
    }
}
