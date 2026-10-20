#!/usr/bin/env node
/**
 * Add or refresh one version of this bundle in market.json.
 *
 * Usage:
 *   node scripts/update-market.mjs [version] [publishTimestamp]
 *
 * `version` defaults to package.json and may carry a leading "v"; the timestamp
 * defaults to now and must be Unix seconds, matching the format-1 index rules.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))

const version = (process.argv[2] ?? pkg.version).replace(/^v/, '')
const timestamp = Number(process.argv[3] ?? Math.floor(Date.now() / 1000))

if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/.test(version)) {
  throw new Error(`not a SemVer version: ${version}`)
}
if (!Number.isInteger(timestamp) || timestamp < 0 || timestamp >= 1e11) {
  throw new Error(`publishTimestamp must be integer Unix seconds in [0, 10^11): ${timestamp}`)
}

const marketPath = join(root, 'market.json')
const market = JSON.parse(readFileSync(marketPath, 'utf8'))
const plugin = market.plugins?.find((entry) => entry.name === pkg.name)
if (plugin === undefined) {
  throw new Error(`market.json lists no plugin named ${pkg.name}`)
}

const engines = pkg.engines?.dsh === undefined ? {} : { engines: { dsh: pkg.engines.dsh } }
const versions = (plugin.versions ?? []).filter((entry) => entry.version !== version)
versions.push({ version, publishTimestamp: timestamp, source: { type: 'npm' }, ...engines })
versions.sort((a, b) => compareSemver(b.version, a.version))
plugin.versions = versions

writeFileSync(marketPath, `${JSON.stringify(market, null, 2)}\n`)
console.log(`market.json: ${pkg.name}@${version} (${timestamp})`)

function parse(version) {
  const [core, pre] = version.split('+')[0].split('-')
  return { numbers: core.split('.').map(Number), pre }
}

function comparePrerelease(a, b) {
  if (a === undefined && b === undefined) return 0
  if (a === undefined) return 1
  if (b === undefined) return -1
  const left = a.split('.')
  const right = b.split('.')
  for (let index = 0; index < Math.max(left.length, right.length); index += 1) {
    const x = left[index]
    const y = right[index]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const xNumeric = /^\d+$/.test(x)
    const yNumeric = /^\d+$/.test(y)
    if (xNumeric && yNumeric) {
      const delta = Number(x) - Number(y)
      if (delta !== 0) return delta
    } else if (xNumeric !== yNumeric) {
      return xNumeric ? -1 : 1
    } else if (x !== y) {
      return x < y ? -1 : 1
    }
  }
  return 0
}

function compareSemver(a, b) {
  const left = parse(a)
  const right = parse(b)
  for (let index = 0; index < 3; index += 1) {
    const delta = (left.numbers[index] ?? 0) - (right.numbers[index] ?? 0)
    if (delta !== 0) return delta
  }
  return comparePrerelease(left.pre, right.pre)
}
