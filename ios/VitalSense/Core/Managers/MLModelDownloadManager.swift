import Foundation
import CoreML
import Combine
import OSLog

/// Manager for downloading and updating CoreML models from the server
@MainActor
class MLModelDownloadManager: ObservableObject {
    static let shared = MLModelDownloadManager()

    // MARK: - Published Properties
    @Published private(set) var downloadProgress: [String: Double] = [:]
    @Published private(set) var isDownloading = false
    @Published private(set) var availableModels: [ModelInfo] = []
    @Published private(set) var downloadedModels: [String: ModelInfo] = [:]
    @Published private(set) var downloadErrors: [String: Error] = [:]

    // MARK: - Private Properties
    private let session = URLSession.shared
    private let config = AppConfig.shared
    private var cancellables = Set<AnyCancellable>()
    private let logger = Logger(subsystem: "com.vitalsense.ml", category: "ModelDownload")

    // Model directory
    private var modelsDirectory: URL {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let modelsPath = documentsPath.appendingPathComponent("MLModels", isDirectory: true)

        // Create directory if it doesn't exist
        try? FileManager.default.createDirectory(at: modelsPath, withIntermediateDirectories: true)

        return modelsPath
    }

    private init() {
        loadDownloadedModelsInfo()
    }

    // MARK: - Model Info

    struct ModelInfo: Codable, Identifiable {
        let id: String
        let name: String
        let version: String
        let downloadURL: String
        let fileSize: Int64
        let checksum: String
        let description: String?
        let requiredOSVersion: String?
        let releaseDate: Date?

        var localPath: String {
            "\(name)_\(version).mlmodelc"
        }

        var displayName: String {
            "\(name) v\(version)"
        }
    }

    struct ModelsManifest: Codable {
        let models: [ModelInfo]
        let lastUpdated: Date
    }

    // MARK: - Fetch Available Models

    /// Fetches the list of available models from the server
    func fetchAvailableModels() async throws -> [ModelInfo] {
        let baseURL = config.apiBaseURL.absoluteString
        guard let url = URL(string: "\(baseURL)/api/ml-models/manifest") else {
            throw ModelDownloadError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.setValue("application/json", forHTTPHeaderField: "Accept")

        do {
            let (data, response) = try await session.data(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw ModelDownloadError.invalidResponse
            }

            guard httpResponse.statusCode == 200 else {
                throw ModelDownloadError.serverError(httpResponse.statusCode)
            }

            let manifest = try JSONDecoder().decode(ModelsManifest.self, from: data)
            availableModels = manifest.models

            // Log analytics
            AnalyticsManager.shared.logEvent("ml_models_manifest_fetched", parameters: [
                "model_count": String(manifest.models.count)
            ])

            return manifest.models

        } catch {
            logger.error("Failed to fetch available models: \(error.localizedDescription)")

            ErrorHandler.shared.handle(
                error,
                context: "Fetching ML models manifest",
                category: .ml,
                severity: .medium,
                recovery: .retry(maxAttempts: 3)
            )

            throw error
        }
    }

    // MARK: - Check for Updates

    /// Checks if any downloaded models need updates
    func checkForUpdates() async -> [ModelInfo] {
        do {
            let available = try await fetchAvailableModels()
            var updatesNeeded: [ModelInfo] = []

            for model in available {
                if let downloaded = downloadedModels[model.name] {
                    // Compare versions (simplified - assuming semantic versioning)
                    if needsUpdate(localVersion: downloaded.version, remoteVersion: model.version) {
                        updatesNeeded.append(model)
                    }
                } else {
                    // New model available
                    updatesNeeded.append(model)
                }
            }

            return updatesNeeded

        } catch {
            logger.error("Failed to check for updates: \(error.localizedDescription)")
            return []
        }
    }

    private func needsUpdate(localVersion: String, remoteVersion: String) -> Bool {
        // Simple version comparison (assumes semantic versioning like "2.1.0")
        let localParts = localVersion.split(separator: ".").compactMap { Int($0) }
        let remoteParts = remoteVersion.split(separator: ".").compactMap { Int($0) }

        guard localParts.count == remoteParts.count else { return true }

        for (local, remote) in zip(localParts, remoteParts) {
            if remote > local {
                return true
            } else if remote < local {
                return false
            }
        }

        return false
    }

    // MARK: - Download Model

    /// Downloads a CoreML model from the server
    func downloadModel(_ modelInfo: ModelInfo) async throws -> URL {
        guard let url = URL(string: modelInfo.downloadURL) else {
            throw ModelDownloadError.invalidURL
        }

        isDownloading = true
        downloadProgress[modelInfo.name] = 0.0
        downloadErrors.removeValue(forKey: modelInfo.name)

        do {
            var request = URLRequest(url: url)
            request.httpMethod = "GET"

            // Start download with progress tracking
            let (asyncBytes, response) = try await session.bytes(for: request)

            guard let httpResponse = response as? HTTPURLResponse else {
                throw ModelDownloadError.invalidResponse
            }

            guard httpResponse.statusCode == 200 else {
                throw ModelDownloadError.serverError(httpResponse.statusCode)
            }

            // Get expected content length
            let expectedLength = httpResponse.expectedContentLength

            // Download to temporary location first
            let tempURL = FileManager.default.temporaryDirectory
                .appendingPathComponent(UUID().uuidString)
                .appendingPathExtension("mlmodelc")

            var downloadedBytes: Int64 = 0
            let fileHandle = try FileHandle(forWritingTo: tempURL)
            defer { try? fileHandle.close() }

            // Download data in chunks and track progress
            for try await byte in asyncBytes {
                try fileHandle.write(contentsOf: Data([byte]))
                downloadedBytes += 1

                // Update progress
                if expectedLength > 0 {
                    let progress = Double(downloadedBytes) / Double(expectedLength)
                    downloadProgress[modelInfo.name] = min(1.0, progress)
                } else {
                    // If we don't know the size, estimate based on downloaded bytes
                    let estimatedProgress = Double(downloadedBytes) / Double(modelInfo.fileSize)
                    downloadProgress[modelInfo.name] = min(1.0, estimatedProgress)
                }
            }

            try fileHandle.close()

            // Verify checksum if provided
            if !modelInfo.checksum.isEmpty {
                let fileChecksum = try computeChecksum(fileURL: tempURL)
                guard fileChecksum == modelInfo.checksum else {
                    throw ModelDownloadError.checksumMismatch
                }
            }

            // Move to final location
            let finalURL = modelsDirectory.appendingPathComponent(modelInfo.localPath)

            // Remove existing model if present
            try? FileManager.default.removeItem(at: finalURL)

            // Move downloaded file
            try FileManager.default.moveItem(at: tempURL, to: finalURL)

            // Save model info
            saveModelInfo(modelInfo, at: finalURL)
            downloadedModels[modelInfo.name] = modelInfo
            downloadProgress[modelInfo.name] = 1.0

            // Log analytics
            AnalyticsManager.shared.logEvent("ml_model_downloaded", parameters: [
                "model_name": modelInfo.name,
                "model_version": modelInfo.version,
                "file_size": String(modelInfo.fileSize)
            ])

            logger.info("Successfully downloaded model: \(modelInfo.displayName)")

            isDownloading = false
            return finalURL

        } catch {
            isDownloading = false
            downloadErrors[modelInfo.name] = error
            downloadProgress.removeValue(forKey: modelInfo.name)

            logger.error("Failed to download model \(modelInfo.name): \(error.localizedDescription)")

            ErrorHandler.shared.handle(
                error,
                context: "Downloading ML model: \(modelInfo.name)",
                category: .ml,
                severity: .medium,
                recovery: .retry(maxAttempts: 2)
            )

            throw error
        }
    }

    // MARK: - Load Model

    /// Loads a CoreML model from disk
    func loadModel(_ modelInfo: ModelInfo) throws -> MLModel {
        let modelURL = modelsDirectory.appendingPathComponent(modelInfo.localPath)

        guard FileManager.default.fileExists(atPath: modelURL.path) else {
            throw ModelDownloadError.modelNotFound(modelInfo.localPath)
        }

        do {
            let model = try MLModel(contentsOf: modelURL)
            logger.info("Successfully loaded model: \(modelInfo.displayName)")
            return model
        } catch {
            logger.error("Failed to load model \(modelInfo.name): \(error.localizedDescription)")
            throw ModelDownloadError.loadFailed(error.localizedDescription)
        }
    }

    /// Gets the local path for a model if it exists
    func getLocalModelPath(modelName: String, version: String) -> URL? {
        let modelInfo = ModelInfo(
            id: UUID().uuidString,
            name: modelName,
            version: version,
            downloadURL: "",
            fileSize: 0,
            checksum: "",
            description: nil,
            requiredOSVersion: nil,
            releaseDate: nil
        )

        let modelURL = modelsDirectory.appendingPathComponent(modelInfo.localPath)
        return FileManager.default.fileExists(atPath: modelURL.path) ? modelURL : nil
    }

    // MARK: - Model Management

    /// Deletes a downloaded model
    func deleteModel(_ modelInfo: ModelInfo) throws {
        let modelURL = modelsDirectory.appendingPathComponent(modelInfo.localPath)

        guard FileManager.default.fileExists(atPath: modelURL.path) else {
            return // Already deleted
        }

        try FileManager.default.removeItem(at: modelURL)
        downloadedModels.removeValue(forKey: modelInfo.name)

        // Remove from info file
        saveDownloadedModelsInfo()

        AnalyticsManager.shared.logEvent("ml_model_deleted", parameters: [
            "model_name": modelInfo.name
        ])
    }

    /// Gets all downloaded models
    func getDownloadedModels() -> [ModelInfo] {
        return Array(downloadedModels.values)
    }

    // MARK: - Private Helpers

    private func computeChecksum(fileURL: URL) throws -> String {
        let data = try Data(contentsOf: fileURL)
        let hash = data.hashValue
        return String(format: "%x", hash) // Simplified checksum
    }

    private func saveModelInfo(_ modelInfo: ModelInfo, at url: URL) {
        var info = downloadedModels
        info[modelInfo.name] = modelInfo
        downloadedModels = info
        saveDownloadedModelsInfo()
    }

    private func saveDownloadedModelsInfo() {
        let infoURL = modelsDirectory.appendingPathComponent("model_info.json")

        do {
            let encoder = JSONEncoder()
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(downloadedModels)
            try data.write(to: infoURL)
        } catch {
            logger.error("Failed to save model info: \(error.localizedDescription)")
        }
    }

    private func loadDownloadedModelsInfo() {
        let infoURL = modelsDirectory.appendingPathComponent("model_info.json")

        guard FileManager.default.fileExists(atPath: infoURL.path) else {
            return
        }

        do {
            let data = try Data(contentsOf: infoURL)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            downloadedModels = try decoder.decode([String: ModelInfo].self, from: data)
        } catch {
            logger.error("Failed to load model info: \(error.localizedDescription)")
        }
    }
}

// MARK: - Errors

enum ModelDownloadError: LocalizedError {
    case invalidURL
    case invalidResponse
    case serverError(Int)
    case checksumMismatch
    case modelNotFound(String)
    case loadFailed(String)
    case downloadFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid model download URL"
        case .invalidResponse:
            return "Invalid server response"
        case .serverError(let code):
            return "Server error: \(code)"
        case .checksumMismatch:
            return "Downloaded model checksum doesn't match"
        case .modelNotFound(let path):
            return "Model not found at path: \(path)"
        case .loadFailed(let reason):
            return "Failed to load model: \(reason)"
        case .downloadFailed(let reason):
            return "Failed to download model: \(reason)"
        }
    }
}
