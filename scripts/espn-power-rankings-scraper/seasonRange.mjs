export const FIRST_SEASON = '2003-04'
export const LAST_SEASON = '2015-16'

const SUPPORTED = `ESPN's structured Power Rankings cover ${FIRST_SEASON} to ${LAST_SEASON}`

function toEndYear(season) {
  const match = /^(\d{4})-(\d{2})$/.exec(season ?? '')
  const startYear = match ? parseInt(match[1], 10) : NaN
  if (!match || parseInt(match[2], 10) !== (startYear + 1) % 100) {
    throw new Error(`"${season}" is not a season like 2007-08. ${SUPPORTED}.`)
  }
  return startYear + 1
}

/** Converts --from/--to seasons into ESPN's end years, rejecting anything outside the archive. */
export function parseSeasonRange(from = FIRST_SEASON, to = LAST_SEASON) {
  const fromEndYear = toEndYear(from)
  const toEndYearValue = toEndYear(to)
  const min = toEndYear(FIRST_SEASON)
  const max = toEndYear(LAST_SEASON)
  for (const [season, endYear] of [[from, fromEndYear], [to, toEndYearValue]]) {
    if (endYear < min || endYear > max) {
      throw new Error(`${season} is outside the archive. ${SUPPORTED}.`)
    }
  }
  if (fromEndYear > toEndYearValue) {
    throw new Error(`--from ${from} is after --to ${to}. ${SUPPORTED}.`)
  }
  return { fromEndYear, toEndYear: toEndYearValue }
}
