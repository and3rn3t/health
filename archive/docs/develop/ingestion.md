### Ingestion scaffold (COG/LAZ) with STAC validation

Commands:

- Validate STAC Item JSON:
  - `npm run ingest:validate:item -- --input path/to/item.json`
- Validate STAC Collection JSON:
  - `npm run ingest:validate:collection -- --input path/to/collection.json`
- Ingest a data file (generates minimal STAC Item and writes to `catalog/items/`):
  - `npm run ingest:file -- --input path/to/file.tif`
  - `npm run ingest:file -- --input path/to/file.laz`

Notes:

- This is a scaffold: bbox/geometry are placeholders; checksum and content-type are filled.
- Extend `scripts/ingestion/ingest.js` to extract real geospatial metadata (GDAL/PDAL).
- Schemas: `schemas/stac-item.json`, `schemas/stac-collection.json`.

Catalog API and minimal browser:

- Start API: `npm run catalog:api` (default port 5055)
- Open browser: `http://127.0.0.1:5055/catalog.html`
- Endpoints:
  - `GET /catalog/items` → `{"items":["<id>", ...]}`
  - `GET /catalog/items/:id` → STAC Item JSON
  - `GET /catalog/collections` → `{"collections":["<id>", ...]}`
  - `GET /catalog/collections/:id` → STAC Collection JSON

Metadata extraction (optional):

- If you have GDAL installed, add `--extract` to populate bbox/CRS for rasters via `gdalinfo -json`.
  - Example: `npm run ingest:file -- --input path/to/file.tif --extract`
- If you have PDAL installed, add `--extract` to populate bbox/CRS for point clouds via `pdal info --summary --metadata`.
  - Example: `npm run ingest:file -- --input path/to/file.laz --extract`
- If tools are not available, ingestion still works with default bbox and null EPSG.
