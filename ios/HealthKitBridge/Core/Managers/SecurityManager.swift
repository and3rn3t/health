import Foundation
import CryptoKit
import LocalAuthentication
import Security

// MARK: - Advanced Security Manager
class SecurityManager: ObservableObject {
    static let shared = SecurityManager()
    
    @Published var biometricAuthenticationEnabled = false
    @Published var dataEncryptionEnabled = true
    @Published var lastSecurityCheck: Date?
    @Published var securityThreats: [SecurityThreat] = []
    
    private let keychain = KeychainManager.shared
    private let biometricContext = LAContext()
    
    private init() {
        checkBiometricAvailability()
        performSecurityAudit()
    }
    
    // MARK: - Biometric Authentication
    private func checkBiometricAvailability() {
        var error: NSError?
        
        if biometricContext.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
            biometricAuthenticationEnabled = UserDefaults.standard.bool(forKey: "biometric_auth_enabled")
        }
    }
    
    func enableBiometricAuthentication() async -> Bool {
        let reason = "Authenticate to secure your health data"
        
        do {
            let success = try await biometricContext.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
            
            if success {
                UserDefaults.standard.set(true, forKey: "biometric_auth_enabled")
                await MainActor.run {
                    biometricAuthenticationEnabled = true
                }
            }
            
            return success
        } catch {
            print("❌ Biometric authentication failed: \(error)")
            return false
        }
    }
    
    func authenticateUser() async -> Bool {
        guard biometricAuthenticationEnabled else { return true }
        
        let reason = "Authenticate to access your health data"
        
        do {
            return try await biometricContext.evaluatePolicy(
                .deviceOwnerAuthenticationWithBiometrics,
                localizedReason: reason
            )
        } catch {
            print("❌ User authentication failed: \(error)")
            return false
        }
    }
    
    // MARK: - Data Encryption
    func encryptHealthData<T: Codable>(_ data: T) throws -> Data {
        let jsonData = try JSONEncoder().encode(data)
        return try encryptData(jsonData)
    }
    
    func decryptHealthData<T: Codable>(_ encryptedData: Data, as type: T.Type) throws -> T {
        let decryptedData = try decryptData(encryptedData)
        return try JSONDecoder().decode(type, from: decryptedData)
    }
    
    private func encryptData(_ data: Data) throws -> Data {
        let key = try getOrCreateEncryptionKey()
        let sealedBox = try AES.GCM.seal(data, using: key)
        return sealedBox.combined!
    }
    
    private func decryptData(_ encryptedData: Data) throws -> Data {
        let key = try getOrCreateEncryptionKey()
        let sealedBox = try AES.GCM.SealedBox(combined: encryptedData)
        return try AES.GCM.open(sealedBox, using: key)
    }
    
    private func getOrCreateEncryptionKey() throws -> SymmetricKey {
        let keyTag = "com.healthkitbridge.encryption.key"
        
        if let existingKey = try keychain.getEncryptionKey(tag: keyTag) {
            return existingKey
        }
        
        let newKey = SymmetricKey(size: .bits256)
        try keychain.storeEncryptionKey(newKey, tag: keyTag)
        return newKey
    }
    
    // MARK: - Security Audit
    private func performSecurityAudit() {
        Task {
            var threats: [SecurityThreat] = []
            
            // Check for jailbreak
            if isDeviceJailbroken() {
                threats.append(SecurityThreat(
                    type: .jailbreak,
                    severity: .high,
                    description: "Device appears to be jailbroken",
                    recommendation: "Health data may be at risk on jailbroken devices"
                ))
            }
            
            // Check network security
            if await isUsingUnsecureNetwork() {
                threats.append(SecurityThreat(
                    type: .unsecureNetwork,
                    severity: .medium,
                    description: "Connected to potentially unsecure network",
                    recommendation: "Avoid transmitting sensitive data on public networks"
                ))
            }
            
            // Check app permissions
            let permissionThreats = checkAppPermissions()
            threats.append(contentsOf: permissionThreats)
            
            await MainActor.run {
                self.securityThreats = threats
                self.lastSecurityCheck = Date()
            }
        }
    }
    
    private func isDeviceJailbroken() -> Bool {
        // Check for common jailbreak indicators
        let jailbreakPaths = [
            "/Applications/Cydia.app",
            "/usr/sbin/sshd",
            "/bin/bash",
            "/etc/apt",
            "/private/var/lib/apt/"
        ]
        
        for path in jailbreakPaths {
            if FileManager.default.fileExists(atPath: path) {
                return true
            }
        }
        
        // Check if app can write outside sandbox
        do {
            let testString = "jailbreak_test"
            try testString.write(toFile: "/private/test.txt", atomically: true, encoding: .utf8)
            try FileManager.default.removeItem(atPath: "/private/test.txt")
            return true
        } catch {
            // Normal behavior for non-jailbroken devices
        }
        
        return false
    }
    
    private func isUsingUnsecureNetwork() async -> Bool {
        // This would require network analysis capabilities
        // For now, return false as a placeholder
        return false
    }
    
    private func checkAppPermissions() -> [SecurityThreat] {
        var threats: [SecurityThreat] = []
        
        // Check HealthKit permissions
        let healthManager = HealthKitManager.shared
        if !healthManager.isAuthorized {
            threats.append(SecurityThreat(
                type: .insufficientPermissions,
                severity: .medium,
                description: "HealthKit access not granted",
                recommendation: "Grant HealthKit permissions for full functionality"
            ))
        }
        
        return threats
    }
    
    // MARK: - Secure Data Transmission
    func createSecurePayload<T: Codable>(_ data: T) throws -> SecurePayload {
        let timestamp = Date()
        let nonce = Data((0..<16).map { _ in UInt8.random(in: 0...255) })
        
        let payload = PayloadData(data: data, timestamp: timestamp, nonce: nonce)
        let encryptedData = try encryptHealthData(payload)
        
        let signature = try createSignature(for: encryptedData)
        
        return SecurePayload(
            encryptedData: encryptedData,
            signature: signature,
            timestamp: timestamp
        )
    }
    
    func verifySecurePayload<T: Codable>(_ payload: SecurePayload, as type: T.Type) throws -> T {
        // Verify signature
        guard try verifySignature(payload.signature, for: payload.encryptedData) else {
            throw SecurityError.invalidSignature
        }
        
        // Check timestamp (prevent replay attacks)
        let maxAge: TimeInterval = 300 // 5 minutes
        guard Date().timeIntervalSince(payload.timestamp) < maxAge else {
            throw SecurityError.expiredPayload
        }
        
        // Decrypt and extract data
        let payloadData: PayloadData<T> = try decryptHealthData(payload.encryptedData, as: PayloadData<T>.self)
        return payloadData.data
    }
    
    private func createSignature(for data: Data) throws -> Data {
        let privateKey = try getOrCreateSigningKey()
        let signature = try P256.Signing.PrivateKey(rawRepresentation: privateKey).signature(for: data)
        return signature.rawRepresentation
    }
    
    private func verifySignature(_ signature: Data, for data: Data) throws -> Bool {
        let publicKey = try getSigningPublicKey()
        let ecdsaSignature = try P256.Signing.ECDSASignature(rawRepresentation: signature)
        return publicKey.isValidSignature(ecdsaSignature, for: data)
    }
    
    private func getOrCreateSigningKey() throws -> Data {
        let keyTag = "com.healthkitbridge.signing.private"
        
        if let existingKey = try keychain.getPrivateKey(tag: keyTag) {
            return existingKey
        }
        
        let privateKey = P256.Signing.PrivateKey()
        try keychain.storePrivateKey(privateKey.rawRepresentation, tag: keyTag)
        try keychain.storePublicKey(privateKey.publicKey.rawRepresentation, tag: keyTag + ".public")
        
        return privateKey.rawRepresentation
    }
    
    private func getSigningPublicKey() throws -> P256.Signing.PublicKey {
        let keyTag = "com.healthkitbridge.signing.private.public"
        let publicKeyData = try keychain.getPublicKey(tag: keyTag)
        return try P256.Signing.PublicKey(rawRepresentation: publicKeyData)
    }
}

// MARK: - Keychain Manager
class KeychainManager {
    static let shared = KeychainManager()
    
    private init() {}
    
    func storeEncryptionKey(_ key: SymmetricKey, tag: String) throws {
        let keyData = key.withUnsafeBytes { Data($0) }
        try storeData(keyData, tag: tag, accessibility: .whenUnlockedThisDeviceOnly)
    }
    
    func getEncryptionKey(tag: String) throws -> SymmetricKey? {
        guard let keyData = try getData(tag: tag) else { return nil }
        return SymmetricKey(data: keyData)
    }
    
    func storePrivateKey(_ key: Data, tag: String) throws {
        try storeData(key, tag: tag, accessibility: .whenUnlockedThisDeviceOnly)
    }
    
    func getPrivateKey(tag: String) throws -> Data {
        guard let keyData = try getData(tag: tag) else {
            throw SecurityError.keyNotFound
        }
        return keyData
    }
    
    func storePublicKey(_ key: Data, tag: String) throws {
        try storeData(key, tag: tag, accessibility: .whenUnlocked)
    }
    
    func getPublicKey(tag: String) throws -> Data {
        guard let keyData = try getData(tag: tag) else {
            throw SecurityError.keyNotFound
        }
        return keyData
    }
    
    private func storeData(_ data: Data, tag: String, accessibility: CFString) throws {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tag,
            kSecValueData as String: data,
            kSecAttrAccessible as String: accessibility
        ]
        
        let status = SecItemAdd(query as CFDictionary, nil)
        
        if status == errSecDuplicateItem {
            // Update existing item
            let updateQuery: [String: Any] = [
                kSecClass as String: kSecClassGenericPassword,
                kSecAttrAccount as String: tag
            ]
            
            let updateAttributes: [String: Any] = [
                kSecValueData as String: data
            ]
            
            let updateStatus = SecItemUpdate(updateQuery as CFDictionary, updateAttributes as CFDictionary)
            guard updateStatus == errSecSuccess else {
                throw SecurityError.keychainError(updateStatus)
            }
        } else {
            guard status == errSecSuccess else {
                throw SecurityError.keychainError(status)
            }
        }
    }
    
    private func getData(tag: String) throws -> Data? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: tag,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)
        
        if status == errSecItemNotFound {
            return nil
        }
        
        guard status == errSecSuccess else {
            throw SecurityError.keychainError(status)
        }
        
        return result as? Data
    }
}

// MARK: - Security Models
struct SecurityThreat: Identifiable {
    let id = UUID()
    let type: ThreatType
    let severity: Severity
    let description: String
    let recommendation: String
    
    enum ThreatType {
        case jailbreak, unsecureNetwork, insufficientPermissions, dataIntegrityIssue
    }
    
    enum Severity {
        case low, medium, high, critical
    }
}

struct SecurePayload {
    let encryptedData: Data
    let signature: Data
    let timestamp: Date
}

struct PayloadData<T: Codable>: Codable {
    let data: T
    let timestamp: Date
    let nonce: Data
}

enum SecurityError: Error {
    case keyNotFound
    case keychainError(OSStatus)
    case invalidSignature
    case expiredPayload
    case encryptionFailed
    case decryptionFailed
}
