import { fetchTextWithRetry } from '../lib/http.mjs'
import { htmlToText } from '../lib/htmlToText.mjs'
import { TEAM_SLUGS } from '../lib/articles.mjs'

const WEEKLY_SLUG_RE = /^power-rankings-\d{4}-\d{2}-week-\d+$/
const TEAM_HEADER_RE = /<h4>#(\d+)([\s\S]*?)<\/h4>/g

const NEXT_DATA_RE =
  /<script id="__NEXT_DATA__" type="application\/json">(.*?)<\/script>/s

function extractNextData(html) {
  const match = NEXT_DATA_RE.exec(html)
  if (!match) {
    throw new Error('Could not find __NEXT_DATA__ script tag in article page')
  }
  return JSON.parse(match[1])
}

function deriveSeason(slug, publishedAt) {
  const inSlug = /(\d{4})-(\d{2})(?!\d)/.exec(slug)
  if (inSlug) {
    return `${inSlug[1]}-${inSlug[2]}`
  }

  // Pre-2017 slugs lack the season, so use the publish date, counting August onward as the next season.
  const publishedDate = new Date(publishedAt)
  if (Number.isNaN(publishedDate.getTime())) {
    return null
  }
  const year = publishedDate.getUTCFullYear()
  const month = publishedDate.getUTCMonth() + 1
  const startYear = month >= 8 ? year : year - 1
  return `${startYear}-${String((startYear + 1) % 100).padStart(2, '0')}`
}

function deriveWeek(slug, title) {
  const match = /week-(\d+)/i.exec(slug) ?? /week\s+(\d+)/i.exec(title)
  return match ? parseInt(match[1], 10) : null
}

/** Fetches one Power Rankings article page and parses it into our normalized shape. */
export async function fetchPowerRankingsArticle(url) {
  const html = await fetchTextWithRetry(url)
  const nextData = extractNextData(html)
  const raw = nextData.props?.pageProps?.article
  if (!raw) {
    throw new Error(`Article data missing from __NEXT_DATA__ for ${url}`)
  }
  return parsePowerRankingsArticle(raw, url)
}

// Some weekly articles (e.g. 2026-27 Week 1) only carry the rankings as <h4>#N team</h4> sections in the HTML.
function parseHtmlRankings(html) {
  const headers = [...html.matchAll(TEAM_HEADER_RE)]
  return headers.map((match, i) => {
    const header = match[2]
    const link = /<a href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/.exec(header)
    const end = i + 1 < headers.length ? headers[i + 1].index : html.length
    const summaryHtml = html.slice(match.index + match[0].length, end).trim()
    return {
      rank: parseInt(match[1], 10),
      previousRank: null,
      teamId: Number(/\/logos\/nba\/(\d+)\//.exec(header)?.[1]),
      teamName: link ? htmlToText(link[2]) : null,
      teamLink: link?.[1] ?? null,
      summaryHtml,
      summaryText: htmlToText(summaryHtml),
    }
  })
}

/** Parses an article object from a page's __NEXT_DATA__ into our normalized shape. */
export function parsePowerRankingsArticle(raw, url) {
  const structured = (raw.powerRankings ?? [])
    .map((entry) => ({
      rank: entry.currentWeekRank,
      previousRank: entry.lastWeekRank ?? null,
      teamId: entry.teamId,
      teamName: entry.teamName,
      teamLink: entry.teamLink ?? null,
      summaryHtml: entry.powerRankSummary,
      summaryText: htmlToText(entry.powerRankSummary),
    }))
  const rankings = (
    structured.length === 0 && WEEKLY_SLUG_RE.test(raw.slug)
      ? parseHtmlRankings(raw.contentFiltered ?? '')
      : structured
  ).sort((a, b) => a.rank - b.rank)

  const hasStructuredRankings = rankings.length > 0

  return {
    id: raw.id,
    slug: raw.slug,
    url: raw.permalink || url,
    title: raw.title,
    shortTitle: raw.shortTitle ?? null,
    excerpt: raw.excerpt,
    author: raw.author?.name ?? null,
    publishedAt: raw.date,
    modifiedAt: raw.modified,
    season: deriveSeason(raw.slug, raw.date),
    week: deriveWeek(raw.slug, raw.title),
    hasStructuredRankings,
    rankings,
    rawText: hasStructuredRankings
      ? null
      : htmlToText(raw.contentFiltered || raw.contentText || ''),
  }
}

/** Throws unless a numbered weekly article from 2017-18 onward ranks all 30 teams exactly once. */
export function validateWeeklyRankings(article) {
  if (!WEEKLY_SLUG_RE.test(article.slug) || article.publishedAt < '2017-08-01') return
  const ids = article.rankings.map((entry) => entry.teamId)
  const ranks = article.rankings.map((entry) => entry.rank).sort((a, b) => a - b)
  const problem =
    ids.length !== 30
      ? `${ids.length} teams`
      : ids.some((id) => !TEAM_SLUGS[id])
        ? 'an unknown team id'
        : ids.some((id, i) => ids.indexOf(id) !== i)
          ? 'a duplicated team'
          : ranks.some((rank, i) => rank !== i + 1)
            ? 'ranks other than 1-30'
            : null
  if (problem) throw new Error(`${article.slug} has ${problem}, expected all 30 teams ranked 1-30`)
}
