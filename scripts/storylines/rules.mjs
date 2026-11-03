// Pure checks for storyline candidates; see specs/007-season-storylines/contracts/validator-cli.md
const KINDS = ['team', 'playoffs', 'trade', 'season', 'draft']
const STATUSES = ['pending', 'included', 'excluded']
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/

// Returns the approved publisher name for a URL, or null
export function matchSource(url, sources) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return null
  }
  if (parsed.protocol !== 'https:') return null
  const host = parsed.hostname.toLowerCase()
  const path = parsed.pathname + parsed.search
  const publisher = sources.publishers.find((p) =>
    p.domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
  )
  if (!publisher) return null
  const excluded = [...sources.excludePaths, ...publisher.excludePaths]
  return excluded.some((part) => path.includes(part)) ? null : publisher.publisher
}

function addDays(isoDate, days) {
  const date = new Date(`${isoDate}T00:00:00Z`)
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

// A season runs from the day after its opening draft through the draft that follows its Finals
export function seasonWindow(season, draftDates) {
  const startYear = Number(season.slice(0, 4))
  const opening = draftDates[startYear]
  const closing = draftDates[startYear + 1]
  if (!opening || !closing) return undefined
  return { start: addDays(opening, 1), end: closing }
}

export function checkCandidate(candidate, ctx) {
  const label = candidate.id ?? '(no id)'
  const failures = []
  const fail = (message) => failures.push(`${label}: ${message}`)
  const window = seasonWindow(ctx.season, ctx.draftDates)
  const article = candidate.article ?? {}

  if (!ID.test(candidate.id ?? '')) fail('id must be kebab-case')
  if (!candidate.title) fail('missing title')
  if (!ISO_DATE.test(candidate.eventDate ?? '')) fail('eventDate must be YYYY-MM-DD')
  else if (!window) fail(`no draft dates for ${ctx.season}`)
  else if (candidate.eventDate < window.start || candidate.eventDate > window.end)
    fail(`eventDate ${candidate.eventDate} is outside ${window.start}..${window.end}`)
  if (!Array.isArray(candidate.teams)) fail('teams must be an array')
  else {
    for (const team of candidate.teams) if (!ctx.teams.includes(team)) fail(`unknown team ${team}`)
    if (!candidate.teams.length && !candidate.featured) fail('needs a team or featured: true')
  }
  if (typeof candidate.featured !== 'boolean') fail('featured must be true or false')
  if (!KINDS.includes(candidate.kind)) fail(`kind must be one of ${KINDS.join(', ')}`)
  if (candidate.blockbuster && candidate.kind !== 'trade') fail('only trades can be blockbusters')
  if (candidate.kind === 'trade' && candidate.blockbuster && !candidate.featured)
    fail('blockbuster trades must be featured')
  if (!STATUSES.includes(candidate.status)) fail(`status must be one of ${STATUSES.join(', ')}`)
  if (!candidate.guidance?.length) fail('needs at least one guidance id')
  for (const id of candidate.guidance ?? []) if (!ctx.guidanceIds.includes(id)) fail(`unknown guidance ${id}`)
  if (!article.headline) fail('missing article.headline')
  if (!ISO_DATE.test(article.publishedAt ?? '')) fail('article.publishedAt must be YYYY-MM-DD')
  const publisher = matchSource(article.url ?? '', ctx.sources)
  if (!publisher) fail(`article.url is not from an approved source: ${article.url}`)
  else if (article.publisher !== publisher) fail(`article.publisher should be ${publisher}`)
  return failures
}

export function checkRaw(raw, ctx) {
  const failures = []
  if (raw.season !== ctx.season) failures.push(`raw file is for ${raw.season}, not ${ctx.season}`)
  const guidanceIds = (raw.guidance ?? []).map((topic) => topic.id)
  const seenIds = {}
  const seenUrls = {}
  for (const candidate of raw.candidates ?? []) {
    failures.push(...checkCandidate(candidate, { ...ctx, guidanceIds }))
    if (seenIds[candidate.id]) failures.push(`${candidate.id}: duplicate id`)
    if (seenUrls[candidate.article?.url]) failures.push(`${candidate.id}: duplicate url ${candidate.article.url}`)
    seenIds[candidate.id] = true
    seenUrls[candidate.article?.url] = true
  }
  return failures
}

export function checkFinalize(raw, ctx) {
  const failures = checkRaw(raw, ctx)
  if (!ctx.completed) failures.push(`${ctx.season} has no champion yet`)
  const candidates = raw.candidates ?? []
  const pending = candidates.filter((c) => c.status === 'pending')
  if (pending.length) failures.push(`${pending.length} candidates are still pending review`)
  for (const team of ctx.playoffTeams) {
    const covered = candidates.some((c) => c.status === 'included' && c.kind === 'playoffs' && c.teams.includes(team))
    if (!covered) failures.push(`${team}: playoff team has no included playoff storyline`)
  }
  return failures
}

export function buildProcessed(raw, finalizedAt) {
  const storylines = (raw.candidates ?? [])
    .filter((c) => c.status === 'included')
    .map(({ id, title, eventDate, teams, featured, article }) => ({ id, title, eventDate, teams, featured, article }))
    .toSorted((a, b) => a.eventDate.localeCompare(b.eventDate))
  return { season: raw.season, finalizedAt, storylines }
}
