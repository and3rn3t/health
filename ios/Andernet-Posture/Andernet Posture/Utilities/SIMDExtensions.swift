//
//  SIMDExtensions.swift
//  Andernet Posture
//
//  Helper extensions for SIMD math operations used in posture/gait analysis.
//

import simd

extension SIMD3 where Scalar == Float {
    /// Horizontal distance (XZ plane) between two points.
    func xzDistance(to other: SIMD3<Float>) -> Float {
        let dx = self.x - other.x
        let dz = self.z - other.z
        return sqrt(dx * dx + dz * dz)
    }

    /// Angle in degrees between this vector and the global up vector (0, 1, 0).
    var angleFromVerticalDeg: Float {
        let up = SIMD3<Float>(0, 1, 0)
        let norm = simd_length(self) > 0.001 ? simd_normalize(self) : up
        let cosTheta = simd_clamp(simd_dot(norm, up), -1, 1)
        return acos(cosTheta) * 180 / .pi
    }

    // MARK: - Plane Projections

    /// Project this vector onto the sagittal plane (YZ) and return its angle from vertical in degrees.
    /// Positive = forward lean. Uses atan2 for signed result.
    func sagittalAngleFromVerticalDeg() -> Float {
        let projected = SIMD2<Float>(self.z, self.y) // (forward, up)
        let len = simd_length(projected)
        guard len > 0.001 else { return 0 }
        return atan2(projected.x, projected.y) * 180 / .pi
    }

    /// Project this vector onto the frontal plane (XY) and return its angle from vertical in degrees.
    /// Positive = lean to right (positive X). Uses atan2 for signed result.
    func frontalAngleFromVerticalDeg() -> Float {
        let projected = SIMD2<Float>(self.x, self.y) // (right, up)
        let len = simd_length(projected)
        guard len > 0.001 else { return 0 }
        return atan2(projected.x, projected.y) * 180 / .pi
    }

    // MARK: - Geometric Utilities

    /// Horizontal (single-axis) offset in centimeters.
    func horizontalOffsetCm(to other: SIMD3<Float>, axis: WritableKeyPath<SIMD3<Float>, Float>) -> Float {
        return (other[keyPath: axis] - self[keyPath: axis]) * 100
    }
}

// MARK: - Free Functions

/// Angle at vertex B formed by rays BA and BC, in degrees (0–180).
/// Uses the dot-product formula: angle = acos(BA·BC / |BA||BC|)
/// Returns 180° if either ray has zero length (coincident points).
func threePointAngleDeg(a: SIMD3<Float>, vertex: SIMD3<Float>, c: SIMD3<Float>) -> Float {
    let va = a - vertex
    let vc = c - vertex
    let lenA = simd_length(va)
    let lenC = simd_length(vc)
    guard lenA > 0.0001, lenC > 0.0001 else { return 180.0 }
    let ba = va / lenA
    let bc = vc / lenC
    let dot = simd_clamp(simd_dot(ba, bc), -1, 1)
    return acos(dot) * 180 / .pi
}

/// Perpendicular distance from a point to a line defined by two points, in meters.
func pointToLineDistance(_ point: SIMD3<Float>, lineStart: SIMD3<Float>, lineEnd: SIMD3<Float>) -> Float {
    let lineDir = lineEnd - lineStart
    let len = simd_length(lineDir)
    guard len > 0.001 else { return simd_length(point - lineStart) }
    let t = simd_dot(point - lineStart, lineDir) / (len * len)
    let projection = lineStart + simd_clamp(t, 0, 1) * lineDir
    return simd_length(point - projection)
}

/// Signed angle between two 2D vectors in degrees using atan2 (cross-product for sign).
func signedAngle2D(_ a: SIMD2<Float>, _ b: SIMD2<Float>) -> Float {
    let cross = a.x * b.y - a.y * b.x
    let dot = simd_dot(a, b)
    return atan2(cross, dot) * 180 / .pi
}

/// Simple linear regression on indexed values. Returns (slope, intercept, rSquared).
func linearRegression(_ ys: [Double]) -> (slope: Double, intercept: Double, rSquared: Double) {
    guard ys.count >= 2 else { return (0, ys.first ?? 0, 0) }
    let n = Double(ys.count)
    let xs = (0..<ys.count).map(Double.init)
    let sumX = xs.reduce(0, +)
    let sumY = ys.reduce(0, +)
    let sumXY = zip(xs, ys).reduce(0) { $0 + $1.0 * $1.1 }
    let sumX2 = xs.reduce(0) { $0 + $1 * $1 }
    let denom = n * sumX2 - sumX * sumX
    guard abs(denom) > 1e-12 else { return (0, sumY / n, 0) }
    let slope = (n * sumXY - sumX * sumY) / denom
    let intercept = (sumY - slope * sumX) / n
    let meanY = sumY / n
    let ssTot = ys.reduce(0.0) { $0 + ($1 - meanY) * ($1 - meanY) }
    let ssRes = zip(xs, ys).reduce(0.0) {
        let predicted = slope * $1.0 + intercept
        return $0 + ($1.1 - predicted) * ($1.1 - predicted)
    }
    let r2 = ssTot > 1e-12 ? 1.0 - ssRes / ssTot : 0
    return (slope, intercept, r2)
}

// MARK: - Statistical Helpers

/// Sample standard deviation (Bessel-corrected, n − 1 denominator).
/// Returns 0 if fewer than 2 values.
func standardDeviation(_ values: [Double]) -> Double {
    guard values.count >= 2 else { return 0 }
    let mean = values.reduce(0, +) / Double(values.count)
    let variance = values.reduce(0.0) { $0 + ($1 - mean) * ($1 - mean) } / Double(values.count - 1)
    return sqrt(variance)
}
