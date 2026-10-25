import { fetchTextWithRetry } from './http.mjs'
import { htmlToText } from './htmlToText.mjs'

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

  const rankings = (raw.powerRankings ?? [])
    .map((entry) => ({
      rank: entry.currentWeekRank,
      previousRank: entry.lastWeekRank ?? null,
      teamId: entry.teamId,
      teamName: entry.teamName,
      teamLink: entry.teamLink ?? null,
      summaryHtml: entry.powerRankSummary,
      summaryText: htmlToText(entry.powerRankSummary),
    }))
    .sort((a, b) => a.rank - b.rank)

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
