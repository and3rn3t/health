import Foundation
import CoreData

/// Core Data entity for LiDAR scan results
@objc(LiDARScanEntity)
public class LiDARScanEntity: NSManagedObject {

}

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

extension LiDARScanEntity: Identifiable {

}
