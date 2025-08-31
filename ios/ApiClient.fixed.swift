import Foundation

enum ApiError: Error {
    case invalidResponse
    case server(String)
    case networkError(Error)
}

class ApiClient: ObservableObject {
    static let shared = ApiClient()
    private let baseURL: URL

    private init() {
        let config = AppConfig.shared
        self.baseURL = config.apiBaseURL
    }

    func getDeviceToken(userId: String, deviceType: String, ttlSec: Int = 600) async -> String? {
        do {
            let url = baseURL.appendingPathComponent("api/device/auth")
            var req = URLRequest(url: url)
            req.httpMethod = "POST"
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")

            let body: [String: Any] = [
                "userId": userId,
                "deviceType": deviceType,
                "ttlSec": ttlSec
            ]

            req.httpBody = try JSONSerialization.data(withJSONObject: body)

            let (data, response) = try await URLSession.shared.data(for: req)

            guard let httpResponse = response as? HTTPURLResponse else {
                print("❌ Invalid response type")
                return nil
            }

            guard (200..<300).contains(httpResponse.statusCode) else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                print("❌ Server error (\(httpResponse.statusCode)): \(errorMessage)")
                return nil
            }

            guard let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let token = json["token"] as? String else {
                print("❌ Invalid token response")
                return nil
            }

            print("✅ Device token received")
            return token

        } catch {
            print("❌ API Client error: \(error.localizedDescription)")
            return nil
        }
    }
}
