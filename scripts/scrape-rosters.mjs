// Scrapes regular-season player per-game and advanced stats and head coaches from Basketball-Reference into data/raw/basketball-reference/rosters/{season}.json.
// Run with `npm run scrape:rosters` (add `-- --force` to re-fetch every season, or `-- --season 2025-26` to re-fetch one). Requests are spaced 3 seconds apart to match the site's Crawl-delay.
import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fetchTextWithRetry, sleep } from './lib/http.mjs'
import { parseCoachesTable, parseStatsTable } from './lib/rosters.mjs'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outDir = join(root, 'data', 'raw', 'basketball-reference', 'rosters')
mkdirSync(outDir, { recursive: true })

// Basketball-Reference names a season by the year it ends: 2018-19 is /leagues/NBA_2019_per_game.html
const FIRST_END_YEAR = 2004
const LAST_END_YEAR = 2026
const CRAWL_DELAY_MS = 3000

const force = process.argv.includes('--force')
const onlySeason = process.argv.includes('--season') ? process.argv[process.argv.indexOf('--season') + 1] : undefined

let requests = 0
async function fetchPage(url) {
  if (requests > 0) await sleep(CRAWL_DELAY_MS)
  requests++
  console.log(`Fetching ${url}`)
  return fetchTextWithRetry(url, { baseDelayMs: CRAWL_DELAY_MS })
}

let fetched = 0
for (let endYear = FIRST_END_YEAR; endYear <= LAST_END_YEAR; endYear++) {
  const season = `${endYear - 1}-${String(endYear).slice(2)}`
  if (onlySeason && season !== onlySeason) continue
  const file = join(outDir, `${season}.json`)
  if (!force && !onlySeason && existsSync(file)) continue

  const base = `https://www.basketball-reference.com/leagues/NBA_${endYear}`
  const source = { perGame: `${base}_per_game.html`, advanced: `${base}_advanced.html`, coaches: `${base}_coaches.html` }
  const perGame = parseStatsTable(await fetchPage(source.perGame), 'per_game_stats')
  const advanced = parseStatsTable(await fetchPage(source.advanced), 'advanced')
  const coaches = parseCoachesTable(await fetchPage(source.coaches))
  writeFileSync(file, JSON.stringify({ season, source, perGame, advanced, coaches }, null, 2) + '\n')
  console.log(`${season}: ${perGame.length} per-game rows, ${advanced.length} advanced rows, ${coaches.length} coaches -> ${file}`)
  fetched++
}
if (onlySeason && fetched === 0) throw new Error(`Unknown season "${onlySeason}"`)
console.log(`Fetched ${fetched} seasons in ${requests} requests`)
