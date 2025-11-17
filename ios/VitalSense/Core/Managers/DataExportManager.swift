import Foundation
import HealthKit
import SwiftUI
import PDFKit

// MARK: - Data Export Manager
@MainActor
class DataExportManager: ObservableObject {
    static let shared = DataExportManager()

    @Published var isExporting = false
    @Published var exportProgress: Double = 0.0

    private init() {}

    enum ExportFormat {
        case json
        case csv
        case pdf
    }

    func exportHealthData(
        format: DataExportView.ExportFormat,
        from startDate: Date,
        to endDate: Date,
        healthKitManager: HealthKitManager
    ) async throws -> URL {
        isExporting = true
        defer { isExporting = false }

        // Collect health data
        let healthData = try await collectHealthData(
            from: startDate,
            to: endDate,
            healthKitManager: healthKitManager
        )

        exportProgress = 0.3

        // Generate file based on format
        let url: URL
        switch format {
        case .json:
            url = try await exportAsJSON(healthData: healthData, startDate: startDate, endDate: endDate)
        case .csv:
            url = try await exportAsCSV(healthData: healthData, startDate: startDate, endDate: endDate)
        case .pdf:
            url = try await exportAsPDF(healthData: healthData, startDate: startDate, endDate: endDate)
        }

        exportProgress = 1.0

        return url
    }

    private func collectHealthData(
        from startDate: Date,
        to endDate: Date,
        healthKitManager: HealthKitManager
    ) async throws -> HealthExportData {
        var data = HealthExportData(
            exportDate: Date(),
            dateRange: DateInterval(start: startDate, end: endDate),
            metrics: [],
            gaitData: [],
            fallRiskData: []
        )

        // Collect core health metrics
        if let heartRate = healthKitManager.lastHeartRate {
            data.metrics.append(.init(
                type: "heartRate",
                value: heartRate,
                unit: "bpm",
                timestamp: Date()
            ))
        }

        if let steps = healthKitManager.lastStepCount {
            data.metrics.append(.init(
                type: "stepCount",
                value: steps,
                unit: "steps",
                timestamp: Date()
            ))
        }

        if let distance = healthKitManager.lastDistance {
            data.metrics.append(.init(
                type: "distance",
                value: distance,
                unit: "meters",
                timestamp: Date()
            ))
        }

        // Add gait data if available
        // Note: In a real implementation, fetch historical gait data from storage

        return data
    }

    private func exportAsJSON(healthData: HealthExportData, startDate: Date, endDate: Date) throws -> URL {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

        let jsonData = try encoder.encode(healthData)
        let fileName = "vitalsense-export-\(ISO8601DateFormatter().string(from: Date()).prefix(10)).json"
        return try saveToFile(data: jsonData, fileName: fileName, mimeType: "application/json")
    }

    private func exportAsCSV(healthData: HealthExportData, startDate: Date, endDate: Date) throws -> URL {
        var csvContent = "Type,Value,Unit,Timestamp\n"

        for metric in healthData.metrics {
            let dateString = ISO8601DateFormatter().string(from: metric.timestamp)
            csvContent += "\(metric.type),\(metric.value),\(metric.unit),\(dateString)\n"
        }

        guard let csvData = csvContent.data(using: .utf8) else {
            throw ExportError.encodingFailed
        }

        let fileName = "vitalsense-export-\(ISO8601DateFormatter().string(from: Date()).prefix(10)).csv"
        return try saveToFile(data: csvData, fileName: fileName, mimeType: "text/csv")
    }

    private func exportAsPDF(healthData: HealthExportData, startDate: Date, endDate: Date) throws -> URL {
        let pdfMetaData = [
            kCGPDFContextCreator: "VitalSense iOS",
            kCGPDFContextAuthor: "VitalSense Health App",
            kCGPDFContextTitle: "Comprehensive Health Report"
        ]

        let format = UIGraphicsPDFRendererFormat()
        format.documentInfo = pdfMetaData as [String: Any]

        let pageRect = CGRect(x: 0, y: 0, width: 612, height: 792) // US Letter
        let renderer = UIGraphicsPDFRenderer(bounds: pageRect, format: format)

        let data = renderer.pdfData { context in
            var yPosition: CGFloat = 50
            let margin: CGFloat = 50
            let maxWidth = pageRect.width - (margin * 2)

            // Title Page
            context.beginPage()

            // Title
            let title = "VitalSense\nComprehensive Health Report"
            let titleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 28),
                .foregroundColor: UIColor.label
            ]
            let titleSize = title.boundingRect(
                with: CGSize(width: maxWidth, height: .greatestFiniteMagnitude),
                options: .usesLineFragmentOrigin,
                attributes: titleAttributes,
                context: nil
            )
            title.draw(in: CGRect(x: margin, y: yPosition, width: maxWidth, height: titleSize.height), withAttributes: titleAttributes)
            yPosition += titleSize.height + 40

            // Export date
            let dateFormatter = DateFormatter()
            dateFormatter.dateStyle = .long
            dateFormatter.timeStyle = .short
            let exportDateText = "Generated: \(dateFormatter.string(from: healthData.exportDate))"
            let dateAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 14),
                .foregroundColor: UIColor.secondaryLabel
            ]
            exportDateText.draw(at: CGPoint(x: margin, y: yPosition), withAttributes: dateAttributes)
            yPosition += 25

            // Date range
            dateFormatter.dateStyle = .medium
            dateFormatter.timeStyle = .none
            let rangeText = "Report Period: \(dateFormatter.string(from: startDate)) - \(dateFormatter.string(from: endDate))"
            rangeText.draw(at: CGPoint(x: margin, y: yPosition), withAttributes: dateAttributes)
            yPosition += 60

            // Executive Summary
            let summaryTitle = "Executive Summary"
            let sectionTitleAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.boldSystemFont(ofSize: 18),
                .foregroundColor: UIColor.label
            ]
            summaryTitle.draw(at: CGPoint(x: margin, y: yPosition), withAttributes: sectionTitleAttributes)
            yPosition += 30

            // Calculate averages and statistics
            let avgHeartRate = healthData.metrics.filter { $0.type == "heartRate" }.map { $0.value }.reduce(0, +) / Double(max(1, healthData.metrics.filter { $0.type == "heartRate" }.count))
            let totalSteps = healthData.metrics.filter { $0.type == "stepCount" }.map { $0.value }.reduce(0, +)
            let avgFallRisk = healthData.fallRiskData.map { $0.riskScore }.reduce(0, +) / Double(max(1, healthData.fallRiskData.count))

            let summaryText = """
            This report summarizes your health data collected between \(dateFormatter.string(from: startDate)) and \(dateFormatter.string(from: endDate)).

            Key Metrics:
            • Total Health Metrics Recorded: \(healthData.metrics.count)
            • Average Heart Rate: \(avgHeartRate > 0 ? String(format: "%.1f bpm", avgHeartRate) : "N/A")
            • Total Steps: \(totalSteps > 0 ? String(format: "%.0f steps", totalSteps) : "N/A")
            • Gait Sessions: \(healthData.gaitData.count)
            • Fall Risk Assessments: \(healthData.fallRiskData.count)
            • Average Fall Risk Score: \(avgFallRisk > 0 ? String(format: "%.1f%%", avgFallRisk * 100) : "N/A")

            Recommendations:
            \(generateRecommendations(healthData: healthData, avgHeartRate: avgHeartRate, avgFallRisk: avgFallRisk))
            """

            let summaryAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.systemFont(ofSize: 12),
                .foregroundColor: UIColor.label
            ]
            let summarySize = summaryText.boundingRect(
                with: CGSize(width: maxWidth, height: .greatestFiniteMagnitude),
                options: .usesLineFragmentOrigin,
                attributes: summaryAttributes,
                context: nil
            )
            summaryText.draw(in: CGRect(x: margin, y: yPosition, width: maxWidth, height: summarySize.height), withAttributes: summaryAttributes)

            // New page for detailed metrics
            if healthData.metrics.count > 0 {
                context.beginPage()
                yPosition = 50

                // Detailed Metrics Section
                "Detailed Health Metrics".draw(at: CGPoint(x: margin, y: yPosition), withAttributes: sectionTitleAttributes)
                yPosition += 35

                // Group metrics by type
                let groupedMetrics = Dictionary(grouping: healthData.metrics) { $0.type }
                let headerAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.boldSystemFont(ofSize: 14),
                    .foregroundColor: UIColor.label
                ]
                let valueAttributes: [NSAttributedString.Key: Any] = [
                    .font: UIFont.systemFont(ofSize: 12),
                    .foregroundColor: UIColor.secondaryLabel
                ]

                for (type, metrics) in groupedMetrics.prefix(5) {
                    if yPosition > pageRect.height - 100 {
                        context.beginPage()
                        yPosition = 50
                    }

                    type.draw(at: CGPoint(x: margin, y: yPosition), withAttributes: headerAttributes)
                    yPosition += 20

                    let recentMetrics = metrics.suffix(10)
                    for metric in recentMetrics {
                        let metricText = "\(dateFormatter.string(from: metric.timestamp)): \(String(format: "%.2f", metric.value)) \(metric.unit)"
                        metricText.draw(at: CGPoint(x: margin + 20, y: yPosition), withAttributes: valueAttributes)
                        yPosition += 18
                    }

                    yPosition += 10
                }
            }

            // Fall Risk Analysis Page
            if !healthData.fallRiskData.isEmpty {
                context.beginPage()
                yPosition = 50

                "Fall Risk Analysis".draw(at: CGPoint(x: margin, y: yPosition), withAttributes: sectionTitleAttributes)
                yPosition += 35

                let fallRiskText = """
                Fall Risk Trends:
                • Total Assessments: \(healthData.fallRiskData.count)
                • Average Risk Score: \(String(format: "%.1f%%", avgFallRisk * 100))
                • Highest Risk Period: See detailed assessments below

                Detailed Assessments:
                """
                fallRiskText.draw(in: CGRect(x: margin, y: yPosition, width: maxWidth, height: 100), withAttributes: summaryAttributes)
                yPosition += 100

                for assessment in healthData.fallRiskData.prefix(10) {
                    if yPosition > pageRect.height - 60 {
                        context.beginPage()
                        yPosition = 50
                    }

                    let assessmentText = "\(dateFormatter.string(from: assessment.date)): Risk Score \(String(format: "%.1f%%", assessment.riskScore * 100))"
                    assessmentText.draw(at: CGPoint(x: margin, y: yPosition), withAttributes: valueAttributes)
                    yPosition += 18
                }
            }

            // Footer on last page
            context.beginPage()
            yPosition = pageRect.height - 100

            let footerText = "This report was generated by VitalSense Health App.\nFor medical advice, please consult with your healthcare provider."
            let footerAttributes: [NSAttributedString.Key: Any] = [
                .font: UIFont.italicSystemFont(ofSize: 10),
                .foregroundColor: UIColor.secondaryLabel
            ]
            footerText.draw(in: CGRect(x: margin, y: yPosition, width: maxWidth, height: 50), withAttributes: footerAttributes)
        }

        let fileName = "vitalsense-health-report-\(ISO8601DateFormatter().string(from: Date()).prefix(10)).pdf"
        return try saveToFile(data: data, fileName: fileName, mimeType: "application/pdf")
    }

    private func generateRecommendations(healthData: HealthExportData, avgHeartRate: Double, avgFallRisk: Double) -> String {
        var recommendations: [String] = []

        if avgFallRisk > 0.7 {
            recommendations.append("Consider balance exercises and review fall prevention strategies.")
        }

        if healthData.metrics.filter({ $0.type == "stepCount" }).count < 10 {
            recommendations.append("Increase activity tracking for more comprehensive insights.")
        }

        if avgHeartRate > 0 && (avgHeartRate < 60 || avgHeartRate > 100) {
            recommendations.append("Monitor heart rate patterns and consult with healthcare provider if concerns arise.")
        }

        if healthData.gaitData.isEmpty {
            recommendations.append("Regular gait analysis can provide valuable mobility insights.")
        }

        if recommendations.isEmpty {
            recommendations.append("Continue monitoring your health metrics regularly.")
            recommendations.append("Maintain regular physical activity and follow healthcare provider recommendations.")
        }

        return recommendations.joined(separator: "\n")
    }

    private func saveToFile(data: Data, fileName: String, mimeType: String) throws -> URL {
        let tempDir = FileManager.default.temporaryDirectory
        let fileURL = tempDir.appendingPathComponent(fileName)

        try data.write(to: fileURL)

        return fileURL
    }

    enum ExportError: LocalizedError {
        case encodingFailed
        case fileCreationFailed

        var errorDescription: String? {
            switch self {
            case .encodingFailed:
                return "Failed to encode data for export"
            case .fileCreationFailed:
                return "Failed to create export file"
            }
        }
    }
}

// MARK: - Export Data Models

struct HealthExportData: Codable {
    let exportDate: Date
    let dateRange: DateInterval
    var metrics: [HealthMetric]
    var gaitData: [GaitExportData]
    var fallRiskData: [FallRiskExportData]

    struct HealthMetric: Codable {
        let type: String
        let value: Double
        let unit: String
        let timestamp: Date
    }
}

struct GaitExportData: Codable {
    let date: Date
    let metrics: [String: Double]
}

struct FallRiskExportData: Codable {
    let date: Date
    let riskScore: Double
    let factors: [String: Double]
}

// MARK: - Share Sheet

struct ShareSheet: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}
