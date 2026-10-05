// Reduces the scraped articles in /data into one compact JSON file per season
// under src/data/seasons. Run with `npm run build:rankings` after new scrapes.
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataDir = join(root, 'data')
const outDir = join(root, 'src', 'data', 'seasons')

// NBA team IDs as they appear in the scraped rankings, mapped to the slugs used in src/Chart/teams.ts
const TEAM_SLUGS = {
  1610612737: 'atl', 1610612738: 'bos', 1610612751: 'bkn', 1610612766: 'cha',
  1610612741: 'chi', 1610612739: 'cle', 1610612742: 'dal', 1610612743: 'den',
  1610612765: 'det', 1610612744: 'gsw', 1610612745: 'hou', 1610612754: 'ind',
  1610612746: 'lac', 1610612747: 'lal', 1610612763: 'mem', 1610612748: 'mia',
  1610612749: 'mil', 1610612750: 'min', 1610612740: 'nop', 1610612752: 'nyk',
  1610612760: 'okc', 1610612753: 'orl', 1610612755: 'phi', 1610612756: 'phx',
  1610612757: 'por', 1610612758: 'sac', 1610612759: 'sas', 1610612761: 'tor',
  1610612762: 'uta', 1610612764: 'was',
}

const MAX_BLURB_LENGTH = 260

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

const index = JSON.parse(readFileSync(join(dataDir, 'index.json'), 'utf8'))

const weeklyArticles = index.filter(
  (a) => a.week != null && a.hasStructuredRankings && /power rankings/i.test(a.title),
)

const bySeason = new Map()
for (const article of weeklyArticles) {
  if (!bySeason.has(article.season)) bySeason.set(article.season, [])
  bySeason.get(article.season).push(article)
}

rmSync(outDir, { recursive: true, force: true })
mkdirSync(outDir, { recursive: true })

for (const [season, articles] of [...bySeason].sort()) {
  const rankings = {}
  const seenWeeks = new Set()
  let maxWeek = 0

  for (const article of articles.sort((a, b) => a.week - b.week)) {
    // The same week can be indexed twice (e.g. a `_v2` re-scrape); keep the first
    if (seenWeeks.has(article.week)) continue
    seenWeeks.add(article.week)
    maxWeek = Math.max(maxWeek, article.week)

    const article_json = JSON.parse(readFileSync(join(dataDir, article.file), 'utf8'))
    const seenTeams = new Set()

    for (const entry of article_json.rankings) {
      const slug = TEAM_SLUGS[entry.teamId]
      // Some scrapes list a team twice in one week; keep the first
      if (!slug || seenTeams.has(slug)) continue
      seenTeams.add(slug)

      const record = currentRecord(entry.summaryText)
      ;(rankings[slug] ??= []).push({
        week: article.week,
        rank: entry.rank,
        ...(record && { record }),
        summary: cleanSummary(entry.summaryText),
      })
    }
  }

  const output = { season, maxWeek, rankings }
  const file = join(outDir, `${season}.json`)
  writeFileSync(file, JSON.stringify(output))
  console.log(`${season}: ${seenWeeks.size} weeks, ${Object.keys(rankings).length} teams -> ${file}`)
}
