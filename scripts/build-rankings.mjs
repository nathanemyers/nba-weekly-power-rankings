import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadSeasonEntries } from './lib/articles.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const nbaDir = join(root, 'data', 'raw', 'nba')
const playoffsFile = join(root, 'data', 'raw', 'basketball-reference', 'playoffs.json')
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

const bySeason = loadSeasonEntries(nbaDir)
const summariesDir = join(processedDir, 'summaries')

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const season of Object.keys(bySeason).sort()) {
  const { maxWeek, weekCount, teams } = bySeason[season]
  const rankings = {}
  for (const slug of Object.keys(teams)) {
    rankings[slug] = teams[slug].map((entry) => {
      const record = currentRecord(entry.summaryText)
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

  const output = {
    season,
    maxWeek,
    rankings,
    ...(Object.keys(playoffs).length && { playoffs }),
    ...(Object.keys(summaries).length && { summaries }),
  }
  const file = join(outDir, `${season}.json`)
  writeFileSync(file, JSON.stringify(output))
  console.log(`${season}: ${weekCount} weeks, ${Object.keys(rankings).length} teams -> ${file}`)
}

// Statically imports every season's JSON so the app can reach them all through one import,
// with no import.meta.glob/async loading. Imports are typed `unknown` because the app validates
// them with Zod (src/schemas/season.ts) before use.
const seasons = Object.keys(bySeason).sort().reverse()
const indexFile = join(outDir, 'index.ts')
writeFileSync(
  indexFile,
  [
    ...seasons.map((season) => `import season_${season.replace('-', '_')} from "./${season}.json";`),
    '',
    `export const seasonData: Record<string, unknown> = {`,
    ...seasons.map((season) => `  "${season}": season_${season.replace('-', '_')},`),
    `};`,
    '',
    `export const seasons: string[] = Object.keys(seasonData).sort().reverse();`,
    '',
  ].join('\n'),
)
console.log(`index: ${seasons.length} seasons -> ${indexFile}`)
