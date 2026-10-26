// Scrapes postseason results, including each series' score, from Basketball-Reference into data/raw/basketball-reference/playoffs.json.
// Run with `npm run scrape:playoffs` (add `-- --force` to re-fetch saved seasons). Requests are spaced 3 seconds apart to match the site's Crawl-delay.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { hasSeriesScores, parseSeason } from './lib/playoffs.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'data', 'raw', 'basketball-reference', 'playoffs.json')
mkdirSync(dirname(outFile), { recursive: true })

// Basketball-Reference names a season by the year it ends: 2017-18 is /playoffs/NBA_2018.html
const FIRST_END_YEAR = 2004
const LAST_END_YEAR = 2026
const CRAWL_DELAY_MS = 3000
const USER_AGENT = 'nba-weekly-power-rankings (personal project)'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

async function fetchPage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

// Seasons already saved with series scores are kept unless --force is passed, so re-runs only fetch new seasons
const force = process.argv.includes('--force')
const saved = !force && existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : {}
const results = {}
let fetched = 0
for (let endYear = FIRST_END_YEAR; endYear <= LAST_END_YEAR; endYear++) {
  const season = `${endYear - 1}-${String(endYear).slice(2)}`
  if (saved[season] && hasSeriesScores(saved[season])) {
    results[season] = saved[season]
    continue
  }
  const url = `https://www.basketball-reference.com/playoffs/NBA_${endYear}.html`
  if (fetched > 0) await sleep(CRAWL_DELAY_MS)
  console.log(`Fetching ${season} ${url}`)
  results[season] = { source: url, ...parseSeason(await fetchPage(url)) }
  fetched++
  writeFileSync(outFile, JSON.stringify(results, null, 2) + '\n')
}
writeFileSync(outFile, JSON.stringify(results, null, 2) + '\n')

for (const [season, data] of Object.entries(results)) {
  console.log(`${season}: champion ${data.champion}, runner-up ${data.runnerUp}, ${data.rounds.map((r) => `${r.round}=${r.series.map((s) => `${s.winnerWins}-${s.loserWins}`).join(',')}`).join(' ')}`)
}
console.log(`Wrote ${outFile}`)
