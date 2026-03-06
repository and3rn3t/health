### Product roadmap (analysis, LiDAR, and advanced AI)

- **Vision**
  - Deliver a robust geospatial health platform with multi-modal analysis (imagery, LiDAR, vector), explainable AI insights, and scalable data pipelines.

- **Guiding principles**
  - **Data-first**: enforce metadata, lineage, and reproducibility.
  - **Modular**: decouple ingestion, processing, and analysis services.
  - **Explainable AI**: prioritize transparency, uncertainty, and audit trails.
  - **Operational excellence**: automated tests, CI/CD, observability, and cost controls.

---

### Phase 0 — Discovery and foundations (1–2 weeks)
- **Inventory current state**
  - Catalog data types (imagery, LiDAR, vector layers), schemas, volumes, and access patterns.
  - Map existing analysis features and gaps; identify model artifacts and versions.
- **Platform scaffolding**
  - Define domains and service boundaries (ingestion, tiling, analysis, model-serving).
  - Select core libs: raster/vector processing, point cloud, ML runtime, queue/store.
- **Security & compliance baseline**
  - RBAC, data residency, PII handling, audit logs.

Deliverables:
- System diagram, ADRs for key choices, backlog of epics, security checklist.

---

### Phase 1 — Data ingestion and management (3–4 weeks)
- **Imagery ingestion**
  - Support GeoTIFF/COG; validate CRS, pyramids, and overviews; store as COGs.
  - Metadata and provenance capture; checksum and deduping.
- **LiDAR ingestion**
  - LAS/LAZ intake; normalize to common CRS; extract quicklook stats (density, bounds).
- **Vector ingestion**
  - GeoJSON/Parquet/ShapeFile pipelines; schema validation; spatial indexing.
- **Catalog & APIs**
  - Search by bbox/time/sensor; STAC-like descriptors; signed URL access.

Deliverables:
- Ingestion pipelines with retries, metadata catalog with APIs, minimal UI to browse datasets.

KPIs:
- Time-to-available, ingestion success rate, catalog query p95 latency.

---

### Phase 2 — Core analysis (imagery, vector) (3–5 weeks)
- **Raster analytics**
  - NDVI/NDWI/NDMI and custom band math; resampling/warp; zonal stats over AOIs.
  - Cloud/shadow masking pipelines where applicable.
- **Vector analytics**
  - Spatial joins, buffering, network-based proximity, aggregations.
- **Tiling & visualization**
  - Dynamic tile endpoints (XYZ/WMTS) for raster and vector; style presets.

Deliverables:
- Analysis APIs and jobs, basic map viewer with layer controls and AOI tools.

KPIs:
- Job success rate and throughput, tile render p95, accuracy vs baselines.

---

### Phase 3 — LiDAR functions (4–6 weeks)
- **Preprocessing**
  - Ground/non-ground classification; noise filtering; tiling and indexing (e.g., Entwine/PDAL).
- **Derived products**
  - Digital Terrain Model (DTM) and Digital Surface Model (DSM) generation.
  - Canopy height model, elevation profiles, slope/aspect.
- **Feature extraction**
  - Building/structure detection, tree crown segmentation (rule-based + ML-ready outputs).
- **Visualization**
  - 3D tiles (3D Tiles/Potree) for web; profile and cross-section tools.

Deliverables:
- LiDAR processing service, DTM/DSM endpoints, 3D viewer integration.

KPIs:
- Processing time per km², classification precision/recall, 3D render FPS on target devices.

---

### Phase 4 — Advanced AI (5–8 weeks)
- **Model serving**
  - Containerized inference for segmentation/classification; GPU scheduling; versioning.
  - Batch and streaming inference; warm caches for popular AOIs.
- **Use cases**
  - Change detection (multi-temporal): infrastructure growth, vegetation loss.
  - Object detection/segmentation: buildings, roads, water bodies, health-risk proxies.
  - Risk scoring: combine environmental features (e.g., stagnant water, elevation, land use) into composite indices.
- **Explainability & uncertainty**
  - Pixel/instance-level confidence; SHAP-like drivers; counterfactuals for policy.
- **Human-in-the-loop**
  - Review queues, correction tools, and active learning loops.

Deliverables:
- Model registry, inference APIs, explainability overlays, review UI.

KPIs:
- mAP/IoU by class, calibration (ECE), reviewer agreement rates, retraining gains.

---

### Phase 5 — Productization and workflows (3–4 weeks)
- **Projects & reports**
  - AOI-based workflows, scheduled analyses, export to PDF/CSV/GeoPackage.
- **Notifications & audit**
  - Webhooks/email for job completion/anomalies; full audit trail across data→model→result.
- **Access controls**
  - Org/tenant RBAC on datasets, analyses, and outputs.

Deliverables:
- End-to-end project flow, exports, and alerts with permissions.

KPIs:
- User task completion time, export success rate, MTTR for failed jobs.

---

### Phase 6 — Scale, reliability, and cost (ongoing)
- **Observability**
  - Tracing (ingestion→analysis→serve), metrics, SLOs; cost per job/dataset.
- **Performance**
  - Caching (COG ranges, vector tiles, model outputs), autoscaling workers.
- **Cost controls**
  - Tiered storage, spot workloads for batch, heatmap-based cache eviction.

Deliverables:
- Dashboards, autoscaling policies, cost reports and alerts.

KPIs:
- SLO adherence, $/km² processed, cache hit ratio.

---

### Cross-cutting concerns
- **Testing**
  - Golden datasets; geospatial accuracy tests; model drift detection; seed AOIs.
- **Data governance**
  - STAC compliance where possible; lineage graphs; retention policies.
- **Privacy & ethics**
  - PII safeguards, bias assessment for AI outputs, red-teaming.

---

### Milestones and dependencies
- M1: Ingestion + Catalog live (Phases 0–1)
- M2: Raster/vector analysis and tiling (Phase 2)
- M3: LiDAR pipelines and 3D viewer (Phase 3)
- M4: AI inference with explainability + HITL (Phase 4)
- M5: Projects, exports, RBAC (Phase 5)
- M6: SLOs, autoscale, cost governance (Phase 6)

Dependencies:
- Phase 2 depends on catalog and tiling from Phase 1.
- Phase 3 depends on stable storage/indexing and visualization from Phases 1–2.
- Phase 4 depends on Phase 2 feature engineering and Phase 3 optional elevation/canopy signals.
- Phase 5 depends on stable APIs from Phases 2–4.

---

### Risks and mitigations
- **Data variability**: heterogeneous CRS/quality → strict validators, auto-reprojection, QA dashboards.
- **Compute costs**: heavy LiDAR/AI workloads → spot instances, batch windows, caching, tiling.
- **Model drift**: changing environments → scheduled evaluation, feedback loops, retraining gates.
- **UX complexity**: many layers/analyses → opinionated presets, templates, and guided flows.

---

### Immediate next steps (1–2 weeks)
- Finalize STAC-like schema and metadata contracts.
- Implement COG- and LAZ-first ingestion with validation and lineage.
- Stand up catalog API and minimal dataset browser.
- Prepare golden datasets and acceptance tests for NDVI, zonal stats, and DTM.
