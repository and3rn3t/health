//
//  ServiceTests.swift
//  Andernet PostureTests
//
//  Phase 11: Comprehensive unit tests for services and utilities.
//

import Testing
import Foundation
import simd
@testable import Andernet_Posture

// MARK: - InsightsEngine Tests

struct InsightsEngineTests {

    let engine = DefaultInsightsEngine()

    @Test func noSessionsNoInsights() async throws {
        let insights = engine.generateInsights(from: [])
        #expect(
            insights.isEmpty,
            "Empty session array should produce no insights"
        )
    }

    @Test func singleSessionGeneratesInsights() async throws {
        let session = GaitSession(
            date: .now,
            duration: 120,
            averageCadenceSPM: 105,
            averageStrideLengthM: 0.65,
            postureScore: 72,
            totalSteps: 80
        )
        session.averageWalkingSpeedMPS = 0.6
        session.averageCVADeg = 35

        let insights = engine.generateInsights(from: [session])
        #expect(
            insights.count >= 1,
            "A session with clinical data should generate at least 1 insight"
        )
    }

    @Test func trendDetection() async throws {
        let cal = Calendar.current
        let now = Date()

        // 3 sessions last week with good posture
        var sessions: [GaitSession] = []
        for i in 0..<3 {
            let date = cal.date(
                byAdding: .day, value: -(10 + i), to: now
            )!
            let s = GaitSession(
                date: date, duration: 120, postureScore: 85
            )
            sessions.append(s)
        }

        // 3 sessions this week with declining posture
        for i in 0..<3 {
            let date = cal.date(
                byAdding: .day, value: -(i + 1), to: now
            )!
            let s = GaitSession(
                date: date, duration: 120, postureScore: 55
            )
            sessions.append(s)
        }

        let insights = engine.generateInsights(from: sessions)
        let postureInsights = insights.filter {
            $0.category == .posture
        }
        #expect(
            !postureInsights.isEmpty,
            "Declining posture trend should generate posture insight"
        )
    }

    @Test func milestoneInsight() async throws {
        // Create exactly 10 sessions to trigger milestone
        let sessions = (0..<10).map { i in
            GaitSession(
                date: Date(timeIntervalSinceNow: Double(-i) * 86400),
                duration: 60,
                postureScore: 75
            )
        }

        let insights = engine.generateInsights(from: sessions)
        let milestones = insights.filter {
            $0.category == .progress
        }
        #expect(
            !milestones.isEmpty,
            "10 sessions should trigger a milestone insight"
        )
    }
}

// MARK: - ExportService Tests

struct ExportServiceTests {

    @Test func csvSummaryContainsHeaders() async throws {
        let session = GaitSession(
            date: .now,
            duration: 90,
            averageCadenceSPM: 110,
            averageStrideLengthM: 0.72,
            postureScore: 80,
            totalSteps: 50
        )

        let data = ExportService.generateCSV(for: session)
        let csv = String(data: data, encoding: .utf8) ?? ""

        #expect(
            csv.hasPrefix("Metric,Value"),
            "CSV should start with Metric,Value header"
        )
        #expect(
            csv.contains("Posture Score"),
            "CSV should contain Posture Score metric"
        )
        #expect(
            csv.contains("Duration"),
            "CSV should contain Duration metric"
        )
    }

    @Test func csvFramesContainsHeaders() async throws {
        let frames = [
            BodyFrame(
                timestamp: 0, joints: [:],
                sagittalTrunkLeanDeg: 3.0
            ),
            BodyFrame(
                timestamp: 0.033, joints: [:],
                sagittalTrunkLeanDeg: 3.5
            ),
        ]
        let framesData = GaitSession.encode(frames)
        let session = GaitSession(
            date: .now, duration: 0.066, framesData: framesData
        )

        let data = ExportService.generateFramesCSV(for: session)
        let csv = String(data: data, encoding: .utf8) ?? ""

        #expect(
            csv.contains("Timestamp"),
            "Frames CSV should contain Timestamp header"
        )
        #expect(
            csv.contains("PostureScore"),
            "Frames CSV should contain PostureScore header"
        )
    }

    @Test func multiSessionCSVRowCount() async throws {
        let sessions = (0..<4).map { i in
            GaitSession(
                date: Date(timeIntervalSince1970: Double(i) * 1000),
                duration: 60,
                postureScore: 70 + Double(i) * 5
            )
        }

        let data = ExportService.generateMultiSessionCSV(
            sessions: sessions
        )
        let csv = String(data: data, encoding: .utf8) ?? ""
        let lines = csv.components(separatedBy: "\n")
            .filter { !$0.isEmpty }

        // 1 header + 4 data rows = 5
        #expect(
            lines.count == 5,
            "4 sessions should produce 5 CSV lines (header + data)"
        )
    }

    @Test @MainActor func pdfReportNotEmpty() async throws {
        let session = GaitSession(
            date: .now,
            duration: 120,
            averageCadenceSPM: 110,
            averageStrideLengthM: 0.70,
            postureScore: 82,
            totalSteps: 100
        )

        let data = ExportService.generatePDFReport(for: session)
        #expect(
            data.count > 100,
            "PDF report should contain substantial data"
        )

        // Check PDF magic bytes (%PDF)
        let prefix = data.prefix(4)
        let pdfHeader = String(data: prefix, encoding: .ascii)
        #expect(
            pdfHeader == "%PDF",
            "PDF data should start with %PDF magic bytes"
        )
    }

    @Test func shareURLCreatesFile() async throws {
        let testData = Data("test,data\n1,2".utf8)
        let url = ExportService.shareURL(
            for: testData, filename: "test_export.csv"
        )

        #expect(
            FileManager.default.fileExists(atPath: url.path),
            "shareURL should create a file at the returned URL"
        )

        // Verify content
        let readBack = try Data(contentsOf: url)
        #expect(
            readBack == testData,
            "Written file should match original data"
        )

        // Cleanup
        try? FileManager.default.removeItem(at: url)
    }
}

// MARK: - AccessibilityHelpers Tests

struct AccessibilityHelpersTests {

    @Test func severityAccessibilityDescription() async throws {
        #expect(
            ClinicalSeverity.normal.accessibilityDescription == "Normal range"
        )
        #expect(
            ClinicalSeverity.mild.accessibilityDescription == "Mildly elevated"
        )
        #expect(
            ClinicalSeverity.moderate.accessibilityDescription
                == "Moderately abnormal"
        )
        #expect(
            ClinicalSeverity.severe.accessibilityDescription
                == "Severely abnormal"
        )
    }

    @Test func severityAccessibilityIcons() async throws {
        // Each severity should map to a non-empty SF Symbol
        for severity in ClinicalSeverity.allCases {
            #expect(
                !severity.accessibilityIcon.isEmpty,
                "\(severity) should have an accessibility icon"
            )
        }
    }

    @Test func sessionAccessibilitySummary() async throws {
        let session = GaitSession(
            date: Date(timeIntervalSince1970: 1_700_000_000),
            duration: 125,
            averageCadenceSPM: 110,
            postureScore: 78,
            totalSteps: 85
        )

        let summary = session.accessibilitySummary
        #expect(
            summary.contains("Session from"),
            "Summary should start with session date"
        )
        #expect(
            summary.contains("duration"),
            "Summary should mention duration"
        )
        #expect(
            summary.contains("posture score"),
            "Summary should include posture score"
        )
        #expect(
            summary.contains("steps"),
            "Summary should include step count"
        )
    }

    @Test func emptySessionAccessibilitySummary() async throws {
        let session = GaitSession()
        let summary = session.accessibilitySummary

        // Should not crash; should contain at least date and duration
        #expect(
            summary.contains("Session from"),
            "Empty session summary should still contain date"
        )
        #expect(
            !summary.contains("posture score"),
            "Empty session should not mention posture score"
        )
    }
}
