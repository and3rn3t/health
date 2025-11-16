### Backlog (epics and sized tickets)

Legend:
- Size: S (≤1 day), M (2–4 days), L (1–2 weeks), XL (2–4 weeks)
- AC: Acceptance criteria

---

## Epic: Foundations and Governance (Phase 0)
- Ticket: Define domain boundaries and service map (M)
  - AC: Diagram checked in; owners and interfaces documented.
- Ticket: Author ADRs for storage, compute, and messaging (M)
  - AC: ADRs approved; decisions referenced by services.
- Ticket: Security baseline (RBAC, audit logging) design (M)
  - AC: AuthN/Z flows, roles, and audit events defined.

---

## Epic: Data Ingestion and Catalog (Phase 1)
- Ticket: Imagery ingestion pipeline for GeoTIFF/COG (L)
  - AC: Upload→COG conversion with validation; metadata stored; retries enabled.
- Ticket: LiDAR ingestion pipeline for LAS/LAZ (L)
  - AC: CRS normalization; density/bounds stats; lineage captured.
- Ticket: Vector ingestion for GeoJSON/Parquet/Shapefile (M)
  - AC: Schema validation; spatial index built; errors surfaced.
- Ticket: STAC-like catalog schema and API (L)
  - AC: Search by bbox/time/sensor; signed URLs; pagination p95 < 300ms.
- Ticket: Minimal dataset browser UI (M)
  - AC: List/search datasets; preview metadata; copy API links.

---

## Epic: Core Raster/Vector Analysis (Phase 2)
- Ticket: Band math endpoints (NDVI/NDWI/NDMI + custom) (M)
  - AC: API with unit tests; accuracy vs golden data within tolerance.
- Ticket: Zonal statistics over AOIs (M)
  - AC: Mean/median/min/max/std; CSV/GeoJSON outputs; tested.
- Ticket: Cloud/shadow masking pipeline (M)
  - AC: Toggleable masking; metrics on masked pixels; docs.
- Ticket: Vector spatial ops (joins, buffers, proximity) (L)
  - AC: Join over bbox; buffer with CRS-aware units; performance baseline.
- Ticket: Dynamic tiles (raster/vector) and styles (L)
  - AC: XYZ/WMTS; style presets; tile p95 < 250ms on cached data.

---

## Epic: LiDAR Processing and 3D (Phase 3)
- Ticket: Ground/non-ground classification (PDAL pipeline) (M)
  - AC: Classification accuracy baseline; reproducible config checked in.
- Ticket: DTM/DSM generation (L)
  - AC: Publish DTM/DSM assets; metadata complete; visual QA samples.
- Ticket: Canopy height model and terrain derivatives (M)
  - AC: CHM, slope, aspect endpoints; unit tests with fixtures.
- Ticket: Feature extraction (buildings, trees) v1 (L)
  - AC: Rule-based + ML-ready labels; precision/recall baseline.
- Ticket: 3D tiles + web viewer integration (L)
  - AC: 3D Tiles/Potree served; profile/cross-section tools working.

---

## Epic: Advanced AI and Explainability (Phase 4)
- Ticket: Model registry and versioned serving (L)
  - AC: Containerized inference; version pinning; rollout policy.
- Ticket: Batch and streaming inference jobs (L)
  - AC: Queue-backed; retries; metrics; idempotency.
- Ticket: Change detection (multi-temporal) v1 (L)
  - AC: Per-pixel change map; ROC baseline; docs.
- Ticket: Object detection/segmentation v1 (L)
  - AC: Buildings/roads/water; mAP/IoU reported; calibration plot.
- Ticket: Risk scoring index MVP (M)
  - AC: Weighted composite; tunable factors; exportable raster/vector.
- Ticket: Explainability overlays and confidence (M)
  - AC: Uncertainty maps; feature importance summary; API/UX hooks.
- Ticket: Human-in-the-loop review UI (L)
  - AC: Review queues; corrections; export corrections for retraining.

---

## Epic: Productization and Workflows (Phase 5)
- Ticket: Projects and AOI workflows (L)
  - AC: Create AOIs; run analyses; history and reruns saved.
- Ticket: Scheduled analyses and notifications (M)
  - AC: Cron-like setup; webhooks/email on completion/failure.
- Ticket: Export to PDF/CSV/GeoPackage (M)
  - AC: Deterministic exports; watermarks/version info; download logs.
- Ticket: Org/tenant RBAC policy enforcement (L)
  - AC: Permissions across datasets, analyses, outputs; audit trail.

---

## Epic: Scale, Reliability, and Cost (Phase 6)
- Ticket: Observability (traces, metrics, logs) (M)
  - AC: Ingestion→analysis→serve traces; key SLOs on dashboard.
- Ticket: Performance & caching strategy (L)
  - AC: COG range, vector tile, inference-output caches; hit ratio > 70%.
- Ticket: Autoscaling policies for workers (M)
  - AC: Queue-depth scaling; cost guardrails; load tests.
- Ticket: Cost reporting and alerts (M)
  - AC: $/km² by job type; budgets and anomaly alerts.

---

## Epic: Cross-cutting Quality
- Ticket: Golden datasets and accuracy tests (M)
  - AC: Versioned fixtures; CI gates; baseline diffs.
- Ticket: Model drift detection pipeline (M)
  - AC: Scheduled eval; alert on drift; retrain trigger doc.
- Ticket: Privacy, bias, and ethics review (M)
  - AC: PII checklist; bias assessment report; red-team notes.

---

### Suggested sequencing (milestones)
- M1: Ingestion + Catalog live (Phases 0–1)
- M2: Raster/vector analysis and tiling (Phase 2)
- M3: LiDAR pipelines and 3D viewer (Phase 3)
- M4: AI inference with explainability + HITL (Phase 4)
- M5: Projects, exports, RBAC (Phase 5)
- M6: SLOs, autoscale, cost governance (Phase 6)

---

### Notes
- Sizes assume one experienced engineer per ticket and available infra.
- Revisit sizes after initial spikes; tighten AC as golden data matures.
