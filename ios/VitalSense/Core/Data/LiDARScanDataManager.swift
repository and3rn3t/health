import Foundation
import CoreData
import UIKit

/// Core Data manager for LiDAR scan persistence
@MainActor
class LiDARScanDataManager: ObservableObject {
    static let shared = LiDARScanDataManager()

    // MARK: - Core Data Stack
    lazy var persistentContainer: NSPersistentContainer = {
        // Create in-memory model for Core Data
        let model = NSManagedObjectModel()

        // Create LiDARScanEntity description
        let entity = NSEntityDescription()
        entity.name = "LiDARScanEntity"
        entity.managedObjectClassName = NSStringFromClass(LiDARScanEntity.self)

        // Add attributes
        let idAttr = NSAttributeDescription()
        idAttr.name = "id"
        idAttr.attributeType = .UUIDAttributeType
        idAttr.isOptional = false

        let scanTypeAttr = NSAttributeDescription()
        scanTypeAttr.name = "scanType"
        scanTypeAttr.attributeType = .stringAttributeType
        scanTypeAttr.isOptional = false

        let dateAttr = NSAttributeDescription()
        dateAttr.name = "date"
        dateAttr.attributeType = .dateAttributeType
        dateAttr.isOptional = false

        let durationAttr = NSAttributeDescription()
        durationAttr.name = "duration"
        durationAttr.attributeType = .doubleAttributeType
        durationAttr.isOptional = false

        let frameCountAttr = NSAttributeDescription()
        frameCountAttr.name = "frameCount"
        frameCountAttr.attributeType = .integer32AttributeType
        frameCountAttr.isOptional = false

        let qualityAttr = NSAttributeDescription()
        qualityAttr.name = "averageQuality"
        qualityAttr.attributeType = .doubleAttributeType
        qualityAttr.isOptional = false

        let scoreAttr = NSAttributeDescription()
        scoreAttr.name = "score"
        scoreAttr.attributeType = .doubleAttributeType
        scoreAttr.isOptional = false

        let insightsAttr = NSAttributeDescription()
        insightsAttr.name = "insightsData"
        insightsAttr.attributeType = .binaryDataAttributeType
        insightsAttr.isOptional = true

        let metadataAttr = NSAttributeDescription()
        metadataAttr.name = "rawDataMetadata"
        metadataAttr.attributeType = .binaryDataAttributeType
        metadataAttr.isOptional = true

        entity.properties = [
            idAttr, scanTypeAttr, dateAttr, durationAttr,
            frameCountAttr, qualityAttr, scoreAttr, insightsAttr, metadataAttr
        ]

        model.entities = [entity]

        let container = NSPersistentContainer(name: "VitalSenseData", managedObjectModel: model)

        // Create store URL
        let storeURL = FileManager.default
            .urls(for: .documentDirectory, in: .userDomainMask)
            .first?
            .appendingPathComponent("VitalSenseData.sqlite")

        let description = NSPersistentStoreDescription(url: storeURL!)
        description.shouldMigrateStoreAutomatically = true
        description.shouldInferMappingModelAutomatically = true

        container.persistentStoreDescriptions = [description]

        container.loadPersistentStores { _, error in
            if let error = error {
                ErrorHandler.shared.handle(
                    error,
                    context: "Loading Core Data store",
                    category: .data,
                    severity: .critical,
                    recovery: .retry(maxAttempts: 3)
                )
            }
        }

        container.viewContext.automaticallyMergesChangesFromParent = true
        container.viewContext.mergePolicy = NSMergeByPropertyObjectTrumpMergePolicy

        return container
    }()

    var viewContext: NSManagedObjectContext {
        persistentContainer.viewContext
    }

    private init() {
        // Initialize Core Data stack
        _ = persistentContainer
    }

    // MARK: - Save Context

    func saveContext() {
        let context = persistentContainer.viewContext

        if context.hasChanges {
            do {
                try context.save()
            } catch {
                ErrorHandler.shared.handle(
                    error,
                    context: "Saving Core Data context",
                    category: .data,
                    severity: .high,
                    recovery: .retry(maxAttempts: 2)
                )
            }
        }
    }

    // MARK: - Scan Operations

    /// Save a LiDAR scan result to Core Data
    func saveScan(_ scanResult: LiDARScanResult) {
        let context = viewContext
        let entity = LiDARScanEntity(context: context)

        entity.id = scanResult.id
        entity.scanType = scanResult.type.rawValue
        entity.date = scanResult.date
        entity.duration = scanResult.duration
        entity.frameCount = Int32(scanResult.frameCount)
        entity.averageQuality = scanResult.averageQuality
        entity.score = scanResult.score

        // Encode insights as JSON
        if let insightsData = try? JSONEncoder().encode(scanResult.insights) {
            entity.insightsData = insightsData
        }

        // Encode raw data metadata (not storing full frames/arrays due to size)
        let rawDataMeta = RawDataMetadata(
            frameCount: scanResult.rawData.frames.count,
            accelerometerCount: scanResult.rawData.accelerometerData.count,
            gyroscopeCount: scanResult.rawData.gyroscopeData.count
        )
        if let metaData = try? JSONEncoder().encode(rawDataMeta) {
            entity.rawDataMetadata = metaData
        }

        saveContext()

        // Log analytics
        AnalyticsManager.shared.logEvent("lidar_scan_saved_to_core_data", parameters: [
            "scan_type": scanResult.type.rawValue,
            "score": String(format: "%.2f", scanResult.score)
        ])
    }

    /// Fetch all scans, optionally filtered by type and date range
    func fetchScans(
        scanType: LiDARScanningView.ScanType? = nil,
        startDate: Date? = nil,
        endDate: Date? = nil,
        limit: Int? = nil,
        sortAscending: Bool = false
    ) -> [LiDARScanResult] {
        let context = viewContext
        let request: NSFetchRequest<LiDARScanEntity> = LiDARScanEntity.fetchRequest()

        // Build predicate
        var predicates: [NSPredicate] = []

        if let scanType = scanType {
            predicates.append(NSPredicate(format: "scanType == %@", scanType.rawValue))
        }

        if let startDate = startDate {
            predicates.append(NSPredicate(format: "date >= %@", startDate as NSDate))
        }

        if let endDate = endDate {
            predicates.append(NSPredicate(format: "date <= %@", endDate as NSDate))
        }

        if !predicates.isEmpty {
            request.predicate = NSCompoundPredicate(andPredicateWithSubpredicates: predicates)
        }

        // Sort by date
        request.sortDescriptors = [
            NSSortDescriptor(key: "date", ascending: sortAscending)
        ]

        // Limit results
        if let limit = limit {
            request.fetchLimit = limit
        }

        do {
            let entities = try context.fetch(request)
            return entities.compactMap { entity in
                convertEntityToScanResult(entity)
            }
        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Fetching scan history",
                category: .data,
                severity: .medium,
                recovery: .retry(maxAttempts: 1)
            )
            return []
        }
    }

    /// Get scan statistics
    func getScanStatistics(
        scanType: LiDARScanningView.ScanType? = nil,
        startDate: Date? = nil,
        endDate: Date? = nil
    ) -> ScanStatistics {
        let scans = fetchScans(scanType: scanType, startDate: startDate, endDate: endDate)

        guard !scans.isEmpty else {
            return ScanStatistics(
                totalScans: 0,
                averageScore: 0,
                bestScore: 0,
                worstScore: 0,
                scansThisWeek: 0,
                scansThisMonth: 0
            )
        }

        let scores = scans.map { $0.score }
        let averageScore = scores.reduce(0, +) / Double(scores.count)

        let calendar = Calendar.current
        let now = Date()
        let weekStart = calendar.date(byAdding: .day, value: -7, to: now)!
        let monthStart = calendar.date(byAdding: .day, value: -30, to: now)!

        let scansThisWeek = scans.filter { $0.date >= weekStart }.count
        let scansThisMonth = scans.filter { $0.date >= monthStart }.count

        return ScanStatistics(
            totalScans: scans.count,
            averageScore: averageScore,
            bestScore: scores.max() ?? 0,
            worstScore: scores.min() ?? 0,
            scansThisWeek: scansThisWeek,
            scansThisMonth: scansThisMonth
        )
    }

    /// Delete a scan
    func deleteScan(_ scanResult: LiDARScanResult) {
        let context = viewContext
        let request: NSFetchRequest<LiDARScanEntity> = LiDARScanEntity.fetchRequest()
        request.predicate = NSPredicate(format: "id == %@", scanResult.id as CVarArg)
        request.fetchLimit = 1

        do {
            if let entity = try context.fetch(request).first {
                context.delete(entity)
                saveContext()

                AnalyticsManager.shared.logEvent("lidar_scan_deleted", parameters: [
                    "scan_type": scanResult.type.rawValue
                ])
            }
        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Deleting scan",
                category: .data,
                severity: .medium,
                recovery: .retry(maxAttempts: 1)
            )
        }
    }

    /// Delete all scans (use with caution)
    func deleteAllScans() {
        let context = viewContext
        let request: NSFetchRequest<NSFetchRequestResult> = LiDARScanEntity.fetchRequest()
        let deleteRequest = NSBatchDeleteRequest(fetchRequest: request)

        do {
            try context.execute(deleteRequest)
            saveContext()

            AnalyticsManager.shared.logEvent("lidar_all_scans_deleted")
        } catch {
            ErrorHandler.shared.handle(
                error,
                context: "Deleting all scans",
                category: .data,
                severity: .high,
                recovery: .none
            )
        }
    }

    // MARK: - Conversion Helpers

    private func convertEntityToScanResult(_ entity: LiDARScanEntity) -> LiDARScanResult? {
        guard let id = entity.id,
              let scanTypeString = entity.scanType,
              let scanType = LiDARScanningView.ScanType(rawValue: scanTypeString),
              let date = entity.date else {
            return nil
        }

        // Decode insights
        var insights: [LiDARInsight] = []
        if let insightsData = entity.insightsData,
           let decoded = try? JSONDecoder().decode([LiDARInsight].self, from: insightsData) {
            insights = decoded
        }

        // Create placeholder raw data (full frames/arrays not stored)
        let rawData = LiDARRawData(
            frames: [],
            accelerometerData: [],
            gyroscopeData: []
        )

        return LiDARScanResult(
            id: id,
            type: scanType,
            date: date,
            duration: entity.duration,
            frameCount: Int(entity.frameCount),
            averageQuality: entity.averageQuality,
            score: entity.score,
            insights: insights,
            rawData: rawData
        )
    }
}

// MARK: - Core Data Entity

extension LiDARScanEntity {
    @nonobjc public class func fetchRequest() -> NSFetchRequest<LiDARScanEntity> {
        return NSFetchRequest<LiDARScanEntity>(entityName: "LiDARScanEntity")
    }

    @NSManaged public var id: UUID?
    @NSManaged public var scanType: String?
    @NSManaged public var date: Date?
    @NSManaged public var duration: TimeInterval
    @NSManaged public var frameCount: Int32
    @NSManaged public var averageQuality: Double
    @NSManaged public var score: Double
    @NSManaged public var insightsData: Data?
    @NSManaged public var rawDataMetadata: Data?
}

// MARK: - Supporting Types

struct ScanStatistics {
    let totalScans: Int
    let averageScore: Double
    let bestScore: Double
    let worstScore: Double
    let scansThisWeek: Int
    let scansThisMonth: Int
}

struct RawDataMetadata: Codable {
    let frameCount: Int
    let accelerometerCount: Int
    let gyroscopeCount: Int
}
