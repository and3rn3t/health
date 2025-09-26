// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "VitalSense",
    platforms: [
        .iOS(.v16),
        .watchOS(.v9),
        .macOS(.v13)
    ],
    products: [
        .library(name: "VitalSenseCore", targets: ["VitalSenseCore"])
    ],
    dependencies: [
        // Add common dependencies that might be useful for a health app
        .package(url: "https://github.com/apple/swift-algorithms", from: "1.2.0"),
        .package(url: "https://github.com/apple/swift-collections", from: "1.0.0"),
        .package(url: "https://github.com/pointfreeco/swift-composable-architecture", from: "1.0.0")
    ],
    targets: [
        .target(
            name: "VitalSenseCore",
            dependencies: [
                .product(name: "Algorithms", package: "swift-algorithms"),
                .product(name: "Collections", package: "swift-collections")
            ]
        )
    ]
)
