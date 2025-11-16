// Validate catalog entries (STAC-like) against JSON Schemas
import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import Ajv from 'ajv'

const ajv = new Ajv({ allErrors: true, strict: false })
const ROOT = process.cwd()
const SCHEMAS_DIR = path.join(ROOT, 'schemas')
const CATALOG_DIR = path.join(ROOT, 'catalog')

async function loadSchema(file) {
	const raw = await fs.readFile(path.join(SCHEMAS_DIR, file), 'utf8')
	return JSON.parse(raw)
}

async function listJson(dir) {
	try {
		const entries = await fs.readdir(dir, { withFileTypes: true })
		return entries.filter(e => e.isFile() && e.name.endsWith('.json')).map(e => path.join(dir, e.name))
	} catch {
		return []
	}
}

async function main() {
	const itemSchema = await loadSchema('stac-item.json')
	const collectionSchema = await loadSchema('stac-collection.json')
	const validateItem = ajv.compile(itemSchema)
	const validateCollection = ajv.compile(collectionSchema)

	const itemFiles = await listJson(path.join(CATALOG_DIR, 'items'))
	const collectionFiles = await listJson(path.join(CATALOG_DIR, 'collections'))

	let errors = 0
	for (const file of itemFiles) {
		const json = JSON.parse(await fs.readFile(file, 'utf8'))
		const ok = validateItem(json)
		if (!ok) {
			errors++
			console.error(`[ITEM] ${path.relative(ROOT, file)} invalid:`)
			for (const err of validateItem.errors || []) {
				console.error(`  ${err.instancePath || '/'} ${err.message}`)
			}
		}
	}
	for (const file of collectionFiles) {
		const json = JSON.parse(await fs.readFile(file, 'utf8'))
		const ok = validateCollection(json)
		if (!ok) {
			errors++
			console.error(`[COLLECTION] ${path.relative(ROOT, file)} invalid:`)
			for (const err of validateCollection.errors || []) {
				console.error(`  ${err.instancePath || '/'} ${err.message}`)
			}
		}
	}

	if (errors > 0) {
		console.error(`Catalog validation failed with ${errors} file(s) invalid.`)
		process.exit(1)
	}
	console.log(`Catalog validation passed. Items=${itemFiles.length}, Collections=${collectionFiles.length}`)
}

main().catch(err => {
	console.error(err)
	process.exit(1)
})
