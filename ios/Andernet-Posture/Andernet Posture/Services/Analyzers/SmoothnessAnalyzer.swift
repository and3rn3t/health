//
//  SmoothnessAnalyzer.swift
//  Andernet Posture
//
//  Movement smoothness analysis using SPARC (Spectral Arc Length)
//  and Harmonic Ratio metrics from accelerometer data.
//
//  References:
//  - Balasubramanian S et al., J Neuroengineering Rehab, 2015 (SPARC)
//  - Menz HB et al., Gait & Posture, 2003 (Harmonic Ratio)
//  - Lowry KA et al., Gait & Posture, 2012 (gait smoothness interpretation)
//

import Foundation
import Accelerate

// MARK: - Results

/// Movement smoothness metrics.
struct SmoothnessMetrics: Sendable {
    /// SPARC (Spectral Arc Length) — more negative = less smooth.
    /// Normal walking ≈ -1.5 to -2.5. Pathological > -3.0.
    let sparcScore: Double

    /// Harmonic Ratio — ratio of even to odd harmonics in acceleration.
    /// Higher = smoother. Normal > 2.0 for AP, > 1.5 for ML.
    let harmonicRatioAP: Double
    let harmonicRatioML: Double

    /// Jerk metric — derivative of acceleration magnitude. Lower = smoother.
    let normalizedJerk: Double
}

// MARK: - Protocol

protocol SmoothnessAnalyzer: AnyObject {
    /// Record an acceleration sample for smoothness analysis.
    func recordSample(
        timestamp: TimeInterval,
        accelerationAP: Double,   // anteroposterior (Z in body frame)
        accelerationML: Double,   // mediolateral (X in body frame)
        accelerationV: Double     // vertical (Y in body frame)
    )

    /// Compute smoothness metrics from recorded samples.
    func analyze() -> SmoothnessMetrics

    /// Reset state.
    func reset()
}

// MARK: - Default Implementation

final class DefaultSmoothnessAnalyzer: SmoothnessAnalyzer {

    private struct AccelSample {
        let timestamp: TimeInterval
        let ap: Double
        let ml: Double
        let v: Double
    }

    private var samples: [AccelSample] = []

    /// Minimum samples for FFT-based analysis (~3 seconds at 60Hz).
    private let minSamples = 128

    /// Maximum samples to retain (~10 minutes at 60Hz). Older samples are
    /// dropped to bound memory; analyze() uses the most recent window anyway.
    private let maxSamples = 36_000

    // MARK: - Record

    func recordSample(
        timestamp: TimeInterval,
        accelerationAP: Double,
        accelerationML: Double,
        accelerationV: Double
    ) {
        samples.append(AccelSample(
            timestamp: timestamp, ap: accelerationAP,
            ml: accelerationML, v: accelerationV
        ))
        // Cap buffer to prevent unbounded memory growth
        if samples.count > maxSamples {
            samples.removeFirst(samples.count - maxSamples)
        }
    }

    // MARK: - Analyze

    func analyze() -> SmoothnessMetrics {
        guard samples.count >= minSamples else {
            return SmoothnessMetrics(sparcScore: 0, harmonicRatioAP: 0,
                                    harmonicRatioML: 0, normalizedJerk: 0)
        }

        // Compute sampling frequency
        let totalTime = (samples.last?.timestamp ?? 0) - (samples.first?.timestamp ?? 0)
        guard totalTime > 0.5 else {
            return SmoothnessMetrics(sparcScore: 0, harmonicRatioAP: 0,
                                    harmonicRatioML: 0, normalizedJerk: 0)
        }
        let fs = Double(samples.count) / totalTime

        // Compute magnitude of acceleration
        let magnitudes = samples.map { sqrt($0.ap * $0.ap + $0.ml * $0.ml + $0.v * $0.v) }

        // SPARC
        let sparc = computeSPARC(signal: magnitudes, fs: fs)

        // Harmonic Ratio — AP uses even/odd, ML uses odd/even (Menz et al., 2003)
        let hrAP = computeHarmonicRatio(signal: samples.map(\.ap), fs: fs, isML: false)
        let hrML = computeHarmonicRatio(signal: samples.map(\.ml), fs: fs, isML: true)

        // Normalized Jerk
        let jerk = computeNormalizedJerk(signal: magnitudes, fs: fs, duration: totalTime)

        return SmoothnessMetrics(
            sparcScore: sparc,
            harmonicRatioAP: hrAP,
            harmonicRatioML: hrML,
            normalizedJerk: jerk
        )
    }

    func reset() {
        samples.removeAll()
    }

    // MARK: - SPARC (Spectral Arc Length)

    /// Compute SPARC: the arc length of the normalized frequency spectrum of the speed profile.
    /// More negative = less smooth.
    /// Uses Accelerate framework vDSP FFT for O(n log n) performance.
    /// Ref: Balasubramanian S et al., 2015.
    private func computeSPARC(signal: [Double], fs: Double) -> Double {
        let n = signal.count
        guard n >= 4 else { return 0 }

        let nfft = nextPowerOfTwo(n)
        let freqResolution = fs / Double(nfft)
        let maxFreq = min(20.0, fs / 2) // Limit to 20 Hz (gait relevant)
        let maxBin = Int(maxFreq / freqResolution)

        // Compute FFT using Accelerate framework
        let spectrum = computeFFTMagnitudes(signal: signal, nfft: nfft, maxBin: maxBin)
        guard !spectrum.isEmpty else { return 0 }

        // Normalize spectrum
        guard let maxMag = spectrum.max(), maxMag > 1e-10 else { return 0 }
        let normalized = spectrum.map { $0 / maxMag }

        // Arc length of normalized spectrum in normalized frequency domain
        // Frequency spacing in normalized domain: df_norm = freqResolution / maxFreq
        // Ref: Balasubramanian 2015 — arc length in normalized (ω̂) space
        var arcLength = 0.0
        let dfNorm = maxFreq > 0 ? freqResolution / maxFreq : 1.0
        for i in 1..<normalized.count {
            let dMag = normalized[i] - normalized[i-1]
            arcLength += sqrt(dfNorm * dfNorm + dMag * dMag)
        }

        return -arcLength // Negative: more negative = less smooth
    }

    /// Compute FFT magnitudes using Accelerate vDSP for O(n log n) performance.
    /// Falls back to manual DFT for non-power-of-two or very small arrays.
    private func computeFFTMagnitudes(signal: [Double], nfft: Int, maxBin: Int) -> [Double] {
        let n = signal.count

        // Pad signal to nfft length
        var padded = [Double](repeating: 0, count: nfft)
        for i in 0..<min(n, nfft) { padded[i] = signal[i] }

        // Use vDSP for FFT
        let halfN = nfft / 2
        guard let fftSetup = vDSP_create_fftsetupD(vDSP_Length(log2(Double(nfft))), FFTRadix(kFFTRadix2)) else {
            // Fallback to manual DFT
            return computeDFTMagnitudes(signal: signal, n: n, nfft: nfft, maxBin: maxBin)
        }
        defer { vDSP_destroy_fftsetupD(fftSetup) }

        // Split complex format
        var realp = [Double](repeating: 0, count: halfN)
        var imagp = [Double](repeating: 0, count: halfN)

        // Convert to split complex
        padded.withUnsafeBufferPointer { ptr in
            ptr.baseAddress!.withMemoryRebound(to: DSPDoubleComplex.self, capacity: halfN) { complexPtr in
                var splitComplex = DSPDoubleSplitComplex(realp: &realp, imagp: &imagp)
                vDSP_ctozD(complexPtr, 2, &splitComplex, 1, vDSP_Length(halfN))
            }
        }

        // Perform FFT
        var splitComplex = DSPDoubleSplitComplex(realp: &realp, imagp: &imagp)
        vDSP_fft_zripD(fftSetup, &splitComplex, 1, vDSP_Length(log2(Double(nfft))), FFTDirection(FFT_FORWARD))

        // Extract magnitudes for bins 0..maxBin
        let binCount = min(maxBin + 1, halfN)
        var magnitudes = [Double](repeating: 0, count: binCount)
        let scale = 1.0 / Double(nfft)
        for k in 0..<binCount {
            let re = realp[k] * scale
            let im = imagp[k] * scale
            magnitudes[k] = sqrt(re * re + im * im)
        }

        return magnitudes
    }

    /// Fallback manual DFT for when Accelerate FFT setup fails.
    private func computeDFTMagnitudes(signal: [Double], n: Int, nfft: Int, maxBin: Int) -> [Double] {
        var spectrum: [Double] = []
        for k in 0...min(maxBin, nfft / 2) {
            var real = 0.0, imag = 0.0
            for i in 0..<n {
                let angle = -2.0 * Double.pi * Double(k) * Double(i) / Double(nfft)
                real += signal[i] * cos(angle)
                imag += signal[i] * sin(angle)
            }
            let mag = sqrt(real * real + imag * imag) / Double(n)
            spectrum.append(mag)
        }
        return spectrum
    }

    // MARK: - Harmonic Ratio

    /// Compute harmonic ratio: ratio of even to odd harmonics (AP/vertical),
    /// or odd to even (ML) due to bilateral symmetry of mediolateral acceleration.
    /// Higher values indicate smoother, more symmetric gait.
    /// Ref: Menz HB et al., Gait & Posture, 2003.
    private func computeHarmonicRatio(signal: [Double], fs: Double, isML: Bool) -> Double {
        let n = signal.count
        guard n >= 4 else { return 0 }

        // Compute first 20 harmonics via DFT
        let nHarmonics = 20

        // Estimate fundamental stride frequency from power spectrum peak detection
        // rather than using a hardcoded value. Stride frequency typically 0.7–1.3 Hz.
        let strideFundamental = estimateStrideFundamental(signal: signal, fs: fs)
        let binSize = fs / Double(n)

        var harmonicMags: [Double] = Array(repeating: 0, count: nHarmonics)
        for h in 1...nHarmonics {
            let targetFreq = strideFundamental * Double(h)
            let k = Int(round(targetFreq / binSize))
            guard k < n / 2 else { break }

            var real = 0.0, imag = 0.0
            for i in 0..<n {
                let angle = -2.0 * Double.pi * Double(k) * Double(i) / Double(n)
                real += signal[i] * cos(angle)
                imag += signal[i] * sin(angle)
            }
            harmonicMags[h - 1] = sqrt(real * real + imag * imag) / Double(n)
        }

        // Even harmonics sum (h=2,4,6...) and odd harmonics sum (h=1,3,5...)
        var evenSum = 0.0, oddSum = 0.0
        for i in 0..<nHarmonics {
            if (i + 1) % 2 == 0 {
                evenSum += harmonicMags[i]
            } else {
                oddSum += harmonicMags[i]
            }
        }

        // AP/Vertical: even/odd (bilaterally symmetric signal has dominant even harmonics)
        // ML: odd/even (bilaterally symmetric ML has dominant odd harmonics)
        // Ref: Menz HB et al., 2003
        if isML {
            guard evenSum > 1e-10 else { return 0 }
            return oddSum / evenSum
        } else {
            guard oddSum > 1e-10 else { return 0 }
            return evenSum / oddSum
        }
    }

    /// Estimate fundamental stride frequency from the power spectrum.
    /// Finds the dominant frequency in the 0.7–1.3 Hz range.
    /// Falls back to 1.0 Hz if detection fails.
    private func estimateStrideFundamental(signal: [Double], fs: Double) -> Double {
        let n = signal.count
        let binSize = fs / Double(n)
        let minBin = max(1, Int(0.7 / binSize))
        let maxBin = min(n / 2 - 1, Int(1.3 / binSize))
        guard minBin < maxBin else { return 1.0 }

        var maxPower = 0.0
        var peakBin = Int(1.0 / binSize)  // default to 1 Hz

        for k in minBin...maxBin {
            var real = 0.0, imag = 0.0
            for i in 0..<n {
                let angle = -2.0 * Double.pi * Double(k) * Double(i) / Double(n)
                real += signal[i] * cos(angle)
                imag += signal[i] * sin(angle)
            }
            let power = real * real + imag * imag
            if power > maxPower {
                maxPower = power
                peakBin = k
            }
        }

        return Double(peakBin) * binSize
    }

    // MARK: - Normalized Jerk

    /// Compute normalized jerk (dimensionless).
    /// Lower values indicate smoother movement.
    private func computeNormalizedJerk(signal: [Double], fs: Double, duration: Double) -> Double {
        guard signal.count >= 3, duration > 0, fs > 0 else { return 0 }

        let dt = 1.0 / fs
        var jerkSum = 0.0

        // Jerk = derivative of acceleration
        for i in 1..<(signal.count - 1) {
            let accelPrev = signal[i - 1]
            let accelNext = signal[i + 1]
            let jerk = (accelNext - accelPrev) / (2.0 * dt)
            jerkSum += jerk * jerk
        }

        // Normalize: -0.5 * T^5 / D^2 * integral(jerk^2)
        // Using simplified version: sqrt(jerk^2 / T) * T^(5/2)
        let peakAmp = (signal.max() ?? 1) - (signal.min() ?? 0)
        guard peakAmp > 1e-10 else { return 0 }

        let meanJerk2 = jerkSum / Double(signal.count - 2)
        return sqrt(meanJerk2) * pow(duration, 1.5) / peakAmp
    }

    // MARK: - Helpers

    private func nextPowerOfTwo(_ n: Int) -> Int {
        var p = 1
        while p < n { p *= 2 }
        return p
    }
}
