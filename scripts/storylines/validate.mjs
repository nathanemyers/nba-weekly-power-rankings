// Usage: npm run check:storylines -- <season> [--finalize] [--revise]
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildProcessed, checkFinalize, checkRaw } from './rules.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const root = join(here, '..', '..')
const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))

const args = process.argv.slice(2)
const season = args.find((arg) => !arg.startsWith('--'))
const finalize = args.includes('--finalize')
const revise = args.includes('--revise')

function exitWith(failures) {
  for (const failure of failures) console.error(failure)
  process.exit(1)
}

if (!season) exitWith(['Usage: npm run check:storylines -- <season> [--finalize] [--revise]'])

const rawFile = join(root, 'data', 'raw', 'storylines', `${season}.json`)
const seasonFile = join(root, 'data', 'processed', 'seasons', `${season}.json`)
const processedFile = join(root, 'data', 'processed', 'storylines', `${season}.json`)
if (!existsSync(rawFile)) exitWith([`No candidates file at ${rawFile}`])
if (!existsSync(seasonFile)) exitWith([`No season file at ${seasonFile}; run npm run build:rankings`])

const raw = readJson(rawFile)
const seasonData = readJson(seasonFile)
const playoffs = seasonData.playoffs ?? {}
const ctx = {
  season,
  sources: readJson(join(here, 'sources.json')),
  draftDates: readJson(join(here, 'draft-dates.json')),
  teams: Object.keys(seasonData.rankings),
  playoffTeams: Object.keys(playoffs),
  completed: Object.values(playoffs).includes('champion'),
}

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
