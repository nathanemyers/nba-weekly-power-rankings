// Scrapes postseason results from Basketball-Reference into data/playoffs.json.
// Run with `npm run scrape:playoffs`. Requests are spaced 3 seconds apart to match the site's Crawl-delay.
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outFile = join(root, 'data', 'playoffs.json')

// Basketball-Reference names a season by the year it ends: 2017-18 is /playoffs/NBA_2018.html
const FIRST_END_YEAR = 2018
const LAST_END_YEAR = 2026
const CRAWL_DELAY_MS = 3000
const USER_AGENT = 'nba-weekly-power-rankings (personal project)'

// Team names as they appear on Basketball-Reference, mapped to the slugs used in src/Chart/teams.ts
const teamsSource = readFileSync(join(root, 'src', 'Chart', 'teams.ts'), 'utf8')
const SLUG_BY_NAME = Object.fromEntries(
  [...teamsSource.matchAll(/slug: "(\w+)", name: "([^"]+)"/g)].map(([, slug, name]) => [name, slug]),
)
SLUG_BY_NAME['Los Angeles Clippers'] = 'lac'

const ROUND_BY_HEADER = {
  'East Conf 1st Round': 'first-round',
  'West Conf 1st Round': 'first-round',
  'East Conf Semis': 'semis',
  'West Conf Semis': 'semis',
  'East Conf Finals': 'conf-finals',
  'West Conf Finals': 'conf-finals',
  Finals: 'finals',
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

function slugFor(name) {
  const slug = SLUG_BY_NAME[name.trim()]
  if (!slug) throw new Error(`Unknown team name on Basketball-Reference: "${name}"`)
  return slug
}

async function fetchPage(url) {
  const response = await fetch(url, { headers: { 'User-Agent': USER_AGENT } })
  if (!response.ok) throw new Error(`${url} returned ${response.status}`)
  return response.text()
}

function parseSeason(html) {
  // The bracket is printed twice (desktop and mobile); the first copy is enough
  const bracketStart = html.indexOf('listhead"><strong>East Conf 1st Round')
  const bracketEnd = html.indexOf('Player Stats', bracketStart)
  const bracket = html.slice(bracketStart, bracketEnd)

  const rounds = []
  for (const [, header, list] of bracket.matchAll(/listhead"><strong>([^<]+)<\/strong><\/p>\s*<ul[^>]*>([\s\S]*?)<\/ul>/g)) {
    const stage = ROUND_BY_HEADER[header.trim()]
    if (!stage) continue
    const series = [...list.matchAll(/<a href="\/playoffs\/[^"]*">([^<]+?) vs\. ([^<]+?)<\/a>/g)].map(
      ([, a, b]) => [slugFor(a), slugFor(b)],
    )
    rounds.push({ stage, series })
  }

  const championName = html.match(/League Champion<\/strong>: <a[^>]*>([^<]+)<\/a>/)?.[1]
  if (!championName) throw new Error('No league champion found on page')
  const champion = slugFor(championName)

  // A team advanced if it shows up in the next stage (both conferences). The Finals winner comes from the champion line
  const NEXT_STAGE = { 'first-round': 'semis', semis: 'conf-finals', 'conf-finals': 'finals' }
  const resultRounds = rounds.map((round) => {
    const nextStage = NEXT_STAGE[round.stage]
    const advanced = new Set(rounds.filter((r) => r.stage === nextStage).flatMap((r) => r.series.flat()))
    return {
      round: round.stage,
      series: round.series.map(([a, b]) => {
        const winner = round.stage === 'finals' ? champion : advanced.has(a) ? a : b
        return { teams: [a, b], winner }
      }),
    }
  })

  const finals = resultRounds.find((r) => r.round === 'finals')?.series[0]
  const runnerUp = finals?.teams.find((slug) => slug !== champion)
  return { champion, runnerUp, rounds: resultRounds }
}

const results = {}
for (let endYear = FIRST_END_YEAR; endYear <= LAST_END_YEAR; endYear++) {
  const season = `${endYear - 1}-${String(endYear).slice(2)}`
  const url = `https://www.basketball-reference.com/playoffs/NBA_${endYear}.html`
  console.log(`Fetching ${season} ${url}`)
  results[season] = { source: url, ...parseSeason(await fetchPage(url)) }
  writeFileSync(outFile, JSON.stringify(results, null, 2) + '\n')
  if (endYear < LAST_END_YEAR) await sleep(CRAWL_DELAY_MS)
}

for (const [season, data] of Object.entries(results)) {
  console.log(`${season}: champion ${data.champion}, runner-up ${data.runnerUp}, ${data.rounds.map((r) => `${r.round}=${r.series.length}`).join(' ')}`)
}
console.log(`Wrote ${outFile}`)
