// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "VitalSense",
    platforms: [
        .iOS(.v26),
        .watchOS(.v11),
        .macOS(.v15)
    ],
    products: [
        .library(name: "VitalSenseCore", targets: ["VitalSenseCore"])
    ],
    dependencies: [
        // Add common dependencies that might be useful for a health app
        .package(url: "https://github.com/apple/swift-algorithms", from: "1.2.1"),
        .package(url: "https://github.com/apple/swift-collections", from: "1.0.0")
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
