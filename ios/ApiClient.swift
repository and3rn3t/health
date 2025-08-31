import Foundation

enum ApiError: Error { case invalidResponse, server(String) }

class ApiClient {
    private let baseURL: URL
    init(baseURL: URL) { self.baseURL = baseURL }

    func issueDeviceToken(userId: String, ttlSec: Int = 600) async throws -> String {
        let url = baseURL.appendingPathComponent("api/device/auth")
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        let body: [String: Any] = ["userId": userId, "clientType": "ios_app", "ttlSec": ttlSec]
        req.httpBody = try JSONSerialization.data(withJSONObject: body)
        let (data, resp) = try await URLSession.shared.data(for: req)
        guard let http = resp as? HTTPURLResponse else { throw ApiError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else {
            let msg = String(data: data, encoding: .utf8) ?? "error"
            throw ApiError.server(msg)
        }
        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let token = json?["token"] as? String else { throw ApiError.invalidResponse }
        return token
    }
}
