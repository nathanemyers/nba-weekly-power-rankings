const BASE_URL = 'https://www.espn.com/nba/powerrankings/_/year'

/** ESPN names seasons by the year they end, so 2008 is the 2007-08 season. */
export function seasonLabel(endYear) {
  return `${endYear - 1}-${String(endYear % 100).padStart(2, '0')}`
}

export function seasonUrl(endYear) {
  return `${BASE_URL}/${endYear}`
}

export function editionUrl(endYear, espnWeek) {
  return `${BASE_URL}/${endYear}/week/${espnWeek}`
}

/** Reads the table heading, e.g. "2007-08 Power Rankings: Week 10". */
export function parseHeading(html) {
  const match = /<tr class="stathead"><td[^>]*>([^<]*)<\/td>/.exec(html)
  return match ? match[1].trim() : null
}

/** Turns a heading's edition label into ESPN's week number: -1 training camp, 0 preseason. */
export function weekFromHeading(heading) {
  if (/Training Camp/i.test(heading)) return -1
  if (/Preseason/i.test(heading)) return 0
  const match = /Week (\d+)/i.exec(heading)
  return match ? parseInt(match[1], 10) : null
}

/** A season's default page is its final edition, and its week dropdown lists every other edition. */
export function parseSeasonPage(html, endYear) {
  const heading = parseHeading(html)
  const finalWeek = heading == null ? null : weekFromHeading(heading)
  if (finalWeek == null) {
    throw new Error(`Could not read the final week of ${seasonLabel(endYear)} from its season page`)
  }

  const optionRe = new RegExp(`/powerrankings/_/year/${endYear}/week/(-?\\d+)"`, 'g')
  const seen = {}
  const otherWeeks = []
  for (const [, value] of html.matchAll(optionRe)) {
    const week = parseInt(value, 10)
    if (week !== finalWeek && !seen[week]) {
      seen[week] = true
      otherWeeks.push(week)
    }
  }
  otherWeeks.sort((a, b) => a - b)

  return { finalWeek, otherWeeks }
}
