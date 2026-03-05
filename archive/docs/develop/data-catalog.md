### Data catalog contracts (STAC-like)

- JSON Schemas:
  - `schemas/stac-item.json`
  - `schemas/stac-collection.json`
- TypeScript types:
  - `src/types/stac.ts`

Usage notes:

- Use the Item schema for individual datasets (imagery tiles, LiDAR tiles, vector exports).
- Use the Collection schema to group related Items (sensor, campaign, study).
- Include CRS as `proj:epsg` when known; prefer COG for raster and LAZ for point clouds.

Next steps:

- Add validation step in ingestion to verify new Items/Collections against these schemas.
- Extend with domain fields (e.g., health-risk indices, model versions) as needed.
