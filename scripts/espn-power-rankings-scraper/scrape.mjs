import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { fetchTextWithRetry, sleep } from '../lib/http.mjs'
import { editionSlug, parseEdition } from './editionPage.mjs'
import { editionUrl, parseSeasonPage, seasonLabel, seasonUrl } from './seasonPage.mjs'

<<<<<<< HEAD
export function editionFile(season, espnWeek) {
  return path.join('articles', season, `${editionSlug(season, espnWeek)}.json`)
}

export function indexEntry(edition) {
=======
function editionFile(season, espnWeek) {
  return path.join('articles', season, `${editionSlug(season, espnWeek)}.json`)
}

function indexEntry(edition) {
>>>>>>> master
  return {
    slug: edition.slug,
    title: edition.title,
    season: edition.season,
    espnWeek: edition.espnWeek,
    week: edition.week,
    editionType: edition.editionType,
    updatedText: edition.updatedText,
    teamCount: edition.rankings.length,
    hasStructuredRankings: edition.hasStructuredRankings,
    file: editionFile(edition.season, edition.espnWeek),
  }
}

async function saveEdition(outDir, edition, warnings) {
  const filePath = path.join(outDir, editionFile(edition.season, edition.espnWeek))
  await mkdir(path.dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(edition, null, 2), 'utf8')
  for (const warning of warnings) {
    console.warn(`  warning: ${warning}`)
  }
}

<<<<<<< HEAD
export function sortIndex(entries) {
  return entries.sort((a, b) => b.season.localeCompare(a.season) || b.espnWeek - a.espnWeek)
}

export async function writeIndex(indexPath, entries) {
  await writeFile(indexPath, JSON.stringify(sortIndex(entries), null, 2), 'utf8')
}

=======
>>>>>>> master
/** Scrapes ESPN's weekly editions for the given end years into `outDir`, reusing saved files unless `force` is set. */
export async function scrape({ fromEndYear, toEndYear, outDir, delayMs, force = false }) {
  await mkdir(outDir, { recursive: true })

  const index = []
  const counts = { fetched: 0, skipped: 0, missing: 0, failed: 0 }

  for (let endYear = fromEndYear; endYear <= toEndYear; endYear++) {
    const season = seasonLabel(endYear)
    console.log(`Fetching ${season} season page...`)

    let seasonHtml
    let weeks
    let probedWeeks = []
    try {
<<<<<<< HEAD
      seasonHtml = await fetchTextWithRetry(seasonUrl(endYear), { allowRedirect: false, encoding: 'utf-8-lenient' })
=======
      seasonHtml = await fetchTextWithRetry(seasonUrl(endYear), { allowRedirect: false })
>>>>>>> master
      if (seasonHtml == null) {
        counts.missing++
        console.warn(`  missing: ${season} has no season page`)
        continue
      }
      const { finalWeek, otherWeeks } = parseSeasonPage(seasonHtml, endYear)
      // The dropdown never lists training camp editions (2012-13 has one), so always try week -1.
      probedWeeks = finalWeek === -1 || otherWeeks.includes(-1) ? [] : [-1]
      weeks = [...probedWeeks, ...otherWeeks, finalWeek]
      console.log(`  ${weeks.length - probedWeeks.length} editions listed.`)
    } catch (err) {
      counts.failed++
      console.error(`  failed: ${String(err)}`)
      continue
    }

    const finalWeek = weeks[weeks.length - 1]
    for (const [i, espnWeek] of weeks.entries()) {
      const slug = editionSlug(season, espnWeek)
      console.log(`[${i + 1}/${weeks.length}] ${slug}`)
      const savedPath = path.join(outDir, editionFile(season, espnWeek))

      try {
        if (!force && existsSync(savedPath)) {
          index.push(indexEntry(JSON.parse(await readFile(savedPath, 'utf8'))))
          counts.skipped++
          continue
        }

        const url = editionUrl(endYear, espnWeek)
        let html = seasonHtml
        if (espnWeek !== finalWeek) {
          await sleep(delayMs)
<<<<<<< HEAD
          html = await fetchTextWithRetry(url, { allowRedirect: false, encoding: 'utf-8-lenient' })
=======
          html = await fetchTextWithRetry(url, { allowRedirect: false })
>>>>>>> master
        }
        if (html == null && probedWeeks.includes(espnWeek)) {
          continue
        }
<<<<<<< HEAD
        if (html == null && existsSync(savedPath)) {
          index.push(indexEntry(JSON.parse(await readFile(savedPath, 'utf8'))))
          counts.skipped++
          console.log(`  ${slug} is gone from ESPN, so the archived copy is kept`)
          continue
        }
=======
>>>>>>> master
        if (html == null) {
          counts.missing++
          console.warn(`  missing: ${slug} redirected, so ESPN never published it`)
          continue
        }

        const { edition, warnings } = parseEdition(html, { season, espnWeek, url })
        await saveEdition(outDir, edition, warnings)
        index.push(indexEntry(edition))
        counts.fetched++
      } catch (err) {
        counts.failed++
        console.error(`  failed: ${String(err)}`)
      }
    }

    if (endYear < toEndYear) {
      await sleep(delayMs)
    }
  }

  // An existing index may list seasons outside this run's range, so keep those entries.
  const indexPath = path.join(outDir, 'index.json')
  const ranSeasons = {}
  for (let endYear = fromEndYear; endYear <= toEndYear; endYear++) {
    ranSeasons[seasonLabel(endYear)] = true
  }
  const kept = existsSync(indexPath)
    ? JSON.parse(await readFile(indexPath, 'utf8')).filter((entry) => !ranSeasons[entry.season])
    : []
<<<<<<< HEAD
  await writeIndex(indexPath, [...kept, ...index])
=======
  const fullIndex = [...kept, ...index].sort(
    (a, b) => b.season.localeCompare(a.season) || b.espnWeek - a.espnWeek
  )
  await writeFile(indexPath, JSON.stringify(fullIndex, null, 2), 'utf8')
>>>>>>> master

  console.log(
    `\nDone. Fetched ${counts.fetched}, skipped (already saved) ${counts.skipped}, ` +
      `missing ${counts.missing}, failed ${counts.failed}. Index written to ${indexPath}.`
  )
}
