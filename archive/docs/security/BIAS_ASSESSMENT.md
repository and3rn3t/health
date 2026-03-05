# Bias Assessment Report — VitalSense Health Algorithms

**Version**: 1.0  
**Date**: 2026-02-22  
**Owner**: ML / Product Team  
**Review cadence**: Quarterly, or on any model update or material change to user demographics

---

## Executive Summary

VitalSense uses rule-based heuristics, a hand-tuned logistic-regression fall risk model (`v0.1-baseline`), gait analytics, and an EWMA anomaly detector. This report inventories known and potential sources of algorithmic bias, rates their severity, and specifies mitigations. The goal is to ensure that outputs are equitable across demographic groups and do not cause disproportionate harm.

Overall risk posture: **Medium** — the baseline model uses hand-tuned weights that have not been validated on a diverse population dataset. Immediate mitigations are listed in Section 5.

---

## 1. Scope

| Component | Location | Description |
|---|---|---|
| Fall risk model v0.1-baseline | `src/lib/ai/models/fallRiskModel.ts` | Logistic regression; hand-tuned weights |
| ML fall risk predictor | `src/lib/mlFallRiskPredictor.ts` | Inference wrapper |
| Enhanced fall risk optimizer | `src/lib/enhancedFallRiskOptimizer.ts` | Personalized intervention planner |
| Gait analytics | `src/lib/gaitMomentum.ts`, `src/lib/ai/features/` | Gait speed, cadence, asymmetry, stride |
| EWMA anomaly detector | `src/lib/ai/anomaly/` | Rolling z-score on steadiness, steps, HR |
| Holt-Winters forecaster | `src/lib/ai/forecast/` | 7/30-day health score projections |
| Health score heuristic | `src/lib/healthDataProcessor.ts` | Composite score |

Out of scope for this version: recommendation policy (contextual bandit, not yet deployed), federated training stubs.

---

## 2. Bias Taxonomy Used

| Bias type | Definition |
|---|---|
| **Historical bias** | Training data reflects past disparities (e.g., under-representation of older adults, women, or non-white populations in fall studies) |
| **Measurement bias** | Sensor accuracy differs by user attribute (e.g., optical HR and SpO₂ sensors perform worse on darker skin tones) |
| **Aggregation bias** | A single model trained on a mixed population fails subgroups |
| **Evaluation bias** | Benchmark dataset does not represent the deployment population |
| **Deployment bias** | Correct model, but used in a context it wasn't designed for |
| **Label bias** | Ground-truth labels themselves are biased (e.g., fall events under-reported for certain groups) |

---

## 3. Component-Level Bias Findings

### 3.1 Fall Risk Model (`v0.1-baseline`)

**Severity: HIGH**

| Finding | Details |
|---|---|
| **Hand-tuned, not data-trained** | Weights (`walkingSteadiness_avg: -0.045`, `sleepHours_avg: -0.12`, `heartRate_avg: 0.015`, etc.) were set manually. No demographic validation has been performed. |
| **No age adjustment** | Fall risk increases significantly with age (65+), and normative steadiness values differ by age. The current model uses a universal threshold, likely over-flagging active younger users and under-flagging sedentary older users. |
| **No sex/gender adjustment** | Women have higher lifetime fall risk and different normative steadiness scores than men; the model does not adjust. |
| **No BMI / body composition input** | Body weight is collected but not used as a model feature; overweight and underweight conditions independently predict fall risk. |
| **Missing population coverage** | The `trainedAt` date of `2025-09-17` with `v0.1-baseline` label indicates no formal training set was used. AUC, Brier score, and calibration error are unknown. |

**Recommended mitigations**:
- Replace hand-tuned weights with weights trained on a validated, demographically diverse fall dataset (e.g., NIH National Fall Prevention dataset or similar).
- Add age and biological sex as optional model inputs with explicit consent.
- Report calibration error and AUC stratified by age group (< 50, 50–64, 65–74, 75+) and sex before promoting beyond beta.
- Document reference population and exclusion criteria in model card.

### 3.2 Gait Analytics

**Severity: MEDIUM**

| Finding | Details |
|---|---|
| **Normative ranges not population-specific** | Thresholds for gait speed, cadence, and step asymmetry are drawn from published literature that skews toward ambulatory clinic populations (often white, Western). |
| **Assistive device users** | Users who walk with canes, walkers, or prosthetics will have gait signatures that fall outside the model's expected distribution, producing spurious anomaly alerts. |
| **Footwear and environment** | Barefoot vs. shod walking and surface type (carpet, tile, outdoor) systematically affect cadence and stride length. The model does not account for these confounders. |
| **Measurement bias: sensor placement** | Watch-based accelerometry accuracy varies by wrist circumference and skin tone (optical sensors). |

**Recommended mitigations**:
- Add a user-configurable "assistive device" flag that switches to a separate reference range.
- Document which published normative datasets were used and their demographic composition.
- Validate gait feature distributions against an inclusive test cohort before general release.

### 3.3 EWMA Anomaly Detector

**Severity: LOW–MEDIUM**

| Finding | Details |
|---|---|
| **Personal baseline required** | The EWMA detector computes rolling statistics relative to the user's own recent history, which is inherently personalized — this is good. |
| **Cold-start disparity** | New users with sparse data (< 7 days) get unreliable baselines. Alerts may fire more frequently for new users or users who take breaks. This affects older adults who onboard slowly. |
| **Seasonal variation not modeled** | Step count and sleep duration vary systematically with season; without seasonal adjustment, winter users may receive false fall-risk alerts. |

**Recommended mitigations**:
- Suppress or down-weight anomaly alerts during the first 7 days (cold-start window); show a "calibrating" indicator.
- Add seasonal baseline adjustment or a longer rolling window for step count.

### 3.4 Health Score Heuristic

**Severity: LOW**

| Finding | Details |
|---|---|
| **Universal thresholds** | Fixed thresholds for "good", "fair", "poor" ranges do not adjust for age, sex, or fitness level. A healthy 75-year-old with 6,000 steps/day may receive a lower score than an unhealthy 30-year-old with 10,000 steps/day. |

**Recommended mitigations**:
- Apply age-adjusted normative step count ranges (e.g., CDC / WHO recommendations by age group).
- Clearly communicate in-app that scores are relative to general population norms, not personal history, until personalized baselines are established.

### 3.5 AI Forecaster (Holt-Winters, 7/30-day)

**Severity: LOW**

| Finding | Details |
|---|---|
| **Trend extrapolation assumes stationarity** | Sudden health changes (illness, surgery, travel) will cause overconfident or misleading forecasts. |
| **No uncertainty communication for edge cases** | Confidence intervals may be underestimated for users with high intra-day variability (e.g., shift workers, users with chronic conditions). |

**Recommended mitigations**:
- Cap forecasts at 7 days until the model is validated on longer horizons.
- Display explicit uncertainty bands in the UI and note that forecasts are informational only.

---

## 4. Protected Attribute Risk Matrix

| Attribute | Components at risk | Current mitigation | Gap |
|---|---|---|---|
| Age (65+) | Fall risk, health score, gait norms | None | **High** — no age adjustment |
| Biological sex | Fall risk, gait norms | None | **Medium** — normative values differ |
| Race / skin tone | HR, SpO₂ sensor accuracy | None (hardware limitation) | **Medium** — disclose in UI |
| BMI / body composition | Fall risk, gait | Body weight collected but unused | **Medium** |
| Assistive device use | Gait analytics, anomaly detection | None | **Medium** |
| Disability status | All components | None | **Medium** |
| Language / literacy | UI comprehension of risk labels | English-only UI | **Low** (scope: localization) |

---

## 5. Priority Mitigations

| Priority | Action | Owner | Target |
|---|---|---|---|
| P0 | Write a model card for `v0.1-baseline` with training data description, known limitations, and demographic scope | ML Team | Before beta launch |
| P0 | Add in-app disclaimer that fall risk scores are informational and should not replace clinical assessment | Product | Before beta launch |
| P1 | Train and validate fall risk model on a demographically diverse labeled dataset; report AUC and calibration stratified by age and sex | ML Team | M2 milestone |
| P1 | Add age-adjusted normative thresholds for gait and health score | ML Team | M2 milestone |
| P1 | Add assistive-device flag with separate gait reference range | Product / ML | M2 milestone |
| P2 | Disclose optical sensor limitations for dark skin tones in app and documentation | Product | M2 milestone |
| P2 | Implement cold-start suppression window for anomaly detector | Engineering | M2 milestone |
| P3 | Implement seasonal adjustment for step count baseline | ML Team | M3 milestone |
| P3 | Periodic bias audit using collected (anonymized, consented) data stratified by age and sex | ML / Privacy | Quarterly |

---

## 6. Evaluation Framework

Once a labeled dataset is available, bias audits should report the following metrics stratified by age group and sex (at minimum):

- **Fall risk model**: AUC-ROC, Brier score, Expected Calibration Error (ECE), demographic parity, equal opportunity difference
- **Anomaly detector**: Precision, recall, false positive rate per group
- **Gait analytics**: Mean absolute error vs. clinical reference (e.g., instrumented walkway) per group
- **Health score**: Distribution comparison across age/sex groups vs. validated normative surveys (NHANES)

Threshold for acceptable disparity: false positive rate difference ≤ 5 percentage points across groups, equal opportunity difference ≤ 10 percentage points.

---

## 7. Ethics Principles Adopted

1. **Do no harm**: health risk scores are informational only; no automated clinical decisions are made without human oversight.
2. **Transparency**: model cards and limitations are disclosed in-app and in documentation.
3. **Equity**: periodic bias audits are required before any model promotion to general availability.
4. **Privacy by design**: no PII is used as a model feature without explicit user consent; see `PII_CHECKLIST.md`.
5. **Contestability**: users can dismiss or ignore any risk alert; no alert triggers an irreversible automated action.

---

*Last reviewed: 2026-02-22 — Review again by 2026-05-22 or on any model update or material demographic change.*
