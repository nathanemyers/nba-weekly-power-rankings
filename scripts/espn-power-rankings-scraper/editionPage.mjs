import { htmlToText } from '../lib/htmlToText.mjs'
import { parseHeading } from './seasonPage.mjs'
import { resolveTeamId } from './teams.mjs'

const TEAM_LINK_RE = /href="(https?:\/\/www\.espn\.com\/nba\/team\/_\/name\/(\w+)\/[^"]*)"/

function editionType(espnWeek) {
  if (espnWeek === -1) return 'training-camp'
  if (espnWeek === 0) return 'preseason'
  return 'weekly'
}

export function editionSlug(season, espnWeek) {
  const type = editionType(espnWeek)
  return type === 'weekly' ? `${season}-week-${espnWeek}` : `${season}-${type}`
}

function firstMatch(re, text) {
  const match = re.exec(text)
  return match ? match[1].trim() : null
}

function parseTeamRow(rowHtml) {
  const cells = [...rowHtml.matchAll(/<td[^>]*>(.*?)<\/td>/gs)].map((m) => m[1])
  // Editions without a previous ranking (2012-13 training camp) drop the TRENDING column, so the comment is the last cell.
  const [rankCell, teamCell] = cells
  const commentCell = cells.length > 2 ? cells[cells.length - 1] : ''
  const nameBlock = firstMatch(/<div style="padding:10px 0;">(.*?)<br\s*\/?>/s, teamCell ?? '') ?? ''
  const link = TEAM_LINK_RE.exec(teamCell ?? '')
  const lastWeek = firstMatch(/Last Week:\s*(\d+)/, rowHtml)
  const summaryHtml = commentCell.trim()

  const espnAbbr = link ? link[2] : null
  const teamName = htmlToText(nameBlock)
  return {
    rank: parseInt(rankCell, 10),
    previousRank: lastWeek == null ? null : parseInt(lastWeek, 10),
    teamId: resolveTeamId({ espnAbbr, teamName }),
    teamName,
    espnAbbr,
    teamLink: link ? link[1] : null,
    record: firstMatch(/<span class="pr-record">([^<]*)<\/span>/, teamCell ?? '') ?? '',
    summaryHtml,
    summaryText: htmlToText(summaryHtml),
  }
}

/** Parses one ESPN Power Rankings page; season and week come from the caller, never the page's dates. */
export function parseEdition(html, { season, espnWeek, url }) {
  const slug = editionSlug(season, espnWeek)
  const tableStart = html.indexOf('<table class="tablehead"')
  const table = tableStart === -1 ? '' : html.slice(tableStart, html.indexOf('</table>', tableStart))

  const heading = parseHeading(table)
  if (!heading || !heading.startsWith(`${season} `)) {
    throw new Error(`${slug}: heading "${heading}" is not for season ${season}`)
  }

  const rankings = [...table.matchAll(/<tr class="(?:odd|even)row[^"]*">(.*?)<\/tr>/gs)]
    .map((m) => parseTeamRow(m[1]))
    .sort((a, b) => a.rank - b.rank)
  // ESPN occasionally printed a tie or skipped a rank (2005-06 week 18 has two No. 13s), so keep it as published and warn.
  const rankGaps = rankings
    .filter((entry, i) => entry.rank !== i + 1)
    .map((entry) => `rank ${entry.rank} for "${entry.teamName}" breaks the 1 to ${rankings.length} sequence in ${slug}`)

  const warnings = [
    ...(rankings.length === 0 ? [`no team rows in ${slug}, saved without rankings`] : []),
    ...rankGaps,
    ...rankings
      .filter((entry) => entry.teamId == null)
      .map((entry) => `unmatched team "${entry.teamName}" in ${slug}`),
    ...rankings
      .filter((entry) => entry.summaryText === '')
      .map((entry) => `empty comment for "${entry.teamName}" in ${slug}`),
  ]

  const type = editionType(espnWeek)
  return {
    edition: {
      slug,
      url,
      title: firstMatch(/<h1 class="h2">([^<]*)<\/h1>/, html),
      heading,
      author: firstMatch(/<cite class="source">\s*By\s*<a[^>]*>([^<]*)<\/a>/, html),
      updatedText: firstMatch(/<span>Updated:<\/span>([^<]*)</, html),
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
