// Usage: npm run check:storylines -- <season> [--finalize] [--revise]
import { existsSync, writeFileSync } from 'node:fs'
import { loadSeason, seasonPaths } from './context.mjs'
import { buildProcessed, checkFinalize, checkRaw } from './rules.mjs'

const args = process.argv.slice(2)
const season = args.find((arg) => !arg.startsWith('--'))
const finalize = args.includes('--finalize')
const revise = args.includes('--revise')

function exitWith(failures) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}

if (!season) exitWith(['Usage: npm run check:storylines -- <season> [--finalize] [--revise]'])

const { processedFile } = seasonPaths(season)
const loaded = loadSeason(season)
if (loaded.failures) exitWith(loaded.failures)
const { raw, ctx } = loaded

const failures = finalize ? checkFinalize(raw, ctx) : checkRaw(raw, ctx)
if (finalize && existsSync(processedFile) && !revise)
  failures.push(`${season} is already finalized; pass --revise only when the maintainer has asked to revise it`)
if (failures.length) exitWith(failures)

const counts = {}
for (const candidate of raw.candidates) {
  const key = `${candidate.kind}/${candidate.status}`
  counts[key] = (counts[key] ?? 0) + 1
}
console.log(`${season}: ${raw.candidates.length} candidates, ${raw.guidance.length} guidance topics`)
for (const key of Object.keys(counts).sort()) console.log(`  ${key}: ${counts[key]}`)

if (finalize) {
  const output = buildProcessed(raw, new Date().toISOString().slice(0, 10))
  writeFileSync(processedFile, `${JSON.stringify(output, null, 2)}\n`)
  console.log(`Wrote ${output.storylines.length} storylines to ${processedFile}`)
}
