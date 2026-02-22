//
//  ClinicalGlossary.swift
//  Andernet Posture
//
//  Plain-English names and explanations for every clinical metric,
//  so they can be shared across the session UI, analysis, and PDF export.
//

import Foundation

/// Provides human-friendly names and explanations for clinical metrics.
enum ClinicalGlossary {

    struct Entry: Sendable {
        /// Short everyday name (e.g. "Head Position").
        let plainName: String
        /// One- to two-sentence explanation a layperson can understand.
        let explanation: String
    }

    /// Look up a glossary entry by clinical metric label.
    /// Resolves aliases to canonical keys automatically.
    static func entry(for label: String) -> Entry? {
        if let alias = aliases[label] {
            return entries[alias]
        }
        return entries[label]
    }

    // MARK: - Aliases

    /// Maps variant labels to their canonical key so content isn't duplicated.
    private static let aliases: [String: String] = [
        "Craniovertebral Angle (CVA)": "Craniovertebral Angle",
        "CVA": "Craniovertebral Angle",
        "Sagittal Vertical Axis (SVA)": "Sagittal Vertical Axis",
        "SVA": "Sagittal Vertical Axis",
        "Lateral Trunk Lean": "Lateral Lean",
        "Trunk Lean": "Trunk Forward Lean",
        "Coronal Deviation": "Coronal Spine Deviation",
        "Kendall Type": "Postural Type (Kendall)",
        "Gait Asymmetry": "Gait Asymmetry (Robinson SI)",
        "Fall Risk": "Fall Risk Score",
        "Fall Risk Level": "Fall Risk Score",
        "REBA Score (Ergonomic Risk)": "REBA Score",
        "Hip ROM": "Hip ROM (avg bilateral)",
        "Knee ROM": "Knee ROM (avg bilateral)",
        "Sway Area": "Sway Area (95% ellipse)",
        "Harmonic Ratio": "Harmonic Ratio (AP)",
        "SPARC Score": "Smoothness (SPARC)",
        "Frailty Score": "Frailty (Fried)",
        "Upper Crossed": "Upper Crossed Syndrome",
        "Lower Crossed": "Lower Crossed Syndrome",
        "TUG Time": "Timed Up & Go",
        "6MWD": "6-Minute Walk"
    ]

    // MARK: - Full Dictionary

    private static let entries: [String: Entry] = [
        // ── Posture ──
        "Craniovertebral Angle": Entry(
            plainName: "Head Position",
            explanation: "Measures how far forward your head sits relative to your neck. "
                + "A smaller angle means your head juts forward more than it should."
        ),
        "Sagittal Vertical Axis": Entry(
            plainName: "Body Lean (Front-to-Back)",
            explanation: "How far your upper body leans forward past your hips when "
                + "viewed from the side. Ideally your ear, shoulder, and hip line up vertically."
        ),
        "Trunk Forward Lean": Entry(
            plainName: "Forward Lean",
            explanation: "How much your torso tilts forward while standing or walking. "
                + "A large lean can strain your back and affect your balance."
        ),
        "Lateral Lean": Entry(
            plainName: "Side-to-Side Tilt",
            explanation: "How much your torso tilts to one side. Even a small persistent "
                + "tilt can indicate muscle imbalance or a leg-length difference."
        ),
        "Thoracic Kyphosis": Entry(
            plainName: "Upper Back Rounding",
            explanation: "The natural curve of your upper back. Too much rounding "
                + "(\"hunchback\") or too little (flat back) can cause discomfort and stiffness."
        ),
        "Lumbar Lordosis": Entry(
            plainName: "Lower Back Curve",
            explanation: "The inward curve of your lower back. Too much curve increases "
                + "pressure on spinal joints; too little can lead to a \"flat back\" posture."
        ),
        "Shoulder Asymmetry": Entry(
            plainName: "Uneven Shoulders",
            explanation: "The height difference between your left and right shoulders. "
                + "Significant unevenness may point to muscle tightness or spinal rotation."
        ),
        "Pelvic Obliquity": Entry(
            plainName: "Uneven Hips",
            explanation: "The tilt difference between the left and right sides of your pelvis. "
                + "Uneven hips can affect your walking pattern and cause back strain."
        ),
        "Coronal Spine Deviation": Entry(
            plainName: "Spine Side-Shift",
            explanation: "How far your spine shifts to one side from the center line. "
                + "Significant shift may relate to scoliosis or muscle guarding."
        ),
        "Postural Type (Kendall)": Entry(
            plainName: "Posture Pattern",
            explanation: "A classification of your overall posture shape, such as "
                + "\"ideal,\" \"sway-back,\" or \"flat-back.\" Helps identify which muscles "
                + "may be tight or weak."
        ),

        // ── Gait ──
        "Walking Speed": Entry(
            plainName: "Walking Speed",
            explanation: "How fast you walk in meters per second. Doctors call this "
                + "the \"sixth vital sign\" because it strongly predicts overall health."
        ),
        "Cadence": Entry(
            plainName: "Steps Per Minute",
            explanation: "The number of steps you take each minute. A typical healthy "
                + "adult takes about 100–130 steps per minute at a comfortable pace."
        ),
        "Stride Length": Entry(
            plainName: "Step Size",
            explanation: "The distance covered in one full stride (two steps). Shorter "
                + "strides can indicate weakness, stiffness, or a cautious walking style."
        ),
        "Gait Asymmetry (Robinson SI)": Entry(
            plainName: "Walking Evenness",
            explanation: "Whether your left and right steps are equal in timing and length. "
                + "High asymmetry means one side is doing more work than the other."
        ),
        "Step Width": Entry(
            plainName: "Foot Spacing",
            explanation: "The side-to-side distance between your feet during walking. "
                + "Very narrow or very wide spacing can affect balance."
        ),
        "Gait Pattern": Entry(
            plainName: "Walking Pattern",
            explanation: "An overall classification of your walking style — normal, "
                + "cautious, shuffling, or other patterns that therapists look for."
        ),
        "Walk Ratio": Entry(
            plainName: "Step Efficiency",
            explanation: "The ratio of step length to step rate. It measures how "
                + "efficiently your body coordinates each stride."
        ),
        "Estimated MET": Entry(
            plainName: "Energy Level",
            explanation: "An estimate of how much energy your body uses during the "
                + "session, compared to sitting still (1 MET). Higher means more active."
        ),

        // ── Range of Motion ──
        "Hip ROM (avg bilateral)": Entry(
            plainName: "Hip Flexibility",
            explanation: "How far your hips bend during each step. Limited hip motion "
                + "can shorten your stride and put extra stress on your lower back."
        ),
        "Knee ROM (avg bilateral)": Entry(
            plainName: "Knee Bend",
            explanation: "How far your knees bend during the swing phase of walking. "
                + "Reduced knee bend can cause stiff-legged or shuffling gait."
        ),
        "Trunk Rotation Range": Entry(
            plainName: "Torso Twist",
            explanation: "How much your upper body rotates from side to side while walking. "
                + "Some rotation is normal and helps with arm swing and balance."
        ),
        "Arm Swing Asymmetry": Entry(
            plainName: "Arm Swing Balance",
            explanation: "Whether both arms swing equally during walking. One-sided "
                + "reduction can be an early sign of neurological or shoulder issues."
        ),

        // ── Balance ──
        "Sway Velocity": Entry(
            plainName: "Body Sway Speed",
            explanation: "How quickly your body drifts back and forth while you stand. "
                + "Faster sway means your balance system is working harder to keep you steady."
        ),
        "Sway Area (95% ellipse)": Entry(
            plainName: "Balance Footprint",
            explanation: "The area your body sways over while standing still. A larger "
                + "area means less stable standing balance."
        ),
        "Romberg Ratio": Entry(
            plainName: "Eyes-Closed Balance",
            explanation: "How much worse your balance gets when you close your eyes. "
                + "A high ratio may suggest your balance relies heavily on vision."
        ),

        // ── Risk Assessment ──
        "Fall Risk Score": Entry(
            plainName: "Fall Risk",
            explanation: "A composite score (0–100) that estimates your risk of falling, "
                + "based on your walking speed, balance, and other factors."
        ),
        "Fatigue Index": Entry(
            plainName: "Tiredness During Session",
            explanation: "How much your posture and walking quality declined from the "
                + "start to the end of the session. Higher means more fatigue."
        ),
        "REBA Score": Entry(
            plainName: "Ergonomic Risk",
            explanation: "Rates the physical stress of your postures on a 1–15 scale. "
                + "Higher scores mean your body positions put more strain on your joints."
        ),
        "Smoothness (SPARC)": Entry(
            plainName: "Movement Smoothness",
            explanation: "How fluid and controlled your movements are. Jerky or uneven "
                + "movements score lower, which can indicate neurological or joint issues."
        ),
        "Harmonic Ratio (AP)": Entry(
            plainName: "Walking Rhythm",
            explanation: "How regular and rhythmic your walking pattern is. A higher "
                + "ratio means a more steady, predictable stride."
        ),
        "Upper Crossed Syndrome": Entry(
            plainName: "Rounded Shoulder Pattern",
            explanation: "A common muscle imbalance where chest and neck muscles "
                + "tighten while upper back muscles weaken, pulling shoulders forward."
        ),
        "Lower Crossed Syndrome": Entry(
            plainName: "Swayback Pattern",
            explanation: "A muscle imbalance where hip flexors and lower back tighten "
                + "while glutes and abdominals weaken, tilting the pelvis forward."
        ),
        "Frailty (Fried)": Entry(
            plainName: "Overall Robustness",
            explanation: "A 0–5 score assessing physical frailty. Higher scores "
                + "indicate reduced strength, endurance, and activity level."
        ),
        "Timed Up & Go": Entry(
            plainName: "Get-Up-and-Walk Test",
            explanation: "Times how long it takes to stand from a chair, walk 3 meters, "
                + "turn around, walk back, and sit down. Slower times indicate higher fall risk."
        ),
        "6-Minute Walk": Entry(
            plainName: "Endurance Walk",
            explanation: "The total distance you can walk in 6 minutes at your own pace. "
                + "A key measure of your overall exercise capacity and cardiovascular fitness."
        ),
        "NYPR Score": Entry(
            plainName: "Posture Rating",
            explanation: "A standardized posture score based on the New York Posture "
                + "Rating system, evaluating your body alignment across multiple regions."
        ),
        "Posture Score": Entry(
            plainName: "Overall Posture Score",
            explanation: "An overall score from 0–100 representing how well your body "
                + "is aligned. Higher is better."
        )
    ]
}
