import Foundation
import UIKit
import Combine

@MainActor
final class Telemetry {
    static let shared = Telemetry()

    struct Event: Identifiable, Codable {
        let id: UUID
        let name: String
        let timestamp: Date
        let metadata: [String: String]?
        let sequence: Int
        init(name: String, metadata: [String: String]?, sequence: Int) {
            self.id = UUID()
            self.name = name
            self.timestamp = Date()
            self.metadata = metadata
            self.sequence = sequence
        }
    }

    enum Kind {
        case permissionFunnel(stage: String)
        case fallRiskLoad(String)
        case gaitLoad(String)
        case metricSelect(name: String)
        case emptyShown(kind: String)   // kind: empty_no_data, etc.
        case errorShown(kind: String)   // kind: network, generic
        case hapticsToggle(enabled: Bool)
        case pseudoLocaleToggle(enabled: Bool)
        case streamStatus(started: Bool)
    }

    @Published private(set) var recent: [Event] = []
    private let maxEvents = 300
    private let sessionId: String
    private var sessionMeta: SessionMeta
    private var sequenceCounter: Int = 0
    private let persistKey = "telemetry_recent_events"
    private let persistCount = 60
    private let persistSessionIdKey = "telemetry_session_id"
    private let persistSessionMetaKey = "telemetry_session_meta"

    struct SessionMeta: Codable {
        let id: String
        let startedAt: Date
        let appVersion: String
        let build: String
        let osVersion: String
        let deviceModel: String
    }

    private init() {
        if let existingId = UserDefaults.standard.string(forKey: persistSessionIdKey),
           let metaData = UserDefaults.standard.data(forKey: persistSessionMetaKey),
           let decoded = try? JSONDecoder().decode(SessionMeta.self, from: metaData) {
            self.sessionId = existingId
            self.sessionMeta = decoded
        } else {
            let newId = UUID().uuidString
            let info = Bundle.main.infoDictionary
            let version = (info?["CFBundleShortVersionString"] as? String) ?? "-"
            let build = (info?["CFBundleVersion"] as? String) ?? "-"
            let os = UIDevice.current.systemVersion
            let model = UIDevice.current.model
            let meta = SessionMeta(id: newId, startedAt: Date(), appVersion: version, build: build, osVersion: os, deviceModel: model)
            self.sessionId = newId
            self.sessionMeta = meta
            if let data = try? JSONEncoder().encode(meta) {
                UserDefaults.standard.set(newId, forKey: persistSessionIdKey)
                UserDefaults.standard.set(data, forKey: persistSessionMetaKey)
            }
        }
        loadPersisted()
    }

    func record(_ kind: Kind) {
        let (name, meta): (String, [String: String]?) = {
            switch kind {
            case .permissionFunnel(let stage): return ("permission_funnel", ["stage": stage])
            case .fallRiskLoad(let state): return ("fall_risk_load", ["state": state])
            case .gaitLoad(let state): return ("gait_load", ["state": state])
            case .metricSelect(let name): return ("metric_select", ["metric": name])
            case .emptyShown(let kind): return ("empty_state", ["kind": kind])
            case .errorShown(let kind): return ("error_state", ["kind": kind])
            case .hapticsToggle(let enabled): return ("haptics_toggle", ["enabled": enabled.description])
            case .pseudoLocaleToggle(let enabled): return ("pseudo_locale_toggle", ["enabled": enabled.description])
            case .streamStatus(let started): return ("stream_status", ["state": started ? "started" : "stopped"])}
        }()
    sequenceCounter &+= 1
    var enriched = meta ?? [:]
    enriched["session_id"] = sessionId
    enriched["seq"] = String(sequenceCounter)
    if sequenceCounter == 1 { // attach meta only once
        enriched["app_version"] = sessionMeta.appVersion
        enriched["build"] = sessionMeta.build
        enriched["os_version"] = sessionMeta.osVersion
        enriched["device_model"] = sessionMeta.deviceModel
    }
    let evt = Event(name: name, metadata: enriched, sequence: sequenceCounter)
        recent.insert(evt, at: 0)
        if recent.count > maxEvents { recent.removeLast(recent.count - maxEvents) }
        persistSubset()
        #if DEBUG
        print("📊 Telemetry: \(name) \(meta ?? [:])")
        #endif
    }

    func clear() { recent.removeAll(); UserDefaults.standard.removeObject(forKey: persistKey) }

    func currentSessionMeta() -> SessionMeta { sessionMeta }

    // Lightweight privacy scrub: remove any key heuristically matching PII-like patterns.
    func scrubbed(_ events: [Event]) -> [Event] {
        let piiKeys = ["user", "email", "address", "token"]
        return events.map { evt in
            guard var md = evt.metadata else { return evt }
            for key in md.keys {
                if piiKeys.contains(where: { key.lowercased().contains($0) }) { md[key] = "<redacted>" }
            }
            return Event(name: evt.name, metadata: md, sequence: evt.sequence)
        }
    }

    private func persistSubset() {
        let subset = Array(recent.prefix(persistCount))
        do {
            let data = try JSONEncoder().encode(subset)
            UserDefaults.standard.set(data, forKey: persistKey)
        } catch {
            #if DEBUG
            print("⚠️ Telemetry persistence failed: \(error)")
            #endif
        }
    }

    private func loadPersisted() {
        guard let data = UserDefaults.standard.data(forKey: persistKey) else { return }
        if let decoded = try? JSONDecoder().decode([Event].self, from: data) {
            recent = decoded
        }
    }
}
