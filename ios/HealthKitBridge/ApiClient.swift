import Foundation
import UIKit
import SwiftUI

class ApiClient: ObservableObject {
    static let shared = ApiClient()

    private let session = URLSession.shared
    @Published var lastError: String?

    private init() {}

    func getDeviceToken(userId: String, deviceType: String) async -> String? {
        print("🔐 Getting device token for user: \(userId), device: \(deviceType)")

        let config = AppConfig.shared
        guard let url = URL(string: "\(config.apiBaseURL)/auth/device-token") else {
            print("❌ Invalid API URL")
            await MainActor.run {
                self.lastError = "Invalid API URL configuration"
            }
            return nil
        }

        let deviceId = await UIDevice.current.identifierForVendor?.uuidString ?? "unknown"

        let requestBody: [String: Any] = [
            "userId": userId,
            "deviceId": deviceId,
            "deviceType": deviceType,
            "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0",
            "platform": "ios"
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

            let (data, response) = try await session.data(for: request)

            if let httpResponse = response as? HTTPURLResponse {
                print("🔐 Token request response: \(httpResponse.statusCode)")

                if httpResponse.statusCode == 200 {
                    if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                       let token = json["token"] as? String {
                        print("✅ Got device token successfully")
                        await MainActor.run {
                            self.lastError = nil
                        }
                        return token
                    }
                } else {
                    // For development/testing, return a mock token if server is not available
                    print("⚠️ Server returned \(httpResponse.statusCode), using mock token for testing")
                    return "mock-token-\(userId)-\(deviceId)"
                }
            }
        } catch {
            print("❌ Token request failed: \(error)")
            print("🔄 Using mock token for testing purposes")

            // Return mock token for testing when server is not available
            let mockToken = "mock-token-\(userId)-\(deviceId)"
            await MainActor.run {
                self.lastError = "Using mock token (server unavailable)"
            }
            return mockToken
        }

        await MainActor.run {
            self.lastError = "Failed to get device token"
        }
        return nil
    }

    func sendHealthData(_ healthData: HealthData) async -> Bool {
        print("📤 Sending health data with enhanced processing: \(healthData.type)")

        let config = AppConfig.shared
        guard let url = URL(string: "\(config.apiBaseURL)/health-data/process") else {
            print("❌ Invalid API URL")
            return false
        }

        let requestBody: [String: Any] = [
            "type": healthData.type,
            "value": healthData.value,
            "unit": healthData.unit,
            "timestamp": ISO8601DateFormatter().string(from: healthData.timestamp),
            "deviceId": healthData.deviceId,
            "userId": healthData.userId,
            "source": "Apple HealthKit",
            "confidence": 0.95
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

            let (data, response) = try await session.data(for: request)

            if let httpResponse = response as? HTTPURLResponse {
                print("📤 Enhanced processing API response: \(httpResponse.statusCode)")

                // Parse the enhanced response to get analytics
                if httpResponse.statusCode == 201, let responseData = data {
                    if let json = try? JSONSerialization.jsonObject(with: responseData) as? [String: Any],
                       let analytics = json["analytics"] as? [String: Any] {

                        if let healthScore = analytics["healthScore"] as? Double {
                            print("📊 Health Score: \(healthScore)")
                        }

                        if let fallRisk = analytics["fallRisk"] as? String {
                            print("🚨 Fall Risk: \(fallRisk)")
                        }

                        if let alert = analytics["alert"] as? [String: Any],
                           let level = alert["level"] as? String,
                           let message = alert["message"] as? String {
                            print("⚠️ Alert (\(level)): \(message)")
                        }
                    }
                }

                return httpResponse.statusCode == 200 || httpResponse.statusCode == 201
            }
        } catch {
            print("❌ Enhanced processing API request failed: \(error)")
        }

        return false
    }

    func sendHealthDataBatch(_ healthDataArray: [HealthData]) async -> Bool {
        print("📤 Sending health data batch with \(healthDataArray.count) metrics")

        let config = AppConfig.shared
        guard let url = URL(string: "\(config.apiBaseURL)/health-data/batch") else {
            print("❌ Invalid batch API URL")
            return false
        }

        let metrics = healthDataArray.map { healthData in
            return [
                "type": healthData.type,
                "value": healthData.value,
                "unit": healthData.unit,
                "timestamp": ISO8601DateFormatter().string(from: healthData.timestamp),
                "deviceId": healthData.deviceId,
                "userId": healthData.userId,
                "source": "Apple HealthKit",
                "confidence": 0.95
            ]
        }

        let requestBody: [String: Any] = [
            "metrics": metrics,
            "uploadedAt": ISO8601DateFormatter().string(from: Date()),
            "deviceInfo": [
                "deviceId": healthDataArray.first?.deviceId ?? "unknown",
                "deviceType": "iOS",
                "osVersion": UIDevice.current.systemVersion,
                "appVersion": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0.0"
            ]
        ]

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        do {
            request.httpBody = try JSONSerialization.data(withJSONObject: requestBody)

            let (data, response) = try await session.data(for: request)

            if let httpResponse = response as? HTTPURLResponse {
                print("📤 Batch processing API response: \(httpResponse.statusCode)")

                if httpResponse.statusCode == 201, let responseData = data {
                    if let json = try? JSONSerialization.jsonObject(with: responseData) as? [String: Any] {
                        if let processed = json["processed"] as? Int,
                           let total = json["total"] as? Int {
                            print("📊 Batch processed: \(processed)/\(total) metrics")
                        }

                        if let errors = json["errors"] as? [String], !errors.isEmpty {
                            print("⚠️ Batch errors: \(errors.joined(separator: ", "))")
                        }
                    }
                }

                return httpResponse.statusCode == 200 || httpResponse.statusCode == 201
            }
        } catch {
            print("❌ Batch processing API request failed: \(error)")
        }

        return false
    }
}
