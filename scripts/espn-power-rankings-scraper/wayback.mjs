#!/usr/bin/env node
// Recovers ESPN editions that espn.com no longer serves from the Wayback Machine's copies of the 2003-05 site.
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { fetchTextWithRetry, sleep } from '../lib/http.mjs'
import { editionSlug } from './editionPage.mjs'
import { legacyHeadingWeek, parseLegacyEdition, parseLegacyHeading } from './legacyEditionPage.mjs'
import { editionFile, indexEntry, writeIndex } from './scrape.mjs'
import { editionUrl, seasonLabel } from './seasonPage.mjs'
import { FIRST_SEASON, LAST_SEASON, parseSeasonRange } from './seasonRange.mjs'

const CDX_URL = 'https://web.archive.org/cdx/search/cdx'
const LEGACY_URL = 'sports.espn.go.com/nba/powerranking'
// Captures closer together than this are almost always the same weekly edition.
const MIN_GAP_DAYS = 5

function parseArgs(argv) {
  const args = { from: FIRST_SEASON, to: LAST_SEASON, outDir: '', delayMs: 3000 }
  for (let i = 0; i < argv.length; i++) {
    switch (argv[i]) {
      case '--from':
        args.from = argv[++i]
        break
      case '--to':
        args.to = argv[++i]
        break
      case '--out':
        args.outDir = argv[++i]
        break
      case '--delay-ms':
        args.delayMs = Number(argv[++i])
        break
      case '--help':
        console.log(`Usage: node scripts/espn-power-rankings-scraper/wayback.mjs [options]

Fills gaps in data/raw/espn from the Wayback Machine. A gap is any week from the
preseason up to a season's last saved week that isn't saved yet.

Options:
  --from <season>   First season to check (default: ${FIRST_SEASON})
  --to <season>     Last season to check (default: ${LAST_SEASON})
  --out <dir>       ESPN data directory (default: data/raw/espn)
  --delay-ms <n>    Delay between requests to archive.org, in ms (default: 3000)
  --help            Show this help`)
        process.exit(0)
        break
      default:
        console.error(`Unknown argument: ${argv[i]}`)
        process.exit(1)
    }
  }
  return args
}

/** Weeks from the preseason up to the season's last saved weekly edition that have no saved file. */
function findGaps(index, season) {
  const saved = {}
  for (const entry of index.filter((e) => e.season === season)) saved[entry.espnWeek] = true
  const lastWeek = Math.max(0, ...index.filter((e) => e.season === season).map((e) => e.espnWeek))
  const gaps = []
  for (let week = 0; week <= lastWeek; week++) {
    if (!saved[week]) gaps.push(week)
  }
  return gaps
}

async function listCaptures(endYear) {
  const query = new URLSearchParams({
    url: `${LEGACY_URL}*`,
    from: `${endYear - 1}0801`,
    to: `${endYear}0731`,
    fl: 'timestamp,original',
    filter: 'statuscode:200',
    collapse: 'digest',
  })
  const text = await fetchTextWithRetry(`${CDX_URL}?${query}`)
  return text
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [timestamp, original] = line.split(' ')
      const week = new RegExp(`[?&]season=${endYear}&week=(-?\\d+)$`).exec(original)
      return { timestamp, original, week: week ? parseInt(week[1], 10) : null, undated: !original.includes('?') }
    })
}

function daysBetween(a, b) {
  const toDate = (ts) => Date.UTC(ts.slice(0, 4), ts.slice(4, 6) - 1, ts.slice(6, 8))
  return Math.abs(toDate(a) - toDate(b)) / 86400000
}

// Captures to try, in order: ones whose URL names a missing week, then the undated "current week" page spaced a few days apart.
function pickCandidates(captures, gaps) {
  const wanted = {}
  for (const week of gaps) wanted[week] = true
  const named = captures.filter((c) => c.week != null && wanted[c.week])
  const undated = []
  for (const capture of captures.filter((c) => c.undated)) {
    const last = undated[undated.length - 1]
    if (!last || daysBetween(last.timestamp, capture.timestamp) >= MIN_GAP_DAYS) undated.push(capture)
  }
  return [...named, ...undated]
}

async function recoverSeason({ endYear, outDir, delayMs, index }) {
  const season = seasonLabel(endYear)
  const gaps = findGaps(index, season)
  if (gaps.length === 0) return []
  console.log(`${season}: missing ${gaps.map((w) => editionSlug(season, w)).join(', ')}`)

  const captures = await listCaptures(endYear)
  const remaining = {}
  for (const week of gaps) remaining[week] = true
  const recovered = []

  for (const capture of pickCandidates(captures, gaps)) {
    if (Object.keys(remaining).length === 0) break
    if (capture.week != null && !remaining[capture.week]) continue
    await sleep(delayMs)

    const archiveUrl = `https://web.archive.org/web/${capture.timestamp}/${capture.original}`
    let html
    try {
      html = await fetchTextWithRetry(`https://web.archive.org/web/${capture.timestamp}id_/${capture.original}`, {
        encoding: 'windows-1252',
      })
    } catch (err) {
      console.error(`  failed: ${String(err)}`)
      continue
    }

    const heading = parseLegacyHeading(html)
    const found = heading == null ? null : legacyHeadingWeek(heading)
    if (!found || found.endYear !== endYear || !remaining[found.espnWeek]) {
      console.log(`  ${capture.timestamp}: "${heading ?? 'no rankings heading'}", not needed`)
      continue
    }

    try {
      const { edition, warnings } = parseLegacyEdition(html, {
        season,
        espnWeek: found.espnWeek,
        url: editionUrl(endYear, found.espnWeek),
        archiveUrl,
      })
      const filePath = path.join(outDir, editionFile(season, found.espnWeek))
      await mkdir(path.dirname(filePath), { recursive: true })
      await writeFile(filePath, JSON.stringify(edition, null, 2), 'utf8')
      console.log(`  recovered ${edition.slug} from ${capture.timestamp}`)
      for (const warning of warnings) console.warn(`  warning: ${warning}`)
      delete remaining[found.espnWeek]
      recovered.push(edition)
    } catch (err) {
      console.error(`  failed: ${String(err)}`)
    }
  }

  const stillMissing = Object.keys(remaining).map((w) => editionSlug(season, Number(w)))
  if (stillMissing.length) console.warn(`  not in the archive: ${stillMissing.join(', ')}`)
  return recovered
}

async function main() {
  const args = parseArgs(process.argv.slice(2))
  let range
  try {
    range = parseSeasonRange(args.from, args.to)
  } catch (err) {
    console.error(err.message)
    process.exit(1)
  }

  const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
  const outDir = args.outDir || path.join(root, 'data', 'raw', 'espn')
  const indexPath = path.join(outDir, 'index.json')
  const index = existsSync(indexPath) ? JSON.parse(await readFile(indexPath, 'utf8')) : []

  const recovered = []
  for (let endYear = range.fromEndYear; endYear <= range.toEndYear; endYear++) {
    recovered.push(...(await recoverSeason({ endYear, outDir, delayMs: args.delayMs, index })))
  }

  const recoveredSlugs = {}
  for (const edition of recovered) recoveredSlugs[edition.slug] = true
  await writeIndex(indexPath, [
    ...index.filter((entry) => !recoveredSlugs[entry.slug]),
    ...recovered.map(indexEntry),
  ])
  console.log(`\nDone. Recovered ${recovered.length} editions. Index written to ${indexPath}.`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
