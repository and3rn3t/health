#!/usr/bin/env node
/**
 * Test script for large array processing with chunked computation
 */

const API_URL = process.env.API_URL || 'http://127.0.0.1:5055'

async function testLargeArray(size, label) {
  console.log(`\n${label} (${size.toLocaleString()} elements)...`)

  // Generate realistic NIR/Red arrays
  const nir = new Array(size)
  const red = new Array(size)
  for (let i = 0; i < size; i++) {
    // Realistic Sentinel-2-like values
    nir[i] = 0.5 + Math.random() * 0.4 // 0.5-0.9
    red[i] = 0.2 + Math.random() * 0.15 // 0.2-0.35
  }

  const start = Date.now()
  try {
    const res = await fetch(`${API_URL}/analysis/ndvi`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nir, red, bins: 20, chunked: true })
    })
    const elapsed = Date.now() - start
    if (!res.ok) {
      const err = await res.text()
      console.error(`  ❌ Failed: ${res.status} ${err}`)
      return false
    }
    const result = await res.json()
    console.log(`  ✅ Success in ${elapsed}ms`)
    console.log(`     Mean: ${result.stats.mean.toFixed(4)}`)
    console.log(`     Min: ${result.stats.min.toFixed(4)}, Max: ${result.stats.max.toFixed(4)}`)
    console.log(`     Std: ${result.stats.std.toFixed(4)}`)
    console.log(`     Count: ${result.stats.count.toLocaleString()}`)
    console.log(`     Chunked: ${result.chunked ? 'yes' : 'no'}`)
    return true
  } catch (e) {
    console.error(`  ❌ Error: ${e.message}`)
    return false
  }
}

async function main() {
  console.log('Testing large array processing with chunked computation')
  console.log(`API URL: ${API_URL}`)

  // Test health endpoint first
  try {
    const health = await fetch(`${API_URL}/health`)
    if (!health.ok) {
      console.error('❌ API health check failed. Is the server running?')
      console.error(`   Run: npm run catalog:api`)
      process.exit(1)
    }
  } catch (e) {
    console.error('❌ Cannot connect to API. Is the server running?')
    console.error(`   Run: npm run catalog:api`)
    process.exit(1)
  }

  const sizes = [
    { size: 1000, label: 'Small array' },
    { size: 10000, label: 'Medium array' },
    { size: 50000, label: 'Large array (chunked threshold)' },
    { size: 100000, label: 'Very large array' },
    { size: 500000, label: 'Huge array' },
  ]

  let allPassed = true
  for (const { size, label } of sizes) {
    const passed = await testLargeArray(size, label)
    if (!passed) allPassed = false
  }

  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('✅ All tests passed!')
  } else {
    console.log('❌ Some tests failed')
    process.exit(1)
  }
}

main().catch((e) => {
  console.error('Fatal error:', e)
  process.exit(1)
})
