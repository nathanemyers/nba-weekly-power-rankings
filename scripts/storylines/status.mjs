// Usage: npm run status:storylines
// Lists every season with its storyline status and the skill phase to run next
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { root, seasonPaths } from './context.mjs'
import { seasonWindow } from './rules.mjs'

const readJson = (file) => JSON.parse(readFileSync(file, 'utf8'))
const draftDates = readJson(
  join(root, 'scripts', 'storylines', 'draft-dates.json')
)
const seasons = readdirSync(join(root, 'data', 'processed', 'seasons'))
  .filter((file) => /^\d{4}-\d{2}\.json$/.test(file))
  .map((file) => file.replace('.json', ''))
  .sort()

function seasonStatus(season) {
  const { rawFile, seasonFile, processedFile } = seasonPaths(season)
  if (existsSync(processedFile)) {
    const processed = readJson(processedFile)
    const featured = processed.storylines.filter(
      (storyline) => storyline.featured
    ).length
    return {
      status: `finalized ${processed.finalizedAt}`,
      detail: `${processed.storylines.length} storylines, ${featured} featured`,
      next: 'revise (only on request)',
    }
  }
  if (!Object.values(readJson(seasonFile).playoffs ?? {}).includes('champion'))
    return {
      status: 'not complete',
      detail: 'no champion in season file',
      next: '-',
    }
  if (!seasonWindow(season, draftDates))
    return {
      status: 'no window',
      detail: 'draft date missing in draft-dates.json',
      next: '-',
    }
  if (!existsSync(rawFile))
    return { status: 'not started', detail: '', next: 'discover' }
  const { candidates } = readJson(rawFile)
  const count = (status) =>
    candidates.filter((candidate) => candidate.status === status).length
  const detail = `${candidates.length} candidates: ${count('included')} included, ${count('excluded')} excluded, ${count('pending')} pending`
  if (count('pending')) return { status: 'in review', detail, next: 'review' }
  return { status: 'reviewed', detail, next: 'finalize' }
}

const rows = seasons.map((season) => ({ season, ...seasonStatus(season) }))
const width = (key) =>
  Math.max(key.length, ...rows.map((row) => row[key].length))
const columns = ['season', 'status', 'next', 'detail']
const line = (row) =>
  columns
    .map((key) => row[key].padEnd(width(key)))
    .join('  ')
    .trimEnd()
console.log(
  line({ season: 'season', status: 'status', next: 'next', detail: 'detail' })
)
for (const row of rows) console.log(line(row))
