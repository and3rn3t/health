// Ingestion scaffold: validate STAC metadata and write catalog entries
import fs from 'node:fs/promises'
import path from 'node:path'
import crypto from 'node:crypto'
import process from 'node:process'
import Ajv from 'ajv'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const ajv = new Ajv({ allErrors: true, strict: false })

async function loadSchema(schemaName) {
	const root = path.resolve(process.cwd(), 'schemas')
	const filename =
		schemaName === 'collection' ? 'stac-collection.json' : 'stac-item.json'
	const schemaPath = path.join(root, filename)
	const raw = await fs.readFile(schemaPath, 'utf8')
	return JSON.parse(raw)
}

function parseArgs(argv) {
	const args = { validate: false, schema: 'item', input: null, outDir: null, extract: false }
	for (let i = 2; i < argv.length; i++) {
		const a = argv[i]
		if (a === '--validate') args.validate = true
		else if (a === '--schema') args.schema = argv[++i] || 'item'
		else if (a === '--input') args.input = argv[++i] || null
		else if (a === '--out') args.outDir = argv[++i] || null
		else if (a === '--extract') args.extract = true
	}
	return args
}

async function fileChecksum(filePath) {
	const hash = crypto.createHash('sha256')
	const fh = await fs.open(filePath, 'r')
	try {
		const stream = fh.createReadStream()
		for await (const chunk of stream) {
			hash.update(chunk)
		}
		return hash.digest('hex')
	} finally {
		await fh.close()
	}
}

function inferAssetType(filePath) {
	const ext = path.extname(filePath).toLowerCase()
	if (ext === '.tif' || ext === '.tiff' || ext === '.cog') {
		return 'image/tiff; application=geotiff; profile=cloud-optimized'
	}
	if (ext === '.laz') return 'application/octet-stream; type=LAZ'
	if (ext === '.las') return 'application/octet-stream; type=LAS'
	return 'application/octet-stream'
}

async function ensureDir(dir) {
	await fs.mkdir(dir, { recursive: true })
}

async function writeJson(outPath, data) {
	await ensureDir(path.dirname(outPath))
	await fs.writeFile(outPath, JSON.stringify(data, null, 2), 'utf8')
}

async function validate(schemaName, data) {
	const schema = await loadSchema(schemaName)
	const validate = ajv.compile(schema)
	const ok = validate(data)
	if (!ok) {
		const details = (validate.errors || [])
			.map(e => `${e.instancePath || '/'} ${e.message}`)
			.join('\n')
		throw new Error(`Schema validation failed:\n${details}`)
	}
}

async function buildMinimalItemFromFile(filePath) {
	const id = path.basename(filePath)
	const href = path.resolve(filePath)
	const type = inferAssetType(filePath)
	const checksum = await fileChecksum(filePath)
	const now = new Date().toISOString()
	// Defaults before extraction
	let bbox = [-180, -90, 180, 90]
	let geometry = { type: 'Polygon', coordinates: [] }
	let epsg = null
	return {
		type: 'Feature',
		stac_version: '1.0.0',
		id,
		bbox,
		geometry,
		properties: { datetime: now, 'proj:epsg': epsg },
		assets: {
			data: { href, type, roles: ['data'], title: id, checksum: `sha256:${checksum}` },
		},
	}
}

function bboxToPolygon(b) {
	// b: [minX, minY, maxX, maxY] in lon/lat
	const [minX, minY, maxX, maxY] = b
	return {
		type: 'Polygon',
		coordinates: [
			[
				[minX, minY],
				[maxX, minY],
				[maxX, maxY],
				[minX, maxY],
				[minX, minY],
			],
		],
	}
}

async function tryExtractWithGdal(filePath) {
	try {
		const { stdout } = await execFileAsync('gdalinfo', ['-json', filePath], { timeout: 20000, windowsHide: true })
		const info = JSON.parse(stdout)
		// Prefer wgs84Extent if present
		let bbox = null
		if (info.wgs84Extent && info.wgs84Extent.coordinates && Array.isArray(info.wgs84Extent.coordinates)) {
			// coordinates: [ [ [lon,lat], ... ] ]
			const coords = info.wgs84Extent.coordinates[0]
			const lons = coords.map(c => c[0])
			const lats = coords.map(c => c[1])
			bbox = [Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)]
		} else if (info.cornerCoordinates && info.cornerCoordinates.center) {
			const cc = info.cornerCoordinates
			// Approx bbox from ul, lr if present
			if (cc.upperLeft && cc.lowerRight) {
				const ul = cc.upperLeft
				const lr = cc.lowerRight
				bbox = [ul[0], lr[1], lr[0], ul[1]]
			}
		}
		let epsg = null
		if (info.coordinateSystem && info.coordinateSystem.wkt) {
			// GDAL 3+: look for EPSG code in WKT authority
			const m = info.coordinateSystem.wkt.match(/EPSG\"?,\\s*\"?(\\d{3,6})/i)
			if (m) epsg = Number(m[1])
		} else if (info.srs && info.srs.dataAxisToSRSAxisMapping) {
			// legacy fields sometimes include epsg
			if (info.srs.srs_code) epsg = Number(info.srs.srs_code.replace('EPSG:', ''))
		}
		return { bbox, epsg }
	} catch {
		return { bbox: null, epsg: null }
	}
}

async function tryExtractWithPdal(filePath) {
	try {
		const { stdout } = await execFileAsync('pdal', ['info', '--summary', '--metadata', filePath], { timeout: 20000, windowsHide: true })
		const info = JSON.parse(stdout)
		let bbox = null
		// PDAL summary bbox may be in summary.bounds or metadata
		const bounds = info.summary?.bounds || info.metadata?.minmax || info.metadata?.bounds
		if (bounds && bounds.minx != null && bounds.miny != null && bounds.maxx != null && bounds.maxy != null) {
			bbox = [bounds.minx, bounds.miny, bounds.maxx, bounds.maxy]
		}
		// EPSG may be under srs
		let epsg = null
		if (info.srs && info.srs.horizontal && info.srs.horizontal.epsg) {
			epsg = Number(info.srs.horizontal.epsg)
		} else if (info.metadata && info.metadata.srs && info.metadata.srs.horizontal && info.metadata.srs.horizontal.epsg) {
			epsg = Number(info.metadata.srs.horizontal.epsg)
		}
		return { bbox, epsg }
	} catch {
		return { bbox: null, epsg: null }
	}
}

async function enrichItemWithExtraction(item) {
	const href = item.assets?.data?.href
	if (!href) return item
	const ext = path.extname(href).toLowerCase()
	let extracted = { bbox: null, epsg: null }
	if (ext === '.tif' || ext === '.tiff' || ext === '.cog') {
		extracted = await tryExtractWithGdal(href)
	} else if (ext === '.laz' || ext === '.las') {
		extracted = await tryExtractWithPdal(href)
	}
	const next = { ...item }
	if (extracted.bbox && Array.isArray(extracted.bbox) && extracted.bbox.length === 4) {
		next.bbox = extracted.bbox
		next.geometry = bboxToPolygon(extracted.bbox)
	}
	if (typeof extracted.epsg === 'number' || extracted.epsg === null) {
		next.properties = { ...next.properties, 'proj:epsg': extracted.epsg }
	}
	return next
}
		type: 'Feature',
		stac_version: '1.0.0',
		id,
		bbox: [-180, -90, 180, 90],
		geometry: { type: 'Polygon', coordinates: [] },
		properties: { datetime: now },
		assets: {
			data: { href, type, roles: ['data'], title: id, checksum: `sha256:${checksum}` },
		},
	}
	return item
}

async function main() {
	const args = parseArgs(process.argv)
	if (!args.input) {
		console.error('Usage: node scripts/ingestion/ingest.js --input <path> [--validate] [--schema item|collection] [--out <dir>]')
		process.exit(1)
	}
	const inputPath = path.resolve(args.input)
	const stat = await fs.stat(inputPath)

	let outDir = args.outDir || path.resolve('catalog')
	if (args.validate) {
		const raw = await fs.readFile(inputPath, 'utf8')
		const json = JSON.parse(raw)
		await validate(args.schema, json)
		console.log(`OK: ${path.basename(inputPath)} matches ${args.schema} schema`)
		// Optionally write to catalog
		const sub = args.schema === 'collection' ? 'collections' : 'items'
		const id = json.id || path.basename(inputPath, path.extname(inputPath))
		await writeJson(path.join(outDir, sub, `${id}.json`), json)
		console.log(`Wrote catalog/${sub}/${id}.json`)
		return
	}

	// Ingest a data file into a minimal Item
	if (stat.isFile()) {
		let item = await buildMinimalItemFromFile(inputPath)
		if (args.extract) {
			item = await enrichItemWithExtraction(item)
		}
		await validate('item', item)
		await writeJson(path.join(outDir, 'items', `${item.id}.json`), item)
		console.log(`Ingested ${inputPath} -> catalog/items/${item.id}.json`)
	} else {
		console.error('Input must be a file for ingestion scaffold.')
		process.exit(1)
	}
}

main().catch(err => {
	console.error(err.message || err)
	process.exit(1)
})
