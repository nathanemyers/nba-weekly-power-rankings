import { htmlToText } from '../lib/htmlToText.mjs'
import { editionSlug } from './editionPage.mjs'
import { weekFromHeading } from './seasonPage.mjs'

// Team codes ESPN used in 2003-05 clubhouse links, mapped to NBA.com franchise ids.
const LEGACY_TEAM_IDS = {
  atl: 1610612737, bos: 1610612738, cha: 1610612766, chi: 1610612741,
  cle: 1610612739, dal: 1610612742, den: 1610612743, det: 1610612765,
  gsw: 1610612744, hou: 1610612745, ind: 1610612754, lac: 1610612746,
  lal: 1610612747, mem: 1610612763, mia: 1610612748, mil: 1610612749,
  min: 1610612750, njn: 1610612751, nor: 1610612740, nyk: 1610612752,
  orl: 1610612753, phi: 1610612755, pho: 1610612756, por: 1610612757,
  sac: 1610612758, sas: 1610612759, sea: 1610612760, tor: 1610612761,
  uth: 1610612762, was: 1610612764,
}

const HEADING_RE = /<b>((\d{4}) Power Rankings:[^<]*)<\/b>/

/** Reads the end year and ESPN week from an old heading like "2005 Power Rankings: Week 3". */
export function legacyHeadingWeek(heading) {
  const match = /^(\d{4}) Power Rankings:/.exec(heading)
  const espnWeek = match ? weekFromHeading(heading) : null
  return espnWeek == null ? null : { endYear: parseInt(match[1], 10), espnWeek }
}

export function parseLegacyHeading(html) {
  const match = HEADING_RE.exec(html)
  return match ? match[1].trim() : null
}

function cellText(cell) {
  return htmlToText(cell ?? '').trim()
}

/** Parses a 2003-05 ESPN Power Rankings page (as archived by the Wayback Machine) into the standard edition shape. */
export function parseLegacyEdition(html, { season, espnWeek, url, archiveUrl }) {
  const slug = editionSlug(season, espnWeek)
  const heading = parseLegacyHeading(html)
  const parsed = heading == null ? null : legacyHeadingWeek(heading)
  const endYear = parseInt(season.slice(0, 4), 10) + 1
  if (!parsed || parsed.endYear !== endYear || parsed.espnWeek !== espnWeek) {
    throw new Error(`${slug}: archived heading "${heading}" is for a different edition`)
  }

  const table = html.slice(html.indexOf(heading), html.indexOf('</table>', html.indexOf(heading)))
  const rows = [...table.matchAll(/<tr bgColor=#(?:ffffff|efefe7)>(.*?)<\/tr>/gis)].map((m) => m[1])
  const rankings = rows
    .map((rowHtml) => {
      const cells = [...rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((m) => m[1])
      const [, rankCell, teamCell, recordCell, commentCell] = cells
      const rank = /(\d+)(?:\s*\((\d+)\))?/.exec(cellText(rankCell))
      const link = /href="([^"]*\?team=(\w+))"/.exec(teamCell ?? '')
      const espnAbbr = link ? link[2] : null
      const summaryHtml = (commentCell ?? '').trim()
      return {
        rank: rank ? parseInt(rank[1], 10) : NaN,
        previousRank: rank && rank[2] ? parseInt(rank[2], 10) : null,
        teamId: LEGACY_TEAM_IDS[espnAbbr] ?? null,
        teamName: cellText(teamCell),
        espnAbbr,
        teamLink: link ? new URL(link[1], 'http://sports.espn.go.com').href : null,
        record: cellText(recordCell),
        summaryHtml,
        summaryText: htmlToText(summaryHtml),
      }
    })
    .sort((a, b) => a.rank - b.rank)

  const warnings = [
    ...(rankings.length === 0 ? [`no team rows in ${slug}, saved without rankings`] : []),
    ...rankings
      .filter((entry, i) => entry.rank !== i + 1)
      .map((entry) => `rank ${entry.rank} for "${entry.teamName}" breaks the 1 to ${rankings.length} sequence in ${slug}`),
    ...rankings
      .filter((entry) => entry.teamId == null)
      .map((entry) => `unmatched team "${entry.teamName}" in ${slug}`),
    ...rankings
      .filter((entry) => entry.summaryText === '')
      .map((entry) => `empty comment for "${entry.teamName}" in ${slug}`),
  ]

  const type = espnWeek === -1 ? 'training-camp' : espnWeek === 0 ? 'preseason' : 'weekly'
  return {
    edition: {
      slug,
      url,
      archiveUrl,
      title: null,
      heading,
      author: /Marc Stein/.test(html) ? 'Marc Stein' : null,
      updatedText: null,
      season,
      espnWeek,
      week: type === 'weekly' ? espnWeek : null,
      editionType: type,
      hasStructuredRankings: rankings.length > 0,
      rankings,
    },
    warnings,
  }
}
