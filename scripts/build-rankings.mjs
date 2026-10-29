import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadEspnSeasonEntries, loadSeasonEntries } from './lib/articles.mjs'
import { teamPlayoffRuns } from './lib/playoffs.mjs'
import { teamCoaches, teamRosters } from './lib/rosters.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nbaDir = join(root, 'data', 'raw', 'nba')
const espnDir = join(root, 'data', 'raw', 'espn')
const playoffsFile = join(root, 'data', 'raw', 'basketball-reference', 'playoffs.json')
const rostersDir = join(root, 'data', 'raw', 'basketball-reference', 'rosters')
const processedDir = join(root, 'data', 'processed')
const outDir = join(processedDir, 'seasons')

const MAX_BLURB_LENGTH = 260

// Postseason results from scripts/scrape-playoffs.mjs. Teams are keyed by season and slug
const PLAYOFFS = JSON.parse(readFileSync(playoffsFile, 'utf8'))

// Summaries open with stat lines ("Record: 25-4", "OffRtg: ...") before the prose.
// Keep only the first line of prose, cut to a sentence-ish length.
function cleanSummary(summaryText) {
  const prose = summaryText
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line && !/^(Record:|\d{4}-\d{2}:|Pace:|OffRtg:|Week \d+:)/.test(line) && !/NetRtg:/.test(line))

  if (!prose) return ''
  if (prose.length <= MAX_BLURB_LENGTH) return prose
  const cut = prose.slice(0, MAX_BLURB_LENGTH)
  return `${cut.slice(0, cut.lastIndexOf(' '))}…`
}

// Only "Record:" is the current season's record. Older articles lead with the prior season's record.
function currentRecord(summaryText) {
  const match = summaryText.match(/^Record:\s*(\d+-\d+)/m)
  return match ? match[1] : undefined
}

// ESPN covers 2003-04 to 2015-16 and NBA.com 2017-18 onward; NBA.com wins if they ever overlap
const nbaSeasons = loadSeasonEntries(nbaDir)
const bySeason = { ...loadEspnSeasonEntries(espnDir), ...nbaSeasons }
const summariesDir = join(processedDir, 'summaries')
const storylinesDir = join(processedDir, 'storylines')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

const seasonIndex = {}

for (const season of Object.keys(bySeason).sort()) {
  const { maxWeek, weekCount, teams } = bySeason[season]
  const rankings = {}
  for (const slug of Object.keys(teams)) {
    rankings[slug] = teams[slug].map((entry) => {
      const record = entry.record ?? currentRecord(entry.summaryText)
      return {
        week: entry.week,
        rank: entry.rank,
        ...(record && { record }),
        summary: cleanSummary(entry.summaryText),
      }
    })
  }

  // AI summaries from scripts/build-summaries.mjs; only the text ships to the app
  const summariesFile = join(summariesDir, `${season}.json`)
  const stored = existsSync(summariesFile) ? JSON.parse(readFileSync(summariesFile, 'utf8')) : {}
  const summaries = Object.fromEntries(Object.keys(stored).map((slug) => [slug, stored[slug].summary]))

  // Maintainer-finalized storylines from scripts/storylines/validate.mjs --finalize
  const storylinesFile = join(storylinesDir, `${season}.json`)
  const storylines = existsSync(storylinesFile)
    ? JSON.parse(readFileSync(storylinesFile, 'utf8')).storylines.toSorted((a, b) => a.eventDate.localeCompare(b.eventDate))
    : []

  // Each team gets the furthest stage it reached
  const STAGE_ORDER = ['first-round', 'semis', 'conf-finals', 'finals', 'champion']
  const playoffs = {}
  const reach = (slug, stage) => {
    if (!playoffs[slug] || STAGE_ORDER.indexOf(stage) > STAGE_ORDER.indexOf(playoffs[slug]))
      playoffs[slug] = stage
  }
  const bracket = PLAYOFFS[season]
  if (bracket) {
    for (const round of bracket.rounds) {
      for (const series of round.series) for (const slug of series.teams) reach(slug, round.round)
    }
    reach(bracket.champion, 'champion')
  }
  const playoffSeries = bracket ? teamPlayoffRuns(bracket, season) : {}

  // Regular-season rosters and head coaches from scripts/scrape-rosters.mjs; every ranked team needs both
  const rosterFile = join(rostersDir, `${season}.json`)
  const rosterRaw = existsSync(rosterFile) ? JSON.parse(readFileSync(rosterFile, 'utf8')) : undefined
  const rosters = rosterRaw ? teamRosters(rosterRaw, season) : {}
  const coaches = rosterRaw ? teamCoaches(rosterRaw, season) : {}
  if (rosterRaw) {
    for (const slug of Object.keys(rankings)) {
      if (!rosters[slug]) throw new Error(`${season} ${slug}: no roster`)
      if (!coaches[slug]) throw new Error(`${season} ${slug}: no head coach`)
    }
  }

  const output = {
    season,
    source: nbaSeasons[season] ? 'nba' : 'espn',
    maxWeek,
    rankings,
    ...(Object.keys(playoffs).length && { playoffs }),
    ...(Object.keys(playoffSeries).length && { playoffSeries }),
    ...(Object.keys(summaries).length && { summaries }),
    ...(Object.keys(rosters).length && { rosters }),
    ...(Object.keys(coaches).length && { coaches }),
    ...(storylines.length && { storylines }),
  }
  seasonIndex[season] = {
    name: season,
    source: output.source,
    ...(bracket && { champion: bracket.champion }),
  }
  const file = join(outDir, `${season}.json`)
  writeFileSync(file, JSON.stringify(output))
  console.log(`${season}: ${weekCount} weeks, ${Object.keys(rankings).length} teams -> ${file}`)
}

// The season list ships in the main bundle and each season's JSON loads as its own chunk on demand
const seasons = Object.keys(bySeason).sort().reverse()
const indexFile = join(outDir, 'index.ts')
writeFileSync(
  indexFile,
  [
    `export const seasonIndex: unknown = ${JSON.stringify(seasons.map((season) => seasonIndex[season]), null, 2)};`,
    '',
    `export const seasonLoaders: Record<string, () => Promise<{ default: unknown }>> = {`,
    ...seasons.map((season) => `  "${season}": () => import("./${season}.json"),`),
    `};`,
    '',
  ].join('\n'),
)
console.log(`index: ${seasons.length} seasons -> ${indexFile}`)
