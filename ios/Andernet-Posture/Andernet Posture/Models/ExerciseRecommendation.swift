//
//  ExerciseRecommendation.swift
//  Andernet Posture
//
//  Evidence-based exercise and corrective recommendations
//  linked to specific clinical findings.
//

import Foundation

// MARK: - ExerciseRecommendation

/// A single corrective exercise or intervention recommended when a metric is out of normal range.
struct ExerciseRecommendation: Identifiable, Sendable {
    let id = UUID()
    let name: String
    let description: String
    let instructions: [String]
    let icon: String
    let duration: String          // e.g. "30 seconds", "10 reps × 3 sets"
    let frequency: String         // e.g. "3× daily", "Every 2 hours"
    let difficulty: Difficulty
    let targetArea: String        // e.g. "Cervical spine", "Hamstrings"
    let evidenceBasis: String     // brief citation or rationale

    enum Difficulty: String, Sendable, CaseIterable {
        case beginner
        case intermediate
        case advanced

        var label: String { rawValue.capitalized }

        var icon: String {
            switch self {
            case .beginner: return "1.circle.fill"
            case .intermediate: return "2.circle.fill"
            case .advanced: return "3.circle.fill"
            }
        }
    }
}

// MARK: - Exercise Library

/// Central library of exercises keyed by the clinical condition they address.
/// All exercises are evidence-informed and suitable for self-guided use with the caveat
/// that users should consult their healthcare provider.
enum ExerciseLibrary {

    // MARK: - Forward Head Posture (Low CVA)

    static let forwardHeadPosture: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Chin Tucks",
            description: "Retract your chin straight back to align your head over your spine. " +
                "This is the gold-standard exercise for forward head posture correction.",
            instructions: [
                "Sit or stand tall with shoulders relaxed.",
                "Look straight ahead — do not tilt your head up or down.",
                "Gently draw your chin straight back, creating a 'double chin.'",
                "Hold for 5 seconds, feeling a stretch at the base of your skull.",
                "Release slowly and repeat."
            ],
            icon: "person.crop.circle",
            duration: "10 reps × 3 sets",
            frequency: "Every 2 hours during desk work",
            difficulty: .beginner,
            targetArea: "Deep cervical flexors",
            evidenceBasis: "Harman et al., 2005; Diab & Moustafa, 2012 — chin tucks significantly improve CVA and reduce neck pain."
        ),
        ExerciseRecommendation(
            name: "Cervical Retraction with Overpressure",
            description: "A progression of the basic chin tuck, adding gentle manual pressure to increase range of motion and strengthen deep neck flexors.",
            instructions: [
                "Perform a chin tuck as described above.",
                "At end range, place two fingers on your chin.",
                "Apply gentle additional pressure to push the chin further back.",
                "Hold for 3 seconds, then release.",
                "Repeat 10 times."
            ],
            icon: "hand.raised.fill",
            duration: "10 reps × 2 sets",
            frequency: "2–3× daily",
            difficulty: .intermediate,
            targetArea: "Deep cervical flexors, suboccipitals",
            evidenceBasis: "McKenzie method — progressive cervical retraction with overpressure improves cervical ROM and posture."
        ),
        ExerciseRecommendation(
            name: "Upper Trapezius Stretch",
            description: "Gently stretches the upper trapezius which becomes tight with forward head posture, contributing to neck tension and headaches.",
            instructions: [
                "Sit tall with good posture.",
                "Reach your right hand over the top of your head to the left temple.",
                "Gently tilt your head to the right until you feel a stretch on the left side of your neck.",
                "Hold for 20–30 seconds.",
                "Switch sides and repeat."
            ],
            icon: "figure.flexibility",
            duration: "30 sec each side × 3",
            frequency: "2–3× daily",
            difficulty: .beginner,
            targetArea: "Upper trapezius, levator scapulae",
            evidenceBasis: "Lee et al., 2017 — stretching upper trapezius reduces forward head posture and neck pain."
        ),
        ExerciseRecommendation(
            name: "Supine Cervical Retraction",
            description: "Lying-down version of the chin tuck that uses gravity to assist and is excellent for building deep neck flexor endurance.",
            instructions: [
                "Lie on your back on a firm surface without a pillow.",
                "Gently tuck your chin toward your throat.",
                "Press the back of your head into the surface.",
                "Hold for 10 seconds, breathing normally.",
                "Relax and repeat."
            ],
            icon: "bed.double.fill",
            duration: "10 sec hold × 10 reps",
            frequency: "Once daily (before sleep)",
            difficulty: .beginner,
            targetArea: "Deep cervical flexors",
            evidenceBasis: "Jull et al., 2008 — craniocervical flexion training improves deep neck flexor activation and reduces neck pain."
        )
    ]

    // MARK: - Sagittal Imbalance (High SVA / Trunk Forward Lean)

    static let sagittalImbalance: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Wall Angels",
            description: "Strengthens mid-back extensors and opens the chest, counteracting forward lean and rounded shoulders.",
            instructions: [
                "Stand with your back flat against a wall, feet about 6 inches from the wall.",
                "Press your head, upper back, and lower back into the wall.",
                "Raise arms to a 'goalpost' position, elbows at 90°, backs of hands on the wall.",
                "Slowly slide arms up overhead while maintaining contact with the wall.",
                "Slide back down slowly. Repeat."
            ],
            icon: "figure.arms.open",
            duration: "10 reps × 3 sets",
            frequency: "Once daily",
            difficulty: .beginner,
            targetArea: "Thoracic extensors, rhomboids, lower trapezius",
            evidenceBasis: "Kendall et al., 2005 — wall slides activate postural extensors and improve thoracic extension."
        ),
        ExerciseRecommendation(
            name: "Prone Y-T-W Raises",
            description: "Face-down exercises that activate the posterior chain muscles critical for upright posture.",
            instructions: [
                "Lie face down on the floor or a bench, arms hanging down.",
                "Y: Raise arms at 45° above head (thumbs up). Hold 5 sec.",
                "T: Raise arms straight out to the sides. Hold 5 sec.",
                "W: Bend elbows to 90° and squeeze shoulder blades together. Hold 5 sec.",
                "Lower slowly between each position. Repeat the full cycle."
            ],
            icon: "figure.strengthtraining.traditional",
            duration: "8 reps of each × 2 sets",
            frequency: "3–4× per week",
            difficulty: .intermediate,
            targetArea: "Lower trapezius, rhomboids, posterior deltoid",
            evidenceBasis: "Cools et al., 2007 — Y-T-W exercises effectively activate scapular stabilizers and improve upper back posture."
        ),
        ExerciseRecommendation(
            name: "Hip Flexor Stretch (Half-Kneeling)",
            description: "Tight hip flexors pull the pelvis into anterior tilt and increase trunk forward lean. This stretch addresses the root cause.",
            instructions: [
                "Kneel on your right knee with left foot flat on the floor in front.",
                "Keep your torso tall — do not lean forward.",
                "Gently shift your weight forward until you feel a stretch in the front of your right hip.",
                "Squeeze your right glute to deepen the stretch.",
                "Hold for 30 seconds. Switch sides."
            ],
            icon: "figure.cooldown",
            duration: "30 sec each side × 3",
            frequency: "2× daily",
            difficulty: .beginner,
            targetArea: "Iliopsoas, rectus femoris",
            evidenceBasis: "Sahrmann, 2002 — hip flexor flexibility directly impacts pelvic tilt and lumbar/thoracic posture."
        )
    ]

    // MARK: - Low Walking Speed / Sarcopenia Risk

    static let lowWalkingSpeed: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Sit-to-Stand Practice",
            description: "Functional strengthening that directly relates to walking ability and lower body power — the single best predictor of gait speed.",
            instructions: [
                "Sit on a sturdy chair with feet shoulder-width apart.",
                "Lean slightly forward and stand up without using your hands.",
                "Stand fully upright, then slowly lower back to sitting.",
                "Control the descent — don't drop into the chair.",
                "Repeat for the full set."
            ],
            icon: "chair.fill",
            duration: "10 reps × 3 sets",
            frequency: "Daily",
            difficulty: .beginner,
            targetArea: "Quadriceps, glutes, core",
            evidenceBasis: "Bohannon, 2006 — sit-to-stand performance strongly correlates with walking speed and functional independence."
        ),
        ExerciseRecommendation(
            name: "Heel Raises (Calf Strengthening)",
            description: "Strong calf muscles are essential for push-off during gait. Weakness here directly reduces walking speed.",
            instructions: [
                "Stand near a wall or counter for balance support.",
                "Rise up onto your toes as high as possible.",
                "Hold the top position for 2 seconds.",
                "Lower slowly to the floor (3 seconds down).",
                "Repeat."
            ],
            icon: "figure.stand",
            duration: "15 reps × 3 sets",
            frequency: "Daily",
            difficulty: .beginner,
            targetArea: "Gastrocnemius, soleus",
            evidenceBasis: "Ferrucci et al., 2000 — ankle plantar flexor strength is a key determinant of gait speed in older adults."
        ),
        ExerciseRecommendation(
            name: "Walking Intervals",
            description: "Alternating faster and normal-pace walking improves cardiovascular fitness and habitual walking speed.",
            instructions: [
                "Warm up with 3 minutes of easy walking.",
                "Walk at a brisk pace (as fast as comfortable) for 1 minute.",
                "Return to your normal pace for 2 minutes.",
                "Repeat the fast/normal cycle 5–8 times.",
                "Cool down with 3 minutes of slow walking."
            ],
            icon: "figure.walk",
            duration: "20–30 minutes total",
            frequency: "3–5× per week",
            difficulty: .intermediate,
            targetArea: "Cardiovascular, lower extremities",
            evidenceBasis: "Nemoto et al., 2007 — interval walking training improves peak aerobic capacity and walking speed in older adults."
        )
    ]

    // MARK: - Gait Asymmetry / Stride Imbalance

    static let gaitAsymmetry: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Single-Leg Stance",
            description: "Trains weight-bearing symmetry and single-leg stability, addressing the unilateral weakness that drives gait asymmetry.",
            instructions: [
                "Stand near a wall for safety.",
                "Lift one foot off the ground, bending the knee slightly.",
                "Hold your balance on the standing leg.",
                "Focus on equal time on each side — start with your weaker side first.",
                "Progress by closing your eyes or standing on a soft surface."
            ],
            icon: "figure.stand",
            duration: "30 sec each leg × 3",
            frequency: "Daily",
            difficulty: .beginner,
            targetArea: "Hip abductors, ankle stabilizers",
            evidenceBasis: "Muehlbauer et al., 2015 — single-leg balance training improves gait symmetry and reduces fall risk."
        ),
        ExerciseRecommendation(
            name: "Lateral Band Walks",
            description: "Strengthens hip abductors (gluteus medius) which are critical for level pelvis during single-leg phases of walking.",
            instructions: [
                "Place a resistance band around your ankles.",
                "Stand in a quarter-squat position, feet hip-width apart.",
                "Take 10 steps to the right, keeping tension on the band.",
                "Take 10 steps back to the left.",
                "Maintain good posture throughout — don't lean."
            ],
            icon: "arrow.left.and.right",
            duration: "10 steps each direction × 3 sets",
            frequency: "3–4× per week",
            difficulty: .intermediate,
            targetArea: "Gluteus medius, hip stabilizers",
            evidenceBasis: "Distefano et al., 2009 — lateral band walks produce high gluteus medius activation, supporting gait symmetry."
        ),
        ExerciseRecommendation(
            name: "Step-Overs (Marching)",
            description: "Controlled high-stepping improves hip flexion symmetry and trains alternating leg coordination.",
            instructions: [
                "Stand tall near a support surface.",
                "Slowly raise your right knee to hip height.",
                "Lower it slowly and with control.",
                "Repeat on the left side.",
                "Focus on matching the height and cadence on both sides."
            ],
            icon: "figure.walk.motion",
            duration: "20 reps alternating × 2 sets",
            frequency: "Daily",
            difficulty: .beginner,
            targetArea: "Hip flexors, core stabilizers",
            evidenceBasis: "Lord et al., 2003 — marching exercises improve gait coordination and step symmetry in older adults."
        )
    ]

    // MARK: - Fall Risk / Balance Deficits

    static let fallRisk: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Tandem Walking (Heel-to-Toe)",
            description: "Challenges dynamic balance along a narrow base of support, directly training the balance components used during gait.",
            instructions: [
                "Stand near a wall or counter for safety.",
                "Place the heel of one foot directly in front of the toes of the other.",
                "Walk forward in this heel-to-toe pattern for 10 steps.",
                "Turn around and walk back.",
                "Keep your gaze forward, not at your feet."
            ],
            icon: "figure.walk",
            duration: "10 steps × 4 laps",
            frequency: "Daily",
            difficulty: .beginner,
            targetArea: "Dynamic balance, proprioception",
            evidenceBasis: "Sherrington et al., 2019 (Cochrane review) — balance-challenging exercises reduce falls by ~23% in older adults."
        ),
        ExerciseRecommendation(
            name: "Seated Balance on Unstable Surface",
            description: "Sitting on a wobble cushion activates core stabilizers and improves trunk control which supports standing balance.",
            instructions: [
                "Place a balance disc or folded towel on a firm chair.",
                "Sit on the unstable surface with feet flat on the floor.",
                "Maintain upright posture while gently shifting weight.",
                "Try lifting one foot slightly off the ground for added challenge.",
                "Practice for the full duration while breathing normally."
            ],
            icon: "circle.dotted",
            duration: "3–5 minutes",
            frequency: "2× daily",
            difficulty: .beginner,
            targetArea: "Core stabilizers, trunk control",
            evidenceBasis: "Granacher et al., 2013 — unstable-surface training improves trunk muscle activity and balance in older adults."
        ),
        ExerciseRecommendation(
            name: "Clock Reaches",
            description: "Standing on one leg while reaching in different directions trains multi-directional balance and ankle strategy.",
            instructions: [
                "Stand on your right leg near a support surface.",
                "Imagine you're at the center of a clock face.",
                "Reach your left foot to 12 o'clock (forward), tap the ground, return.",
                "Reach to 3 o'clock (side), then 6 o'clock (behind).",
                "Complete all positions, then switch to the other leg."
            ],
            icon: "clock.fill",
            duration: "3 positions × 5 reps each leg",
            frequency: "3–4× per week",
            difficulty: .intermediate,
            targetArea: "Ankle/hip strategy, proprioception",
            evidenceBasis: "Gribble et al., 2012 — star excursion / clock reach exercises improve dynamic balance across multiple movement planes."
        )
    ]

    // MARK: - Kyphosis / Rounded Upper Back

    static let thoracicKyphosis: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Thoracic Extension over Foam Roller",
            description: "Uses a foam roller to mobilize the thoracic spine into extension, directly counteracting excessive kyphosis.",
            instructions: [
                "Place a foam roller horizontally across your mid-back.",
                "Lie back over the roller, supporting your head with your hands.",
                "Gently extend your upper back over the roller.",
                "Hold 3 seconds, then return to neutral.",
                "Roll slightly up or down and repeat at different segments."
            ],
            icon: "arrow.up.backward.circle",
            duration: "10 reps at 3–4 positions",
            frequency: "Once daily",
            difficulty: .beginner,
            targetArea: "Thoracic spine mobility",
            evidenceBasis: "Griegel-Morris et al., 1992 — thoracic mobility exercises reduce kyphotic posture and associated pain."
        ),
        ExerciseRecommendation(
            name: "Pectoral Doorway Stretch",
            description: "Stretches tight pectoral muscles that pull shoulders forward and contribute to rounded upper back posture.",
            instructions: [
                "Stand in a doorway with arms at 90° (goalpost position).",
                "Place forearms on the door frame.",
                "Step one foot through the doorway.",
                "Lean forward gently until you feel a stretch across your chest.",
                "Hold for 30 seconds. Breathe deeply."
            ],
            icon: "door.left.hand.open",
            duration: "30 sec × 3 reps",
            frequency: "2–3× daily",
            difficulty: .beginner,
            targetArea: "Pectoralis major and minor",
            evidenceBasis: "Lynch et al., 2010 — pectoral stretching combined with scapular strengthening reduces thoracic kyphosis."
        )
    ]

    // MARK: - Shoulder Asymmetry / Pelvic Obliquity

    static let shoulderPelvicAsymmetry: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Side-Lying Clam Shells",
            description: "Targets the gluteus medius to correct pelvic drop and asymmetrical loading during standing and walking.",
            instructions: [
                "Lie on your side with knees bent to 45°, feet together.",
                "Keep your feet touching and open your top knee like a clam shell.",
                "Hold the open position for 2 seconds.",
                "Lower slowly and repeat.",
                "Complete reps on both sides — extra set on the weaker side."
            ],
            icon: "figure.strengthtraining.traditional",
            duration: "15 reps × 3 sets each side",
            frequency: "3–4× per week",
            difficulty: .beginner,
            targetArea: "Gluteus medius, hip external rotators",
            evidenceBasis: "Distefano et al., 2009 — clam shell exercises effectively target gluteus medius for pelvic stability."
        ),
        ExerciseRecommendation(
            name: "Shoulder Blade Squeezes",
            description: "Activates rhomboids and middle trapezius to level the shoulders and improve scapular positioning.",
            instructions: [
                "Sit or stand with arms at your sides.",
                "Pull your shoulder blades together as if pinching a pencil between them.",
                "Hold for 5 seconds, keeping shoulders down (not shrugged).",
                "Release slowly and repeat.",
                "Focus on maintaining equal activation on both sides."
            ],
            icon: "arrow.right.and.line.vertical.and.arrow.left",
            duration: "10 reps × 3 sets",
            frequency: "Every 2 hours during desk work",
            difficulty: .beginner,
            targetArea: "Rhomboids, middle trapezius",
            evidenceBasis: "Hsu et al., 2019 — scapular stabilization exercises improve shoulder symmetry and reduce compensatory patterns."
        )
    ]

    // MARK: - Fatigue / Endurance Deficits

    static let fatigueEndurance: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Postural Endurance Training",
            description: "Practice maintaining correct posture for progressively longer periods to build postural muscle endurance.",
            instructions: [
                "Sit or stand in your best posture (chin tucked, shoulders back, core engaged).",
                "Set a timer for your target duration.",
                "Maintain this posture throughout, correcting when you notice slouching.",
                "Record how long you maintained good posture before fatigue.",
                "Increase duration by 1–2 minutes each week."
            ],
            icon: "timer",
            duration: "Start at 5 min, progress to 20 min",
            frequency: "3× daily",
            difficulty: .beginner,
            targetArea: "Postural endurance, body awareness",
            evidenceBasis: "O'Sullivan et al., 2006 — graded motor imagery and sustained posture practice improve postural endurance."
        ),
        ExerciseRecommendation(
            name: "Diaphragmatic Breathing",
            description: "Deep breathing supports core stability and reduces compensatory muscle guarding that accelerates postural fatigue.",
            instructions: [
                "Sit or lie down comfortably.",
                "Place one hand on your chest, one on your belly.",
                "Breathe in slowly through your nose — your belly hand should rise, chest hand stay still.",
                "Exhale slowly through pursed lips for 4–6 seconds.",
                "Repeat 10 cycles, then resume normal breathing."
            ],
            icon: "wind",
            duration: "10 breaths × 3 cycles",
            frequency: "3× daily or when fatigued",
            difficulty: .beginner,
            targetArea: "Diaphragm, transverse abdominis",
            evidenceBasis: "Hodges & Richardson, 1996 — diaphragmatic breathing pre-activates the transverse abdominis, supporting spinal stability."
        )
    ]

    // MARK: - General Posture Decline

    static let generalPostureDecline: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Cat-Cow Spinal Mobilization",
            description: "Alternating spinal flexion and extension improves overall spinal mobility and body awareness.",
            instructions: [
                "Start on hands and knees (tabletop position).",
                "Cow: Drop your belly toward the floor, lift your head and tailbone.",
                "Cat: Round your back toward the ceiling, tucking chin and tailbone.",
                "Move slowly between positions with your breath.",
                "Inhale for Cow, exhale for Cat."
            ],
            icon: "cat.fill",
            duration: "10 cycles × 2 sets",
            frequency: "Once daily",
            difficulty: .beginner,
            targetArea: "Full spine mobility",
            evidenceBasis: "Grinberg et al., 2014 — controlled spinal mobility exercises improve postural awareness and reduce stiffness."
        ),
        ExerciseRecommendation(
            name: "Bird-Dog",
            description: "Trains core stability and spinal alignment in a quadruped position, building the endurance muscles needed for upright posture.",
            instructions: [
                "Start on hands and knees, spine in neutral.",
                "Extend your right arm forward and left leg backward simultaneously.",
                "Hold for 5 seconds, keeping hips and shoulders level.",
                "Return to start. Switch to left arm and right leg.",
                "Repeat alternating sides."
            ],
            icon: "figure.strengthtraining.functional",
            duration: "10 reps each side × 2 sets",
            frequency: "Daily",
            difficulty: .beginner,
            targetArea: "Multifidus, erector spinae, glutes",
            evidenceBasis: "McGill, 2007 — bird-dog is a core stability exercise that builds spinal endurance with minimal compressive load."
        )
    ]

    // MARK: - REBA / Ergonomic Risk

    static let ergonomicRisk: [ExerciseRecommendation] = [
        ExerciseRecommendation(
            name: "Microbreak Routine",
            description: "Scheduled movement breaks that interrupt sustained static postures, the primary driver of ergonomic risk.",
            instructions: [
                "Set a timer for every 30 minutes of desk/standing work.",
                "Stand up and perform 5 shoulder rolls (forward and backward).",
                "Do 3 gentle neck rotations each direction.",
                "Perform 5 standing back extensions (hands on lower back, lean back gently).",
                "Walk 20–30 steps before returning to your task."
            ],
            icon: "clock.badge.checkmark",
            duration: "2 minutes per break",
            frequency: "Every 30 minutes during work",
            difficulty: .beginner,
            targetArea: "Full body — anti-fatigue",
            evidenceBasis: "Henning et al., 1997 — frequent microbreaks reduce musculoskeletal discomfort and improve work posture."
        ),
        ExerciseRecommendation(
            name: "Workstation Posture Reset",
            description: "A full-body alignment check to ensure your workstation setup supports neutral posture.",
            instructions: [
                "Sit back fully in your chair with feet flat on the floor.",
                "Adjust monitor height so the top of the screen is at eye level.",
                "Position keyboard so elbows are at 90° with shoulders relaxed.",
                "Perform a chin tuck and pull shoulders back.",
                "Verify your weight is evenly distributed on both sit bones."
            ],
            icon: "desktopcomputer",
            duration: "1 minute",
            frequency: "At the start of each work session",
            difficulty: .beginner,
            targetArea: "Ergonomic setup",
            evidenceBasis: "OSHA guidelines & Hignett & McAtamney, 2000 — workstation alignment directly impacts REBA scores."
        )
    ]

    // MARK: - Lookup by Condition

    /// Returns relevant exercises for a given clinical condition key.
    static func exercises(for condition: String) -> [ExerciseRecommendation] {
        switch condition {
        case "forwardHeadPosture", "lowCVA":
            return forwardHeadPosture
        case "sagittalImbalance", "highSVA", "trunkForwardLean":
            return sagittalImbalance
        case "lowWalkingSpeed", "sarcopenia":
            return lowWalkingSpeed
        case "gaitAsymmetry", "strideAsymmetry":
            return gaitAsymmetry
        case "fallRisk", "balanceDeficit":
            return fallRisk
        case "thoracicKyphosis", "roundedBack":
            return thoracicKyphosis
        case "shoulderAsymmetry", "pelvicObliquity":
            return shoulderPelvicAsymmetry
        case "fatigue", "earlyFatigue":
            return fatigueEndurance
        case "postureDecline":
            return generalPostureDecline
        case "ergonomicRisk", "highREBA":
            return ergonomicRisk
        default:
            return []
        }
    }
}
