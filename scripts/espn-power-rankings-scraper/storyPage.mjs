import { htmlToText } from '../lib/htmlToText.mjs'
import { editionSlug } from './editionPage.mjs'
import { resolveTeamId } from './teams.mjs'

// From 2016-17 ESPN publishes each edition as a story; the final one links every earlier edition.
export const FINAL_STORY_URLS = {
  2017: 'https://www.espn.com/nba/story/_/id/19119220/nba-power-rankings-marc-stein-week-25-rankings',
}

/** Reads ESPN's week number from a story URL: -1 training camp, 0 preseason. */
export function storyWeek(url) {
  if (/training-camp-edition/.test(url)) return -1
  if (/preseason-edition/.test(url)) return 0
  const match = /week-(\d+)-rankings/.exec(url)
  return match ? parseInt(match[1], 10) : null
}

/** Lists every edition of a season from its final story: the "Previous rankings" links plus the story itself. */
export function parseStoryIndex(html, finalUrl) {
  const previous = /Previous rankings:(.*?)<\/p>/s.exec(html)
  if (!previous) throw new Error(`No "Previous rankings" links in ${finalUrl}`)
  const editions = [...previous[1].matchAll(/href="([^"]+)"/g)].map(([, href]) => {
    const url = new URL(href, 'https://www.espn.com').href
    return { espnWeek: storyWeek(url), url }
  })
  editions.push({ espnWeek: storyWeek(finalUrl), url: finalUrl })
  const unknown = editions.filter((e) => e.espnWeek == null)
  if (unknown.length) throw new Error(`Could not read a week from ${unknown.map((e) => e.url).join(', ')}`)
  return editions.sort((a, b) => a.espnWeek - b.espnWeek)
}

function firstMatch(re, text) {
  const match = re.exec(text)
  return match ? match[1].trim() : null
}

// Each team block starts at its logo; the rank, name, record and previous rank share the paragraph holding "record:".
function parseTeamBlock(blockHtml, logoAbbr) {
  const recordAt = blockHtml.indexOf('record:')
  const headerStart = blockHtml.lastIndexOf('<p>', recordAt)
  const headerEnd = blockHtml.indexOf('</p>', recordAt) + '</p>'.length
  const header = htmlToText(blockHtml.slice(headerStart, headerEnd))
  const commentParagraphs = [...blockHtml.slice(headerEnd).matchAll(/<p>.*?<\/p>/gs)]
    .map((m) => m[0])
    .filter((p) => htmlToText(p) !== '')
  const summaryHtml = commentParagraphs.join('')

  const nameLine = /^(\d+)\.\s*(.+)$/m.exec(header)
  const teamName = nameLine ? nameLine[2].trim() : ''
  const link = /href="([^"]*\/nba\/team\/_\/name\/(\w+)\/[^"]*)"/.exec(blockHtml.slice(headerStart, headerEnd))
  const espnAbbr = link ? link[2] : logoAbbr
  const previousRank = firstMatch(/Previous ranking:\s*(\d+)/, header)
  return {
    rank: nameLine ? parseInt(nameLine[1], 10) : NaN,
    previousRank: previousRank == null ? null : parseInt(previousRank, 10),
    teamId: resolveTeamId({ espnAbbr, teamName }),
    teamName,
    espnAbbr,
    teamLink: link ? new URL(link[1], 'https://www.espn.com').href : null,
    record: firstMatch(/record:\s*(\d+-\d+)/, header) ?? '',
    summaryHtml,
    summaryText: htmlToText(summaryHtml),
  }
}

/** Parses one ESPN Power Rankings story into the same edition shape as the structured pages. */
export function parseStoryEdition(html, { season, espnWeek, url }) {
  const slug = editionSlug(season, espnWeek)
  const bodyStart = html.indexOf('class="article-body"')
  const bodyEnd = html.indexOf('<footer class="article-footer"', bodyStart)
  if (bodyStart === -1 || bodyEnd === -1) throw new Error(`${slug}: no article body`)
  const body = html.slice(bodyStart, bodyEnd)

  const logos = [...body.matchAll(/<img class="floatleft" src="[^"]*teamlogos\/nba\/500\/(\w+)\.png/g)]
  const rankings = logos
    .map((logo, i) => parseTeamBlock(body.slice(logo.index, logos[i + 1]?.index ?? body.length), logo[1]))
    .sort((a, b) => a.rank - b.rank)

  const warnings = [
    ...(rankings.length === 0 ? [`no team blocks in ${slug}, saved without rankings`] : []),
    ...rankings
      .filter((entry, i) => entry.rank !== i + 1)
      .map((entry) => `rank ${entry.rank} for "${entry.teamName}" breaks the 1 to ${rankings.length} sequence in ${slug}`),
    ...rankings.filter((entry) => entry.teamId == null).map((entry) => `unmatched team "${entry.teamName}" in ${slug}`),
    ...rankings.filter((entry) => entry.summaryText === '').map((entry) => `empty comment for "${entry.teamName}" in ${slug}`),
  ]

  const editionType = espnWeek === -1 ? 'training-camp' : espnWeek === 0 ? 'preseason' : 'weekly'
  return {
    edition: {
      slug,
      url,
      title: firstMatch(/<h1>([^<]*)<\/h1>/, html),
      heading: null,
      author: firstMatch(/<div class="author[^"]*">([^<]*)<span/, body),
      updatedText: firstMatch(/<span class="timestamp ">([^<]*)<\/span>/, body),
      season,
      espnWeek,
      week: editionType === 'weekly' ? espnWeek : null,
      editionType,
      hasStructuredRankings: rankings.length > 0,
      rankings,
    },
    warnings,
  }
}
